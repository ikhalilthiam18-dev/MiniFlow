from django.db import transaction
from django.db.models import Max, Q

from authentication.models import User

from .models import Courrier, Notification


def next_numero(sens: str) -> str:
    prefix = "ARR" if sens == "Arrivée" else "DEP"
    last = (
        Courrier.objects.filter(numero__startswith=f"{prefix}-")
        .order_by("-numero")
        .values_list("numero", flat=True)
        .first()
    )
    if last:
        try:
            seq = int(last.split("-")[-1]) + 1
        except ValueError:
            seq = 1
    else:
        seq = 1
    from datetime import date

    y = date.today().year
    return f"{prefix}-{y}-{seq:04d}"


def _responsable_short(nom: str) -> str:
    parts = nom.split()
    if len(parts) >= 2:
        return f"{parts[0][0]}. {parts[-1]}"
    return nom


def courriers_for_user(user: User):
    qs = Courrier.objects.all()
    if user.role in (
        "Administrateur système",
        "Secrétariat général / Bureau du courrier",
        "DGS / Secrétaire municipal",
    ):
        return qs
    if user.role == "Chef de service municipal":
        return qs.filter(service=user.service)
    if user.role == "Agent communal":
        short = _responsable_short(user.nom)
        return qs.filter(Q(responsable=user.nom) | Q(responsable=short) | Q(service=user.service))
    return qs.none()


@transaction.atomic
def create_courrier_with_notification(data: dict) -> Courrier:
    sens = data.get("sens", "Arrivée")
    if not data.get("statut"):
        data["statut"] = "Reçu" if sens == "Arrivée" else "En préparation"
    courrier = Courrier.objects.create(numero=next_numero(sens), **data)
    if sens == "Arrivée" and data.get("responsable"):
        user = User.objects.filter(nom=data["responsable"], actif=True).first()
        if not user:
            short = data["responsable"]
            for u in User.objects.filter(actif=True):
                if _responsable_short(u.nom) == short or u.nom == short:
                    user = u
                    break
        if user:
            Notification.objects.create(
                destinataire=user,
                courrier=courrier,
                courrier_numero=courrier.numero,
                message=(
                    f"Nouveau courrier affecté : {courrier.objet} — "
                    f"échéance {courrier.echeance.strftime('%d/%m/%Y')}"
                ),
            )
    return courrier
