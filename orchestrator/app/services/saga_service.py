def compensate_cms(order_id):

    print(
        f"Compensating CMS order {order_id}"
    )


def compensate_wms(order_id):

    print(
        f"Compensating WMS order {order_id}"
    )


def handle_failure(
    order_id,
    completed_steps
):

    if "WMS" in completed_steps:

        compensate_wms(
            order_id
        )

    if "CMS" in completed_steps:

        compensate_cms(
            order_id
        )