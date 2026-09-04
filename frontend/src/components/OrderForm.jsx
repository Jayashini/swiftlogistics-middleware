import { useState } from "react";

import { createOrder } from "../api/orders";


function OrderForm({ setOrderId }) {

    const [form, setForm] =
        useState({

            client_name: "",

            pickup_address: "",

            delivery_address: "",

            priority: "normal"
        });


    function handleChange(event) {

        setForm({

            ...form,

            [event.target.name]:
                event.target.value
        });
    }


    async function handleSubmit(event) {

        event.preventDefault();

        const result =
            await createOrder(form);

        setOrderId(
            result.order_id
        );
    }


    return (

        <form onSubmit={handleSubmit}>

            <h2>
                Submit Delivery Order
            </h2>

            <input
                name="client_name"
                placeholder="Client Name"
                onChange={handleChange}
            />

            <input
                name="pickup_address"
                placeholder="Pickup Address"
                onChange={handleChange}
            />

            <input
                name="delivery_address"
                placeholder="Delivery Address"
                onChange={handleChange}
            />

            <select
                name="priority"
                onChange={handleChange}
            >

                <option value="normal">
                    Normal
                </option>

                <option value="high">
                    High
                </option>

            </select>

            <button>
                Submit Order
            </button>

        </form>
    );
}


export default OrderForm;