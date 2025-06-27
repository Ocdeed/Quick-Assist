from django.urls import path, include 
from .views import (
    ServiceCategoryListView, UserRegisterView, UserProfileView, 
    ProviderStatusView, ProviderLocationView, BookingViewSet, 
    ProviderProfileViewSet, MpesaCallbackView, AdminStatsView, AdminUserViewSet,
    AdminRecentBookingsView, CurrentProviderProfileView, ServiceListView, CustomTokenObtainPairView,
    ServiceCategoryViewSet, ServiceViewSet
)
from rest_framework.routers import DefaultRouter 

# Import the pre-built views from simplejwt
from rest_framework_simplejwt.views  import (  
    TokenRefreshView,
) 

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'bookings', BookingViewSet, basename='booking') 
router.register(r'providers', ProviderProfileViewSet, basename='provider-profile')
router.register(r'admin/users', AdminUserViewSet, basename='admin-users')
router.register(r'admin/categories', ServiceCategoryViewSet, basename='admin-categories')
router.register(r'admin/services', ServiceViewSet, basename='admin-services')

urlpatterns = [
    # Router URLs
    path('', include(router.urls)), # The router generates /bookings/ and /bookings/{id}/
    
    # Auth Endpoints
    path('auth/register/', UserRegisterView.as_view(), name='user-register'),
    path('auth/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'), # Login
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User Endpoints
    path('users/me/', UserProfileView.as_view(), name='user-profile'),
    path('users/provider/profile/', CurrentProviderProfileView.as_view(), name='current-provider-profile'),
    
    # Provider Endpoints
    path('provider/status/', ProviderStatusView.as_view(), name='provider-status'),
    path('provider/location/', ProviderLocationView.as_view(), name='provider-location'),

    # Service Endpoints
    path('categories/', ServiceCategoryListView.as_view(), name='service-category-list'),
    path('services/', ServiceListView.as_view(), name='service-list'),
    
    # Admin Endpoints
    path('admin/stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('admin/recent-bookings/', AdminRecentBookingsView.as_view(), name='admin-recent-bookings'),
]

urlpatterns += [
    path('payments/callback/', MpesaCallbackView.as_view(), name='mpesa-callback'),
]