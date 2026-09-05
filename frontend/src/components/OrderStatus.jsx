import { useEffect, useState } from "react";
import { getOrder } from "../api/orders";

const STATUS_STEPS = [
    { key: "SUBMITTED", label: "Order Submitted", desc: "Saved in PostgreSQL DB & Queued to RabbitMQ", protocol: null },
    { key: "CMS_ACCEPTED", label: "CMS Validation", desc: "Client Management System validated client intake", protocol: "SOAP/XML" },
    { key: "ROUTE_CALCULATED", label: "Route Optimisation", desc: "ROS calculated optimal transit path", protocol: "REST/JSON" },
    { key: "WMS_RECEIVED", label: "Warehouse Intake", desc: "WMS confirmed socket connection & dispatch receipt", protocol: "TCP/IP" },
    { key: "PACKAGE_LOADED", label: "Package Loaded", desc: "Consignment loaded onto delivery vehicle", protocol: null },
    { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", desc: "Courier en route to delivery destination", protocol: null },
    { key: "DELIVERED", label: "Delivered", desc: "Order successfully delivered & completed", protocol: null }
];

function OrderStatus({ orderId, currentOrder, setCurrentOrder }) {
    const [order, setOrder] = useState(currentOrder || null);
    const [wsConnected, setWsConnected] = useState(false);

    useEffect(() => {
        if (currentOrder) {
            setOrder(currentOrder);
        }
    }, [currentOrder]);

    // Initial fetch when orderId changes
    useEffect(() => {
        if (!orderId) return;

        async function fetchInitial() {
            try {
                const res = await getOrder(orderId);
                if (res && res.id) {
                    setOrder(res);
                }
            } catch (err) {
                console.error("Error fetching order initial state:", err);
            }
        }
        fetchInitial();
    }, [orderId]);

    // WebSocket real-time updates connection
    useEffect(() => {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.hostname;
        const wsUrl = `${protocol}//${host}:8000/ws/orders`;

        let ws;
        try {
            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                setWsConnected(true);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.event === "ORDER_UPDATED" && (orderId ? data.order_id === Number(orderId) : true)) {
                        setOrder(prev => ({
                            ...prev,
                            id: data.order_id,
                            display_id: data.display_id,
                            client_name: data.client_name || prev?.client_name,
                            pickup_address: data.pickup_address || prev?.pickup_address,
                            delivery_address: data.delivery_address || prev?.delivery_address,
                            priority: data.priority || prev?.priority,
                            status: data.status,
                            cms_status: data.cms_status || prev?.cms_status,
                            ros_status: data.ros_status || prev?.ros_status,
                            wms_status: data.wms_status || prev?.wms_status,
                            route_info: data.route_info || prev?.route_info
                        }));
                    }
                } catch (e) {
                    console.error("Error parsing WS data:", e);
                }
            };

            ws.onclose = () => setWsConnected(false);
            ws.onerror = () => setWsConnected(false);
        } catch (e) {
            console.error("WebSocket setup error:", e);
        }

        return () => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [orderId]);

    if (!order) {
        return (
            <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "350px", textAlign: "center", color: "var(--text-muted)" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📍</div>
                <h3>No Active Order Selected</h3>
                <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>Fill out the form on the left and submit an order to trace real-time orchestration across CMS, ROS & WMS.</p>
            </div>
        );
    }

    const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === order.status);
    const activeIndex = currentStepIndex >= 0 ? currentStepIndex : 0;

    return (
        <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <div>
                    <span style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", color: "var(--accent-cyan)", letterSpacing: "0.05em" }}>Real-Time Tracking</span>
                    <h2 className="card-title" style={{ margin: 0 }}>
                        {order.display_id || `ORD-${1000 + order.id}`}
                    </h2>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", background: "rgba(15, 23, 42, 0.8)", padding: "0.35rem 0.75rem", borderRadius: "20px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: wsConnected ? "#10b981" : "#f59e0b" }}></span>
                    <span>{wsConnected ? "WebSocket Live" : "Polling / Connecting"}</span>
                </div>
            </div>

            <div className="details-box" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Client</span>
                    <div style={{ fontWeight: "600", fontSize: "0.9rem" }}>{order.client_name || "—"}</div>
                </div>
                <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Pickup</span>
                    <div style={{ fontWeight: "600", fontSize: "0.9rem" }}>{order.pickup_address || "—"}</div>
                </div>
                <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Delivery</span>
                    <div style={{ fontWeight: "600", fontSize: "0.9rem" }}>{order.delivery_address || "—"}</div>
                </div>
                <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Priority</span>
                    <div style={{ fontWeight: "600", fontSize: "0.9rem", color: order.priority === "high" ? "#f59e0b" : "#60a5fa" }}>
                        {order.priority ? order.priority.toUpperCase() : "NORMAL"}
                    </div>
                </div>
            </div>

            {order.route_info && (
                <div style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.25)", borderRadius: "0.75rem", padding: "0.85rem 1rem", marginBottom: "1.5rem", fontSize: "0.85rem" }}>
                    <span style={{ fontWeight: "700", color: "#60a5fa" }}>🗺️ ROS Optimised Route: </span>
                    <span style={{ color: "#e2e8f0" }}>{order.route_info}</span>
                </div>
            )}

            <div className="stepper">
                {STATUS_STEPS.map((step, idx) => {
                    const isCompleted = idx < activeIndex || order.status === "DELIVERED";
                    const isActive = idx === activeIndex && order.status !== "DELIVERED";

                    let badgeClass = "";
                    if (step.protocol === "SOAP/XML") badgeClass = "badge-soap";
                    if (step.protocol === "REST/JSON") badgeClass = "badge-rest";
                    if (step.protocol === "TCP/IP") badgeClass = "badge-tcp";

                    return (
                        <div key={step.key} className={`step-item ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""}`}>
                            <div className="step-icon">
                                {isCompleted ? "✓" : idx + 1}
                            </div>
                            <div className="step-content">
                                <div className="step-title">
                                    {step.label}
                                    {step.protocol && <span className={`badge ${badgeClass}`}>{step.protocol}</span>}
                                </div>
                                <div className="step-desc">{step.desc}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default OrderStatus;