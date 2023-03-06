from django.contrib.auth.models import BaseUserManager
from django.db import transaction


class UserManager(BaseUserManager):
    def _create_user(self, email, name, password=None, **extra_fields):
        with transaction.atomic():
            user = self.model(email=email, name=name, **extra_fields)
            if password:
                user.set_password(password)
            user.save(using=self._db)
            return user

    def create_user(self, email, name, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(email, name, **extra_fields)

    def create_superuser(self, email, name, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        return self._create_user(email, name, password, **extra_fields)
