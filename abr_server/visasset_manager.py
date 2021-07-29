# visasset_manager.py
#
# Copyright (c) 2021, University of Minnesota
# Author: Bridger Herman <herma582@umn.edu>
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

import os
import json
import shutil
from django.conf import settings
import urllib3
import concurrent.futures

POOL_MANAGER = urllib3.PoolManager()

def remove_visasset(uuid):
    va_path = settings.VISASSET_PATH.joinpath(uuid)
    if va_path.exists():
        shutil.rmtree(va_path)


def download_visasset(uuid):
    va_path = settings.VISASSET_PATH.joinpath(uuid)
    artifact_json_path = va_path.joinpath(settings.VISASSET_JSON)

    va_url = settings.VISASSET_LIBRARY + uuid + '/'
    artifact_json_url = va_url + settings.VISASSET_JSON

    # Download the Artifact JSON
    failed = []
    success = check_exists_and_download(artifact_json_url, artifact_json_path)
    if not success:
        failed.append(artifact_json_path)
        return failed # cannot continue without artifact json

    with open(artifact_json_path) as fin:
        artifact_json = json.load(fin)

    # Download the Thumbnail
    preview_img = artifact_json['preview']
    preview_path = va_path.joinpath(preview_img)
    success = check_exists_and_download(va_url + preview_img, preview_path)
    if not success:
        failed.append(preview_path)

    # Get all of the files specified in artifactData
    all_files = []
    get_all_strings_from_json(artifact_json['artifactData'], all_files)

    # Download all files in a threaded form
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        download_tasks = {executor.submit(check_exists_and_download, va_url + f, va_path.joinpath(f)): f for f in all_files}
        for future in concurrent.futures.as_completed(download_tasks):
            name = download_tasks[future]
            if not future:
                failed.append(name)
    return failed

def check_exists_and_download(url, output_path):
    if not output_path.exists():
        success = download_file(url, output_path)
        return success
    else:
        return True

def download_file(url, output_path):
    resp = POOL_MANAGER.request('GET', url)
    if resp.status == 200:
        if not output_path.parent.exists():
            os.makedirs(output_path.parent)
        with open(output_path, 'wb') as fout:
            fout.write(resp.data)
        return True
    else:
        return False

# Recursively obtains all the string values from a JSON object
# Relies on lists being mutable
def get_all_strings_from_json(json_object, string_list):
    if isinstance(json_object, str):
        string_list.append(json_object)
    elif isinstance(json_object, list):
        for j in json_object:
            get_all_strings_from_json(j, string_list)
    elif isinstance(json_object, dict):
        for j in json_object.values():
            get_all_strings_from_json(j, string_list)