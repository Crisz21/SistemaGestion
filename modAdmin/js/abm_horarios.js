document.addEventListener('DOMContentLoaded', function() {
    const idCarreraSelect = document.getElementById('idCarrera');
    const idMateriaSelect = document.getElementById('idMateria');
    const horarioForm = document.getElementById('horarioForm');
    const idHorarioInput = document.getElementById('idHorario'); // Campo oculto para el ID
    const successMessage = document.getElementById('success');
    const errorMessage = document.getElementById('error');
    const horariosTableBody = document.getElementById('horariosTable');
    const cancelButton = document.getElementById('cancelEdit');

    // Cargar carreras y horarios al inicio
    fetchCarreras();
    fetchHorarios();

    // Evento para cargar materias cuando cambia la carrera
    idCarreraSelect.addEventListener('change', function() {
        const carreraId = this.value;
        if (carreraId) {
            fetchMaterias(carreraId);
        } else {
            idMateriaSelect.innerHTML = '<option value="">Seleccione una materia</option>';
        }
    });

    // Evento para el envío del formulario (Crear o Actualizar)
    horarioForm.addEventListener('submit', async function(event) {
        event.preventDefault(); // Evitar envío por defecto

        const isEditing = idHorarioInput.value !== ''; // Verificar si estamos en modo edición

        // Recolectar datos del formulario
        const formData = {
            idMateria: document.getElementById('idMateria').value,
            diaSemana: document.getElementById('diaSemana').value,
            horaInicio: document.getElementById('horaInicio').value,
            horaFin: document.getElementById('horaFin').value,
            idCarrera: document.getElementById('idCarrera').value,
            año: document.getElementById('año').value,
            division: document.getElementById('division').value
        };

        let method = 'POST';
        let bodyToSend;
        let headers = {};

        if (isEditing) {
            method = 'PUT';
            formData.idHorario = idHorarioInput.value; // Añadir el ID para la actualización
            bodyToSend = JSON.stringify(formData); // Para PUT, enviamos JSON en el cuerpo
            headers['Content-Type'] = 'application/json';
        } else {
            // Para POST (crear), seguimos usando FormData como estaba antes,
            // ya que el PHP lo espera en $_POST
            bodyToSend = new FormData(horarioForm);
        }

        try {
            const response = await fetch('../php/abm_horarios.php', {
                method: method,
                headers: headers,
                body: bodyToSend
            });

            const data = await response.json();

            if (data.success) {
                showMessage(successMessage, 'Horario guardado exitosamente.', true);
                fetchHorarios(); // Refrescar la tabla
                clearForm(); // Limpiar inputs
                if (isEditing) {
                    cancelButton.style.display = 'none'; // Ocultar botón de cancelar después de editar
                }
            } else {
                showMessage(errorMessage, 'Error al guardar el horario: ' + (data.message || 'Error desconocido'), false);
            }
        } catch (error) {
            console.error('Error al enviar el formulario:', error);
            showMessage(errorMessage, 'Error al conectar con el servidor.', false);
        }
    });

    // Evento para el botón de Cancelar Edición
    cancelButton.addEventListener('click', function() {
        clearForm();
        cancelButton.style.display = 'none'; // Ocultar el botón
        showMessage(successMessage, '', false); // Limpiar mensajes
        showMessage(errorMessage, '', false);
    });

    // --- Funciones de Utilidad ---

    // Muestra mensajes de éxito o error
    function showMessage(element, message, isSuccess) {
        element.textContent = message;
        element.style.display = message ? 'block' : 'none';
        element.className = isSuccess ? 'success' : 'error';
        // Ocultar el mensaje después de 5 segundos
        if (message) {
            setTimeout(() => {
                element.style.display = 'none';
            }, 5000);
        }
    }

    // Limpia todos los campos del formulario
    function clearForm() {
        horarioForm.reset(); // Resetea los campos del formulario
        idHorarioInput.value = ''; // Limpiar el ID oculto
        idMateriaSelect.innerHTML = '<option value="">Seleccione una materia</option>'; // Resetear el select de materias
    }

    // Carga las carreras desde el servidor
    async function fetchCarreras() {
        try {
            const response = await fetch('../php/abm_horarios.php');
            const data = await response.json();
            idCarreraSelect.innerHTML = '<option value="">Seleccione una carrera</option>';
            data.forEach(carrera => {
                const option = document.createElement('option');
                option.value = carrera.idCarrera;
                option.textContent = carrera.nombre;
                idCarreraSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar las carreras:', error);
            showMessage(errorMessage, 'Error al cargar las carreras.', false);
        }
    }

    // Carga las materias según la carrera seleccionada
    async function fetchMaterias(carreraId) {
        try {
            const response = await fetch(`../php/abm_horarios.php?idCarrera=${carreraId}`);
            const data = await response.json();
            idMateriaSelect.innerHTML = '<option value="">Seleccione una materia</option>';
            data.forEach(materia => {
                const option = document.createElement('option');
                option.value = materia.idMateria;
                option.textContent = materia.nombre;
                idMateriaSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar las materias:', error);
            showMessage(errorMessage, 'Error al cargar las materias para la carrera seleccionada.', false);
        }
    }

    // Carga todos los horarios y los muestra en la tabla
    async function fetchHorarios() {
        try {
            const response = await fetch('../php/abm_horarios.php?action=getHorarios');
            const data = await response.json();
            horariosTableBody.innerHTML = ''; // Limpiar la tabla

            if (data.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="8">No se encontraron horarios.</td>';
                horariosTableBody.appendChild(row);
            }

            data.forEach(horario => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${horario.materia}</td>
                    <td>${horario.carrera}</td>
                    <td>${horario.año}</td>
                    <td>${horario.division}</td>
                    <td>${horario.diaSemana}</td>
                    <td>${horario.horaInicio.substring(0, 5)}</td> <td>${horario.horaFin.substring(0, 5)}</td>     <td>
                        <button class="edit-btn" data-id="${horario.idHorario}">Editar</button>
                        <button class="delete-btn" data-id="${horario.idHorario}">Eliminar</button>
                    </td>
                `;
                horariosTableBody.appendChild(row);
            });

            // Re-adjuntar listeners a los botones de Editar/Eliminar
            attachButtonListeners();

        } catch (error) {
            console.error('Error al cargar los horarios:', error);
            showMessage(errorMessage, 'Error al cargar los horarios existentes.', false);
        }
    }

    // Adjunta listeners a los botones de Editar y Eliminar
    function attachButtonListeners() {
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.onclick = () => deleteHorario(button.dataset.id);
        });

        document.querySelectorAll('.edit-btn').forEach(button => {
            button.onclick = () => editHorario(button.dataset.id);
        });
    }

    // Función para eliminar un horario
    async function deleteHorario(idHorario) {
        if (!confirm("¿Estás seguro de que quieres eliminar este horario?")) {
            return;
        }
        try {
            const response = await fetch('../php/abm_horarios.php', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idHorario: idHorario })
            });
            const data = await response.json();
            if (data.success) {
                showMessage(successMessage, 'Horario eliminado exitosamente.', true);
                fetchHorarios();
            } else {
                showMessage(errorMessage, 'Error al eliminar el horario: ' + (data.message || 'Error desconocido'), false);
            }
        } catch (error) {
            console.error('Error al eliminar el horario:', error);
            showMessage(errorMessage, 'Error al conectar con el servidor para eliminar el horario.', false);
        }
    }

    // Función para cargar los datos del horario en el formulario para edición
    async function editHorario(idHorario) {
        try {
            const response = await fetch(`../php/abm_horarios.php?idHorario=${idHorario}`);
            const data = await response.json();

            if (data) {
                // Autocompletar el formulario
                idHorarioInput.value = data.idHorario; // Establecer el ID oculto
                document.getElementById('idCarrera').value = data.idCarrera;
                
                // ESENCIAL: Esperar a que las materias se carguen antes de seleccionar la materia
                await fetchMaterias(data.idCarrera); 
                
                document.getElementById('idMateria').value = data.idMateria;
                document.getElementById('diaSemana').value = data.diaSemana;
                document.getElementById('horaInicio').value = data.horaInicio.substring(0, 5); // Formato HH:MM
                document.getElementById('horaFin').value = data.horaFin.substring(0, 5);     // Formato HH:MM
                document.getElementById('año').value = data.año;
                document.getElementById('division').value = data.division;

                cancelButton.style.display = 'inline-block'; // Mostrar el botón de cancelar edición
                showMessage(successMessage, 'Modifique los campos y presione Guardar para actualizar.', true);

            } else {
                showMessage(errorMessage, 'No se encontró el horario para editar.', false);
            }
        } catch (error) {
            console.error('Error al cargar el horario para edición:', error);
            showMessage(errorMessage, 'Error al cargar los datos del horario para editar.', false);
        }
    }
});