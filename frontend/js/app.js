const API_URL = "http://localhost:8001";

const formProducto = document.getElementById("form-producto");
const formPedido = document.getElementById("form-pedido");
const tablaProductos = document.getElementById("tabla-productos");
const tablaPedidos = document.getElementById("tabla-pedidos");
const tablaFacturas = document.getElementById("tabla-facturas");
const totalProductos = document.getElementById("total-productos");
const totalPedidos = document.getElementById("total-pedidos");
const totalFacturas = document.getElementById("total-facturas");
const btnCerrarJornada = document.getElementById("btn-cerrar-jornada");
const buscarProducto = document.getElementById("buscar-producto");
const filtroProductos = document.getElementById("filtro-productos");
const filtroPedidos = document.getElementById("filtro-pedidos");

let productosGlobal = [];
let pedidosGlobal = [];

function obtenerEstadoProducto(producto) {
    if (producto.stock === 0) {
        return '<span class="badge badge-rojo">Agotado</span>';
    }

    if (producto.stock <= 5) {
        return '<span class="badge badge-amarillo">Stock bajo</span>';
    }

    return '<span class="badge badge-verde">Disponible</span>';
}

function obtenerEstadoPedido(pedido) {
    if (pedido.estado === "Pendiente") {
        return '<span class="badge badge-amarillo">Pendiente</span>';
    }

    if (pedido.estado === "Facturado") {
        return '<span class="badge badge-verde">Pagado</span>';
    }

    return '<span class="badge badge-gris">Cerrado</span>';
}

function escaparTexto(texto) {
    return String(texto ?? "").replace(/'/g, "\\'");
}

function renderizarProductos() {
    const busqueda = buscarProducto.value.toLowerCase();
    const filtro = filtroProductos.value;

    let productosFiltrados = productosGlobal.filter(producto =>
        producto.nombre.toLowerCase().includes(busqueda)
    );

    if (filtro === "disponibles") {
        productosFiltrados = productosFiltrados.filter(producto => producto.stock > 5);
    }

    if (filtro === "stock-bajo") {
        productosFiltrados = productosFiltrados.filter(producto => producto.stock > 0 && producto.stock <= 5);
    }

    if (filtro === "agotados") {
        productosFiltrados = productosFiltrados.filter(producto => producto.stock === 0);
    }

    tablaProductos.innerHTML = "";

    productosFiltrados.forEach(producto => {
        tablaProductos.innerHTML += `
            <tr>
                <td>${producto.id}</td>
                <td>${producto.nombre}</td>
                <td>$${producto.precio}</td>
                <td>${producto.stock}</td>
                <td>${obtenerEstadoProducto(producto)}</td>
                <td>
                    <button onclick="editarProducto(${producto.id}, '${escaparTexto(producto.nombre)}', '${escaparTexto(producto.descripcion)}', ${producto.precio}, ${producto.stock})">
                        Editar
                    </button>
                    <button onclick="eliminarProducto(${producto.id})">
                        Eliminar
                    </button>
                </td>
            </tr>
        `;
    });

    totalProductos.textContent = productosFiltrados.length;
}

async function cargarProductos() {
    const respuesta = await fetch(`${API_URL}/productos`);
    productosGlobal = await respuesta.json();
    renderizarProductos();
}

function renderizarPedidos() {
    const filtro = filtroPedidos.value;

    let pedidosFiltrados = pedidosGlobal.filter(pedido => pedido.estado !== "Cerrado");

    if (filtro === "pendientes") {
        pedidosFiltrados = pedidosFiltrados.filter(pedido => pedido.estado === "Pendiente");
    }

    if (filtro === "pagados") {
        pedidosFiltrados = pedidosFiltrados.filter(pedido => pedido.estado === "Facturado");
    }

    tablaPedidos.innerHTML = "";

    pedidosFiltrados.forEach(pedido => {
        let productos = "Sin productos";
        let cantidades = "-";

        if (pedido.detalles && pedido.detalles.length > 0) {
            productos = pedido.detalles
                .map(detalle => detalle.producto ? detalle.producto.nombre : "Producto eliminado")
                .join(", ");

            cantidades = pedido.detalles
                .map(detalle => detalle.cantidad)
                .join(", ");
        }

        let accion = "";

        if (pedido.estado === "Pendiente") {
            accion = `
                <button onclick="pagarPedido(${pedido.id})">Pagar</button>
                <button onclick="editarPedido(${pedido.id}, ${pedido.mesa})">Editar</button>
                <button onclick="eliminarPedido(${pedido.id})">Eliminar</button>
            `;
        } else if (pedido.estado === "Facturado") {
            accion = "Pagado";
        } else {
            accion = "Cerrado";
        }

        tablaPedidos.innerHTML += `
            <tr>
                <td>${pedido.id}</td>
                <td>${pedido.mesa}</td>
                <td>${productos}</td>
                <td>${cantidades}</td>
                <td>${obtenerEstadoPedido(pedido)}</td>
                <td>$${pedido.total}</td>
                <td>${accion}</td>
            </tr>
        `;
    });

    totalPedidos.textContent = pedidosFiltrados.length;
}

async function cargarPedidos() {
    const respuesta = await fetch(`${API_URL}/pedidos`);
    pedidosGlobal = await respuesta.json();
    renderizarPedidos();
}

async function cargarFacturas() {
    const respuesta = await fetch(`${API_URL}/facturas`);
    const facturas = await respuesta.json();

    tablaFacturas.innerHTML = "";

    facturas.forEach(factura => {
        const fecha = new Date(factura.fecha_emision).toLocaleString();

        tablaFacturas.innerHTML += `
            <tr>
                <td>${factura.id}</td>
                <td>${factura.pedido_id}</td>
                <td>$${factura.total}</td>
                <td>${factura.metodo_pago}</td>
                <td>${fecha}</td>
            </tr>
        `;
    });

    totalFacturas.textContent = facturas.length;
}

formProducto.addEventListener("submit", async function (event) {
    event.preventDefault();

    const producto = {
        nombre: document.getElementById("nombre").value,
        descripcion: document.getElementById("descripcion").value,
        precio: parseFloat(document.getElementById("precio").value),
        stock: parseInt(document.getElementById("stock").value)
    };

    const respuesta = await fetch(`${API_URL}/productos`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(producto)
    });

    if (!respuesta.ok) {
        const error = await respuesta.json();
        alert(error.detail);
        return;
    }

    formProducto.reset();
    cargarProductos();
});

formPedido.addEventListener("submit", async function (event) {
    event.preventDefault();

    const pedido = {
        mesa: parseInt(document.getElementById("mesa").value),
        productos: [
            {
                producto_id: parseInt(document.getElementById("producto-id").value),
                cantidad: parseInt(document.getElementById("cantidad").value)
            }
        ]
    };

    const respuesta = await fetch(`${API_URL}/pedidos`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(pedido)
    });

    if (!respuesta.ok) {
        const error = await respuesta.json();
        alert(error.detail);
        return;
    }

    formPedido.reset();
    cargarProductos();
    cargarPedidos();
});

async function pagarPedido(pedidoId) {
    const respuesta = await fetch(`${API_URL}/pedidos/${pedidoId}/pagar?metodo_pago=Efectivo`, {
        method: "PUT"
    });

    if (!respuesta.ok) {
        const error = await respuesta.json();
        alert(error.detail);
        return;
    }

    cargarPedidos();
    cargarFacturas();
}

async function eliminarProducto(productoId) {
    const confirmar = confirm("¿Seguro que deseas eliminar este producto?");

    if (!confirmar) return;

    const respuesta = await fetch(`${API_URL}/productos/${productoId}`, {
        method: "DELETE"
    });

    if (!respuesta.ok) {
        const error = await respuesta.json();
        alert(error.detail);
        return;
    }

    cargarProductos();
}

async function editarProducto(id, nombre, descripcion, precio, stock) {
    const nuevoNombre = prompt("Nuevo nombre:", nombre);

    if (!nuevoNombre || nuevoNombre.trim() === "") {
        alert("El nombre es obligatorio");
        return;
    }

    const nuevaDescripcion = prompt("Nueva descripción:", descripcion);
    const nuevoPrecio = parseFloat(prompt("Nuevo precio:", precio));

    if (isNaN(nuevoPrecio) || nuevoPrecio <= 0) {
        alert("Precio inválido");
        return;
    }

    const nuevoStock = parseInt(prompt("Nuevo stock:", stock));

    if (isNaN(nuevoStock) || nuevoStock < 0) {
        alert("Stock inválido");
        return;
    }

    const productoActualizado = {
        nombre: nuevoNombre,
        descripcion: nuevaDescripcion,
        precio: nuevoPrecio,
        stock: nuevoStock
    };

    const respuesta = await fetch(`${API_URL}/productos/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(productoActualizado)
    });

    if (!respuesta.ok) {
        const error = await respuesta.json();
        alert(error.detail);
        return;
    }

    cargarProductos();
}

async function eliminarPedido(pedidoId) {
    const confirmar = confirm("¿Seguro que deseas eliminar este pedido? Se devolverá el stock.");

    if (!confirmar) return;

    const respuesta = await fetch(`${API_URL}/pedidos/${pedidoId}`, {
        method: "DELETE"
    });

    if (!respuesta.ok) {
        const error = await respuesta.json();
        alert(error.detail);
        return;
    }

    cargarProductos();
    cargarPedidos();
}

async function editarPedido(pedidoId, mesaActual) {
    const nuevaMesa = parseInt(prompt("Nuevo número de mesa:", mesaActual));

    if (isNaN(nuevaMesa) || nuevaMesa <= 0) {
        alert("La mesa debe ser mayor a 0");
        return;
    }

    const nuevoProductoId = parseInt(prompt("ID del producto:"));

    if (isNaN(nuevoProductoId) || nuevoProductoId <= 0) {
        alert("El ID del producto debe ser válido");
        return;
    }

    const nuevaCantidad = parseInt(prompt("Nueva cantidad:"));

    if (isNaN(nuevaCantidad) || nuevaCantidad <= 0) {
        alert("La cantidad debe ser mayor a 0");
        return;
    }

    const pedidoActualizado = {
        mesa: nuevaMesa,
        productos: [
            {
                producto_id: nuevoProductoId,
                cantidad: nuevaCantidad
            }
        ]
    };

    const respuesta = await fetch(`${API_URL}/pedidos/${pedidoId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(pedidoActualizado)
    });

    if (!respuesta.ok) {
        const error = await respuesta.json();
        alert(error.detail);
        return;
    }

    cargarProductos();
    cargarPedidos();
}

btnCerrarJornada.addEventListener("click", async function () {
    const confirmar = confirm("¿Seguro que deseas cerrar la jornada? Los pedidos facturados quedarán cerrados.");

    if (!confirmar) return;

    const respuesta = await fetch(`${API_URL}/jornada/cerrar`, {
        method: "POST"
    });

    if (!respuesta.ok) {
        const error = await respuesta.json();
        alert(error.detail);
        return;
    }

    alert("Jornada cerrada correctamente");

    cargarProductos();
    cargarPedidos();
    cargarFacturas();
});

buscarProducto.addEventListener("input", renderizarProductos);
filtroProductos.addEventListener("change", renderizarProductos);
filtroPedidos.addEventListener("change", renderizarPedidos);

cargarProductos();
cargarPedidos();
cargarFacturas();