import { useState } from "react";
import OrderForm from "./components/OrderForm";
import OrderStatus from "./components/OrderStatus";
import WarehouseDashboard from "./components/WarehouseDashboard";

function App() {
    const [activeTab, setActiveTab] = useState("client"); // "client" | "warehouse"
    const [orderId, setOrderId] = useState(null);
    const [currentOrder, setCurrentOrder] = useState(null);

    return (
        <div>
            <header className="app-header">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                        <h1 className="app-title">
                            SwiftTrack Logistics Middleware
                        </h1>
                        <p className="app-subtitle">
                            Integrated Heterogeneous Middleware: CMS (SOAP/XML), ROS (REST/JSON), WMS (TCP/IP) & WebSocket Live Grid
                        </p>
                    </div>

                    {/* View Switcher Tabs */}
                    <div style={{ display: "flex", gap: "0.5rem", background: "#ffffff", padding: "4px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                        <button
                            onClick={() => setActiveTab("client")}
                            style={{
                                padding: "0.5rem 1rem",
                                borderRadius: "8px",
                                border: "none",
                                background: activeTab === "client" ? "#0f172a" : "transparent",
                                color: activeTab === "client" ? "#ffffff" : "#64748b",
                                fontWeight: "700",
                                fontSize: "0.85rem",
                                cursor: "pointer",
                                transition: "all 0.2s ease"
                            }}
                        >
                            📦 Client & Dispatch Portal
                        </button>

                        <button
                            onClick={() => setActiveTab("warehouse")}
                            style={{
                                padding: "0.5rem 1rem",
                                borderRadius: "8px",
                                border: "none",
                                background: activeTab === "warehouse" ? "#0f172a" : "transparent",
                                color: activeTab === "warehouse" ? "#ffffff" : "#64748b",
                                fontWeight: "700",
                                fontSize: "0.85rem",
                                cursor: "pointer",
                                transition: "all 0.2s ease"
                            }}
                        >
                            🏢 Warehouse Staff Dashboard
                        </button>
                    </div>
                </div>
            </header>

            {activeTab === "client" ? (
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
            ) : (
                <main>
                    <WarehouseDashboard />
                </main>
            )}
        </div>
    );
}

export default App;