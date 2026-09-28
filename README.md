# Courrier 360 — Mairie de Ziguinchor

Plateforme de gestion et de suivi du courrier administratif de la **Mairie de Ziguinchor** :
enregistrement des courriers arrivée et départ, numérotation automatique, affectation aux agents,
circuit de traitement, registres officiels, statistiques et administration des comptes.

## Architecture

| Partie | Technologies | Adresse en développement |
|---|---|---|
| Frontend | React 19, Next.js (vinext + Vite), Tailwind CSS 4, Recharts | http://localhost:5173 |
| Backend (API) | Django 5, Django REST Framework, JWT (SimpleJWT) | http://127.0.0.1:8001/api/ |
| Base de données | SQLite (développement) ou PostgreSQL | — |

```
app/                  Point d'entrée du frontend (page.tsx, styles, page 404)
components/mairie/    Pages et composants de l'application
lib/api.ts            Appels à l'API
lib/mairie.ts         Types, constantes et règles métier côté interface
backend/authentication/  Comptes, rôles, services, mots de passe, photos
backend/courriers/       Courriers, pièces jointes, historique, contacts, notifications
```

## Installation

Prérequis : Python 3.11+ et Node.js 22+.

### 1. Backend

```bat
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Dans `backend\.env`, pour le développement, mettez `DJANGO_DEBUG=True`.
**Sans ce fichier, le serveur démarre en mode production et exige `DJANGO_SECRET_KEY`.**

```bat
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 8001
```

`seed_demo` crée des comptes et des courriers de démonstration (mot de passe `demo2026`) :
`admin@mairie.sn` (administrateur), `courrier@mairie.sn` (bureau du courrier), `dgs@mairie.sn` (DGS),
`m.fall@mairie.sn` (chef de service), `f.sarr@mairie.sn` (agent communal).

### 2. Frontend

Dans un second terminal, à la racine du projet :

```bat
copy .env.example .env
npm install
npm run dev
```

Ouvrez http://localhost:5173.

> Après chaque récupération du code (`git pull`), relancez `python manage.py migrate`.

## Fonctionnalités

- **Courriers** : enregistrement arrivée / départ, numéro chrono `ARR-AAAA-NNNN` / `DEP-AAAA-NNNN`
  (repart à 0001 chaque année, sans doublon), modification, pièces jointes (PDF, JPG, PNG, 10 Mo max).
- **Circuit de traitement** : suivi par étape, historique des changements de statut (date et auteur).
- **Registres officiels** : consultation, impression, export CSV, accusé de réception et bordereau
  de transmission (impression ou PDF depuis le navigateur).
- **Tableau de bord et statistiques** : indicateurs, retards, répartition par service.
- **Notifications** : dans l'application et par e-mail à l'affectation ; rappels des dossiers en retard.
- **Administration** : comptes et rôles, mots de passe provisoires, référentiel des services.

### Rôles

| Rôle | Voit | Peut | Statuts qu'il peut donner |
|---|---|---|---|
| Administrateur système | Tout | Tout, plus la gestion des comptes et des services | Tous |
| Secrétariat général / Bureau du courrier | Tous les courriers | Enregistrer, modifier, tenir les registres | Tous |
| DGS / Secrétaire municipal | Tous les courriers | Enregistrer, modifier, superviser | Tous sauf Reçu, Ventilé, Expédié, Archivé |
| Chef de service municipal | Les courriers de son service et ceux qui lui sont affectés | Enregistrer, modifier | En préparation, En cours de traitement, En attente de signature, En attente de réponse, Traité |
| Agent communal | Uniquement les dossiers qui lui sont affectés | Faire avancer, annoter | En cours de traitement, En attente de réponse, Traité |

Le statut initial (« Reçu » ou « En préparation ») est attribué automatiquement à l'enregistrement.
Ces règles sont appliquées par l'API (`backend/courriers/permissions.py`).

## E-mails et rappels

Sans `EMAIL_HOST` dans `backend\.env`, les e-mails sont affichés dans la console du serveur.
Pour un envoi réel, renseignez les variables `EMAIL_*` (voir `backend\.env.example`).

Rappel quotidien des dossiers en retard (une fois par jour et par dossier) :

```bat
python manage.py rappels_echeances --dry-run   :: simulation
python manage.py rappels_echeances
```

Planification sous Windows, chaque jour à 8 h :

```bat
schtasks /Create /SC DAILY /ST 08:00 /TN "Courrier360 rappels" /TR "python C:\chemin\vers\backend\manage.py rappels_echeances"
```

## Tests

```bat
cd backend
python manage.py test authentication courriers
```

Côté frontend : `npx tsc --noEmit` et `npx eslint app lib components/mairie`.
(`npm run build` et `npm test` utilisent des scripts bash et ne fonctionnent pas directement sous Windows.)

## Production

Dans `backend\.env` : `DJANGO_DEBUG=False`, une `DJANGO_SECRET_KEY` longue et aléatoire,
`DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` et, de préférence, `DB_ENGINE=postgres`.

- Les photos de profil (`backend\media\`) doivent être servies par le serveur web.
- Les pièces jointes (`backend\pieces_jointes\`) ne doivent **pas** être exposées : elles sont servies
  uniquement par l'API, après contrôle des droits.
- Pensez à sauvegarder la base de données et ces deux dossiers.
