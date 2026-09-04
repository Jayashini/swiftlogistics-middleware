from fastapi import FastAPI

from .database import Base
from .database import engine

from .routers.orders import router as orders_router


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