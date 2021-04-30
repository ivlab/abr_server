import os
import sys
import json
import fnmatch
from django.shortcuts import render, redirect
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse, JsonResponse, Http404

from django.conf import settings
from pathlib import Path

from abr_server.state import state
from abr_server.notifier import notifier, LOCAL_ADDRESSES
from abr_server import visasset_manager

VISASSET_CACHE = {}
DATA_CACHE = {}

# Create your views here.
def index(request):
    return HttpResponse('Nothing to see here; this URL is for computers')

def schema(request, schema_name):
    return redirect(settings.STATIC_URL + 'schemas/{}'.format(schema_name))

# State access and modification methods
@csrf_exempt
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
            return HttpResponse(err_message, status=400)
        else:
            return HttpResponse()

@csrf_exempt
def remove_path(request):
    # Parse the URL into its sub-components (we know it'll be /remove-path/* that gets us here)
    item_path_parts = request.path.split('/')
    item_path_parts = item_path_parts[3:]
    item_path_parts = [p for p in item_path_parts if len(p) > 0]

    if request.method == 'DELETE':
        state.remove_path(item_path_parts)
        return HttpResponse('OK')
    else:
        return HttpResponse('Method for remove must be DELETE', status=400)

@csrf_exempt
def remove(request, value):
    if request.method == 'DELETE':
        state.remove_all(value)
        return HttpResponse('OK')
    else:
        return HttpResponse('Method for remove must be DELETE', status=400)

@csrf_exempt
def undo(request):
    if request.method == 'POST':
        err_message = state.undo()
        if len(err_message) > 0:
            return HttpResponse(err_message, status=400)
        else:
            return HttpResponse()
    else:
        return HttpResponse('Method for undo must be POST', status=400)

@csrf_exempt
def redo(request):
    if request.method == 'POST':
        err_message = state.redo()
        if len(err_message) > 0:
            return HttpResponse(err_message, status=400)
        else:
            return HttpResponse()
    else:
        return HttpResponse('Method for redo must be POST', status=400)

@csrf_exempt
def subscribe(request):
    # TODO: add authentication
    # https://en.wikipedia.org/wiki/Basic_access_authentication
    if request.method == 'POST':
        client_ip = get_client_ip(request)
        same_machine = client_ip in LOCAL_ADDRESSES
        resp = notifier.subscribe_socket(same_machine)
        return JsonResponse(resp)
    else:
        return HttpResponse('Method for subscribe must be POST', status=400)

@csrf_exempt
def unsubscribe(request, uuid):
    if request.method == 'POST':
        notifier.unsubscribe_socket(uuid)
        return HttpResponse('OK')
    else:
        return HttpResponse('Method for subscribe must be POST', status=400)

# https://stackoverflow.com/a/4581997
def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip



def list_visassets(request):
    visasset_list = os.listdir(settings.VISASSET_PATH)
    visasset_list.sort()
    for va in visasset_list:
        if va not in VISASSET_CACHE:
            artifact_json_path = settings.VISASSET_PATH.joinpath(va).joinpath('artifact.json')
            if artifact_json_path.exists():
                with open(artifact_json_path) as fin:
                    VISASSET_CACHE[va] = json.load(fin)
    return JsonResponse(VISASSET_CACHE)

def list_datasets(request):
    for org in os.listdir(settings.DATASET_PATH):
        if org in DATA_CACHE:
            org_data = DATA_CACHE[org]
        else:
            org_data = {}
        org_disk_path = settings.DATASET_PATH.joinpath(org)
        for dataset in os.listdir(org_disk_path):
            dataset_disk_path = org_disk_path.joinpath(dataset).joinpath('KeyData')
            if dataset in org_data:
                keydata_dict = org_data[dataset]
            else:
                keydata_dict = {}
            for keydata_file in os.listdir(dataset_disk_path):
                keydata_path = dataset_disk_path.joinpath(keydata_file)
                keydata_name = keydata_path.stem
                # Only add keydata that aren't already there
                if keydata_name in keydata_dict:
                    continue
                # Retrieve the metadata and put it in the DATA_CACHE
                if fnmatch.fnmatch(keydata_file, '*.json'):
                    with open(keydata_path) as json_header:
                        keydata_dict[keydata_name] = json.load(json_header)
            org_data[dataset] = keydata_dict
        DATA_CACHE[org] = org_data
    return JsonResponse(DATA_CACHE)



@csrf_exempt
def download_visasset(request, uuid):
    if request.method == 'POST':
        failed_downloads = visasset_manager.download_visasset(uuid)
        if len(failed_downloads) == 0:
            notifier.notify({ 'target': 'CacheUpdate-visassets' })
            return HttpResponse('Downloaded files', status=200)
        else:
            return HttpResponse('Failed to download files: {}'.format(failed_downloads), status=500)
    else:
        return HttpResponse('Method for download must be POST', status=400)

@csrf_exempt
def remove_visasset(request, uuid):
    if request.method == 'DELETE':
        visasset_manager.remove_visasset(uuid)
        notifier.notify({ 'target': 'CacheUpdate-visassets' })
        return HttpResponse()
    else:
        return HttpResponse('Method for download must be DELETE', status=400)