import requests


CMS_URL = "http://mock-cms:8001"


def send_to_cms(order):

    response = requests.post(
        f"{CMS_URL}/soap/create-order",
        params={
            "order_id": order["order_id"]
        }
    )

    return response.text