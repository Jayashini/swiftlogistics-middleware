import json
import os

import pika


RABBITMQ_HOST = os.getenv(
    "RABBITMQ_HOST",
    "rabbitmq"
)


def publish_order(order):

    connection = pika.BlockingConnection(
        pika.ConnectionParameters(
            host=RABBITMQ_HOST
        )
    )

    channel = connection.channel()

    channel.queue_declare(
        queue="order_processing",
        durable=True
    )

    message = {
        "order_id": order.id,
        "client_name": order.client_name,
        "pickup_address": order.pickup_address,
        "delivery_address": order.delivery_address,
        "priority": order.priority
    }

    channel.basic_publish(
        exchange="",
        routing_key="order_processing",
        body=json.dumps(message),
        properties=pika.BasicProperties(
            delivery_mode=2
        )
    )

    connection.close()