document.addEventListener('DOMContentLoaded', function() {
    const formulario = document.getElementById('formulario');
    const tablaExamenes = document.getElementById('tablaExamenes');
    const mensajeError = document.getElementById('error');
    const mensajeSuccess = document.getElementById('success');
    const selectCarrera = document.getElementById('idCarrera');
    const selectMateria = document.getElementById('idMateria');
    const inputFecha = document.getElementById('fecha');
    const selectAño = document.getElementById('año');
    const selectDivision = document.getElementById('division');
    const selectLlamado = document.getElementById('llamado');

    // Función para mostrar mensajes
    function mostrarMensaje(tipo, mensaje) {
        const elementoMensaje = (tipo === 'error') ? mensajeError : mensajeSuccess;
        elementoMensaje.textContent = mensaje;
        elementoMensaje.style.display = 'block';
        setTimeout(() => {
            elementoMensaje.style.display = 'none';
        }, 5000);
    }

    // Función para cargar y mostrar la tabla de exámenes
    function cargarTablaExamenes() {
        fetch('../php/examenes_finales.php?accion=listar_examenes')
            .then(response => response.json())
            .then(data => {
                tablaExamenes.innerHTML = ''; // Limpiar la tabla
                data.forEach(examen => {
                    const row = tablaExamenes.insertRow();
                    row.insertCell().textContent = examen.idExamen;
                    row.insertCell().textContent = examen.carrera;
                    row.insertCell().textContent = examen.materia;
                    row.insertCell().textContent = examen.fecha;
                    row.insertCell().textContent = examen.hora;
                    row.insertCell().textContent = examen.año;
                    row.insertCell().textContent = examen.division;
                    row.insertCell().textContent = examen.llamado;
                    const accionesCell = row.insertCell();
                    accionesCell.innerHTML = `
                        <div class="acciones">
                            <button class="btn btn-primary btn-editar" data-id="${examen.idExamen}">Editar</button>
                            <button class="btn btn-danger btn-eliminar" data-id="${examen.idExamen}">Eliminar</button>
                        </div>
                    `;
                });

                // Agregar event listeners a los botones de eliminar dinámicamente
                const botonesEliminar = document.querySelectorAll('.btn-eliminar');
                botonesEliminar.forEach(boton => {
                    boton.addEventListener('click', function() {
                        const idExamenEliminar = this.dataset.id;
                        if (confirm('¿Estás seguro de que deseas eliminar este examen?')) {
                            eliminarExamen(idExamenEliminar);
                        }
                    });
                });

                // Agregar event listeners a los botones de editar dinámicamente
                const botonesEditar = document.querySelectorAll('.btn-editar');
                botonesEditar.forEach(boton => {
                    boton.addEventListener('click', function() {
                        const idExamenEditar = this.dataset.id;
                        cargarDatosExamen(idExamenEditar); // Cargar los datos al hacer clic en Editar
                        window.scrollTo({ top: 0, behavior: 'smooth' }); // Opcional: scroll al inicio del formulario
                    });
                });
            });
    }

    // Función para agregar la opción por defecto a un select si no existe
    function agregarOpcionPorDefecto(selectElement, texto) {
        if (selectElement.options.length === 0 || selectElement.options[0].value !== '') {
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = texto;
            selectElement.insertBefore(defaultOption, selectElement.firstChild);
        }
    }

    // Cargar carreras al cargar la página
    fetch('../php/examenes_finales.php?accion=cargar_carreras')
        .then(response => response.json())
        .then(data => {
            agregarOpcionPorDefecto(selectCarrera, 'Selecciona una carrera');
            data.forEach(carrera => {
                const option = document.createElement('option');
                option.value = carrera.idCarrera;
                option.textContent = carrera.nombre;
                selectCarrera.appendChild(option);
            });
        });

    // Cargar materias al cargar la página
    fetch('../php/examenes_finales.php?accion=cargar_materias')
        .then(response => response.json())
        .then(data => {
            agregarOpcionPorDefecto(selectMateria, 'Selecciona una materia');
            data.forEach(materia => {
                const option = document.createElement('option');
                option.value = materia.idMateria;
                option.textContent = materia.nombre;
                selectMateria.appendChild(option);
            });
        });

    // Agregar las opciones por defecto a los otros selects
    agregarOpcionPorDefecto(selectAño, 'Selecciona un año');
    agregarOpcionPorDefecto(selectDivision, 'Selecciona una división');
    agregarOpcionPorDefecto(selectLlamado, 'Selecciona un llamado');

    // Cargar la tabla de exámenes al cargar la página inicial
    cargarTablaExamenes();

    formulario.addEventListener('submit', function(event) {
        event.preventDefault(); // Evitar el envío tradicional del formulario

        const fechaSeleccionada = new Date(inputFecha.value);
        const añoActual = new Date().getFullYear();

        if (isNaN(fechaSeleccionada.getTime())) {
            mostrarMensaje('error', 'Por favor, ingrese una fecha válida.');
            return;
        }

        if (fechaSeleccionada.getFullYear() < añoActual) {
            mostrarMensaje('error', `La fecha no puede ser anterior al año actual (${añoActual}).`);
            return;
        }

        const formData = new FormData(formulario);
        const editarId = document.getElementById('editar_id').value;
        if (editarId) {
            formData.append('editar_id', editarId);
        }
        formData.append('accion', 'guardar_examen');

        fetch('../php/examenes_finales.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                mostrarMensaje('success', data.success);
                formulario.reset();
                document.getElementById('editar_id').value = ''; // Limpiar el ID de edición
                cargarTablaExamenes(); // Volver a cargar la tabla después de guardar
            } else if (data.error) {
                mostrarMensaje('error', data.error);
            }
        });
    });

    function eliminarExamen(idExamen) {
        const formData = new FormData();
        formData.append('idExamen', idExamen);
        formData.append('accion', 'eliminar_examen');

        fetch('../php/examenes_finales.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                mostrarMensaje('success', data.success);
                cargarTablaExamenes(); // Volver a cargar la tabla después de eliminar
            } else if (data.error) {
                mostrarMensaje('error', data.error);
            }
        });
    }

    function cargarDatosExamen(idExamen) {
        // Resetear los selects a la opción por defecto
        selectCarrera.value = '';
        selectMateria.value = '';
        selectAño.value = '';
        selectDivision.value = '';
        selectLlamado.value = '';

        fetch(`../php/examenes_finales.php?accion=obtener_examen&editar_id=${idExamen}`)
            .then(response => response.json())
            .then(data => {
                if (data) {
                    selectCarrera.value = data.idCarrera;
                    selectMateria.value = data.idMateria;
                    document.getElementById('fecha').value = data.fecha;
                    document.getElementById('hora').value = data.hora;
                    selectAño.value = data.año;
                    selectDivision.value = data.division;
                    selectLlamado.value = data.llamado;
                    document.getElementById('editar_id').value = data.idExamen;
                } else {
                    mostrarMensaje('error', 'No se pudieron cargar los datos del examen para editar.');
                }
            });
    }

    // Verificar si hay un ID de edición en la URL DESPUÉS de cargar los selects iniciales
    const urlParams = new URLSearchParams(window.location.search);
    const editarIdDesdeUrl = urlParams.get('editar_id');
    if (editarIdDesdeUrl) {
        document.getElementById('editar_id').value = editarIdDesdeUrl;
        cargarDatosExamen(editarIdDesdeUrl);
    }
});