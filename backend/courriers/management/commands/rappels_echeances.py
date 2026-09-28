from collections import defaultdict
from datetime import date

from django.core.management.base import BaseCommand
from django.utils import timezone

from courriers.models import Courrier, Notification
from courriers.services import STATUTS_CLOS, envoyer_email

PREFIXE = "Échéance dépassée"


class Command(BaseCommand):
    help = (
        "Notifie les agents de leurs dossiers en retard (notification + e-mail). "
        "À planifier une fois par jour ; un dossier n'est rappelé qu'une fois par jour."
    )

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Affiche sans rien envoyer.")

    def handle(self, *args, dry_run=False, **options):
        aujourd_hui = timezone.localdate()
        en_retard = (
            Courrier.objects.filter(echeance__lt=date.today(), agent__isnull=False, agent__actif=True)
            .exclude(statut__in=STATUTS_CLOS)
            .select_related("agent")
        )
        par_agent = defaultdict(list)
        for c in en_retard:
            deja = Notification.objects.filter(
                courrier=c, message__startswith=PREFIXE, date__date=aujourd_hui
            ).exists()
            if not deja:
                par_agent[c.agent].append(c)

        for agent, dossiers in par_agent.items():
            lignes = [
                f"- {c.numero} : {c.objet} (échéance {c.echeance.strftime('%d/%m/%Y')}, "
                f"{(date.today() - c.echeance).days} j de retard)"
                for c in dossiers
            ]
            self.stdout.write(f"{agent.nom} : {len(dossiers)} dossier(s) en retard")
            if dry_run:
                continue
            for c in dossiers:
                Notification.objects.create(
                    destinataire=agent,
                    courrier=c,
                    courrier_numero=c.numero,
                    message=f"{PREFIXE} : {c.objet} — échéance {c.echeance.strftime('%d/%m/%Y')}",
                )
            envoyer_email(
                agent,
                f"{len(dossiers)} dossier(s) en retard",
                "Les dossiers suivants ont dépassé leur échéance :\n" + "\n".join(lignes),
            )

        total = sum(len(d) for d in par_agent.values())
        suffixe = " (simulation)" if dry_run else ""
        self.stdout.write(self.style.SUCCESS(f"{total} rappel(s) pour {len(par_agent)} agent(s){suffixe}."))
