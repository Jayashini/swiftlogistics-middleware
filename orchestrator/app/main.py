from fastapi import FastAPI

from .database import Base
from .database import engine

from .routers.orders import router as orders_router

from fastapi import WebSocket

from .websocket_manager import manager


from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import text

Base.metadata.create_all(
    bind=engine
)

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS route_info VARCHAR;"))
    conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();"))
    conn.commit()



app = FastAPI(
    title="SwiftLogistics Middleware API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    orders_router
)


@app.get("/")
def home():

    return {
        "message": "SwiftLogistics Middleware Running"
    }


@app.get("/health")
def health():
    return {"status": "ok"}



@app.websocket("/ws/orders")
async def websocket_endpoint(
    websocket: WebSocket
):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except Exception:
        manager.disconnect(websocket)