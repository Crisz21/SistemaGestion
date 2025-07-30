<?php
header('Content-Type: application/json');

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "sistemaeducativo";

$conn = new mysqli($servername, $username, $password, $dbname);
$conn->set_charset("utf8");

if ($conn->connect_error) {
    echo json_encode(["success" => false, "mensaje" => "Conexión fallida: " . $conn->connect_error]);
    exit;
}

$accion = $_GET['accion'] ?? ($_POST['accion'] ?? 'asignar');

// Obtener alumnos (rol 1)
if ($accion === 'alumnos') {
    $res = $conn->query("SELECT idUsuario AS id, CONCAT(apellido, ', ', nombre, ' (DNI: ', idUsuario, ')') AS nombre FROM usuarios WHERE idRol = 1");
    echo json_encode($res->fetch_all(MYSQLI_ASSOC));
    exit;
}

// Obtener materias
if ($accion === 'materias') {
    $res = $conn->query("SELECT idMateria AS id, nombre FROM materias");
    echo json_encode($res->fetch_all(MYSQLI_ASSOC));
    exit;
}

// Obtener carreras
if ($accion === 'carreras') {
    $res = $conn->query("SELECT idCarrera AS id, nombre FROM carrera");
    echo json_encode($res->fetch_all(MYSQLI_ASSOC));
    exit;
}

// Listar asignaciones alumno_curso
if ($accion === 'listar') {
    $sql = "SELECT 
                ac.idAlumno, ac.idCurso, 
                CONCAT(u.apellido, ', ', u.nombre) AS alumno,
                c.division, c.año AS anio, ca.nombre AS nombreCarrera,
                m.nombre AS nombreMateria
            FROM alumno_curso ac
            JOIN usuarios u ON ac.idAlumno = u.idUsuario
            JOIN curso c ON ac.idCurso = c.idCurso
            JOIN carrera ca ON c.idCarrera = ca.idCarrera
            LEFT JOIN materias m ON ac.idMateria = m.idMateria";
    $res = $conn->query($sql);
    echo json_encode($res->fetch_all(MYSQLI_ASSOC));
    exit;
}

// Eliminar asignación
if ($accion === 'eliminar') {
    $stmt = $conn->prepare("DELETE FROM alumno_curso WHERE idAlumno = ? AND idCurso = ?");
    $stmt->bind_param("ii", $_POST['idAlumno'], $_POST['idCurso']);
    $result = $stmt->execute();
    echo json_encode([
        "success" => $result,
        "mensaje" => $result ? "Asignación eliminada exitosamente." : "Error al eliminar la asignación."
    ]);
    exit;
}

// Asignar alumno a curso
if ($accion === 'asignar') {
    $idAlumno = $_POST['idAlumno'];
    $idCarrera = $_POST['idCarrera'];
    $idMateria = $_POST['idMateria'];
    $anio = $_POST['anio'];
    $division = $_POST['division'];

    // Verificar curso existente
    $sql_curso = "SELECT idCurso FROM curso WHERE año = ? AND division = ? AND idCarrera = ?";
    $stmt_curso = $conn->prepare($sql_curso);
    $stmt_curso->bind_param("ssi", $anio, $division, $idCarrera);
    $stmt_curso->execute();
    $result = $stmt_curso->get_result();

    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "mensaje" => "No se encontró un curso con los parámetros seleccionados."]);
        exit;
    }

    $curso = $result->fetch_assoc();
    $idCurso = $curso['idCurso'];

    // Verificar duplicado
    $sql_verificar = "SELECT COUNT(*) AS total FROM alumno_curso WHERE idAlumno = ? AND idCurso = ? AND idMateria = ?";
    $stmt_verificar = $conn->prepare($sql_verificar);
    $stmt_verificar->bind_param("iii", $idAlumno, $idCurso, $idMateria);
    $stmt_verificar->execute();
    $stmt_verificar->bind_result($total);
    $stmt_verificar->fetch();
    $stmt_verificar->close();

    if ($total > 0) {
        echo json_encode(["success" => false, "mensaje" => "Este alumno ya está asignado al mismo curso y materia."]);
        exit;
    }

    // Insertar asignación
    $stmt_asignar = $conn->prepare("INSERT INTO alumno_curso (idAlumno, idCurso, idMateria, idCarrera) VALUES (?, ?, ?, ?)");
    $stmt_asignar->bind_param("iiii", $idAlumno, $idCurso, $idMateria, $idCarrera);
    $result_asignar = $stmt_asignar->execute();

    echo json_encode([
        "success" => $result_asignar,
        "mensaje" => $result_asignar ? "Alumno asignado al curso exitosamente." : "Error al asignar el alumno al curso."
    ]);
    exit;
}
?>
