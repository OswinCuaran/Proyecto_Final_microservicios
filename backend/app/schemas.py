from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ProductoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    stock: int


class ProductoCreate(ProductoBase):
    pass


class ProductoResponse(ProductoBase):
    id: int

    class Config:
        from_attributes = True


class DetallePedidoCreate(BaseModel):
    producto_id: int
    cantidad: int


class DetallePedidoResponse(BaseModel):
    id: int
    producto_id: int
    cantidad: int
    subtotal: float
    producto: ProductoResponse

    class Config:
        from_attributes = True


class PedidoCreate(BaseModel):
    mesa: int
    productos: List[DetallePedidoCreate]


class PedidoResponse(BaseModel):
    id: int
    mesa: int
    estado: str
    total: float
    fecha_creacion: datetime
    detalles: List[DetallePedidoResponse]

    class Config:
        from_attributes = True


class FacturaCreate(BaseModel):
    pedido_id: int
    metodo_pago: str


class FacturaResponse(BaseModel):
    id: int
    pedido_id: int
    total: float
    metodo_pago: str
    fecha_emision: datetime

    class Config:
        from_attributes = True