from fastapi import FastAPI
from fastapi import Response

app = FastAPI()


@app.post(
    "/soap/create-order"
)
async def create_order(order_id: int):

    response_xml = f"""
    <OrderResponse>
        <OrderId>{order_id}</OrderId>
        <Status>CMS_ORDER_CREATED</Status>
    </OrderResponse>
    """

    return Response(
        content=response_xml,
        media_type="application/xml"
    )