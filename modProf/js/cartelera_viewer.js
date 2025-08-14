document.addEventListener('DOMContentLoaded', () => {
    const listaMensajesDiv = document.getElementById('lista-mensajes');

    // Rol del usuario obtenido de una variable global.
    const rolUsuario = window.USER_ROLE; 

    /**
     * Carga y muestra los mensajes de la cartelera.
     */
    async function cargarMensajesCartelera() {
        if (!rolUsuario) {
            console.error('ERROR: El rol del usuario no está definido para la cartelera.');
            listaMensajesDiv.innerHTML = '<p>Error al cargar los mensajes: rol de usuario desconocido.</p>';
            return;
        }

        try {
            const response = await fetch(`../php/cartelera.php?accion=obtener_mensajes_activos&rol=${rolUsuario}`);
            const data = await response.json();
            listaMensajesDiv.innerHTML = ''; 

            if (data.length === 0) {
                listaMensajesDiv.innerHTML = '<p>No hay mensajes importantes en este momento.</p>';
                return;
            }

            data.forEach(mensaje => {
                const mensajeCard = document.createElement('div');
                mensajeCard.className = 'mensaje-card'; 
                mensajeCard.innerHTML = `
                    <h3>${mensaje.titulo}</h3>
                    <p>${mensaje.mensaje_texto}</p>
                    <small>Publicado: ${mensaje.fecha_publicacion} | Dirigido a: ${mensaje.publico_destino}</small>
                `;
                listaMensajesDiv.appendChild(mensajeCard);
            });

        } catch (error) {
            console.error('Error al cargar mensajes de cartelera:', error);
            listaMensajesDiv.innerHTML = '<p>Error al cargar los mensajes. Intente de nuevo más tarde.</p>';
        }
    }

    cargarMensajesCartelera();
});