import { useEffect, useState } from "react";
import { getOrder, getLatestOrder, getRecentOrders } from "../api/orders";

const STATUS_STEPS = [
    { key: "SUBMITTED", label: "Order Submitted & Queued", desc: "Saved in database and queued to RabbitMQ", protocol: null, subsystemKey: null },
    { key: "CMS_ACCEPTED", label: "CMS Validation", desc: "Client Management System validated client intake", protocol: "SOAP/XML", subsystemKey: "cms_status" },
    { key: "ROUTE_CALCULATED", label: "Route Optimisation", desc: "ROS calculated optimal transit path", protocol: "REST/JSON", subsystemKey: "ros_status" },
    { key: "WMS_RECEIVED", label: "Warehouse Intake & Loaded", desc: "WMS confirmed socket connection & dispatch", protocol: "TCP/IP", subsystemKey: "wms_status" },
    { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", desc: "Courier en route to delivery destination", protocol: null, subsystemKey: null },
    { key: "DELIVERED", label: "Completed & Delivered", desc: "Order successfully delivered & completed", protocol: null, subsystemKey: null }
];

function OrderStatus({ orderId, currentOrder, setOrderId, setCurrentOrder }) {
    const [searchInput, setSearchInput] = useState("");
    const [recentOrders, setRecentOrders] = useState([]);
    const [order, setOrder] = useState(currentOrder || null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    // Helper: fetch recent orders list from DB
    async function loadRecentOrdersList() {
        try {
            const list = await getRecentOrders(10);
            if (Array.isArray(list)) {
                setRecentOrders(list);
            }
        } catch (e) {
            console.error("Failed to fetch recent orders list:", e);
        }
    }

    // Load latest order from DB on initial mount if no order is set
    useEffect(() => {
        loadRecentOrdersList();

        if (!orderId && !currentOrder) {
            (async () => {
                try {
                    const latest = await getLatestOrder();
                    if (latest && latest.id) {
                        setOrder(latest);
                        setSearchInput(latest.display_id || `ORD-${1000 + latest.id}`);
                        if (setOrderId) setOrderId(latest.id);
                    }
                } catch (e) {
                    console.warn("Could not fetch latest order from DB:", e);
                }
            })();
        }
    }, []);

    // Sync when props change
    useEffect(() => {
        if (currentOrder) {
            setOrder(currentOrder);
            setSearchInput(currentOrder.display_id || `ORD-${1000 + (currentOrder.id || 0)}`);
        }
    }, [currentOrder]);

    // Fetch order when orderId changes
    useEffect(() => {
        if (!orderId) return;

        async function fetchInitial() {
            try {
                setErrorMessage(null);
                const res = await getOrder(orderId);
                if (res && res.id) {
                    setOrder(res);
                    setSearchInput(res.display_id || `ORD-${1000 + res.id}`);
                } else if (res && res.error) {
                    setErrorMessage(res.error);
                }
            } catch (err) {
                console.error("Error fetching order initial state:", err);
                setErrorMessage("Failed to load order from database.");
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

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.event === "ORDER_UPDATED") {
                        loadRecentOrdersList();
                        if (order && data.order_id === order.id) {
                            setOrder(prev => ({
                                ...prev,
                                status: data.status,
                                cms_status: data.cms_status || prev?.cms_status,
                                ros_status: data.ros_status || prev?.ros_status,
                                wms_status: data.wms_status || prev?.wms_status,
                                route_info: data.route_info || prev?.route_info
                            }));
                        }
                    }
                } catch (e) {
                    console.error("Error parsing WS data:", e);
                }
            };
        } catch (e) {
            console.error("WebSocket setup error:", e);
        }

        return () => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [order]);

    function getProgressPercentage(status) {
        switch (status) {
            case "SUBMITTED": return 15;
            case "CMS_ACCEPTED": return 35;
            case "ROUTE_CALCULATED": return 50;
            case "WMS_RECEIVED":
            case "PACKAGE_LOADED": return 65;
            case "OUT_FOR_DELIVERY": return 85;
            case "DELIVERED":
            case "COMPLETED": return 100;
            default: return 50;
        }
    }

    function getCompletedMiles(status) {
        switch (status) {
            case "SUBMITTED": return "0.0 mi";
            case "CMS_ACCEPTED": return "2.1 mi";
            case "ROUTE_CALCULATED": return "4.5 mi";
            case "WMS_RECEIVED":
            case "PACKAGE_LOADED": return "6.8 mi";
            case "OUT_FOR_DELIVERY": return "9.4 mi";
            case "DELIVERED":
            case "COMPLETED": return "12.4 mi";
            default: return "5.0 mi";
        }
    }

    function getRemainingMiles(status) {
        switch (status) {
            case "SUBMITTED": return "12.4 mi";
            case "CMS_ACCEPTED": return "10.3 mi";
            case "ROUTE_CALCULATED": return "7.9 mi";
            case "WMS_RECEIVED":
            case "PACKAGE_LOADED": return "5.6 mi";
            case "OUT_FOR_DELIVERY": return "3.0 mi";
            case "DELIVERED":
            case "COMPLETED": return "0.0 mi";
            default: return "7.4 mi";
        }
    }

    function getActiveIndex(status) {
        switch (status) {
            case "SUBMITTED": return 0;
            case "CMS_ACCEPTED": return 1;
            case "ROUTE_CALCULATED": return 2;
            case "WMS_RECEIVED":
            case "PACKAGE_LOADED": return 3;
            case "OUT_FOR_DELIVERY": return 4;
            case "DELIVERED":
            case "COMPLETED": return 5;
            default: return 2;
        }
    }

    async function handleSearch(e) {
        if (e) e.preventDefault();
        if (!searchInput.trim()) return;

        setSearchLoading(true);
        setErrorMessage(null);
        const numericId = searchInput.replace(/\D/g, "");
        if (numericId) {
            try {
                const res = await getOrder(numericId);
                if (res && res.id) {
                    setOrder(res);
                    if (setOrderId) setOrderId(res.id);
                } else {
                    setErrorMessage(`Order ID ${searchInput} not found in database.`);
                }
            } catch (err) {
                setErrorMessage(`Order ID ${searchInput} not found in database.`);
            }
        } else {
            setErrorMessage("Please enter a valid numeric or ORD ID.");
        }
        setSearchLoading(false);
    }

    function handleSelectOrder(selectedId) {
        if (!selectedId) return;
        setSearchLoading(true);
        setErrorMessage(null);
        getOrder(selectedId)
            .then(res => {
                if (res && res.id) {
                    setOrder(res);
                    setSearchInput(res.display_id || `ORD-${1000 + res.id}`);
                    if (setOrderId) setOrderId(res.id);
                }
            })
            .catch(err => setErrorMessage("Error loading order details"))
            .finally(() => setSearchLoading(false));
    }

    function renderSubsystemBadge(statusVal) {
        if (!statusVal) return null;
        const val = statusVal.toUpperCase();
        let bg = "#f1f5f9", color = "#475569";
        if (val === "COMPLETED" || val === "SUCCESS" || val === "ACCEPTED" || val === "CALCULATED" || val === "RECEIVED") {
            bg = "#dcfce7";
            color = "#15803d";
        } else if (val === "PENDING") {
            bg = "#fef9c3";
            color = "#a16207";
        } else if (val === "FAILED" || val === "ERROR") {
            bg = "#fee2e2";
            color = "#b91c1c";
        }
        return (
            <span style={{
                fontSize: "0.7rem",
                fontWeight: "700",
                padding: "2px 8px",
                borderRadius: "4px",
                backgroundColor: bg,
                color: color,
                marginLeft: "6px"
            }}>
                {val}
            </span>
        );
    }

    const activeIndex = order ? getActiveIndex(order.status) : 0;
    const formattedCreatedAt = order?.created_at
        ? new Date(order.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
        : "Recently";

    return (
        <div className="right-column-stack">
            {/* Top Box: Track Order Search & DB Order Selector */}
            <div className="ui-card">
                <div className="card-header-flex" style={{ marginBottom: "1rem" }}>
                    <div className="card-header-left">
                        <div className="icon-circle-dark">@</div>
                        <div>
                            <h2 className="card-heading">Track Order & Live DB Status</h2>
                        </div>
                    </div>
                    <span className="badge-live">LIVE DB FEED</span>
                </div>

                <p className="card-subtext" style={{ marginBottom: "1.25rem" }}>
                    Retrieve live order details directly from PostgreSQL database. Search by Order ID or select from active database orders below.
                </p>

                {recentOrders.length > 0 && (
                    <div style={{ marginBottom: "1rem" }}>
                        <label style={{ fontSize: "0.75rem", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "0.35rem" }}>
                            SELECT FROM DATABASE ORDERS ({recentOrders.length}):
                        </label>
                        <select
                            className="form-input"
                            style={{ padding: "0.5rem 0.75rem", fontSize: "0.85rem", background: "#f8fafc" }}
                            value={order?.id || ""}
                            onChange={(e) => handleSelectOrder(e.target.value)}
                        >
                            <option value="" disabled>-- Select Database Order --</option>
                            {recentOrders.map(o => (
                                <option key={o.id} value={o.id}>
                                    {o.display_id} | {o.client_name} | Status: {o.status}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <form onSubmit={handleSearch} className="search-input-group">
                    <span style={{ paddingLeft: "0.75rem", color: "#94a3b8", display: "flex", alignItems: "center" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="16" rx="2"></rect>
                            <line x1="7" y1="8" x2="7" y2="16"></line>
                            <line x1="11" y1="8" x2="11" y2="16"></line>
                            <line x1="15" y1="8" x2="15" y2="16"></line>
                        </svg>
                    </span>
                    <input
                        className="search-input-field"
                        placeholder="Search ID e.g. 26 or ORD-1026"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    <button type="submit" className="btn-check-dark" disabled={searchLoading}>
                        {searchLoading ? "Fetching..." : "Fetch DB →"}
                    </button>
                </form>

                {errorMessage && (
                    <div style={{ marginTop: "0.75rem", padding: "0.5rem 0.75rem", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.5rem", color: "#dc2626", fontSize: "0.8rem" }}>
                        {errorMessage}
                    </div>
                )}
            </div>

            {/* Bottom Box: Order Milestone Details */}
            {order ? (
                <div className="ui-card">
                    <div className="tracking-header">
                        <div className="order-id-title">
                            <span>{order.display_id || `ORD-${1000 + order.id}`}</span>
                            <button className="copy-btn" title="Copy Order ID" onClick={() => navigator.clipboard.writeText(order.display_id || `ORD-${1000 + order.id}`)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                            </button>
                            <span className="badge-live" style={{ background: order.status === "COMPLETED" || order.status === "DELIVERED" ? "#dcfce7" : "#e0f2fe", color: order.status === "COMPLETED" || order.status === "DELIVERED" ? "#15803d" : "#0284c7" }}>
                                {order.status}
                            </span>
                        </div>
                        <div className="order-meta-subtitle">
                            Created: {formattedCreatedAt} • Client: <strong>{order.client_name}</strong> • Priority: <strong>{(order.priority || "NORMAL").toUpperCase()}</strong>
                        </div>
                    </div>

                    {/* Route Details from DB */}
                    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "1.25rem", fontSize: "0.85rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                            <span><strong>Origin / Pickup:</strong> {order.pickup_address}</span>
                            <span><strong>Destination:</strong> {order.delivery_address}</span>
                        </div>
                        {order.route_info && (
                            <div style={{ marginTop: "0.35rem", paddingTop: "0.35rem", borderTop: "1px dashed #cbd5e1", color: "#0284c7", fontWeight: "600", fontSize: "0.8rem" }}>
                                🚚 {order.route_info}
                            </div>
                        )}
                    </div>

                    {/* Progress card with mileage */}
                    <div className="progress-card-box">
                        <div className="progress-stats-text">
                            {getCompletedMiles(order.status)} completed / {getRemainingMiles(order.status)} remaining
                        </div>

                        <div className="progress-track-container">
                            <div className="endpoint-label">
                                <span className="dot-orange"></span>
                                PICK UP
                            </div>

                            <div className="progress-bar-bg">
                                <div
                                    className="progress-bar-fill"
                                    style={{ width: `${getProgressPercentage(order.status)}%` }}
                                ></div>
                            </div>

                            <div className="endpoint-label" style={{ color: "#ef4444" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                </svg>
                                DELIVERY
                            </div>
                        </div>
                    </div>

                    {/* Vertical Stepper Timeline */}
                    <div className="vertical-stepper" style={{ marginTop: "1.5rem" }}>
                        {STATUS_STEPS.map((step, idx) => {
                            const isDone = activeIndex > idx || order.status === "COMPLETED" || order.status === "DELIVERED";
                            const isCurrent = activeIndex === idx && order.status !== "COMPLETED" && order.status !== "DELIVERED";
                            const subsystemVal = step.subsystemKey ? order[step.subsystemKey] : null;

                            return (
                                <div key={step.key} className={`timeline-step ${isDone ? "completed" : isCurrent ? "active" : ""}`} style={{ marginBottom: "1.25rem" }}>
                                    <div className="step-node">
                                        {isDone ? (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        ) : isCurrent ? (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                                <rect x="1" y="3" width="15" height="13"></rect>
                                                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                                                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                                                <circle cx="18.5" cy="18.5" r="2.5"></circle>
                                            </svg>
                                        ) : (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="6"></circle>
                                            </svg>
                                        )}
                                    </div>
                                    <div className="step-info" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                            <span className="step-label" style={{ fontWeight: isDone || isCurrent ? "700" : "500" }}>{step.label}</span>
                                            {step.protocol && <span style={{ fontSize: "0.68rem", background: "#f1f5f9", padding: "1px 6px", borderRadius: "4px", color: "#475569" }}>{step.protocol}</span>}
                                            {renderSubsystemBadge(subsystemVal)}
                                        </div>
                                        <span style={{ fontSize: "0.78rem", color: "#64748b" }}>{step.desc}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="ui-card" style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                    No order selected or retrieved from database yet. Submit a new order or select an existing order ID above.
                </div>
            )}
        </div>
    );
}

export default OrderStatus;