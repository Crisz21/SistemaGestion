document.addEventListener('DOMContentLoaded', () => {
    const formBuscarAlumnos = document.getElementById('formBuscarAlumnos');
    const formCalificaciones = document.getElementById('formCalificaciones');
    const tablaCalificacionesBody = document.getElementById('tablaCalificacionesBody');
    const idCarreraSelect = document.getElementById('idCarrera');
    const idMateriaSelect = document.getElementById('idMateria');
    const hiddenIdCurso = document.getElementById('hiddenIdCurso');
    const hiddenIdCarrera = document.getElementById('hiddenIdCarrera');
    const hiddenIdMateria = document.getElementById('hiddenIdMateria');

    // Función para cargar opciones de select (carreras y materias)
    async function cargarOpcionesSelect(selectElement, endpoint, valueKey, textKey) {
        try {
            const response = await fetch(`../php/calificaciones.php?action=get_${endpoint}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Limpiar opciones existentes (excepto la primera "Selecciona...")
            selectElement.innerHTML = '<option value="" disabled selected>Selecciona una ' + endpoint.slice(0, -1) + '</option>';
            
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item[valueKey];
                option.textContent = item[textKey];
                selectElement.appendChild(option);
            });
        } catch (error) {
            console.error(`Error al cargar ${endpoint}:`, error);
            alert(`Error al cargar ${endpoint}. Por favor, intente de nuevo.`);
        }
    }

    // Cargar carreras y materias al inicio
    cargarOpcionesSelect(idCarreraSelect, 'carreras', 'idCarrera', 'nombre');
    cargarOpcionesSelect(idMateriaSelect, 'materias', 'idMateria', 'nombre');

    // Función para habilitar/deshabilitar campos de recuperatorio
    function verificarCalificaciones() {
        tablaCalificacionesBody.querySelectorAll('tr').forEach(row => {
            const calificacion1Input = row.querySelector('input[name*="calificacion1"]');
            const recuperatorio1Input = row.querySelector('input[name*="recuperatorio1"]');
            const calificacion2Input = row.querySelector('input[name*="calificacion2"]');
            const recuperatorio2Input = row.querySelector('input[name*="recuperatorio2"]');

            if (calificacion1Input && recuperatorio1Input) {
                recuperatorio1Input.disabled = (parseFloat(calificacion1Input.value) >= 4);
            }
            if (calificacion2Input && recuperatorio2Input) {
                recuperatorio2Input.disabled = (parseFloat(calificacion2Input.value) >= 4);
            }
        });
    }

    // Escuchar cambios en los inputs de calificación para habilitar/deshabilitar recuperatorios
    tablaCalificacionesBody.addEventListener('input', (event) => {
        if (event.target.name.includes("calificacion1") || event.target.name.includes("calificacion2")) {
            verificarCalificaciones();
        }
    });

    // Manejar el envío del formulario de búsqueda de alumnos
    formBuscarAlumnos.addEventListener('submit', async (event) => {
        event.preventDefault(); // Evitar el envío tradicional del formulario

        const formData = new FormData(formBuscarAlumnos);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('../php/calificaciones.php?action=buscar_alumnos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.error) {
                alert(result.error);
                tablaCalificacionesBody.innerHTML = ''; // Limpiar la tabla si hay un error
                return;
            }

            // Guardar idCurso en el campo oculto
            hiddenIdCurso.value = result.idCurso;
            hiddenIdCarrera.value = data.idCarrera;
            hiddenIdMateria.value = data.idMateria;

            // Rellenar la tabla de calificaciones
            tablaCalificacionesBody.innerHTML = ''; // Limpiar la tabla
            result.alumnos.forEach(alumno => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${alumno.dni}</td>
                    <td>${alumno.nombre}</td>
                    <td>${alumno.apellido}</td>
                    <td><input type="number" name="calificaciones[${alumno.idAlumno}][calificacion1]" value="${alumno.calificacion1 || ''}" step="1" min="1" max="10"></td>
                    <td><input type="number" name="calificaciones[${alumno.idAlumno}][recuperatorio1]" value="${alumno.recuperatorio1 || ''}" step="1" min="1" max="10"></td>
                    <td><input type="number" name="calificaciones[${alumno.idAlumno}][calificacion2]" value="${alumno.calificacion2 || ''}" step="1" min="1" max="10"></td>
                    <td><input type="number" name="calificaciones[${alumno.idAlumno}][recuperatorio2]" value="${alumno.recuperatorio2 || ''}" step="1" min="1" max="10"></td>
                    <td><input type="number" name="calificaciones[${alumno.idAlumno}][examenFinal]" value="${alumno.examenFinal || ''}" step="1" min="1" max="10"></td>
                `;
                tablaCalificacionesBody.appendChild(row);
            });

            // Después de cargar y rellenar, verificar calificaciones para deshabilitar recuperatorios
            verificarCalificaciones();

        } catch (error) {
            console.error('Error al buscar alumnos:', error);
            alert('Error al buscar alumnos. Por favor, intente de nuevo.');
        }
    });

    // Manejar el envío del formulario de guardar calificaciones
    formCalificaciones.addEventListener('submit', async (event) => {
        event.preventDefault(); // Evitar el envío tradicional del formulario

        const formData = new FormData(formCalificaciones);
        const data = {};
        
        // Recopilar datos de calificaciones de la tabla
        data.calificaciones = {};
        tablaCalificacionesBody.querySelectorAll('tr').forEach(row => {
            const idAlumno = row.querySelector('input[name*="calificacion1"]').name.match(/\[(.*?)\]/)[1];
            data.calificaciones[idAlumno] = {
                calificacion1: row.querySelector('input[name*="calificacion1"]').value,
                recuperatorio1: row.querySelector('input[name*="recuperatorio1"]').value,
                calificacion2: row.querySelector('input[name*="calificacion2"]').value,
                recuperatorio2: row.querySelector('input[name*="recuperatorio2"]').value,
                examenFinal: row.querySelector('input[name*="examenFinal"]').value,
            };
        });

        // Añadir los IDs ocultos
        data.idCurso = hiddenIdCurso.value;
        data.idCarrera = hiddenIdCarrera.value;
        data.idMateria = hiddenIdMateria.value;

        try {
            const response = await fetch('../php/calificaciones.php?action=guardar_calificaciones', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            alert(result.message); // Mostrar el mensaje de éxito o error del PHP

        } catch (error) {
            console.error('Error al guardar calificaciones:', error);
            alert('Error al guardar calificaciones. Por favor, intente de nuevo.');
        }
    });
});