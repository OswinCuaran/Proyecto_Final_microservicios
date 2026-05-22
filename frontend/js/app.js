const API_URL = "http://localhost:8001";

const formProducto = document.getElementById("form-producto");
const formPedido = document.getElementById("form-pedido");

const tablaProductos = document.getElementById("tabla-productos");
const tablaPedidos = document.getElementById("tabla-pedidos");

const totalProductos = document.getElementById("total-productos");
const totalPedidos = document.getElementById("total-pedidos");
const totalFacturas = document.getElementById("total-facturas");

async function cargarProductos() {
    const respuesta = await fetch(`${API_URL}/productos`);
    const productos = await respuesta.json();

    tablaProductos.innerHTML = "";

    productos.forEach(producto => {
    const estado = producto.stock > 0 ? "Disponible" : "No disponible";

    tablaProductos.innerHTML += `
        <tr>
            <td>${producto.id}</td>
            <td>${producto.nombre}</td>
            <td>$${producto.precio}</td>
            <td>${producto.stock}</td>
            <td>${estado}</td>
        </tr>
    `;
});

    totalProductos.textContent = productos.length;
}

async function cargarPedidos() {
    const respuesta = await fetch(`${API_URL}/pedidos`);
    const pedidos = await respuesta.json();

    tablaPedidos.innerHTML = "";

    pedidos.forEach(pedido => {
        const productos = pedido.detalles.map(detalle => detalle.producto.nombre).join(", ");
        const cantidades = pedido.detalles.map(detalle => detalle.cantidad).join(", ");

        tablaPedidos.innerHTML += `
            <tr>
                <td>${pedido.id}</td>
                <td>${pedido.mesa}</td>
                <td>${productos}</td>
                <td>${cantidades}</td>
                <td>${pedido.estado}</td>
                <td>$${pedido.total}</td>
            </tr>
        `;
    });

    totalPedidos.textContent = pedidos.length;
}

async function cargarFacturas() {
    const respuesta = await fetch(`${API_URL}/facturas`);
    const facturas = await respuesta.json();

    totalFacturas.textContent = facturas.length;
}

formProducto.addEventListener("submit", async function(event) {
    event.preventDefault();

    const producto = {
        nombre: document.getElementById("nombre").value,
        descripcion: document.getElementById("descripcion").value,
        precio: parseFloat(document.getElementById("precio").value),
        stock: parseInt(document.getElementById("stock").value)
    };

    await fetch(`${API_URL}/productos`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(producto)
    });

    formProducto.reset();
    cargarProductos();
});

formPedido.addEventListener("submit", async function(event) {
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

cargarProductos();
cargarPedidos();
cargarFacturas();