document.addEventListener("DOMContentLoaded", () => {
    const formBuscarAlumnos = document.getElementById('formBuscarAlumnos');
    const formGuardarAsistencia = document.getElementById('formGuardarAsistencia');
    const tablaAlumnos = document.getElementById('tablaAlumnos').getElementsByTagName('tbody')[0];

    // Variable global para almacenar el idCurso actual, necesario para guardar la asistencia
    let currentIdCurso = null; 

    // Cargar las carreras y materias al inicio
    cargarCarreras();
    cargarMaterias();

    // Event listener para el formulario de búsqueda de alumnos
    formBuscarAlumnos.addEventListener('submit', function(event) {
        event.preventDefault(); // Evita que el formulario se envíe de forma predeterminada
        buscarAlumnos();
    });

    // Event listener para el formulario de guardar asistencia
    formGuardarAsistencia.addEventListener('submit', function(event) {
        event.preventDefault(); // Evita que el formulario se envíe de forma predeterminada
        guardarAsistencia();
    });

    /**
     * Carga las carreras desde el backend y las añade al select de carreras.
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
            const selectCarrera = document.getElementById('idCarrera');
            // Asegúrate de limpiar las opciones existentes si es necesario
            selectCarrera.innerHTML = '<option value="">Seleccione una carrera</option>'; // Opción por defecto
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
     * Carga las materias desde el backend y las añade al select de materias.
     */
    function cargarMaterias() {
        fetch('../php/asistencia.php', {
            method: 'POST',
            body: new URLSearchParams({
                accion: 'obtenerMaterias'
            })
        })
        .then(response => response.json())
        .then(data => {
            const selectMateria = document.getElementById('idMateria');
            // Asegúrate de limpiar las opciones existentes si es necesario
            selectMateria.innerHTML = '<option value="">Seleccione una materia (opcional)</option>'; // Opción por defecto
            data.forEach(materia => {
                const option = document.createElement('option');
                option.value = materia.idMateria;
                option.textContent = materia.nombre;
                selectMateria.appendChild(option);
            });
        })
        .catch(error => {
            console.error("Error al cargar las materias:", error);
            alert("Hubo un error al cargar las materias.");
        });
    }

    /**
     * Busca alumnos basándose en los criterios del formulario de búsqueda
     * y los muestra en la tabla. También almacena el idCurso devuelto.
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
                tablaAlumnos.innerHTML = ''; // Limpiar la tabla si hay un error
                currentIdCurso = null; // Resetear idCurso si la búsqueda falla
            } else {
                // PHP ahora devuelve { alumnos: [...], idCurso: ... }
                mostrarAlumnos(data.alumnos); 
                currentIdCurso = data.idCurso; // Almacena el idCurso recibido del backend
            }
        })
        .catch(error => {
            console.error("Error en la búsqueda de alumnos:", error);
            alert("Hubo un error al buscar alumnos. Verifique la consola para más detalles.");
            tablaAlumnos.innerHTML = ''; // Limpiar la tabla en caso de error
            currentIdCurso = null; // Resetear idCurso
        });
    }

    /**
     * Muestra la lista de alumnos en la tabla de asistencia.
     * @param {Array} alumnos - Un array de objetos alumno.
     */
    function mostrarAlumnos(alumnos) {
        tablaAlumnos.innerHTML = ''; // Limpiar la tabla antes de añadir nuevos alumnos
        if (alumnos.length === 0) {
            const row = tablaAlumnos.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 5; // Ocupa todas las columnas
            cell.textContent = "No se encontraron alumnos para los criterios seleccionados.";
            cell.style.textAlign = "center";
            return;
        }

        alumnos.forEach(alumno => {
            const row = tablaAlumnos.insertRow();
            row.insertCell(0).textContent = alumno.dni;
            row.insertCell(1).textContent = alumno.nombre;
            row.insertCell(2).textContent = alumno.apellido;
            
            // Crea un input de fecha para cada alumno, pero todos deberían tener la misma fecha del día
            const cellFecha = row.insertCell(3);
            const dateInput = document.createElement('input');
            dateInput.type = 'date';
            dateInput.name = `fecha_asistencia_${alumno.idAlumno}`; // Nombre único para cada input de fecha
            dateInput.value = new Date().toISOString().split('T')[0]; // Fecha actual
            dateInput.readOnly = true; // Solo lectura
            cellFecha.appendChild(dateInput);
            
            const cellAsistencia = row.insertCell(4);
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = `asistencia[${alumno.idAlumno}]`; // Nombre que PHP entenderá fácilmente
            checkbox.value = 1; // Valor a enviar si está marcado
            checkbox.checked = true; // Por defecto, presente
            cellAsistencia.appendChild(checkbox);
        });
    }

    /**
     * Guarda la asistencia de los alumnos mostrados en la tabla.
     */
    function guardarAsistencia() {
        // Validación inicial: asegurar que currentIdCurso tiene un valor
        if (currentIdCurso === null) {
            alert("Por favor, busca alumnos primero para determinar el curso.");
            return; 
        }

        const formData = new FormData(); // Creamos un nuevo FormData vacío
        formData.append('accion', 'guardarAsistencia');

        // Recopilar la asistencia de los alumnos de la tabla
        const asistencia = {};
        const checkboxes = document.querySelectorAll('[name^="asistencia"]'); // Selecciona todos los checkboxes de asistencia

        if (checkboxes.length === 0) {
            alert("No hay alumnos en la tabla para registrar la asistencia.");
            return; // No hay alumnos, no hay nada que guardar
        }

        checkboxes.forEach(checkbox => {
            // Extrae el idAlumno del atributo 'name' (e.g., "asistencia[123]")
            const idAlumnoMatch = checkbox.name.match(/\[(\d+)\]/);
            if (idAlumnoMatch && idAlumnoMatch[1]) {
                const idAlumno = idAlumnoMatch[1];
                asistencia[idAlumno] = checkbox.checked ? 1 : 0; // 1 si está presente, 0 si está ausente
            }
        });

        // Asegúrate de que haya al menos un alumno con asistencia
        if (Object.keys(asistencia).length === 0) {
            alert("No se pudo recopilar la asistencia de ningún alumno.");
            return;
        }

        // Agrega la asistencia recopilada (como JSON) al FormData
        formData.append('asistencia', JSON.stringify(asistencia));

        // Obtener la fecha del primer input de fecha generado en la tabla
        // Asumimos que todos los inputs de fecha en la tabla tienen la misma fecha
        const fechaInput = document.querySelector('input[name^="fecha_asistencia_"]');
        if (!fechaInput || !fechaInput.value) {
            alert("No se pudo obtener la fecha de asistencia. Asegúrate de que haya alumnos cargados.");
            return;
        }
        const fecha = fechaInput.value;

        // Añadir los IDs de curso, materia y carrera, y la fecha al FormData
        formData.append('idCurso', currentIdCurso); // Usamos la variable global
        formData.append('idMateria', document.getElementById('idMateria').value);
        formData.append('idCarrera', document.getElementById('idCarrera').value);
        formData.append('fecha', fecha);

        // Envía los datos al script PHP
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
                // Opcional: Limpiar la tabla y resetear el curso después de guardar con éxito
                tablaAlumnos.innerHTML = ''; 
                currentIdCurso = null; 
            }
        })
        .catch(error => {
            console.error("Error al enviar los datos de asistencia:", error);
            alert("Hubo un error al guardar la asistencia. Revisa la consola para más detalles.");
        });
    }
}); // Cierre de DOMContentLoaded