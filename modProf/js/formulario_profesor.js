document.addEventListener("DOMContentLoaded", () => {
    // Función para cargar los datos del profesor
    function cargarDatosProfesor() {
        // Crear una solicitud AJAX
        const xhr = new XMLHttpRequest();
        xhr.open("GET", "../php/formulario_profesor.php", true);

        // Enviar la solicitud
        xhr.onload = function () {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText); // Los datos se devuelven en formato JSON

                // Rellenar el formulario con los datos obtenidos
                document.getElementById("idUsuario").value = data.idUsuario;
                document.getElementById("correo").value = data.correo;
                document.getElementById("nombre").value = data.nombre;
                document.getElementById("apellido").value = data.apellido;
                document.getElementById("telefono").value = data.telefono;
                document.getElementById("direccion").value = data.direccion;
                document.getElementById("piso").value = data.piso;
                document.getElementById("dpto").value = data.dpto;
                document.getElementById("codigoPostal").value = data.codigoPostal;
                document.getElementById("localidad").value = data.localidad;
                document.getElementById("provincia").value = data.provincia;
                document.getElementById("carrera").value = data.carrera;
                document.getElementById("contrasena").value = data.contrasena;
            } else {
                console.error("Error al cargar los datos del profesor");
            }
        };

        xhr.send();
    }

    // Cargar los datos al cargar la página
    cargarDatosProfesor();
});
