from rest_framework import permissions 


class IsProviderUser(permissions.BasePermission):
    """
    Custom permission to only allow users with the 'PROVIDER' user_type.
    """
    def has_permission(self, request, view):
        # Check if the user is authenticated and if their user_type is 'PROVIDER'.
        return request.user and request.user.is_authenticated and request.user.user_type == 'PROVIDER'
    
class IsCustomerUser(permissions.BasePermission):
    """
    Custom permission to only allow users with the 'CUSTOMER' user_type.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.user_type == 'CUSTOMER'
    
class IsProfileOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of a profile to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Write permissions are only allowed to the owner of the profile.
        # `obj` here is the ServiceProviderProfile instance.
        return obj.user == request.user
    
class IsAdminUser(permissions.BasePermission):
    """
    Custom permission to only allow users with the 'ADMIN' user_type.
    """
    def has_permission(self, request, view):
        # Check if the user is authenticated and if their user_type is 'ADMIN'.
        return request.user and request.user.is_authenticated and request.user.user_type == 'ADMIN'