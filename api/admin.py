from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, ServiceProviderProfile, ServiceCategory, Service, Booking, Rating, Payment, ChatMessage

# This is the custom admin configuration for our Custom User Model
class CustomUserAdmin(UserAdmin):
    # This controls what columns are shown in the user list view
    list_display = ('username', 'email', 'user_type', 'is_staff', 'is_active')
    
    # This adds filters to the right-hand sidebar
    list_filter = ('is_staff', 'is_active', 'user_type')
    
    # This organizes the fields on the user detail/edit page, including our custom fields
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email', 'phone_number')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Roles and Profile', {'fields': ('user_type',)}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

# --- Registration ---

# First, register our custom User model with its custom admin class
admin.site.register(User, CustomUserAdmin)

# Now, register all other models with the default admin interface
admin.site.register(ServiceProviderProfile)
admin.site.register(ServiceCategory)
admin.site.register(Service)
admin.site.register(Booking)
admin.site.register(Rating)
admin.site.register(Payment)
admin.site.register(ChatMessage)