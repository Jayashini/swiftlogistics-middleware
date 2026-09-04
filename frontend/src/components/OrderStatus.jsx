import { useEffect } from "react";
import { useState } from "react";

import { getOrder } from "../api/orders";


function OrderStatus({
    orderId
}) {

    const [order, setOrder] =
        useState(null);


    useEffect(() => {

        if (!orderId) {
            return;
        }

        const interval =
            setInterval(
                async () => {

                    const result =
                        await getOrder(
                            orderId
                        );

                    setOrder(
                        result
                    );

                },
                3000
            );

        return () =>
            clearInterval(
                interval
            );

    }, [orderId]);


    if (!order) {

        return null;
    }


    return (

        <div>

            <h2>
                Order Status
            </h2>

            <p>
                Order ID:
                {order.id}
            </p>

            <p>
                Overall:
                {order.status}
            </p>

            <p>
                CMS:
                {order.cms_status}
            </p>

            <p>
                WMS:
                {order.wms_status}
            </p>

            <p>
                ROS:
                {order.ros_status}
            </p>

        </div>
    );
}


export default OrderStatus;