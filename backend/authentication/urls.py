from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginView,
    MeView,
    PasswordChangeView,
    UserListForAppView,
    UserViewSet,
)

router = DefaultRouter()
router.register("users", UserViewSet, basename="admin-users")

urlpatterns = [
    path("login/", LoginView.as_view(), name="auth-login"),
    path("refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("password/change/", PasswordChangeView.as_view(), name="auth-password-change"),
    path("accounts/", UserListForAppView.as_view(), name="auth-accounts"),
    *router.urls,
]
