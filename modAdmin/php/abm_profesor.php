<?php

include 'conexion.php';

// Manejar errores de conexión
if ($conn->connect_error) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Conexión fallida: ' . $conn->connect_error]);
    exit;
}

// Si es una solicitud GET (cargar los profesores)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['idUsuario'])) {
        // Si es una solicitud GET para obtener los datos de un profesor (editar)
        $idUsuario = $_GET['idUsuario'];

        // Consultar los datos del profesor (idRol = 2)
        $query = "SELECT * FROM usuarios WHERE idUsuario = '$idUsuario' AND idRol = 2"; // idRol = 2 para profesor
        $result = $conn->query($query);

        if ($result->num_rows > 0) {
            $profesor = $result->fetch_assoc(); // Cambiado de $alumno a $profesor
            
            // Obtener los datos del login (correo y contraseña)
            $queryLogin = "SELECT * FROM login WHERE idUsuario = '$idUsuario'";
            $resultLogin = $conn->query($queryLogin);
            $loginData = $resultLogin->fetch_assoc();

            // Renombrar la clave 'contraseña' (con ñ) a 'contrasena' (sin ñ)
            // para que coincida con lo que el JavaScript espera.
            if (isset($loginData['contraseña'])) {
                $loginData['contrasena'] = $loginData['contraseña'];
                // Opcional: Si quieres eliminar la clave original con 'ñ'
                // unset($loginData['contraseña']); 
            }

            // Responder con los datos del profesor y login
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'profesor' => array_merge($profesor, $loginData) // Cambiado de 'alumno' a 'profesor'
            ]);
        } else {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Profesor no encontrado.']);
        }
    } else {
        // Consultar los profesores con idRol = 2 (profesor) y el filtro de búsqueda
        $searchTerm = isset($_GET['search']) ? $_GET['search'] : ''; // Obtener el término de búsqueda
        $searchQuery = "";

        // Si hay un término de búsqueda, agregar a la consulta SQL
        if ($searchTerm !== '') {
            $searchTerm = $conn->real_escape_string($searchTerm);
            $searchQuery = " AND (nombre LIKE '%$searchTerm%' OR apellido LIKE '%$searchTerm%')";
        }

        // Consultar los profesores con idRol = 2 (profesor) y el filtro de búsqueda
        $query = "SELECT * FROM usuarios WHERE idRol = 2" . $searchQuery; // idRol = 2 para profesor
        $result = $conn->query($query);

        if ($result->num_rows > 0) {
            $profesores = []; // Cambiado de $alumnos a $profesores
            while ($row = $result->fetch_assoc()) {
                $profesores[] = $row;
            }
            header('Content-Type: application/json');
            echo json_encode(['success' => true, 'profesores' => $profesores]); // Cambiado de 'alumnos' a 'profesores'
        } else {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'No se encontraron profesores.']);
        }
    }
}

// Si es una solicitud POST (guardar o editar profesor)
else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Eliminar un profesor
    if (isset($_POST['eliminar_id'])) {
        $eliminar_id = $_POST['eliminar_id'];

        // Eliminar en la tabla `usuarios`
        $query = "DELETE FROM usuarios WHERE idUsuario = '$eliminar_id'";
        $conn->query($query);

        // Eliminar en la tabla `login`
        $queryLogin = "DELETE FROM login WHERE idUsuario = '$eliminar_id'";
        $conn->query($queryLogin);

        // Verificar si hubo un error en la eliminación
        if ($conn->error) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Error al eliminar los datos: ' . $conn->error]);
        } else {
            // Mensaje de éxito en formato JSON
            header('Content-Type: application/json');
            echo json_encode(['success' => true, 'message' => 'Profesor eliminado correctamente.']);
        }
    }

    // Guardar o actualizar profesor
    else {
        // Obtener los datos del formulario
        $idUsuario = $_POST['idUsuario'];
        $apellido = $_POST['apellido'];
        $nombre = $_POST['nombre'];
        $telefono = $_POST['telefono'];
        $telefono2 = $_POST['telefono2'];
        $correo = $_POST['correo'];
        $contrasena = $_POST['contrasena'];
        $calle = $_POST['calle'];
        $nroAltura = $_POST['nroAltura'];
        $piso = $_POST['piso'];
        $codigoPostal = $_POST['codigoPostal'];
        $dpto = $_POST['dpto'];
        $localidad = $_POST['localidad'];
        $provincia = $_POST['provincia'];

        // Si estamos editando un profesor (el 'editar_id' está presente y no está vacío)
        if (isset($_POST['editar_id']) && $_POST['editar_id'] !== '') { 
            $editar_id = $_POST['editar_id']; // ID original del profesor que se está editando

            // Solo validar si el NUEVO DNI (idUsuario) es DIFERENTE al DNI ORIGINAL (editar_id) del profesor.
            if ($idUsuario !== $editar_id) {
                // Validar si ya existe un usuario con el nuevo DNI (si es diferente al original)
                $checkQuery = "SELECT idUsuario FROM usuarios WHERE idUsuario = '$idUsuario' AND idRol = 2"; // idRol = 2
                $checkResult = $conn->query($checkQuery);

                if ($checkResult->num_rows > 0) {
                    header('Content-Type: application/json');
                    echo json_encode(['success' => false, 'message' => 'El DNI ya está registrado por otro profesor.']);
                    exit;
                }
            }

            // Actualizar datos en la tabla `usuarios` (usando el ID original para la condición WHERE)
            $query = "UPDATE usuarios SET idUsuario='$idUsuario', apellido='$apellido', nombre='$nombre', telefono='$telefono', telefono2='$telefono2', correo='$correo', 
                      calle='$calle', nroAltura='$nroAltura', piso='$piso', codigoPostal='$codigoPostal', dpto='$dpto', localidad='$localidad', provincia='$provincia' 
                      WHERE idUsuario='$editar_id' AND idRol = 2"; // idRol = 2
            if (!$conn->query($query)) {
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'message' => 'Error al actualizar los datos de usuario: ' . $conn->error]);
                exit;
            }

            // Actualizar datos en la tabla `login` (usando el ID original para la condición WHERE)
            $queryLogin = "UPDATE login SET idUsuario='$idUsuario', correo='$correo', contraseña='$contrasena' WHERE idUsuario='$editar_id'";
            if (!$conn->query($queryLogin)) {
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'message' => 'Error al actualizar los datos de login: ' . $conn->error]);
                exit;
            }

        } else {
            // Para la inserción de un nuevo profesor, SIEMPRE se debe validar si ya existe un usuario con ese ID
            $checkQuery = "SELECT idUsuario FROM usuarios WHERE idUsuario = '$idUsuario' AND idRol = 2"; // idRol = 2
            $checkResult = $conn->query($checkQuery);

            if ($checkResult->num_rows > 0) {
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'message' => 'El DNI ya está registrado.']);
                exit;
            }

            // Insertar en la tabla `usuarios`
            $query = "INSERT INTO usuarios (idUsuario, apellido, nombre, telefono, telefono2, correo, calle, nroAltura, piso, codigoPostal, dpto, localidad, provincia, idRol)
                      VALUES ('$idUsuario', '$apellido', '$nombre', '$telefono', '$telefono2', '$correo', '$calle', '$nroAltura', '$piso', '$codigoPostal', '$dpto', '$localidad', '$provincia', 2)"; // idRol = 2 para profesor
            if (!$conn->query($query)) {
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'message' => 'Error al insertar en usuarios: ' . $conn->error]);
                exit;
            }

            // Insertar en la tabla `login`
            $queryLogin = "INSERT INTO login (idUsuario, correo, contraseña) 
                            VALUES ('$idUsuario', '$correo', '$contrasena')";
            if (!$conn->query($queryLogin)) {
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'message' => 'Error al insertar en login: ' . $conn->error]);
                exit;
            }
        }

        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'message' => 'Profesor guardado o actualizado correctamente']);
    }
}

$conn->close();
?>