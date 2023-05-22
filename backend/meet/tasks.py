from time import sleep
from celery import shared_task
from yadisk import yadisk
import base64
import os
from moviepy.editor import concatenate_videoclips, VideoFileClip

from .models import MoviesGenerate


def combine_videos(base64_videos):
    combined_clip = []
    combined_video_path = 'combined_video.mp4'
    for base64_video in range(len(base64_videos)):
        video_path = f"video{base64_video}.webm"
        with open(video_path, 'wb') as video_file:
            video_file.write(base64.b64decode(base64_videos[base64_video].movies.split(';base64,')[-1]))
        combined_clip.append(VideoFileClip(video_path))
    concatenate_clip = concatenate_videoclips(combined_clip, method='compose')
    concatenate_clip.write_videofile(combined_video_path, codec='libx264')

    with open(combined_video_path, 'rb') as combined_video_file:
        combined_video_data = combined_video_file.read()

    combined_video_base64 = base64.b64encode(combined_video_data)

    for clip in combined_clip:
        clip.close()

    concatenate_clip.close()

    for base64_video in range(len(base64_videos)):
        video_path = f"video{base64_video}.webm"
        os.remove(video_path)
    os.remove(combined_video_path)

    return combined_video_base64


@shared_task()
def send_video_in_yandex(group):
    sleep(10)
    movie = MoviesGenerate.objects.filter(group__group=group)
    y = yadisk.YaDisk(token="y0_AgAAAABVA64gAAntnAAAAADjdfV0qyHNVUFTRxq85-yLiBo2IKFZe7Y")
    video1_path = 'video1.mp4'
    end_file = base64.b64decode(combine_videos(movie))
    with open(video1_path, 'wb') as video1_file:
        video1_file.write(end_file)
    y.upload(video1_path, f"/videos/{movie[0].group}-{movie[0].date}.webm")
    os.remove(video1_path)
    movie.delete()
