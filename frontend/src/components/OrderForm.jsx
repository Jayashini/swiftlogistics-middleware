import { useState } from "react";
import { createOrder } from "../api/orders";

function OrderForm({ setOrderId, setCurrentOrder }) {
    const [form, setForm] = useState({
        client_name: "",
        pickup_address: "",
        delivery_address: "",
        priority: "HIGH"
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    function handleChange(e) {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: value
        }));
    }

    function handleClear() {
        setForm({
            client_name: "",
            pickup_address: "",
            delivery_address: "",
            priority: "HIGH"
        });
        setError(null);
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const result = await createOrder({
                ...form,
                priority: form.priority.toLowerCase()
            });
            if (result && result.order_id) {
                setOrderId(result.order_id);
                if (setCurrentOrder) {
                    setCurrentOrder({
                        id: result.order_id,
                        display_id: result.display_id || `ST-${90000 + result.order_id}`,
                        client_name: form.client_name,
                        pickup_address: form.pickup_address,
                        delivery_address: form.delivery_address,
                        priority: form.priority,
                        status: result.status || "SUBMITTED",
                        cms_status: "PENDING",
                        ros_status: "PENDING",
                        wms_status: "PENDING",
                        created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    });
                }
            } else {
                setError("Failed to submit order. Please check backend API.");
            }
        } catch (err) {
            setError("Connection error: " + err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="ui-card">
            <div className="card-header-flex">
                <div className="card-header-left">
                    <div className="icon-square-dark">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="12" y1="8" x2="12" y2="16"></line>
                            <line x1="8" y1="12" x2="16" y2="12"></line>
                        </svg>
                    </div>
                    <div>
                        <h2 className="card-heading">Submit Delivery Order</h2>
                        <p className="card-subtext">Instant courier booking with automatic geo-routing</p>
                    </div>
                </div>
                <div style={{ width: 16, height: 16, borderRadius: 4, background: '#e0f2fe', border: '1px solid #bae6fd' }}></div>
            </div>

            {error && (
                <div style={{ padding: "0.75rem", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.5rem", color: "#dc2626", fontSize: "0.85rem", marginBottom: "1rem" }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Client / Origin Name */}
                <div className="form-group">
                    <label className="form-label" htmlFor="client_name">
                        CLIENT / ORIGIN NAME <span className="required-asterisk">*</span>
                    </label>
                    <div className="input-with-icon">
                        <span className="input-icon-left">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"></path>
                                <path d="M6 12h12"></path>
                                <path d="M6 7h12"></path>
                                <path d="M6 17h12"></path>
                            </svg>
                        </span>
                        <input
                            id="client_name"
                            name="client_name"
                            className="form-input"
                            placeholder="Enter client or origin organization"
                            value={form.client_name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                {/* Pickup and Delivery Address */}
                <div className="form-row-2col form-group">
                    <div>
                        <label className="form-label" htmlFor="pickup_address">
                            PICKUP ADDRESS <span className="required-asterisk">*</span>
                        </label>
                        <input
                            id="pickup_address"
                            name="pickup_address"
                            className="form-input no-icon"
                            placeholder="Enter origin location"
                            value={form.pickup_address}
                            onChange={handleChange}
                            required
                        />
                        <div className="field-hint info-blue">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            </svg>
                            Auto-verified against postal registry
                        </div>
                    </div>

                    <div>
                        <label className="form-label" htmlFor="delivery_address">
                            DELIVERY ADDRESS <span className="required-asterisk">*</span>
                        </label>
                        <input
                            id="delivery_address"
                            name="delivery_address"
                            className="form-input no-icon"
                            placeholder="Enter destination location"
                            value={form.delivery_address}
                            onChange={handleChange}
                            required
                        />
                        <div className="field-hint">
                            Recipient contact: +1(832) 555-0199
                        </div>
                    </div>
                </div>

                {/* Priority Select */}
                <div className="form-group">
                    <label className="form-label" htmlFor="priority">
                        PRIORITY
                    </label>
                    <div className="input-with-icon">
                        <span className="input-icon-left">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                        </span>
                        <select
                            id="priority"
                            name="priority"
                            className="form-input"
                            value={form.priority}
                            onChange={handleChange}
                        >
                            <option value="HIGH">HIGH</option>
                            <option value="NORMAL">NORMAL</option>
                        </select>
                    </div>
                </div>

                {/* Buttons */}
                <div className="form-actions-flex">
                    <button type="submit" className="btn-orange-submit" disabled={loading}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                        {loading ? "Submitting Order..." : "Submit Delivery Order"}
                    </button>
                    <button type="button" className="btn-clear" onClick={handleClear}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                        </svg>
                        Clear
                    </button>
                </div>
            </form>
        </div>
    );
}

export default OrderForm;