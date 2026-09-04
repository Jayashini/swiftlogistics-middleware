from fastapi import APIRouter
from fastapi import Depends

from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Order
from ..schemas import OrderCreate
from ..services.publisher import publish_order


router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)


@router.post("/")
def create_order(
    order: OrderCreate,
    db: Session = Depends(get_db)
):

    new_order = Order(
        client_name=order.client_name,
        pickup_address=order.pickup_address,
        delivery_address=order.delivery_address,
        priority=order.priority,
        status="RECEIVED"
    )

    db.add(new_order)

    db.commit()

    db.refresh(new_order)

    publish_order(new_order)

    return {
        "message": "Order accepted",
        "order_id": new_order.id,
        "status": new_order.status
    }


@router.get("/{order_id}")
def get_order(
    order_id: int,
    db: Session = Depends(get_db)
):

    order = db.query(Order).filter(
        Order.id == order_id
    ).first()

    if not order:

        return {
            "error": "Order not found"
        }

    return {
        "id": order.id,
        "client_name": order.client_name,
        "status": order.status,
        "cms_status": order.cms_status,
        "wms_status": order.wms_status,
        "ros_status": order.ros_status
    }