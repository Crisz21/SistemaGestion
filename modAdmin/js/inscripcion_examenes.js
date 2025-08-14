document.addEventListener('DOMContentLoaded', () => {
    const formInscripcion = document.getElementById('formInscripcion');
    const mensajeDiv = document.getElementById('mensaje');
    const tablaInscripciones = document.getElementById('tablaInscripciones');
    const selectCarrera = document.getElementById('idCarrera');
    const selectMateria = document.getElementById('idMateria');
    const selectAlumno = document.getElementById('idAlumno');
    const selectExamen = document.getElementById('idExamen');
    const filtroDNI = document.getElementById('filtroDNI');

    function mostrarMensaje(tipo, texto) {
        mensajeDiv.textContent = texto;
        mensajeDiv.className = tipo === 'success' ? 'mensaje success' : 'mensaje error';
        mensajeDiv.style.display = 'block';
        setTimeout(() => {
            mensajeDiv.style.display = 'none';
        }, 5000);
    }

    async function cargarSelect(accion, selectElement, queryParams = {}) {
        let url = `../php/inscripciones_examenes.php?accion=${accion}`;
        const params = new URLSearchParams(queryParams).toString();
        if (params) {
            url += `&${params}`;
        }

        try {
            const response = await fetch(url);
            const data = await response.json();

            selectElement.innerHTML = '';
            let defaultText = '';
            if (selectElement.id === 'idCarrera') defaultText = 'Selecciona una Carrera';
            else if (selectElement.id === 'idMateria') defaultText = 'Selecciona una Materia';
            else if (selectElement.id === 'idAlumno') defaultText = 'Selecciona un Alumno';
            else if (selectElement.id === 'idExamen') defaultText = 'Selecciona un Examen';

            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = defaultText;
            selectElement.appendChild(defaultOption);

            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item.id || item.idMateria || item.idCarrera || item.idUsuario;
                option.textContent = item.nombre;
                selectElement.appendChild(option);
            });
        } catch (error) {
            console.error(`Error al cargar ${accion}:`, error);
            mostrarMensaje('error', `Error al cargar las opciones de ${selectElement.id}.`);
        }
    }

    function limpiarSelectsDependientes(inicioElemento) {
        if (inicioElemento === selectCarrera) {
            selectMateria.innerHTML = '<option value="">Selecciona una Materia</option>';
            selectAlumno.innerHTML = '<option value="">Selecciona un Alumno</option>';
            selectExamen.innerHTML = '<option value="">Selecciona un Examen</option>';
        } else if (inicioElemento === selectMateria) {
            selectAlumno.innerHTML = '<option value="">Selecciona un Alumno</option>';
            selectExamen.innerHTML = '<option value="">Selecciona un Examen</option>';
        } else if (inicioElemento === selectAlumno) {
            selectExamen.innerHTML = '<option value="">Selecciona un Examen</option>';
        }
    }

    selectCarrera.addEventListener('change', () => {
        const idCarreraSeleccionada = selectCarrera.value;
        limpiarSelectsDependientes(selectCarrera);
        if (idCarreraSeleccionada) {
            cargarSelect('cargar_materias', selectMateria, { idCarrera: idCarreraSeleccionada });
        }
    });

    selectMateria.addEventListener('change', () => {
        const idCarreraSeleccionada = selectCarrera.value;
        const idMateriaSeleccionada = selectMateria.value;
        limpiarSelectsDependientes(selectMateria);
        if (idCarreraSeleccionada && idMateriaSeleccionada) {
            // Cargar alumnos aptos sin filtro DNI inicialmente
            cargarSelect('cargar_alumnos_aptos', selectAlumno, { idCarrera: idCarreraSeleccionada, idMateria: idMateriaSeleccionada });
        }
    });

    selectAlumno.addEventListener('change', () => {
        const idCarreraSeleccionada = selectCarrera.value;
        const idMateriaSeleccionada = selectMateria.value;
        const idAlumnoSeleccionado = selectAlumno.value;
        limpiarSelectsDependientes(selectAlumno);
        if (idCarreraSeleccionada && idMateriaSeleccionada && idAlumnoSeleccionado) {
            cargarSelect('cargar_examenes', selectExamen, {
                idCarrera: idCarreraSeleccionada,
                idMateria: idMateriaSeleccionada,
                idAlumno: idAlumnoSeleccionado
            });
        }
    });

    filtroDNI.addEventListener('input', () => {
        const idCarreraSeleccionada = selectCarrera.value;
        const idMateriaSeleccionada = selectMateria.value;
        const dniFiltro = filtroDNI.value.trim();

        selectAlumno.innerHTML = '<option value="">Selecciona un Alumno</option>'; // Limpiar el select de alumnos

        if (idCarreraSeleccionada && idMateriaSeleccionada) {
            cargarSelect('cargar_alumnos_aptos', selectAlumno, {
                idCarrera: idCarreraSeleccionada,
                idMateria: idMateriaSeleccionada,
                dni: dniFiltro // Pasar el DNI para filtrar
            });
        }
    });

    cargarSelect('cargar_carreras', selectCarrera);

    async function cargarInscripciones() {
        try {
            const response = await fetch('../php/inscripciones_examenes.php?accion=listar_inscripciones');
            const data = await response.json();
            tablaInscripciones.innerHTML = '';

            data.forEach(inscripcion => {
                const row = tablaInscripciones.insertRow();
                row.innerHTML = `
                    <td>${inscripcion.idInscripcion}</td>
                    <td>${inscripcion.alumno}</td>
                    <td>${inscripcion.carrera}</td>
                    <td>${inscripcion.materia}</td>
                    <td>${inscripcion.fechaExamen}</td>
                    <td>${inscripcion.horaExamen}</td>
                    <td>${inscripcion.añoCurso} / ${inscripcion.divisionCurso}</td>
                    <td>${inscripcion.llamado}</td>
                    <td>${inscripcion.fechaInscripcion}</td>
                    <td>
                        <button class="btn btn-danger btn-eliminar" data-id="${inscripcion.idInscripcion}">Eliminar</button>
                    </td>
                `;
            });

            document.querySelectorAll('.btn-eliminar').forEach(button => {
                button.addEventListener('click', async (e) => {
                    if (confirm('¿Estás seguro de que quieres eliminar esta inscripción?')) {
                        const idInscripcion = e.target.dataset.id;
                        const formData = new FormData();
                        formData.append('accion', 'eliminar_inscripcion');
                        formData.append('idInscripcion', idInscripcion);

                        try {
                            const response = await fetch('../php/inscripciones_examenes.php', {
                                method: 'POST',
                                body: formData
                            });
                            const data = await response.json();
                            mostrarMensaje(data.success ? 'success' : 'error', data.mensaje);
                            if (data.success) {
                                cargarInscripciones();
                            }
                        } catch (error) {
                            console.error('Error al eliminar inscripción:', error);
                            mostrarMensaje('error', 'Error de comunicación al eliminar la inscripción.');
                        }
                    }
                });
            });

        } catch (error) {
            console.error('Error al cargar inscripciones:', error);
            mostrarMensaje('error', 'Error al cargar las inscripciones.');
        }
    }

    cargarInscripciones();

    formInscripcion.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(formInscripcion);
        formData.append('accion', 'inscribir_alumno');

        try {
            const response = await fetch('../php/inscripciones_examenes.php', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            mostrarMensaje(data.success ? 'success' : 'error', data.mensaje);
            if (data.success) {
                formInscripcion.reset();
                selectCarrera.value = '';
                limpiarSelectsDependientes(selectCarrera);
                filtroDNI.value = ''; // Limpiar el filtro DNI
                cargarInscripciones();
            }
        } catch (error) {
            console.error('Error al enviar el formulario de inscripción:', error);
            mostrarMensaje('error', 'Error de comunicación al inscribir al alumno.');
        }
    });
});