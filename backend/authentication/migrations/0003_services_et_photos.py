import base64
import binascii

from django.core.files.base import ContentFile
from django.db import migrations

SERVICES_PAR_DEFAUT = [
    "Bureau du courrier",
    "Direction des systèmes d'information",
    "État civil",
    "Urbanisme",
    "Services techniques",
    "Cabinet du Maire",
    "Affaires sociales",
    "Finances",
    "Direction générale",
]

EXTENSIONS = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}


def normaliser(nom):
    # Unifie l'apostrophe typographique (’) et l'apostrophe droite (').
    return (nom or "").replace("\u2019", "'").strip()


def creer_services(apps, schema_editor):
    Service = apps.get_model("authentication", "Service")
    User = apps.get_model("authentication", "User")
    for user in User.objects.all():
        nom = normaliser(user.service)
        if nom != user.service:
            user.service = nom
            user.save(update_fields=["service"])
    noms = set(SERVICES_PAR_DEFAUT) | {normaliser(s) for s in User.objects.values_list("service", flat=True)}
    for nom in sorted(n for n in noms if n):
        Service.objects.get_or_create(nom=nom)


def convertir_photos(apps, schema_editor):
    """Transforme les photos stockées en data URL (texte) en fichiers."""
    User = apps.get_model("authentication", "User")
    for user in User.objects.exclude(avatar=""):
        entete, _, contenu = user.avatar.partition(",")
        type_mime = entete.removeprefix("data:").removesuffix(";base64")
        ext = EXTENSIONS.get(type_mime)
        try:
            donnees = base64.b64decode(contenu, validate=True)
        except (binascii.Error, ValueError):
            donnees = None
        if ext and donnees:
            user.photo.save(f"user-{user.pk}.{ext}", ContentFile(donnees), save=False)
        user.avatar = ""
        user.save(update_fields=["photo", "avatar"])


class Migration(migrations.Migration):
    dependencies = [("authentication", "0002_service_user_photo")]

    operations = [
        migrations.RunPython(creer_services, migrations.RunPython.noop),
        migrations.RunPython(convertir_photos, migrations.RunPython.noop),
    ]
