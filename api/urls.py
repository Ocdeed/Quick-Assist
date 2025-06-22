from django.urls import path, include 
from .views import ServiceCategoryListView, UserRegisterView, UserProfileView, ProviderStatusView, ProviderLocationView, BookingViewSet, ProviderProfileViewSet, MpesaCallbackView
from rest_framework.routers import DefaultRouter 

# Import the pre-built views from simplejwt
from rest_framework_simplejwt.views  import (  
    TokenObtainPairView,
    TokenRefreshView,
) 

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'bookings', BookingViewSet, basename='booking') 
router.register(r'providers', ProviderProfileViewSet, basename='provider-profile')

urlpatterns = [
    # Router URLs
    path('', include(router.urls)), # The router generates /bookings/ and /bookings/{id}/
    
    # Auth Endpoints
    path('auth/register/', UserRegisterView.as_view(), name='user-register'),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'), # Login
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User Endpoints
    path('users/me/', UserProfileView.as_view(), name='user-profile'),
    
    # Provider Endpoints
    path('provider/status/', ProviderStatusView.as_view(), name='provider-status'),
    path('provider/location/', ProviderLocationView.as_view(), name='provider-location'),

    # Other endpoints( Public Service Endpoints)
    path('services/', ServiceCategoryListView.as_view(), name='service-category-list'),
]

urlpatterns += [
    path('payments/callback/', MpesaCallbackView.as_view(), name='mpesa-callback'),
]