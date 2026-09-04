from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import DateTime

from sqlalchemy.sql import func

from .database import Base


class Order(Base):

    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)

    client_name = Column(String, nullable=False)

    pickup_address = Column(String, nullable=False)

    delivery_address = Column(String, nullable=False)

    priority = Column(String, default="normal")

    status = Column(String, default="PENDING")

    cms_status = Column(String, default="PENDING")

    wms_status = Column(String, default="PENDING")

    ros_status = Column(String, default="PENDING")

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )