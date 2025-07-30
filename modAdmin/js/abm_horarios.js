document.addEventListener('DOMContentLoaded', function() {
    // Llamamos a la función para cargar las carreras
    fetchCarreras();
    // Cargar los horarios existentes al cargar la página
    fetchHorarios();

    // Cuando cambiamos la carrera seleccionada, cargamos las materias de esa carrera
    document.getElementById('idCarrera').addEventListener('change', function() {
        const carreraId = this.value;
        if (carreraId) {
            fetchMaterias(carreraId); // Llamamos a la función para cargar las materias
        } else {
            // Si no se selecciona una carrera, vaciamos el select de materias
            document.getElementById('idMateria').innerHTML = '<option value="">Seleccione una materia</option>';
        }
    });

    // Función para cargar las carreras desde el servidor
    function fetchCarreras() {
        fetch('../php/abm_horarios.php') // Llamada para obtener las carreras
            .then(response => response.json())
            .then(data => {
                const carreraSelect = document.getElementById('idCarrera');
                carreraSelect.innerHTML = '<option value="">Seleccione una carrera</option>'; // Opción predeterminada

                if (data.length === 0) {
                    console.log('No se encontraron carreras');
                }

                // Agregamos las carreras al select
                data.forEach(carrera => {
                    const option = document.createElement('option');
                    option.value = carrera.idCarrera; // Cambiado: usa idCarrera
                    option.textContent = carrera.nombre;
                    carreraSelect.appendChild(option);
                });
            })
            .catch(error => console.error('Error al cargar las carreras:', error));
    }

    // Función para cargar las materias según la carrera seleccionada
    function fetchMaterias(carreraId) {
        fetch(`../php/abm_horarios.php?idCarrera=${carreraId}`) // Llamada para obtener las materias
            .then(response => response.json())
            .then(data => {
                const materiaSelect = document.getElementById('idMateria');
                materiaSelect.innerHTML = '<option value="">Seleccione una materia</option>';

                if (data.length === 0) {
                    console.log('No se encontraron materias para esta carrera');
                }

                // Agregamos las materias al select
                data.forEach(materia => {
                    const option = document.createElement('option');
                    option.value = materia.idMateria;
                    option.textContent = materia.nombre;
                    materiaSelect.appendChild(option);
                });
            })
            .catch(error => console.error('Error al cargar las materias:', error));
    }

    // Función para cargar los horarios desde el servidor
    function fetchHorarios() {
        fetch('../php/abm_horarios.php?action=getHorarios') // Llamada para obtener los horarios
            .then(response => response.json())
            .then(data => {
                const tableBody = document.getElementById('horariosTable');
                tableBody.innerHTML = ''; // Limpiamos la tabla antes de agregar los nuevos datos

                if (data.length === 0) {
                    console.log('No se encontraron horarios');
                }

                // Agregamos los horarios a la tabla
                data.forEach(horario => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${horario.materia}</td>
                        <td>${horario.carrera}</td>
                        <td>${horario.año}</td>
                        <td>${horario.division}</td>
                        <td>${horario.diaSemana}</td>
                        <td>${horario.horaInicio}</td>
                        <td>${horario.horaFin}</td>
                        <td>
                            <button class="edit" data-id="${horario.idHorario}">Editar</button>
                            <button class="delete" data-id="${horario.idHorario}">Eliminar</button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });

                // Agregar el evento de eliminación
                const deleteButtons = document.querySelectorAll('.delete');
                deleteButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        const idHorario = this.getAttribute('data-id');
                        deleteHorario(idHorario);
                    });
                });

                // Agregar el evento de edición
                const editButtons = document.querySelectorAll('.edit');
                editButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        const idHorario = this.getAttribute('data-id');
                        editHorario(idHorario);
                    });
                });
            })
            .catch(error => console.error('Error al cargar los horarios:', error));
    }

    // Función para eliminar un horario
    function deleteHorario(idHorario) {
        if (confirm("¿Estás seguro de que quieres eliminar este horario?")) {
            fetch('../php/abm_horarios.php', {
                method: 'DELETE',
                body: JSON.stringify({ idHorario: idHorario })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Horario eliminado exitosamente');
                    fetchHorarios(); // Actualizamos la tabla de horarios
                } else {
                    alert('Error al eliminar el horario: ' + (data.message || ''));
                }
            })
            .catch(error => console.error('Error al eliminar el horario:', error));
        }
    }

    // Función para editar un horario
    function editHorario(idHorario) {
        fetch(`../php/abm_horarios.php?idHorario=${idHorario}`) // Llamada para obtener el horario específico
            .then(response => response.json())
            .then(data => {
                // Llenar los campos con los datos del horario seleccionado
                document.getElementById('idHorario').value = data.idHorario;
                document.getElementById('idMateria').value = data.idMateria;
                document.getElementById('idCarrera').value = data.idCarrera;
                document.getElementById('año').value = data.año;
                document.getElementById('division').value = data.division;
                document.getElementById('diaSemana').value = data.diaSemana;
                document.getElementById('horaInicio').value = data.horaInicio;
                document.getElementById('horaFin').value = data.horaFin;
            })
            .catch(error => console.error('Error al cargar el horario:', error));
    }

    // Función para enviar el formulario
    document.getElementById('horarioForm').addEventListener('submit', function(event) {
        event.preventDefault(); // Evitar envío por defecto del formulario

        const formData = new FormData(this); // Recoger todos los datos del formulario

        fetch('../php/abm_horarios.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Horario guardado exitosamente');
                fetchHorarios(); // Actualizamos la tabla de horarios
            } else {
                alert('Error al guardar el horario: ' + (data.message || ''));
            }
        })
        .catch(error => console.error('Error al enviar el formulario:', error));
    });
});
