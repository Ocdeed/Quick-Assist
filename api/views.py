from .permissions import IsProviderUser, IsCustomerUser, IsProfileOwner, IsAdminUser
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from .models import ServiceCategory, User, Booking, Rating, ServiceProviderProfile, Payment, Service
from .serializers import ServiceCategorySerializer, UserRegisterSerializer, UserProfileSerializer, ProviderStatusSerializer, ProviderLocationSerializer, BookingSerializer, RatingSerializer, ProviderProfileSerializer, AdminUserSerializer, ServiceSerializer, CustomTokenObtainPairSerializer, AdminServiceCategorySerializer, AdminServiceSerializer
from rest_framework import status, viewsets
from rest_framework.views import APIView  
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q, Avg, Count
from django.utils import timezone
from .mpesa_service import initiate_stk_push
from rest_framework_simplejwt.views import TokenObtainPairView

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom token view that allows suspended users to log in.
    """
    serializer_class = CustomTokenObtainPairSerializer

# We'll use ListAPIView for a read-only endpoint that lists all items.
class ServiceCategoryListView(generics.ListAPIView):
    """
    API endpoint that lists all service categories along with the services under them.
    """
    queryset = ServiceCategory.objects.prefetch_related('services').all()
    serializer_class = ServiceCategorySerializer
    permission_classes = [permissions.IsAuthenticated]  # Require authentication 
    
class UserRegisterView(generics.CreateAPIView):
    """
    API endpoint for user registration. Anyone can register.
    """
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny] # No authentication required
    serializer_class = UserRegisterSerializer
    
class UserProfileView(APIView):
    """
    API endpoint to get the profile of the currently logged-in user.
    """
    permission_classes = [permissions.IsAuthenticated] # CRITICAL: This view requires a valid token

    def get(self, request, format=None):
        # Optimize: use select_related to fetch provider_profile in a single query
        user = User.objects.select_related('provider_profile').get(pk=request.user.pk)
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)
    
# --- Provider-Specific Views ---

class ProviderStatusView(APIView):
    """
    API endpoint for a provider to update their on_duty status.
    """
    permission_classes = [permissions.IsAuthenticated, IsProviderUser] # Must be logged in AND a provider

    def patch(self, request, *args, **kwargs):
        provider_profile = request.user.provider_profile
        
        # Check if provider is trying to go on duty
        requested_on_duty = request.data.get('is_on_duty', False)
        
        # Enforce admin approval gate: Only verified providers can go on duty
        if requested_on_duty and not provider_profile.is_verified:
            raise PermissionDenied("Your account must be approved by an administrator before you can go on duty.")
        
        serializer = ProviderStatusSerializer(instance=provider_profile, data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProviderLocationView(APIView):
    """
    API endpoint for a provider to update their last known location.
    """
    permission_classes = [permissions.IsAuthenticated, IsProviderUser]

    def post(self, request, *args, **kwargs):
        # Using post since this action is creating/updating a location 'record'
        provider_profile = request.user.provider_profile
        serializer = ProviderLocationSerializer(instance=provider_profile, data=request.data)

        if serializer.is_valid():
            serializer.save()
            # 204 No Content is suitable for a successful update with no body to return
            return Response(status=status.HTTP_204_NO_CONTENT)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class BookingViewSet(viewsets.ModelViewSet):
    """
    API endpoint for creating, listing, and retrieving bookings.
    - POST /api/bookings/ (for customers to create)
    - GET /api/bookings/ (for customers and providers to list their bookings)
    - GET /api/bookings/{id}/ (for retrieving a specific booking)
    """
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        This view should return a list of all the bookings
        for the currently authenticated user.
        Customers see bookings they created.
        Providers see bookings they were assigned.
        """
        user = self.request.user
        if user.user_type == 'CUSTOMER':
            return Booking.objects.filter(customer=user).select_related(
                'customer', 'provider', 'service', 'service__category'
            ).prefetch_related(
                'provider__provider_profile'
            ).order_by('-created_at')
        elif user.user_type == 'PROVIDER':
            return Booking.objects.filter(provider=user).select_related(
                'customer', 'provider', 'service', 'service__category'
            ).prefetch_related(
                'provider__provider_profile'
            ).order_by('-created_at')
        return Booking.objects.none() # Should not happen if user_type is enforced

    def perform_create(self, serializer):
        # When creating a booking, we pass the request context to the serializer
        # so it can access the logged-in user.
        serializer.save(customer=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsProviderUser])
    def accept_booking(self, request, pk=None):
        """
        Action for a provider to accept a pending booking.
        URL: POST /api/bookings/{id}/accept/
        """
        booking = self.get_object()

        # Check if the current user is the assigned provider
        if booking.provider != request.user:
            return Response({'error': 'You are not authorized to accept this booking.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Check if the booking is in the correct state
        if booking.status != 'PENDING':
            return Response({'error': f'Cannot accept a booking with status {booking.status}.'}, status=status.HTTP_400_BAD_REQUEST)
            
        booking.status = 'ACCEPTED'
        booking.accepted_at = timezone.now()
        booking.save()
        
        serializer = self.get_serializer(booking)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsProviderUser])
    def decline_booking(self, request, pk=None):
        """
        Action for a provider to decline a pending booking.
        URL: POST /api/bookings/{id}/decline/
        """
        booking = self.get_object()

        # Check if the current user is the assigned provider
        if booking.provider != request.user:
            return Response({'error': 'You are not authorized to decline this booking.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Check if the booking is in the correct state
        if booking.status != 'PENDING':
            return Response({'error': f'Cannot decline a booking with status {booking.status}.'}, status=status.HTTP_400_BAD_REQUEST)
            
        booking.status = 'REJECTED'
        booking.save()
        
        serializer = self.get_serializer(booking)
        return Response(serializer.data)
        
    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated, IsProviderUser])
    def start_job(self, request, pk=None):
        """
        Action for a provider to mark the job as 'IN_PROGRESS'.
        """
        booking = self.get_object() # This gets the specific booking by its ID (pk)

        # Check if the current user is the assigned provider
        if booking.provider != request.user:
            return Response({'error': 'You are not authorized to start this job.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Check if the booking is in the correct state
        if booking.status != 'ACCEPTED':
            return Response({'error': f'Cannot start a job with status {booking.status}.'}, status=status.HTTP_400_BAD_REQUEST)
            
        booking.status = 'IN_PROGRESS'
        booking.save()
        
        serializer = self.get_serializer(booking)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated, IsProviderUser])
    def complete_job(self, request, pk=None):
        """
        Action for a provider to mark the job as 'COMPLETED'.
        """
        booking = self.get_object() # This gets the specific booking

        # Authorization and state checks
        if booking.provider != request.user:
            return Response({'error': 'You are not authorized to complete this job.'}, status=status.HTTP_403_FORBIDDEN)

        if booking.status != 'IN_PROGRESS':
            return Response({'error': f'Cannot complete a job with status {booking.status}.'}, status=status.HTTP_400_BAD_REQUEST)

        booking.status = 'COMPLETED'
        booking.completed_at = timezone.now() # Record the completion time
        booking.save()

        # TODO: Trigger the payment flow or notify customer to pay/rate
        print(f"Booking {booking.id} completed. Ready for payment and rating.")
        
        serializer = self.get_serializer(booking)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsCustomerUser])
    def rate_job(self, request, pk=None):
        """
        Action for a customer to rate a completed job.
        """
        booking = self.get_object()
        
        # --- VALIDATION ---
        # 1. Check if the user is the customer for this booking
        if booking.customer != request.user:
            return Response({'error': 'You are not authorized to rate this job.'}, status=status.HTTP_403_FORBIDDEN)
        
        # 2. Check if the job is completed
        if booking.status != 'COMPLETED':
            return Response({'error': 'You can only rate completed jobs.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # 3. Check if the job has already been rated
        if hasattr(booking, 'rating'):
            return Response({'error': 'This job has already been rated.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # --- LOGIC ---
        serializer = RatingSerializer(data=request.data)
        if serializer.is_valid():
            # Create the rating object
            serializer.save(
                booking=booking,
                rater=request.user,
                ratee=booking.provider
            )
            
            # Update the provider's average rating
            provider_profile = booking.provider.provider_profile
            # Calculate the new average from all ratings received by the provider
            new_avg = Rating.objects.filter(ratee=booking.provider).aggregate(Avg('score'))['score__avg']
            provider_profile.average_rating = round(new_avg, 2)
            provider_profile.save()

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsCustomerUser])
    def pay_for_job(self, request, pk=None):
        """
    Initiates the payment process for a completed job.
    
    A customer can choose to pay with 'CASH' or 'M-PESA'.
    - If 'CASH', the payment is marked as successful immediately.
    - If 'M-PESA', an STK push is sent to the user's phone number.
    The backend then awaits a callback from M-Pesa to confirm the transaction.
    """
        booking = self.get_object()

        # --- Validation ---
        if booking.customer != request.user:
            return Response({'error': 'You are not authorized to pay for this job.'}, status=status.HTTP_403_FORBIDDEN)
        if booking.status != 'COMPLETED':
            return Response({'error': 'You can only pay for completed jobs.'}, status=status.HTTP_400_BAD_REQUEST)
        if Payment.objects.filter(booking=booking, status='SUCCESS').exists():
            return Response({'error': 'This job has already been paid for successfully.'}, status=status.HTTP_400_BAD_REQUEST)
        
        payment_method = request.data.get('payment_method')
        # We need a final price. For now, let's use the service's base price.
        # In a real app, this might be negotiated or have extra charges.
        amount = booking.service.estimated_base_price 
        booking.final_price = amount # Save the final price
        booking.save()

        # Create a payment record in our DB
        payment = Payment.objects.create(
            booking=booking,
            amount=amount,
            # payment_method=payment_method,
            status='PENDING'
        )

        # --- Logic for different payment methods ---
        if payment_method == 'CASH':
            # For cash, we can just mark it as successful from the backend POV
            # A provider would have to confirm receipt in a real app
            payment.status = 'SUCCESS'
            payment.save()
            return Response({'message': 'Cash payment recorded. Please pay the provider directly.'}, status=status.HTTP_200_OK)

        elif payment_method == 'M-PESA':
            phone_number = request.user.phone_number
            if not phone_number:
                return Response({'error': 'User does not have a phone number for M-Pesa payment.'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                # The callback URL must be publicly accessible (e.g., using ngrok for local dev)
                callback_url = "https://414c-196-249-92-99.ngrok-free.app/api/payments/callback/"
                response = initiate_stk_push(
                    phone_number=phone_number,
                    amount=amount,
                    account_reference=str(booking.id),
                    transaction_desc=f"Payment for service: {booking.service.name}",
                    callback_url=callback_url
                )
                # Save M-Pesa's transaction identifiers
                # Note: M-Pesa sandbox sometimes returns errors here. Need robust error handling.
                checkout_request_id = response.get('CheckoutRequestID')
                if checkout_request_id:
                    payment.external_transaction_id = checkout_request_id
                    payment.save()

                return Response({'message': 'STK push initiated. Please enter your PIN on your phone.', 'response': response}, status=status.HTTP_200_OK)

            except Exception as e:
                payment.status = 'FAILED'
                payment.save()
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVICE_ERROR)
        
        else:
            return Response({'error': 'Invalid payment method.'}, status=status.HTTP_400_BAD_REQUEST)

    
    
class CurrentProviderProfileView(APIView):
    """
    API endpoint for a provider to get and update their own profile.
    - GET /api/users/provider/profile/
    - PATCH /api/users/provider/profile/
    """
    permission_classes = [permissions.IsAuthenticated, IsProviderUser]

    def get(self, request, format=None):
        """Get the current provider's profile with additional fields"""
        try:
            # Get the provider's profile with related data
            provider_profile = ServiceProviderProfile.objects.select_related(
                'user', 'service_offered', 'service_offered__category'
            ).get(user=request.user)
            
            # Build response data
            response_data = {
                'username': provider_profile.user.username,
                'email': provider_profile.user.email,
                'first_name': provider_profile.user.first_name,
                'last_name': provider_profile.user.last_name,
                'phone_number': provider_profile.user.phone_number,
                'bio': provider_profile.bio,
                'is_verified': provider_profile.is_verified,
                'is_on_duty': provider_profile.on_duty,
                'average_rating': provider_profile.average_rating,
                'profile_picture': None,  # TODO: Add profile picture handling
                'service_category': provider_profile.service_offered.category.id if provider_profile.service_offered else '',
                'service_id': provider_profile.service_offered.id if provider_profile.service_offered else '',
                'service_price': getattr(provider_profile, 'service_price', ''),  # Will add this field
                'latitude': provider_profile.last_known_latitude,
                'longitude': provider_profile.last_known_longitude,
            }
            
            return Response(response_data)
            
        except ServiceProviderProfile.DoesNotExist:
            return Response(
                {'error': 'Provider profile not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    def patch(self, request, format=None):
        """Update the current provider's profile"""
        try:
            provider_profile = request.user.provider_profile
            user = request.user
            
            # Update user fields
            user_fields = ['username', 'email', 'first_name', 'last_name', 'phone_number']
            for field in user_fields:
                if field in request.data:
                    setattr(user, field, request.data[field])
            
            # Update provider profile fields
            if 'bio' in request.data:
                provider_profile.bio = request.data['bio']
            
            if 'latitude' in request.data and 'longitude' in request.data:
                provider_profile.last_known_latitude = request.data['latitude']
                provider_profile.last_known_longitude = request.data['longitude']
            
            # Handle service selection
            if 'service_id' in request.data and request.data['service_id']:
                try:
                    from .models import Service
                    service = Service.objects.get(id=request.data['service_id'])
                    provider_profile.service_offered = service
                except Service.DoesNotExist:
                    return Response(
                        {'error': 'Invalid service selected'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Handle service price (we'll add this field)
            if 'service_price' in request.data:
                provider_profile.service_price = request.data['service_price']
            
            user.save()
            provider_profile.save()
            
            return Response({'message': 'Profile updated successfully'})
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ProviderProfileViewSet(viewsets.ModelViewSet): # <-- Change from ReadOnlyModelViewSet
    """
    API endpoint to:
    - List and retrieve provider profiles (Public)
    - Update a provider's own profile (Provider only)
    
    - GET /api/providers/
    - GET /api/providers/{user_id}/
    - PATCH /api/providers/{user_id}/
    """
    queryset = ServiceProviderProfile.objects.filter(is_verified=True).select_related(
        'user'
    ).prefetch_related(
        'user__received_ratings'
    )
    serializer_class = ProviderProfileSerializer
    lookup_field = 'user_id'
    
    # We don't want the public to be able to create or delete profiles directly
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        - 'list' and 'retrieve' actions are public (AllowAny).
        - 'update', 'partial_update' actions require the user to be the owner.
        """
        if self.action in ['update', 'partial_update']:
            self.permission_classes = [permissions.IsAuthenticated, IsProviderUser, IsProfileOwner]
        else: # list, retrieve
            self.permission_classes = [permissions.AllowAny]
        return super().get_permissions()
    
class MpesaCallbackView(APIView):
    """
    Callback endpoint for M-Pesa to send payment status.
    This must be accessible to the public internet.
    """
    permission_classes = [permissions.AllowAny] # No auth needed

    def post(self, request, *args, **kwargs):
        print("M-Pesa Callback received!")
        data = request.data
        print(data) # Log the entire callback data for debugging

        stk_callback = data.get('Body', {}).get('stkCallback', {})
        result_code = stk_callback.get('ResultCode')
        checkout_request_id = stk_callback.get('CheckoutRequestID')

        try:
            payment = Payment.objects.get(external_transaction_id=checkout_request_id)
        except Payment.DoesNotExist:
            # M-Pesa might send a callback for a transaction we don't know about.
            # We can just ignore it.
            return Response(status=status.HTTP_404_NOT_FOUND)

        if result_code == 0:
            # Payment was successful
            payment.status = 'SUCCESS'
            # M-Pesa provides additional details in `CallbackMetadata` we could save
            # For example, the MpesaReceiptNumber
            print(f"Payment {payment.id} for booking {payment.booking.id} was successful.")
        else:
            # Payment failed or was cancelled
            payment.status = 'FAILED'
            # `ResultDesc` gives the reason for failure
            print(f"Payment {payment.id} failed with code {result_code}: {stk_callback.get('ResultDesc')}")
        
        payment.save()
        
        # We must return a success response to M-Pesa's server
        return Response({'ResultCode': 0, 'ResultDesc': 'Accepted'}, status=status.HTTP_200_OK)

# --- Admin Views ---

class AdminStatsView(APIView):
    """
    API endpoint for admin dashboard statistics.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]  # Admins only

    def get(self, request, format=None):
        """
        Calculate and return key platform metrics.
        """
        try:
            # Calculate key metrics
            total_users = User.objects.count()
            total_customers = User.objects.filter(user_type='CUSTOMER').count()
            total_providers = User.objects.filter(user_type='PROVIDER').count()
            verified_providers = User.objects.filter(
                user_type='PROVIDER', 
                provider_profile__is_verified=True
            ).count()
            
            total_bookings = Booking.objects.count()
            pending_bookings = Booking.objects.filter(status='PENDING').count()
            completed_bookings = Booking.objects.filter(status='COMPLETED').count()
            
            total_services = ServiceCategory.objects.count()
            
            # Recent activity (last 30 days)
            from datetime import timedelta
            thirty_days_ago = timezone.now() - timedelta(days=30)
            recent_bookings = Booking.objects.filter(created_at__gte=thirty_days_ago).count()
            recent_users = User.objects.filter(date_joined__gte=thirty_days_ago).count()
            
            stats = {
                'users': {
                    'total': total_users,
                    'customers': total_customers,
                    'providers': total_providers,
                    'verified_providers': verified_providers,
                    'recent_signups': recent_users,
                },
                'bookings': {
                    'total': total_bookings,
                    'pending': pending_bookings,
                    'completed': completed_bookings,
                    'recent': recent_bookings,
                },
                'services': {
                    'total_categories': total_services,
                },
                'activity': {
                    'provider_approval_pending': total_providers - verified_providers,
                }
            }
            
            return Response(stats, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': 'Failed to calculate statistics'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminUserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Admin to manage all users, with actions for activation,
    suspension, and provider verification.
    """
    queryset = User.objects.all().select_related('provider_profile').prefetch_related(
        'customer_bookings', 'provider_bookings'
    ).order_by('-date_joined')
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        """
        Optionally filter users based on query parameters.
        """
        queryset = super().get_queryset()
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        # Filter by user type
        user_type = self.request.query_params.get('user_type', None)
        if user_type:
            queryset = queryset.filter(user_type=user_type)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            active_bool = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=active_bool)
        
        return queryset

    @action(detail=True, methods=['post'], url_path='suspend')
    def suspend(self, request, pk=None):
        """Suspends (deactivates) a user's account."""
        user = self.get_object()
        
        if user.is_superuser:
            return Response(
                {'error': 'Cannot suspend superuser accounts'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.is_active = False
        user.save()
        
        # If it's a provider, also set them off duty
        if user.user_type == 'PROVIDER' and hasattr(user, 'provider_profile'):
            user.provider_profile.on_duty = False
            user.provider_profile.save()
        
        serializer = self.get_serializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='activate')
    def activate(self, request, pk=None):
        """Activates a suspended user's account."""
        user = self.get_object()
        user.is_active = True
        user.save()
        
        serializer = self.get_serializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='verify-provider')
    def verify_provider(self, request, pk=None):
        """Verifies a provider's profile, which also activates the user."""
        user = self.get_object()
        if user.user_type != 'PROVIDER':
            return Response({'error': 'User is not a provider'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Activate the main user account as well
            user.is_active = True
            user.save()
            
            profile = user.provider_profile
            profile.is_verified = True
            profile.save()
            
            serializer = self.get_serializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except AttributeError:
            return Response({'error': 'Provider profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
class AdminRecentBookingsView(APIView):
    """
    API endpoint for recent bookings data for admin dashboard.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]  # Admins only

    def get(self, request, format=None):
        """
        Return recent bookings with basic information for admin dashboard.
        """
        try:
            # Get recent bookings (last 10-20 bookings)
            recent_bookings = Booking.objects.select_related(
                'customer', 'provider', 'service'
            ).order_by('-created_at')[:20]
            
            bookings_data = []
            for booking in recent_bookings:
                booking_info = {
                    'id': str(booking.id),
                    'customer': {
                        'username': booking.customer.username if booking.customer else None,
                        'email': booking.customer.email if booking.customer else None,
                    },
                    'provider': {
                        'username': booking.provider.username if booking.provider else None,
                        'email': booking.provider.email if booking.provider else None,
                    },
                    'service': {
                        'name': booking.service.name if booking.service else None,
                    },
                    'status': booking.status,
                    'created_at': booking.created_at.isoformat(),
                    'accepted_at': booking.accepted_at.isoformat() if booking.accepted_at else None,
                    'completed_at': booking.completed_at.isoformat() if booking.completed_at else None,
                    'final_price': str(booking.final_price) if booking.final_price else None,
                }
                bookings_data.append(booking_info)
            
            return Response({
                'bookings': bookings_data,
                'total_count': len(bookings_data)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': 'Failed to fetch recent bookings'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ServiceListView(generics.ListAPIView):
    """
    API endpoint that lists services, optionally filtered by category.
    """
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Service.objects.select_related('category').all()
        category = self.request.query_params.get('category', None)
        if category is not None:
            queryset = queryset.filter(category=category)
        return queryset


class ServiceCategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing service categories (admin only).
    """
    queryset = ServiceCategory.objects.all()
    serializer_class = AdminServiceCategorySerializer
    permission_classes = [IsAdminUser]


class ServiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing services (admin only).
    """
    queryset = Service.objects.select_related('category').all()
    serializer_class = AdminServiceSerializer
    permission_classes = [IsAdminUser]
