import json
from django.shortcuts import render, redirect
from django.http import HttpResponse, JsonResponse, Http404
from django.conf import settings
from pathlib import Path

from abr_server.state import state

# Create your views here.
def index(request):
    return render(request, 'abr_server.html')

def schema(request, schema_name):
    return redirect(settings.STATIC_URL + 'schemas/{}'.format(schema_name))

# State access and modification methods
def impressions(request):
    # Parse the URL into its sub-components (we know it'll be /state/* that gets us here)
    item_path_parts = request.path.split('/')
    item_path_parts = item_path_parts[3:]

    if request.method == 'GET':
        try:
            resp = state.get_path(item_path_parts)
            return JsonResponse({'data': resp})
        except:
            raise Http404('Unable to access state: {}'.format(request.path))
    elif request.method == 'PUT':
        try:
            success = state.set_path(item_path_parts, json.loads(request.body))
            if not success:
                raise Exception()
            return HttpResponse()
        except:
            raise Http404('Unable to update state: {}'.format(request.path))
