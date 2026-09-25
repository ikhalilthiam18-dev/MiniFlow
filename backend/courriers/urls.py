from rest_framework.routers import DefaultRouter

from .views import ContactViewSet, CourrierViewSet, NotificationViewSet

router = DefaultRouter()
router.register("courriers", CourrierViewSet, basename="courrier")
router.register("contacts", ContactViewSet, basename="contact")
router.register("notifications", NotificationViewSet, basename="notification")

urlpatterns = router.urls
