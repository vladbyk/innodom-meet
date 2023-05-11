from django.contrib import admin
from .models import Room, MoviesGenerate


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    pass


@admin.register(MoviesGenerate)
class MoviesGenerateAdmin(admin.ModelAdmin):
    pass
