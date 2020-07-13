import jsonschema
import json
from copy import deepcopy
from django.conf import settings
from pathlib import Path
from threading import Lock

SCHEMA_PATH = Path(settings.STATIC_ROOT).joinpath('schemas')
STATE_SCHEMA = SCHEMA_PATH.joinpath('model.json')
SPEC_SCHEMA = SCHEMA_PATH.joinpath('spec.json')
SPEC = SCHEMA_PATH.joinpath('..').joinpath('testSpec.json')

class State():
    def __init__(self):
        with open(SPEC_SCHEMA) as scm:
            self.spec_schema = json.load(scm)
        with open(SPEC) as s:
            self.spec = json.load(s)

        # Make sure the spec is valid before moving on
        jsonschema.validate(self.spec, self.spec_schema)

        with open(STATE_SCHEMA) as scm:
            self.state_schema = json.load(scm)

        # Initialize a blank starting state
        self._state = {}

        # Populate the required fields
        self._state['version'] = self.state_schema['properties']['version']['const']
        self._state['spec'] = self.spec['version']

        try:
            assert all([f in self._state for f in self.state_schema['required']])
        except AssertionError:
            raise Exception('State must start out with at least required fields. Update the state schema or the state initialization.')

        self._state_lock = Lock()

    # CRUD operations
    def get_path(self, item_path):
        with self._state_lock:
            return self._get_path(self._state, item_path)
        
    def _get_path(self, sub_state, sub_path_parts):
        if len(sub_path_parts) == 1:
            return sub_state[sub_path_parts[0]]
        else:
            root = sub_path_parts[0]
            rest = sub_path_parts[1:]
            return self._get_path(sub_state[root], rest)

    def set_path(self, item_path, new_value):
        with self._state_lock:
            backup = deepcopy(self._state)
            self._set_path(self._state, item_path, new_value)
            try:
                jsonschema.validate(backup, self.state_schema)
                return True
            except jsonschema.ValidationError:
                self._state = backup
                return False



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