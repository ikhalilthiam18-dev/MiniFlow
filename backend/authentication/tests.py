import shutil
import tempfile

from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from .models import User, UserRole

PASSWORD = "Casamance-2026!"


def make_user(email, role=UserRole.AGENT, service="Finances", nom=None, actif=True):
    return User.objects.create_user(
        email=email,
        password=PASSWORD,
        nom=nom or email.split("@")[0],
        role=role,
        service=service,
        actif=actif,
    )


class LoginTests(APITestCase):
    url = "/api/auth/login/"

    def test_connexion_valide_renvoie_les_jetons_et_le_profil(self):
        make_user("agent@mairie.sn")
        res = self.client.post(self.url, {"email": "agent@mairie.sn", "password": PASSWORD})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)
        self.assertEqual(res.data["user"]["email"], "agent@mairie.sn")

    def test_mauvais_mot_de_passe_refuse(self):
        make_user("agent@mairie.sn")
        res = self.client.post(self.url, {"email": "agent@mairie.sn", "password": "faux"})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_compte_desactive_refuse(self):
        make_user("ancien@mairie.sn", actif=False)
        res = self.client.post(self.url, {"email": "ancien@mairie.sn", "password": PASSWORD})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_api_protegee_sans_jeton(self):
        res = self.client.get("/api/courriers/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class PasswordTests(APITestCase):
    def setUp(self):
        self.admin = make_user("admin@mairie.sn", role=UserRole.ADMIN)
        self.agent = make_user("agent@mairie.sn")

    def test_changement_par_l_utilisateur(self):
        self.client.force_authenticate(self.agent)
        res = self.client.post(
            "/api/auth/password/change/",
            {"current_password": PASSWORD, "new_password": "Ziguinchor-Nouveau-1"},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.agent.refresh_from_db()
        self.assertTrue(self.agent.check_password("Ziguinchor-Nouveau-1"))

    def test_changement_refuse_si_mot_de_passe_actuel_faux(self):
        self.client.force_authenticate(self.agent)
        res = self.client.post(
            "/api/auth/password/change/",
            {"current_password": "faux", "new_password": "Ziguinchor-Nouveau-1"},
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("current_password", res.data)

    def test_mot_de_passe_trop_simple_refuse(self):
        self.client.force_authenticate(self.agent)
        res = self.client.post(
            "/api/auth/password/change/",
            {"current_password": PASSWORD, "new_password": "123"},
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("new_password", res.data)

    def test_reinitialisation_par_l_administrateur(self):
        self.client.force_authenticate(self.admin)
        res = self.client.post(
            f"/api/auth/users/{self.agent.id}/set-password/", {"password": "Provisoire-Zig-42"}
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.agent.refresh_from_db()
        self.assertTrue(self.agent.check_password("Provisoire-Zig-42"))

    def test_reinitialisation_interdite_aux_agents(self):
        other = make_user("autre@mairie.sn")
        self.client.force_authenticate(self.agent)
        res = self.client.post(
            f"/api/auth/users/{other.id}/set-password/", {"password": "Provisoire-Zig-42"}
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_creation_de_compte_avec_mot_de_passe_provisoire(self):
        self.client.force_authenticate(self.admin)
        res = self.client.post(
            "/api/auth/users/",
            {
                "nom": "Nouvel Agent",
                "email": "nouveau@mairie.sn",
                "role": UserRole.AGENT,
                "service": "État civil",
                "password": "Provisoire-Zig-42",
            },
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertNotIn("password", res.data)
        self.assertTrue(User.objects.get(email="nouveau@mairie.sn").check_password("Provisoire-Zig-42"))


PNG_1PX = (
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8Bw"
    "HwAFAQH/cLuYRAAAAABJRU5ErkJggg=="
)


class ServiceTests(APITestCase):
    def test_les_services_par_defaut_existent(self):
        self.client.force_authenticate(make_user("agent@mairie.sn"))
        noms = [s["nom"] for s in self.client.get("/api/auth/services/").data]
        self.assertIn("État civil", noms)
        self.assertIn("Direction des systèmes d'information", noms)

    def test_seul_l_administrateur_gere_les_services(self):
        self.client.force_authenticate(make_user("agent@mairie.sn"))
        self.assertEqual(self.client.post("/api/auth/services/", {"nom": "Sport"}).status_code, status.HTTP_403_FORBIDDEN)
        self.client.force_authenticate(make_user("admin@mairie.sn", role=UserRole.ADMIN))
        self.assertEqual(self.client.post("/api/auth/services/", {"nom": "Sport"}).status_code, status.HTTP_201_CREATED)


class PhotoTests(APITestCase):
    def setUp(self):
        self.media = tempfile.mkdtemp()
        self.override = override_settings(MEDIA_ROOT=self.media)
        self.override.enable()
        self.user = make_user("agent@mairie.sn")
        self.client.force_authenticate(self.user)

    def tearDown(self):
        self.override.disable()
        shutil.rmtree(self.media, ignore_errors=True)

    def test_photo_enregistree_en_fichier_et_servie_par_url(self):
        res = self.client.patch("/api/auth/me/", {"avatar": PNG_1PX}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["avatar"].startswith("http://testserver/media/avatars/"))
        self.user.refresh_from_db()
        self.assertTrue(self.user.photo.name.endswith(".png"))

    def test_photo_retiree(self):
        self.client.patch("/api/auth/me/", {"avatar": PNG_1PX}, format="json")
        res = self.client.patch("/api/auth/me/", {"avatar": ""}, format="json")
        self.assertEqual(res.data["avatar"], "")

    def test_format_non_image_refuse(self):
        res = self.client.patch("/api/auth/me/", {"avatar": "data:text/plain;base64,aGVsbG8="}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
