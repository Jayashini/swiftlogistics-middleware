from fastapi import FastAPI

from .database import Base
from .database import engine

from .routers.orders import router as orders_router

from fastapi import WebSocket

from .websocket_manager import manager


Base.metadata.create_all(
    bind=engine
)

app = FastAPI(
    title="SwiftLogistics Middleware API"
)


app.include_router(
    orders_router
)


@app.get("/")
def home():

    return {
        "message": "SwiftLogistics Middleware Running"
    }


@app.websocket("/ws/orders")
async def websocket_endpoint(
    websocket: WebSocket
):

    await manager.connect(
        websocket
    )

    while True:

        await websocket.receive_text()