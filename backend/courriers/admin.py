from django.contrib import admin

from .models import Compteur, Contact, Courrier, HistoriqueStatut, Notification, PieceJointe


class HistoriqueStatutInline(admin.TabularInline):
    model = HistoriqueStatut
    extra = 0
    can_delete = False
    readonly_fields = ("date", "ancien_statut", "nouveau_statut", "auteur_nom")
    fields = readonly_fields

    def has_add_permission(self, request, obj=None):
        return False


class PieceJointeInline(admin.TabularInline):
    model = PieceJointe
    extra = 0
    readonly_fields = ("nom", "taille", "ajoute_par_nom", "date")
    fields = readonly_fields

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Courrier)
class CourrierAdmin(admin.ModelAdmin):
    inlines = [HistoriqueStatutInline, PieceJointeInline]
    list_display = ("numero", "sens", "date", "tiers", "service", "statut", "priorite", "echeance")
    list_filter = ("sens", "statut", "service", "priorite", "date")
    search_fields = ("numero", "tiers", "objet", "responsable")
    date_hierarchy = "date"
    list_per_page = 25
    readonly_fields = ("numero", "agent", "created_at", "updated_at")


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ("nom", "categorie", "email", "telephone")
    search_fields = ("nom", "email")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("destinataire", "courrier_numero", "lue", "date")
    list_filter = ("lue",)


@admin.register(Compteur)
class CompteurAdmin(admin.ModelAdmin):
    list_display = ("prefixe", "annee", "dernier")
    readonly_fields = ("prefixe", "annee", "dernier")
