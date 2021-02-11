from django.urls import path
from django.conf.urls import url, include
from . import views

urlpatterns = [
    path('', views.compose),
    path('raw-editor', views.raw_state),
]