const dinero = valor => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(valor) || 0);

const aviso = (mensaje, tipo = 'ok') => {
    const zona = document.querySelector('[data-mensaje]');
    if (zona) {
        zona.textContent = mensaje;
        zona.className = `mensaje ${tipo}`;
        zona.hidden = false;
    } else {
        alert(mensaje);
    }
};

function escapar(texto) {
    return String(texto).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

document.addEventListener("DOMContentLoaded", async () => {



    // RECUPERAR CONTRASEÑA (olvide-password.html)
    const formRecuperar = document.querySelector('#form-recuperar');
    if (formRecuperar) {
        formRecuperar.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = formRecuperar.email.value.trim().toLowerCase();
            
            if (!email) {
                return aviso('Por favor ingresá tu correo electrónico.', 'error');
            }

            const res = await recuperaContraseñaLocal(email); // O llamando a la api de Supabase
            // Usando la función directa de Supabase:
            const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/actualizar-password.html',
            });

            if (error) {
                return aviso('Error al enviar el correo: ' + error.message, 'error');
            }

            aviso('¡Correo enviado! Revisá tu bandeja de entrada para restablecer tu contraseña.', 'ok');
            formRecuperar.reset();
        });
    }










    // 1. SALUDO Y CERRAR SESIÓN (principal.html)
    const saludo = document.querySelector('[data-saludo]');
    if (saludo) {
        const sesion = JSON.parse(sessionStorage.getItem('ac_sesion') || 'null');
        if (sesion && sesion.username) {
            const nombreMostrar = sesion.username.split('@')[0];
            saludo.textContent = `¡Hola, ${nombreMostrar}!`;
        }
    }

    const salir = document.querySelector('[data-salir]');
    if (salir) {
        salir.addEventListener('click', () => {
            sessionStorage.removeItem('ac_sesion');
            location.href = 'index.html';
        });
    }

    // 2. CREAR CUENTA (crear-cuenta.html)
    const formRegistro = document.querySelector('#form-registro');
    if (formRegistro) {
        formRegistro.addEventListener('submit', async (e) => {
            e.preventDefault();
            const datos = Object.fromEntries(new FormData(formRegistro));
            if (datos.password !== datos.confirmar) {
                return aviso('Las contraseñas no coinciden.', 'error');
            }
            const email = datos.email.trim().toLowerCase();
            const res = await registrarUsuario(email, datos.password);
            if (res.error) {
                return aviso(res.error, 'error');
            }
            formRegistro.reset();
            aviso('¡Cuenta creada en Supabase! Ya podés iniciar sesión.');
        });
    }

    // 3. INICIAR SESIÓN (index.html)
    const formLogin = document.querySelector('#form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = formLogin.email.value.trim().toLowerCase();
            const pass = formLogin.password.value;
            const user = await iniciarSesion(email, pass);
            if (!user) {
                return aviso('Correo o contraseña incorrectos. Revisá tus datos.', 'error');
            }
            location.href = 'principal.html';
        });
    }

    // 4. PRODUCTOS CRUD (agregar.html)
    const formProducto = document.querySelector('#form-producto');
    if (formProducto) {
        const renderProductos = async () => {
            const lista = await obtenerProductos();
            const cuerpo = document.querySelector('#tabla-productos tbody');
            const contador = document.querySelector('#cantidad-productos');
            if (contador) contador.textContent = lista.length;

            cuerpo.innerHTML = lista.length
                ? lista.map(p => `
                    <tr>
                        <td>${escapar(p.nombre_producto)}</td>
                        <td>${p.cantidad}</td>
                        <td>${dinero(p.precio)}</td>
                        <td>
                            <button class="btn btn-secundario btn-chico" data-editar="${p.id_producto}" data-cant="${p.cantidad}" data-precio="${p.precio}" type="button">Editar</button>
                            <button class="btn btn-peligro btn-chico" data-eliminar="${p.id_producto}" type="button">Eliminar</button>
                        </td>
                    </tr>`).join('')
                : '<tr><td colspan="4" class="vacio">Todavía no hay productos cargados.</td></tr>';
        };

        formProducto.addEventListener('submit', async (e) => {
            e.preventDefault();
            const datos = Object.fromEntries(new FormData(formProducto));
            if (Number(datos.cantidad) < 0 || Number(datos.precio) < 0) {
                return aviso('La cantidad y el precio no pueden ser negativos.', 'error');
            }
            const ok = await crearProducto(datos.nombre.trim(), datos.cantidad, datos.precio);
            if (ok) {
                formProducto.reset();
                await renderProductos();
                aviso('Producto agregado correctamente a Supabase.');
            } else {
                aviso('Error al guardar el producto.', 'error');
            }
        });

        document.querySelector('#tabla-productos').addEventListener('click', async (e) => {
            const idEliminar = Number(e.target.dataset.eliminar);
            if (idEliminar) {
                if (confirm('¿Eliminar este producto?')) {
                    const ok = await eliminarProducto(idEliminar);
                    if (ok) {
                        await renderProductos();
                        aviso('Producto eliminado.');
                    }
                }
            }

            const idEditar = Number(e.target.dataset.editar);
            if (idEditar) {
                const nuevaCant = prompt('Nueva cantidad en stock:', e.target.dataset.cant);
                if (nuevaCant === null) return;
                const nuevoPrecio = prompt('Nuevo precio unitario:', e.target.dataset.precio);
                if (nuevoPrecio === null) return;

                const ok = await actualizarProducto(idEditar, nuevaCant, nuevoPrecio);
                if (ok) {
                    await renderProductos();
                    aviso('Producto actualizado correctamente.');
                }
            }
        });

        await renderProductos();
    }

    // 5. INVENTARIO SOLO LECTURA (inventario.html)
    const cuerpoInventario = document.querySelector('#cuerpo-inventario');
    if (cuerpoInventario) {
        const datos = await obtenerProductos();
        cuerpoInventario.innerHTML = datos.length
            ? datos.map(p => `
                <tr>
                    <td>${escapar(p.nombre_producto)}</td>
                    <td>${p.cantidad}</td>
                    <td>${dinero(p.precio)}</td>
                    <td>${p.cantidad === 0
                        ? '<span style="color:#c24141">Sin stock</span>'
                        : p.cantidad <= 5
                            ? '<span style="color:#a16207">Stock bajo</span>'
                            : 'Disponible'}</td>
                </tr>`).join('')
            : '<tr><td colspan="4" class="vacio">No hay productos. <a href="agregar.html">Agregar el primero</a>.</td></tr>';
    }

    // 6. REGISTRAR VENTAS (registrar.html)
    const formVenta = document.querySelector('#form-venta');
    if (formVenta) {
        const selector = formVenta.producto;
        let listaCache = [];

        const cargarOpciones = async () => {
            listaCache = await obtenerProductos();
            selector.innerHTML = '<option value="">Seleccioná un producto</option>' +
                listaCache.map(p => `<option value="${p.id_producto}">${escapar(p.nombre_producto)} — ${p.cantidad} disponibles</option>`).join('');
        };

        const actualizarTotal = () => {
            const p = listaCache.find(x => x.id_producto === Number(selector.value));
            const cantidad = Number(formVenta.cantidad.value);
            formVenta.total.value = (p && cantidad > 0) ? dinero(p.precio * cantidad) : '';
        };

        selector.addEventListener('change', actualizarTotal);
        formVenta.cantidad.addEventListener('input', actualizarTotal);
        await cargarOpciones();

        formVenta.addEventListener('submit', async (e) => {
            e.preventDefault();
            const p = listaCache.find(x => x.id_producto === Number(selector.value));
            const cantidad = Number(formVenta.cantidad.value);

            if (!p) return aviso('Primero seleccioná un producto.', 'error');
            if (!Number.isInteger(cantidad) || cantidad < 1) return aviso('Ingresá una cantidad válida.', 'error');
            if (cantidad > p.cantidad) return aviso('No hay suficiente stock para esa venta.', 'error');

            const sesion = JSON.parse(sessionStorage.getItem('ac_sesion') || 'null');
            const idUsuario = sesion ? sesion.id_usuario : 1;

            const ok = await registrarVentaConDetalle(idUsuario, p, cantidad);
            if (ok) {
                formVenta.reset();
                actualizarTotal();
                await cargarOpciones();
                aviso('Venta registrada y stock actualizado en Supabase.');
            } else {
                aviso('Error al registrar la venta.', 'error');
            }
        });
    }

    // 7. HISTORIAL DE VENTAS (historial-ventas.html)
    const tablaVentas = document.querySelector('#tabla-ventas tbody');
    if (tablaVentas) {
        const ventas = await obtenerHistorialVentas();
        tablaVentas.innerHTML = ventas.length
            ? ventas.map(v => {
                const fechaFormateada = v.ventas && v.ventas.fecha
                    ? new Date(v.ventas.fecha).toLocaleString('es-AR')
                    : '-';
                const nombreProd = v.productos ? v.productos.nombre_producto : 'Producto eliminado';
                const totalVenta = v.cantidad * v.precio_unitario;
                return `
                    <tr>
                        <td>${fechaFormateada}</td>
                        <td>${escapar(nombreProd)}</td>
                        <td>${v.cantidad}</td>
                        <td>${dinero(totalVenta)}</td>
                    </tr>`;
            }).join('')
            : '<tr><td colspan="4" class="vacio">Todavía no hay ventas registradas.</td></tr>';
    }

    // 8. REPORTAR PROBLEMAS (reportar.html)
    const formProblema = document.querySelector('#form-problema');
    if (formProblema) {
        formProblema.addEventListener('submit', async (e) => {
            e.preventDefault();
            const texto = formProblema.problema.value.trim();
            if (!texto) return;

            const sesion = JSON.parse(sessionStorage.getItem('ac_sesion') || 'null');
            const idUsuario = sesion ? sesion.id_usuario : 1;

            const ok = await enviarReporte(texto, idUsuario);
            if (ok) {
                formProblema.reset();
                aviso('Gracias. Tu reporte quedó guardado en la base de datos.');
            } else {
                aviso('Hubo un problema al enviar el reporte.', 'error');
            }
        });
    }
});


