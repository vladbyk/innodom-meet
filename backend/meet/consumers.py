import json
from channels.generic.websocket import AsyncWebsocketConsumer


class VideoConferenceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = 'videoconference_%s' % self.room_name

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        message = json.loads(text_data)
        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': message['type'],
                'message': message['message']
            }
        )

    # Receive message from room group
    async def video_offer(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'video_offer',
            'message': event['message']
        }))

    async def video_answer(self, event):
        await self.send(text_data=json.dumps({
            'type': 'video_answer',
            'message': event['message']
        }))

    async def new_ice_candidate(self, event):
        await self.send(text_data=json.dumps({
            'type': 'new_ice_candidate',
            'message': event['message']
        }))

    async def peer_left(self, event):
        await self.send(text_data=json.dumps({
            'type': 'peer_left',
            'message': event['message']
        }))
