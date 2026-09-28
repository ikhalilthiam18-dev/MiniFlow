import mimetypes
from datetime import date

from django.conf import settings
from django.db.models import Q
from django.http import FileResponse
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from authentication.models import User

from .models import Contact, Courrier, Notification, PieceJointe
from .permissions import (
    ROLE_ADMIN,
    ROLE_COURRIER,
    ROLE_DGS,
    CHAMPS_MODIFIABLES_PAR_TOUS,
    ROLES_EDITION,
    ContactPermission,
    statut_autorise,
    CourrierPermission,
    NotificationPermission,
)
from .serializers import (
    ContactSerializer,
    CourrierSerializer,
    CourrierWriteSerializer,
    HistoriqueStatutSerializer,
    NotificationSerializer,
    PieceJointeSerializer,
)
from .pagination import PaginationOptionnelle
from .services import (
    STATUTS_CLOS,
    courriers_for_user,
    create_courrier_with_notification,
    update_courrier,
)


class CourrierViewSet(viewsets.ModelViewSet):
    permission_classes = [CourrierPermission]
    # Pas de PUT : toute modification passe par PATCH, qui trace l'historique.
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]
    pagination_class = PaginationOptionnelle

    def get_queryset(self):
        qs = courriers_for_user(self.request.user)
        q = self.request.query_params.get("q")
        statut = self.request.query_params.get("statut")
        service = self.request.query_params.get("service")
        if q:
            qs = qs.filter(
                Q(numero__icontains=q)
                | Q(tiers__icontains=q)
                | Q(objet__icontains=q)
            )
        if statut and statut != "Tous":
            qs = qs.filter(statut=statut)
        if service and service != "Tous":
            qs = qs.filter(service=service)
        sens = self.request.query_params.get("sens")
        if sens and sens != "Tous":
            qs = qs.filter(sens=sens)
        if self.request.query_params.get("retard") in ("1", "true"):
            qs = qs.filter(echeance__lt=date.today()).exclude(statut__in=STATUTS_CLOS)
        return qs

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return CourrierWriteSerializer
        return CourrierSerializer

    def create(self, request, *args, **kwargs):
        serializer = CourrierWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Toujours le statut initial (« Reçu » / « En préparation ») : les étapes
        # suivantes passent par PATCH, où les droits par rôle s'appliquent.
        serializer.validated_data.pop("statut", None)
        courrier = create_courrier_with_notification(serializer.validated_data, auteur=request.user)
        return Response(
            CourrierSerializer(courrier).data,
            status=status.HTTP_201_CREATED,
        )

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        if request.user.role not in ROLES_EDITION and set(request.data) - CHAMPS_MODIFIABLES_PAR_TOUS:
            return Response(
                {"detail": "Vous ne pouvez modifier que le statut et les annotations de ce courrier."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = CourrierWriteSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        nouveau = serializer.validated_data.get("statut")
        if nouveau and nouveau != instance.statut and not statut_autorise(request.user.role, nouveau):
            return Response(
                {"detail": f"Votre rôle ne permet pas de passer ce courrier au statut « {nouveau} »."},
                status=status.HTTP_403_FORBIDDEN,
            )
        instance = update_courrier(instance, serializer.validated_data, auteur=request.user)
        return Response(CourrierSerializer(instance).data)

    @action(detail=True, methods=["get"])
    def historique(self, request, pk=None):
        """Changements de statut du courrier, du plus ancien au plus récent."""
        courrier = self.get_object()
        return Response(HistoriqueStatutSerializer(courrier.historique.all(), many=True).data)

    @action(detail=True, methods=["get", "post"])
    def pieces(self, request, pk=None):
        """Liste (GET) ou ajout (POST multipart, champ `fichiers`) des pièces jointes."""
        courrier = self.get_object()
        if request.method == "GET":
            return Response(PieceJointeSerializer(courrier.pieces.all(), many=True).data)
        fichiers = request.FILES.getlist("fichiers")
        if not fichiers:
            return Response({"fichiers": ["Aucun fichier reçu."]}, status=status.HTTP_400_BAD_REQUEST)
        if len(fichiers) > 10:
            return Response({"fichiers": ["10 fichiers maximum par envoi."]}, status=status.HTTP_400_BAD_REQUEST)
        for f in fichiers:
            ext = f.name.rsplit(".", 1)[-1].lower() if "." in f.name else ""
            if ext not in settings.PIECE_JOINTE_EXTENSIONS:
                return Response(
                    {"fichiers": [f"« {f.name} » : seuls les fichiers PDF, JPG et PNG sont acceptés."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if f.size > settings.PIECE_JOINTE_TAILLE_MAX:
                return Response(
                    {"fichiers": [f"« {f.name} » dépasse la taille maximale de 10 Mo."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        crees = [
            PieceJointe.objects.create(
                courrier=courrier,
                fichier=f,
                nom=f.name[:255],
                taille=f.size,
                type_mime=mimetypes.guess_type(f.name)[0] or "",
                ajoute_par=request.user,
                ajoute_par_nom=request.user.nom,
            )
            for f in fichiers
        ]
        return Response(PieceJointeSerializer(crees, many=True).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get", "delete"], url_path=r"pieces/(?P<piece_id>\d+)")
    def piece(self, request, pk=None, piece_id=None):
        """Téléchargement (GET) ou suppression (DELETE) d'une pièce jointe."""
        courrier = self.get_object()
        piece = courrier.pieces.filter(id=piece_id).first()
        if not piece:
            return Response({"detail": "Pièce jointe introuvable."}, status=status.HTTP_404_NOT_FOUND)
        if request.method == "DELETE":
            if request.user.role not in (ROLE_ADMIN, ROLE_COURRIER) and piece.ajoute_par_id != request.user.id:
                return Response(
                    {"detail": "Seul l'auteur de l'ajout ou le bureau du courrier peut supprimer cette pièce."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            piece.fichier.delete(save=False)
            piece.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return FileResponse(
            piece.fichier.open("rb"),
            as_attachment=True,
            filename=piece.nom,
            content_type=piece.type_mime or "application/octet-stream",
        )


class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    permission_classes = [ContactPermission]


class NotificationViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [NotificationPermission]

    def get_queryset(self):
        user = self.request.user
        if user.role in (ROLE_ADMIN, ROLE_COURRIER, ROLE_DGS):
            return Notification.objects.select_related("destinataire").all()
        return Notification.objects.filter(destinataire=user)

    @action(detail=True, methods=["post"])
    def lire(self, request, pk=None):
        notif = self.get_object()
        notif.lue = True
        notif.save(update_fields=["lue"])
        return Response(NotificationSerializer(notif).data)

    @action(detail=False, methods=["post"])
    def tout_lire(self, request):
        qs = self.get_queryset().filter(lue=False)
        qs.update(lue=True)
        return Response({"detail": "Toutes les notifications sont lues."})
