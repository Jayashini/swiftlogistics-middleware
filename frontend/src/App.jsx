import { useState } from "react";

import OrderForm
    from "./components/OrderForm";

import OrderStatus
    from "./components/OrderStatus";


function App() {

    const [orderId, setOrderId] =
        useState(null);


    return (

        <div>

            <h1>
                SwiftTrack
            </h1>

            <OrderForm
                setOrderId={setOrderId}
            />

            <OrderStatus
                orderId={orderId}
            />

        </div>
    );
}


export default App;