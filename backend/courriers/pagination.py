from rest_framework.pagination import PageNumberPagination


class PaginationOptionnelle(PageNumberPagination):
    """Pagination activée seulement si `?page=` est fourni.

    Sans ce paramètre, la liste complète est renvoyée (comportement historique
    utilisé par le tableau de bord et les statistiques).
    """

    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 200

    def paginate_queryset(self, queryset, request, view=None):
        if self.page_query_param not in request.query_params:
            return None
        return super().paginate_queryset(queryset, request, view)
