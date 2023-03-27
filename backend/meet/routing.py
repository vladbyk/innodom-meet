from django.urls import path

from . import consumers

websocket_urlpatterns = [
    path('ws/room/<str: room>', consumers.VideoConferenceConsumer.as_asgi()),
]
