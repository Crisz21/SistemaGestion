<?php
// Conexión a la base de datos
$host = 'localhost';
$dbname = 'sistemaeducativo';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Conexión fallida: " . $e->getMessage());
}

// Guardar o actualizar evento
if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['accion']) && $_POST['accion'] == 'guardar') {
    $titulo = $_POST['titulo'];
    $descripcion = isset($_POST['descripcion']) ? $_POST['descripcion'] : ''; // Descripción puede estar vacía
    $fecha = $_POST['fecha'];
    $hora = $_POST['hora']; // Recogemos la hora
    $evento_id = isset($_POST['evento_id']) ? $_POST['evento_id'] : null;

    if ($evento_id) {
        // Si existe evento_id, actualizar el evento
        $sql = "UPDATE calendario_academico SET titulo = ?, descripcion = ?, fecha = ?, hora = ? WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$titulo, $descripcion, $fecha, $hora, $evento_id]);
        echo json_encode(['success' => true, 'message' => 'Evento actualizado correctamente']);
    } else {
        // Si no existe evento_id, insertar nuevo evento
        $sql = "INSERT INTO calendario_academico (titulo, descripcion, fecha, hora) VALUES (?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        if ($stmt->execute([$titulo, $descripcion, $fecha, $hora])) {
            echo json_encode(['success' => true, 'message' => 'Evento guardado correctamente']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al guardar el evento']);
        }
    }
    exit;
}

// Eliminar evento
if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['accion']) && $_POST['accion'] == 'eliminar') {
    $evento_id = $_POST['evento_id'];
    $sql = "DELETE FROM calendario_academico WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    if ($stmt->execute([$evento_id])) {
        echo json_encode(['success' => true, 'message' => 'Evento eliminado correctamente']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al eliminar el evento']);
    }
    exit;
}

// Obtener todos los eventos
$sql = "SELECT * FROM calendario_academico";
$stmt = $pdo->query($sql);
$eventos = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $eventos[$row['fecha']][] = $row;  // Agrupar eventos por fecha
}

$pdo = null;  // Cerrar la conexión

// Retornar los eventos en formato JSON
echo json_encode($eventos);
?>
