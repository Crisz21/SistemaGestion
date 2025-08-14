<?php

include 'conexion.php';


// Agregar carrera (POST request)
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['accion']) && $_POST['accion'] == 'agregar') {
    $nombreCarrera = $_POST['nombreCarrera'];
    $resolucion = $_POST['resolucion'];

    $sql = "SELECT * FROM carrera WHERE nombre = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $nombreCarrera);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        echo json_encode(['tipo' => 'error', 'mensaje' => 'La carrera ya existe.']);
    } else {
        $sql = "INSERT INTO carrera (nombre, resolucion) VALUES (?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ss", $nombreCarrera, $resolucion);
        if ($stmt->execute()) {
            echo json_encode(['tipo' => 'success', 'mensaje' => 'Carrera agregada exitosamente.']);
        } else {
            echo json_encode(['tipo' => 'error', 'mensaje' => 'Error al agregar la carrera.']);
        }
    }
}

// Acción para eliminar carrera
if (isset($_GET['accion']) && $_GET['accion'] == 'eliminar' && isset($_GET['idCarrera'])) {
    $idCarrera = $_GET['idCarrera'];
    $sql = "DELETE FROM carrera WHERE idCarrera = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $idCarrera);
    if ($stmt->execute()) {
        echo json_encode(['tipo' => 'success', 'mensaje' => 'Carrera eliminada exitosamente.']);
    } else {
        echo json_encode(['tipo' => 'error', 'mensaje' => 'Error al eliminar la carrera.']);
    }
}

// Acción para listar carreras
if (isset($_GET['accion']) && $_GET['accion'] == 'listar') {
    $sql = "SELECT * FROM carrera";
    $result = $conn->query($sql);
    $carreras = [];
    while ($row = $result->fetch_assoc()) {
        $carreras[] = $row;
    }
    echo json_encode($carreras);
}

// Cerrar conexión
$conn->close();
?>
