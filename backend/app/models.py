from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(String(255), nullable=True)
    precio = Column(Float, nullable=False)
    stock = Column(Integer, default=0)

    detalles = relationship("DetallePedido", back_populates="producto")


class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, index=True)
    mesa = Column(Integer, nullable=False)
    estado = Column(String(50), default="Pendiente")
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    total = Column(Float, default=0)

    detalles = relationship("DetallePedido", back_populates="pedido")
    factura = relationship("Factura", back_populates="pedido", uselist=False)


class DetallePedido(Base):
    __tablename__ = "detalle_pedidos"

    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id"))
    producto_id = Column(Integer, ForeignKey("productos.id"))
    cantidad = Column(Integer, nullable=False)
    subtotal = Column(Float, nullable=False)

    pedido = relationship("Pedido", back_populates="detalles")
    producto = relationship("Producto", back_populates="detalles")


class Factura(Base):
    __tablename__ = "facturas"

    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id"), unique=True)
    total = Column(Float, nullable=False)
    metodo_pago = Column(String(50), nullable=False)
    fecha_emision = Column(DateTime, default=datetime.utcnow)

    pedido = relationship("Pedido", back_populates="factura")