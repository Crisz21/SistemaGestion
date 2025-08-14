$(document).ready(function() {
    // Cargar la lista de alumnos cuando la página se carga
    cargarAlumnos();

    // Al enviar el formulario de alumno
    $("#alumnoForm").submit(function(event) {
        event.preventDefault(); // Prevenir el envío por defecto del formulario

        var formData = $(this).serialize(); // Serializa todos los datos del formulario

        // Enviar datos al servidor mediante AJAX
        $.ajax({
            url: "../php/abm_alumno.php", // PHP que procesará los datos
            type: "POST", // Método POST
            data: formData, // Enviar los datos serializados
            dataType: "json", // Esperamos un JSON como respuesta
            success: function(response) {
                if (response.success) {
                    $("#responseMessage").html('<p style="color: green;">' + response.message + '</p>');
                    cargarAlumnos(); // Cargar nuevamente la lista de alumnos
                    $("#alumnoForm")[0].reset(); // Limpiar el formulario
                    $("#idUsuarioInput").prop("readonly", false); // Habilitar edición del ID al crear
                    $("#idUsuarioInput").val(''); // Limpiar el ID para nuevas altas
                    $("#guardarBtn").text("Guardar Alumno"); // Resetear el texto del botón
                    // CORRECCIÓN: Limpiar el campo oculto 'editar_id' al guardar un nuevo alumno o resetear.
                    $("#editar_id").val(''); 
                } else {
                    $("#responseMessage").html('<p style="color: red;">' + response.message + '</p>');
                }
            },
            error: function() {
                $("#responseMessage").html('<p style="color: red;">Hubo un error al procesar los datos.</p>');
            }
        });
    });

    // Función para cargar los alumnos
    function cargarAlumnos(filtro = '') {
        $.ajax({
            url: "../php/abm_alumno.php", // PHP para obtener los alumnos
            type: "GET", // Método GET
            data: { search: filtro }, // Enviar el filtro si existe
            dataType: "json", // Esperamos una respuesta JSON
            success: function(response) {
                if (response.success) {
                    var alumnos = response.alumnos;
                    var tableBody = $("#alumnoTable tbody");
                    tableBody.empty(); // Limpiar la tabla antes de agregar los nuevos datos

                    // Recorrer los alumnos y agregar filas a la tabla
                    alumnos.forEach(function(alumno) {
                        var row = `<tr>
                                <td>${alumno.idUsuario}</td>
                                <td>${alumno.apellido}</td>
                                <td>${alumno.nombre}</td>
                                <td>${alumno.telefono}</td>
                                <td>${alumno.correo}</td>
                                <td>
                                    <button class="editBtn" data-id="${alumno.idUsuario}">Editar</button>
                                    <button class="deleteBtn" data-id="${alumno.idUsuario}">Eliminar</button>
                                </td>
                            </tr>`;
                        tableBody.append(row);
                    });

                    // Añadir eventos a los botones de Eliminar
                    $(".deleteBtn").off('click').click(function() {
                        var alumnoId = $(this).data('id');
                        eliminarAlumno(alumnoId);
                    });

                    // Añadir eventos a los botones de Editar
                    $(".editBtn").off('click').click(function() {
                        var alumnoId = $(this).data('id');
                        cargarAlumnoParaEdicion(alumnoId); // Llamar a la función de carga de datos para edición
                    });
                } else {
                    alert(response.message);
                }
            },
            error: function() {
                alert("Hubo un error al cargar los alumnos.");
            }
        });
    }

    // Función para cargar los datos del alumno en el formulario para edición
    function cargarAlumnoParaEdicion(id) {
        $.ajax({
            url: "../php/abm_alumno.php", // PHP que obtiene los datos del alumno para editar
            type: "GET", // Método GET
            data: { idUsuario: id }, // Enviar el ID del alumno
            dataType: "json", // Esperamos una respuesta JSON
            success: function(response) {
                if (response.success) {
                    var alumno = response.alumno;

                    // Llenar los campos del formulario con los datos del alumno
                    $("#idUsuarioInput").val(alumno.idUsuario);
                    $("#apellido").val(alumno.apellido);
                    $("#nombre").val(alumno.nombre);
                    $("#telefono").val(alumno.telefono);
                    $("#telefono2").val(alumno.telefono2);
                    $("#correo").val(alumno.correo);
                    $("#contrasena").val(alumno.contrasena);
                    $("#calle").val(alumno.calle);
                    $("#nroAltura").val(alumno.nroAltura);
                    $("#piso").val(alumno.piso);
                    $("#codigoPostal").val(alumno.codigoPostal);
                    $("#dpto").val(alumno.dpto);
                    $("#localidad").val(alumno.localidad);
                    $("#provincia").val(alumno.provincia);

                    // CORRECCIÓN: Llenar el campo oculto 'editar_id' con el ID original para la edición
                    $("#editar_id").val(alumno.idUsuario);

                    $("#idUsuarioInput").prop("readonly", false); // DNI editable

                    // Para que el formulario sea de edición, cambiamos el texto del botón
                    $("#guardarBtn").text("Guardar Cambios"); // Cambiar el texto del botón a "Guardar Cambios"
                } else {
                    alert(response.message);
                }
            },
            error: function() {
                alert("Hubo un error al cargar los datos del alumno para editar.");
            }
        });
    }

    // Función para eliminar un alumno
    function eliminarAlumno(id) {
        if (confirm("¿Estás seguro de que quieres eliminar este alumno?")) {
            $.ajax({
                url: "../php/abm_alumno.php", // PHP que procesará la eliminación
                type: "POST", // Método POST
                data: { eliminar_id: id }, // Enviar el ID del alumno a eliminar
                dataType: "json", // Esperamos una respuesta JSON
                success: function(response) {
                    if (response.success) {
                        alert(response.message);
                        cargarAlumnos(); // Recargar la lista de alumnos
                    } else {
                        alert(response.message);
                    }
                },
                error: function() {
                    alert("Hubo un error al eliminar el alumno.");
                }
            });
        }
    }

    // Función de búsqueda
    $("#searchForm").submit(function(event) {
        event.preventDefault(); // Prevenir el envío por defecto del formulario
        var searchTerm = $("#search").val().trim(); // Obtener el término de búsqueda
        cargarAlumnos(searchTerm); // Recargar la lista con el filtro
    });
});