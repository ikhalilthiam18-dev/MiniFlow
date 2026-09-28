from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import Service, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ("nom",)
    list_display = ("nom", "email", "role", "service", "actif", "is_staff", "date_joined")
    list_filter = ("role", "actif", "service", "is_staff")
    search_fields = ("email", "nom", "service")
    list_per_page = 25
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Profil municipal", {"fields": ("nom", "role", "service", "actif", "photo")}),
        ("Permissions", {"fields": ("is_staff", "is_superuser", "groups", "user_permissions")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "nom", "role", "service", "password1", "password2"),
            },
        ),
    )


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("nom", "actif")
    list_filter = ("actif",)
    search_fields = ("nom",)
