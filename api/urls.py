from django.conf.urls import url, include
from rest_framework.urlpatterns import format_suffix_patterns
from .views import CreateViewImpression, DetailsViewImpression, CreateViewInputValue, DetailsViewInputValue

urlpatterns = {
    url(r'^impressions/$', CreateViewImpression.as_view(), name='create'),
    url(r'^impressions/(?P<pk>([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}){1})/$', DetailsViewImpression.as_view(), name='details'),
    url(r'^input-values/$', CreateViewInputValue.as_view(), name='create'),
    url(r'^input-values/(?P<pk>[0-9]+)/$', DetailsViewInputValue.as_view(), name='details'),
}

urlpatterns = format_suffix_patterns(urlpatterns)