<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "sistemaeducativo";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
}

if (isset($_GET['action'])) {
    $action = $_GET['action'];

    if ($action == 'getCarreras') {
        $sql = "SELECT * FROM carrera";
        $result = $conn->query($sql);
        $carreras = [];
        while ($row = $result->fetch_assoc()) {
            $carreras[] = $row;
        }
        echo json_encode($carreras);
    }

    if ($action == 'getCorrelativas') {
        $sql = "SELECT * FROM materias";
        $result = $conn->query($sql);
        $materias = [];
        while ($row = $result->fetch_assoc()) {
            $materias[] = $row;
        }
        echo json_encode($materias);
    }

    if ($action == 'getMaterias') {
        $sql = "SELECT m.*, c.nombre AS carrera_nombre, cm.nombre AS correlativa_nombre 
                FROM materias m 
                JOIN carrera c ON m.idCarrera = c.idCarrera
                LEFT JOIN materias cm ON m.correlativa = cm.idMateria";
        $result = $conn->query($sql);
        $materias = [];
        while ($row = $result->fetch_assoc()) {
            $materias[] = $row;
        }
        echo json_encode($materias);
    }

    if ($action == 'guardarMateria') {
        $nombre = $_POST['nombre'];
        $año = $_POST['año'];
        $correlativa = $_POST['correlativa'];
        $modalidad = $_POST['modalidad'];
        $division = $_POST['division'];
        $idCarrera = $_POST['idCarrera'];

        $sql = "INSERT INTO materias (nombre, año, correlativa, modalidad, division, idCarrera) 
                VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sssssi", $nombre, $año, $correlativa, $modalidad, $division, $idCarrera);

        if ($stmt->execute()) {
            echo json_encode(["success" => "Materia guardada correctamente."]);
        } else {
            echo json_encode(["error" => "Error al guardar la materia."]);
        }
    }

    if ($action == 'eliminarMateria') {
        $idMateria = $_GET['idMateria'];
        $sql = "DELETE FROM materias WHERE idMateria = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $idMateria);

        if ($stmt->execute()) {
            echo json_encode(["success" => "Materia eliminada correctamente."]);
        } else {
            echo json_encode(["error" => "Error al eliminar la materia."]);
        }
    }

    if ($action == 'getMateriaById') {
        $idMateria = $_GET['idMateria'];
        $sql = "SELECT * FROM materias WHERE idMateria = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $idMateria);
        $stmt->execute();
        $result = $stmt->get_result();
        $materia = $result->fetch_assoc();
        echo json_encode([$materia]);
    }

    if ($action == 'actualizarMateria') {
        $idMateria = $_GET['idMateria'];
        $nombre = $_POST['nombre'];
        $año = $_POST['año'];
        $correlativa = $_POST['correlativa'];
        $modalidad = $_POST['modalidad'];
        $division = $_POST['division'];
        $idCarrera = $_POST['idCarrera'];

        $sql = "UPDATE materias SET nombre = ?, año = ?, correlativa = ?, modalidad = ?, division = ?, idCarrera = ? WHERE idMateria = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssssssi", $nombre, $año, $correlativa, $modalidad, $division, $idCarrera, $idMateria);

        if ($stmt->execute()) {
            echo json_encode(["success" => "Materia actualizada correctamente."]);
        } else {
            echo json_encode(["error" => "Error al actualizar la materia."]);
        }
    }
}
?>
