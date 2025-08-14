<?php
header('Content-Type: application/json');
include 'conexion.php'; // Asegúrate de que esta ruta sea correcta

$accion = $_GET['accion'] ?? ($_POST['accion'] ?? '');

switch ($accion) {
    case 'crear_mensaje':
        $titulo = $_POST['titulo'] ?? '';
        $mensaje_texto = $_POST['mensaje_texto'] ?? '';
        $publico_destino = $_POST['publico_destino'] ?? '';
        $fecha_expiracion = $_POST['fecha_expiracion'] ?? null;
        $fecha_publicacion = date('Y-m-d H:i:s'); // Fecha y hora actual

        if (empty($titulo) || empty($mensaje_texto) || empty($publico_destino)) {
            echo json_encode(["success" => false, "mensaje" => "Todos los campos obligatorios deben ser completados."]);
            exit();
        }

        // Si la fecha de expiración está vacía, guardarla como NULL
        $fecha_expiracion_sql = ($fecha_expiracion) ? "'$fecha_expiracion'" : "NULL";

        $stmt = $conn->prepare("INSERT INTO cartelera (titulo, mensaje_texto, publico_destino, fecha_publicacion, fecha_expiracion) VALUES (?, ?, ?, ?, $fecha_expiracion_sql)");
        $stmt->bind_param("ssss", $titulo, $mensaje_texto, $publico_destino, $fecha_publicacion);

        if ($stmt->execute()) {
            echo json_encode(["success" => true, "mensaje" => "Mensaje creado exitosamente."]);
        } else {
            echo json_encode(["success" => false, "mensaje" => "Error al crear el mensaje: " . $stmt->error]);
        }
        $stmt->close();
        break;

    case 'listar_mensajes':
        // Listar todos los mensajes (para el preceptor), activos e inactivos por fecha
        $sql = "SELECT 
                    idMensaje, 
                    titulo, 
                    mensaje_texto, 
                    publico_destino, 
                    CASE publico_destino 
                        WHEN 'todos' THEN 'Todos (Alumnos y Profesores)' 
                        WHEN 'alumnos' THEN 'Solo Alumnos' 
                        WHEN 'profesores' THEN 'Solo Profesores' 
                        ELSE 'Desconocido' 
                    END AS publico_destino_texto,
                    fecha_publicacion, 
                    fecha_expiracion 
                FROM cartelera 
                ORDER BY fecha_publicacion DESC";
        $result = $conn->query($sql);
        $mensajes = [];
        while ($row = $result->fetch_assoc()) {
            $mensajes[] = $row;
        }
        echo json_encode($mensajes);
        break;

    case 'obtener_mensajes_activos': // Para los módulos de Profesor y Alumno
        $rol_usuario = $_GET['rol'] ?? ''; // 'alumno' o 'profesor'
        $mensajes_activos = [];

        $sql = "SELECT 
                    titulo, 
                    mensaje_texto, 
                    publico_destino, 
                    fecha_publicacion 
                FROM cartelera 
                WHERE (fecha_expiracion IS NULL OR fecha_expiracion >= CURDATE())"; // Que no haya expirado

        if ($rol_usuario === 'alumno') {
            $sql .= " AND (publico_destino = 'todos' OR publico_destino = 'alumnos')";
        } elseif ($rol_usuario === 'profesor') {
            $sql .= " AND (publico_destino = 'todos' OR publico_destino = 'profesores')";
        } else {
            // Si el rol no es especificado o es inválido, no se muestran mensajes específicos
            echo json_encode([]); 
            exit();
        }
        
        $sql .= " ORDER BY fecha_publicacion DESC";
        $result = $conn->query($sql);
        $mensajes_activos = [];
        while ($row = $result->fetch_assoc()) {
            $mensajes_activos[] = $row;
        }
        echo json_encode($mensajes_activos);
        break;

    case 'actualizar_mensaje':
        $idMensaje = $_POST['editar_id'] ?? '';
        $titulo = $_POST['titulo'] ?? '';
        $mensaje_texto = $_POST['mensaje_texto'] ?? '';
        $publico_destino = $_POST['publico_destino'] ?? '';
        $fecha_expiracion = $_POST['fecha_expiracion'] ?? null;

        if (empty($idMensaje) || empty($titulo) || empty($mensaje_texto) || empty($publico_destino)) {
            echo json_encode(["success" => false, "mensaje" => "Faltan datos para actualizar el mensaje."]);
            exit();
        }

        $fecha_expiracion_sql = ($fecha_expiracion) ? "'$fecha_expiracion'" : "NULL";

        $stmt = $conn->prepare("UPDATE cartelera SET titulo = ?, mensaje_texto = ?, publico_destino = ?, fecha_expiracion = $fecha_expiracion_sql WHERE idMensaje = ?");
        $stmt->bind_param("sssi", $titulo, $mensaje_texto, $publico_destino, $idMensaje);

        if ($stmt->execute()) {
            echo json_encode(["success" => true, "mensaje" => "Mensaje actualizado exitosamente."]);
        } else {
            echo json_encode(["success" => false, "mensaje" => "Error al actualizar el mensaje: " . $stmt->error]);
        }
        $stmt->close();
        break;

    case 'eliminar_mensaje':
        $idMensaje = $_POST['idMensaje'] ?? '';

        if (empty($idMensaje)) {
            echo json_encode(["success" => false, "mensaje" => "ID de mensaje no proporcionado."]);
            exit();
        }

        $stmt = $conn->prepare("DELETE FROM cartelera WHERE idMensaje = ?");
        $stmt->bind_param("i", $idMensaje);

        if ($stmt->execute()) {
            echo json_encode(["success" => true, "mensaje" => "Mensaje eliminado exitosamente."]);
        } else {
            echo json_encode(["success" => false, "mensaje" => "Error al eliminar el mensaje: " . $stmt->error]);
        }
        $stmt->close();
        break;

    default:
        echo json_encode(["success" => false, "mensaje" => "Acción no válida."]);
        break;
}

$conn->close();
?>