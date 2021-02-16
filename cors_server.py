#!/usr/bin/env python3

# https://stackoverflow.com/a/21957017

from http.server import HTTPServer, SimpleHTTPRequestHandler, test
import sys

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        SimpleHTTPRequestHandler.end_headers(self)

if __name__ == '__main__':
    try:
        bind = sys.argv[1]
    except:
        bind = '0.0.0.0'
    try:
        port = int(sys.argv[2])
    except:
        port = 8001
    address = (bind, port)
    httpd = HTTPServer(address, CORSRequestHandler)
    print('Starting CORS-enabled server, address', address)
    httpd.serve_forever()