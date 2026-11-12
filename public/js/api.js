async function iniciarSesion(username, password) {
    const { data, error } = await supabaseClient
        .from('usuarios')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

    if (error || !data) {
        alert("Usuario o contraseña incorrectos");
        return false;
    }

    localStorage.setItem('usuario_actual', JSON.stringify(data));
    return true;
}



async function registrarUsuario(username, password) {
    const { data, error } = await supabaseClient
        .from('usuarios')
        .insert([{ username: username, password: password }])
        .select()
        .single();

    if (error) {
        if (error.code === '23505') {
            alert("Ese nombre de usuario ya existe. Elige otro.");
        } else {
            alert("Error al registrar usuario: " + error.message);
        }
        return false;
    }

    localStorage.setItem('usuario_actual', JSON.stringify(data));
    return true;
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

    if (error) {
        alert("Error al agregar producto: " + error.message);
        return false;
    }
    return true;
}

async function actualizarProducto(id, cantidad, precio) {
    const { error } = await supabaseClient
        .from('productos')
        .update({
            cantidad: parseInt(cantidad),
            precio: parseFloat(precio)
        })
        .eq('id_producto', id);

    if (error) {
        alert("Error al actualizar producto: " + error.message);
        return false;
    }
    return true;
}

async function eliminarProductoPorNombre(nombre) {
    const { data, error: searchError } = await supabaseClient
        .from('productos')
        .select('id_producto')
        .ilike('nombre_producto', nombre.trim());

    if (searchError || !data || data.length === 0) {
        alert("No se encontro ningun producto con ese nombre");
        return false;
    }

    const { error } = await supabaseClient
        .from('productos')
        .delete()
        .eq('id_producto', data[0].id_producto);

    if (error) {
        alert("Error al eliminar producto: " + error.message);
        return false;
    }
    return true;
}

async function eliminarProducto(id) {
    const { error } = await supabaseClient
        .from('productos')
        .delete()
        .eq('id_producto', id);

    if (error) {
        alert("Error al eliminar producto: " + error.message);
        return false;
    }
    return true;
}

async function registrarVentaConDetalle(idUsuario, idProducto, cantidadVendida, precioUnitario) {
    const { data: ventaData, error: ventaError } = await supabaseClient
        .from('ventas')
        .insert([{ id_usuario: idUsuario }])
        .select()
        .single();

    if (ventaError) {
        alert("Error al registrar la venta: " + ventaError.message);
        return false;
    }

    const { error: detalleError } = await supabaseClient
        .from('detalle_venta')
        .insert([{
            id_venta: ventaData.id_venta,
            id_producto: idProducto,
            cantidad: parseInt(cantidadVendida),
            precio_unitario: parseFloat(precioUnitario)
        }]);

    if (detalleError) {
        alert("Error al guardar el detalle de venta: " + detalleError.message);
        return false;
    }

    return true;
}

async function enviarReporte(descripcion, idUsuario) {
    const { error } = await supabaseClient
        .from('reportes_problema')
        .insert([{ descripcion: descripcion, id_usuario: idUsuario }]);

    if (error) {
        alert("Error al enviar reporte: " + error.message);
        return false;
    }
    return true;
}