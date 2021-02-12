from django.urls import path, re_path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('schemas/<str:schema_name>/', views.schema),
    path('undo', views.undo),
    path('redo', views.redo),
    re_path('^state/*', views.modify_state),
    path('subscribe', views.subscribe),
    path('unsubscribe', views.unsubscribe),
]
