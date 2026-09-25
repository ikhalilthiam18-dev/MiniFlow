import secrets

from django.contrib.auth import password_validation
from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "nom", "email", "role", "service", "actif", "avatar")
        read_only_fields = ("id",)


class UserAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "nom", "email", "role", "service", "actif")
        read_only_fields = ("id",)

    def create(self, validated_data):
        user = User.objects.create_user(
            password=secrets.token_urlsafe(16),
            **validated_data,
        )
        return user


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
