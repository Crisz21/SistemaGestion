document.addEventListener('DOMContentLoaded', function() {
    // Carga inicial de carreras al cargar la página
    loadCarreras();
    // Carga inicial de correlativas (puede ser sin filtro o con el filtro por defecto)
    loadCorrelativas(); 
    // Carga inicial de la tabla de materias
    loadMaterias();

    // Manejador de evento para el envío del formulario de materia
    document.getElementById('materiaForm').addEventListener('submit', function(event) {
        event.preventDefault(); // Previene el envío por defecto del formulario
        guardarMateria(); // Llama a la función para guardar la materia
    });

    // Nuevo manejador de evento para detectar cambios en la selección de carrera
    document.getElementById('idCarrera').addEventListener('change', function() {
        const selectedCarreraId = this.value; // Obtiene el ID de la carrera seleccionada
        loadCorrelativas(selectedCarreraId); // Recarga las correlativas filtradas por la carrera
    });
});

// Función para cargar las carreras desde el servidor PHP
function loadCarreras() {
    fetch('../php/abm_materias.php?action=getCarreras')
        .then(response => response.json())
        .then(data => {
            const carreraSelect = document.getElementById('idCarrera');
            carreraSelect.innerHTML = '<option value="">Seleccionar Carrera...</option>'; // Limpiar y añadir opción por defecto
            data.forEach(carrera => {
                const option = document.createElement('option');
                option.value = carrera.idCarrera;
                option.textContent = carrera.nombre;
                carreraSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error al cargar carreras:', error);
            showMessage('error', 'Error al cargar las carreras. Revisa la consola para más detalles.');
        });
}

// Función para cargar las correlativas desde PHP
// Ahora acepta un idCarrera opcional para filtrar las materias por carrera
function loadCorrelativas(idCarrera = null) {
    let url = '../php/abm_materias.php?action=getCorrelativas';
    if (idCarrera) {
        url += `&idCarrera=${idCarrera}`; // Añadir el parámetro de carrera si se proporciona
    }

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const correlativaSelect = document.getElementById('correlativa');
            correlativaSelect.innerHTML = '<option value="">No tiene correlativa</option>'; // Limpiar y añadir opción por defecto
            
            // Verificar si los datos son un array válido (y no un objeto de error)
            if (Array.isArray(data)) {
                data.forEach(materia => {
                    const option = document.createElement('option');
                    option.value = materia.idMateria;
                    option.textContent = materia.nombre;
                    correlativaSelect.appendChild(option);
                });
            } else if (data.error) {
                console.error('Error al cargar correlativas:', data.error);
                showMessage('error', `Error al cargar correlativas: ${data.error}`);
            }
        })
        .catch(error => {
            console.error('Error en la solicitud de correlativas:', error);
            showMessage('error', 'Error en la solicitud de correlativas. Revisa la consola para más detalles.');
        });
}

// Función para cargar y mostrar todas las materias registradas en la tabla
function loadMaterias() {
    fetch('../php/abm_materias.php?action=getMaterias')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('materiasTable').getElementsByTagName('tbody')[0];
            tableBody.innerHTML = ''; // Limpiar la tabla antes de añadir nuevas filas

            data.forEach(materia => {
                const row = tableBody.insertRow();
                // Obtener los nombres de las correlativas o indicar que no tiene
                const correlativasNombres = materia.correlativa_nombres && materia.correlativa_nombres.length > 0 
                                                ? materia.correlativa_nombres.join(', ') 
                                                : 'Sin correlativa';

                row.innerHTML = `
                    <td>${materia.idMateria}</td>
                    <td>${materia.carrera_nombre}</td>
                    <td>${materia.nombre}</td>
                    <td>${materia.año}</td>
                    <td>${materia.division}</td>
                    <td>${materia.modalidad}</td>
                    <td>${correlativasNombres}</td>
                    <td>
                        <button onclick="editMateria(${materia.idMateria})">Editar</button>
                        <button onclick="deleteMateria(${materia.idMateria})">Eliminar</button>
                    </td>
                `;
            });
        })
        .catch(error => {
            console.error('Error al cargar materias:', error);
            showMessage('error', 'Error al cargar las materias. Revisa la consola para más detalles.');
        });
}

// Función para guardar una nueva materia (o varias si la división es "Todas las Divisiones")
function guardarMateria() {
    const form = document.getElementById('materiaForm');
    const formData = new FormData(form);
    
    // Obtener los IDs de las correlativas seleccionadas
    const correlativaSelect = document.getElementById('correlativa');
    const selectedCorrelativas = Array.from(correlativaSelect.selectedOptions).map(option => option.value);
    
    // Convertir el array de IDs de correlativas a una cadena separada por comas, o '-' si no hay
    formData.set('correlativa', selectedCorrelativas.length > 0 ? selectedCorrelativas.join(',') : '-');

    const division = formData.get('division');

    // Lógica especial para guardar la materia en "Todas las Divisiones"
    if (division === "Todas las Divisiones") {
        const divisiones = ["1ro", "2do", "3ro"];
        let successCount = 0;
        let errorMessages = [];
        let completedRequests = 0; // Contador para rastrear todas las solicitudes

        divisiones.forEach((div) => {
            const newFormData = new FormData(form); // Crear un nuevo FormData para cada división
            newFormData.set('division', div);
            newFormData.set('correlativa', selectedCorrelativas.length > 0 ? selectedCorrelativas.join(',') : '-');

            fetch('../php/abm_materias.php?action=guardarMateria', {
                method: 'POST',
                body: newFormData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    successCount++;
                } else {
                    errorMessages.push(`División ${div}: ${data.error}`);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                errorMessages.push(`División ${div}: Error en la solicitud de guardado.`);
            })
            .finally(() => {
                completedRequests++;
                // Cuando todas las solicitudes de división hayan finalizado
                if (completedRequests === divisiones.length) {
                    if (successCount === divisiones.length) {
                        showMessage('success', `Materia guardada correctamente para todas las ${successCount} divisiones.`);
                    } else if (successCount > 0) {
                        showMessage('success', `Materia guardada para ${successCount} divisiones. Errores en: ${errorMessages.join('; ')}`);
                    } else {
                        showMessage('error', `Error al guardar la materia en todas las divisiones: ${errorMessages.join('; ')}`);
                    }
                    loadMaterias(); // Recargar la tabla de materias una vez al final
                }
            });
        });
    } else { // Si no es "Todas las Divisiones", guardar una sola materia
        fetch('../php/abm_materias.php?action=guardarMateria', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showMessage('success', data.success);
                loadMaterias(); // Recargar la tabla si el guardado es exitoso
            } else {
                showMessage('error', data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('error', 'Error en la solicitud de guardado.');
        });
    }

    resetFormulario(); // Reiniciar el formulario después de guardar
}

// Función para mostrar mensajes de éxito o error al usuario
function showMessage(type, message) {
    const successDiv = document.getElementById('success');
    const errorDiv = document.getElementById('error'); 
    
    // Limpiar mensajes previos
    successDiv.textContent = '';
    successDiv.className = '';
    errorDiv.textContent = '';
    errorDiv.className = '';

    if (type === 'success') {
        successDiv.className = 'success';
        successDiv.textContent = message;
    } else {
        errorDiv.className = 'error';
        errorDiv.textContent = message;
    }

    // Ocultar los mensajes después de 5 segundos
    setTimeout(() => {
        successDiv.textContent = '';
        successDiv.className = '';
        errorDiv.textContent = '';
        errorDiv.className = '';
    }, 5000);
}

// Función para restablecer todos los campos del formulario a su estado original
function resetFormulario() {
    document.getElementById('materiaForm').reset(); // Reinicia los campos del formulario
    document.getElementById('guardarBtn').textContent = "Guardar"; // Asegura que el botón vuelva a "Guardar"
    // Deseleccionar todas las opciones en el select múltiple de correlativas
    const correlativaSelect = document.getElementById('correlativa');
    Array.from(correlativaSelect.options).forEach(option => {
        option.selected = false;
    });
    // Volver a cargar las correlativas (sin filtro, para la siguiente entrada)
    loadCorrelativas(); 
}

// Función para eliminar una materia por su ID
function deleteMateria(idMateria) {
    if (confirm('¿Estás seguro de que deseas eliminar esta materia?')) { // Pedir confirmación
        fetch(`../php/abm_materias.php?action=eliminarMateria&idMateria=${idMateria}`, {
            method: 'GET'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showMessage('success', data.success);
                loadMaterias(); // Recargar la tabla después de eliminar
            } else {
                showMessage('error', data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('error', 'Error al eliminar la materia.');
        });
    }
}

// Función para editar una materia: carga sus datos en el formulario
function editMateria(idMateria) {
    fetch(`../php/abm_materias.php?action=getMateriaById&idMateria=${idMateria}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0 && data[0]) { // Verificar que los datos existen
                const materia = data[0];
                document.getElementById('idCarrera').value = materia.idCarrera;
                
                // IMPORTANTE: Recargar las opciones del select de correlativas con las materias de la carrera seleccionada de la materia a editar.
                // Usamos .then() para asegurar que las opciones se carguen antes de intentar seleccionarlas.
                loadCorrelativas(materia.idCarrera).then(() => {
                    document.getElementById('nombre').value = materia.nombre;
                    document.getElementById('año').value = materia.año;
                    document.getElementById('division').value = materia.division;
                    document.getElementById('modalidad').value = materia.modalidad;
                    
                    // Seleccionar las correlativas que ya tiene la materia
                    const correlativaSelect = document.getElementById('correlativa');
                    // Deseleccionar todas las opciones primero
                    Array.from(correlativaSelect.options).forEach(option => {
                        option.selected = false;
                    });
                    
                    // Si la materia tiene correlativas, seleccionarlas en el select
                    if (materia.correlativa && materia.correlativa !== '-') {
                        const correlativasIds = materia.correlativa.split(',');
                        correlativasIds.forEach(id => {
                            const option = correlativaSelect.querySelector(`option[value="${id}"]`);
                            if (option) {
                                option.selected = true;
                            }
                        });
                    }

                    document.getElementById('guardarBtn').textContent = "Actualizar"; // Cambiar el texto del botón
                    
                    // Reemplazar el botón para evitar múltiples listeners en eventos click antiguos
                    const oldButton = document.getElementById('guardarBtn');
                    const newButton = oldButton.cloneNode(true);
                    oldButton.parentNode.replaceChild(newButton, oldButton);
                    
                    // Añadir el nuevo listener al botón "Actualizar"
                    newButton.addEventListener('click', function(event) {
                        event.preventDefault(); // Previene el envío por defecto
                        actualizarMateria(idMateria); // Llama a la función de actualización
                    });
                });

            } else {
                showMessage('error', 'Materia no encontrada para edición.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('error', 'Error al obtener los datos de la materia para edición.');
        });
}

// Función para actualizar una materia existente en la base de datos
function actualizarMateria(idMateria) {
    const form = document.getElementById('materiaForm');
    const formData = new FormData(form);

    // Obtener los IDs de las correlativas seleccionadas
    const correlativaSelect = document.getElementById('correlativa');
    const selectedCorrelativas = Array.from(correlativaSelect.selectedOptions).map(option => option.value);
    
    // Convertir el array de IDs de correlativas a una cadena separada por comas
    formData.set('correlativa', selectedCorrelativas.length > 0 ? selectedCorrelativas.join(',') : '-');

    fetch('../php/abm_materias.php?action=actualizarMateria&idMateria=' + idMateria, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage('success', data.success);
            loadMaterias(); // Recargar la tabla si la actualización es exitosa
        } else {
            showMessage('error', data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('error', 'Error al actualizar la materia.');
    });

    resetFormulario(); // Reiniciar el formulario después de la actualización
}