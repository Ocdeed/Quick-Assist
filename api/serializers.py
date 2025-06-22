
from rest_framework import serializers 
from .models import User, Service, ServiceCategory, ServiceProviderProfile, Booking, Rating
from .utils import haversine
from django.db import transaction 

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['id', 'name', 'description', 'estimated_base_price']

class ServiceCategorySerializer(serializers.ModelSerializer):
    services = ServiceSerializer(many=True, read_only=True) 

    class Meta:
        model = ServiceCategory
        fields = ['id', 'name', 'icon_name', 'services']
        
class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ('username', 'password', 'email', 'phone_number', 'first_name', 'last_name', 'user_type')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            phone_number=validated_data.get('phone_number', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            user_type=validated_data.get('user_type', 'CUSTOMER')
        )
        user.set_password(validated_data['password'])
        user.save()
        return user
    
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'phone_number', 'first_name', 'last_name', 'user_type')
        
class ProviderStatusSerializer(serializers.Serializer):
    """
    Serializer for updating the provider's 'on_duty' status.
    """
    on_duty = serializers.BooleanField()

    def update(self, instance, validated_data):
        instance.on_duty = validated_data.get('on_duty', instance.on_duty)
        instance.save()
        return instance

class ProviderLocationSerializer(serializers.Serializer):
    """
    Serializer for updating the provider's location.
    """
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()

    def update(self, instance, validated_data):
        instance.last_known_latitude = validated_data.get('latitude')
        instance.last_known_longitude = validated_data.get('longitude')
        instance.save()
        return instance
    
class BookingSerializer(serializers.ModelSerializer):
    # We'll use simpler 'read-only' serializers to show nested data nicely
    customer = UserProfileSerializer(read_only=True)
    provider = UserProfileSerializer(read_only=True)
    service = ServiceSerializer(read_only=True)

    # These fields are for CREATING a booking. They are write-only.
    service_id = serializers.IntegerField(write_only=True)
    latitude = serializers.FloatField(write_only=True)
    longitude = serializers.FloatField(write_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'customer', 'provider', 'service', 'status',
            'created_at', 'accepted_at', 'completed_at',
            # Add the write-only fields here
            'service_id', 'latitude', 'longitude'
        ]
        read_only_fields = ('id', 'customer', 'provider', 'service', 'status', 'created_at')

    @transaction.atomic # This ensures the entire process is a single database transaction
    def create(self, validated_data):
        # 1. Get data from the validated payload
        customer = self.context['request'].user
        service_id = validated_data['service_id']
        customer_lat = validated_data['latitude']
        customer_lon = validated_data['longitude']
        
        # 2. Basic validation
        try:
            service = Service.objects.get(id=service_id)
        except Service.DoesNotExist:
            raise serializers.ValidationError("The requested service does not exist.")
            
        # 3. THE MATCHING ALGORITHM
        # Find all providers who are verified, on-duty, and have a location
        available_providers = ServiceProviderProfile.objects.filter(
            is_verified=True, 
            on_duty=True, 
            last_known_latitude__isnull=False,
            last_known_longitude__isnull=False
        )
        
        if not available_providers.exists():
            raise serializers.ValidationError("No available providers found at the moment. Please try again later.")

        # Calculate distance for each provider
        provider_distances = []
        for provider_profile in available_providers:
            distance = haversine(
                customer_lat, 
                customer_lon, 
                provider_profile.last_known_latitude, 
                provider_profile.last_known_longitude
            )
            # We store the user object of the provider, not the profile
            provider_distances.append((distance, provider_profile.user)) 

        # Sort by distance (the first element of our tuple) to find the nearest
        provider_distances.sort(key=lambda x: x[0])
        
        nearest_provider_user = provider_distances[0][1] # Get the User object of the nearest provider
        
        # 4. Create the booking instance
        booking = Booking.objects.create(
            customer=customer,
            service=service,
            booking_latitude=customer_lat,
            booking_longitude=customer_lon,
            # Assign the provider and set status directly (our MVP logic)
            provider=nearest_provider_user,
            status='ACCEPTED' # We auto-accept for simplicity
        )
        
        # We can also set the accepted_at time
        from  django.utils import timezone  
        booking.accepted_at = timezone.now()
        booking.save()

        # TODO: Send a real-time notification to the provider here using WebSockets
        print(f"Booking {booking.id} created and assigned to {nearest_provider_user.username}")
        
        return booking
    
class RatingSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and viewing ratings.
    """
    # We can add this field to show who wrote the rating (read-only)
    rater = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Rating
        fields = ['id', 'score', 'comment', 'created_at', 'rater']
        # score and comment are for writing, the others are read-only
        read_only_fields = ['id', 'created_at', 'rater']
        
class ProviderProfileSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)
    received_ratings = RatingSerializer(many=True, read_only=True, source='user.received_ratings')

    class Meta:
        model = ServiceProviderProfile
        fields = [
            'user', 'bio', 'is_verified', 'on_duty', # Added on_duty for visibility
            'average_rating', 'received_ratings'
        ]
        # Specify fields that are only for reading.
        read_only_fields = ['user', 'is_verified', 'on_duty', 'average_rating', 'received_ratings']

    def update(self, instance, validated_data):
        # We explicitly handle the update to ensure only allowed fields are changed.
        # In this case, only 'bio' can be updated by the user.
        instance.bio = validated_data.get('bio', instance.bio)
        instance.save()
        return instance