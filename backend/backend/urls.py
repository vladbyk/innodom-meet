from django.contrib import admin
from django.urls import path

from django.conf.urls import include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('djoser.urls.jwt')),
    path('api/', include('accounts.urls')),
    path('api/', include('meet.urls')),
]
