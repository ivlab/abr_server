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

from channels.generic.websocket import WebsocketConsumer
import logging
import json
import uuid
import jsonschema
import requests
from django.conf import settings

from .notifier import notifier

logger = logging.getLogger('django.server')

class ClientMessenger(WebsocketConsumer):
    def __init__(self, *args, **kwargs):
        resp = requests.get(settings.WS_SEND_SCHEMA)
        if resp.status_code != 200:
            logger.error('Unable to load schema from url {0}'.format(settings.WS_SEND_SCHEMA))
            return
        self.outgoing_schema = resp.json()

        resp = requests.get(settings.WS_RECEIVE_SCHEMA)
        if resp.status_code != 200:
            logger.error('Unable to load schema from url {0}'.format(settings.WS_RECEIVE_SCHEMA))
            return
        self.incoming_schema = resp.json()

        # Dictionary of routes for {target -> {uuid1: fn, uuid2: fn, uuid3: fn}}
        # For example: {'state-thumbnail': [<function that saves a png>]}
        self.targets = {}

        self.id = None
        super().__init__(*args, **kwargs)

    def add_action(self, target_route, action_fn):
        '''Add an action to be performed when `target_route` receives a payload
        over the WebSocket. `action_fn` should take a single argument: the
        received message. Returns a new UUID associated with this action, can be
        used to remove from actions'''
        action_id = uuid.uuid4()
        target_actions = self.targets.get(target_route, {})
        target_actions[action_id] = action_fn
        return action_fn

    def remove_action(self, target_route, action_id):
        try:
            del self.targets[target_route][action_id]
            return True
        except KeyError:
            return False

    def connect(self):
        self.accept()
        logger.debug('WebSocket client connected')
        self.id = notifier.subscribe_ws(self)

    def disconnect(self, status):
        logger.debug('WebSocket client disconnected: {}'.format(status))
        notifier.unsubscribe_ws(self.id)

    def receive(self, text_data=None, bytes_data=None):
        default_ret = super().receive(text_data=text_data, bytes_data=bytes_data)
        incoming_json = json.loads(text_data)
        try:
            jsonschema.validate(incoming_json, self.incoming_schema)
        except jsonschema.ValidationError as e:
            logger.error('Incoming WebSocket JSON failed to validate: ' + str(e))

        # Perform all actions assocated with this particular route
        route = incoming_json['target']
        if route in self.targets:
            for action in self.targets[route]:
                action(incoming_json)
        else:
            logger.error('Incoming WebSocket route `{}` does not exist'.format(route))

        return default_ret

    def send_json(self, msg_json):
        try:
            jsonschema.validate(msg_json, self.outgoing_schema)
        except jsonschema.ValidationError as e:
            logger.error('Outgoing WebSocket JSON failed to validate: ' + str(e))
        else:
            self.send(json.dumps(msg_json))