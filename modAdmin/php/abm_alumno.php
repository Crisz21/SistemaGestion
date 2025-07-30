<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "sistemaeducativo";

// Establecer la conexión a la base de datos
$conn = new mysqli($servername, $username, $password, $dbname);

// Manejar errores de conexión
if ($conn->connect_error) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Conexión fallida: ' . $conn->connect_error]);
    exit;
}

// Si es una solicitud GET (cargar los alumnos)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['idUsuario'])) {
        // Si es una solicitud GET para obtener los datos de un alumno (editar)
        $idUsuario = $_GET['idUsuario'];

        // Consultar los datos del alumno
        $query = "SELECT * FROM usuarios WHERE idUsuario = '$idUsuario' AND idRol = 1"; // Sólo buscar alumnos
        $result = $conn->query($query);

        if ($result->num_rows > 0) {
            $alumno = $result->fetch_assoc();
            
            // Obtener los datos del login (correo y contraseña)
            $queryLogin = "SELECT * FROM login WHERE idUsuario = '$idUsuario'";
            $resultLogin = $conn->query($queryLogin);
            $loginData = $resultLogin->fetch_assoc();

            // Responder con los datos del alumno y login
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'alumno' => array_merge($alumno, $loginData)
            ]);
        } else {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Alumno no encontrado.']);
        }
    } else {
        // Consultar los alumnos con idRol = 1 (alumno) y el filtro de búsqueda
        $searchTerm = isset($_GET['search']) ? $_GET['search'] : ''; // Obtener el término de búsqueda
        $searchQuery = "";

        // Si hay un término de búsqueda, agregar a la consulta SQL
        if ($searchTerm !== '') {
            $searchTerm = $conn->real_escape_string($searchTerm);
            $searchQuery = " AND (nombre LIKE '%$searchTerm%' OR apellido LIKE '%$searchTerm%')";
        }

        // Consultar los alumnos con idRol = 1 (alumno) y el filtro de búsqueda
        $query = "SELECT * FROM usuarios WHERE idRol = 1" . $searchQuery;
        $result = $conn->query($query);

        if ($result->num_rows > 0) {
            $alumnos = [];
            while ($row = $result->fetch_assoc()) {
                $alumnos[] = $row;
            }
            header('Content-Type: application/json');
            echo json_encode(['success' => true, 'alumnos' => $alumnos]);
        } else {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'No se encontraron alumnos.']);
        }
    }
}

// Si es una solicitud POST (guardar o editar alumno)
else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Eliminar un alumno
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
            echo json_encode(['success' => true, 'message' => 'Alumno eliminado correctamente.']);
        }
    }

    // Guardar o actualizar alumno
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

        // Si estamos editando un alumno (el editar_id está presente)
        if (isset($_POST['editar_id']) && $_POST['editar_id'] !== '') {
            $editar_id = $_POST['editar_id'];

            // Verificar si el ID de usuario que estamos editando es el mismo que el nuevo idUsuario
            // Si es el mismo, no verificamos si el DNI ya existe
            if ($idUsuario !== $editar_id) {
                // Validar si ya existe un usuario con ese ID (solo si no estamos editando el mismo usuario)
                $checkQuery = "SELECT idUsuario FROM usuarios WHERE idUsuario = '$idUsuario' AND idRol = 1"; // Asegurarse de que sea un alumno
                $checkResult = $conn->query($checkQuery);

                // Si ya existe un usuario con ese DNI
                if ($checkResult->num_rows > 0) {
                    header('Content-Type: application/json');
                    echo json_encode(['success' => false, 'message' => 'El DNI ya está registrado.']);
                    exit;
                }
            }

            // Actualizar datos en la tabla `usuarios`
            $query = "UPDATE usuarios SET apellido='$apellido', nombre='$nombre', telefono='$telefono', telefono2='$telefono2', correo='$correo', 
                      calle='$calle', nroAltura='$nroAltura', piso='$piso', codigoPostal='$codigoPostal', dpto='$dpto', localidad='$localidad', provincia='$provincia' 
                      WHERE idUsuario='$editar_id' AND idRol = 1"; // Asegurarse de que el rol sea el correcto
            if (!$conn->query($query)) {
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'message' => 'Error al actualizar los datos de usuario: ' . $conn->error]);
                exit;
            }

            // Actualizar datos en la tabla `login`
            $queryLogin = "UPDATE login SET correo='$correo', contraseña='$contrasena' WHERE idUsuario='$editar_id'";
            if (!$conn->query($queryLogin)) {
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'message' => 'Error al actualizar los datos de login: ' . $conn->error]);
                exit;
            }

        } else {
            // Para la inserción de un nuevo alumno, se debe validar si ya existe un usuario con ese ID
            $checkQuery = "SELECT idUsuario FROM usuarios WHERE idUsuario = '$idUsuario' AND idRol = 1"; // Asegurarse de que sea un alumno
            $checkResult = $conn->query($checkQuery);

            // Si no estamos editando (no se pasa `editar_id`), validamos si el ID ya existe
            if ($checkResult->num_rows > 0) {
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'message' => 'El DNI ya está registrado.']);
                exit;
            }

            // Insertar en la tabla `usuarios`
            $query = "INSERT INTO usuarios (idUsuario, apellido, nombre, telefono, telefono2, correo, calle, nroAltura, piso, codigoPostal, dpto, localidad, provincia, idRol)
                      VALUES ('$idUsuario', '$apellido', '$nombre', '$telefono', '$telefono2', '$correo', '$calle', '$nroAltura', '$piso', '$codigoPostal', '$dpto', '$localidad', '$provincia', 1)"; // idRol = 1 para alumno
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
        echo json_encode(['success' => true, 'message' => 'Alumno guardado o actualizado correctamente']);
    }
}

$conn->close();
?>
