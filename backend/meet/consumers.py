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
        await self.close()

    async def receive(self, text_data):
        message = json.loads(text_data)
        print(message, flush=True)
        channel_layer = get_channel_layer()
        if message['type'] == 'joinRoom':
            user = Conference.objects.get(user__id=message['user'])
            await channel_layer.send(
                user.channel_name,
                {
                    'type': 'getJoinRoom',
                    'allUsers': [{'channel_name': conf_user.channel_name, 'id': conf_user.user.id,
                                  'email': conf_user.user.email,
                                  'name': conf_user.user.name + " " + conf_user.user.surname,
                                  }
                                 for
                                 conf_user in Conference.objects.filter(user__group__group=message['group']).exclude(
                            user=User.objects.get(id=message['user']))]
                })
        elif message['type'] == 'offer':
            user = Conference.objects.get(user__id=message['user'])
            await channel_layer.send(
                message['channel_name'],
                {
                    'type': 'getOffer',
                    'sdp': message['sdp'],
                    'channel_name': message['channel_name'],
                    'channel_name_sender': user.channel_name,
                    'name': user.user.name,
                    'email': user.user.email,
                })
        elif message['type'] == 'answer':
            user = Conference.objects.get(user__id=message['user'])
            for conf_user in Conference.objects.filter(user__group__group=message['group']):
                if conf_user.deamon:
                    await channel_layer.send(
                        conf_user.channel_name,
                        {
                            'type': 'getCheckDeamon',
                            'channel_name': message['channel_name']
                        })
            await channel_layer.send(
                message['channel_name'],
                {
                    'type': 'getAnswer',
                    'sdp': message['sdp'],
                    'channel_name': user.channel_name,
                })
        elif message['type'] == 'candidate':
            user = Conference.objects.get(user__id=message['user'])
            await channel_layer.send(
                message['channel_name'],
                {
                    'type': 'getCandidate',
                    'candidate': message['candidate'],
                    'channel_name': message['channel_name'],
                    'channel_name_sender': user.channel_name
                }
            )
        elif message['type'] == 'disconnect':
            user = Conference.objects.get(user__id=message['user']).channel_name
            for user_conf in Conference.objects.filter(user__group__group=message['group']):
                await channel_layer.send(
                    user_conf.channel_name, {
                        'type': 'getDisconnect',
                        'channel_name': user,
                    }
                )
        elif message['type'] == 'sharingOffer':
            user = Conference.objects.get(user__id=message['user'])
            user.deamon = True
            user.save()
            await channel_layer.send(
                message['channel_name'], {
                    'type': 'getSharingOffer',
                    'channel_name': user.channel_name,
                    'sdp': message['sdp']
                }
            )
        elif message['type'] == 'sharingAnswer':
            user = Conference.objects.get(user__id=message['user']).channel_name
            await channel_layer.send(
                message['channel_name'], {
                    'type': 'getSharingAnswer',
                    'channel_name': user,
                    'sdp': message['sdp']
                }
            )
        elif message['type'] == 'userScreen':
            user = Conference.objects.get(user__id=message['user'])
            user.deamon = True
            user.save()
        elif message['type'] == 'handUp':
            user = Conference.objects.get(user__id=message['user'])
            for user_conf in Conference.objects.filter(user__group__group=message['group']):
                await channel_layer.send(
                    user_conf.channel_name, {
                        'type': 'getHandUp',
                        'user_name': f"{user.user.name} {user.user.surname}",
                    }
                )
        elif message['type'] == 'allMicrophoneMute':
            for user_conf in Conference.objects.filter(user__group__group=message['group']).exclude(user__role="T"):
                await channel_layer.send(
                    user_conf.channel_name, {
                        'type': 'getAllMicrophoneMute'
                    }
                )
        elif message['type'] == 'allCameraMute':
            for user_conf in Conference.objects.filter(user__group__group=message['group']).exclude(user__role="T"):
                await channel_layer.send(
                    user_conf.channel_name, {
                        'type': 'getAllCameraMute'
                    }
                )
        elif message['type'] == 'сameraMute':
            await channel_layer.send(
                message['channel_name'],
                {
                    'type': 'getCameraMute',
                    'camera': 'off',
                })
        elif message['type'] == 'microphoneMute':
            await channel_layer.send(
                message['channel_name'],
                {
                    'type': 'getMicrophoneMute',
                    'microphone': 'off',
                })
        elif message['type'] == 'kick':
            await channel_layer.send(
                message['channel_name'],
                {
                    'type': 'getKick',
                })

    async def getKick(self, event):
        await self.send(text_data=json.dumps({
            'type': event['type'],
        }))

    async def getCameraMute(self, event):
        await self.send(text_data=json.dumps({
            'type': event['type'],
            'camera': event['camera']
        }))

    async def getMicrophoneMute(self, event):
        await self.send(text_data=json.dumps({
            'type': event['type'],
            'microphone': event['camera']
        }))

    async def getOffer(self, event):
        await self.send(text_data=json.dumps({
            'type': event['type'],
            'sdp': event['sdp'],
            'channel_name': event['channel_name'],
            'channel_name_sender': event['channel_name_sender'],
            'name': event['name'],
            'email': event['email'],
        }))

    async def getAnswer(self, event):
        await self.send(text_data=json.dumps({
            'type': event['type'],
            'sdp': event['sdp'],
            'channel_name': event['channel_name']
        }))

    async def getCandidate(self, event):
        await self.send(text_data=json.dumps({
            'type': event['type'],
            'candidate': event['candidate'],
            'channel_name': event['channel_name'],
            'channel_name_sender': event['channel_name_sender']
        }))

    async def getJoinRoom(self, event):
        await self.send(text_data=json.dumps({
            'type': event['type'],
            'allUsers': event['allUsers']
        }))

    async def getDisconnect(self, event):
        await self.send(text_data=json.dumps({
            'type': event['type'],
            'channel_name': event['channel_name'],
        }))

    async def getSharing(self, event):
        await self.send(text_data=json.dumps({
            'type': event['type'],
            'channel_name': event['channel_name']
        }))

    async def getSharingOffer(self, event):
        await self.send(text_data=json.dumps({
            'type': event['type'],
            'channel_name': event['channel_name'],
            'sdp': event['sdp']
        }))

    async def getSharingAnswer(self, event):
        await self.send(text_data=json.dumps({
            'type': event['type'],
            'channel_name': event['channel_name'],
            'sdp': event['sdp']
        }))

    async def getCheckDeamon(self, event):
        await self.send(text_data=json.dumps({
            'type': event['type'],
            'channel_name': event['channel_name']
        }))

    async def getHandUp(self, event):
        await self.send(text_data=json.dumps({
            'type': event['type'],
            'user_name': event['user_name']
        }))

    async def getAllMicrophoneMute(self, event):
        await self.send(text_data=json.dumps({
            'type': event['type']
        }))

    async def getAllCameraMute(self, event):
        await self.send(text_data=json.dumps({
            'type': event['type']
        }))
