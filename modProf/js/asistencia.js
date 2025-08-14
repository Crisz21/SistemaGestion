document.addEventListener("DOMContentLoaded", () => {
    const formBuscarAlumnos = document.getElementById('formBuscarAlumnos');
    const formGuardarAsistencia = document.getElementById('formGuardarAsistencia');
    const tablaAlumnos = document.getElementById('tablaAlumnos').getElementsByTagName('tbody')[0];
    const selectCarrera = document.getElementById('idCarrera');
    const selectMateria = document.getElementById('idMateria');
    const selectAnio = document.getElementById('anio');
    const selectDivision = document.getElementById('division');

    // Variable global para almacenar el idCurso actual.
    let currentIdCurso = null; 

    cargarCarreras();

    // Listener de evento para el cambio en la selección de carrera.
    selectCarrera.addEventListener('change', function() {
        const idCarreraSeleccionada = this.value;
        if (idCarreraSeleccionada) {
            cargarMaterias(idCarreraSeleccionada); 
        } else {
            selectMateria.innerHTML = '<option value="" disabled selected>Selecciona una materia</option>';
        }
    });

    // Listener de evento para el formulario de búsqueda de alumnos.
    formBuscarAlumnos.addEventListener('submit', function(event) {
        event.preventDefault(); 
        buscarAlumnos();
    });

    // Listener de evento para el formulario de guardar asistencia.
    formGuardarAsistencia.addEventListener('submit', function(event) {
        event.preventDefault(); 
        guardarAsistencia();
    });

    /**
     * Carga las carreras desde el backend.
     */
    function cargarCarreras() {
        fetch('../php/asistencia.php', {
            method: 'POST',
            body: new URLSearchParams({
                accion: 'obtenerCarreras'
            })
        })
        .then(response => response.json())
        .then(data => {
            selectCarrera.innerHTML = '<option value="" disabled selected>Selecciona una carrera</option>';
            data.forEach(carrera => {
                const option = document.createElement('option');
                option.value = carrera.idCarrera;
                option.textContent = carrera.nombre;
                selectCarrera.appendChild(option);
            });
        })
        .catch(error => {
            console.error("Error al cargar las carreras:", error);
            alert("Hubo un error al cargar las carreras.");
        });
    }

    /**
     * Carga las materias desde el backend, filtrando por idCarrera.
     */
    function cargarMaterias(idCarrera = null) {
        const params = new URLSearchParams();
        params.append('accion', 'obtenerMaterias');
        if (idCarrera) {
            params.append('idCarrera', idCarrera); 
        }

        fetch('../php/asistencia.php', {
            method: 'POST',
            body: params 
        })
        .then(response => response.json())
        .then(data => {
            selectMateria.innerHTML = '<option value="" disabled selected>Selecciona una materia</option>';
            if (data.error) {
                console.error("Error al cargar materias:", data.error);
            } else {
                data.forEach(materia => {
                    const option = document.createElement('option');
                    option.value = materia.idMateria;
                    option.textContent = materia.nombre;
                    selectMateria.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error("Error al cargar las materias:", error);
            alert("Hubo un error al cargar las materias.");
        });
    }

    /**
     * Busca alumnos en el backend y los muestra en la tabla.
     */
    function buscarAlumnos() {
        const formData = new FormData(formBuscarAlumnos);
        formData.append('accion', 'buscarAlumnos');

        fetch('../php/asistencia.php', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                alert(data.error);
                tablaAlumnos.innerHTML = ''; 
                currentIdCurso = null; 
            } else {
                mostrarAlumnos(data.alumnos); 
                currentIdCurso = data.idCurso; 
            }
        })
        .catch(error => {
            console.error("Error en la búsqueda de alumnos:", error);
            alert("Hubo un error al buscar alumnos.");
            tablaAlumnos.innerHTML = ''; 
            currentIdCurso = null; 
        });
    }

    /**
     * Muestra la lista de alumnos en la tabla de asistencia.
     */
    function mostrarAlumnos(alumnos) {
        tablaAlumnos.innerHTML = ''; 
        if (alumnos.length === 0) {
            const row = tablaAlumnos.insertRow(); 
            const cell = row.insertCell(0);
            cell.colSpan = 5; 
            cell.textContent = "No se encontraron alumnos para los criterios seleccionados.";
            cell.style.textAlign = "center";
            return;
        }

        alumnos.forEach(alumno => {
            const row = tablaAlumnos.insertRow();
            row.insertCell(0).textContent = alumno.dni;
            row.insertCell(1).textContent = alumno.nombre;
            row.insertCell(2).textContent = alumno.apellido;
            
            const cellFecha = row.insertCell(3);
            const dateInput = document.createElement('input');
            dateInput.type = 'date';
            dateInput.name = `fecha_asistencia_${alumno.idAlumno}`; 
            dateInput.value = new Date().toISOString().split('T')[0]; 
            dateInput.readOnly = true; 
            cellFecha.appendChild(dateInput);
            
            const cellAsistencia = row.insertCell(4);
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = `asistencia[${alumno.idAlumno}]`; 
            checkbox.value = 1; 
            // CAMBIO: Inicializa el checkbox como desmarcado.
            checkbox.checked = false; 
            cellAsistencia.appendChild(checkbox);
        });
    }

    /**
     * Guarda la asistencia de los alumnos mostrados en la tabla.
     */
    function guardarAsistencia() {
        if (currentIdCurso === null) {
            alert("Por favor, busca alumnos primero para determinar el curso.");
            return; 
        }

        const formData = new FormData(); 
        formData.append('accion', 'guardarAsistencia');

        // Recopila la asistencia de los alumnos de la tabla.
        const asistencia = {};
        const checkboxes = document.querySelectorAll('[name^="asistencia"]'); 

        if (checkboxes.length === 0) {
            alert("No hay alumnos en la tabla para registrar la asistencia.");
            return; 
        }

        checkboxes.forEach(checkbox => {
            const idAlumnoMatch = checkbox.name.match(/\[(\d+)\]/);
            if (idAlumnoMatch && idAlumnoMatch[1]) {
                const idAlumno = idAlumnoMatch[1];
                asistencia[idAlumno] = checkbox.checked ? 1 : 0; 
            }
        });

        if (Object.keys(asistencia).length === 0) {
            alert("No se pudo recopilar la asistencia de ningún alumno.");
            return;
        }

        formData.append('asistencia', JSON.stringify(asistencia));

        const fechaInput = document.querySelector('input[name^="fecha_asistencia_"]');
        if (!fechaInput || !fechaInput.value) {
            alert("No se pudo obtener la fecha de asistencia. Asegúrate de que haya alumnos cargados.");
            return;
        }
        const fecha = fechaInput.value;

        formData.append('idCurso', currentIdCurso); 
        formData.append('idMateria', selectMateria.value);
        formData.append('idCarrera', selectCarrera.value);
        formData.append('fecha', fecha);

        fetch('../php/asistencia.php', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                alert(data.success);
                // Limpia la tabla y reinicia el curso después de guardar.
                tablaAlumnos.innerHTML = ''; 
                currentIdCurso = null; 

                // Reinicia los selectores a sus opciones predeterminadas.
                selectCarrera.value = ""; 
                selectMateria.innerHTML = '<option value="" disabled selected>Selecciona una materia</option>'; 
                selectMateria.value = ""; 
                selectAnio.value = ""; 
                selectDivision.value = ""; 
            }
        })
        .catch(error => {
            console.error("Error al enviar los datos de asistencia:", error);
            alert("Hubo un error al guardar la asistencia.");
        });
    }
});