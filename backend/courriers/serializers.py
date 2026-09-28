from rest_framework import serializers

from authentication.models import Service, User

from .models import Contact, Courrier, HistoriqueStatut, Notification, PieceJointe


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
            "agent",
            "signataire",
            "notes",
        )
        read_only_fields = ("id", "numero", "agent")


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
        # Sans statut, le service applique « Reçu » (arrivée) ou « En préparation » (départ).
        extra_kwargs = {"statut": {"required": False}}

    def validate_service(self, value):
        value = value.replace("’", "'").strip()
        if not Service.objects.filter(nom=value, actif=True).exists():
            raise serializers.ValidationError("Service inconnu ou désactivé.")
        return value


class HistoriqueStatutSerializer(serializers.ModelSerializer):
    auteur = serializers.CharField(source="auteur_nom", read_only=True)

    class Meta:
        model = HistoriqueStatut
        fields = ("id", "ancien_statut", "nouveau_statut", "auteur", "date")


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


class PieceJointeSerializer(serializers.ModelSerializer):
    ajoute_par = serializers.CharField(source="ajoute_par_nom", read_only=True)

    class Meta:
        model = PieceJointe
        fields = ("id", "nom", "taille", "type_mime", "ajoute_par", "date")
