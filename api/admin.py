# api/admin.py
from django.contrib import admin 
from .models import User, ServiceProviderProfile, ServiceCategory, Service, Booking, Rating, Payment

admin.site.register(User)
admin.site.register(ServiceProviderProfile)
admin.site.register(ServiceCategory)
admin.site.register(Service)
admin.site.register(Booking)
admin.site.register(Rating)
admin.site.register(Payment)