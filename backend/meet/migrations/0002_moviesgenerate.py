# Generated by Django 4.1.7 on 2023-05-11 12:56

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('meet', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='MoviesGenerate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('movies', models.TextField(verbose_name='Запись')),
                ('date', models.DateField(auto_now_add=True, verbose_name='Дата создания')),
                ('group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='meet.room', verbose_name='Группа')),
            ],
            options={
                'verbose_name': 'Генерация записей',
                'verbose_name_plural': 'Генерации записей',
            },
        ),
    ]