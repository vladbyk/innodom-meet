from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.utils import timezone

from accounts.managers import UserManager
from meet.models import Room


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(max_length=40, unique=True, verbose_name='Электронная почта')
    name = models.CharField(max_length=50, verbose_name='Имя')
    surname = models.CharField(max_length=50, verbose_name='Фамилия', null=True)
    group = models.ForeignKey(Room, on_delete=models.CASCADE, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    def save(self, *args, **kwargs):
        super(User, self).save(*args, **kwargs)
        return self

    def __str__(self):
        return f"{self.email}<->{self.name}<->{self.group}"

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'


class Conference(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='Пользователь')
    channel_name = models.CharField(max_length=100, verbose_name='Название канала')

    def __str__(self):
        return f"{self.user}<->{self.channel_name}"

    class Meta:
        verbose_name = "Конференция"
        verbose_name_plural = "Конференции"
