<?php
// Datos de conexión
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "sistemaeducativo";

// Establecer la conexión a la base de datos
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar la conexión
if ($conn->connect_error) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Conexión fallida: ' . $conn->connect_error]);
    exit;
}

// Función para obtener las carreras
function getCarreras($conn) {
    $query = "SELECT idCarrera, nombre FROM carrera";
    $result = $conn->query($query);
    
    $carreras = [];
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $carreras[] = $row;
        }
    }
    return $carreras;
}

// Función para obtener las materias de una carrera
function getMaterias($conn, $idCarrera) {
    $query = "SELECT idMateria, nombre FROM materias WHERE idCarrera = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $idCarrera);
    $stmt->execute();
    $result = $stmt->get_result();

    $materias = [];
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $materias[] = $row;
        }
    }
    return $materias;
}

// Función para obtener todos los horarios asignados
function getHorarios($conn) {
    $query = "SELECT hm.idHorario, m.nombre AS materia, c.nombre AS carrera, hm.diaSemana, hm.horaInicio, hm.horaFin, cu.año, cu.division 
              FROM horarios_materias hm
              JOIN materias m ON hm.idMateria = m.idMateria
              JOIN carrera c ON hm.idCarrera = c.idCarrera
              JOIN curso cu ON hm.idCurso = cu.idCurso";
    $result = $conn->query($query);
    
    $horarios = [];
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $horarios[] = $row;
        }
    }
    return $horarios;
}

// Función para obtener un horario específico
function getHorarioById($conn, $idHorario) {
    $query = "SELECT hm.idHorario, hm.idMateria, hm.diaSemana, hm.horaInicio, hm.horaFin, hm.idCarrera, cu.año, cu.division
              FROM horarios_materias hm
              JOIN curso cu ON hm.idCurso = cu.idCurso
              WHERE hm.idHorario = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $idHorario);
    $stmt->execute();
    $result = $stmt->get_result();

    return $result->fetch_assoc();
}

// Manejo de solicitudes GET
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Content-Type: application/json');

    if (isset($_GET['action']) && $_GET['action'] === 'getHorarios') {
        // Obtener los horarios
        $horarios = getHorarios($conn);
        echo json_encode($horarios);
    } elseif (isset($_GET['idCarrera'])) {
        $idCarrera = $_GET['idCarrera'];
        $materias = getMaterias($conn, $idCarrera);
        echo json_encode($materias);
    } elseif (isset($_GET['idHorario'])) {
        // Obtener un horario específico para editar
        $idHorario = $_GET['idHorario'];
        $horario = getHorarioById($conn, $idHorario);
        echo json_encode($horario);
    } else {
        // Obtener las carreras
        $carreras = getCarreras($conn);
        echo json_encode($carreras);
    }
}

// Manejo de solicitudes POST para guardar el horario
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $idMateria = $_POST['idMateria'];
    $diaSemana = $_POST['diaSemana'];
    $horaInicio = $_POST['horaInicio'];
    $horaFin = $_POST['horaFin'];
    $idCarrera = $_POST['idCarrera'];
    $año = $_POST['año'];
    $division = $_POST['division'];

    // Obtener el idCurso correspondiente al año y división seleccionados
    $query = "SELECT idCurso FROM curso WHERE año = ? AND division = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ss", $año, $division);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $idCurso = $row['idCurso'];

    // Insertar el horario en la tabla horarios_materias
    $query = "INSERT INTO horarios_materias (idMateria, diaSemana, horaInicio, horaFin, idCarrera, idCurso) 
              VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("isssii", $idMateria, $diaSemana, $horaInicio, $horaFin, $idCarrera, $idCurso);
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al guardar el horario']);
    }
}

// Manejo de solicitudes PUT para actualizar el horario
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents("php://input"));
    $idHorario = $data->idHorario;
    $idMateria = $data->idMateria;
    $diaSemana = $data->diaSemana;
    $horaInicio = $data->horaInicio;
    $horaFin = $data->horaFin;
    $idCarrera = $data->idCarrera;
    $año = $data->año;
    $division = $data->division;

    // Obtener el idCurso correspondiente al año y división seleccionados
    $query = "SELECT idCurso FROM curso WHERE año = ? AND division = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ss", $año, $division);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $idCurso = $row['idCurso'];

    // Actualizar el horario en la tabla horarios_materias
    $query = "UPDATE horarios_materias 
              SET idMateria = ?, diaSemana = ?, horaInicio = ?, horaFin = ?, idCarrera = ?, idCurso = ? 
              WHERE idHorario = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("isssiii", $idMateria, $diaSemana, $horaInicio, $horaFin, $idCarrera, $idCurso, $idHorario);
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al actualizar el horario']);
    }
}

// Manejo de solicitudes DELETE para eliminar el horario
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"));
    $idHorario = $data->idHorario;

    $query = "DELETE FROM horarios_materias WHERE idHorario = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $idHorario);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al eliminar el horario']);
    }
}

$conn->close();
?>
