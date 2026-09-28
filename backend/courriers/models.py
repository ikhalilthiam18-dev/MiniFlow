from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.db import models


def stockage_pieces():
    # Callable : l'emplacement suit le réglage PIECES_JOINTES_ROOT (et les tests).
    return FileSystemStorage(location=settings.PIECES_JOINTES_ROOT)


class CourrierSens(models.TextChoices):
    ARRIVEE = "Arrivée", "Arrivée"
    DEPART = "Départ", "Départ"


class CourrierPriorite(models.TextChoices):
    NORMALE = "Normale", "Normale"
    URGENTE = "Urgente", "Urgente"


class Courrier(models.Model):
    numero = models.CharField(max_length=32, unique=True)
    sens = models.CharField(max_length=10, choices=CourrierSens.choices)
    date = models.DateField()
    tiers = models.CharField(max_length=255)
    objet = models.TextField()
    service = models.CharField(max_length=255)
    type = models.CharField("type / mode", max_length=64)
    priorite = models.CharField(max_length=10, choices=CourrierPriorite.choices)
    statut = models.CharField(max_length=64)
    echeance = models.DateField()
    responsable = models.CharField(max_length=255)
    # Compte de l'agent responsable ; `responsable` garde le nom affiché.
    agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="courriers_affectes",
    )
    signataire = models.CharField(max_length=128, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-id"]
        verbose_name = "courrier"
        verbose_name_plural = "courriers"

    def __str__(self):
        return self.numero


class PieceJointe(models.Model):
    """Document numérisé rattaché à un courrier (PDF, JPG ou PNG)."""

    courrier = models.ForeignKey(Courrier, on_delete=models.CASCADE, related_name="pieces")
    fichier = models.FileField(storage=stockage_pieces, upload_to="%Y/%m/")
    nom = models.CharField("nom d'origine", max_length=255)
    taille = models.PositiveIntegerField()
    type_mime = models.CharField(max_length=100, blank=True)
    ajoute_par = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    ajoute_par_nom = models.CharField(max_length=255, blank=True)
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["date", "id"]
        verbose_name = "pièce jointe"
        verbose_name_plural = "pièces jointes"

    def __str__(self):
        return f"{self.courrier.numero} — {self.nom}"


class HistoriqueStatut(models.Model):
    """Trace de chaque changement de statut d'un courrier (qui, quoi, quand)."""

    courrier = models.ForeignKey(Courrier, on_delete=models.CASCADE, related_name="historique")
    ancien_statut = models.CharField(max_length=64, blank=True)
    nouveau_statut = models.CharField(max_length=64)
    auteur = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    # Conservé même si le compte de l'auteur est supprimé.
    auteur_nom = models.CharField(max_length=255, blank=True)
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["date", "id"]
        verbose_name = "changement de statut"
        verbose_name_plural = "historique des statuts"

    def __str__(self):
        return f"{self.courrier.numero} : {self.ancien_statut or '—'} → {self.nouveau_statut}"


class Compteur(models.Model):
    """Dernier numéro chrono attribué par préfixe (ARR/DEP) et par année."""

    prefixe = models.CharField(max_length=3)
    annee = models.PositiveIntegerField()
    dernier = models.PositiveIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["prefixe", "annee"], name="compteur_unique_par_annee")
        ]

    def __str__(self):
        return f"{self.prefixe}-{self.annee} : {self.dernier}"


class ContactCategorie(models.TextChoices):
    ADMIN = "Administration", "Administration"
    ASSOC = "Association", "Association"
    ENT = "Entreprise", "Entreprise"
    ELU = "Élu", "Élu"
    CIT = "Citoyen", "Citoyen"


class Contact(models.Model):
    nom = models.CharField(max_length=255)
    categorie = models.CharField(max_length=32, choices=ContactCategorie.choices)
    email = models.EmailField(blank=True)
    telephone = models.CharField(max_length=32, blank=True)

    class Meta:
        ordering = ["nom"]

    def __str__(self):
        return self.nom


class Notification(models.Model):
    destinataire = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    courrier = models.ForeignKey(
        Courrier,
        on_delete=models.CASCADE,
        related_name="notifications",
        null=True,
        blank=True,
    )
    courrier_numero = models.CharField(max_length=32, blank=True)
    message = models.TextField()
    date = models.DateTimeField(auto_now_add=True)
    lue = models.BooleanField(default=False)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return f"{self.destinataire.nom} — {self.courrier_numero}"
