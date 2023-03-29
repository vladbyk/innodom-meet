import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"
django.setup()

import json
from urllib.parse import parse_qs
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer

from accounts.models import Conference
from accounts.models import User
from .models import Room


class VideoConferenceConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(args, kwargs)
        self.user = None
        self.room = None

    async def connect(self):
        self.room = self.scope['url_route']['kwargs']['room']
        self.user = parse_qs(self.scope['query_string'].decode())['user'][-1]
        Conference(user=User.objects.get(id=self.user), channel_name=self.channel_name).save()
        await self.accept()

    async def disconnect(self, close_code):
        Conference.objects.filter(channel_name=self.channel_name).delete()

    # Receive message from WebSocket
    async def receive(self, text_data):
        message = json.loads(text_data)
        print(message, flush=True)
        channel_layer = get_channel_layer()
        if message['type'] == 'joinRoom':
            for user in Conference.objects.exclude(user=User.objects.get(id=message['user'])):
                await channel_layer.send(
                    user.channel_name,
                    {
                        'type': 'getJoinRoom',
                        'allUsers': json.dumps(
                            [{'email': conf_user.email, 'name': conf_user.name, 'surname': conf_user.surname} for
                             conf_user in Conference.objects.filter(user__group__group=message['group'])])
                    })
        elif message['type'] == 'offer':
            for user in Conference.objects.exclude(user=User.objects.get(id=message['user'])):
                await channel_layer.send(
                    user.channel_name,
                    {
                        'type': 'getOffer',
                        'sdp': message['sdp'],
                        'channel_name': user.channel_name
                    })
        elif message['type'] == 'answer':
            await channel_layer.send(
                message['channel_name'],
                {
                    'type': 'geAnswer',
                    'sdp': message['sdp']
                })
        elif message['type'] == 'candidate':
            for user in Conference.objects.exclude(user=User.objects.get(id=message['user'])):
                await channel_layer.send(
                    user.channel_name,
                    {
                        'type': 'getCandidate',
                        'candidate': message['candidate']
                    }
                )

    async def getOffer(self, event):
        await self.send(text_data=json.dumps({
            'type': event['type'],
            'sdp': event['sdp'],
            'channel_name': event['channel_name'],
        }))

    async def getAnswer(self, event):
        await self.send(text_data=json.dumps({
            'type': event['type'],
            'sdp': event['sdp']
        }))

    async def getCandidate(self, event):
        await self.send(text_data=json.dumps({
            'type': event['type'],
            'candidate': event['candidate']
        }))
