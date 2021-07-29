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

from .notifier import notifier

logger = logging.getLogger('django.server')

class ClientMessenger(WebsocketConsumer):
    def __init__(self, *args, **kwargs):
        self.id = None
        super().__init__(*args, **kwargs)

    def connect(self):
        self.accept()
        logger.debug('WebSocket client connected')
        self.id = notifier.subscribe_ws(self)

    def disconnect(self, status):
        logger.debug('WebSocket client disconnected: {}'.format(status))
        notifier.unsubscribe_ws(self.id)