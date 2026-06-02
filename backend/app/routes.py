from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Producto, Pedido, DetallePedido, Factura, Jornada
from schemas import ProductoCreate, ProductoResponse, PedidoCreate, PedidoResponse, FacturaCreate, FacturaResponse, JornadaResponse


router = APIRouter()

# Rutas para productos, pedidos, facturas y jornadas
@router.post("/productos", response_model=ProductoResponse)
def crear_producto(producto: ProductoCreate, db: Session = Depends(get_db)):

    if producto.precio <= 0:
        raise HTTPException(status_code=400, detail="El precio debe ser mayor a 0")

    if producto.stock < 0:
        raise HTTPException(status_code=400, detail="El stock no puede ser negativo")

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
    return db.query(Producto).order_by(Producto.id).all()


@router.get("/productos/{producto_id}", response_model=ProductoResponse)
def obtener_producto(producto_id: int, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id == producto_id).first()

    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    return producto


@router.put("/productos/{producto_id}", response_model=ProductoResponse)
def actualizar_producto(producto_id: int, producto_actualizado: ProductoCreate, db: Session = Depends(get_db)):

    producto = db.query(Producto).filter(Producto.id == producto_id).first()

    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    if producto_actualizado.precio <= 0:
        raise HTTPException(status_code=400, detail="El precio debe ser mayor a 0")

    if producto_actualizado.stock < 0:
        raise HTTPException(status_code=400, detail="El stock no puede ser negativo")

    producto.nombre = producto_actualizado.nombre
    producto.descripcion = producto_actualizado.descripcion
    producto.precio = producto_actualizado.precio
    producto.stock = producto_actualizado.stock

    db.commit()
    db.refresh(producto)

    return producto


@router.delete("/productos/{producto_id}")
def eliminar_producto(producto_id: int, db: Session = Depends(get_db)):

    producto = db.query(Producto).filter(Producto.id == producto_id).first()

    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    tiene_pedidos = db.query(DetallePedido).filter(
        DetallePedido.producto_id == producto_id
    ).first()

    if tiene_pedidos:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar este producto porque ya está asociado a pedidos. Puedes dejar su stock en 0 o editarlo."
        )

    db.delete(producto)
    db.commit()

    return {"message": "Producto eliminado correctamente"}


@router.post("/pedidos", response_model=PedidoResponse)
def crear_pedido(pedido: PedidoCreate, db: Session = Depends(get_db)):

    if pedido.mesa <= 0:
        raise HTTPException(status_code=400, detail="El número de mesa debe ser mayor a 0")

    total_pedido = 0
    detalles_temporales = []

    for item in pedido.productos:

        if item.cantidad <= 0:
            raise HTTPException(status_code=400, detail="La cantidad debe ser mayor a 0")

        producto = db.query(Producto).filter(Producto.id == item.producto_id).first()

        if not producto:
            raise HTTPException(status_code=404, detail=f"Producto con ID {item.producto_id} no encontrado")

        if producto.stock <= 0:
            raise HTTPException(status_code=400, detail=f"{producto.nombre} no está disponible")

        if producto.stock < item.cantidad:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para {producto.nombre}")

        subtotal = producto.precio * item.cantidad
        total_pedido += subtotal

        detalles_temporales.append({
            "producto": producto,
            "cantidad": item.cantidad,
            "subtotal": subtotal
        })

    nuevo_pedido = Pedido(mesa=pedido.mesa, estado="Pendiente", total=total_pedido)

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
    pedidos = db.query(Pedido).order_by(Pedido.id).all()

    for pedido in pedidos:
        pedido.detalles

    return pedidos


@router.get("/pedidos/{pedido_id}", response_model=PedidoResponse)
def obtener_pedido(pedido_id: int, db: Session = Depends(get_db)):

    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()

    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    pedido.detalles

    return pedido


@router.put("/pedidos/{pedido_id}", response_model=PedidoResponse)
def actualizar_pedido(pedido_id: int, pedido_actualizado: PedidoCreate, db: Session = Depends(get_db)):

    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()

    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    if pedido.estado != "Pendiente":
        raise HTTPException(status_code=400, detail="Solo se pueden modificar pedidos pendientes")

    if pedido_actualizado.mesa <= 0:
        raise HTTPException(status_code=400, detail="El número de mesa debe ser mayor a 0")

    detalles_actuales = db.query(DetallePedido).filter(
        DetallePedido.pedido_id == pedido_id
    ).all()

    for detalle in detalles_actuales:
        producto = db.query(Producto).filter(Producto.id == detalle.producto_id).first()

        if producto:
            producto.stock += detalle.cantidad

        db.delete(detalle)

    total_pedido = 0
    detalles_temporales = []

    for item in pedido_actualizado.productos:

        if item.cantidad <= 0:
            raise HTTPException(status_code=400, detail="La cantidad debe ser mayor a 0")

        producto = db.query(Producto).filter(Producto.id == item.producto_id).first()

        if not producto:
            raise HTTPException(status_code=404, detail=f"Producto con ID {item.producto_id} no encontrado")

        if producto.stock < item.cantidad:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para {producto.nombre}")

        subtotal = producto.precio * item.cantidad
        total_pedido += subtotal

        detalles_temporales.append({
            "producto": producto,
            "cantidad": item.cantidad,
            "subtotal": subtotal
        })

    pedido.mesa = pedido_actualizado.mesa
    pedido.total = total_pedido

    for item in detalles_temporales:
        producto = item["producto"]
        producto.stock -= item["cantidad"]

        nuevo_detalle = DetallePedido(
            pedido_id=pedido.id,
            producto_id=producto.id,
            cantidad=item["cantidad"],
            subtotal=item["subtotal"]
        )

        db.add(nuevo_detalle)

    db.commit()
    db.refresh(pedido)

    return pedido


@router.delete("/pedidos/{pedido_id}")
def eliminar_pedido(pedido_id: int, db: Session = Depends(get_db)):

    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()

    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    if pedido.estado == "Facturado" or pedido.estado == "Cerrado":
        raise HTTPException(status_code=400, detail="No se puede eliminar un pedido facturado o cerrado")

    detalles = db.query(DetallePedido).filter(
        DetallePedido.pedido_id == pedido_id
    ).all()

    for detalle in detalles:
        producto = db.query(Producto).filter(Producto.id == detalle.producto_id).first()

        if producto:
            producto.stock += detalle.cantidad

        db.delete(detalle)

    db.delete(pedido)
    db.commit()

    return {"message": "Pedido eliminado correctamente"}


@router.post("/facturas", response_model=FacturaResponse)
def crear_factura(factura: FacturaCreate, db: Session = Depends(get_db)):

    pedido = db.query(Pedido).filter(Pedido.id == factura.pedido_id).first()

    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    if pedido.estado != "Pendiente":
        raise HTTPException(status_code=400, detail="Solo se pueden facturar pedidos pendientes")

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
    return db.query(Factura).order_by(Factura.id).all()


@router.put("/pedidos/{pedido_id}/pagar", response_model=FacturaResponse)
def pagar_pedido(pedido_id: int, metodo_pago: str = "Efectivo", db: Session = Depends(get_db)):

    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()

    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    if pedido.estado != "Pendiente":
        raise HTTPException(status_code=400, detail="Este pedido ya no se puede pagar")

    nueva_factura = Factura(
        pedido_id=pedido.id,
        total=pedido.total,
        metodo_pago=metodo_pago
    )

    pedido.estado = "Facturado"

    db.add(nueva_factura)
    db.commit()
    db.refresh(nueva_factura)

    return nueva_factura


@router.post("/jornada/cerrar", response_model=JornadaResponse)
def cerrar_jornada(db: Session = Depends(get_db)):

    pedidos_jornada = db.query(Pedido).filter(Pedido.estado == "Facturado").all()
    facturas_jornada = db.query(Factura).filter(
        Factura.pedido_id.in_([pedido.id for pedido in pedidos_jornada])
    ).all()

    total_pedidos = len(pedidos_jornada)

    if total_pedidos == 0:
        raise HTTPException(status_code=400, detail="No hay pedidos facturados para cerrar jornada")

    total_facturado = sum(factura.total for factura in facturas_jornada)

    nueva_jornada = Jornada(
        fecha_cierre=datetime.utcnow(),
        total_pedidos=total_pedidos,
        total_facturado=total_facturado,
        estado="Cerrada"
    )

    db.add(nueva_jornada)

    for pedido in pedidos_jornada:
        pedido.estado = "Cerrado"

    db.commit()
    db.refresh(nueva_jornada)

    return nueva_jornada


@router.get("/jornadas", response_model=list[JornadaResponse])
def listar_jornadas(db: Session = Depends(get_db)):
    return db.query(Jornada).order_by(Jornada.id).all()