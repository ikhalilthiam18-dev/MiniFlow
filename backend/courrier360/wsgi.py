"""
WSGI config for Courrier 360 project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "courrier360.settings")

application = get_wsgi_application()
