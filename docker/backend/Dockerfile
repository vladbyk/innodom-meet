FROM python:3.10-alpine

WORKDIR /app
ADD ./backend/requirements.txt /app/backend/

RUN pip install --upgrade pip
RUN pip install daphne && pip install -r backend/requirements.txt

ADD ./docker /app/docker
ADD ./backend /app/backend

RUN ls -al /app/docker/backend

RUN chmod +x /app/docker/backend/wsgi-entrypoint.sh && chmod +x /app/docker/backend/worker-entrypoint.sh && chmod +x /app/backend/manage.py