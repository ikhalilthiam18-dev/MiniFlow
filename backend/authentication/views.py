from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User
from .serializers import (
    PasswordChangeSerializer,
    UserAdminSerializer,
    UserSerializer,
)
from .tokens import Courrier360TokenObtainPairSerializer


class LoginView(TokenObtainPairView):
    serializer_class = Courrier360TokenObtainPairSerializer


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def patch(self, request, *args, **kwargs):
        avatar = request.data.get("avatar")
        if avatar is not None:
            request.user.avatar = avatar
            request.user.save(update_fields=["avatar"])
        return Response(UserSerializer(request.user).data)


class PasswordChangeView(generics.GenericAPIView):
    serializer_class = PasswordChangeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Mot de passe modifié."})


class IsSystemAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "Administrateur système"
        )


class UserViewSet(viewsets.ModelViewSet):
    """Gestion des comptes — réservée à l'administrateur système."""

    serializer_class = UserAdminSerializer
    permission_classes = [permissions.IsAuthenticated, IsSystemAdmin]
    queryset = User.objects.all().order_by("nom")

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        user.actif = False
        user.save(update_fields=["actif"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserListForAppView(generics.ListAPIView):
    """Liste des utilisateurs actifs (formulaires, affectations)."""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(actif=True).order_by("nom")
