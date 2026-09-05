import { useEffect, useState } from "react";
import { getRecentOrders, updateOrderStatus } from "../api/orders";

const STATUS_PIPELINE = [
    { status: "SUBMITTED", label: "Submitted", color: "#64748b" },
    { status: "CMS_ACCEPTED", label: "CMS Validated", color: "#0284c7" },
    { status: "ROUTE_CALCULATED", label: "Route Calculated", color: "#8b5cf6" },
    { status: "WMS_RECEIVED", label: "WMS Intake", color: "#d97706" },
    { status: "PACKAGE_LOADED", label: "Package Loaded", color: "#ea580c" },
    { status: "OUT_FOR_DELIVERY", label: "Out for Delivery", color: "#2563eb" },
    { status: "DELIVERED", label: "Delivered", color: "#16a34a" }
];

function WarehouseDashboard() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [message, setMessage] = useState(null);

    async function fetchOrders() {
        try {
            const data = await getRecentOrders(50);
            if (Array.isArray(data)) {
                setOrders(data);
            }
        } catch (e) {
            console.error("Failed to load warehouse orders:", e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchOrders();
    }, []);

    // WebSocket real-time updates for warehouse staff
    useEffect(() => {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.hostname;
        const wsUrl = `${protocol}//${host}:8000/ws/orders`;

        let ws;
        try {
            ws = new WebSocket(wsUrl);
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.event === "ORDER_UPDATED") {
                        fetchOrders();
                    }
                } catch (e) {
                    console.error("Error parsing WS in warehouse:", e);
                }
            };
        } catch (e) {
            console.error("WS error in warehouse:", e);
        }

        return () => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, []);

    async function handleSimulateStatus(orderId, targetStatus) {
        setUpdatingId(orderId);
        setMessage(null);
        try {
            let payload = { status: targetStatus };

            if (targetStatus === "CMS_ACCEPTED") {
                payload.cms_status = "SUCCESS";
            } else if (targetStatus === "ROUTE_CALCULATED") {
                payload.ros_status = "SUCCESS";
                payload.route_info = "Driver: Driver-001 | Route: Hub -> Destination";
            } else if (targetStatus === "WMS_RECEIVED") {
                payload.wms_status = "SUCCESS";
            } else if (targetStatus === "DELIVERED") {
                payload.status = "DELIVERED";
            }

            await updateOrderStatus(orderId, payload);
            setMessage(`Order #${orderId} status updated to ${targetStatus}`);
            await fetchOrders();
        } catch (err) {
            console.error("Error updating order status:", err);
            setMessage(`Failed to update order status: ${err.message}`);
        } finally {
            setUpdatingId(null);
        }
    }

    const filteredOrders = orders.filter(o => {
        if (filterStatus === "ALL") return true;
        if (filterStatus === "ACTIVE") return o.status !== "DELIVERED" && o.status !== "COMPLETED";
        if (filterStatus === "COMPLETED") return o.status === "DELIVERED" || o.status === "COMPLETED";
        return o.status === filterStatus;
    });

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Header / Control Bar */}
            <div className="ui-card">
                <div className="card-header-flex" style={{ marginBottom: "1rem" }}>
                    <div className="card-header-left">
                        <div className="icon-circle-dark" style={{ background: "#0f172a", color: "#38bdf8" }}>🏢</div>
                        <div>
                            <h2 className="card-heading">Warehouse & Dispatch Staff Dashboard</h2>
                            <p className="card-subtext">Real-time package simulation control room for WMS, CMS, and ROS middleware transitions</p>
                        </div>
                    </div>
                    <span className="badge-live" style={{ background: "#fef3c7", color: "#b45309" }}>STAFF SIMULATION MODE</span>
                </div>

                {message && (
                    <div style={{ padding: "0.6rem 0.85rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "0.5rem", color: "#15803d", fontSize: "0.85rem", marginBottom: "1rem" }}>
                        ✅ {message}
                    </div>
                )}

                {/* Filter tabs */}
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {["ALL", "ACTIVE", "COMPLETED", "SUBMITTED", "WMS_RECEIVED", "OUT_FOR_DELIVERY"].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setFilterStatus(tab)}
                            style={{
                                padding: "0.4rem 0.85rem",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                background: filterStatus === tab ? "#0f172a" : "#ffffff",
                                color: filterStatus === tab ? "#ffffff" : "#475569",
                                fontWeight: "600",
                                fontSize: "0.78rem",
                                cursor: "pointer"
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Package / Order Management Grid */}
            <div className="ui-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>
                        Active Database Consignments ({filteredOrders.length})
                    </h3>
                    <button onClick={fetchOrders} className="btn-clear" style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}>
                        🔄 Refresh Data
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>Loading warehouse inventory...</div>
                ) : filteredOrders.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>No packages found matching filter criteria.</div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {filteredOrders.map(ord => (
                            <div
                                key={ord.id}
                                style={{
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "10px",
                                    padding: "1rem 1.25rem",
                                    background: "#f8fafc",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.75rem"
                                }}
                            >
                                {/* Top Line: ID, Client, Priority */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                        <span style={{ fontWeight: "800", fontSize: "1rem", color: "#0f172a" }}>
                                            {ord.display_id || `ORD-${1000 + ord.id}`}
                                        </span>
                                        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                                            Client: <strong>{ord.client_name}</strong>
                                        </span>
                                        <span style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: "4px", background: ord.priority === "high" ? "#fee2e2" : "#f1f5f9", color: ord.priority === "high" ? "#b91c1c" : "#475569", fontWeight: "700" }}>
                                            {(ord.priority || "NORMAL").toUpperCase()}
                                        </span>
                                    </div>

                                    {/* Subsystem status pills */}
                                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.72rem" }}>
                                        <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "2px 6px", borderRadius: "4px", fontWeight: "600" }}>
                                            CMS: {ord.cms_status}
                                        </span>
                                        <span style={{ background: "#f3e8ff", color: "#7e22ce", padding: "2px 6px", borderRadius: "4px", fontWeight: "600" }}>
                                            ROS: {ord.ros_status}
                                        </span>
                                        <span style={{ background: "#fef3c7", color: "#b45309", padding: "2px 6px", borderRadius: "4px", fontWeight: "600" }}>
                                            WMS: {ord.wms_status}
                                        </span>
                                        <span style={{ background: ord.status === "COMPLETED" || ord.status === "DELIVERED" ? "#dcfce7" : "#0284c7", color: ord.status === "COMPLETED" || ord.status === "DELIVERED" ? "#15803d" : "#ffffff", padding: "3px 8px", borderRadius: "4px", fontWeight: "700" }}>
                                            {ord.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Address & Route Info */}
                                <div style={{ fontSize: "0.82rem", color: "#475569", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", borderTop: "1px dashed #cbd5e1", paddingTop: "0.5rem" }}>
                                    <div>📍 <strong>Pickup:</strong> {ord.pickup_address} → <strong>Delivery:</strong> {ord.delivery_address}</div>
                                    {ord.created_at && (
                                        <div style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                                            Created: {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    )}
                                </div>

                                {/* Simulation Quick Action Buttons */}
                                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center", paddingTop: "0.25rem" }}>
                                    <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#64748b", marginRight: "0.25rem" }}>
                                        Simulate Stage:
                                    </span>
                                    <button
                                        disabled={updatingId === ord.id}
                                        onClick={() => handleSimulateStatus(ord.id, "CMS_ACCEPTED")}
                                        style={{ padding: "3px 8px", fontSize: "0.72rem", borderRadius: "4px", border: "1px solid #bae6fd", background: "#f0f9ff", color: "#0369a1", cursor: "pointer", fontWeight: "600" }}
                                    >
                                        1. CMS Validate (SOAP)
                                    </button>
                                    <button
                                        disabled={updatingId === ord.id}
                                        onClick={() => handleSimulateStatus(ord.id, "ROUTE_CALCULATED")}
                                        style={{ padding: "3px 8px", fontSize: "0.72rem", borderRadius: "4px", border: "1px solid #ddd6fe", background: "#faf5ff", color: "#6b21a8", cursor: "pointer", fontWeight: "600" }}
                                    >
                                        2. ROS Route (REST)
                                    </button>
                                    <button
                                        disabled={updatingId === ord.id}
                                        onClick={() => handleSimulateStatus(ord.id, "WMS_RECEIVED")}
                                        style={{ padding: "3px 8px", fontSize: "0.72rem", borderRadius: "4px", border: "1px solid #fde68a", background: "#fffbeb", color: "#92400e", cursor: "pointer", fontWeight: "600" }}
                                    >
                                        3. WMS Intake (TCP)
                                    </button>
                                    <button
                                        disabled={updatingId === ord.id}
                                        onClick={() => handleSimulateStatus(ord.id, "PACKAGE_LOADED")}
                                        style={{ padding: "3px 8px", fontSize: "0.72rem", borderRadius: "4px", border: "1px solid #fed7aa", background: "#fff7ed", color: "#c2410c", cursor: "pointer", fontWeight: "600" }}
                                    >
                                        4. Load Package
                                    </button>
                                    <button
                                        disabled={updatingId === ord.id}
                                        onClick={() => handleSimulateStatus(ord.id, "OUT_FOR_DELIVERY")}
                                        style={{ padding: "3px 8px", fontSize: "0.72rem", borderRadius: "4px", border: "1px solid #bfdbfe", background: "#eff6ff", color: "#1d4ed8", cursor: "pointer", fontWeight: "600" }}
                                    >
                                        5. Dispatch Courier
                                    </button>
                                    <button
                                        disabled={updatingId === ord.id}
                                        onClick={() => handleSimulateStatus(ord.id, "DELIVERED")}
                                        style={{ padding: "3px 8px", fontSize: "0.72rem", borderRadius: "4px", border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#15803d", cursor: "pointer", fontWeight: "600" }}
                                    >
                                        6. Mark Delivered
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default WarehouseDashboard;
