import logging
import re

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import F, Q

from authentication.models import User

from .models import Compteur, Courrier, HistoriqueStatut, Notification

logger = logging.getLogger(__name__)

STATUTS_CLOS = ("Traité", "Expédié", "Archivé")

ROLES_VUE_GLOBALE = (
    "Administrateur système",
    "Secrétariat général / Bureau du courrier",
    "DGS / Secrétaire municipal",
)


def _max_existant(prefixe: str, annee: int) -> int:
    """Plus grand numéro déjà attribué (utile si des courriers existent sans compteur)."""
    maximum = 0
    for numero in Courrier.objects.filter(numero__startswith=f"{prefixe}-{annee}-").values_list(
        "numero", flat=True
    ):
        m = re.fullmatch(rf"{prefixe}-{annee}-(\d+)", numero)
        if m:
            maximum = max(maximum, int(m.group(1)))
    return maximum


def next_numero(sens: str, annee: int) -> str:
    """Numéro chrono ARR/DEP-AAAA-NNNN : repart à 1 chaque année, sans doublon.

    L'incrément se fait en base (F("dernier") + 1), ce qui évite que deux
    enregistrements simultanés obtiennent le même numéro.
    """
    prefixe = "ARR" if sens == "Arrivée" else "DEP"
    with transaction.atomic():
        compteur, _ = Compteur.objects.get_or_create(
            prefixe=prefixe,
            annee=annee,
            defaults={"dernier": _max_existant(prefixe, annee)},
        )
        Compteur.objects.filter(pk=compteur.pk).update(dernier=F("dernier") + 1)
        compteur.refresh_from_db()
    return f"{prefixe}-{annee}-{compteur.dernier:04d}"


def nom_court(nom: str) -> str:
    parts = nom.split()
    if len(parts) >= 2:
        return f"{parts[0][0]}. {parts[-1]}"
    return nom


def trouver_agent(responsable: str, actifs_seulement: bool = True):
    """Compte correspondant au nom saisi (« Fatou Sarr » ou « F. Sarr »).

    Une nouvelle affectation ne vise que des comptes actifs ; la reprise de
    dossiers existants (`actifs_seulement=False`) relie aussi les comptes désactivés.
    """
    responsable = (responsable or "").strip()
    if not responsable:
        return None
    comptes = User.objects.filter(actif=True) if actifs_seulement else User.objects.all()
    user = comptes.filter(nom=responsable).first()
    if user:
        return user
    for u in comptes:
        if nom_court(u.nom) == responsable:
            return u
    return None


def courriers_for_user(user: User):
    qs = Courrier.objects.all()
    if user.role in ROLES_VUE_GLOBALE:
        return qs
    if user.role == "Chef de service municipal":
        return qs.filter(service=user.service)
    if user.role == "Agent communal":
        # Lien par compte ; le nom écrit ne sert que pour les anciens dossiers non reliés.
        anciens = Q(agent__isnull=True) & Q(responsable__in=[user.nom, nom_court(user.nom)])
        return qs.filter(Q(agent=user) | Q(service=user.service) | anciens)
    return qs.none()


def _tracer(courrier: Courrier, ancien: str, auteur) -> None:
    HistoriqueStatut.objects.create(
        courrier=courrier,
        ancien_statut=ancien,
        nouveau_statut=courrier.statut,
        auteur=auteur if getattr(auteur, "is_authenticated", False) else None,
        auteur_nom=getattr(auteur, "nom", "") or "",
    )


def envoyer_email(destinataire: User, sujet: str, corps: str) -> None:
    """Envoie un e-mail après validation de la transaction ; un échec ne bloque rien."""
    if not destinataire.email:
        return

    def _envoyer():
        try:
            send_mail(
                f"[Mairie de Ziguinchor] {sujet}",
                f"Bonjour {destinataire.nom},\n\n{corps}\n\n"
                f"Accéder à la plateforme : {settings.FRONTEND_URL}\n\n"
                "— Bureau du courrier, Mairie de Ziguinchor",
                None,
                [destinataire.email],
            )
        except Exception:  # noqa: BLE001 — l'e-mail est un complément, jamais bloquant
            logger.exception("Échec d'envoi de l'e-mail à %s", destinataire.email)

    transaction.on_commit(_envoyer)


def _notifier(courrier: Courrier, message: str) -> None:
    if courrier.agent:
        Notification.objects.create(
            destinataire=courrier.agent,
            courrier=courrier,
            courrier_numero=courrier.numero,
            message=message,
        )
        envoyer_email(courrier.agent, f"{courrier.numero} — {message.split(' : ')[0]}", message)


@transaction.atomic
def create_courrier_with_notification(data: dict, auteur=None) -> Courrier:
    sens = data.get("sens", "Arrivée")
    if not data.get("statut"):
        data["statut"] = "Reçu" if sens == "Arrivée" else "En préparation"
    courrier = Courrier.objects.create(
        numero=next_numero(sens, data["date"].year),
        agent=trouver_agent(data.get("responsable", "")),
        **data,
    )
    _tracer(courrier, "", auteur)
    if sens == "Arrivée":
        _notifier(
            courrier,
            f"Nouveau courrier affecté : {courrier.objet} — "
            f"échéance {courrier.echeance.strftime('%d/%m/%Y')}",
        )
    return courrier


@transaction.atomic
def update_courrier(courrier: Courrier, data: dict, auteur=None) -> Courrier:
    ancien_statut = courrier.statut
    ancien_responsable = courrier.responsable
    for attr, value in data.items():
        setattr(courrier, attr, value)
    reaffecte = "responsable" in data and data["responsable"] != ancien_responsable
    if reaffecte:
        courrier.agent = trouver_agent(courrier.responsable)
    courrier.save()
    if courrier.statut != ancien_statut:
        _tracer(courrier, ancien_statut, auteur)
    if reaffecte:
        _notifier(
            courrier,
            f"Courrier réaffecté : {courrier.objet} — "
            f"échéance {courrier.echeance.strftime('%d/%m/%Y')}",
        )
    return courrier
