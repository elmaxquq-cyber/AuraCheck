// AuraCheck: demostración frontend. Los datos se guardan en el navegador (localStorage).
const leer = (clave, defecto = []) => JSON.parse(localStorage.getItem(clave) || JSON.stringify(defecto));
const guardar = (clave, valor) => localStorage.setItem(clave, JSON.stringify(valor));
const dinero = valor => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(valor) || 0);
const aviso = (mensaje, tipo = 'ok') => {
  const zona = document.querySelector('[data-mensaje]');
  if (zona) { zona.textContent = mensaje; zona.className = `mensaje ${tipo}`; zona.hidden = false; }
  else alert(mensaje);
};

// Registro e inicio de sesión (prototipo local, no apto para producción).
const registro = document.querySelector('#form-registro');
if (registro) registro.addEventListener('submit', e => {
  e.preventDefault();
  const datos = Object.fromEntries(new FormData(registro));
  if (datos.password !== datos.confirmar) return aviso('Las contraseñas no coinciden.', 'error');
  const usuarios = leer('ac_usuarios');
  if (usuarios.some(u => u.email.toLowerCase() === datos.email.toLowerCase())) return aviso('Ese correo ya está registrado.', 'error');
  usuarios.push({ nombre: datos.nombre, apellido: datos.apellido, email: datos.email, password: datos.password });
  guardar('ac_usuarios', usuarios); registro.reset();
  aviso('¡Cuenta creada! Ya podés iniciar sesión.');
});
const login = document.querySelector('#form-login');
if (login) login.addEventListener('submit', e => {
  e.preventDefault();
  const email = login.email.value.trim().toLowerCase();
  const user = leer('ac_usuarios').find(u => u.email.toLowerCase() === email && u.password === login.password.value);
  if (!user) return aviso('Correo o contraseña incorrectos. Revisá tus datos.', 'error');
  sessionStorage.setItem('ac_sesion', JSON.stringify({ nombre: user.nombre, email: user.email }));
  location.href = 'principal.html';
});

// Productos e inventario.
const formProducto = document.querySelector('#form-producto');
if (formProducto) {
  const render = () => {
    const lista = leer('ac_productos'); const cuerpo = document.querySelector('#tabla-productos tbody');
    cuerpo.innerHTML = lista.length ? lista.map(p => `<tr><td>${escapar(p.nombre)}</td><td>${p.cantidad}</td><td>${dinero(p.precio)}</td><td><button class="btn btn-peligro btn-chico" data-eliminar="${p.id}" type="button">Eliminar</button></td></tr>`).join('') : '<tr><td colspan="4" class="vacio">Todavía no hay productos cargados.</td></tr>';
    document.querySelector('#cantidad-productos').textContent = lista.length;
  };
  formProducto.addEventListener('submit', e => {
    e.preventDefault(); const datos = Object.fromEntries(new FormData(formProducto));
    if (Number(datos.cantidad) < 0 || Number(datos.precio) < 0) return aviso('La cantidad y el precio no pueden ser negativos.', 'error');
    const lista = leer('ac_productos'); lista.push({ id: Date.now(), nombre: datos.nombre.trim(), cantidad: Number(datos.cantidad), precio: Number(datos.precio) });
    guardar('ac_productos', lista); formProducto.reset(); render(); aviso('Producto agregado correctamente.');
  });
  document.querySelector('#tabla-productos').addEventListener('click', e => {
    const id = Number(e.target.dataset.eliminar); if (!id) return;
    guardar('ac_productos', leer('ac_productos').filter(p => p.id !== id)); render(); aviso('Producto eliminado.');
  }); render();
}

// Registro de ventas y descuento de stock.
const formVenta = document.querySelector('#form-venta');
if (formVenta) {
  const selector = formVenta.producto;
  const cargarOpciones = () => { const productos = leer('ac_productos'); selector.innerHTML = '<option value="">Seleccioná un producto</option>' + productos.map(p => `<option value="${p.id}">${escapar(p.nombre)} — ${p.cantidad} disponibles</option>`).join(''); };
  const actualizarTotal = () => { const p = leer('ac_productos').find(x => x.id === Number(selector.value)); const cantidad = Number(formVenta.cantidad.value); formVenta.total.value = p ? dinero(p.precio * cantidad) : ''; };
  selector.addEventListener('change', actualizarTotal); formVenta.cantidad.addEventListener('input', actualizarTotal); cargarOpciones();
  formVenta.addEventListener('submit', e => {
    e.preventDefault(); const productos = leer('ac_productos'); const p = productos.find(x => x.id === Number(selector.value)); const cantidad = Number(formVenta.cantidad.value);
    if (!p) return aviso('Primero seleccioná un producto.', 'error');
    if (!Number.isInteger(cantidad) || cantidad < 1) return aviso('Ingresá una cantidad válida.', 'error');
    if (cantidad > p.cantidad) return aviso('No hay suficiente stock para esa venta.', 'error');
    p.cantidad -= cantidad; guardar('ac_productos', productos);
    const ventas = leer('ac_ventas'); ventas.push({ id: Date.now(), producto: p.nombre, cantidad, precio: p.precio, total: p.precio * cantidad, fecha: new Date().toLocaleString('es-AR') }); guardar('ac_ventas', ventas);
    formVenta.reset(); actualizarTotal(); cargarOpciones(); aviso('Venta registrada y stock actualizado.');
  });
}

// Historial y reportes.
const tablaVentas = document.querySelector('#tabla-ventas tbody');
if (tablaVentas) { const ventas = leer('ac_ventas').slice().reverse(); tablaVentas.innerHTML = ventas.length ? ventas.map(v => `<tr><td>${v.fecha}</td><td>${escapar(v.producto)}</td><td>${v.cantidad}</td><td>${dinero(v.total)}</td></tr>`).join('') : '<tr><td colspan="4" class="vacio">Todavía no hay ventas registradas.</td></tr>'; }
const formProblema = document.querySelector('#form-problema');
if (formProblema) formProblema.addEventListener('submit', e => { e.preventDefault(); const reportes = leer('ac_reportes'); reportes.push({ texto: formProblema.problema.value.trim(), fecha: new Date().toLocaleString('es-AR') }); guardar('ac_reportes', reportes); formProblema.reset(); aviso('Gracias. Tu problema quedó guardado en este navegador.'); });
function escapar(texto) { return String(texto).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
const saludo = document.querySelector('[data-saludo]');
if (saludo) { const sesion = JSON.parse(sessionStorage.getItem('ac_sesion') || 'null'); if (sesion) saludo.textContent = `¡Hola, ${sesion.nombre}!`; }
const salir = document.querySelector('[data-salir]'); if (salir) salir.addEventListener('click', () => { sessionStorage.removeItem('ac_sesion'); location.href = 'index.html'; });
