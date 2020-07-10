from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('schemas/<str:schema_name>', views.schema),
]
