document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formAsignacion');
    const mensaje = document.getElementById('mensaje');
    const tabla = document.querySelector('#tablaAsignaciones tbody');
    const selectCarreras = document.getElementById('idCarrera');
    const selectMaterias = document.getElementById('idMateria');
    const selectAnio = document.getElementById('anio');
    const selectDivision = document.getElementById('division');

    // Nuevos elementos para el filtro por DNI
    const filtroDniInput = document.getElementById('filtroDni');
    const btnFiltrarAlumnos = document.getElementById('btnFiltrarAlumnos');

    // Cargar los selects iniciales
    cargarSelect('carreras', 'idCarrera');
    cargarSelect('alumnos', 'idAlumno'); // Carga inicial sin filtro de DNI
    cargarAsignaciones();

    // Event Listener para el cambio en el select de carreras
    selectCarreras.addEventListener('change', () => {
        const idCarreraSeleccionada = selectCarreras.value;
        if (idCarreraSeleccionada) {
            cargarSelect('materias', 'idMateria', idCarreraSeleccionada);
        } else {
            selectMaterias.innerHTML = '<option value="" disabled selected>Selecciona una materia</option>';
        }
        selectAnio.selectedIndex = 0;
        selectDivision.selectedIndex = 0;
    });

    // Event Listener para el botón de filtrar alumnos por DNI
    btnFiltrarAlumnos.addEventListener('click', () => {
        const dniFiltro = filtroDniInput.value.trim();
        // Cargar alumnos con el DNI filtrado
        cargarSelect('alumnos', 'idAlumno', null, dniFiltro);
    });

    // Event Listener para el formulario de asignación
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);

        fetch('../php/asignaciones_alumnos.php', {
            method: 'POST',
            body: formData
        })
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            mensaje.textContent = data.mensaje;
            mensaje.className = data.success ? 'success' : 'error';
            if (data.success) {
                form.reset();
                limpiarSelects();
                cargarAsignaciones();
            }
        })
        .catch(error => {
            console.error('Error al enviar la asignación:', error);
            mensaje.textContent = 'Ocurrió un error al asignar. Por favor, inténtalo de nuevo.';
            mensaje.className = 'error';
        });
    });

    // Función para cargar la tabla de asignaciones
    function cargarAsignaciones() {
        fetch('../php/asignaciones_alumnos.php?accion=listar')
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                tabla.innerHTML = '';
                const rowsHtml = data.map(row => `
                    <tr>
                        <td>${row.idAlumno}</td>
                        <td>${row.alumno}</td>
                        <td>${row.nombreCarrera}</td>
                        <td>${row.division}</td>
                        <td>${row.anio}</td>
                        <td>${row.nombreMateria || 'N/A'}</td>
                        <td>
                            <button data-idalumno="${row.idAlumno}" data-idcurso="${row.idCurso}" class="btnEliminar">Eliminar</button>
                        </td>
                    </tr>
                `).join('');
                tabla.innerHTML = rowsHtml;

                document.querySelectorAll('.btnEliminar').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const confirmacion = confirm('¿Estás seguro de que quieres eliminar esta asignación?');
                        if (!confirmacion) {
                            return;
                        }

                        const formData = new FormData();
                        formData.append('accion', 'eliminar');
                        formData.append('idAlumno', btn.dataset.idalumno);
                        formData.append('idCurso', btn.dataset.idcurso);

                        fetch('../php/asignaciones_alumnos.php', {
                            method: 'POST',
                            body: formData
                        })
                        .then(res => {
                            if (!res.ok) {
                                throw new Error(`HTTP error! status: ${res.status}`);
                            }
                            return res.json();
                        })
                        .then(data => {
                            mensaje.textContent = data.mensaje;
                            mensaje.className = data.success ? 'success' : 'error';
                            if (data.success) cargarAsignaciones();
                        })
                        .catch(error => {
                            console.error('Error al eliminar la asignación:', error);
                            mensaje.textContent = 'Ocurrió un error al eliminar. Por favor, inténtalo de nuevo.';
                            mensaje.className = 'error';
                        });
                    });
                });
            })
            .catch(error => {
                console.error('Error al cargar asignaciones:', error);
                mensaje.textContent = 'Error al cargar las asignaciones.';
                mensaje.className = 'error';
                tabla.innerHTML = '<tr><td colspan="7">No se pudieron cargar las asignaciones.</td></tr>';
            });
    }

    // Modificación de cargarSelect para aceptar un parámetro adicional para filtrar por DNI
    function cargarSelect(accion, selectId, paramId = null, dniFiltro = null) {
        let url = `../php/asignaciones_alumnos.php?accion=${accion}`;
        let defaultOptionText = 'Selecciona una opción';

        // Determinar el texto de la opción por defecto específico para cada select
        if (selectId === 'idCarrera') {
            defaultOptionText = 'Selecciona una carrera';
        } else if (selectId === 'idMateria') {
            defaultOptionText = 'Selecciona una materia';
        } else if (selectId === 'idAlumno') {
            defaultOptionText = 'Selecciona un alumno';
        }

        if (accion === 'materias' && paramId) {
            url += `&idCarrera=${paramId}`;
        }
        
        // Añadir el parámetro de DNI si es para alumnos y se proporciona un filtro
        if (accion === 'alumnos' && dniFiltro) {
            url += `&dni=${dniFiltro}`;
        }
        
        fetch(url)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                const select = document.getElementById(selectId);
                select.innerHTML = `<option value="" disabled selected>${defaultOptionText}</option>`;
                
                if (data.length === 0 && accion === 'alumnos' && dniFiltro) {
                    select.innerHTML += '<option value="" disabled>No se encontraron alumnos con ese DNI</option>';
                } else {
                    data.forEach(item => {
                        const option = document.createElement('option');
                        option.value = item.id;
                        option.textContent = item.nombre;
                        select.appendChild(option);
                    });
                }
            })
            .catch(error => {
                console.error(`Error al cargar ${accion}:`, error);
                const select = document.getElementById(selectId);
                select.innerHTML = `<option value="" disabled selected>Error al cargar ${defaultOptionText.toLowerCase().replace('selecciona un', 'las').replace('selecciona una', 'las')}</option>`;
            });
    }

    function limpiarSelects() {
        document.querySelectorAll('select').forEach(select => {
            select.selectedIndex = 0;
            if (select.id === 'idMateria') {
                select.innerHTML = '<option value="" disabled selected>Selecciona una materia</option>';
            }
            if (select.id === 'idCarrera') {
                select.innerHTML = '<option value="" disabled selected>Selecciona una carrera</option>';
                cargarSelect('carreras', 'idCarrera');
            }
            if (select.id === 'idAlumno') {
                 select.innerHTML = '<option value="" disabled selected>Selecciona un alumno</option>';
                 cargarSelect('alumnos', 'idAlumno'); // Recargar todos los alumnos al limpiar
            }
            if (select.id === 'anio' || select.id === 'division') {
                select.selectedIndex = 0;
            }
        });
        filtroDniInput.value = ''; // Limpiar el campo de DNI
    }
});