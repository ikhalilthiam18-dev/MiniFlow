"""
URL configuration for Courrier 360 project.
"""

from django.contrib import admin
from django.urls import include, path

from .views import api_home

admin.site.site_header = "Mairie de Ziguinchor — Administration"
admin.site.site_title = "Mairie de Ziguinchor"
admin.site.index_title = "Bureau du courrier"

urlpatterns = [
    path("", api_home, name="api-home"),
    path("admin/", admin.site.urls),
    path("api/auth/", include("authentication.urls")),
    path("api/", include("courriers.urls")),
]
