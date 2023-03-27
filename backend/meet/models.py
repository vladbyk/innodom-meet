from django.db import models


class Room(models.Model):
    group = models.CharField(max_length=60, unique=True, verbose_name='Группа')

    def __str__(self):
        return f"{self.group}"

    class Meta:
        verbose_name = 'Комната'
        verbose_name_plural = 'Комнаты'
