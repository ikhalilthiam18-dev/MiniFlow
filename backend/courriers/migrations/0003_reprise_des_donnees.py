import re

from django.db import migrations


def normaliser(nom):
    return (nom or "").replace("\u2019", "'").strip()


def nom_court(nom):
    parts = nom.split()
    return f"{parts[0][0]}. {parts[-1]}" if len(parts) >= 2 else nom


def reprendre(apps, schema_editor):
    Courrier = apps.get_model("courriers", "Courrier")
    Compteur = apps.get_model("courriers", "Compteur")
    Service = apps.get_model("authentication", "Service")
    User = apps.get_model("authentication", "User")

    # 1. Services : noms unifiés et présents dans le référentiel.
    for c in Courrier.objects.all():
        nom = normaliser(c.service)
        if nom != c.service:
            c.service = nom
            c.save(update_fields=["service"])
        if nom:
            Service.objects.get_or_create(nom=nom)

    # 2. Agent responsable : relier le nom écrit au compte correspondant.
    comptes = {}
    for u in User.objects.all():
        comptes.setdefault(u.nom, u)
        comptes.setdefault(nom_court(u.nom), u)
    for c in Courrier.objects.filter(agent__isnull=True):
        agent = comptes.get(c.responsable.strip())
        if agent:
            c.agent = agent
            c.save(update_fields=["agent"])

    # 3. Compteurs : repartir du plus grand numéro déjà attribué par année.
    maxima = {}
    for numero in Courrier.objects.values_list("numero", flat=True):
        m = re.fullmatch(r"(ARR|DEP)-(\d{4})-(\d+)", numero)
        if m:
            cle = (m.group(1), int(m.group(2)))
            maxima[cle] = max(maxima.get(cle, 0), int(m.group(3)))
    for (prefixe, annee), dernier in maxima.items():
        Compteur.objects.update_or_create(prefixe=prefixe, annee=annee, defaults={"dernier": dernier})


class Migration(migrations.Migration):
    dependencies = [
        ("courriers", "0002_courrier_agent_compteur_historiquestatut"),
        ("authentication", "0003_services_et_photos"),
    ]

    operations = [migrations.RunPython(reprendre, migrations.RunPython.noop)]
