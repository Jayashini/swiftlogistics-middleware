import socket
import json


WMS_HOST = "mock-wms"

WMS_PORT = 9000


def send_to_wms(order):

    client = socket.socket(
        socket.AF_INET,
        socket.SOCK_STREAM
    )

    client.connect(
        (WMS_HOST, WMS_PORT)
    )

    client.send(
        json.dumps(order).encode()
    )

    response = client.recv(4096)

    client.close()

    return json.loads(
        response.decode()
    )