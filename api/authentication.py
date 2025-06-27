# In api/authentication.py
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()

class AllowInactiveUserBackend(ModelBackend):
    """
    Custom authentication backend that allows both active and inactive users to authenticate.
    This enables suspended providers to log in and see their suspended account page.
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get(User.USERNAME_FIELD)
        if username is None or password is None:
            return
        try:
            user = User._default_manager.get_by_natural_key(username)
        except User.DoesNotExist:
            # Run the default password hasher once to reduce the timing
            # difference between an existing and a nonexistent user (#20760).
            User().set_password(password)
        else:
            if user.check_password(password):
                # Return user regardless of is_active status
                return user
