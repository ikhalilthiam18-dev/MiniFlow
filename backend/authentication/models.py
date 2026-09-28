from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserRole(models.TextChoices):
    ADMIN = "Administrateur système", "Administrateur système"
    COURRIER = "Secrétariat général / Bureau du courrier", "Secrétariat général / Bureau du courrier"
    DGS = "DGS / Secrétaire municipal", "DGS / Secrétaire municipal"
    CHEF = "Chef de service municipal", "Chef de service municipal"
    AGENT = "Agent communal", "Agent communal"


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("L'adresse email est obligatoire.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", UserRole.ADMIN)
        extra_fields.setdefault("nom", "Super administrateur")
        extra_fields.setdefault("service", "Direction des systèmes d'information")
        extra_fields.setdefault("actif", True)
        return self.create_user(email, password, **extra_fields)


class Service(models.Model):
    """Service ou direction municipale (référentiel géré par l'administrateur)."""

    nom = models.CharField(max_length=255, unique=True)
    actif = models.BooleanField(default=True)

    class Meta:
        ordering = ["nom"]
        verbose_name = "service"
        verbose_name_plural = "services"

    def __str__(self):
        return self.nom


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField("adresse email", unique=True)
    nom = models.CharField("nom complet", max_length=255)
    role = models.CharField(max_length=80, choices=UserRole.choices, default=UserRole.AGENT)
    service = models.CharField(max_length=255)
    actif = models.BooleanField(default=True)
    photo = models.FileField("photo de profil", upload_to="avatars/", blank=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["nom"]

    class Meta:
        verbose_name = "utilisateur"
        verbose_name_plural = "utilisateurs"

    def __str__(self):
        return f"{self.nom} ({self.email})"
