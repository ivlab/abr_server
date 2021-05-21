# unity_connector.py
#
# Copyright (c) 2020, University of Minnesota
# Author: Bridger Herman <herma582@umn.edu>
#
# Socket connection to Unity

import sys
import uuid
import time
import socket
import logging
from threading import Thread, Event, Lock
from queue import Queue

BUF_SIZE = 4096

logger = logging.getLogger('django.server')

class UnityConnector:
    def __init__(self, address, port):
        self.address = address
        self.port = port
        self.receiver_thread = None
        self.sender_thread = None
        self.listener_thread = None
        self.unity_socket = None
        self.running = True
        self.dead = False

        self.connections_lock = Lock()
        self.connections = []

        logger.info('Initializing Unity connection socket')
        self.unity_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

        self.subscribers = set()
        self.to_unity_queue = Queue()

        self.unity_socket.bind((self.address, self.port))
        self.unity_socket.listen()

        self.listener_thread = Thread(target=self._listen)
        self.receiver_thread = Thread(target=self._receiver)
        self.sender_thread = Thread(target=self._sender)
        self.listener_thread.start()
        self.receiver_thread.start()
        self.sender_thread.start()

    def get_port(self):
        return self.unity_socket.getsockname()[1]
    
    def get_address(self):
        return self.unity_socket.getsockname()[0]

    def subscribe(self, callback):
        logger.info('New client subscribed to Unity messages')
        self.subscribers.add(callback)
    
    def unsubscribe(self, callback):
        logger.info('A client disconnected from Unity messages')
        self.subscribers.remove(callback)

    def send(self, message):
        '''
            `message` is a bytestring of the JSON message. Only queues messages if there are connected Unity clients.
        '''
        if len(self.connections) > 0:
            self.to_unity_queue.put(message.encode('utf-8'))
        else:
            # Empty the queue otherwise
            while self.to_unity_queue.qsize() > 0:
                self.to_unity_queue.get()

    def _listen(self):
        try:
            while self.running:
                try:
                    conn, _addr = self.unity_socket.accept()
                    with self.connections_lock:
                        logger.info('New Unity connection: {}'.format(conn.getpeername()))
                        self.connections.append(conn)
                except OSError as e:
                    logger.debug(e)
                    if e.errno == 11: # EWOULDBLOCK
                        logger.error('No Unity connection')
                time.sleep(0.5)

        except OSError as e:
            err = 'Unable to start Unity connection socket'
            logger.error(err)

        except KeyboardInterrupt:
            self.running = False

    def _receiver(self):
        # Keep going until the server is killed
        # Ping every 0.1s. The sender will set self.connected_to_engine to true
        # if it successfully sent bytes to the engine.
        while self.running:
            cons_to_remove = []
            for conn in self.connections:
                # Wait for messages from the ABR engine, then forward them to the
                # web client
                try:
                    # Receive the length of the next message (an Int32, assumed to be
                    # big endian for network byte order)
                    length = int.from_bytes(conn.recv(4), 'big')

                    # Construct the whole message from the socket
                    bytes_read = 0
                    message = bytes()
                    while bytes_read < length:
                        received_bytes = conn.recv(min(length - bytes_read, BUF_SIZE))
                        if received_bytes:
                            bytes_read += len(received_bytes)
                            message += received_bytes

                    # Send message to all subscribing clients
                    for callback in self.subscribers:
                        callback(message)

                except BlockingIOError:
                    pass
                except OSError as e:
                    # The connection was closed
                    cons_to_remove.append(conn)
                except Exception as e:
                    logger.error('Did not receive from Unity: {}'.format(e))

            for conn in cons_to_remove:
                if conn in self.connections:
                    self.connections.remove(conn)
                    logger.info('Unsubscribed Unity connection {}, now {} connections'.format(conn.getpeername(), len(self.connections)))

            time.sleep(0.2)

        logger.info('Stopped receiver thread')


    def _sender(self):
        # Keep going until the server is killed
        # Ping every 0.1s.
        while self.running:
            cons_to_remove = []
            # Send messages from the design client to the ABR engine
            while not self.to_unity_queue.empty():
                for conn in self.connections:
                    try:
                        message = self.to_unity_queue.get()

                        # Send the message length to the engine
                        length = len(message)
                        total_bytes = 0
                        while total_bytes < 4:
                            # Assume big endian Int32 for network byte order
                            total_bytes += conn.send(int.to_bytes(length, 4, 'big'))

                        total_bytes = 0
                        while total_bytes < length:
                            total_bytes += conn.send(message)

                    except BlockingIOError:
                        pass
                    except OSError as e:
                        # The connection was closed
                        cons_to_remove.append(conn)
                    except Exception as e:
                        logger.error('Did not send to Unity: {}'.format(e))

            for conn in cons_to_remove:
                if conn in self.connections:
                    self.connections.remove(conn)
                    logger.info('Unsubscribed Unity connection {}, now {} connections'.format(conn.getpeername(), len(self.connections)))

            time.sleep(0.2)

        logger.info('Stopped sender thread')