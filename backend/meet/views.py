import os

from moviepy.editor import concatenate_videoclips, VideoFileClip
from rest_framework import status
from rest_framework.decorators import permission_classes, api_view
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import MoviesGenerate, Room

from yadisk import yadisk
import base64


def combine_videos(base64_video1, base64_video2):
    video1_data = base64.b64decode(base64_video1.split(';base64,')[-1])
    video2_data = base64.b64decode(base64_video2.split(';base64,')[-1])

    video1_path = 'video1.mp4'
    video2_path = 'video2.mp4'
    combined_video_path = 'combined_video.mp4'

    with open(video1_path, 'wb') as video1_file:
        video1_file.write(video1_data)
    with open(video2_path, 'wb') as video2_file:
        video2_file.write(video2_data)

    video1_clip = VideoFileClip(video1_path)
    video2_clip = VideoFileClip(video2_path)
    combined_clip = concatenate_videoclips([video1_clip, video2_clip], method='compose')

    combined_clip.write_videofile(combined_video_path, codec='libx264')

    with open(combined_video_path, 'rb') as combined_video_file:
        combined_video_data = combined_video_file.read()

    combined_video_base64 = base64.b64encode(combined_video_data)

    video1_clip.close()
    video2_clip.close()
    combined_clip.close()
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
            y = yadisk.YaDisk(token="y0_AgAAAABVA64gAAntnAAAAADjdfV0qyHNVUFTRxq85-yLiBo2IKFZe7Y")
            video1_path = 'video1.mp4'
            end_file = base64.b64decode(combine_videos(movie[0].movies, request.data['blob']))
            with open(video1_path, 'wb') as video1_file:
                video1_file.write(end_file)
            y.upload(video1_path, f"/videos/{movie[0].group}-{movie[0].date}.webm")
            os.remove(video1_path)
            movie[0].delete()
        else:
            movie[0].movies = combine_videos(movie[0].movies, request.data['blob'])
            movie[0].save()

    return Response(status=status.HTTP_200_OK)
