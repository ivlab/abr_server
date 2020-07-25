from django.urls import path, re_path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('schemas/<str:schema_name>/', views.schema),
    re_path('^state/*', views.modify_state),
    re_path('^data/$', views.data_list),
    path('data/<str:key_data>/', views.data_metadata),
]
