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

    // Función para agregar la opción por defecto a un select
    // SOLO SI NO TIENE O NO ESTÁ SELECCIONADA UNA OPCIÓN VÁLIDA
    function ensureDefaultOption(selectElement, defaultText) {
        // Si el select ya tiene opciones y la primera no es vacía, o si ya tiene una seleccionada
        if (selectElement.options.length === 0 || selectElement.options[0].value !== '') {
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = defaultText;
            selectElement.insertBefore(defaultOption, selectElement.firstChild);
        }
        selectElement.value = ''; // Asegurarse de que esté seleccionada la opción por defecto
    }

    // Función general para cargar selects (ahora con soporte para idCarrera para materias)
    function cargarSelect(accion, selectElement, paramId = null) {
        let url = `../php/examenes_finales.php?accion=${accion}`;
        if (paramId && accion === 'cargar_materias') {
            url += `&idCarrera=${paramId}`;
        }
        
        // Limpiar el select antes de cargar nuevas opciones (solo para materias y carreras)
        if (accion === 'cargar_carreras' || accion === 'cargar_materias') {
             selectElement.innerHTML = ''; // Limpiar completamente para recargar
        }

        fetch(url)
            .then(response => response.json())
            .then(data => {
                let defaultText = '';
                if (accion === 'cargar_carreras') defaultText = 'Selecciona una carrera';
                else if (accion === 'cargar_materias') defaultText = 'Selecciona una materia';

                // Añadir la opción por defecto solo si es para carrera o materia y se limpió
                if (accion === 'cargar_carreras' || accion === 'cargar_materias') {
                    const defaultOption = document.createElement('option');
                    defaultOption.value = '';
                    defaultOption.textContent = defaultText;
                    selectElement.appendChild(defaultOption);
                }
                
                data.forEach(item => {
                    const option = document.createElement('option');
                    // Asegúrate de que el 'id' sea el nombre de la columna del ID en tu BD
                    // y 'nombre' el de la columna del nombre.
                    // Usar idCarrera o idMateria dependiendo del tipo de datos
                    option.value = item.idCarrera || item.idMateria; 
                    option.textContent = item.nombre;
                    selectElement.appendChild(option);
                });
            });
    }

    // Cargar carreras al cargar la página
    cargarSelect('cargar_carreras', selectCarrera);

    // *** NUEVO: Event Listener para el cambio en el select de carreras ***
    selectCarrera.addEventListener('change', () => {
        const idCarreraSeleccionada = selectCarrera.value;
        if (idCarreraSeleccionada) {
            cargarSelect('cargar_materias', selectMateria, idCarreraSeleccionada);
        } else {
            // Si no hay carrera seleccionada, limpiar el select de materias
            selectMateria.innerHTML = '<option value="">Selecciona una materia</option>';
        }
    });
    // *** FIN NUEVO ***

    // Asegurar que los otros selects tengan su opción por defecto al cargar
    ensureDefaultOption(selectAño, 'Selecciona un año');
    ensureDefaultOption(selectDivision, 'Selecciona una división');
    ensureDefaultOption(selectLlamado, 'Selecciona un llamado');

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
                
                // Restablecer los selects después de guardar
                selectCarrera.value = '';
                selectMateria.innerHTML = '<option value="">Selecciona una materia</option>'; // Limpiar materias
                ensureDefaultOption(selectAño, 'Selecciona un año');
                ensureDefaultOption(selectDivision, 'Selecciona una división');
                ensureDefaultOption(selectLlamado, 'Selecciona un llamado');

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
        selectMateria.innerHTML = '<option value="">Selecciona una materia</option>'; // Limpiar materias

        // Se rellenarán con los datos del examen a editar
        selectAño.value = '';
        selectDivision.value = '';
        selectLlamado.value = '';

        fetch(`../php/examenes_finales.php?accion=obtener_examen&editar_id=${idExamen}`)
            .then(response => response.json())
            .then(data => {
                if (data) {
                    // Seleccionar la carrera y luego cargar las materias correspondientes
                    selectCarrera.value = data.idCarrera;
                    // Asegurarse de que el cambio dispare la carga de materias
                    // Esto puede hacerse simulando un evento 'change' o llamando directamente a cargarSelect
                    cargarSelect('cargar_materias', selectMateria, data.idCarrera)
                        .then(() => {
                            // Una vez que las materias estén cargadas, selecciona la materia del examen
                            selectMateria.value = data.idMateria;
                        });
                    
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