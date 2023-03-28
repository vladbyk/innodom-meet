import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"
django.setup()

import json
from urllib.parse import parse_qs
from channels.generic.websocket import AsyncWebsocketConsumer

from accounts.models import Conference
from accounts.models import User




class VideoConferenceConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(args, kwargs)
        self.user = None
        self.room = None

    async def connect(self):
        self.room = self.scope['url_route']['kwargs']['room']
        self.user = parse_qs(self.scope['query_string'].decode())['user'][-1]
        Conference(user=User.objects.get(id=self.user), channel_name=self.channel_name)
        # await self.accept()

    async def disconnect(self, close_code):
        Conference.objects.filter(channel_name=self.channel_name).delete()

    # Receive message from WebSocket
    async def receive(self, text_data):
        message = json.loads(text_data)
        print(message)
        from channels.layers import get_channel_layer

        channel_layer = get_channel_layer()
        if message['type'] == 'joinRoom':
            for user in Conference.objects.exclude(user=User.obgects.get(id=message['user'])):
                await channel_layer.send(
                    user.channel_name,
                    {
                        'type': 'sender',
                        'user': message['user']
                    })
        # elif message['type'] == 'senderOffer':
        #     await self.channel_layer.group_send(
        #         self.room,
        #         {
        #             'type': 'getSenderOffer',
        #             'roomID': message['roomID'],
        #             'senderSocketID': message['senderSocketID'],
        #             'sdp': message['sdp']
        #         }
        #     )
        # elif message['type'] == 'senderAnswer':
        #     await self.channel_layer.group_send(
        #         self.room,
        #         {
        #             'type': 'getSenderAnswer',
        #             'sdp': message['sdp']
        #         }
        #     )
        # elif message['type'] == 'senderCandidate':
        #     await self.channel_layer.group_send(
        #         self.room,
        #         {
        #             'type': 'getSenderCandidate',
        #             'senderSocketID': message['senderSocketID'],
        #             'candidate': message['candidate'],
        #         }
        #     )
        # elif message['type'] == 'receiverOffer':
        #     await self.channel_layer.group_send(
        #         self.room,
        #         {
        #             'type': 'getSenderCandidate',
        #             'candidate': message['candidate'],
        #         }
        #     )
        # ----------------------------
    #
    # # Receive message from room group
    # async def peer_joined(self, event):
    #     peer_id = event['peer_id']
    #     # Send peer ID to all other peers
    #     await self.send(text_data=json.dumps({
    #         'type': 'peer_joined',
    #         'peer_id': peer_id
    #     }))
    #
    # async def offer(self, event):
    #     sender = event['sender']
    #     receiver = event['receiver']
    #     offer = event['offer']
    #     # Send offer to the specified receiver
    #     await self.send(text_data=json.dumps({
    #         'type': 'offer',
    #         'sender': sender,
    #         'receiver': receiver,
    #         'offer': offer
    #     }))
    #
    # async def answer(self, event):
    #     sender = event['sender']
    #     receiver = event['receiver']
    #     answer = event['answer']
    #     # Send answer to the specified receiver
    #     await self.send(text_data=json.dumps({
    #         'type': 'answer',
    #         'sender': sender,
    #         'receiver': receiver,
    #         'answer': answer
    #     }))
    #
    # async def candidate(self, event):
    #     sender = event['sender']
    #     receiver = event['receiver']
    #     candidate = event['candidate']
    #     # Send candidate to the specified receiver
    #     await self.send(text_data=json.dumps({
    #         'type': 'candidate',
    #         'sender': sender,
    #         'receiver': receiver,
    #         'candidate': candidate
    #     }))
