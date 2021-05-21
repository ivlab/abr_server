from django.urls import path, re_path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('schemas/<str:schema_name>/', views.schema),
    path('undo', views.undo),
    path('redo', views.redo),
    re_path('^state/*', views.modify_state),
    re_path('^remove-path/*', views.remove_path),
    path('remove/<str:value>', views.remove),
    path('visassets', views.list_visassets),
    path('datasets', views.list_datasets),
    path('download-visasset/<str:uuid>', views.download_visasset),
    path('remove-visasset/<str:uuid>', views.remove_visasset),
    path('histogram/<str:org_name>/<str:dataset_name>/KeyData/<str:key_data_name>/<str:variable_label>', views.get_histogram),
]
