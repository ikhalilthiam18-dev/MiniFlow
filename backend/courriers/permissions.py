from rest_framework import permissions

ROLE_ADMIN = "Administrateur système"
ROLE_COURRIER = "Secrétariat général / Bureau du courrier"
ROLE_DGS = "DGS / Secrétaire municipal"
ROLE_CHEF = "Chef de service municipal"
ROLE_AGENT = "Agent communal"

ROLES_FULL_ACCESS = {ROLE_ADMIN, ROLE_COURRIER, ROLE_DGS}


class CourrierPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if view.action in ("list", "retrieve"):
            return True
        if view.action == "create":
            return request.user.role in ROLES_FULL_ACCESS | {ROLE_CHEF}
        if view.action in ("update", "partial_update"):
            return True
        if view.action == "destroy":
            return request.user.role == ROLE_ADMIN
        return True


class ContactPermission(permissions.BasePermission):
    """Tout agent consulte et ajoute des contacts ; seuls l'administrateur
    et le bureau du courrier les modifient ou les suppriment."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if view.action in ("update", "partial_update", "destroy"):
            return request.user.role in {ROLE_ADMIN, ROLE_COURRIER}
        return True


class NotificationPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated


# Rôles autorisés à modifier le contenu d'un courrier (les agents ne changent
# que le statut et les annotations de leurs dossiers).
ROLES_EDITION = ROLES_FULL_ACCESS | {ROLE_CHEF}
CHAMPS_MODIFIABLES_PAR_TOUS = {"statut", "notes"}


# Statuts qu'un rôle peut donner à un courrier (le statut initial est
# attribué automatiquement à la création).
TOUS_LES_STATUTS = {
    "Reçu",
    "En préparation",
    "Ventilé",
    "En cours de traitement",
    "En attente de signature",
    "Signé",
    "En attente de réponse",
    "Traité",
    "Expédié",
    "Archivé",
}
_STATUTS_AGENT = {"En cours de traitement", "En attente de réponse", "Traité"}
_STATUTS_CHEF = _STATUTS_AGENT | {"En préparation", "En attente de signature"}
STATUTS_PAR_ROLE = {
    ROLE_ADMIN: TOUS_LES_STATUTS,
    ROLE_COURRIER: TOUS_LES_STATUTS,
    ROLE_DGS: TOUS_LES_STATUTS - {"Reçu", "Ventilé", "Expédié", "Archivé"},
    ROLE_CHEF: _STATUTS_CHEF,
    ROLE_AGENT: _STATUTS_AGENT,
}


def statut_autorise(role: str, statut: str) -> bool:
    return statut in STATUTS_PAR_ROLE.get(role, set())
