import { useEffect, useState } from "react";
import { getOrder } from "../api/orders";

const STATUS_STEPS = [
    { key: "SUBMITTED", label: "Order Submitted & Queued", desc: "Saved in database and queued to RabbitMQ", protocol: null },
    { key: "CMS_ACCEPTED", label: "CMS Validation", desc: "Client Management System validated client intake", protocol: "SOAP/XML" },
    { key: "ROUTE_CALCULATED", label: "Route Optimisation", desc: "ROS calculated optimal transit path", protocol: "REST/JSON" },
    { key: "WMS_RECEIVED", label: "Warehouse Intake & Loaded", desc: "WMS confirmed socket connection & dispatch", protocol: "TCP/IP" },
    { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", desc: "Courier en route to delivery destination", protocol: null },
    { key: "DELIVERED", label: "Ready to Deliver / Completed", desc: "Order successfully delivered & completed", protocol: null }
];

function OrderStatus({ orderId, currentOrder, setOrderId, setCurrentOrder }) {
    const [searchInput, setSearchInput] = useState("ST-90214");
    const [order, setOrder] = useState(currentOrder || {
        id: 90214,
        display_id: "ST-90214",
        client_name: "SwiftTrack Partner",
        pickup_address: "Colombo Hub",
        delivery_address: "Kandy Express Point",
        priority: "HIGH",
        status: "OUT_FOR_DELIVERY",
        placed_time: "10:24 AM",
        completed_miles: "8.2 mi",
        remaining_miles: "4.2 mi",
        progress_percentage: 66
    });
    const [searchLoading, setSearchLoading] = useState(false);

    useEffect(() => {
        if (currentOrder) {
            setOrder({
                ...currentOrder,
                placed_time: currentOrder.placed_time || "10:24 AM",
                completed_miles: currentOrder.completed_miles || "8.2 mi",
                remaining_miles: currentOrder.remaining_miles || "4.2 mi",
                progress_percentage: currentOrder.progress_percentage || getProgressPercentage(currentOrder.status)
            });
        }
    }, [currentOrder]);

    useEffect(() => {
        if (!orderId) return;

        async function fetchInitial() {
            try {
                const res = await getOrder(orderId);
                if (res && res.id) {
                    setOrder({
                        ...res,
                        display_id: res.display_id || `ST-${90000 + res.id}`,
                        placed_time: "10:24 AM",
                        completed_miles: getCompletedMiles(res.status),
                        remaining_miles: getRemainingMiles(res.status),
                        progress_percentage: getProgressPercentage(res.status)
                    });
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

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.event === "ORDER_UPDATED" && (orderId ? data.order_id === Number(orderId) : true)) {
                        setOrder(prev => ({
                            ...prev,
                            id: data.order_id,
                            display_id: data.display_id || `ST-${90000 + data.order_id}`,
                            status: data.status,
                            completed_miles: getCompletedMiles(data.status),
                            remaining_miles: getRemainingMiles(data.status),
                            progress_percentage: getProgressPercentage(data.status)
                        }));
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
    }, [orderId]);

    function getProgressPercentage(status) {
        switch (status) {
            case "SUBMITTED": return 15;
            case "CMS_ACCEPTED": return 35;
            case "ROUTE_CALCULATED": return 50;
            case "WMS_RECEIVED": return 65;
            case "OUT_FOR_DELIVERY": return 80;
            case "DELIVERED": return 100;
            default: return 66;
        }
    }

    function getCompletedMiles(status) {
        switch (status) {
            case "SUBMITTED": return "1.2 mi";
            case "CMS_ACCEPTED": return "3.5 mi";
            case "ROUTE_CALCULATED": return "5.8 mi";
            case "WMS_RECEIVED": return "7.1 mi";
            case "OUT_FOR_DELIVERY": return "8.2 mi";
            case "DELIVERED": return "12.4 mi";
            default: return "8.2 mi";
        }
    }

    function getRemainingMiles(status) {
        switch (status) {
            case "SUBMITTED": return "11.2 mi";
            case "CMS_ACCEPTED": return "8.9 mi";
            case "ROUTE_CALCULATED": return "6.6 mi";
            case "WMS_RECEIVED": return "5.3 mi";
            case "OUT_FOR_DELIVERY": return "4.2 mi";
            case "DELIVERED": return "0.0 mi";
            default: return "4.2 mi";
        }
    }

    async function handleSearch(e) {
        e.preventDefault();
        if (!searchInput.trim()) return;

        setSearchLoading(true);
        const numericId = searchInput.replace(/\D/g, "");
        if (numericId) {
            try {
                const res = await getOrder(numericId);
                if (res && res.id) {
                    setOrderId(res.id);
                    setOrder({
                        ...res,
                        display_id: res.display_id || searchInput.toUpperCase(),
                        placed_time: "10:24 AM",
                        completed_miles: getCompletedMiles(res.status),
                        remaining_miles: getRemainingMiles(res.status),
                        progress_percentage: getProgressPercentage(res.status)
                    });
                }
            } catch (err) {
                console.log("Search fallback to display id");
            }
        }
        setSearchLoading(false);
    }

    const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === order.status);
    const activeIndex = currentStepIndex >= 0 ? currentStepIndex : 4; // Default to step 4 ("OUT_FOR_DELIVERY") to match screenshot

    return (
        <div className="right-column-stack">
            {/* Top Box: Track Order Search */}
            <div className="ui-card">
                <div className="card-header-flex" style={{ marginBottom: "1rem" }}>
                    <div className="card-header-left">
                        <div className="icon-circle-dark">@</div>
                        <div>
                            <h2 className="card-heading">Track Order & Live Status</h2>
                        </div>
                    </div>
                    <span className="badge-live">LIVE FEED</span>
                </div>

                <p className="card-subtext" style={{ marginBottom: "1.25rem" }}>
                    Enter any consignment or delivery identifier to stream milestone status, geo-location, and driver telemetry.
                </p>

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
                        placeholder="ST-90214"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    <button type="submit" className="btn-check-dark" disabled={searchLoading}>
                        {searchLoading ? "Checking..." : "Check →"}
                    </button>
                </form>
            </div>

            {/* Bottom Box: Order Milestone Details */}
            <div className="ui-card">
                <div className="tracking-header">
                    <div className="order-id-title">
                        <span>{order.display_id || "ST-90214"}</span>
                        <button className="copy-btn" title="Copy Order ID" onClick={() => navigator.clipboard.writeText(order.display_id || "ST-90214")}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                        </button>
                    </div>
                    <div className="order-meta-subtitle">
                        Placed today at {order.placed_time || "10:24 AM"} • Priority Express
                    </div>
                </div>

                {/* Progress card with mileage */}
                <div className="progress-card-box">
                    <div className="progress-stats-text">
                        {order.completed_miles || "8.2 mi"} completed / {order.remaining_miles || "4.2 mi"} remaining
                    </div>

                    <div className="progress-track-container">
                        <div className="endpoint-label">
                            <span className="dot-orange"></span>
                            PICK UP
                        </div>

                        <div className="progress-bar-bg">
                            <div
                                className="progress-bar-fill"
                                style={{ width: `${order.progress_percentage || 66}%` }}
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
                <div className="vertical-stepper">
                    {/* Completed Step 1 */}
                    <div className={`timeline-step ${activeIndex >= 1 ? "completed" : ""}`}>
                        <div className="step-node">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                    </div>

                    {/* Completed Step 2 */}
                    <div className={`timeline-step ${activeIndex >= 2 ? "completed" : ""}`}>
                        <div className="step-node">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                    </div>

                    {/* Active Step (Delivery Truck Icon) */}
                    <div className="timeline-step active">
                        <div className="step-node">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <rect x="1" y="3" width="15" height="13"></rect>
                                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                                <circle cx="18.5" cy="18.5" r="2.5"></circle>
                            </svg>
                        </div>
                    </div>

                    {/* Final Step: Ready to Deliver */}
                    <div className="timeline-step">
                        <div className="step-node">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <circle cx="12" cy="12" r="6"></circle>
                                <circle cx="12" cy="12" r="2"></circle>
                            </svg>
                        </div>
                        <div className="step-info">
                            <span className="step-label">Ready to Deliver</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OrderStatus;