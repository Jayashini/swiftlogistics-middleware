import socket
import json


HOST = "0.0.0.0"

PORT = 9000


server = socket.socket(
    socket.AF_INET,
    socket.SOCK_STREAM
)

server.bind(
    (HOST, PORT)
)

server.listen()


print(
    "WMS TCP Server running..."
)


while True:

    connection, address = server.accept()

    data = connection.recv(4096)

    message = json.loads(
        data.decode()
    )

    print(
        "WMS Received:",
        message
    )

    response = {
        "order_id": message["order_id"],
        "status": "PACKAGE_RECEIVED"
    }

    connection.send(
        json.dumps(response).encode()
    )

    connection.close()