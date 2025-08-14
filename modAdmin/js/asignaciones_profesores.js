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
    const btnFiltrarProfesores = document.getElementById('btnFiltrarProfesores');


    cargarSelect('carreras', 'idCarrera');
    cargarSelect('profesores', 'idProfesor'); // Carga inicial sin filtro de DNI
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

    // Event Listener para el botón de filtrar profesores por DNI
    btnFiltrarProfesores.addEventListener('click', () => {
        const dniFiltro = filtroDniInput.value.trim();
        // Cargar profesores con el DNI filtrado
        cargarSelect('profesores', 'idProfesor', null, dniFiltro);
    });


    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);

        fetch('../php/asignaciones_profesores.php', {
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

    function cargarAsignaciones() {
        fetch('../php/asignaciones_profesores.php?accion=listar')
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
                        <td>${row.idCurso}</td>
                        <td>${row.profesor}</td>
                        <td>${row.nombreCarrera}</td>
                        <td>${row.division}</td>
                        <td>${row.anio}</td>
                        <td>${row.nombreMateria}</td>
                        <td>
                            <button data-idprofesor="${row.idProfesor}" data-idcurso="${row.idCurso}" class="btnEliminar">Eliminar</button>
                        </td>
                    </tr>`
                ).join('');
                tabla.innerHTML = rowsHtml;

                document.querySelectorAll('.btnEliminar').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const confirmacion = confirm('¿Estás seguro de que quieres eliminar esta asignación?');
                        if (!confirmacion) {
                            return;
                        }

                        const formData = new FormData();
                        formData.append('accion', 'eliminar');
                        formData.append('idProfesor', btn.dataset.idprofesor);
                        formData.append('idCurso', btn.dataset.idcurso);

                        fetch('../php/asignaciones_profesores.php', {
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

    // La función cargarSelect ahora acepta un id adicional y un dniFiltro
    function cargarSelect(accion, selectId, paramId = null, dniFiltro = null) {
        let url = `../php/asignaciones_profesores.php?accion=${accion}`;
        let defaultOptionText = 'Selecciona una opción';

        // Determinar el texto de la opción por defecto específico para cada select
        if (selectId === 'idCarrera') {
            defaultOptionText = 'Selecciona una carrera';
        } else if (selectId === 'idMateria') {
            defaultOptionText = 'Selecciona una materia';
        } else if (selectId === 'idProfesor') {
            defaultOptionText = 'Selecciona un profesor';
        }

        if (accion === 'materias' && paramId) {
            url += `&idCarrera=${paramId}`;
        }
        
        // Añadir el parámetro de DNI si es para profesores y se proporciona un filtro
        if (accion === 'profesores' && dniFiltro) {
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
                
                if (data.length === 0 && accion === 'profesores' && dniFiltro) {
                    select.innerHTML += '<option value="" disabled>No se encontraron profesores con ese DNI</option>';
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
                select.innerHTML = `<option value="" disabled selected>Error al cargar ${defaultOptionText.toLowerCase().replace('selecciona un', 'los').replace('selecciona una', 'las')}</option>`;
            });
    }

    // Función para limpiar los selects
    function limpiarSelects() {
        const selects = document.querySelectorAll('select');
        selects.forEach(select => {
            select.selectedIndex = 0;
            // Si es el select de materias, asegurarnos que se quede con solo la opción por defecto
            if (select.id === 'idMateria') {
                select.innerHTML = '<option value="" disabled selected>Selecciona una materia</option>';
            }
            if (select.id === 'idCarrera') {
                select.innerHTML = '<option value="" disabled selected>Selecciona una carrera</option>';
                cargarSelect('carreras', 'idCarrera');
            }
            if (select.id === 'idProfesor') {
                 select.innerHTML = '<option value="" disabled selected>Selecciona un profesor</option>';
                 cargarSelect('profesores', 'idProfesor'); // Recargar todos los profesores al limpiar
            }
            if (select.id === 'anio' || select.id === 'division') {
                select.selectedIndex = 0;
            }
        });
        filtroDniInput.value = ''; // Limpiar el campo de DNI
    }
});