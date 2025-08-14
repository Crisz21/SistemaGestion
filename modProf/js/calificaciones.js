document.addEventListener('DOMContentLoaded', () => {
    const formBuscarAlumnos = document.getElementById('formBuscarAlumnos');
    const formCalificaciones = document.getElementById('formCalificaciones');
    const tablaCalificacionesBody = document.getElementById('tablaCalificacionesBody');
    const idCarreraSelect = document.getElementById('idCarrera');
    const idMateriaSelect = document.getElementById('idMateria');
    const hiddenIdCurso = document.getElementById('hiddenIdCurso');
    const hiddenIdCarrera = document.getElementById('hiddenIdCarrera');
    const hiddenIdMateria = document.getElementById('hiddenIdMateria');

    const formCalificacionesFinales = document.getElementById('formCalificacionesFinales');
    const tablaCalificacionesMesaFinalBody = document.getElementById('tablaCalificacionesMesaFinalBody');
    const hiddenIdCursoMesaFinal = document.getElementById('hiddenIdCursoMesaFinal');
    const hiddenIdCarreraMesaFinal = document.getElementById('hiddenIdCarreraMesaFinal');
    const hiddenIdMateriaMesaFinal = document.getElementById('hiddenIdMateriaMesaFinal');


    async function cargarOpcionesSelect(selectElement, endpoint, valueKey, textKey, idDependencia = null) {
        try {
            let url = `../php/calificaciones.php?action=get_${endpoint}`;
            if (idDependencia) {
                url += `&idCarrera=${idDependencia}`;
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            selectElement.innerHTML = '<option value="" disabled selected>Selecciona una ' + endpoint.slice(0, -1) + '</option>';

            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item[valueKey];
                option.textContent = item[textKey];
                selectElement.appendChild(option);
            });
        } catch (error) {
            console.error(`Error al cargar ${endpoint}:`, error);
            alert(`Error al cargar ${endpoint}. Por favor, intentá de nuevo.`);
        }
    }

    cargarOpcionesSelect(idCarreraSelect, 'carreras', 'idCarrera', 'nombre');

    idCarreraSelect.addEventListener('change', () => {
        const selectedCarreraId = idCarreraSelect.value;
        if (selectedCarreraId) {
            idMateriaSelect.disabled = false;
            cargarOpcionesSelect(idMateriaSelect, 'materias', 'idMateria', 'nombre', selectedCarreraId);
        } else {
            idMateriaSelect.disabled = true;
            idMateriaSelect.innerHTML = '<option value="" disabled selected>Selecciona una materia</option>';
        }
        tablaCalificacionesBody.innerHTML = '';
        tablaCalificacionesMesaFinalBody.innerHTML = '';
    });

    // Función para habilitar/deshabilitar campos de recuperatorio
    function verificarCalificacionesCursada() {
        tablaCalificacionesBody.querySelectorAll('tr').forEach(row => {
            const calificacion1Input = row.querySelector('input[name*="calificacion1"]');
            const recuperatorio1Input = row.querySelector('input[name*="recuperatorio1"]');
            const calificacion2Input = row.querySelector('input[name*="calificacion2"]');
            const recuperatorio2Input = row.querySelector('input[name*="recuperatorio2"]');

            // Habilitar/deshabilitar recuperatorio 1
            if (calificacion1Input && recuperatorio1Input) {
                const cal1Val = parseFloat(calificacion1Input.value);
                // Si calificacion1 es menor a 4, o está vacía/0, se habilita el recuperatorio.
                // Si calificacion1 es >= 4, se deshabilita y limpia el recuperatorio.
                if (cal1Val < 4 && cal1Val > 0) { // Solo si la original está desaprobada y no vacía
                    recuperatorio1Input.disabled = false;
                } else {
                    recuperatorio1Input.value = '';
                    recuperatorio1Input.disabled = true;
                }
            }

            // Habilitar/deshabilitar recuperatorio 2
            if (calificacion2Input && recuperatorio2Input) {
                const cal2Val = parseFloat(calificacion2Input.value);
                // Si calificacion2 es menor a 4, o está vacía/0, se habilita el recuperatorio.
                // Si calificacion2 es >= 4, se deshabilita y limpia el recuperatorio.
                if (cal2Val < 4 && cal2Val > 0) { // Solo si la original está desaprobada y no vacía
                    recuperatorio2Input.disabled = false;
                } else {
                    recuperatorio2Input.value = '';
                    recuperatorio2Input.disabled = true;
                }
            }
        });
    }

    // Función para calcular y mostrar el estado de "Cursada Aprobada" en una fila específica
    function updateCursadaAprobadaStatus(row) {
        const calificacion1 = parseFloat(row.querySelector('input[name*="calificacion1"]').value) || 0;
        const recuperatorio1 = parseFloat(row.querySelector('input[name*="recuperatorio1"]').value) || 0;
        const calificacion2 = parseFloat(row.querySelector('input[name*="calificacion2"]').value) || 0;
        const recuperatorio2 = parseFloat(row.querySelector('input[name*="recuperatorio2"]').value) || 0;

        let notaInstancia1 = calificacion1;
        // Si hay recuperatorio1 y es aprobatorio (>=4), lo usamos. Si no, usamos la nota original.
        if (recuperatorio1 >= 4 && recuperatorio1 > 0) { 
            notaInstancia1 = recuperatorio1;
        } else if (calificacion1 < 4 && calificacion1 > 0 && recuperatorio1 > 0 && recuperatorio1 < 4) {
            // Si ambas (cal1 y rec1) están desaprobadas, tomamos la más alta entre ellas, si alguna existe
            notaInstancia1 = Math.max(calificacion1, recuperatorio1);
        } else if (calificacion1 === 0 && recuperatorio1 > 0) {
            // Si cal1 es 0/vacía y solo hay recuperatorio, tomamos el recuperatorio (aprobado o no)
            notaInstancia1 = recuperatorio1;
        }

        let notaInstancia2 = calificacion2;
        // Misma lógica para la segunda instancia
        if (recuperatorio2 >= 4 && recuperatorio2 > 0) { 
            notaInstancia2 = recuperatorio2;
        } else if (calificacion2 < 4 && calificacion2 > 0 && recuperatorio2 > 0 && recuperatorio2 < 4) {
            notaInstancia2 = Math.max(calificacion2, recuperatorio2);
        } else if (calificacion2 === 0 && recuperatorio2 > 0) {
            notaInstancia2 = recuperatorio2;
        }

        // Asegurarse de que las notas sean numéricas
        notaInstancia1 = isNaN(notaInstancia1) ? 0 : notaInstancia1;
        notaInstancia2 = isNaN(notaInstancia2) ? 0 : notaInstancia2;

        const cursadaAprobadaCell = row.querySelector('.cursada-aprobada-cell');
        if (cursadaAprobadaCell) {
            // La nueva lógica: Ambas instancias deben tener una nota final de 4 o más.
            const instancia1Aprobada = notaInstancia1 >= 4;
            const instancia2Aprobada = notaInstancia2 >= 4;

            // Verificar si hay notas válidas ingresadas en ambas instancias
            const hayNotaInstancia1 = (calificacion1 > 0 || recuperatorio1 > 0);
            const hayNotaInstancia2 = (calificacion2 > 0 || recuperatorio2 > 0);
            
            if (instancia1Aprobada && instancia2Aprobada) {
                cursadaAprobadaCell.innerHTML = 'Cursada Aprobada ✔️';
            } else if (hayNotaInstancia1 || hayNotaInstancia2) { // Si hay al menos una nota, pero no se cumplen los criterios de aprobación
                 cursadaAprobadaCell.innerHTML = 'Cursada Desaprobada ❌';
            }
            else {
                cursadaAprobadaCell.innerHTML = 'En Curso'; // Si no hay ninguna nota ingresada
            }
        }
    }


    tablaCalificacionesBody.addEventListener('input', (event) => {
        if (event.target.name.includes("calificacion1") ||
            event.target.name.includes("recuperatorio1") ||
            event.target.name.includes("calificacion2") ||
            event.target.name.includes("recuperatorio2")) {
            verificarCalificacionesCursada();
            updateCursadaAprobadaStatus(event.target.closest('tr')); // Actualiza el estado de la cursada
        }
    });

    function verificarCalificacionesMesaFinal() {
        tablaCalificacionesMesaFinalBody.querySelectorAll('tr').forEach(row => {
            const examenFinalInput = row.querySelector('input[name*="[examenFinal]"]');
            const examenFinal2Input = row.querySelector('input[name*="[examenFinal2]"]');
            const examenFinal3Input = row.querySelector('input[name*="[examenFinal3]"]');

            if (examenFinalInput && examenFinal2Input) {
                const final1Val = parseFloat(examenFinalInput.value);
                // Habilita examenFinal2 si final1 es < 4 y existe (no vacío)
                examenFinal2Input.disabled = !(final1Val < 4 && final1Val > 0); 
                if (examenFinal2Input.disabled) examenFinal2Input.value = '';
            }

            if (examenFinal2Input && examenFinal3Input) {
                const final2Val = parseFloat(examenFinal2Input.value);
                // Habilita examenFinal3 si final2 es < 4 y existe (no vacío)
                examenFinal3Input.disabled = !(final2Val < 4 && final2Val > 0); 
                if (examenFinal3Input.disabled) examenFinal3Input.value = '';
            }
        });
    }

    tablaCalificacionesMesaFinalBody.addEventListener('input', (event) => {
        if (event.target.name.includes("examenFinal") ||
            event.target.name.includes("examenFinal2")) {
            verificarCalificacionesMesaFinal();
        }
    });

    formBuscarAlumnos.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(formBuscarAlumnos);
        const data = Object.fromEntries(formData.entries());

        if (!data.idMateria) {
            alert("Por favor, seleccioná una materia para buscar alumnos.");
            return;
        }

        try {
            // Lógica para buscar alumnos regulares y sus calificaciones de cursada
            const responseAlumnosCursada = await fetch('../php/calificaciones.php?action=buscar_alumnos_cursada', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!responseAlumnosCursada.ok) {
                throw new Error(`HTTP error! status: ${responseAlumnosCursada.status}`);
            }

            const resultAlumnosCursada = await responseAlumnosCursada.json();
            console.log("Resultado de búsqueda de alumnos de cursada:", resultAlumnosCursada);

            if (resultAlumnosCursada.error) {
                alert(resultAlumnosCursada.error);
                tablaCalificacionesBody.innerHTML = '';
                tablaCalificacionesMesaFinalBody.innerHTML = '';
                return;
            }

            hiddenIdCurso.value = resultAlumnosCursada.idCurso;
            hiddenIdCarrera.value = data.idCarrera;
            hiddenIdMateria.value = data.idMateria;

            tablaCalificacionesBody.innerHTML = '';
            if (resultAlumnosCursada.alumnos && resultAlumnosCursada.alumnos.length > 0) {
                resultAlumnosCursada.alumnos.forEach(alumno => {
                    const row = document.createElement('tr');

                    // Lógica para determinar la nota final para cada instancia de cursada
                    const nota1 = parseFloat(alumno.calificacion1 || 0);
                    const rec1 = parseFloat(alumno.recuperatorio1 || 0);
                    const nota2 = parseFloat(alumno.calificacion2 || 0);
                    const rec2 = parseFloat(alumno.recuperatorio2 || 0);

                    let notaInstancia1 = nota1;
                    if (rec1 >= 4 && rec1 > 0) { 
                        notaInstancia1 = rec1;
                    } else if (nota1 < 4 && nota1 > 0 && rec1 > 0 && rec1 < 4) {
                        notaInstancia1 = Math.max(nota1, rec1);
                    } else if (nota1 === 0 && rec1 > 0) {
                        notaInstancia1 = rec1;
                    }

                    let notaInstancia2 = nota2;
                    if (rec2 >= 4 && rec2 > 0) { 
                        notaInstancia2 = rec2;
                    } else if (nota2 < 4 && nota2 > 0 && rec2 > 0 && rec2 < 4) {
                        notaInstancia2 = Math.max(nota2, rec2);
                    } else if (nota2 === 0 && rec2 > 0) {
                        notaInstancia2 = rec2;
                    }

                    notaInstancia1 = isNaN(notaInstancia1) ? 0 : notaInstancia1;
                    notaInstancia2 = isNaN(notaInstancia2) ? 0 : notaInstancia2;

                    let cursadaAprobadaText = 'En Curso';
                    const instancia1Aprobada = notaInstancia1 >= 4;
                    const instancia2Aprobada = notaInstancia2 >= 4;

                    const hayNotaInstancia1 = (nota1 > 0 || rec1 > 0);
                    const hayNotaInstancia2 = (nota2 > 0 || rec2 > 0);

                    if (instancia1Aprobada && instancia2Aprobada) {
                        cursadaAprobadaText = 'Cursada Aprobada ✔️';
                    } else if (hayNotaInstancia1 || hayNotaInstancia2) { 
                        cursadaAprobadaText = 'Cursada Desaprobada ❌';
                    }
                    else {
                        cursadaAprobadaText = 'En Curso'; // Si no hay ninguna nota ingresada
                    }


                    row.innerHTML = `
                        <td>${alumno.dni}</td>
                        <td>${alumno.nombre}</td>
                        <td>${alumno.apellido}</td>
                        <td><input type="number" name="calificaciones[${alumno.idAlumno}][calificacion1]" value="${alumno.calificacion1 || ''}" step="1" min="1" max="10"></td>
                        <td><input type="number" name="calificaciones[${alumno.idAlumno}][recuperatorio1]" value="${alumno.recuperatorio1 || ''}" step="1" min="1" max="10"></td>
                        <td><input type="number" name="calificaciones[${alumno.idAlumno}][calificacion2]" value="${alumno.calificacion2 || ''}" step="1" min="1" max="10"></td>
                        <td><input type="number" name="calificaciones[${alumno.idAlumno}][recuperatorio2]" value="${alumno.recuperatorio2 || ''}" step="1" min="1" max="10"></td>
                        <td class="cursada-aprobada-cell">${cursadaAprobadaText}</td>
                    `;
                    tablaCalificacionesBody.appendChild(row);
                });
                verificarCalificacionesCursada(); // Llama para habilitar/deshabilitar recuperatorios
            } else {
                const row = document.createElement('tr');
                row.innerHTML = `<td colspan="9">No hay alumnos regulares para esta selección.</td>`;
                tablaCalificacionesBody.appendChild(row);
            }


            // --- Lógica para buscar y mostrar alumnos inscritos en examen final ---
            const responseInscritosFinal = await fetch('../php/calificaciones.php?action=buscar_inscritos_mesa_final', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!responseInscritosFinal.ok) {
                throw new Error(`HTTP error! status: ${responseInscritosFinal.status}`);
            }

            const resultInscritosFinal = await responseInscritosFinal.json();
            console.log("Resultado de búsqueda de inscritos a final:", resultInscritosFinal);

            if (resultInscritosFinal.error) {
                alert(resultInscritosFinal.error);
                tablaCalificacionesMesaFinalBody.innerHTML = '';
                return;
            }

            hiddenIdCursoMesaFinal.value = resultInscritosFinal.idCurso;
            hiddenIdCarreraMesaFinal.value = data.idCarrera;
            hiddenIdMateriaMesaFinal.value = data.idMateria;

            tablaCalificacionesMesaFinalBody.innerHTML = '';
            if (resultInscritosFinal.alumnos_inscritos && resultInscritosFinal.alumnos_inscritos.length > 0) {
                resultInscritosFinal.alumnos_inscritos.forEach(alumno => {
                    const row = document.createElement('tr');

                    // MODIFICACIÓN CLAVE AQUÍ: Cada input va en su propio <td>
                    row.innerHTML = `
                        <td>${alumno.dni}</td>
                        <td>${alumno.nombre}</td>
                        <td>${alumno.apellido}</td>
                        <td><input type="number" name="calificacionesMesaFinal[${alumno.idAlumno}][examenFinal]" value="${alumno.examenFinal || ''}" step="1" min="1" max="10"></td>
                        <td><input type="number" name="calificacionesMesaFinal[${alumno.idAlumno}][examenFinal2]" value="${alumno.examenFinal2 || ''}" step="1" min="1" max="10"></td>
                        <td><input type="number" name="calificacionesMesaFinal[${alumno.idAlumno}][examenFinal3]" value="${alumno.examenFinal3 || ''}" step="1" min="1" max="10"></td>
                        <td><input type="text" name="calificacionesMesaFinal[${alumno.idAlumno}][tomo]" value="${alumno.tomo || ''}" maxlength="20"></td>
                        <td><input type="text" name="calificacionesMesaFinal[${alumno.idAlumno}][folio]" value="${alumno.folio || ''}" maxlength="20"></td>
                    `;
                    tablaCalificacionesMesaFinalBody.appendChild(row);
                });
                verificarCalificacionesMesaFinal();
            } else {
                const row = document.createElement('tr');
                row.innerHTML = `<td colspan="8">No hay alumnos inscritos para mesa de examen final en esta selección.</td>`; tablaCalificacionesMesaFinalBody.appendChild(row);
            }

        } catch (error) {
            console.error('Error al buscar alumnos o inscritos para examen final:', error);
            alert('Error al buscar alumnos o inscritos para examen final. Por favor, intentá de nuevo.');
        }
    });

    formCalificaciones.addEventListener('submit', async (event) => {
        event.preventDefault();

        const data = {};

        data.calificaciones = {};
        tablaCalificacionesBody.querySelectorAll('tr').forEach(row => {
            const calificacion1Input = row.querySelector('input[name*="calificacion1"]');
            if (!calificacion1Input || !calificacion1Input.name.match(/\[(.*?)\]/)) return; // Skip if row is just a message or malformed

            const idAlumno = calificacion1Input.name.match(/\[(.*?)\]/)[1];

            data.calificaciones[idAlumno] = {
                calificacion1: calificacion1Input.value,
                recuperatorio1: row.querySelector('input[name*="recuperatorio1"]').value,
                calificacion2: row.querySelector('input[name*="calificacion2"]').value,
                recuperatorio2: row.querySelector('input[name*="recuperatorio2"]').value,
            };
        });

        data.idCurso = hiddenIdCurso.value;
        data.idCarrera = hiddenIdCarrera.value;
        data.idMateria = hiddenIdMateria.value;

        try {
            const response = await fetch('../php/calificaciones.php?action=guardar_calificaciones_cursada', {
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
            alert(result.message);

        } catch (error) {
            console.error('Error al guardar calificaciones de cursada:', error);
            alert('Error al guardar calificaciones de cursada. Por favor, intentá de nuevo.');
        }
    });

    formCalificacionesFinales.addEventListener('submit', async (event) => {
        event.preventDefault();

        const data = {};
        data.calificacionesMesaFinal = {};
        tablaCalificacionesMesaFinalBody.querySelectorAll('tr').forEach(row => {
            const inputNota1 = row.querySelector('input[name*="[examenFinal]"]');
            if (inputNota1 && inputNota1.name.match(/\[(.*?)\]/)) {
                const idAlumno = inputNota1.name.match(/\[(.*?)\]/)[1];
                data.calificacionesMesaFinal[idAlumno] = {
                    examenFinal: inputNota1.value,
                    examenFinal2: row.querySelector('input[name*="[examenFinal2]"]').value,
                    // Asegúrate que el nombre sea correcto, en el original tenías 'clexamenFinal3'
                    examenFinal3: row.querySelector('input[name*="[examenFinal3]"]').value, 
                    tomo: row.querySelector('input[name*="[tomo]"]').value,
                    folio: row.querySelector('input[name*="[folio]"]').value,
                };
            }
        });

        data.idCurso = hiddenIdCursoMesaFinal.value;
        data.idCarrera = hiddenIdCarreraMesaFinal.value;
        data.idMateria = hiddenIdMateriaMesaFinal.value;

        if (Object.keys(data.calificacionesMesaFinal).length === 0) {
            alert('No hay calificaciones de examen final para guardar.');
            return;
        }

        try {
            const response = await fetch('../php/calificaciones.php?action=guardar_calificaciones_mesa_final', {
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
            alert(result.message);

        } catch (error) {
            console.error('Error al guardar calificaciones de mesa de examen final:', error);
            alert('Error al guardar calificaciones de mesa de examen final. Por favor, intentá de nuevo.');
        }
    });
});