from pydantic import BaseModel


class OrderCreate(BaseModel):

    client_name: str

    pickup_address: str

    delivery_address: str

    priority: str = "normal"