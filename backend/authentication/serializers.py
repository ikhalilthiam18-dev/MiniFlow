import secrets

from django.contrib.auth import password_validation
from rest_framework import serializers

from .models import Service, User


def valider_service(value):
    value = value.replace("\u2019", "'").strip()
    if not Service.objects.filter(nom=value, actif=True).exists():
        raise serializers.ValidationError("Service inconnu ou désactivé.")
    return value


class UserSerializer(serializers.ModelSerializer):
    # URL absolue de la photo (le frontend est servi sur un autre port que l'API).
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "nom", "email", "role", "service", "actif", "avatar")
        read_only_fields = ("id",)

    def get_avatar(self, user):
        if not user.photo:
            return ""
        request = self.context.get("request")
        return request.build_absolute_uri(user.photo.url) if request else user.photo.url


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ("id", "nom", "actif")


class UserAdminSerializer(serializers.ModelSerializer):
    # Temporary password chosen by the administrator at creation time.
    # When omitted, a random one is generated (the account then needs a reset).
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ("id", "nom", "email", "role", "service", "actif", "password")
        read_only_fields = ("id",)

    def validate_password(self, value):
        if value:
            password_validation.validate_password(value)
        return value

    def validate_service(self, value):
        return valider_service(value)

    def create(self, validated_data):
        password = validated_data.pop("password", "") or secrets.token_urlsafe(16)
        user = User.objects.create_user(password=password, **validated_data)
        return user

    def update(self, instance, validated_data):
        # Passwords are only changed through the dedicated set-password action.
        validated_data.pop("password", None)
        return super().update(instance, validated_data)


class AdminSetPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)

    def validate_password(self, value):
        password_validation.validate_password(value, self.context.get("user"))
        return value


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        password_validation.validate_password(value, self.context["request"].user)
        return value

    def validate(self, attrs):
        user = self.context["request"].user
        if not user.check_password(attrs["current_password"]):
            raise serializers.ValidationError(
                {"current_password": "Mot de passe actuel incorrect."}
            )
        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user
