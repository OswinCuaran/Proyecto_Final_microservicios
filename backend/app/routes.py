from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models import Producto, Pedido, DetallePedido
from schemas import ProductoCreate, ProductoResponse, PedidoCreate, PedidoResponse
from models import Producto, Pedido, DetallePedido, Factura
from schemas import ProductoCreate, ProductoResponse, PedidoCreate, PedidoResponse, FacturaCreate, FacturaResponse

from database import get_db
from models import Producto
from schemas import ProductoCreate, ProductoResponse


router = APIRouter()

# Rutas
@router.post("/productos", response_model=ProductoResponse)
def crear_producto(producto: ProductoCreate, db: Session = Depends(get_db)):

    producto_existente = db.query(Producto).filter(
        Producto.nombre.ilike(producto.nombre)
    ).first()

    if producto_existente:
        producto_existente.stock += producto.stock
        producto_existente.precio = producto.precio
        producto_existente.descripcion = producto.descripcion

        db.commit()
        db.refresh(producto_existente)

        return producto_existente

    nuevo_producto = Producto(
        nombre=producto.nombre,
        descripcion=producto.descripcion,
        precio=producto.precio,
        stock=producto.stock
    )

    db.add(nuevo_producto)
    db.commit()
    db.refresh(nuevo_producto)

    return nuevo_producto


@router.get("/productos", response_model=list[ProductoResponse])
def listar_productos(db: Session = Depends(get_db)):
    productos = db.query(Producto).all()
    return productos


@router.get("/productos/{producto_id}", response_model=ProductoResponse)
def obtener_producto(producto_id: int, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id == producto_id).first()

    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    return producto

@router.post("/pedidos", response_model=PedidoResponse)
def crear_pedido(pedido: PedidoCreate, db: Session = Depends(get_db)):

    total_pedido = 0
    detalles_temporales = []

    for item in pedido.productos:
        producto = db.query(Producto).filter(Producto.id == item.producto_id).first()

        if not producto:
            raise HTTPException(
                status_code=404,
                detail=f"Producto con ID {item.producto_id} no encontrado"
            )

        if producto.stock < item.cantidad:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente para {producto.nombre}"
            )

        subtotal = producto.precio * item.cantidad
        total_pedido += subtotal

        detalles_temporales.append({
            "producto": producto,
            "cantidad": item.cantidad,
            "subtotal": subtotal
        })

    nuevo_pedido = Pedido(
        mesa=pedido.mesa,
        estado="Pendiente",
        total=total_pedido
    )

    db.add(nuevo_pedido)
    db.commit()
    db.refresh(nuevo_pedido)

    for item in detalles_temporales:
        producto = item["producto"]
        producto.stock -= item["cantidad"]

        detalle = DetallePedido(
            pedido_id=nuevo_pedido.id,
            producto_id=producto.id,
            cantidad=item["cantidad"],
            subtotal=item["subtotal"]
        )

        db.add(detalle)

    db.commit()
    db.refresh(nuevo_pedido)

    return nuevo_pedido


@router.get("/pedidos", response_model=list[PedidoResponse])
def listar_pedidos(db: Session = Depends(get_db)):
    return db.query(Pedido).all()


@router.get("/pedidos/{pedido_id}", response_model=PedidoResponse)
def obtener_pedido(pedido_id: int, db: Session = Depends(get_db)):
    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()

    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    return pedido

@router.post("/facturas", response_model=FacturaResponse)
def crear_factura(factura: FacturaCreate, db: Session = Depends(get_db)):
    pedido = db.query(Pedido).filter(Pedido.id == factura.pedido_id).first()

    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    factura_existente = db.query(Factura).filter(Factura.pedido_id == factura.pedido_id).first()

    if factura_existente:
        raise HTTPException(status_code=400, detail="Este pedido ya tiene factura")

    nueva_factura = Factura(
        pedido_id=pedido.id,
        total=pedido.total,
        metodo_pago=factura.metodo_pago
    )

    pedido.estado = "Facturado"

    db.add(nueva_factura)
    db.commit()
    db.refresh(nueva_factura)

    return nueva_factura


@router.get("/facturas", response_model=list[FacturaResponse])
def listar_facturas(db: Session = Depends(get_db)):
    return db.query(Factura).all()