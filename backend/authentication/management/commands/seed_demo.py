from datetime import date

from django.core.management.base import BaseCommand
from django.db import transaction

from authentication.models import User, UserRole
from courriers.models import Contact, Courrier
from courriers.services import trouver_agent


class Command(BaseCommand):
    help = "Charge les comptes et données de démonstration Courrier 360."

    @transaction.atomic
    def handle(self, *args, **options):
        if Courrier.objects.exists():
            self.stdout.write(self.style.WARNING("Données déjà présentes — seed ignoré."))
            return

        users_data = [
            ("Pape Ibrahima Niang", "admin@mairie.sn", UserRole.ADMIN, "Direction des systèmes d'information"),
            ("Aïssatou Ndiaye", "courrier@mairie.sn", UserRole.COURRIER, "Bureau du courrier"),
            ("Oumar Diallo", "dgs@mairie.sn", UserRole.DGS, "Direction générale"),
            ("Moussa Fall", "m.fall@mairie.sn", UserRole.CHEF, "Services techniques"),
            ("Fatou Sarr", "f.sarr@mairie.sn", UserRole.AGENT, "Finances"),
            ("Abdou Ba", "a.ba@mairie.sn", UserRole.AGENT, "État civil"),
        ]
        for nom, email, role, service in users_data:
            user, created = User.objects.get_or_create(
                email=email,
                defaults={"nom": nom, "role": role, "service": service, "actif": email != "a.ba@mairie.sn"},
            )
            if created or options.get("reset_password"):
                user.set_password("demo2026")
                user.save()

        contacts = [
            ("Préfecture de Rufisque", "Administration", "courrier@prefecture.sn", "33 000 00 01"),
            ("Association And Liguey", "Association", "contact@andliguey.sn", "77 200 10 10"),
            ("Trésorerie municipale", "Administration", "tresorerie@finances.sn", "33 000 00 02"),
        ]
        for nom, cat, email, tel in contacts:
            Contact.objects.get_or_create(nom=nom, defaults={"categorie": cat, "email": email, "telephone": tel})

        courriers = [
            (
                "ARR-2026-0048",
                "Arrivée",
                date(2026, 8, 27),
                "Préfecture de Rufisque",
                "Transmission du contrôle de légalité — délibération n°18",
                "Direction générale",
                "Recommandé",
                "Urgente",
                "Ventilé",
                date(2026, 8, 29),
                "A. Ndiaye",
                "",
                "Traiter sous 48 h — instruction DGS",
            ),
            (
                "ARR-2026-0047",
                "Arrivée",
                date(2026, 8, 27),
                "Association And Liguey",
                "Demande d'autorisation d'occupation temporaire",
                "Services techniques",
                "Dépôt physique",
                "Normale",
                "En cours de traitement",
                date(2026, 9, 4),
                "M. Fall",
                "",
                "",
            ),
            (
                "DEP-2026-0031",
                "Départ",
                date(2026, 8, 26),
                "Ministère des Collectivités territoriales",
                "Réponse à la demande de situation budgétaire",
                "Finances",
                "Recommandé avec AR",
                "Urgente",
                "En attente de signature",
                date(2026, 8, 28),
                "F. Sarr",
                "Maire",
                "",
            ),
            (
                "ARR-2026-0046",
                "Arrivée",
                date(2026, 8, 25),
                "Mamadou Diop",
                "Demande de copie d'acte de naissance",
                "État civil",
                "Email",
                "Normale",
                "Traité",
                date(2026, 8, 30),
                "A. Ba",
                "",
                "",
            ),
            (
                "ARR-2026-0042",
                "Arrivée",
                date(2026, 8, 21),
                "Entreprise SOTRACOM",
                "Réclamation relative au marché de voirie",
                "Services techniques",
                "Lettre",
                "Normale",
                "En attente de réponse",
                date(2026, 8, 25),
                "M. Fall",
                "",
                "",
            ),
            (
                "DEP-2026-0030",
                "Départ",
                date(2026, 8, 24),
                "Trésorerie municipale",
                "Transmission du compte administratif",
                "Finances",
                "Courrier simple",
                "Normale",
                "Expédié",
                date(2026, 8, 24),
                "F. Sarr",
                "DGS",
                "",
            ),
        ]
        for row in courriers:
            Courrier.objects.create(
                numero=row[0],
                sens=row[1],
                date=row[2],
                tiers=row[3],
                objet=row[4],
                service=row[5],
                type=row[6],
                priorite=row[7],
                statut=row[8],
                echeance=row[9],
                responsable=row[10],
                agent=trouver_agent(row[10], actifs_seulement=False),
                signataire=row[11],
                notes=row[12],
            )

        self.stdout.write(self.style.SUCCESS("Seed terminé — comptes de démonstration prêts."))
