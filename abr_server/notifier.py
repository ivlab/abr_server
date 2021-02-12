# notifier.py
#
# Copyright (c) 2021, University of Minnesota
# Author: Bridger Herman <herma582@umn.edu>
#
# Notifies Unity sockets and WebSockets when the state has been updated!
# Both Unity sockets and WebSockets must register themselves.

import uuid
from threading import Lock
from .unity_connector import UnityConnector

DEFAULT_ADDRESS = '127.0.0.1'

class StateNotifier:
    def __init__(self):
        self._subscriber_lock = Lock()

        with self._subscriber_lock:
            self.socket_subscribers = {}

    def subscribe_socket(self):
        '''
            Socket (usually Unity) connection for sending notifications that the
            state was updated. We assign an address/port and return it over HTTP
            to the client who just subscribed.
        '''
        # Let the system decide the port
        subscriber = UnityConnector(DEFAULT_ADDRESS, 0)
        port = subscriber.get_port()
        sub_id = uuid.uuid4()
        with self._subscriber_lock:
            self.socket_subscribers[str(sub_id)] = subscriber
        return {
            'address': DEFAULT_ADDRESS,
            'port': port,
            'uuid': sub_id
        }

    def unsubscribe_socket(self, uuid):
        with self._subscriber_lock:
            del self.socket_subscribers[str(uuid)]

    def notify(self, message='{"updated": true}'):
        for _id, connector in self.socket_subscribers.items():
            connector.send(message)

notifier = StateNotifier()