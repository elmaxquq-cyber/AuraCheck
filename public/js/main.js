document.addEventListener("DOMContentLoaded", async () => {
    const paginaActual = window.location.pathname;

    // 1. LOGIN Y REGISTRO (index.html)
    const formLogin = document.getElementById("login");
    if (formLogin) {
        formLogin.addEventListener("submit", async (e) => {
            e.preventDefault();
            const usuario = document.getElementById("usuario").value.trim();
            const password = document.getElementById("password").value.trim();

            const exito = await iniciarSesion(usuario, password);
            if (exito) {
                window.location.href = "principal.html";
            }
        });

        const enlaceRegistro = formLogin.querySelector(".registrar a");
        if (enlaceRegistro) {
            enlaceRegistro.addEventListener("click", async (e) => {
                e.preventDefault();
                const nuevoUser = prompt("Crea un nombre de usuario nuevo:");
                if (!nuevoUser || !nuevoUser.trim()) return;
                const nuevaPass = prompt("Crea una contraseña para " + nuevoUser.trim() + ":");
                if (!nuevaPass || !nuevaPass.trim()) return;

                const creado = await registrarUsuario(nuevoUser.trim(), nuevaPass.trim());
                if (creado) {
                    alert("Cuenta creada con exito. Iniciando sesion...");
                    window.location.href = "principal.html";
                }
            });
        }
    }

    // 2. INVENTARIO / PRODUCTOS (agregar.html)
    if (paginaActual.includes("agregar.html")) {
        const divFormulario = document.querySelector(".formulario");
        const inputProducto = document.getElementById("producto");
        const inputCantidad = document.getElementById("cantidad");
        const botones = divFormulario ? divFormulario.querySelectorAll("button") : [];

        // Crear dinamicamente input de precio si no existe en el HTML
        let inputPrecio = document.getElementById("precio-producto");
        if (!inputPrecio && divFormulario && botones.length > 0) {
            inputPrecio = document.createElement("input");
            inputPrecio.type = "number";
            inputPrecio.id = "precio-producto";
            inputPrecio.step = "0.01";
            inputPrecio.placeholder = "Precio ($)";
            divFormulario.insertBefore(inputPrecio, botones[0]);
        }

        // Crear contenedor de tabla de stock dinamico debajo del formulario
        let contenedorTabla = document.getElementById("contenedor-stock");
        if (!contenedorTabla) {
            contenedorTabla = document.createElement("div");
            contenedorTabla.id = "contenedor-stock";
            contenedorTabla.style.marginTop = "25px";
            document.body.appendChild(contenedorTabla);
        }

        await renderizarTablaStock(contenedorTabla);

        // Boton Agregar (primer boton dentro de .formulario)
        if (botones[0]) {
            botones[0].addEventListener("click", async (e) => {
                e.preventDefault();
                const nombre = inputProducto.value.trim();
                const cantidad = inputCantidad.value;
                const precio = inputPrecio ? inputPrecio.value : 0;

                if (!nombre || !cantidad) {
                    alert("Completa el nombre del producto y la cantidad");
                    return;
                }

                const ok = await crearProducto(nombre, cantidad, precio);
                if (ok) {
                    alert("Producto guardado en la base de datos");
                    inputProducto.value = "";
                    inputCantidad.value = "";
                    if (inputPrecio) inputPrecio.value = "";
                    await renderizarTablaStock(contenedorTabla);
                }
            });
        }

        // Boton Eliminar (segundo boton dentro de .formulario)
        if (botones[1]) {
            botones[1].addEventListener("click", async (e) => {
                e.preventDefault();
                const nombre = inputProducto.value.trim();
                if (!nombre) {
                    alert("Escribe el nombre del producto que deseas eliminar");
                    return;
                }
                if (confirm("Deseas eliminar el producto: " + nombre + "?")) {
                    const ok = await eliminarProductoPorNombre(nombre);
                    if (ok) {
                        alert("Producto eliminado");
                        inputProducto.value = "";
                        await renderizarTablaStock(contenedorTabla);
                    }
                }
            });
        }
    }

    // 3. REGISTRAR VENTAS (registrar.html)
    if (paginaActual.includes("registrar.html")) {
        const selectProducto = document.getElementById("producto");
        const inputCantidad = document.getElementById("cantidad");
        const inputPrecio = document.getElementById("precio");
        const inputTotal = document.getElementById("total");
        const btnRegistrar = document.querySelector(".contenedor button");

        const listaProductos = await obtenerProductos();

        if (selectProducto && listaProductos.length > 0) {
            selectProducto.innerHTML = '<option value="">Selecciona un producto</option>';
            listaProductos.forEach((p) => {
                const opt = document.createElement("option");
                opt.value = p.id_producto;
                opt.dataset.precio = p.precio;
                opt.textContent = `${p.nombre_producto} (Stock: ${p.cantidad})`;
                selectProducto.appendChild(opt);
            });

            selectProducto.addEventListener("change", () => {
                const opcion = selectProducto.options[selectProducto.selectedIndex];
                if (opcion && opcion.dataset.precio) {
                    inputPrecio.value = opcion.dataset.precio;
                    calcularTotalVenta();
                } else {
                    inputPrecio.value = "";
                    inputTotal.value = "";
                }
            });
        }

        function calcularTotalVenta() {
            const cant = parseFloat(inputCantidad.value) || 0;
            const prec = parseFloat(inputPrecio.value) || 0;
            inputTotal.value = (cant * prec).toFixed(2);
        }

        if (inputCantidad) inputCantidad.addEventListener("input", calcularTotalVenta);
        if (inputPrecio) inputPrecio.addEventListener("input", calcularTotalVenta);

        if (btnRegistrar) {
            btnRegistrar.addEventListener("click", async (e) => {
                e.preventDefault();
                const usuarioGuardado = JSON.parse(localStorage.getItem("usuario_actual"));
                const idUsuario = usuarioGuardado ? usuarioGuardado.id_usuario : 1;

                const idProducto = selectProducto.value;
                const cantidad = inputCantidad.value;
                const precio = inputPrecio.value;

                if (!idProducto || !cantidad || !precio) {
                    alert("Completa todos los campos de la venta");
                    return;
                }

                const ok = await registrarVentaConDetalle(idUsuario, idProducto, cantidad, precio);
                if (ok) {
                    alert("Venta registrada con exito");
                    selectProducto.value = "";
                    inputCantidad.value = "";
                    inputPrecio.value = "";
                    inputTotal.value = "";
                }
            });
        }
    }

    // 4. REPORTAR PROBLEMAS (reportar.html)
    if (paginaActual.includes("reportar.html")) {
        const formReporte = document.querySelector("section form");
        const campoProblema = document.getElementById("problema");

        if (formReporte && campoProblema) {
            formReporte.addEventListener("submit", async (e) => {
                e.preventDefault();
                const descripcion = campoProblema.value.trim();
                if (!descripcion) {
                    alert("Por favor escribe la descripcion del problema");
                    return;
                }

                const usuarioGuardado = JSON.parse(localStorage.getItem("usuario_actual"));
                const idUsuario = usuarioGuardado ? usuarioGuardado.id_usuario : 1;

                const ok = await enviarReporte(descripcion, idUsuario);
                if (ok) {
                    alert("Reporte enviado correctamente");
                    formReporte.reset();
                }
            });
        }
    }
});

async function renderizarTablaStock(contenedor) {
    const productos = await obtenerProductos();
    if (productos.length === 0) {
        contenedor.innerHTML = "<p>No hay productos cargados en el inventario.</p>";
        return;
    }

    let html = `
        <table border="1" style="width: 90%; margin: 0 auto; border-collapse: collapse; text-align: center;">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
    `;

    productos.forEach((p) => {
        html += `
            <tr>
                <td>${p.id_producto}</td>
                <td>${p.nombre_producto}</td>
                <td>${p.cantidad}</td>
                <td>$${p.precio}</td>
                <td>
                    <button onclick="editarStock(${p.id_producto}, ${p.cantidad}, ${p.precio})">Editar</button>
                    <button onclick="borrarStock(${p.id_producto})">Eliminar</button>
                </td>
            </tr>
        `;
    });

    html += "</tbody></table>";
    contenedor.innerHTML = html;
}

async function editarStock(id, cantActual, precioActual) {
    const nuevaCant = prompt("Nueva cantidad:", cantActual);
    if (nuevaCant === null) return;
    const nuevoPrecio = prompt("Nuevo precio:", precioActual);
    if (nuevoPrecio === null) return;

    const ok = await actualizarProducto(id, nuevaCant, nuevoPrecio);
    if (ok) location.reload();
}

async function borrarStock(id) {
    if (confirm("Eliminar este producto del inventario?")) {
        const ok = await eliminarProducto(id);
        if (ok) location.reload();
    }
}