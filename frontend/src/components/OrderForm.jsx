import { useState } from "react";
import { createOrder } from "../api/orders";

function OrderForm({ setOrderId, setCurrentOrder }) {
    const [form, setForm] = useState({
        client_name: "",
        pickup_address: "",
        delivery_address: "",
        priority: "normal"
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    function handleChange(event) {
        setForm({
            ...form,
            [event.target.value !== undefined ? event.target.name : event.target.id]: event.target.value
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const result = await createOrder(form);
            if (result && result.order_id) {
                setOrderId(result.order_id);
                if (setCurrentOrder) {
                    setCurrentOrder({
                        id: result.order_id,
                        display_id: result.display_id || `ORD-${1000 + result.order_id}`,
                        client_name: form.client_name,
                        pickup_address: form.pickup_address,
                        delivery_address: form.delivery_address,
                        priority: form.priority,
                        status: result.status || "SUBMITTED",
                        cms_status: "PENDING",
                        ros_status: "PENDING",
                        wms_status: "PENDING"
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
        <div className="card">
            <h2 className="card-title">
                📦 Submit Delivery Order
            </h2>

            {error && (
                <div style={{ padding: "0.75rem", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "0.5rem", color: "#f87171", fontSize: "0.85rem", marginBottom: "1rem" }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="client_name">Client Name</label>
                    <input
                        id="client_name"
                        name="client_name"
                        className="form-control"
                        placeholder="e.g. ABC Company"
                        value={form.client_name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="pickup_address">Pickup Address</label>
                    <input
                        id="pickup_address"
                        name="pickup_address"
                        className="form-control"
                        placeholder="e.g. Colombo Warehouse"
                        value={form.pickup_address}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="delivery_address">Delivery Address</label>
                    <input
                        id="delivery_address"
                        name="delivery_address"
                        className="form-control"
                        placeholder="e.g. Kandy, Sri Lanka"
                        value={form.delivery_address}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="priority">Order Priority</label>
                    <select
                        id="priority"
                        name="priority"
                        className="form-control"
                        value={form.priority}
                        onChange={handleChange}
                    >
                        <option value="normal">Normal Priority</option>
                        <option value="high">High Priority ⚡</option>
                    </select>
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? "Submitting Order..." : "Submit Order"}
                </button>
            </form>
        </div>
    );
}

export default OrderForm;