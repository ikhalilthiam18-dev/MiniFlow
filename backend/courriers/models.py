from django.conf import settings
from django.db import models


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
