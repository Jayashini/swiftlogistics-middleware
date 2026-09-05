import { useState } from "react";
import OrderForm from "./components/OrderForm";
import OrderStatus from "./components/OrderStatus";

function App() {
    const [orderId, setOrderId] = useState(null);
    const [currentOrder, setCurrentOrder] = useState(null);

    return (
        <div>
            <header className="header">
                <h1 className="header-title">
                    <span>⚡</span> SwiftTrack Portal
                </h1>
                <p className="header-subtitle">
                    Heterogeneous Logistics Orchestration Middleware (CMS SOAP/XML | ROS REST/JSON | WMS TCP/IP)
                </p>
            </header>

            <main className="grid-container">
                <OrderForm
                    setOrderId={setOrderId}
                    setCurrentOrder={setCurrentOrder}
                />

                <OrderStatus
                    orderId={orderId}
                    currentOrder={currentOrder}
                    setCurrentOrder={setCurrentOrder}
                />
            </main>
        </div>
    );
}

export default App;