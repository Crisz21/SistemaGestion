<?php
header('Content-Type: application/json');

include 'conexion.php';


$accion = $_GET['accion'] ?? ($_POST['accion'] ?? 'asignar');

// Acción para obtener los profesores (con filtro por DNI)
if ($accion === 'profesores') {
    $dniFiltro = $_GET['dni'] ?? null; // Obtener DNI si viene en la URL

    if ($dniFiltro) {
        // Si se proporciona DNI, filtrar los profesores por idUsuario (DNI) usando LIKE para búsqueda parcial
        $dniFiltro = '%' . $dniFiltro . '%'; 
        
        $stmt = $conn->prepare("SELECT idUsuario AS id, CONCAT(apellido, ', ', nombre, ' (DNI: ', idUsuario, ')') AS nombre 
                                 FROM usuarios 
                                 WHERE idRol = 2 AND CAST(idUsuario AS CHAR) LIKE ?"); // idRol = 2 para profesores
        $stmt->bind_param("s", $dniFiltro);
        $stmt->execute();
        $res = $stmt->get_result();
        echo json_encode($res->fetch_all(MYSQLI_ASSOC));
        $stmt->close();
    } else {
        // Si no se proporciona DNI, devolver todos los profesores (comportamiento original)
        $res = $conn->query("SELECT idUsuario AS id, CONCAT(apellido, ', ', nombre, ' (DNI: ', idUsuario, ')') AS nombre FROM usuarios WHERE idRol = 2");
        echo json_encode($res->fetch_all(MYSQLI_ASSOC));
    }
    exit;
}

// Acción para obtener las materias
if ($accion === 'materias') {
    $idCarrera = $_GET['idCarrera'] ?? null;

    if ($idCarrera) {
        $stmt = $conn->prepare("SELECT idMateria AS id, nombre 
                                 FROM materias 
                                 WHERE idCarrera = ?");
        $stmt->bind_param("i", $idCarrera);
        $stmt->execute();
        $res = $stmt->get_result();
        echo json_encode($res->fetch_all(MYSQLI_ASSOC));
        $stmt->close();
    } else {
        $res = $conn->query("SELECT idMateria AS id, nombre FROM materias");
        echo json_encode($res->fetch_all(MYSQLI_ASSOC));
    }
    exit;
}

// Acción para obtener las carreras
if ($accion === 'carreras') {
    $res = $conn->query("SELECT idCarrera AS id, nombre FROM carrera");
    echo json_encode($res->fetch_all(MYSQLI_ASSOC));
    exit;
}

// Acción para listar las asignaciones
if ($accion === 'listar') {
    $sql = "SELECT 
                pc.idProfesor, pc.idCurso, 
                CONCAT(u.apellido, ', ', u.nombre) AS profesor,
                c.division, c.año AS anio, ca.nombre AS nombreCarrera,
                m.nombre AS nombreMateria
            FROM profesor_curso pc
            JOIN usuarios u ON pc.idProfesor = u.idUsuario
            JOIN curso c ON pc.idCurso = c.idCurso
            JOIN carrera ca ON c.idCarrera = ca.idCarrera
            JOIN materias m ON pc.idMateria = m.idMateria";
    $res = $conn->query($sql);
    echo json_encode($res->fetch_all(MYSQLI_ASSOC));
    exit;
}

// Acción para eliminar una asignación
if ($accion === 'eliminar') {
    $stmt = $conn->prepare("DELETE FROM profesor_curso WHERE idProfesor = ? AND idCurso = ?");
    $stmt->bind_param("ii", $_POST['idProfesor'], $_POST['idCurso']);
    $result = $stmt->execute();
    echo json_encode([
        "success" => $result,
        "mensaje" => $result ? "Asignación eliminada exitosamente." : "Error al eliminar la asignación."
    ]);
    exit;
}

// Acción para asignar un profesor a un curso
if ($accion === 'asignar') {
    $idProfesor = $_POST['idProfesor'];
    $idCarrera = $_POST['idCarrera'];
    $idMateria = $_POST['idMateria'];
    $anio = $_POST['anio'];
    $division = $_POST['division'];

    // 1. Verificar que el curso existe para los parámetros dados
    $sql_curso = "SELECT idCurso FROM curso WHERE año = ? AND division = ? AND idCarrera = ?";
    $stmt_curso = $conn->prepare($sql_curso);
    $stmt_curso->bind_param("ssi", $anio, $division, $idCarrera);
    $stmt_curso->execute();
    $result = $stmt_curso->get_result();

    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "mensaje" => "No se encontró un curso con los parámetros seleccionados."]);
        exit;
    }

    // Obtenemos el idCurso
    $curso = $result->fetch_assoc();
    $idCurso = $curso['idCurso'];

    // 2. Verificar si ya existe la asignación
    $sql_verificar = "SELECT COUNT(*) AS total FROM profesor_curso WHERE idProfesor = ? AND idCurso = ? AND idMateria = ?";
    $stmt_verificar = $conn->prepare($sql_verificar);
    $stmt_verificar->bind_param("iii", $idProfesor, $idCurso, $idMateria);
    $stmt_verificar->execute();
    $stmt_verificar->bind_result($total);
    $stmt_verificar->fetch();
    $stmt_verificar->close();

    if ($total > 0) {
        // Si la asignación ya existe, devolvemos un mensaje de error
        echo json_encode(["success" => false, "mensaje" => "Este profesor ya está asignado al mismo curso y materia."]);
        exit;
    }

    // 3. Insertar la nueva asignación
    $stmt_asignar = $conn->prepare("INSERT INTO profesor_curso (idProfesor, idCurso, idMateria) VALUES (?, ?, ?)");
    $stmt_asignar->bind_param("iii", $idProfesor, $idCurso, $idMateria);
    $result_asignar = $stmt_asignar->execute();

    if ($result_asignar) {
        echo json_encode([
            "success" => true,
            "mensaje" => "Profesor asignado al curso exitosamente."
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "mensaje" => "Error al asignar el profesor al curso."
        ]);
    }
    exit;
}

?>