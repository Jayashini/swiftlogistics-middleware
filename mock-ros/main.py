from fastapi import FastAPI

app = FastAPI()


@app.post("/routes/optimize")
async def optimize_route(data: dict):

    return {
        "status": "ROUTE_OPTIMIZED",
        "order_id": data["order_id"],
        "route": {
            "driver": "Driver-001",
            "sequence": [
                data["pickup_address"],
                data["delivery_address"]
            ]
        }
    }