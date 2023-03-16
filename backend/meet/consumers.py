from channels.generic.websocket import AsyncWebsocketConsumer
import json


class VideoChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Получение идентификатора комнаты из URL-адреса
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = 'video_chat_%s' % self.room_id

        # Присоединение к группе WebSocket
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Удаление из группы WebSocket
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        # Получение сообщения от клиента и отправка его в группу WebSocket
        message = json.loads(text_data)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message
            }
        )

    async def chat_message(self, event):
        # Отправка сообщения из группы WebSocket клиентам
        message = event['message']
        await self.send(text_data=json.dumps(message))
