from django.urls import path
from .views import get_user_status

urlpatterns = [
    path('user/', get_user_status)
]
