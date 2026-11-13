async function iniciarSesion(email, password) {
    const { data, error } = await supabaseClient
        .from('usuarios')
        .select('*')
        .eq('username', email)
        .eq('password', password)
        .single();

    if (error || !data) {
        return null;
    }

    sessionStorage.setItem('ac_sesion', JSON.stringify(data));
    return data;
}


async function registrarUsuario(email, password) {
    const { data, error } = await supabaseClient
        .from('usuarios')
        .insert([{ username: email, password: password }])
        .select()
        .single();

    if (error) {
        return { error: error.code === '23505' ? 'Ese correo ya está registrado.' : error.message };
    }
    return { data };
}

async function obtenerProductos() {
    const { data, error } = await supabaseClient
        .from('productos')
        .select('*')
        .order('id_producto', { ascending: false });

    if (error) {
        console.error("Error al obtener productos:", error.message);
        return [];
    }
    return data;
}

async function crearProducto(nombre, cantidad, precio) {
    const { error } = await supabaseClient
        .from('productos')
        .insert([{
            nombre_producto: nombre,
            cantidad: parseInt(cantidad),
            precio: parseFloat(precio) || 0
        }]);

    return !error;
}

async function actualizarProducto(id, cantidad, precio) {
    const { error } = await supabaseClient
        .from('productos')
        .update({
            cantidad: parseInt(cantidad),
            precio: parseFloat(precio)
        })
        .eq('id_producto', id);

    return !error;
}

async function eliminarProducto(id) {
    const { error } = await supabaseClient
        .from('productos')
        .delete()
        .eq('id_producto', id);

    return !error;
}

async function registrarVentaConDetalle(idUsuario, productoObj, cantidadVendida) {
    const cantInt = parseInt(cantidadVendida);

    const { data: ventaData, error: ventaError } = await supabaseClient
        .from('ventas')
        .insert([{ id_usuario: idUsuario }])
        .select()
        .single();

    if (ventaError) return false;

    const { error: detalleError } = await supabaseClient
        .from('detalle_venta')
        .insert([{
            id_venta: ventaData.id_venta,
            id_producto: productoObj.id_producto,
            cantidad: cantInt,
            precio_unitario: parseFloat(productoObj.precio)
        }]);

    if (detalleError) return false;

    const nuevoStock = Math.max(0, productoObj.cantidad - cantInt);
    await supabaseClient
        .from('productos')
        .update({ cantidad: nuevoStock })
        .eq('id_producto', productoObj.id_producto);

    return true;
}

async function obtenerHistorialVentas() {
    const { data, error } = await supabaseClient
        .from('detalle_venta')
        .select(`
            cantidad,
            precio_unitario,
            ventas ( fecha ),
            productos ( nombre_producto )
        `)
        .order('id_detalle', { ascending: false });

    if (error) {
        console.error("Error al obtener historial:", error.message);
        return [];
    }
    return data;
}

async function enviarReporte(descripcion, idUsuario) {
    const { error } = await supabaseClient
        .from('reportes_problema')
        .insert([{ descripcion: descripcion, id_usuario: idUsuario }]);

    return !error;
}

async function recuperarContraseña(email) {
    const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/actualizar-password.html', // Página donde podrá escribir la nueva contraseña
    });

    if (error) {
        return { error: error.message };
    }
    return { data };
}