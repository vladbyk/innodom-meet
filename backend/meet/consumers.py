import json
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync

class WebRTCVideoConferenceConsumer(WebsocketConsumer):
    def connect(self):
        self.room_name = 'my-room'
        self.room_group_name = 'conference_%s' % self.room_name

        # Join room group
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name
        )

        self.accept()

    def disconnect(self, close_code):
        # Leave room group
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )

    def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data['type']
        payload = data['payload']

        if message_type == 'join':
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'user.joined',
                    'payload': {
                        'userId': self.channel_name
                    }
                }
            )

        elif message_type == 'signal':
            userId = payload['userId']
            signal = payload['signal']
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'user.signaling',
                    'payload': {
                        'userId': self.channel_name,
                        'signal': signal
                    }
                }
            )

    # Receive message from room group
    def user_joined(self, event):
        userId = event['payload']['userId']
        # Send message to WebSocket
        self.send(text_data=json.dumps({
            'type': 'user.joined',
            'payload': {
                'userId': userId
            }
        }))

    def user_signaling(self, event):
        userId = event['payload']['userId']
        signal = event['payload']['signal']
        # Send message to WebSocket
        self.send(text_data=json.dumps({
            'type': 'user.signaling',
            'payload': {
                'userId': userId,
                'signal': signal
            }
        }))


# import json
# from channels.generic.websocket import AsyncWebsocketConsumer
#
#
# class WebRTCVideoConferenceConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         self.room_id = self.scope['url_route']['kwargs']['room_id']
#         self.room_group_name = f'videoconference_{self.room_id}'
#
#         # Join room group
#         await self.channel_layer.group_add(
#             self.room_group_name,
#             self.channel_name
#         )
#
#         await self.accept()
#
#     async def disconnect(self, close_code):
#         # Leave room group
#         await self.channel_layer.group_discard(
#             self.room_group_name,
#             self.channel_name
#         )
#
#     # Receive message from WebSocket
#     async def receive(self, text_data):
#         message = json.loads(text_data)
#         print(message)
#         if message['type'] == 'join_room':
#             await self.channel_layer.group_send(
#                 self.room_group_name,
#                 {
#                     'type': 'peer_joined',
#                     'peer_id': self.channel_name
#                 }
#             )
#         elif message['type'] == 'offer':
#             await self.channel_layer.group_send(
#                 self.room_group_name,
#                 {
#                     'type': 'offer',
#                     'sender': self.channel_name,
#                     'receiver': message['receiver'],
#                     'offer': message['offer']
#                 }
#             )
#         elif message['type'] == 'answer':
#             await self.channel_layer.group_send(
#                 self.room_group_name,
#                 {
#                     'type': 'answer',
#                     'sender': self.channel_name,
#                     'receiver': message['receiver'],
#                     'answer': message['answer']
#                 }
#             )
#         elif message['type'] == 'candidate':
#             await self.channel_layer.group_send(
#                 self.room_group_name,
#                 {
#                     'type': 'candidate',
#                     'sender': self.channel_name,
#                     'receiver': message['receiver'],
#                     'candidate': message['candidate']
#                 }
#             )
#
#     # Receive message from room group
#     async def peer_joined(self, event):
#         peer_id = event['peer_id']
#         # Send peer ID to all other peers
#         await self.send(text_data=json.dumps({
#             'type': 'peer_joined',
#             'peer_id': peer_id
#         }))
#
#     async def offer(self, event):
#         sender = event['sender']
#         receiver = event['receiver']
#         offer = event['offer']
#         # Send offer to the specified receiver
#         await self.send(text_data=json.dumps({
#             'type': 'offer',
#             'sender': sender,
#             'receiver': receiver,
#             'offer': offer
#         }))
#
#     async def answer(self, event):
#         sender = event['sender']
#         receiver = event['receiver']
#         answer = event['answer']
#         # Send answer to the specified receiver
#         await self.send(text_data=json.dumps({
#             'type': 'answer',
#             'sender': sender,
#             'receiver': receiver,
#             'answer': answer
#         }))
#
#     async def candidate(self, event):
#         sender = event['sender']
#         receiver = event['receiver']
#         candidate = event['candidate']
#         # Send candidate to the specified receiver
#         await self.send(text_data=json.dumps({
#             'type': 'candidate',
#             'sender': sender,
#             'receiver': receiver,
#             'candidate': candidate
#         }))
