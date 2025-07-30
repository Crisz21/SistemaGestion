document.addEventListener('DOMContentLoaded', function() {
    loadCarreras();
    loadCorrelativas();
    loadMaterias();

    // Manejador de evento para el formulario de materia
    document.getElementById('materiaForm').addEventListener('submit', function(event) {
        event.preventDefault();
        guardarMateria();
    });
});

// Función para cargar las carreras desde PHP
function loadCarreras() {
    fetch('../php/abm_materias.php?action=getCarreras')
        .then(response => response.json())
        .then(data => {
            const carreraSelect = document.getElementById('idCarrera');
            data.forEach(carrera => {
                const option = document.createElement('option');
                option.value = carrera.idCarrera;
                option.textContent = carrera.nombre;
                carreraSelect.appendChild(option);
            });
        });
}

// Función para cargar las correlativas desde PHP
function loadCorrelativas() {
    fetch('../php/abm_materias.php?action=getCorrelativas')
        .then(response => response.json())
        .then(data => {
            const correlativaSelect = document.getElementById('correlativa');
            data.forEach(materia => {
                const option = document.createElement('option');
                option.value = materia.idMateria;
                option.textContent = materia.nombre;
                correlativaSelect.appendChild(option);
            });
        });
}

// Función para cargar las materias registradas
function loadMaterias() {
    fetch('../php/abm_materias.php?action=getMaterias')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('materiasTable').getElementsByTagName('tbody')[0];
            tableBody.innerHTML = '';

            data.forEach(materia => {
                const row = tableBody.insertRow();
                row.innerHTML = `
                    <td>${materia.idMateria}</td>
                    <td>${materia.carrera_nombre}</td>
                    <td>${materia.nombre}</td>
                    <td>${materia.año}</td>
                    <td>${materia.division}</td>
                    <td>${materia.modalidad}</td>
                    <td>${materia.correlativa_nombre || 'Sin correlativa'}</td>
                    <td>
                        <button onclick="editMateria(${materia.idMateria})">Editar</button>
                        <button onclick="deleteMateria(${materia.idMateria})">Eliminar</button>
                    </td>
                `;
            });
        });
}

// Función para guardar una nueva materia
function guardarMateria() {
    const formData = new FormData(document.getElementById('materiaForm'));
    const division = formData.get('division');

    if (division === "Todas las Divisiones") {
        const divisiones = ["1ro", "2do", "3ro"];
        divisiones.forEach((div) => {
            const newFormData = new FormData(document.getElementById('materiaForm'));
            newFormData.set('division', div);

            fetch('../php/abm_materias.php?action=guardarMateria', {
                method: 'POST',
                body: newFormData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showMessage('success', data.success);
                    loadMaterias(); // Recargar la tabla con los nuevos datos
                } else {
                    showMessage('error', data.error);
                }
            });
        });
    } else {
        fetch('../php/abm_materias.php?action=guardarMateria', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showMessage('success', data.success);
                loadMaterias(); // Recargar la tabla con los nuevos datos
            } else {
                showMessage('error', data.error);
            }
        });
    }

    resetFormulario();
}

// Función para mostrar mensajes de éxito o error
function showMessage(type, message) {
    const messageDiv = document.getElementById('success');
    messageDiv.className = type; // Define el estilo del mensaje (success o error)
    messageDiv.textContent = message;

    setTimeout(() => {
        messageDiv.textContent = '';  // Limpiar el mensaje después de un tiempo
        messageDiv.className = '';
    }, 5000);
}

// Función para restablecer los campos del formulario a su estado original
function resetFormulario() {
    document.getElementById('materiaForm').reset();
}

// Función para eliminar una materia
function deleteMateria(idMateria) {
    if (confirm('¿Estás seguro de que deseas eliminar esta materia?')) {
        fetch(`../php/abm_materias.php?action=eliminarMateria&idMateria=${idMateria}`, {
            method: 'GET'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showMessage('success', data.success);
                loadMaterias(); // Recargar la tabla con los nuevos datos
            } else {
                showMessage('error', data.error);
            }
        });
    }
}

// Función para editar una materia
function editMateria(idMateria) {
    fetch(`../php/abm_materias.php?action=getMateriaById&idMateria=${idMateria}`)
        .then(response => response.json())
        .then(data => {
            const materia = data[0];
            document.getElementById('idCarrera').value = materia.idCarrera;
            document.getElementById('nombre').value = materia.nombre;
            document.getElementById('año').value = materia.año;
            document.getElementById('division').value = materia.division;
            document.getElementById('modalidad').value = materia.modalidad;
            document.getElementById('correlativa').value = materia.correlativa;

            // Cambiar el nombre del botón a "Actualizar"
            document.getElementById('guardarBtn').textContent = "Actualizar";
            document.getElementById('materiaForm').addEventListener('submit', function(event) {
                event.preventDefault();
                actualizarMateria(idMateria);
            });
        });
}

// Función para actualizar la materia
function actualizarMateria(idMateria) {
    const formData = new FormData(document.getElementById('materiaForm'));

    fetch('../php/abm_materias.php?action=actualizarMateria&idMateria=' + idMateria, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage('success', data.success);
            loadMaterias(); // Recargar la tabla con los nuevos datos
        } else {
            showMessage('error', data.error);
        }
    });

    resetFormulario();
    document.getElementById('guardarBtn').textContent = "Guardar"; // Resetear el texto del botón
}
