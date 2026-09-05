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


import requests

ORCHESTRATOR_URL = os.getenv("ORCHESTRATOR_URL", "http://orchestrator:8000")


def update_status(order_id, status, cms_status=None, ros_status=None, wms_status=None, route_info=None):
    payload = {"status": status}
    if cms_status:
        payload["cms_status"] = cms_status
    if ros_status:
        payload["ros_status"] = ros_status
    if wms_status:
        payload["wms_status"] = wms_status
    if route_info:
        payload["route_info"] = route_info

    try:
        requests.patch(f"{ORCHESTRATOR_URL}/orders/{order_id}/status", json=payload, timeout=5)
    except Exception as exc:
        print(f"Failed to update status for order {order_id}: {exc}")


def process_order(
    channel,
    method,
    properties,
    body
):
    order = json.loads(body.decode())
    order_id = order.get("order_id")
    print(f"Processing order {order_id}: {order}")

    try:
        # Step 1: CMS Processing (SOAP/XML)
        time.sleep(2)
        cms_result = send_to_cms(order)
        print("CMS Result:", cms_result)
        update_status(order_id, status="CMS_ACCEPTED", cms_status="SUCCESS")

        # Step 2: ROS Processing (REST/JSON)
        time.sleep(2.5)
        ros_result = send_to_ros(order)
        print("ROS Result:", ros_result)
        route = ros_result.get("route", {}) if isinstance(ros_result, dict) else {}
        sequence = route.get("sequence", [order.get("pickup_address"), order.get("delivery_address")])
        driver = route.get("driver", "Driver-001")
        route_str = f"Driver: {driver} | Route: {' -> '.join(sequence)}"
        update_status(order_id, status="ROUTE_CALCULATED", ros_status="SUCCESS", route_info=route_str)

        # Step 3: WMS Processing (TCP/IP)
        time.sleep(2.5)
        wms_result = send_to_wms(order)
        print("WMS Result:", wms_result)
        update_status(order_id, status="WMS_RECEIVED", wms_status="SUCCESS")

        # Step 4: Package Loaded
        time.sleep(3)
        update_status(order_id, status="PACKAGE_LOADED")

        # Step 5: Out for Delivery
        time.sleep(3)
        update_status(order_id, status="OUT_FOR_DELIVERY")

        # Step 6: Delivered
        time.sleep(3)
        update_status(order_id, status="DELIVERED")

        print(f"Order {order_id} fully processed")
        channel.basic_ack(delivery_tag=method.delivery_tag)

    except Exception as error:
        print(f"Processing failed for order {order_id}: {error}")
        update_status(order_id, status="PROCESSING_FAILED")
        channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


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