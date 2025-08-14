document.addEventListener('DOMContentLoaded', () => {
    const formCartelera = document.getElementById('formCartelera');
    const mensajeDiv = document.getElementById('mensaje');
    const tablaMensajes = document.getElementById('tablaMensajes');
    const editarIdInput = document.getElementById('editar_id');
    const btnCancelarEdicion = document.getElementById('btnCancelarEdicion');
    const fechaPublicacionDisplay = document.getElementById('fecha_publicacion_display'); // Nuevo elemento

    // Función para obtener y formatear la fecha y hora actual
    function getFormattedCurrentDateTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    function mostrarMensaje(tipo, texto) {
        mensajeDiv.textContent = texto;
        mensajeDiv.className = tipo === 'success' ? 'mensaje success' : 'mensaje error';
        mensajeDiv.style.display = 'block';
        setTimeout(() => {
            mensajeDiv.style.display = 'none';
        }, 5000);
    }

    async function cargarMensajes() {
        try {
            const response = await fetch('../php/cartelera.php?accion=listar_mensajes');
            const data = await response.json();
            tablaMensajes.innerHTML = '';

            if (data.length === 0) {
                tablaMensajes.innerHTML = '<tr><td colspan="7">No hay mensajes en la cartelera.</td></tr>';
                return;
            }

            data.forEach(mensaje => {
                const row = tablaMensajes.insertRow();
                // Asegúrate de pasar 'publicacion' como un data-attribute para la edición
                row.innerHTML = `
                    <td>${mensaje.idMensaje}</td>
                    <td>${mensaje.titulo}</td>
                    <td>${mensaje.mensaje_texto}</td>
                    <td>${mensaje.publico_destino_texto}</td>
                    <td>${mensaje.fecha_publicacion}</td>
                    <td>${mensaje.fecha_expiracion || 'N/A'}</td>
                    <td>
                        <button class="btn btn-edit" data-id="${mensaje.idMensaje}" 
                                data-titulo="${mensaje.titulo}" 
                                data-mensaje="${mensaje.mensaje_texto}" 
                                data-publico="${mensaje.publico_destino}"
                                data-expiracion="${mensaje.fecha_expiracion || ''}"
                                data-publicacion="${mensaje.fecha_publicacion}">Editar</button>
                        <button class="btn btn-danger btn-eliminar" data-id="${mensaje.idMensaje}">Eliminar</button>
                    </td>
                `;
            });

            // Asignar eventos de editar
            document.querySelectorAll('.btn-edit').forEach(button => {
                button.addEventListener('click', (e) => {
                    // Ahora se obtiene 'publicacion' del dataset
                    const { id, titulo, mensaje, publico, expiracion, publicacion } = e.target.dataset; 
                    editarIdInput.value = id;
                    document.getElementById('titulo').value = titulo;
                    document.getElementById('mensaje_texto').value = mensaje;
                    document.getElementById('publico_destino').value = publico;
                    document.getElementById('fecha_expiracion').value = expiracion;
                    fechaPublicacionDisplay.value = publicacion; // Mostrar la fecha de publicación del mensaje editado
                    btnCancelarEdicion.style.display = 'inline-block';
                    window.scrollTo({ top: 0, behavior: 'smooth' }); // Subir al inicio del formulario
                });
            });

            // Asignar eventos de eliminar
            document.querySelectorAll('.btn-eliminar').forEach(button => {
                button.addEventListener('click', async (e) => {
                    if (confirm('¿Estás seguro de que quieres eliminar este mensaje?')) {
                        const idMensaje = e.target.dataset.id;
                        const formData = new FormData();
                        formData.append('accion', 'eliminar_mensaje');
                        formData.append('idMensaje', idMensaje);

                        try {
                            const response = await fetch('../php/cartelera.php', {
                                method: 'POST',
                                body: formData
                            });
                            const data = await response.json();
                            mostrarMensaje(data.success ? 'success' : 'error', data.mensaje);
                            if (data.success) {
                                cargarMensajes();
                            }
                        } catch (error) {
                            console.error('Error al eliminar mensaje:', error);
                            mostrarMensaje('error', 'Error de comunicación al eliminar el mensaje.');
                        }
                    }
                });
            });

        } catch (error) {
            console.error('Error al cargar mensajes:', error);
            mostrarMensaje('error', 'Error al cargar los mensajes de la cartelera.');
        }
    }

    // Al cargar la página, mostrar la fecha y hora actual en el campo de publicación
    fechaPublicacionDisplay.value = getFormattedCurrentDateTime();

    // Cargar mensajes al inicio
    cargarMensajes();

    // Manejar el envío del formulario
    formCartelera.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(formCartelera);
        
        const idMensaje = editarIdInput.value;
        formData.append('accion', idMensaje ? 'actualizar_mensaje' : 'crear_mensaje');

        try {
            const response = await fetch('../php/cartelera.php', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            mostrarMensaje(data.success ? 'success' : 'error', data.mensaje);
            if (data.success) {
                formCartelera.reset();
                editarIdInput.value = ''; // Limpiar ID de edición
                btnCancelarEdicion.style.display = 'none';
                fechaPublicacionDisplay.value = getFormattedCurrentDateTime(); // Volver a mostrar la fecha actual al resetear
                cargarMensajes(); // Recargar la tabla
            }
        } catch (error) {
            console.error('Error al guardar mensaje:', error);
            mostrarMensaje('error', 'Error de comunicación al guardar el mensaje.');
        }
    });

    // Cancelar edición
    btnCancelarEdicion.addEventListener('click', () => {
        formCartelera.reset();
        editarIdInput.value = '';
        btnCancelarEdicion.style.display = 'none';
        fechaPublicacionDisplay.value = getFormattedCurrentDateTime(); // Volver a mostrar la fecha actual
    });
});