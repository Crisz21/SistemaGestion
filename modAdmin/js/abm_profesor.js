$(document).ready(function() {
    // Cargar la lista de profesores cuando la página se carga
    cargarProfesores();

    // Al enviar el formulario de profesor
    $("#profesorForm").submit(function(event) {
        event.preventDefault(); // Prevenir el envío por defecto del formulario

        var formData = $(this).serialize(); // Serializa todos los datos del formulario

        // Enviar datos al servidor mediante AJAX
        $.ajax({
            url: "../php/abm_profesor.php", // PHP que procesará los datos para profesores
            type: "POST", // Método POST
            data: formData, // Enviar los datos serializados
            dataType: "json", // Esperamos un JSON como respuesta
            success: function(response) {
                if (response.success) {
                    $("#responseMessage").html('<p style="color: green;">' + response.message + '</p>');
                    cargarProfesores(); // Cargar nuevamente la lista de profesores
                    $("#profesorForm")[0].reset(); // Limpiar el formulario
                    $("#idUsuarioInput").prop("readonly", false); // Habilitar edición del ID al crear
                    $("#idUsuarioInput").val(''); // Limpiar el ID para nuevas altas
                    $("#guardarBtn").text("Guardar Profesor"); // Resetear el texto del botón
                    $("#editar_id").val(''); // Limpiar el campo oculto 'editar_id' al guardar o resetear.
                } else {
                    $("#responseMessage").html('<p style="color: red;">' + response.message + '</p>');
                }
            },
            error: function() {
                $("#responseMessage").html('<p style="color: red;">Hubo un error al procesar los datos.</p>');
            }
        });
    });

    // Función para cargar los profesores
    function cargarProfesores(filtro = '') {
        $.ajax({
            url: "../php/abm_profesor.php", // PHP para obtener los profesores
            type: "GET", // Método GET
            data: { search: filtro }, // Enviar el filtro si existe
            dataType: "json", // Esperamos una respuesta JSON
            success: function(response) {
                if (response.success) {
                    var profesores = response.profesores; // Cambiado de 'alumnos' a 'profesores'
                    var tableBody = $("#profesorTable tbody"); // Selector de tabla cambiado
                    tableBody.empty(); // Limpiar la tabla antes de agregar los nuevos datos

                    // Recorrer los profesores y agregar filas a la tabla
                    profesores.forEach(function(profesor) {
                        var row = `<tr>
                                <td>${profesor.idUsuario}</td>
                                <td>${profesor.apellido}</td>
                                <td>${profesor.nombre}</td>
                                <td>${profesor.telefono}</td>
                                <td>${profesor.correo}</td>
                                <td>
                                    <button class="editBtn" data-id="${profesor.idUsuario}">Editar</button>
                                    <button class="deleteBtn" data-id="${profesor.idUsuario}">Eliminar</button>
                                </td>
                            </tr>`;
                        tableBody.append(row);
                    });

                    // Añadir eventos a los botones de Eliminar
                    $(".deleteBtn").off('click').click(function() {
                        var profesorId = $(this).data('id');
                        eliminarProfesor(profesorId);
                    });

                    // Añadir eventos a los botones de Editar
                    $(".editBtn").off('click').click(function() {
                        var profesorId = $(this).data('id');
                        cargarProfesorParaEdicion(profesorId); // Llamar a la función de carga de datos para edición
                    });
                } else {
                    alert(response.message);
                }
            },
            error: function() {
                alert("Hubo un error al cargar los profesores.");
            }
        });
    }

    // Función para cargar los datos del profesor en el formulario para edición
    function cargarProfesorParaEdicion(id) {
        $.ajax({
            url: "../php/abm_profesor.php", // PHP que obtiene los datos del profesor para editar
            type: "GET", // Método GET
            data: { idUsuario: id }, // Enviar el ID del profesor
            dataType: "json", // Esperamos una respuesta JSON
            success: function(response) {
                if (response.success) {
                    var profesor = response.profesor; // Cambiado de 'alumno' a 'profesor'

                    // Llenar los campos del formulario con los datos del profesor
                    $("#idUsuarioInput").val(profesor.idUsuario);
                    $("#apellido").val(profesor.apellido);
                    $("#nombre").val(profesor.nombre);
                    $("#telefono").val(profesor.telefono);
                    $("#telefono2").val(profesor.telefono2);
                    $("#correo").val(profesor.correo);
                    $("#contrasena").val(profesor.contrasena); // 'contrasena' ya corregido en PHP para verla
                    $("#calle").val(profesor.calle);
                    $("#nroAltura").val(profesor.nroAltura);
                    $("#piso").val(profesor.piso);
                    $("#codigoPostal").val(profesor.codigoPostal);
                    $("#dpto").val(profesor.dpto);
                    $("#localidad").val(profesor.localidad);
                    $("#provincia").val(profesor.provincia);

                    $("#editar_id").val(profesor.idUsuario); // Llenar el campo oculto con el ID original para la edición

                    $("#idUsuarioInput").prop("readonly", false); // DNI editable

                    // Para que el formulario sea de edición, cambiamos el texto del botón
                    $("#guardarBtn").text("Guardar Cambios"); // Cambiar el texto del botón a "Guardar Cambios"
                } else {
                    alert(response.message);
                }
            },
            error: function() {
                alert("Hubo un error al cargar los datos del profesor para editar.");
            }
        });
    }

    // Función para eliminar un profesor
    function eliminarProfesor(id) {
        if (confirm("¿Estás seguro de que quieres eliminar este profesor?")) {
            $.ajax({
                url: "../php/abm_profesor.php", // PHP que procesará la eliminación
                type: "POST", // Método POST
                data: { eliminar_id: id }, // Enviar el ID del profesor a eliminar
                dataType: "json", // Esperamos una respuesta JSON
                success: function(response) {
                    if (response.success) {
                        alert(response.message);
                        cargarProfesores(); // Recargar la lista de profesores
                    } else {
                        alert(response.message);
                    }
                },
                error: function() {
                    alert("Hubo un error al eliminar el profesor.");
                }
            });
        }
    }

    // Función de búsqueda
    $("#searchForm").submit(function(event) {
        event.preventDefault(); // Prevenir el envío por defecto del formulario
        var searchTerm = $("#search").val().trim(); // Obtener el término de búsqueda
        cargarProfesores(searchTerm); // Recargar la lista con el filtro
    });
});