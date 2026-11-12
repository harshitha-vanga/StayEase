from django.contrib import admin
from .models import Hotel, Booking


@admin.register(Hotel)
class HotelAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'name',
        'city',
        'price_per_night',
        'max_guests',
        'total_rooms',
    )

    search_fields = ('name', 'city')
    list_filter = ('city',)


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'customer_name',
        'hotel',
        'phone',
        'check_in',
        'check_out',
        'guests',
        'total_price',
        'status',
    )

    search_fields = (
        'customer_name',
        'phone',
        'hotel__name',
    )

    list_filter = (
        'status',
        'check_in',
        'booking_date',
    )

    ordering = ('-booking_date',)
    date_hierarchy = 'booking_date'