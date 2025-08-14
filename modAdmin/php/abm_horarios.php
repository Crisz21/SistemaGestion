<?php

include 'conexion.php';


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

// Función para verificar si un horario con la misma combinación ya existe
function horarioExiste($conn, $idMateria, $diaSemana, $horaInicio, $horaFin, $idCurso, $idHorarioExcluir = null) {
    $query = "SELECT COUNT(*) FROM horarios_materias 
              WHERE idMateria = ? AND diaSemana = ? AND horaInicio = ? AND horaFin = ? AND idCurso = ?";
    
    // Si estamos editando (idHorarioExcluir no es nulo), excluimos el propio horario que estamos intentando modificar
    if ($idHorarioExcluir !== null) {
        $query .= " AND idHorario != ?";
    }

    $stmt = $conn->prepare($query);
    
    if (!$stmt) {
        // Manejar el error de preparación de la consulta
        error_log("Error al preparar la consulta horarioExiste: " . $conn->error);
        return false; // O lanzar una excepción
    }

    if ($idHorarioExcluir !== null) {
        $stmt->bind_param("isssii", $idMateria, $diaSemana, $horaInicio, $horaFin, $idCurso, $idHorarioExcluir);
    } else {
        $stmt->bind_param("isssi", $idMateria, $diaSemana, $horaInicio, $horaFin, $idCurso);
    }

    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_row();
    $stmt->close(); // Cierra el statement después de usarlo
    return $row[0] > 0;
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

// Manejo de solicitudes POST para guardar el horario (CREAR)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json'); 

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
    // Verificar si la preparación fue exitosa
    if (!$stmt) {
        echo json_encode(['success' => false, 'message' => 'Error al preparar la consulta de curso: ' . $conn->error]);
        exit;
    }
    $stmt->bind_param("ss", $año, $division);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $idCurso = $row['idCurso'];
    $stmt->close(); // Cierra el statement

    // *** VALIDACIÓN DE DUPLICADOS ANTES DE INSERTAR ***
    if (horarioExiste($conn, $idMateria, $diaSemana, $horaInicio, $horaFin, $idCurso)) {
        echo json_encode(['success' => false, 'message' => 'Ya existe un horario para esta materia, día, hora y división.']);
        exit; // Detener la ejecución si hay duplicado
    }

    // Insertar el horario en la tabla horarios_materias
    $query = "INSERT INTO horarios_materias (idMateria, diaSemana, horaInicio, horaFin, idCarrera, idCurso) 
              VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($query);
    // Verificar si la preparación fue exitosa
    if (!$stmt) {
        echo json_encode(['success' => false, 'message' => 'Error al preparar la consulta de inserción: ' . $conn->error]);
        exit;
    }
    $stmt->bind_param("isssii", $idMateria, $diaSemana, $horaInicio, $horaFin, $idCarrera, $idCurso);
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al guardar el horario: ' . $stmt->error]);
    }
    $stmt->close(); // Cierra el statement
}

// Manejo de solicitudes PUT para actualizar el horario (EDITAR)
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    header('Content-Type: application/json'); 

    $data = json_decode(file_get_contents("php://input"));
    
    // Verificar si el JSON se decodificó correctamente
    if (json_last_error() !== JSON_ERROR_NONE) {
        echo json_encode(['success' => false, 'message' => 'Error al decodificar los datos JSON: ' . json_last_error_msg()]);
        exit;
    }

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
    // Verificar si la preparación fue exitosa
    if (!$stmt) {
        echo json_encode(['success' => false, 'message' => 'Error al preparar la consulta de curso para actualización: ' . $conn->error]);
        exit;
    }
    $stmt->bind_param("ss", $año, $division);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $idCurso = $row['idCurso'];
    $stmt->close(); // Cierra el statement

    
    // Aquí pasamos el idHorario a excluir, para que no se compare consigo mismo
    if (horarioExiste($conn, $idMateria, $diaSemana, $horaInicio, $horaFin, $idCurso, $idHorario)) {
        echo json_encode(['success' => false, 'message' => 'Ya existe un horario idéntico para esta materia, día, hora y división.']);
        exit; // Detener la ejecución si hay duplicado
    }

    // Actualizar el horario en la tabla horarios_materias
    $query = "UPDATE horarios_materias 
              SET idMateria = ?, diaSemana = ?, horaInicio = ?, horaFin = ?, idCarrera = ?, idCurso = ? 
              WHERE idHorario = ?";
    $stmt = $conn->prepare($query);
    // Verificar si la preparación fue exitosa
    if (!$stmt) {
        echo json_encode(['success' => false, 'message' => 'Error al preparar la consulta de actualización: ' . $conn->error]);
        exit;
    }
    $stmt->bind_param("isssiii", $idMateria, $diaSemana, $horaInicio, $horaFin, $idCarrera, $idCurso, $idHorario);
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al actualizar el horario: ' . $stmt->error]);
    }
    $stmt->close(); // Cierra el statement
}

// Manejo de solicitudes DELETE para eliminar el horario
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    header('Content-Type: application/json'); // Asegúrate de que la respuesta sea JSON

    $data = json_decode(file_get_contents("php://input"));
    
    // Verificar si el JSON se decodificó correctamente
    if (json_last_error() !== JSON_ERROR_NONE) {
        echo json_encode(['success' => false, 'message' => 'Error al decodificar los datos JSON para eliminar: ' . json_last_error_msg()]);
        exit;
    }

    $idHorario = $data->idHorario;

    $query = "DELETE FROM horarios_materias WHERE idHorario = ?";
    $stmt = $conn->prepare($query);
    // Verificar si la preparación fue exitosa
    if (!$stmt) {
        echo json_encode(['success' => false, 'message' => 'Error al preparar la consulta de eliminación: ' . $conn->error]);
        exit;
    }
    $stmt->bind_param("i", $idHorario);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al eliminar el horario: ' . $stmt->error]);
    }
    $stmt->close(); // Cierra el statement
}

$conn->close();
?>