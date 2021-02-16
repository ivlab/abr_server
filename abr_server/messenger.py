from channels.generic.websocket import WebsocketConsumer
import time
import json
import logging
from threading import Thread, Event
from queue import Queue

from .notifier import notifier

logger = logging.getLogger('django.server')

class ClientMessenger(WebsocketConsumer):
    def __init__(self, *args, **kwargs):
        self.id = None
        super().__init__(*args, **kwargs)

    def connect(self):
        self.accept()
        logger.info('WebSocket client connected')
        self.id = notifier.subscribe_ws(self)

    def disconnect(self, status):
        logger.info('WebSocket client disconnected: {}'.format(status))
        notifier.unsubscribe_ws(self.id)