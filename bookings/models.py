
from django.db import models
from django.contrib.auth.models import User


class Hotel(models.Model):
    name = models.CharField(max_length=200)
    city = models.CharField(max_length=100)
    description = models.TextField()
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    image_url = models.URLField()
    max_guests = models.PositiveIntegerField()

    # Total rooms available in this hotel
    total_rooms = models.PositiveIntegerField(default=10)

    def __str__(self):
        return self.name


class Booking(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE)
    customer_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    check_in = models.DateField()
    check_out = models.DateField()
    guests = models.PositiveIntegerField()
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    booking_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default="Confirmed")

    def __str__(self):
        return f"{self.customer_name} - {self.hotel.name}"
