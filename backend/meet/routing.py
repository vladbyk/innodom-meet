from django.urls import path
from .consumers import RoomConsumer

websocket_urlpatterns = [
    path('room/', RoomConsumer.as_asgi()),
]
