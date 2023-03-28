from django.contrib import admin
from .models import User, Conference


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    pass


@admin.register(Conference)
class ConferenceAdmin(admin.ModelAdmin):
    pass
