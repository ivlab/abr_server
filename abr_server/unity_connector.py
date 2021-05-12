# unity_connector.py
#
# Copyright (c) 2020, University of Minnesota
# Author: Bridger Herman <herma582@umn.edu>
#
# Socket connection to Unity

import sys
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

    def subscribe(self, callback):
        logger.info('New client subscribed to Unity messages')
        self.subscribers.add(callback)
    
    def unsubscribe(self, callback):
        logger.info('A client disconnected from Unity messages')
        self.subscribers.remove(callback)

    def send(self, message):
        '''
            `message` is a bytestring of the JSON message
        '''
        self.to_unity_queue.put(message.encode('utf-8'))

    def _listen(self):
        try:
            while self.running:
                try:
                    conn, _addr = self.unity_socket.accept()
                    with self.connections_lock:
                        logger.info('New Unity connection')
                        self.connections.append(conn)
                except OSError as e:
                    if e.errno == 11: # EWOULDBLOCK
                        logger.error('No Unity connection')
                time.sleep(0.1)

        except OSError as e:
            err = 'Unable to start Unity connection socket'
            logger.error(err)

        except KeyboardInterrupt:
            self.running = False

    def _receiver(self):
        # Keep going until the server is killed
        # Ping every 1s. The sender will set self.connected_to_engine to true
        # if it successfully sent bytes to the engine.
        while self.running:
            for conn in self.connections:
                # Wait for messages from the ABR engine, then forward them to the
                # web client
                try:
                    # Receive the length of the next message (an Int32, assumed to be
                    # little endian)
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
                    if e.errno == 32: # Broken pipe, remove from subscribers
                        self.running = False
                        self.dead = True
                except Exception:
                    logger.error('Did not send to Unity: {}'.format(e))

            time.sleep(1)
        
        logger.info('Stopped receiver thread')


    def _sender(self):
        # Keep going until the server is killed
        # Ping every 1s.
        while self.running:
            # Send messages from the design client to the ABR engine
            while not self.to_unity_queue.empty():
                for conn in self.connections:
                    try:
                        message = self.to_unity_queue.get()

                        # Send the message length to the engine
                        length = len(message)
                        total_bytes = 0
                        while total_bytes < 4:
                            total_bytes += conn.send(int.to_bytes(length, 4, 'big'))

                        total_bytes = 0
                        while total_bytes < length:
                            total_bytes += conn.send(message)

                    except BlockingIOError:
                        pass
                    except OSError as e:
                        if e.errno == 32: # Broken pipe, remove from subscribers
                            self.running = False
                            self.dead = True
                    except Exception:
                        logger.error('Did not send to Unity: {}'.format(e))

            time.sleep(1)

        logger.info('Stopped sender thread')