document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formAsignacion');
    const mensaje = document.getElementById('mensaje');
    const tabla = document.querySelector('#tablaAsignaciones tbody');

    cargarSelect('carreras', 'idCarrera');
    cargarSelect('materias', 'idMateria');
    cargarSelect('profesores', 'idProfesor');
    cargarAsignaciones();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);

        fetch('../php/asignaciones_profesores.php', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            mensaje.textContent = data.mensaje;
            mensaje.className = data.success ? 'success' : 'error';
            if (data.success) {
                form.reset();  // Reseteamos el formulario
                limpiarSelects();  // Limpiamos los selects
                cargarAsignaciones();
            }
        });
    });

    function cargarAsignaciones() {
        fetch('../php/asignaciones_profesores.php?accion=listar')
            .then(res => res.json())
            .then(data => {
                tabla.innerHTML = '';
                data.forEach(row => {
                    tabla.innerHTML += `
                        <tr>
                            <td>${row.idCurso}</td>
                            <td>${row.profesor}</td>
                            <td>${row.nombreCarrera}</td>
                            <td>${row.division}</td>
                            <td>${row.anio}</td>
                            <td>${row.nombreMateria}</td>
                            <td>
                                <button data-idprofesor="${row.idProfesor}" data-idcurso="${row.idCurso}" class="btnEliminar">Eliminar</button>
                            </td>
                        </tr>` ;
                });

                document.querySelectorAll('.btnEliminar').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const formData = new FormData();
                        formData.append('accion', 'eliminar');
                        formData.append('idProfesor', btn.dataset.idprofesor);
                        formData.append('idCurso', btn.dataset.idcurso);

                        fetch('../php/asignaciones_profesores.php', {
                            method: 'POST',
                            body: formData
                        })
                        .then(res => res.json())
                        .then(data => {
                            mensaje.textContent = data.mensaje;
                            mensaje.className = data.success ? 'success' : 'error';
                            if (data.success) cargarAsignaciones();
                        });
                    });
                });
            });
    }

    function cargarSelect(accion, selectId) {
        fetch(`../php/asignaciones_profesores.php?accion=${accion}`)
            .then(res => res.json())
            .then(data => {
                const select = document.getElementById(selectId);
                data.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.id;
                    option.textContent = item.nombre;
                    select.appendChild(option);
                });
            });
    }

    // Función para limpiar los selects
    function limpiarSelects() {
        const selects = document.querySelectorAll('select');
        selects.forEach(select => {
            select.selectedIndex = 0;  // Restablecemos el select al primer valor vacío
        });
    }
});
