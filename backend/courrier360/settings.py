"""
Django settings for Courrier 360 project.
"""

import os
import sys
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


def _load_env_file(path: Path) -> None:
    """Charge un fichier .env simple (CLE=valeur) sans dépendance externe.

    Les variables déjà définies dans l'environnement restent prioritaires.
    """
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("\"'"))


_load_env_file(BASE_DIR / ".env")

# Production par défaut : le mode debug doit être activé explicitement
# (DJANGO_DEBUG=True dans backend/.env pour le développement).
DEBUG = os.environ.get("DJANGO_DEBUG", "False").lower() in ("true", "1", "yes")

# La clé secrète est obligatoire hors développement.
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "")
if not SECRET_KEY:
    if not DEBUG:
        raise ImproperlyConfigured(
            "DJANGO_SECRET_KEY doit être défini en production (voir backend/.env.example)."
        )
    SECRET_KEY = "django-insecure-courrier360-dev-only"

ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,0.0.0.0").split(",")


# Application definition

INSTALLED_APPS = [
    "jazzmin",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third party
    "rest_framework",
    "corsheaders",
    # Local apps
    "authentication",
    "courriers",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "courrier360.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "courrier360.wsgi.application"


# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases

# SQLite par défaut (développement) ; PostgreSQL avec DB_ENGINE=postgres.
if os.environ.get("DB_ENGINE", "sqlite").lower() in ("postgres", "postgresql"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ.get("DB_NAME", "courrier360"),
            "USER": os.environ.get("DB_USER", "postgres"),
            "PASSWORD": os.environ.get("DB_PASSWORD", ""),
            "HOST": os.environ.get("DB_HOST", "localhost"),
            "PORT": os.environ.get("DB_PORT", "5432"),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }


# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Tests uniquement : hachage rapide (les vrais comptes gardent l'algorithme sécurisé).
if "test" in sys.argv:
    PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]


# Internationalization

LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "Africa/Dakar"
USE_I18N = True
USE_TZ = True


# Static files (CSS, JavaScript, Images)

STATIC_URL = "static/"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATIC_ROOT = BASE_DIR / "staticfiles"

# Fichiers envoyés par les utilisateurs (photos de profil)
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

# Pièces jointes des courriers : hors de MEDIA_ROOT, elles ne sont jamais
# servies directement mais seulement via l'API, après contrôle des droits.
PIECES_JOINTES_ROOT = Path(os.environ.get("PIECES_JOINTES_ROOT", BASE_DIR / "pieces_jointes"))
PIECE_JOINTE_TAILLE_MAX = 10 * 1024 * 1024  # 10 Mo
PIECE_JOINTE_EXTENSIONS = {"pdf", "jpg", "jpeg", "png"}


# ──────────────────────────────────────────────
# E-mails (notifications d'affectation et rappels d'échéance)
# ──────────────────────────────────────────────
# Sans EMAIL_HOST, les e-mails sont affichés dans la console (développement).
EMAIL_HOST = os.environ.get("EMAIL_HOST", "")
if EMAIL_HOST:
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
    EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
    EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
    EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "True").lower() in ("true", "1", "yes")
else:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
DEFAULT_FROM_EMAIL = os.environ.get(
    "DEFAULT_FROM_EMAIL", "Mairie de Ziguinchor <courrier@mairie-ziguinchor.sn>"
)
# Adresse de l'application, utilisée dans les liens des e-mails
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

# Durcissement appliqué hors développement (derrière un proxy HTTPS).
if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Default primary key field type

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ──────────────────────────────────────────────
# Custom User Model
# ──────────────────────────────────────────────

AUTH_USER_MODEL = "authentication.User"


# ──────────────────────────────────────────────
# Django REST Framework
# ──────────────────────────────────────────────

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

from datetime import timedelta  # noqa: E402

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
}


# ──────────────────────────────────────────────
# CORS — Allow the React frontend in development
# ──────────────────────────────────────────────

CORS_ALLOWED_ORIGINS = os.environ.get(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000",
).split(",")

CORS_ALLOW_CREDENTIALS = True


# ──────────────────────────────────────────────
# Jazzmin — interface d'administration
# ──────────────────────────────────────────────

JAZZMIN_SETTINGS = {
    "site_title": "Mairie de Ziguinchor",
    "site_header": "Mairie de Ziguinchor",
    "site_brand": "Mairie de Ziguinchor",
    "site_logo_classes": "img-circle",
    "welcome_sign": "Gestion du courrier — espace administration",
    "copyright": "Commune de Ziguinchor",
    "search_model": ["authentication.User", "courriers.Courrier", "courriers.Contact"],
    "topmenu_links": [
        {"name": "Accueil API", "url": "/", "new_window": False},
        {"name": "Documentation API", "url": "/api/", "new_window": False},
    ],
    "show_sidebar": True,
    "navigation_expanded": True,
    "order_with_respect_to": ["authentication", "courriers", "auth"],
    "icons": {
        "authentication.User": "fas fa-user-shield",
        "courriers.Courrier": "fas fa-envelope",
        "courriers.Contact": "fas fa-address-book",
        "courriers.Notification": "fas fa-bell",
        "auth.Group": "fas fa-users",
    },
    "default_icon_parents": "fas fa-folder",
    "default_icon_children": "fas fa-circle",
    "related_modal_active": True,
    "custom_css": "admin/css/courrier360.css",
    "use_google_fonts_c": True,
}

JAZZMIN_UI_TWEAKS = {
    "theme": "flatly",
    "dark_mode_theme": None,
    "navbar": "navbar-dark",
    "navbar_fixed": True,
    "footer_fixed": False,
    "sidebar_fixed": True,
    "sidebar": "sidebar-dark-primary",
    "accent": "accent-teal",
    "brand_colour": "navbar-primary",
    "button_classes": {
        "primary": "btn-primary",
        "secondary": "btn-secondary",
        "info": "btn-info",
        "warning": "btn-warning",
        "danger": "btn-danger",
        "success": "btn-success",
    },
}
