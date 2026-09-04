import requests


ROS_URL = "http://mock-ros:8002"


def send_to_ros(order):

    payload = {
        "order_id": order["order_id"],
        "pickup_address": order["pickup_address"],
        "delivery_address": order["delivery_address"]
    }

    response = requests.post(
        f"{ROS_URL}/routes/optimize",
        json=payload
    )

    return response.json()