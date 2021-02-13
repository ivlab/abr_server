import os
import sys
import json
from django.shortcuts import render, redirect
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse, JsonResponse, Http404

from django.conf import settings
from pathlib import Path

from abr_server.state import state
from abr_server.notifier import notifier

# Create your views here.
def index(request):
    return HttpResponse('Nothing to see here; this URL is for computers')

def schema(request, schema_name):
    return redirect(settings.STATIC_URL + 'schemas/{}'.format(schema_name))

# State access and modification methods
def modify_state(request):
    # Parse the URL into its sub-components (we know it'll be /state/* that gets us here)
    item_path_parts = request.path.split('/')
    item_path_parts = item_path_parts[3:]

    if request.method == 'GET':
        resp = state.get_path(item_path_parts)
        return JsonResponse({'state': resp})
    elif request.method == 'PUT':
        err_message = state.set_path(item_path_parts, json.loads(request.body))
        if len(err_message) > 0:
            return HttpResponse(reason=err_message, status=400)
        else:
            return HttpResponse()

def undo(request):
    if request.method == 'POST':
        err_message = state.undo()
        if len(err_message) > 0:
            return HttpResponse(reason=err_message, status=400)
        else:
            return HttpResponse()
    else:
        return HttpResponse(reason='Method for undo must be POST', status=400)

def redo(request):
    if request.method == 'POST':
        err_message = state.redo()
        if len(err_message) > 0:
            return HttpResponse(reason=err_message, status=400)
        else:
            return HttpResponse()
    else:
        return HttpResponse(reason='Method for redo must be POST', status=400)

@csrf_exempt
def subscribe(request):
    if request.method == 'POST':
        resp = notifier.subscribe_socket()
        return JsonResponse(resp)
    else:
        return HttpResponse(reason='Method for subscribe must be POST', status=400)

@csrf_exempt
def unsubscribe(request, uuid):
    if request.method == 'POST':
        notifier.unsubscribe_socket(uuid)
        return HttpResponse('OK')
    else:
        return HttpResponse(reason='Method for subscribe must be POST', status=400)