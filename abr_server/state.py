import jsonschema
import json
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
        self._state = {
            'impressions': [
                {
                    'uuid': 'bb4f75b2-03d5-45e7-a40d-b49a1ce572f0'
                }
            ]
        }

        # Populate the required fields
        self._state['version'] = self.state_schema['properties']['version']['const']
        self._state['spec'] = self.spec['version']

        try:
            assert all([f in self._state for f in self.state_schema['required']])
        except AssertionError:
            raise Exception('State must start out with at least required fields. Update the state schema or the state initialization.')

        self._state_lock = Lock()

    def get_path(self, item_path):
        return self._get_path(self._state, item_path)
        
    def _get_path(self, sub_state, sub_path_parts):
        if len(sub_path_parts) == 1:
            return sub_state[sub_path_parts[0]]
        else:
            root = sub_path_parts[0]
            rest = sub_path_parts[1:]
            return self._get_path(sub_state[root], rest)

    # def set_path(self, item_path, item):
    #     item_path_parts = Path(item_path).parts
    #     with self._state_lock:
    #         tmp_access = self._state[item_path_parts[0]]
    #         for level in range(1, len(item_path_parts)):
    #             tmp_access = tmp_access[item_path_parts[level]]


state = State()