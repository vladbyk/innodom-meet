from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/videoconference/(?P<room_name>\w+)/$', consumers.VideoConferenceConsumer.as_asgi()),
]