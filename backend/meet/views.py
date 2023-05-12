import os.path

from rest_framework import status
from rest_framework.decorators import permission_classes, api_view
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from moviepy.editor import *
from yadisk import yadisk

from .models import MoviesGenerate, Room

import base64
import subprocess


def combine_videos(base64_video1, base64_video2):
    # Раскодирование строк Base64 в бинарные данные
    video1_data = base64.b64decode(base64_video1)
    video2_data = base64.b64decode(base64_video2)

    # Запись двух видеозаписей во временные файлы
    video1_path = 'video1.mp4'
    video2_path = 'video2.mp4'
    with open(video1_path, 'wb') as video1_file:
        video1_file.write(video1_data)
    with open(video2_path, 'wb') as video2_file:
        video2_file.write(video2_data)

    # Объединение видеозаписей с помощью ffmpeg
    combined_video_path = 'combined_video.mp4'
    subprocess.run(
        ['ffmpeg', '-i', video1_path, '-i', video2_path, '-filter_complex', 'concat=n=2:v=1:a=0', '-c:v', 'copy',
         combined_video_path])

    # Чтение объединенного видео из файла
    with open(combined_video_path, 'rb') as combined_video_file:
        combined_video_data = combined_video_file.read()

    # Кодирование объединенного видео обратно в Base64
    combined_video_base64 = base64.b64decode(combined_video_data)

    # Удаление временных файлов
    os.remove(video1_path)
    os.remove(video2_path)
    os.remove(combined_video_path)

    return combined_video_base64


@api_view(['POST'])
@permission_classes([AllowAny])
def get_movie(request):
    movie = MoviesGenerate.objects.filter(group__group=request.data['group'])
    if not movie:
        MoviesGenerate(
            movies=request.data['blob'],
            group=Room.objects.get(group=request.data['group'])
        ).save()
    else:
        if request.data['is_last']:
            y = yadisk.YaDisk(token="y0_AgAAAABVA64gAAnjtwAAAADi8QQ2wmDmWZ8PSC2W0S6RFne6SwNOxvA")
            video1_path = 'video1.mp4'
            end_file = base64.b64decode(combine_videos(movie[0].movies, request.data['blob']))
            with open(video1_path, 'wb') as video1_file:
                video1_file.write(end_file)
                y.mkdir("/videos")
                y.upload(video1_file, f"/videos/{movie[0].group}-{movie[0].date}.webm")
            movie[0].delete()
        else:
            movie[0].movies = combine_videos(movie[-1].movies, request.data['blob'])
            movie[0].save()

    return Response(status=status.HTTP_200_OK)
