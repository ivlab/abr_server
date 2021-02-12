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

        self.socket_subscribers = {}
        self.ws_subscribers = {}

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

    def subscribe_ws(self, ws):
        sub_id = uuid.uuid4()
        with self._subscriber_lock:
            self.ws_subscribers[str(sub_id)] = ws
        return sub_id

    def unsubscribe_ws(self, sub_id):
        with self._subscriber_lock:
            del self.ws_subscribers[str(sub_id)]
        print('Unsubscribed notifier ws')

    def unsubscribe_socket(self, sub_id):
        with self._subscriber_lock:
            del self.socket_subscribers[str(sub_id)]
        print('Unsubscribed notifier socket')

    def notify(self, message='{"updated": true}'):
        '''
            Send out a message to all connected parties
        '''
        remove_conns = set()
        for uid, connector in self.socket_subscribers.items():
            if not connector.dead:
                connector.send(message)
            else:
                remove_conns.add(uid)
        for sid in remove_conns:
            self.unsubscribe_socket(sid)
        for _id, ws in self.ws_subscribers.items():
            ws.send(message)

notifier = StateNotifier()