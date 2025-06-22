# In api/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer 
from asgiref.sync import sync_to_async 
from .models import Booking, ChatMessage, User

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Get booking_id from the URL route
        self.booking_id = self.scope['url_route']['kwargs']['booking_id']
        self.booking_group_name = f'chat_{self.booking_id}'
        self.user = self.scope['user']

        # Authorization: Check if the user is part of the booking
        if await self.is_user_part_of_booking():
            # Join room group
            await self.channel_layer.group_add(
                self.booking_group_name,
                self.channel_name
            )
            await self.accept()
        else:
            await self.close()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.booking_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_text = text_data_json['message']

        # Save the message to the database
        new_message = await self.create_chat_message(message_text)

        # Send message to room group
        await self.channel_layer.group_send(
            self.booking_group_name,
            {
                'type': 'chat_message', # This will call the chat_message method
                'message': new_message.message,
                'sender': new_message.sender.username,
                'timestamp': new_message.timestamp.isoformat()
            }
        )

    # Receive message from room group and send to client's WebSocket
    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender': event['sender'],
            'timestamp': event['timestamp']
        }))
        
    # --- Helper methods that touch the database ---
    @sync_to_async
    def is_user_part_of_booking(self):
        try:
            booking = Booking.objects.get(pk=self.booking_id)
            return self.user == booking.customer or self.user == booking.provider
        except Booking.DoesNotExist:
            return False

    @sync_to_async
    def create_chat_message(self, message):
        return ChatMessage.objects.create(
            booking_id=self.booking_id,
            sender=self.user,
            message=message
        )
        
class LocationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.booking_id = self.scope['url_route']['kwargs']['booking_id']
        self.booking_group_name = f'location_{self.booking_id}'
        self.user = self.scope['user']

        # Authorization: Only the customer and provider of a booking can connect
        if await self.is_user_part_of_booking():
            # Join the location-specific group
            await self.channel_layer.group_add(
                self.booking_group_name,
                self.channel_name
            )
            await self.accept()
        else:
            await self.close()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.booking_group_name,
            self.channel_name
        )

    # Receive location update from WebSocket (sent by the provider)
    async def receive(self, text_data):
        # Only providers should be sending their location
        if self.user.user_type != 'PROVIDER':
            return # Ignore messages from non-providers
        
        text_data_json = json.loads(text_data)
        latitude = text_data_json.get('latitude')
        longitude = text_data_json.get('longitude')
        
        if latitude is None or longitude is None:
            return # Ignore malformed data
            
        # Broadcast the location data to the group (to the customer)
        await self.channel_layer.group_send(
            self.booking_group_name,
            {
                'type': 'location_update', # Calls the location_update method
                'latitude': latitude,
                'longitude': longitude,
            }
        )
        
    # Receive location from room group and forward it to the client's WebSocket
    async def location_update(self, event):
        # This message will be sent to the customer
        if self.user.user_type == 'CUSTOMER':
            await self.send(text_data=json.dumps({
                'latitude': event['latitude'],
                'longitude': event['longitude'],
            }))

    # --- Helper Method ---
    # We can reuse the same authorization logic from the ChatConsumer
    @sync_to_async
    def is_user_part_of_booking(self):
        try:
            booking = Booking.objects.get(pk=self.booking_id)
            return self.user == booking.customer or self.user == booking.provider
        except Booking.DoesNotExist:
            return False