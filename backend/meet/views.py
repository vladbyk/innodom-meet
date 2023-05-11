import base64

from rest_framework.decorators import permission_classes, api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from moviepy.editor import *
from yadisk import yadisk

from .models import MoviesGenerate, Room


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_movie(request):
    movie = MoviesGenerate.objects.filter(group=request.data['group'])
    if movie is []:
        MoviesGenerate(
            movies=request.data['blob'],
            group=Room.objects.get(group=request.data['group'])
        ).save()
    else:
        with open('../videos/file.webm', 'wb') as f_vid:
            f_vid.write(base64.b64encode(movie[0].moveis))
        with open('../videos/file1.webm', 'wb') as f_vid:
            f_vid.write(base64.b64encode(request.data['blob']))
        clip = VideoFileClip("../videos/file.webm")
        clip1 = clip.subclip(0, 5)
        clipx = VideoFileClip("../videos/file1.webm")
        clip2 = clipx.subclip(0, 5)
        clips = [clip1, clip2]
        final = concatenate_videoclips(clips)
        if os.path.isfile('../videos/file.webm'):
            os.remove('../videos/file.webm')
        if os.path.isfile('../videos/file1.webm'):
            os.remove('../videos/file1.webm')
        if request.data['is_last']:
            final.write_videofile(f'../videos/{movie[0].group}-{movie[0].date}.webm')
            y = yadisk.YaDisk(token="y0_AgAAAABVA64gAAnjtwAAAADi8QQ2wmDmWZ8PSC2W0S6RFne6SwNOxvA")
            y.mkdir("/videos")
            y.upload(f"../videos/{movie[0].group}-{movie[0].date}.webm", f"/videos/{movie[0].group}-{movie[0].date}.webm")
            if os.path.isfile(f'../videos/{movie[0].group}-{movie[0].date}.webm'):
                os.remove(f'../videos/{movie[0].group}-{movie[0].date}.webm')
            movie[0].delete()
        else:
            final.write_videofile(f'../videos/{movie[0].group}-{movie[0].date}.webm')
            with open(f'../videos/{movie[0].group}-{movie[0].date}.webm', 'rb') as f_vid:
                MoviesGenerate(
                    movies=base64.b64decode(f_vid.read()),
                    group=Room.objects.get(group=request.data['group'])
                ).save()
            if os.path.isfile(f'../videos/{movie[0].group}-{movie[0].date}.webm'):
                os.remove(f'../videos/{movie[0].group}-{movie[0].date}.webm')
            movie[0].delete()
    return Response()
