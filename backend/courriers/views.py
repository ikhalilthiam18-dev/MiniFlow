from django.db.models import Q
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from authentication.models import User

from .models import Contact, Courrier, Notification
from .permissions import (
    ROLE_ADMIN,
    ROLE_COURRIER,
    ROLE_DGS,
    ContactPermission,
    CourrierPermission,
    NotificationPermission,
)
from .serializers import (
    ContactSerializer,
    CourrierSerializer,
    CourrierWriteSerializer,
    NotificationSerializer,
)
from .services import courriers_for_user, create_courrier_with_notification


class CourrierViewSet(viewsets.ModelViewSet):
    permission_classes = [CourrierPermission]

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
        return qs

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return CourrierWriteSerializer
        return CourrierSerializer

    def create(self, request, *args, **kwargs):
        serializer = CourrierWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        courrier = create_courrier_with_notification(serializer.validated_data)
        return Response(
            CourrierSerializer(courrier).data,
            status=status.HTTP_201_CREATED,
        )

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = CourrierWriteSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        for attr, value in serializer.validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return Response(CourrierSerializer(instance).data)


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
