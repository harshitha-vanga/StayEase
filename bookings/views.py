
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.utils.dateparse import parse_date
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
from datetime import date

from .models import Hotel, Booking


# HOME PAGE
def home(request):
    hotels = Hotel.objects.all()
    return render(request, 'index.html', {'hotels': hotels})


# CREATE HOTEL BOOKING WITH ROOM AVAILABILITY CHECK
@require_POST
def create_booking(request):
    try:
        hotel_id = request.POST.get('hotel_id')
        customer_name = request.POST.get('customer_name', '').strip()
        phone = request.POST.get('phone', '').strip()
        check_in = parse_date(request.POST.get('check_in', ''))
        check_out = parse_date(request.POST.get('check_out', ''))
        guests = int(request.POST.get('guests', 0))

        if not customer_name or not phone.isdigit() or len(phone) != 10:
            return JsonResponse({
                'error': 'Enter a valid name and 10-digit phone number.'
            }, status=400)

        if not check_in or not check_out:
            return JsonResponse({
                'error': 'Please select valid booking dates.'
            }, status=400)

        if check_in < date.today() or check_out <= check_in:
            return JsonResponse({
                'error': 'Please enter valid booking dates.'
            }, status=400)

        with transaction.atomic():

            hotel = Hotel.objects.select_for_update().get(id=hotel_id)

            if guests < 1 or guests > hotel.max_guests:
                return JsonResponse({
                    'error': 'Invalid number of guests.'
                }, status=400)

            overlapping_bookings = Booking.objects.filter(
                hotel=hotel,
                status='Confirmed',
                check_in__lt=check_out,
                check_out__gt=check_in
            ).count()

            if overlapping_bookings >= hotel.total_rooms:
                return JsonResponse({
                    'error': 'Sorry! No rooms are available for these dates. Please choose different dates.'
                }, status=409)

            nights = (check_out - check_in).days
            total_price = hotel.price_per_night * nights

            booking = Booking.objects.create(
                user=request.user if request.user.is_authenticated else None,
                hotel=hotel,
                customer_name=customer_name,
                phone=phone,
                check_in=check_in,
                check_out=check_out,
                guests=guests,
                total_price=total_price
            )

        # SEND TEST BOOKING EMAIL
        if request.user.is_authenticated and request.user.email:
            email_subject = f'StayEase Booking Confirmation - #{booking.id}'

            email_message = f"""
Hello {customer_name},

Your StayEase booking has been confirmed!

Booking ID: {booking.id}
Hotel: {hotel.name}
City: {hotel.city}
Check-in: {check_in}
Check-out: {check_out}
Guests: {guests}
Total Amount: Rs. {total_price}
Booking Status: {booking.status}

Thank you for choosing StayEase!

Visit StayEase to view your booking:
{request.build_absolute_uri('/my-bookings/')}

Regards,
StayEase Team
"""

            send_mail(
                email_subject,
                email_message,
                settings.DEFAULT_FROM_EMAIL,
                [request.user.email],
                fail_silently=True
            )

        return JsonResponse({
            'message': 'Booking confirmed successfully!',
            'booking_id': booking.id,
            'total_price': str(total_price),
            'confirmation_url': f'/booking-confirmation/{booking.id}/'
        })

    except Hotel.DoesNotExist:
        return JsonResponse({
            'error': 'Hotel not found.'
        }, status=404)

    except (ValueError, TypeError):
        return JsonResponse({
            'error': 'Please check your booking details.'
        }, status=400)


# BOOKING CONFIRMATION PAGE
@login_required(login_url='login')
def booking_confirmation(request, booking_id):
    booking = get_object_or_404(
        Booking.objects.select_related('hotel'),
        id=booking_id,
        user=request.user
    )

    return render(request, 'booking_confirmation.html', {
        'booking': booking
    })


# USER REGISTRATION
def register(request):
    if request.user.is_authenticated:
        return redirect('home')

    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        email = request.POST.get("email", "").strip()
        password = request.POST.get("password", "")
        confirm_password = request.POST.get("confirm_password", "")

        if not username or not email or not password:
            return render(request, "register.html", {
                "error": "Please fill all fields."
            })

        if password != confirm_password:
            return render(request, "register.html", {
                "error": "Passwords do not match."
            })

        if User.objects.filter(username=username).exists():
            return render(request, "register.html", {
                "error": "Username already exists."
            })

        User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        return redirect("login")

    return render(request, "register.html")


# USER LOGIN
def user_login(request):
    if request.user.is_authenticated:
        return redirect('home')

    if request.method == "POST":
        username = request.POST.get("username", "")
        password = request.POST.get("password", "")

        user = authenticate(
            request,
            username=username,
            password=password
        )

        if user is not None:
            login(request, user)
            return redirect("home")

        return render(request, "login.html", {
            "error": "Invalid username or password."
        })

    return render(request, "login.html")


# USER LOGOUT
def user_logout(request):
    logout(request)
    return redirect("home")


# MY BOOKINGS
@login_required(login_url='login')
def my_bookings(request):
    bookings = Booking.objects.filter(
        user=request.user
    ).select_related('hotel').order_by('-booking_date')

    return render(request, 'my_bookings.html', {
        'bookings': bookings,
        'today': date.today()
    })


# CANCEL BOOKING
@login_required(login_url='login')
@require_POST
def cancel_booking(request, booking_id):
    booking = get_object_or_404(
        Booking,
        id=booking_id,
        user=request.user
    )

    if booking.status != "Confirmed":
        return redirect("my_bookings")

    if booking.check_in < date.today():
        return redirect("my_bookings")

    booking.status = "Cancelled"
    booking.save(update_fields=["status"])

    return redirect("my_bookings")
