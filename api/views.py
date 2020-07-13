from django.shortcuts import render, redirect
from django.http import HttpResponse, JsonResponse, Http404
from django.conf import settings

from abr_server.state import state

# Create your views here.
def index(request):
    return render(request, 'abr_server.html')

def schema(request, schema_name):
    return redirect(settings.STATIC_URL + 'schemas/{}'.format(schema_name))

# Impression methods
def impressions(request, uuid=''):
    try:
        resp = state.get('impressions')
        return JsonResponse(resp)
    except KeyError:
        raise Http404('Impression does not exist: {}'.format(request.path))