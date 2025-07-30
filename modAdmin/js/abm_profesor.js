document.addEventListener('DOMContentLoaded', () => {
    cargarCarreras();
    
    const carreraSelect = document.getElementById('idCarrera');
    // Escuchar cuando el usuario selecciona una carrera
    carreraSelect.addEventListener('change', function() {
        const idCarrera = this.value;
        if (idCarrera) {
            cargarMaterias(idCarrera);  // Cargar las materias para la carrera seleccionada
        } else {
            // Limpiar el select de materias si no hay carrera seleccionada
            const materiaSelect = document.getElementById('idMateria');
            materiaSelect.innerHTML = '<option value="">Seleccione una materia</option>';
        }
    });
});

// Cargar las carreras desde PHP
function cargarCarreras() {
    fetch('../php/abm_horarios.php', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        const selectCarrera = document.getElementById('idCarrera');
        selectCarrera.innerHTML = '<option value="">Seleccione una carrera</option>';
        data.carreras.forEach(carrera => {
            const option = document.createElement('option');
            option.value = carrera.idCarrera;
            option.textContent = carrera.nombre;
            selectCarrera.appendChild(option);
        });
    })
    .catch(error => console.error('Error al cargar las carreras:', error));
}

// Cargar las materias de acuerdo con la carrera seleccionada
function cargarMaterias(idCarrera) {
    fetch(`../php/abm_horarios.php?idCarrera=${idCarrera}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        const selectMateria = document.getElementById('idMateria');
        selectMateria.innerHTML = '<option value="">Seleccione una materia</option>';
        
        // Verificar si existen materias
        if (data.materias && data.materias.length > 0) {
            data.materias.forEach(materia => {
                const option = document.createElement('option');
                option.value = materia.idMateria;  // El valor es el idMateria
                option.textContent = materia.nombre;  // El texto es el nombre de la materia
                selectMateria.appendChild(option);
            });
        } else {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No hay materias disponibles';
            selectMateria.appendChild(option);
        }
    })
    .catch(error => console.error('Error al cargar las materias:', error));
}
