#!/bin/sh

apt install ffmpeg

until cd /app/backend
do
    echo "Waiting for server volume..."
done

until ./manage.py makemigrations && ./manage.py migrate
do
    echo "Waiting for db to be ready..."
    sleep 2
done

./manage.py collectstatic --noinput

daphne -b 0.0.0.0 -p 8000 backend.asgi:application