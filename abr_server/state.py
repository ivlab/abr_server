import os
import sys
import jsonschema
import json
import time
import jsondiff
from copy import deepcopy
from django.conf import settings
from pathlib import Path
from threading import Lock

from .notifier import notifier

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

# Delete backup entries after a certain amount of time
BACKUP_DELETE_INTERVAL = 3600

class State():
    def __init__(self):
        # Make sure the backup location exists
        if not BACKUP_PATH.parent.exists():
            os.makedirs(BACKUP_PATH.parent)
        BACKUP_PATH.touch()
        self.backup_path = BACKUP_PATH.resolve()

        with open(STATE_SCHEMA) as scm:
            self.state_schema = json.load(scm)


        # Lock around state modifications
        self._state_lock = Lock()

        self._default_state = {
            'version': self.state_schema['properties']['version']['const']
        }

        # Initialize a blank starting state
        self._state = deepcopy(self._default_state)

        with self._state_lock:
            jsonschema.validate(self._state, self.state_schema)

        # Make the temporary state for pending modifications
        self._pending_state = deepcopy(self._state)

        # JSON diffs for undoing/redoing
        self.undo_stack = []
        self.redo_stack = []

    # Validate the pending state, back it up, populate the undo stack, etc.
    # Returns a string of any validation errors
    def validate_and_backup(self):
        try:
            jsonschema.validate(self._pending_state, self.state_schema)

            # If we've successfully validated the state, make a backup. Keep
            # up to a certain amount of backups if something crashes
            self.make_backup()

            # Save the new state
            # Also store a stack of undos, based on json diff
            # Clear the redo stack, because if we made a change to the state all
            # the previous redos are invalid
            with self._state_lock:
                state_diff = jsondiff.diff(self._pending_state, self._state, syntax='symmetric')
                self.undo_stack.append(state_diff)
                self.redo_stack.clear()
                self._state = deepcopy(self._pending_state)

            # Tell any connected clients that we've updated the state
            notifier.notify()

            return ''
        except jsonschema.ValidationError as e:
            path = '/'.join(e.path)
            return '{}: {}'.format(path, e.message)

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
        return self.validate_and_backup()

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

    def remove_path(self, item_path):
        if len(item_path) == 0:
            self._pending_state = self._default_state
        else:
            self._remove_path(self._pending_state, item_path)
        return self.validate_and_backup()

    def _remove_path(self, sub_state, sub_path_parts):
        if len(sub_path_parts) == 1:
            # Relies on dicts being mutable
            del sub_state[sub_path_parts[0]]
        else:
            root = sub_path_parts[0]
            rest = sub_path_parts[1:]
            if root in sub_state:
                self._remove_path(sub_state[root], rest)

    def remove_all(self, value):
        self._pending_state = self._remove_all(value, deepcopy(self._state))
        self.validate_and_backup()

    def _remove_all(self, value, sub_state):
        if len(sub_state) == 0:
            return sub_state
        else:
            if value in sub_state:
                del sub_state[value]
            for sub_value in sub_state:
                if isinstance(sub_state[sub_value], dict):
                    sub_state[sub_value] = self._remove_all(value, sub_state[sub_value])
            return sub_state

    def make_backup(self):
        '''
            Save a backup of the state to the backup file. Discard backups more
            than a certain amount.
        '''
        try:
            with open(self.backup_path, 'r') as backup_file:
                backup_json = json.load(backup_file)
        except FileNotFoundError:
            backup_json = {}
        except json.decoder.JSONDecodeError:
            backup_json = {}

        to_delete = set()
        for time_key in backup_json:
            t = float(time_key)
            if time.time() - t > BACKUP_DELETE_INTERVAL:
                to_delete.add(time_key)
        for time_key in to_delete:
            del backup_json[time_key]

        with self._state_lock:
            backup_json[time.time()] = json.dumps(self._state)

        with open(self.backup_path, 'w') as backup_file:
            json.dump(backup_json, backup_file)

    def restore_backup(self):
        '''
            Restore a backup from a file
        '''
        # Sort the backup entries and obtain the first (newest) one
        # backup_entries = list(sorted(map(lambda d: (float(d[0]), d[1]), backup_json.items()), key=lambda d: d[0]))
        # key_time, most_recent_diff = backup_entries[-1]
        raise NotImplementedError()

    def undo(self):
        '''
            Obtain the previous state diff and apply it. Uses JSON diff to
            minimize memory usage.
        '''

        try:
            diff_w_previous = self.undo_stack.pop()
        except IndexError:
            return 'Nothing to undo'

        with self._state_lock:
            undone_state = jsondiff.patch(self._state, diff_w_previous, syntax='symmetric')
            self._state = undone_state
        self.redo_stack.append(diff_w_previous)

        # Tell any connected clients that we've updated the state
        notifier.notify()

        return ''

    def redo(self):
        '''
            "Undo the undo" by unpatching with the latest item in the redo
            stack. jsondiff doesn't explicitly support unpatching so we go to
            the internals here
        '''

        try:
            diff_w_next = self.redo_stack.pop()
        except IndexError:
            return 'Nothing to redo'

        with self._state_lock:
            undone_state = jsondiff.JsonDiffer(syntax='symmetric').unpatch(self._state, diff_w_next)
            self._state = undone_state
        self.undo_stack.append(diff_w_next)

        # Tell any connected clients that we've updated the state
        notifier.notify()

        return ''

state = State()