from rest_framework import status
from rest_framework.decorators import permission_classes, api_view
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import MoviesGenerate, Room
from .tasks import send_video_in_yandex


@api_view(['POST'])
@permission_classes([AllowAny])
def get_movie(request):
    MoviesGenerate(
        movies=request.data['blob'],
        group=Room.objects.get(group=request.data['group'])
    ).save()
    if request.data['is_last']:
        send_video_in_yandex.delay(request.data['group'])
    return Response(status=status.HTTP_200_OK)
