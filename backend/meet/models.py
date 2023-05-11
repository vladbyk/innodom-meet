from django.db import models


class Room(models.Model):
    group = models.CharField(max_length=60, unique=True, verbose_name='Группа')

    def __str__(self):
        return f"{self.group}"

    class Meta:
        verbose_name = 'Комната'
        verbose_name_plural = 'Комнаты'


class MoviesGenerate(models.Model):
    movies = models.BinaryField(verbose_name='Запись')
    group = models.ForeignKey(Room, on_delete=models.CASCADE, verbose_name='Группа')
    date = models.DateField(verbose_name='Дата создания', auto_now_add=True)

    def __str__(self):
        return f"{self.group}"

    class Meta:
        verbose_name = 'Генерация записей'
        verbose_name_plural = 'Генерации записей'