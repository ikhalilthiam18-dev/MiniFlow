import base64
import binascii
import uuid

from django.core.files.base import ContentFile
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Service, User
from .serializers import (
    AdminSetPasswordSerializer,
    PasswordChangeSerializer,
    ServiceSerializer,
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
        """Photo de profil : data URL (JPEG, PNG ou WebP, 2 Mo max) ou "" pour la retirer."""
        avatar = request.data.get("avatar")
        user = request.user
        if avatar is not None:
            fichier = None
            if avatar:
                try:
                    fichier = photo_depuis_data_url(avatar)
                except ValueError as err:
                    return Response({"avatar": [str(err)]}, status=status.HTTP_400_BAD_REQUEST)
            if user.photo:
                user.photo.delete(save=False)
            if fichier:
                user.photo.save(fichier.name, fichier, save=False)
            user.save(update_fields=["photo"])
        return Response(UserSerializer(user, context={"request": request}).data)


TYPES_PHOTO = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
TAILLE_MAX_PHOTO = 2 * 1024 * 1024


def photo_depuis_data_url(data_url: str) -> ContentFile:
    entete, _, contenu = data_url.partition(",")
    ext = TYPES_PHOTO.get(entete.removeprefix("data:").removesuffix(";base64"))
    if not ext or not entete.endswith(";base64"):
        raise ValueError("Format accepté : JPG, PNG ou WebP.")
    try:
        donnees = base64.b64decode(contenu, validate=True)
    except (binascii.Error, ValueError):
        raise ValueError("Image illisible.")
    if len(donnees) > TAILLE_MAX_PHOTO:
        raise ValueError("La photo ne doit pas dépasser 2 Mo.")
    return ContentFile(donnees, name=f"{uuid.uuid4().hex}.{ext}")


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

    @action(detail=True, methods=["post"], url_path="set-password")
    def set_password(self, request, pk=None):
        """Définit un nouveau mot de passe (provisoire) pour un agent."""
        user = self.get_object()
        serializer = AdminSetPasswordSerializer(data=request.data, context={"user": user})
        serializer.is_valid(raise_exception=True)
        user.set_password(serializer.validated_data["password"])
        user.save(update_fields=["password"])
        return Response({"detail": "Mot de passe réinitialisé."})

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


class ServiceViewSet(viewsets.ModelViewSet):
    """Référentiel des services : lecture pour tous, gestion par l'administrateur."""

    serializer_class = ServiceSerializer
    queryset = Service.objects.all()
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsSystemAdmin()]
