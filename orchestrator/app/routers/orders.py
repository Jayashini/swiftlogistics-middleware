from fastapi import APIRouter
from fastapi import Depends

from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Order
from ..schemas import OrderCreate
from ..services.publisher import publish_order


from pydantic import BaseModel
from typing import Optional
from ..websocket_manager import manager

router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)


class OrderStatusUpdate(BaseModel):
    status: str
    cms_status: Optional[str] = None
    wms_status: Optional[str] = None
    ros_status: Optional[str] = None
    route_info: Optional[str] = None


@router.post("/")
async def create_order(
    order: OrderCreate,
    db: Session = Depends(get_db)
):

    new_order = Order(
        client_name=order.client_name,
        pickup_address=order.pickup_address,
        delivery_address=order.delivery_address,
        priority=order.priority,
        status="SUBMITTED",
        cms_status="PENDING",
        ros_status="PENDING",
        wms_status="PENDING"
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    publish_order(new_order)

    payload = {
        "event": "ORDER_UPDATED",
        "order_id": new_order.id,
        "display_id": f"ORD-{1000 + new_order.id}",
        "client_name": new_order.client_name,
        "pickup_address": new_order.pickup_address,
        "delivery_address": new_order.delivery_address,
        "priority": new_order.priority,
        "status": new_order.status,
        "cms_status": new_order.cms_status,
        "ros_status": new_order.ros_status,
        "wms_status": new_order.wms_status,
        "route_info": new_order.route_info
    }

    await manager.broadcast(payload)

    return {
        "message": "Order accepted",
        "order_id": new_order.id,
        "display_id": f"ORD-{1000 + new_order.id}",
        "status": new_order.status
    }


@router.patch("/{order_id}/status")
async def update_order_status(
    order_id: int,
    update: OrderStatusUpdate,
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return {"error": "Order not found"}

    order.status = update.status
    if update.cms_status:
        order.cms_status = update.cms_status
    if update.wms_status:
        order.wms_status = update.wms_status
    if update.ros_status:
        order.ros_status = update.ros_status
    if update.route_info:
        order.route_info = update.route_info

    db.commit()
    db.refresh(order)

    payload = {
        "event": "ORDER_UPDATED",
        "order_id": order.id,
        "display_id": f"ORD-{1000 + order.id}",
        "client_name": order.client_name,
        "pickup_address": order.pickup_address,
        "delivery_address": order.delivery_address,
        "priority": order.priority,
        "status": order.status,
        "cms_status": order.cms_status,
        "ros_status": order.ros_status,
        "wms_status": order.wms_status,
        "route_info": order.route_info
    }

    await manager.broadcast(payload)

    return {"message": "Status updated", "status": order.status}


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
        "display_id": f"ORD-{1000 + order.id}",
        "client_name": order.client_name,
        "pickup_address": order.pickup_address,
        "delivery_address": order.delivery_address,
        "priority": order.priority,
        "status": order.status,
        "cms_status": order.cms_status,
        "wms_status": order.wms_status,
        "ros_status": order.ros_status,
        "route_info": order.route_info
    }