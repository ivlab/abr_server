# notifier.py
#
# Notifies WebSockets when the state has been updated!
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

import json
import uuid
import socket
from threading import Lock
from django.conf import settings
import os
import logging

logger = logging.getLogger('django.server')

DEFAULT_ADDRESS = '0.0.0.0'
DEFAULT_PORT = 8001 # Need to know port ahead of time so Docker can forward it
LOCAL_ADDRESSES = {
    DEFAULT_ADDRESS,
    '127.0.0.1',
    'localhost'
}

class StateNotifier:
    def __init__(self):
        self._subscriber_lock = Lock()

        self.ws_subscribers = {}

    def subscribe_socket(self, client_ip):
        '''
            Socket (usually Unity) connection for sending notifications that the
            state was updated. We assign an address/port and return it over HTTP
            to the client who just subscribed.
        '''

        same_machine = client_ip in LOCAL_ADDRESSES
        ret = self.unity_connector.new_subscriber_info()

        # If we're on the same machine, add the local data path
        if same_machine:
            ret['localDataPath'] = os.path.realpath(settings.MEDIA_ROOT)
        return ret


    def subscribe_ws(self, ws):
        sub_id = uuid.uuid4()
        with self._subscriber_lock:
            self.ws_subscribers[str(sub_id)] = ws
        logger.debug('Subscribed notifier WebSocket')
        return sub_id

    def unsubscribe_ws(self, sub_id):
        with self._subscriber_lock:
            if str(sub_id) in self.ws_subscribers:
                del self.ws_subscribers[str(sub_id)]
        logger.debug('Unsubscribed notifier WebSocket')

    def notify(self, message):
        '''
            Send out a message to all connected parties on WebSocket
        '''
        message = json.dumps(message)

        for _id, ws in self.ws_subscribers.items():
            ws.send(message)

notifier = StateNotifier()