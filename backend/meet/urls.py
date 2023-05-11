from django.urls import path
from .views import get_movie

urlpatterns = [
    path('movie/create', get_movie)
]
