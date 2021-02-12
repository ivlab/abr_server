import os
import sys
import jsonschema
import json
import time
from jsondiff import diff, patch
from copy import deepcopy
from django.conf import settings
from pathlib import Path
from threading import Lock

SCHEMA_PATH = Path(settings.STATIC_ROOT).joinpath('schemas')
STATE_SCHEMA = SCHEMA_PATH.joinpath('ABRSchema_0-2-0.json')

BACKUP_LOCATIONS = {
    'linux': Path('~/.config/abr/'),
    'darwin': Path('~/Library/Application Support/abr'),
    'win32': Path('~/AppData/LocalLow/abr'),
}

BACKUP_PATH = BACKUP_LOCATIONS[sys.platform] \
    .joinpath('abr_backup.json') \
    .expanduser()

class State():
    def __init__(self):
        # Make sure the backup location exists
        if not BACKUP_PATH.exists():
            os.makedirs(BACKUP_PATH.parent)
            BACKUP_PATH.touch()
        self.backup_path = BACKUP_PATH.resolve()

        with open(STATE_SCHEMA) as scm:
            self.state_schema = json.load(scm)

        # Initialize a blank starting state
        self._state = {}

        # Lock around state modifications
        self._state_lock = Lock()

        # Populate the required fields
        self._state['version'] = self.state_schema['properties']['version']['const']

        with self._state_lock:
            jsonschema.validate(self._state, self.state_schema)

        # Make the temporary state for pending modifications
        self._pending_state = deepcopy(self._state)


    # CRUD operations
    def get_path(self, item_path):
        with self._state_lock:
            try:
                return self._get_path(self._state, item_path)
            except KeyError:
                return None
        
    def _get_path(self, sub_state, sub_path_parts):
        if len(sub_path_parts) == 0:
            return sub_state
        elif len(sub_path_parts) == 1:
            return sub_state[sub_path_parts[0]]
        else:
            root = sub_path_parts[0]
            rest = sub_path_parts[1:]
            return self._get_path(sub_state[root], rest)

    def set_path(self, item_path, new_value):
        if len(item_path) == 0:
            self._pending_state = new_value
        else:
            self._set_path(self._pending_state, item_path, new_value)
        try:
            jsonschema.validate(self._pending_state, self.state_schema)

            # If we've successfully validated the state, make a backup. Keep
            # up to a certain amount of backups so we can undo if necessary
            self.make_backup()

            with self._state_lock:
                self._state = deepcopy(self._pending_state)

            return ''
        except jsonschema.ValidationError as e:
            path = '/'.join(e.path)
            return '{}: {}'.format(path, e.message)

    def _set_path(self, sub_state, sub_path_parts, new_value):
        if len(sub_path_parts) == 1:
            # Relies on dicts being mutable
            sub_state[sub_path_parts[0]] = new_value
        else:
            root = sub_path_parts[0]
            rest = sub_path_parts[1:]

            # Assuming everything we're assigning will be an object
            if root not in sub_state:
                sub_state[root] = {}

            self._set_path(sub_state[root], rest, new_value)

    def make_backup(self):
        '''
            Save a backup of the state using json-diff to the backup file.
            Discard backups more than 2 hours old. The diff is backwards-facing,
            for instance if we've just added an impression to 'impressions', the
            diff will be {delete: 'impressions'}.
        '''
        try:
            with open(self.backup_path, 'r') as backup_file:
                backup_json = json.load(backup_file)
        except FileNotFoundError:
            backup_json = {}

        with self._state_lock:
            state_diff = diff(self._pending_state, self._state, dump=True)
        backup_json[time.time()] = json.dumps(state_diff)

        with open(self.backup_path, 'w') as backup_file:
            json.dump(backup_json, backup_file)

state = State()