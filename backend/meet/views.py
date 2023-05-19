import os

from moviepy.editor import concatenate_videoclips, VideoFileClip
from rest_framework import status
from rest_framework.decorators import permission_classes, api_view
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import MoviesGenerate, Room

from yadisk import yadisk
import base64


def combine_videos(base64_videos):
    combined_clip = []
    combined_video_path = 'combined_video.mp4'
    for base64_video in len(base64_videos):
        video_path = f"video{base64_video}.webm"
        with open(video_path, 'wb') as video_file:
            video_file.write(base64.b64decode(base64_videos[base64_video].split(';base64,')[-1]))
        combined_clip.append(VideoFileClip(video_path))
    concatenate_clip = concatenate_videoclips(combined_clip, method='compose')
    concatenate_clip.write_videofile(combined_video_path, codec='libx264')

    with open(combined_video_path, 'rb') as combined_video_file:
        combined_video_data = combined_video_file.read()

    combined_video_base64 = base64.b64encode(combined_video_data)

    for clip in combined_clip:
        clip.close()

    concatenate_clip.close()

    for base64_video in len(base64_videos):
        video_path = f"video{base64_video}.webm"
        os.remove(video_path)
    os.remove(combined_video_path)

    return combined_video_base64


@api_view(['POST'])
@permission_classes([AllowAny])
def get_movie(request):
    MoviesGenerate(
        movies=request.data['blob'],
        group=Room.objects.get(group=request.data['group'])
    ).save()
    if request.data['is_last']:
        movie = MoviesGenerate.objects.filter(group__group=request.data['group'])
        y = yadisk.YaDisk(token="y0_AgAAAABVA64gAAntnAAAAADjdfV0qyHNVUFTRxq85-yLiBo2IKFZe7Y")
        video1_path = 'video1.mp4'
        end_file = base64.b64decode(combine_videos(movie))
        with open(video1_path, 'wb') as video1_file:
            video1_file.write(end_file)
        y.upload(video1_path, f"/videos/{movie[0].group}-{movie[0].date}.webm")
        os.remove(video1_path)
        movie.delete()
    return Response(status=status.HTTP_200_OK)
