<?php

include 'conexion.php';

// Guardar o actualizar evento
if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['accion']) && $_POST['accion'] == 'guardar') {
    $titulo = $_POST['titulo'];
    $descripcion = isset($_POST['descripcion']) ? $_POST['descripcion'] : '';
    $fecha = $_POST['fecha'];
    $hora = $_POST['hora'];
    $evento_id = isset($_POST['evento_id']) ? $_POST['evento_id'] : null;

    if ($evento_id) {
        // Si existe evento_id, actualizar el evento
        $sql = "UPDATE calendario_academico SET titulo = ?, descripcion = ?, fecha = ?, hora = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        
        if ($stmt) {
            $stmt->bind_param("ssssi", $titulo, $descripcion, $fecha, $hora, $evento_id);
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Evento actualizado correctamente']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Error al actualizar el evento: ' . $stmt->error]);
            }
            $stmt->close();
        } else {
            echo json_encode(['success' => false, 'message' => 'Error en la preparación de la consulta: ' . $conn->error]);
        }
    } else {
        // Si no existe evento_id, insertar nuevo evento
        $sql = "INSERT INTO calendario_academico (titulo, descripcion, fecha, hora) VALUES (?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        
        if ($stmt) {
            $stmt->bind_param("ssss", $titulo, $descripcion, $fecha, $hora);
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Evento guardado correctamente']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Error al guardar el evento: ' . $stmt->error]);
            }
            $stmt->close();
        } else {
            echo json_encode(['success' => false, 'message' => 'Error en la preparación de la consulta: ' . $conn->error]);
        }
    }
    exit;
}

// Eliminar evento
if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['accion']) && $_POST['accion'] == 'eliminar') {
    $evento_id = $_POST['evento_id'];
    $sql = "DELETE FROM calendario_academico WHERE id = ?";
    $stmt = $conn->prepare($sql);
    
    if ($stmt) {
        $stmt->bind_param("i", $evento_id);
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Evento eliminado correctamente']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al eliminar el evento: ' . $stmt->error]);
        }
        $stmt->close();
    } else {
        echo json_encode(['success' => false, 'message' => 'Error en la preparación de la consulta: ' . $conn->error]);
    }
    exit;
}

// Obtener todos los eventos
$sql = "SELECT * FROM calendario_academico";
$stmt = $conn->prepare($sql);
$stmt->execute();
$result = $stmt->get_result();

$eventos = [];
while ($row = $result->fetch_assoc()) {
    $eventos[$row['fecha']][] = $row;
}

$stmt->close();
$conn->close();

// Retornar los eventos en formato JSON
echo json_encode($eventos);
?>