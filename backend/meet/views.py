import os.path

from rest_framework import status
from rest_framework.decorators import permission_classes, api_view
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from moviepy.editor import *
from yadisk import yadisk

from .models import MoviesGenerate, Room


@api_view(['POST'])
@permission_classes([AllowAny])
def get_movie(request):
    movie = MoviesGenerate.objects.filter(group__group=request.data['group'])
    if movie is []:
        MoviesGenerate(
            movies=request.data['blob'],
            group=Room.objects.get(group=request.data['group'])
        ).save()
    else:
        path = os.path.dirname(__file__).replace('meet', 'videos')
        with open(f'{path}/file.webm', 'wb') as f_vid:
            f_vid.write(movie[0].moveis)
        with open(f'{path}/file1.webm', 'wb') as f_vid:
            f_vid.write(request.data['blob'])
        clip = VideoFileClip(f"{path}/file.webm")
        clip1 = clip.subclip(0, 5)
        clipx = VideoFileClip(f"{path}/file1.webm")
        clip2 = clipx.subclip(0, 5)
        clips = [clip1, clip2]
        final = concatenate_videoclips(clips)
        if os.path.isfile(f"{path}/file.webm"):
            os.remove(f"{path}/file.webm")
        if os.path.isfile(f"{path}/file1.webm"):
            os.remove(f"{path}/file1.webm")
        if request.data['is_last']:
            final.write_videofile(f"{path}/{movie[0].group}-{movie[0].date}.webm")
            y = yadisk.YaDisk(token="y0_AgAAAABVA64gAAnjtwAAAADi8QQ2wmDmWZ8PSC2W0S6RFne6SwNOxvA")
            y.mkdir("/videos")
            y.upload(f"../videos/{movie[0].group}-{movie[0].date}.webm", f"/videos/{movie[0].group}-{movie[0].date}.webm")
            if os.path.isfile(f"{path}/{movie[0].group}-{movie[0].date}.webm"):
                os.remove(f"{path}/{movie[0].group}-{movie[0].date}.webm")
            movie[0].delete()
        else:
            final.write_videofile(f"{path}/{movie[0].group}-{movie[0].date}.webm")
            with open(f"{path}/{movie[0].group}-{movie[0].date}.webm", 'rb') as f_vid:
                MoviesGenerate(
                    movies=f_vid.read(),
                    group=Room.objects.get(group=request.data['group'])
                ).save()
            if os.path.isfile(f"{path}/{movie[0].group}-{movie[0].date}.webm"):
                os.remove(f"{path}/{movie[0].group}-{movie[0].date}.webm")
            movie[0].delete()
    return Response(status=status.HTTP_200_OK)
