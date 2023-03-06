import json

from asgiref.sync import async_to_sync
from channels.generic.websocket import AsyncWebsocketConsumer

rooms = {}
clients = []


class ConferenceConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(args, kwargs)
        self.my_name = None

    async def connect(self):
        await self.accept()

        # response to client, that we are connected.
        await self.send(text_data=json.dumps({
            'type': 'connection',
            'data': {
                'message': "Connected"
            }
        }))

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.my_name,
            self.channel_name
        )

    # Receive message from client WebSocket
    async def receive(self, text_data=None, bytes_data=None):
        text_data_json = json.loads(text_data)

        eventType = text_data_json['type']

        if eventType == 'login':
            name = text_data_json['data']['name']

            # we will use this as room name as well
            self.my_name = name

            # Join room
            await self.channel_layer.group_add(
                self.my_name,
                self.channel_name
            )

        if eventType == 'call':
            name = text_data_json['data']['name']
            print(self.my_name, "is calling", name)
            # print(text_data_json)

            # to notify the callee we sent an event to the group name
            # and their's groun name is the name
            await self.channel_layer.group_send(
                name,
                {
                    'type': 'call_received',
                    'data': {
                        'caller': self.my_name,
                        'rtcMessage': text_data_json['data']['rtcMessage']
                    }
                }
            )

        if eventType == 'answer_call':
            # has received call from someone now notify the calling user
            # we can notify to the group with the caller name

            caller = text_data_json['data']['caller']
            # print(self.my_name, "is answering", caller, "calls.")

            await self.channel_layer.group_send(
                caller,
                {
                    'type': 'call_answered',
                    'data': {
                        'rtcMessage': text_data_json['data']['rtcMessage']
                    }
                }
            )

        if eventType == 'ICEcandidate':
            user = text_data_json['data']['user']

            await self.channel_layer.group_send(
                user,
                {
                    'type': 'ICEcandidate',
                    'data': {
                        'rtcMessage': text_data_json['data']['rtcMessage']
                    }
                }
            )

    async def call_received(self, event):

        # print(event)
        print('Call received by ', self.my_name)
        await self.send(text_data=json.dumps({
            'type': 'call_received',
            'data': event['data']
        }))

    async def call_answered(self, event):

        # print(event)
        print(self.my_name, "'s call answered")
        await self.send(text_data=json.dumps({
            'type': 'call_answered',
            'data': event['data']
        }))

    async def ICEcandidate(self, event):
        await self.send(text_data=json.dumps({
            'type': 'ICEcandidate',
            'data': event['data']
        }))
