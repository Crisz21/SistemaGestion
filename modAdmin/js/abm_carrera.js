document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('formCarrera');
    
    // Manejamos el evento de envío del formulario
    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Evitar recarga de página
        clearMessages();
        
        const nombreCarrera = document.getElementById('nombreCarrera').value.trim();
        const resolucion = document.getElementById('resolucion').value.trim();

        if (!nombreCarrera || !resolucion) {
            showMessage('error', 'Por favor, complete todos los campos.');
        } else {
            // Crear un nuevo objeto FormData y añadir la acción
            const formData = new FormData(form);
            formData.append('accion', 'agregar');  // Añadir acción

            // Hacer la solicitud para agregar la carrera
            fetch('../php/abm_carrera.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.tipo === 'error') {
                    showMessage('error', data.mensaje);
                } else {
                    showMessage('success', data.mensaje);
                    loadCarreras(); // Recargar la lista de carreras
                    form.reset();  // Limpiar el formulario después de agregar
                }
            })
            .catch(error => {
                showMessage('error', 'Hubo un error al procesar la solicitud.');
                console.error('Error:', error);
            });
        }
    });

    // Función para mostrar mensajes de error o éxito
    function showMessage(type, message) {
        const messageDiv = document.getElementById('message');
        messageDiv.className = type === 'error' ? 'error-message' : 'success-message';
        messageDiv.textContent = message;
    }

    // Limpiar mensajes de error previos
    function clearMessages() {
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = '';
        messageDiv.className = '';
    }

    // Función para cargar las carreras desde PHP
    function loadCarreras() {
        fetch('../php/abm_carrera.php?accion=listar')
            .then(response => response.json())
            .then(data => {
                const table = document.getElementById('tableCarreras');
                table.innerHTML = ''; // Limpiar la tabla

                if (Array.isArray(data)) {
                    // Recargar las filas de la tabla con los datos actualizados
                    data.forEach(carrera => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${carrera.idCarrera}</td>
                            <td>${carrera.nombre}</td>
                            <td>${carrera.resolucion}</td>
                            <td>
                                <button onclick="eliminarCarrera(${carrera.idCarrera})">Eliminar</button>
                            </td>
                        `;
                        table.appendChild(row);
                    });
                } else {
                    showMessage('error', 'No se pudo cargar las carreras.');
                }
            })
            .catch(error => {
                showMessage('error', 'Error al cargar las carreras.');
                console.error('Error al cargar las carreras:', error);
            });
    }

    // Cargar carreras al cargar la página
    loadCarreras();

    // Función para eliminar carrera
    window.eliminarCarrera = function(idCarrera) {
        if (confirm('¿Estás seguro de eliminar esta carrera?')) {
            fetch(`../php/abm_carrera.php?accion=eliminar&idCarrera=${idCarrera}`, {
                method: 'POST'
            })
            .then(response => response.json())
            .then(data => {
                if (data.tipo === 'error') {
                    showMessage('error', data.mensaje);
                } else {
                    loadCarreras(); // Recargar la lista de carreras
                    showMessage('success', data.mensaje);
                }
            })
            .catch(error => console.error('Error al eliminar la carrera:', error));
        }
    };
});
