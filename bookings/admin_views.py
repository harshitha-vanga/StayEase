
from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.models import User
from django.db.models import Sum
from django.views.decorators.http import require_POST
from django.contrib import messages

from .models import Hotel, Booking


@staff_member_required
def admin_dashboard(request):

    total_hotels = Hotel.objects.count()

    total_bookings = Booking.objects.count()

    confirmed_bookings = Booking.objects.filter(
        status='Confirmed'
    ).count()

    cancelled_bookings = Booking.objects.filter(
        status='Cancelled'
    ).count()

    total_users = User.objects.count()

    total_revenue = Booking.objects.filter(
        status='Confirmed'
    ).aggregate(total=Sum('total_price'))['total'] or 0

    recent_bookings = Booking.objects.select_related(
        'hotel'
    ).order_by('-booking_date')[:10]

    context = {
        'total_hotels': total_hotels,
        'total_bookings': total_bookings,
        'confirmed_bookings': confirmed_bookings,
        'cancelled_bookings': cancelled_bookings,
        'total_users': total_users,
        'total_revenue': total_revenue,
        'recent_bookings': recent_bookings,
    }

    return render(
        request,
        'admin_dashboard.html',
        context
    )


@staff_member_required
@require_POST
def update_booking_status(request, booking_id):

    booking = get_object_or_404(Booking, id=booking_id)

    new_status = request.POST.get('status')

    if new_status not in ['Confirmed', 'Cancelled']:
        messages.error(request, 'Invalid booking status.')
        return redirect('admin_dashboard')

    booking.status = new_status
    booking.save(update_fields=['status'])

    messages.success(
        request,
        f'Booking #{booking.id} updated to {new_status}.'
    )

    return redirect('admin_dashboard')
