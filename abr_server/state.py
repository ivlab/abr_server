import jsonschema
import json
from copy import deepcopy
from django.conf import settings
from pathlib import Path
from threading import Lock

SCHEMA_PATH = Path(settings.STATIC_ROOT).joinpath('schemas')
STATE_SCHEMA = SCHEMA_PATH.joinpath('model.json')

class State():
    def __init__(self):
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
        if len(sub_path_parts) == 1:
            return sub_state[sub_path_parts[0]]
        else:
            root = sub_path_parts[0]
            rest = sub_path_parts[1:]
            return self._get_path(sub_state[root], rest)

    def set_path(self, item_path, new_value):
        self._set_path(self._pending_state, item_path, new_value)
        try:
            jsonschema.validate(self._pending_state, self.state_schema)
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

            # TODO: assuming we're creating an object for now
            if root not in sub_state:
                sub_state[root] = {}

            self._set_path(sub_state[root], rest, new_value)


state = State()