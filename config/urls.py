
from django.contrib import admin
from django.urls import path, include
from bookings import admin_views

urlpatterns = [
    path('admin/', admin.site.urls),

    path(
        'admin-dashboard/',
        admin_views.admin_dashboard,
        name='admin_dashboard'
    ),

    path(
        'admin-dashboard/update-booking/<int:booking_id>/',
        admin_views.update_booking_status,
        name='update_booking_status'
    ),

    path('', include('bookings.urls')),
]
