import json
import os
import time

import pika

from adapters.cms_adapter import send_to_cms
from adapters.ros_adapter import send_to_ros
from adapters.wms_adapter import send_to_wms


RABBITMQ_HOST = os.getenv(
    "RABBITMQ_HOST",
    "rabbitmq"
)


def process_order(
    channel,
    method,
    properties,
    body
):

    order = json.loads(
        body.decode()
    )

    print(
        "Processing order:",
        order
    )

    try:

        cms_result = send_to_cms(order)

        print(
            "CMS Result:",
            cms_result
        )

        wms_result = send_to_wms(order)

        print(
            "WMS Result:",
            wms_result
        )

        ros_result = send_to_ros(order)

        print(
            "ROS Result:",
            ros_result
        )

        print(
            "Order processed successfully"
        )

        channel.basic_ack(
            delivery_tag=method.delivery_tag
        )

    except Exception as error:

        print(
            "Processing failed:",
            error
        )

        channel.basic_nack(
            delivery_tag=method.delivery_tag,
            requeue=True
        )


while True:

    try:

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

        channel.basic_qos(
            prefetch_count=1
        )

        channel.basic_consume(
            queue="order_processing",
            on_message_callback=process_order
        )

        print(
            "Waiting for orders..."
        )

        channel.start_consuming()

    except Exception:

        print(
            "RabbitMQ unavailable. Retrying..."
        )

        time.sleep(5)