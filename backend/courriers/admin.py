from django.contrib import admin

from .models import Contact, Courrier, Notification


@admin.register(Courrier)
class CourrierAdmin(admin.ModelAdmin):
    list_display = ("numero", "sens", "date", "tiers", "service", "statut", "priorite", "echeance")
    list_filter = ("sens", "statut", "service", "priorite", "date")
    search_fields = ("numero", "tiers", "objet", "responsable")
    date_hierarchy = "date"
    list_per_page = 25
    readonly_fields = ("numero", "created_at", "updated_at")


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ("nom", "categorie", "email", "telephone")
    search_fields = ("nom", "email")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("destinataire", "courrier_numero", "lue", "date")
    list_filter = ("lue",)
