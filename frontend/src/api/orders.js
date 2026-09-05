const API_URL =
    "http://localhost:8000";


export async function createOrder(
    order
) {

    const response = await fetch(
        `${API_URL}/orders/`,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify(
                order
            )
        }
    );

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errText}`);
    }

    return response.json();
}


export async function getOrder(
    orderId
) {
    const response = await fetch(
        `${API_URL}/orders/${orderId}`
    );
    if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
    }
    return response.json();
}

export async function getLatestOrder() {
    const response = await fetch(
        `${API_URL}/orders/latest`
    );
    if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
    }
    return response.json();
}

export async function getRecentOrders(limit = 10) {
    const response = await fetch(
        `${API_URL}/orders/?limit=${limit}`
    );
    if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
    }
    return response.json();
}

export async function updateOrderStatus(orderId, payload) {
    const response = await fetch(
        `${API_URL}/orders/${orderId}/status`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        }
    );
    if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
    }
    return response.json();
}
