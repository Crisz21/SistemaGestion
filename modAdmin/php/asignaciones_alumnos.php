<?php
header('Content-Type: application/json');

// Incluye el archivo de conexión a la base de datos.
include 'conexion.php'; 

// Determina la acción a ejecutar (ej. 'alumnos', 'materias', 'asignar', etc.).
$accion = $_GET['accion'] ?? ($_POST['accion'] ?? 'asignar');

// Lógica para obtener listados de datos (alumnos, materias, carreras, asignaciones).
switch ($accion) {
    case 'alumnos':
        $dniFiltro = $_GET['dni'] ?? null;
        if ($dniFiltro) {
            // Filtra alumnos por DNI (búsqueda parcial).
            $dniFiltro = '%' . $dniFiltro . '%'; 
            $stmt = $conn->prepare("SELECT idUsuario AS id, CONCAT(apellido, ', ', nombre, ' (DNI: ', idUsuario, ')') AS nombre 
                                     FROM usuarios WHERE idRol = 1 AND CAST(idUsuario AS CHAR) LIKE ?");
            $stmt->bind_param("s", $dniFiltro);
            $stmt->execute();
            $res = $stmt->get_result();
        } else {
            // Lista todos los alumnos.
            $res = $conn->query("SELECT idUsuario AS id, CONCAT(apellido, ', ', nombre, ' (DNI: ', idUsuario, ')') AS nombre FROM usuarios WHERE idRol = 1");
        }
        echo json_encode($res->fetch_all(MYSQLI_ASSOC));
        exit;
    case 'materias':
        $idCarrera = $_GET['idCarrera'] ?? null;
        if ($idCarrera) {
            // Filtra materias por carrera.
            $stmt = $conn->prepare("SELECT idMateria AS id, nombre FROM materias WHERE idCarrera = ?");
            $stmt->bind_param("i", $idCarrera);
            $stmt->execute();
            $res = $stmt->get_result();
        } else {
            // Lista todas las materias.
            $res = $conn->query("SELECT idMateria AS id, nombre FROM materias");
        }
        echo json_encode($res->fetch_all(MYSQLI_ASSOC));
        exit;
    case 'carreras':
        // Lista todas las carreras.
        $res = $conn->query("SELECT idCarrera AS id, nombre FROM carrera");
        echo json_encode($res->fetch_all(MYSQLI_ASSOC));
        exit;
    case 'listar':
        // Lista todas las asignaciones de alumnos a cursos con sus detalles.
        $sql = "SELECT ac.idAlumno, ac.idCurso, CONCAT(u.apellido, ', ', u.nombre) AS alumno,
                       c.division, c.año AS anio, ca.nombre AS nombreCarrera, m.nombre AS nombreMateria
                FROM alumno_curso ac
                JOIN usuarios u ON ac.idAlumno = u.idUsuario
                JOIN curso c ON ac.idCurso = c.idCurso
                JOIN carrera ca ON c.idCarrera = ca.idCarrera
                LEFT JOIN materias m ON ac.idMateria = m.idMateria";
        $res = $conn->query($sql);
        echo json_encode($res->fetch_all(MYSQLI_ASSOC));
        exit;
    case 'eliminar':
        // Elimina una asignación específica.
        $stmt = $conn->prepare("DELETE FROM alumno_curso WHERE idAlumno = ? AND idCurso = ?");
        $stmt->bind_param("ii", $_POST['idAlumno'], $_POST['idCurso']);
        $result = $stmt->execute();
        echo json_encode([
            "success" => $result,
            "mensaje" => $result ? "Asignación eliminada exitosamente." : "Error al eliminar la asignación."
        ]);
        exit;
}

// Lógica para asignar un alumno a un curso y materia.
if ($accion === 'asignar') {
    $idAlumno = $_POST['idAlumno'];
    $idCarrera = $_POST['idCarrera'];
    $idMateria = $_POST['idMateria'];
    $anio = $_POST['anio'];
    $division = $_POST['division'];

    // 1. Verifica que el curso con los parámetros seleccionados exista.
    $stmt_curso = $conn->prepare("SELECT idCurso FROM curso WHERE año = ? AND division = ? AND idCarrera = ?");
    $stmt_curso->bind_param("ssi", $anio, $division, $idCarrera);
    $stmt_curso->execute();
    $result = $stmt_curso->get_result();
    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "mensaje" => "No se encontró un curso con los parámetros seleccionados."]);
        exit;
    }
    $idCurso = $result->fetch_assoc()['idCurso'];

    // 2. Verifica que el alumno no esté ya asignado al mismo curso y materia.
    $stmt_verificar = $conn->prepare("SELECT COUNT(*) AS total FROM alumno_curso WHERE idAlumno = ? AND idCurso = ? AND idMateria = ?");
    $stmt_verificar->bind_param("iii", $idAlumno, $idCurso, $idMateria);
    $stmt_verificar->execute();
    $stmt_verificar->bind_result($total);
    $stmt_verificar->fetch();
    $stmt_verificar->close();
    if ($total > 0) {
        echo json_encode(["success" => false, "mensaje" => "Este alumno ya está asignado al mismo curso y materia."]);
        exit;
    }

    // 3. --- Lógica de VERIFICACIÓN DE CORRELATIVIDAD Y CURSADA APROBADA ---
    // Obtiene la(s) materia(s) correlativa(s) de la materia que se intenta asignar.
    $stmt_correlativa = $conn->prepare("SELECT correlativa FROM materias WHERE idMateria = ?");
    $stmt_correlativa->bind_param("i", $idMateria);
    $stmt_correlativa->execute();
    $nombreCorrelativa = $stmt_correlativa->get_result()->fetch_assoc()['correlativa'] ?? null;
    $stmt_correlativa->close();

    if ($nombreCorrelativa && $nombreCorrelativa !== '-') {
        // Divide la cadena de correlativas si contiene " / " para manejar múltiples requisitos.
        $correlativasArray = array_map('trim', explode('/', $nombreCorrelativa));
        
        // Itera sobre cada materia correlativa individual.
        foreach ($correlativasArray as $individualCorrelativaName) {
            // Busca el ID de la materia correlativa por su nombre exacto.
            $stmt_idCorrelativa = $conn->prepare("SELECT idMateria FROM materias WHERE nombre = ?");
            $stmt_idCorrelativa->bind_param("s", $individualCorrelativaName);
            $stmt_idCorrelativa->execute();
            $idMateriaCorrelativa = $stmt_idCorrelativa->get_result()->fetch_assoc()['idMateria'] ?? null;
            $stmt_idCorrelativa->close();

            if (!$idMateriaCorrelativa) {
                // Mensaje de error si una de las correlativas no se encuentra en la base de datos.
                echo json_encode(["success" => false, "mensaje" => "Error interno: La materia correlativa '$individualCorrelativaName' no se encontró en la base de datos."]);
                exit;
            }

            // Verifica si el alumno ha aprobado la cursada de esta materia correlativa individual.
            // Se considera 'cursada aprobada' si tiene una nota >= 4 en ambos parciales (o sus recuperatorios).
            $stmt_aprobado = $conn->prepare("SELECT COUNT(*) FROM calificaciones 
                                             WHERE idAlumno = ? AND idMateria = ? 
                                             AND ( (calificacion1 IS NOT NULL AND calificacion1 >= 4) OR (recuperatorio1 IS NOT NULL AND recuperatorio1 >= 4) ) 
                                             AND ( (calificacion2 IS NOT NULL AND calificacion2 >= 4) OR (recuperatorio2 IS NOT NULL AND recuperatorio2 >= 4) )");
            $stmt_aprobado->bind_param("ii", $idAlumno, $idMateriaCorrelativa);
            $stmt_aprobado->execute();
            $stmt_aprobado->bind_result($aprobadoCount);
            $stmt_aprobado->fetch();
            $stmt_aprobado->close();

            if ($aprobadoCount == 0) {
                // Si alguna de las materias correlativas requeridas no está aprobada, se impide la asignación.
                echo json_encode(["success" => false, "mensaje" => "Para inscribir al alumno en esta materia, debe tener aprobada la cursada de la materia correlativa: '$individualCorrelativaName'."]);
                exit; 
            }
        }
    }
    // --- FIN: Lógica de VERIFICACIÓN DE CORRELATIVIDAD ---

    // 4. Si todas las validaciones pasan, inserta la nueva asignación.
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