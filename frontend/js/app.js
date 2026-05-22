const API_URL = "http://localhost:8001";

const formProducto = document.getElementById("form-producto");
const formPedido = document.getElementById("form-pedido");
const tablaProductos = document.getElementById("tabla-productos");
const tablaPedidos = document.getElementById("tabla-pedidos");
const totalProductos = document.getElementById("total-productos");
const totalPedidos = document.getElementById("total-pedidos");
const totalFacturas = document.getElementById("total-facturas");
const btnCerrarJornada = document.getElementById("btn-cerrar-jornada");

async function cargarProductos() {
    const respuesta = await fetch(`${API_URL}/productos`);
    const productos = await respuesta.json();

    tablaProductos.innerHTML = "";

    productos.forEach(producto => {

        const estado = producto.stock > 0
            ? "Disponible"
            : "No disponible";

        tablaProductos.innerHTML += `
            <tr>
                <td>${producto.id}</td>
                <td>${producto.nombre}</td>
                <td>$${producto.precio}</td>
                <td>${producto.stock}</td>
                <td>${estado}</td>

                <td>
                    <button onclick="editarProducto(${producto.id}, '${producto.nombre}', '${producto.descripcion}', ${producto.precio}, ${producto.stock})">
                        Editar
                    </button>

                    <button onclick="eliminarProducto(${producto.id})">
                        Eliminar
                    </button>
                </td>
            </tr>
        `;
    });

    totalProductos.textContent = productos.length;
}

async function cargarPedidos() {

    const respuesta = await fetch(`${API_URL}/pedidos`);
    const pedidos = await respuesta.json();

    tablaPedidos.innerHTML = "";

    pedidos
        .filter(pedido => pedido.estado !== "Cerrado")
        .forEach(pedido => {

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
                    <button onclick="pagarPedido(${pedido.id})">
                        Pagar
                    </button>
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
                    <td>${pedido.estado}</td>
                    <td>$${pedido.total}</td>
                    <td>${accion}</td>
                </tr>
            `;
        });

    totalPedidos.textContent = pedidos
        .filter(pedido => pedido.estado !== "Cerrado")
        .length;
}

async function cargarFacturas() {
    const respuesta = await fetch(`${API_URL}/facturas`);
    const facturas = await respuesta.json();
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

btnCerrarJornada.addEventListener("click", async function () {
    const confirmar = confirm("¿Seguro que deseas cerrar la jornada? Los pedidos quedarán cerrados.");

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

cargarProductos();
cargarPedidos();
cargarFacturas();

async function eliminarProducto(productoId) {

    const confirmar = confirm(
        "¿Seguro que deseas eliminar este producto?"
    );

    if (!confirmar) return;

    const respuesta = await fetch(
        `${API_URL}/productos/${productoId}`,
        {
            method: "DELETE"
        }
    );

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

    const nuevaDescripcion = prompt(
        "Nueva descripción:",
        descripcion
    );

    const nuevoPrecio = parseFloat(
        prompt("Nuevo precio:", precio)
    );

    if (isNaN(nuevoPrecio) || nuevoPrecio <= 0) {
        alert("Precio inválido");
        return;
    }

    const nuevoStock = parseInt(
        prompt("Nuevo stock:", stock)
    );

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

    const respuesta = await fetch(
        `${API_URL}/productos/${id}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(productoActualizado)
        }
    );

    if (!respuesta.ok) {
        const error = await respuesta.json();
        alert(error.detail);
        return;
    }

    cargarProductos();
}