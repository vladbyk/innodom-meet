from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    group = serializers.StringRelatedField(source='group.group')

    class Meta:
        model = User
        fields = ['id','name', 'email', 'surname', 'group']
