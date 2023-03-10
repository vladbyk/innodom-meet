from django.urls import path
from .consumers import ConferenceConsumer

websocket_urlpatterns = [
    path('room/', ConferenceConsumer.as_asgi()),
]
