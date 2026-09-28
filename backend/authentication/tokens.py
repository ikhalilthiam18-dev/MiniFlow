from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .serializers import UserSerializer


class Courrier360TokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "email"

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["nom"] = user.nom
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        if not user.actif:
            from rest_framework.exceptions import AuthenticationFailed

            raise AuthenticationFailed(
                "Ce compte municipal est désactivé. Contactez l'administrateur.",
                code="account_disabled",
            )
        data["user"] = UserSerializer(user, context=self.context).data
        return data
