import uuid
from django.db import models 
from django.db import models 
from django.contrib.auth.models import AbstractUser 
from django.db.models.signals import post_save 
from django.dispatch import receiver 

# --- Core User Model ---
class User(AbstractUser):
    USER_TYPE_CHOICES = (
        ('CUSTOMER', 'Customer'),
        ('PROVIDER', 'Provider'),
    )
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='CUSTOMER')
    phone_number = models.CharField(max_length=20, unique=True, null=True, blank=True)
    # Note: username, password, email, first_name, last_name are already in AbstractUser

    def __str__(self):
        return self.username

# --- Service Provider Specific Data ---
class ServiceProviderProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, related_name='provider_profile')
    bio = models.TextField(blank=True)
    is_verified = models.BooleanField(default=False)
    on_duty = models.BooleanField(default=False)
    
    # --- Geolocation without PostGIS ---
    last_known_latitude = models.FloatField(null=True, blank=True)
    last_known_longitude = models.FloatField(null=True, blank=True)
    
    average_rating = models.FloatField(default=0.0)

    def __str__(self):
        return f"Profile: {self.user.username}"

# --- Service Catalog ---
class ServiceCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    icon_name = models.CharField(max_length=50, blank=True) # For UI

    def __str__(self):
        return self.name

class Service(models.Model):
    category = models.ForeignKey(ServiceCategory, on_delete=models.CASCADE, related_name='services')
    name = models.CharField(max_length=100)
    description = models.TextField()
    estimated_base_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return self.name

# This Many-to-Many through table is optional for a start, but good practice.
# For now, let's assume a provider can do any service to simplify the MVP.
# We can add this later if needed.

# --- Booking and Transactional Models ---
class Booking(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='customer_bookings')
    provider = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='provider_bookings')
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # --- Geolocation without PostGIS ---
    booking_latitude = models.FloatField()
    booking_longitude = models.FloatField()
    
    final_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Booking {self.id} by {self.customer.username}"

class Rating(models.Model):
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='rating')
    rater = models.ForeignKey(User, on_delete=models.CASCADE, related_name='given_ratings')
    ratee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_ratings')
    score = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Rating {self.score}/5 for {self.ratee.username}"
    
@receiver(post_save, sender=User)
def create_provider_profile(sender, instance, created, **kwargs):
    if created and instance.user_type == 'PROVIDER':
        ServiceProviderProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_provider_profile(sender, instance, **kwargs):
    if instance.user_type == 'PROVIDER':
        # This handles saving the profile whenever the user object is saved
        # in case you have logic that depends on it.
        # For our current setup, the first signal is the most critical one.
        instance.provider_profile.save()


class Payment(models.Model):
    PAYMENT_METHOD_CHOICES = (
        ('CASH', 'Cash'),
        ('M-PESA', 'M-Pesa'),
        ('TIGO-PESA', 'Tigo-Pesa'), # We can add more later
    )
    PAYMENT_STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='PENDING')
    
    # This will store the ID from M-Pesa (e.g., CheckoutRequestID or transaction ID)
    external_transaction_id = models.CharField(max_length=100, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment {self.id} for Booking {self.booking.id} - {self.status}"
    
# In api/models.py
class ChatMessage(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Message from {self.sender} on {self.timestamp.strftime("%Y-%m-%d %H:%M")}'

    class Meta:
        ordering = ['timestamp']