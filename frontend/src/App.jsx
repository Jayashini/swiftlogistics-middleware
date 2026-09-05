import { useState } from "react";
import OrderForm from "./components/OrderForm";
import OrderStatus from "./components/OrderStatus";

function App() {
    const [orderId, setOrderId] = useState(null);
    const [currentOrder, setCurrentOrder] = useState(null);

    return (
        <div>
            <header className="app-header">
                <h1 className="app-title">
                    SwiftTrack Logistics Dispatch
                </h1>
                <p className="app-subtitle">
                    Create on-demand courier orders or check real-time package delivery milestones across the active grid.
                </p>
            </header>

            <main className="app-grid">
                <OrderForm
                    setOrderId={setOrderId}
                    setCurrentOrder={setCurrentOrder}
                />

                <OrderStatus
                    orderId={orderId}
                    currentOrder={currentOrder}
                    setOrderId={setOrderId}
                    setCurrentOrder={setCurrentOrder}
                />
            </main>
        </div>
    );
}

export default App;