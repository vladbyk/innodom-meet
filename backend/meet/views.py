from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from .models import Room, Participant


@login_required
def room_list(request):
    rooms = Room.objects.filter(created_by=request.user)
    return render(request, 'room_list.html', {'rooms': rooms})


@login_required
def room_detail(request, room_id):
    room = get_object_or_404(Room, id=room_id)
    participants = Participant.objects.filter(room=room)
    return render(request, 'room_detail.html', {'room': room, 'participants': participants})


@login_required
def create_room(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        room = Room.objects.create(name=name, created_by=request.user)
        Participant.objects.create(user=request.user, room=room)
        return JsonResponse({'success': True, 'room_id': room.id})
    else:
        return render(request, 'create_room.html')
