import django.db.models
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import User
from .serializers import UserSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def get_user_status(request):
    if request.method == 'POST':
        try:
            user = User.objects.get(email=request.data['email'])
            serializer = UserSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except django.db.models.ObjectDoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)


