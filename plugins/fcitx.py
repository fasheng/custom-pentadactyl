#!/bin/env python
# -*- coding: utf-8 -*-
import os
import sys
import socket
import struct
import tempfile


FCITX_STATUS = struct.pack('i', 0)
FCITX_OPEN = struct.pack('i', 1 | (1 << 16))
FCITX_CLOSE = struct.pack('i', 1)
INT_SIZE = struct.calcsize('i')

fcitxsocketfile = '%s/fcitx-socket-%s' % (tempfile.gettempdir(),
    os.environ.get('DISPLAY'))


def fcitxtalk(command=None):
    sock = socket.socket(socket.AF_UNIX)
    try:
        sock.connect(fcitxsocketfile)
    except socket.error:
        print('socket connection error')
        return
    try:
        if not command:
            sock.send(FCITX_STATUS)
            status = struct.unpack('i', sock.recv(INT_SIZE))[0]
            print(status)
            return status
        elif command == 'c':
            sock.send(FCITX_CLOSE)
        elif command == 'o':
            sock.send(FCITX_OPEN)
        else:
            raise ValueError('unknown fcitx command')
    finally:
        sock.close()


if __name__ == "__main__":
    if len(sys.argv) == 1:
        command = None
    else:
        command = sys.argv[1]

    fcitxtalk(command)
