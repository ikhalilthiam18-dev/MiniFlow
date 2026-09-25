from rest_framework import serializers

from authentication.models import User

from .models import Contact, Courrier, Notification


class CourrierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Courrier
        fields = (
            "id",
            "numero",
            "sens",
            "date",
            "tiers",
            "objet",
            "service",
            "type",
            "priorite",
            "statut",
            "echeance",
            "responsable",
            "signataire",
            "notes",
        )
        read_only_fields = ("id", "numero")


class CourrierWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Courrier
        fields = (
            "sens",
            "date",
            "tiers",
            "objet",
            "service",
            "type",
            "priorite",
            "statut",
            "echeance",
            "responsable",
            "signataire",
            "notes",
        )


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = ("id", "nom", "categorie", "email", "telephone")


class NotificationSerializer(serializers.ModelSerializer):
    destinataire = serializers.CharField(source="destinataire.nom", read_only=True)
    courrier = serializers.CharField(source="courrier_numero", read_only=True)

    class Meta:
        model = Notification
        fields = ("id", "destinataire", "courrier", "message", "date", "lue")
        read_only_fields = ("id", "destinataire", "courrier", "message", "date")
