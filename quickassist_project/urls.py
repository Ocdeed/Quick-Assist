
from django.contrib import admin 
from django.urls import path, include 
from django.conf import settings

from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView 

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # All our API app's URLs
    path('api/', include('api.urls')),
    
    # --- API Schema & Documentation ---
    # Serves the raw OpenAPI schema file
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    
    # Serves the Swagger UI, an interactive documentation page
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    
    # (Optional) Serves an alternative documentation UI called ReDoc
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# Debug Toolbar URLs (only in development)
if settings.DEBUG:
    urlpatterns += [
        path('__debug__/', include('debug_toolbar.urls')),
    ]