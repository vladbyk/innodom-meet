from django.http import JsonResponse
from .models import Room


def room_list(request):
    rooms = Room.objects.all()
    data = [{'id': room.id, 'name': room.name} for room in rooms]
    return JsonResponse({'rooms': data})
