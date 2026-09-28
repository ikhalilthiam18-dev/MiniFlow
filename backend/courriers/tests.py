import shutil
import tempfile
from datetime import date
from io import StringIO

from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from authentication.models import User, UserRole

from .models import Contact, Courrier, Notification


def make_user(email, role, service, nom):
    return User.objects.create_user(
        email=email, password="Casamance-2026!", nom=nom, role=role, service=service
    )


def courrier_data(**extra):
    data = {
        "sens": "Arrivée",
        "date": "2026-09-01",
        "tiers": "Préfecture",
        "objet": "Demande d’information",
        "service": "Finances",
        "type": "Lettre",
        "priorite": "Normale",
        "echeance": "2026-09-08",
        "responsable": "Fatou Sarr",
    }
    data.update(extra)
    return data


class CourrierTests(APITestCase):
    def setUp(self):
        self.courrier = make_user("courrier@mairie.sn", UserRole.COURRIER, "Bureau du courrier", "Aïssatou Ndiaye")
        self.chef = make_user("chef@mairie.sn", UserRole.CHEF, "Services techniques", "Moussa Fall")
        self.agent = make_user("agent@mairie.sn", UserRole.AGENT, "Finances", "Fatou Sarr")

    def create(self, user=None, **extra):
        self.client.force_authenticate(user or self.courrier)
        return self.client.post("/api/courriers/", courrier_data(**extra))

    def test_numerotation_automatique_et_separee_par_sens(self):
        annee = date.today().year
        first = self.create()
        second = self.create()
        depart = self.create(sens="Départ")
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(first.data["numero"], f"ARR-{annee}-0001")
        self.assertEqual(second.data["numero"], f"ARR-{annee}-0002")
        self.assertEqual(depart.data["numero"], f"DEP-{annee}-0001")

    def test_statut_initial_selon_le_sens(self):
        self.assertEqual(self.create().data["statut"], "Reçu")
        self.assertEqual(self.create(sens="Départ").data["statut"], "En préparation")

    def test_affectation_notifie_l_agent_responsable(self):
        res = self.create(responsable="Fatou Sarr")
        notif = Notification.objects.get(destinataire=self.agent)
        self.assertEqual(notif.courrier_numero, res.data["numero"])
        self.assertFalse(notif.lue)

    def test_agent_ne_peut_pas_enregistrer_de_courrier(self):
        res = self.create(user=self.agent)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_chef_de_service_peut_enregistrer(self):
        res = self.create(user=self.chef, service="Services techniques")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_visibilite_selon_le_role(self):
        self.create(service="Services techniques", responsable="Moussa Fall", objet="Voirie")
        self.create(service="Finances", responsable="Fatou Sarr", objet="Budget")
        self.create(service="État civil", responsable="Autre Agent", objet="Acte")

        def objets(user):
            self.client.force_authenticate(user)
            return sorted(c["objet"] for c in self.client.get("/api/courriers/").data)

        self.assertEqual(objets(self.courrier), ["Acte", "Budget", "Voirie"])
        self.assertEqual(objets(self.chef), ["Voirie"])
        self.assertEqual(objets(self.agent), ["Budget"])

    def test_agent_ne_peut_pas_lire_un_courrier_hors_perimetre(self):
        res = self.create(service="État civil", responsable="Autre Agent")
        self.client.force_authenticate(self.agent)
        detail = self.client.get(f"/api/courriers/{res.data['id']}/")
        self.assertEqual(detail.status_code, status.HTTP_404_NOT_FOUND)

    def test_changement_de_statut(self):
        res = self.create()
        self.client.force_authenticate(self.agent)
        patch = self.client.patch(f"/api/courriers/{res.data['id']}/", {"statut": "En cours de traitement"})
        self.assertEqual(patch.status_code, status.HTTP_200_OK)
        self.assertEqual(Courrier.objects.get(id=res.data["id"]).statut, "En cours de traitement")


class ContactPermissionTests(APITestCase):
    def setUp(self):
        self.courrier = make_user("courrier@mairie.sn", UserRole.COURRIER, "Bureau du courrier", "Aïssatou Ndiaye")
        self.agent = make_user("agent@mairie.sn", UserRole.AGENT, "Finances", "Fatou Sarr")
        self.contact = Contact.objects.create(nom="Préfecture", categorie="Administration")

    def test_agent_peut_consulter_et_ajouter(self):
        self.client.force_authenticate(self.agent)
        self.assertEqual(self.client.get("/api/contacts/").status_code, status.HTTP_200_OK)
        res = self.client.post("/api/contacts/", {"nom": "Association", "categorie": "Association"})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_agent_ne_peut_ni_modifier_ni_supprimer(self):
        self.client.force_authenticate(self.agent)
        url = f"/api/contacts/{self.contact.id}/"
        self.assertEqual(self.client.patch(url, {"nom": "X"}).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.delete(url).status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Contact.objects.filter(id=self.contact.id).exists())

    def test_bureau_du_courrier_peut_modifier_et_supprimer(self):
        self.client.force_authenticate(self.courrier)
        url = f"/api/contacts/{self.contact.id}/"
        self.assertEqual(self.client.patch(url, {"nom": "Préfecture de Ziguinchor"}).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.delete(url).status_code, status.HTTP_204_NO_CONTENT)


class NumerotationTests(APITestCase):
    def setUp(self):
        self.courrier = make_user("courrier@mairie.sn", UserRole.COURRIER, "Bureau du courrier", "Aïssatou Ndiaye")
        self.client.force_authenticate(self.courrier)

    def test_la_numerotation_repart_a_un_chaque_annee(self):
        a = self.client.post("/api/courriers/", courrier_data(date="2026-12-31")).data["numero"]
        b = self.client.post("/api/courriers/", courrier_data(date="2027-01-02")).data["numero"]
        self.assertEqual(a, "ARR-2026-0001")
        self.assertEqual(b, "ARR-2027-0001")

    def test_la_numerotation_continue_apres_les_numeros_existants(self):
        Courrier.objects.create(
            numero="ARR-2026-0050", sens="Arrivée", date="2026-08-27", tiers="x", objet="x",
            service="Finances", type="Lettre", priorite="Normale", statut="Reçu",
            echeance="2026-09-03", responsable="x",
        )
        res = self.client.post("/api/courriers/", courrier_data(date="2026-09-10"))
        self.assertEqual(res.data["numero"], "ARR-2026-0051")


class HistoriqueEtLiensTests(APITestCase):
    def setUp(self):
        self.courrier = make_user("courrier@mairie.sn", UserRole.COURRIER, "Bureau du courrier", "Aïssatou Ndiaye")
        self.agent = make_user("agent@mairie.sn", UserRole.AGENT, "Finances", "Fatou Sarr")
        self.client.force_authenticate(self.courrier)
        self.cid = self.client.post("/api/courriers/", courrier_data(service="État civil")).data["id"]

    def historique(self):
        return self.client.get(f"/api/courriers/{self.cid}/historique/").data

    def test_creation_et_changement_de_statut_sont_traces(self):
        self.client.patch(f"/api/courriers/{self.cid}/", {"statut": "Ventilé"})
        h = self.historique()
        self.assertEqual([(e["ancien_statut"], e["nouveau_statut"]) for e in h], [("", "Reçu"), ("Reçu", "Ventilé")])
        self.assertEqual(h[1]["auteur"], "Aïssatou Ndiaye")

    def test_une_modification_sans_changement_de_statut_n_est_pas_tracee(self):
        self.client.patch(f"/api/courriers/{self.cid}/", {"notes": "Relancer le service"})
        self.assertEqual(len(self.historique()), 1)

    def test_le_remplacement_complet_put_est_refuse(self):
        res = self.client.put(f"/api/courriers/{self.cid}/", courrier_data())
        self.assertEqual(res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_le_responsable_est_relie_a_son_compte_meme_avec_un_nom_abrege(self):
        res = self.client.post("/api/courriers/", courrier_data(responsable="F. Sarr", service="État civil"))
        self.assertEqual(res.data["agent"], self.agent.id)

    def test_l_agent_garde_ses_dossiers_apres_un_changement_de_nom(self):
        self.agent.nom = "Fatou Sarr Diop"
        self.agent.save()
        self.client.force_authenticate(self.agent)
        ids = [c["id"] for c in self.client.get("/api/courriers/").data]
        self.assertIn(self.cid, ids)

    def test_reaffectation_notifie_le_nouvel_agent(self):
        autre = make_user("autre@mairie.sn", UserRole.AGENT, "Urbanisme", "Moussa Diop")
        self.client.patch(f"/api/courriers/{self.cid}/", {"responsable": "Moussa Diop"})
        self.assertEqual(Courrier.objects.get(id=self.cid).agent, autre)
        self.assertTrue(Notification.objects.filter(destinataire=autre, message__startswith="Courrier réaffecté").exists())

    def test_service_inconnu_refuse(self):
        res = self.client.post("/api/courriers/", courrier_data(service="Service imaginaire"))
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("service", res.data)

    def test_apostrophe_typographique_acceptee(self):
        res = self.client.post("/api/courriers/", courrier_data(service="Direction des systèmes d\u2019information"))
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["service"], "Direction des systèmes d'information")


class SeedDemoTests(APITestCase):
    def test_seed_relie_les_agents_et_la_numerotation_continue(self):
        call_command("seed_demo", stdout=StringIO())
        self.assertFalse(Courrier.objects.filter(agent__isnull=True).exists())
        self.client.force_authenticate(User.objects.get(email="courrier@mairie.sn"))
        dernier = max(
            int(n.split("-")[-1])
            for n in Courrier.objects.filter(numero__startswith="ARR-2026-").values_list("numero", flat=True)
        )
        res = self.client.post("/api/courriers/", courrier_data(date="2026-09-10", responsable="Fatou Sarr"))
        self.assertEqual(res.data["numero"], f"ARR-2026-{dernier + 1:04d}")



class ModificationTests(APITestCase):
    def setUp(self):
        self.courrier = make_user("courrier@mairie.sn", UserRole.COURRIER, "Bureau du courrier", "Aïssatou Ndiaye")
        self.agent = make_user("agent@mairie.sn", UserRole.AGENT, "Finances", "Fatou Sarr")
        self.client.force_authenticate(self.courrier)
        self.cid = self.client.post("/api/courriers/", courrier_data()).data["id"]

    def test_le_bureau_du_courrier_modifie_le_contenu(self):
        res = self.client.patch(f"/api/courriers/{self.cid}/", {"objet": "Objet corrigé", "echeance": "2026-09-30"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["objet"], "Objet corrigé")

    def test_un_agent_ne_modifie_que_statut_et_annotations(self):
        self.client.force_authenticate(self.agent)
        url = f"/api/courriers/{self.cid}/"
        self.assertEqual(self.client.patch(url, {"objet": "Piraté"}).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.patch(url, {"statut": "Traité", "notes": "Vu"}).status_code, status.HTTP_200_OK)


class PieceJointeTests(APITestCase):
    def setUp(self):
        self.dossier = tempfile.mkdtemp()
        self.override = override_settings(PIECES_JOINTES_ROOT=self.dossier)
        self.override.enable()
        self.courrier = make_user("courrier@mairie.sn", UserRole.COURRIER, "Bureau du courrier", "Aïssatou Ndiaye")
        self.agent = make_user("agent@mairie.sn", UserRole.AGENT, "Finances", "Fatou Sarr")
        self.autre = make_user("autre@mairie.sn", UserRole.AGENT, "Urbanisme", "Moussa Diop")
        self.client.force_authenticate(self.courrier)
        self.cid = self.client.post("/api/courriers/", courrier_data()).data["id"]
        self.url = f"/api/courriers/{self.cid}/pieces/"

    def tearDown(self):
        self.override.disable()
        shutil.rmtree(self.dossier, ignore_errors=True)

    def envoyer(self, nom="lettre.pdf", contenu=b"%PDF-1.4 test", user=None):
        self.client.force_authenticate(user or self.courrier)
        return self.client.post(self.url, {"fichiers": [SimpleUploadedFile(nom, contenu)]}, format="multipart")

    def test_envoi_liste_et_telechargement(self):
        res = self.envoyer()
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        pid = res.data[0]["id"]
        self.assertEqual(self.client.get(self.url).data[0]["nom"], "lettre.pdf")
        fichier = self.client.get(f"{self.url}{pid}/")
        self.assertEqual(fichier.status_code, status.HTTP_200_OK)
        self.assertEqual(b"".join(fichier.streaming_content), b"%PDF-1.4 test")

    def test_format_refuse(self):
        res = self.envoyer(nom="virus.exe")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_taille_maximale(self):
        with override_settings(PIECE_JOINTE_TAILLE_MAX=5):
            res = self.envoyer(contenu=b"0123456789")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_telechargement_refuse_hors_perimetre(self):
        pid = self.envoyer().data[0]["id"]
        self.client.force_authenticate(self.autre)
        self.assertEqual(self.client.get(f"{self.url}{pid}/").status_code, status.HTTP_404_NOT_FOUND)

    def test_suppression_par_l_auteur_ou_le_bureau_seulement(self):
        pid = self.envoyer().data[0]["id"]
        self.client.force_authenticate(self.agent)
        self.assertEqual(self.client.delete(f"{self.url}{pid}/").status_code, status.HTTP_403_FORBIDDEN)
        pid_agent = self.envoyer(user=self.agent).data[0]["id"]
        self.assertEqual(self.client.delete(f"{self.url}{pid_agent}/").status_code, status.HTTP_204_NO_CONTENT)
        self.client.force_authenticate(self.courrier)
        self.assertEqual(self.client.delete(f"{self.url}{pid}/").status_code, status.HTTP_204_NO_CONTENT)


class PaginationEtFiltresTests(APITestCase):
    def setUp(self):
        self.courrier = make_user("courrier@mairie.sn", UserRole.COURRIER, "Bureau du courrier", "Aïssatou Ndiaye")
        self.client.force_authenticate(self.courrier)
        for i in range(3):
            self.client.post("/api/courriers/", courrier_data(objet=f"Objet {i}", echeance="2020-01-01"))
        self.client.post("/api/courriers/", courrier_data(sens="Départ", echeance="2099-01-01"))

    def test_sans_page_la_liste_complete_est_renvoyee(self):
        self.assertEqual(len(self.client.get("/api/courriers/").data), 4)

    def test_pagination_a_la_demande(self):
        res = self.client.get("/api/courriers/?page=1&page_size=2")
        self.assertEqual(res.data["count"], 4)
        self.assertEqual(len(res.data["results"]), 2)
        self.assertIsNotNone(res.data["next"])

    def test_filtres_sens_et_retard(self):
        self.assertEqual(len(self.client.get("/api/courriers/?sens=Départ").data), 1)
        self.assertEqual(len(self.client.get("/api/courriers/?retard=1").data), 3)


class EmailEtRappelsTests(APITestCase):
    def setUp(self):
        self.courrier = make_user("courrier@mairie.sn", UserRole.COURRIER, "Bureau du courrier", "Aïssatou Ndiaye")
        self.agent = make_user("agent@mairie.sn", UserRole.AGENT, "Finances", "Fatou Sarr")
        self.client.force_authenticate(self.courrier)

    def test_affectation_envoie_un_email_a_l_agent(self):
        with self.captureOnCommitCallbacks(execute=True):
            self.client.post("/api/courriers/", courrier_data(responsable="Fatou Sarr"))
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["agent@mairie.sn"])
        self.assertIn("Nouveau courrier affecté", mail.outbox[0].subject)

    def test_rappel_des_dossiers_en_retard_une_seule_fois_par_jour(self):
        self.client.post("/api/courriers/", courrier_data(responsable="Fatou Sarr", echeance="2020-01-01"))
        mail.outbox.clear()
        with self.captureOnCommitCallbacks(execute=True):
            call_command("rappels_echeances", stdout=StringIO())
        with self.captureOnCommitCallbacks(execute=True):
            call_command("rappels_echeances", stdout=StringIO())
        rappels = Notification.objects.filter(destinataire=self.agent, message__startswith="Échéance dépassée")
        self.assertEqual(rappels.count(), 1)
        self.assertEqual(len(mail.outbox), 1)


class DroitsParStatutTests(APITestCase):
    def setUp(self):
        self.courrier = make_user("courrier@mairie.sn", UserRole.COURRIER, "Bureau du courrier", "Aïssatou Ndiaye")
        self.dgs = make_user("dgs@mairie.sn", UserRole.DGS, "Direction générale", "Oumar Diallo")
        self.chef = make_user("chef@mairie.sn", UserRole.CHEF, "Finances", "Moussa Fall")
        self.agent = make_user("agent@mairie.sn", UserRole.AGENT, "Finances", "Fatou Sarr")
        self.client.force_authenticate(self.courrier)
        self.cid = self.client.post("/api/courriers/", courrier_data()).data["id"]

    def passer(self, user, statut):
        self.client.force_authenticate(user)
        return self.client.patch(f"/api/courriers/{self.cid}/", {"statut": statut}).status_code

    def test_agent(self):
        self.assertEqual(self.passer(self.agent, "En cours de traitement"), status.HTTP_200_OK)
        self.assertEqual(self.passer(self.agent, "Traité"), status.HTTP_200_OK)
        for interdit in ("Ventilé", "Signé", "Expédié", "Archivé", "En attente de signature"):
            self.assertEqual(self.passer(self.agent, interdit), status.HTTP_403_FORBIDDEN, interdit)

    def test_chef_de_service(self):
        self.assertEqual(self.passer(self.chef, "En attente de signature"), status.HTTP_200_OK)
        for interdit in ("Ventilé", "Signé", "Expédié", "Archivé"):
            self.assertEqual(self.passer(self.chef, interdit), status.HTTP_403_FORBIDDEN, interdit)

    def test_dgs(self):
        self.assertEqual(self.passer(self.dgs, "Signé"), status.HTTP_200_OK)
        for interdit in ("Ventilé", "Expédié", "Archivé", "Reçu"):
            self.assertEqual(self.passer(self.dgs, interdit), status.HTTP_403_FORBIDDEN, interdit)

    def test_bureau_du_courrier(self):
        for statut in ("Ventilé", "Expédié", "Archivé"):
            self.assertEqual(self.passer(self.courrier, statut), status.HTTP_200_OK, statut)

    def test_le_dgs_garde_l_enregistrement(self):
        self.client.force_authenticate(self.dgs)
        self.assertEqual(self.client.post("/api/courriers/", courrier_data()).status_code, status.HTTP_201_CREATED)

    def test_statut_force_a_la_creation(self):
        self.client.force_authenticate(self.courrier)
        res = self.client.post("/api/courriers/", courrier_data(statut="Archivé"))
        self.assertEqual(res.data["statut"], "Reçu")

    def test_garder_le_meme_statut_reste_possible(self):
        # Un agent peut enregistrer une annotation sur un dossier « Reçu ».
        self.client.force_authenticate(self.agent)
        res = self.client.patch(f"/api/courriers/{self.cid}/", {"statut": "Reçu", "notes": "Pris en compte"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)


class VisibiliteStricteTests(APITestCase):
    def setUp(self):
        self.courrier = make_user("courrier@mairie.sn", UserRole.COURRIER, "Bureau du courrier", "Aïssatou Ndiaye")
        self.agent = make_user("agent@mairie.sn", UserRole.AGENT, "Finances", "Fatou Sarr")
        self.collegue = make_user("collegue@mairie.sn", UserRole.AGENT, "Finances", "Awa Diouf")
        self.chef = make_user("chef@mairie.sn", UserRole.CHEF, "Services techniques", "Moussa Fall")
        self.client.force_authenticate(self.courrier)
        self.a_moi = self.client.post("/api/courriers/", courrier_data(responsable="Fatou Sarr", objet="Mon dossier")).data["id"]
        self.au_collegue = self.client.post("/api/courriers/", courrier_data(responsable="Awa Diouf", objet="Dossier du collègue")).data["id"]
        self.au_chef_ailleurs = self.client.post(
            "/api/courriers/", courrier_data(service="Urbanisme", responsable="Moussa Fall", objet="Affecté au chef")
        ).data["id"]

    def ids(self, user):
        self.client.force_authenticate(user)
        return {c["id"] for c in self.client.get("/api/courriers/").data}

    def test_un_agent_ne_voit_pas_les_dossiers_de_ses_collegues_du_meme_service(self):
        self.assertEqual(self.ids(self.agent), {self.a_moi})
        self.client.force_authenticate(self.agent)
        res = self.client.get(f"/api/courriers/{self.au_collegue}/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_un_chef_voit_les_dossiers_qui_lui_sont_affectes_hors_de_son_service(self):
        self.assertIn(self.au_chef_ailleurs, self.ids(self.chef))
        self.assertNotIn(self.a_moi, self.ids(self.chef))
