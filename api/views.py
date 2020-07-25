import os
import sys
import json
from django.shortcuts import render, redirect
from django.http import HttpResponse, JsonResponse, Http404
from django.conf import settings
from pathlib import Path

from abr_server.state import state

UNITY_DATA_LOCATIONS = {
    'linux': Path('~/.config/unity3d/'),
    'darwin': Path('~/Library/Application Support/'),
    'win32': Path('~/AppData/LocalLow/'),
}

DATA_PATH = UNITY_DATA_LOCATIONS[sys.platform] \
    .joinpath('IVLab') \
    .joinpath('ABREngine') \
    .joinpath('media') \
    .joinpath('datasets') \
    .expanduser() \
    .resolve()

JSON_RESPONSE_NAME = 'data'

DATA_METADATA_CACHE = {}

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
        return JsonResponse({JSON_RESPONSE_NAME: resp})
    elif request.method == 'PUT':
        err_message = state.set_path(item_path_parts, json.loads(request.body))
        if len(err_message) > 0:
            return HttpResponse(reason=err_message, status=400)
        else:
            return HttpResponse()

# Data access (HACK FOR DATA SERVER)
def data_list(request):
    available_data = sorted(os.listdir(DATA_PATH))
    return JsonResponse({JSON_RESPONSE_NAME: list(available_data)})
def data_metadata(request, key_data):
    if key_data in DATA_METADATA_CACHE:
        ret_json = DATA_METADATA_CACHE[key_data]
    else:
        key_data_path = DATA_PATH.joinpath(key_data)
        ret_json = {
            'ScalarDataVariable': [],
            'VectorDataVariable': [],
        }
        with open(key_data_path) as fin:
            json_data = json.load(fin)
            scalar_names = json_data['scalarArrayNames']
            for _i, name in enumerate(scalar_names):
                ret_json['ScalarDataVariable'].append(name)
            vector_names = json_data['vectorArrayNames']
            for _i, name in enumerate(vector_names):
                ret_json['VectorDataVariable'].append(name)
        DATA_METADATA_CACHE[key_data] = ret_json
    return JsonResponse({JSON_RESPONSE_NAME: ret_json})