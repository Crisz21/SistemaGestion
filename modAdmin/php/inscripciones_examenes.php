<?php
header('Content-Type: application/json');

include 'conexion.php'; // Tu archivo de conexión a la base de datos

$accion = $_GET['accion'] ?? ($_POST['accion'] ?? 'inscribir');

switch ($accion) {
    case 'cargar_carreras':
        $res = $conn->query("SELECT idCarrera AS id, nombre FROM carrera ORDER BY nombre ASC");
        echo json_encode($res->fetch_all(MYSQLI_ASSOC));
        break;

    case 'cargar_materias':
        $idCarrera = $_GET['idCarrera'] ?? null;
        $materias = [];
        if ($idCarrera) {
            $stmt = $conn->prepare("SELECT idMateria AS id, nombre FROM materias WHERE idCarrera = ? ORDER BY nombre ASC");
            $stmt->bind_param("i", $idCarrera);
            $stmt->execute();
            $res = $stmt->get_result();
            while ($row = $res->fetch_assoc()) {
                $materias[] = $row;
            }
            $stmt->close();
        }
        echo json_encode($materias);
        break;

    case 'cargar_alumnos_aptos':
        $idCarrera = $_GET['idCarrera'] ?? null;
        $idMateria = $_GET['idMateria'] ?? null;
        $dniFiltro = $_GET['dni'] ?? ''; // Nuevo: filtro por DNI
        $alumnos = [];

        if ($idCarrera && $idMateria) {
            $sql = "
                SELECT
                    DISTINCT u.idUsuario AS id,
                    CONCAT(u.apellido, ', ', u.nombre, ' (DNI: ', u.idUsuario, ')') AS nombre
                FROM usuarios u
                JOIN calificaciones cal ON u.idUsuario = cal.idAlumno
                -- Se une también con la tabla de cursos para asegurar que el alumno está en el curso correcto para esa materia
                JOIN curso c ON cal.idCurso = c.idCurso AND c.idCarrera = cal.idCarrera
                WHERE u.idRol = 1 -- Solo alumnos
                AND cal.idCarrera = ?
                AND cal.idMateria = ?
                AND (cal.calificacion1 >= 4 OR cal.recuperatorio1 >= 4)
                AND (cal.calificacion2 >= 4 OR cal.recuperatorio2 >= 4)
                -- AÑADIDA: Excluir si ya tiene un examen final aprobado para esta materia
                AND NOT (
                    COALESCE(cal.examenFinal, 0) >= 4 OR
                    COALESCE(cal.examenFinal2, 0) >= 4 OR
                    COALESCE(cal.examenFinal3, 0) >= 4
                )
            ";
            
            // Añadir el filtro de DNI si está presente
            if (!empty($dniFiltro)) {
                $sql .= " AND u.idUsuario LIKE ?"; // Asumiendo que idUsuario es el DNI
            }
            $sql .= " ORDER BY u.apellido, u.nombre ASC";

            $stmt = $conn->prepare($sql);

            if (!empty($dniFiltro)) {
                $dniParam = "%" . $dniFiltro . "%";
                $stmt->bind_param("iis", $idCarrera, $idMateria, $dniParam);
            } else {
                $stmt->bind_param("ii", $idCarrera, $idMateria);
            }
            
            $stmt->execute();
            $res = $stmt->get_result();
            while ($row = $res->fetch_assoc()) {
                $alumnos[] = $row;
            }
            $stmt->close();
        }
        echo json_encode($alumnos);
        break;

    case 'cargar_examenes':
        $idCarrera = $_GET['idCarrera'] ?? null;
        $idMateria = $_GET['idMateria'] ?? null;
        $idAlumno = $_GET['idAlumno'] ?? null;

        $examenes = [];

        if ($idCarrera && $idMateria && $idAlumno) {
            $stmt = $conn->prepare("
                SELECT
                    e.idExamen AS id,
                    CONCAT(m.nombre, ' (', cu.año, '/', cu.division, ' - ', e.fecha, ' ', e.hora, ' - Llamado: ', e.llamado, ')') AS nombre
                FROM examenes_finales e
                JOIN materias m ON e.idMateria = m.idMateria
                JOIN curso cu ON e.idCurso = cu.idCurso
                WHERE e.idCarrera = ?
                AND e.idMateria = ?
                -- Opcional: Podrías añadir una condición para que no muestre exámenes ya pasados si es relevante para tu lógica.
                -- AND e.fecha >= CURDATE()
                ORDER BY e.fecha ASC, e.hora ASC
            ");
            $stmt->bind_param("ii", $idCarrera, $idMateria);
            $stmt->execute();
            $res = $stmt->get_result();
            while ($row = $res->fetch_assoc()) {
                $examenes[] = $row;
            }
            $stmt->close();
        }
        echo json_encode($examenes);
        break;

    case 'listar_inscripciones':
        $sql = "SELECT
                    ie.idInscripcion,
                    CONCAT(u.apellido, ', ', u.nombre) AS alumno,
                    carr.nombre AS carrera,
                    mat.nombre AS materia,
                    ex.fecha AS fechaExamen,
                    ex.hora AS horaExamen,
                    cur.año AS añoCurso,
                    cur.division AS divisionCurso,
                    ie.fechaInscripcion,
                    ex.llamado
                FROM inscripciones_examenes ie
                JOIN usuarios u ON ie.idAlumno = u.idUsuario
                JOIN examenes_finales ex ON ie.idExamen = ex.idExamen
                JOIN materias mat ON ex.idMateria = mat.idMateria
                JOIN carrera carr ON ex.idCarrera = carr.idCarrera
                JOIN curso cur ON ex.idCurso = cur.idCurso
                ORDER BY ie.fechaInscripcion DESC";
        $res = $conn->query($sql);
        echo json_encode($res->fetch_all(MYSQLI_ASSOC));
        break;

    case 'inscribir_alumno':
        $idAlumno = $_POST['idAlumno'] ?? null;
        $idExamen = $_POST['idExamen'] ?? null;
        $fechaInscripcion = date('Y-m-d H:i:s');

        if (!$idAlumno || !$idExamen) {
            echo json_encode(["success" => false, "mensaje" => "Por favor, selecciona un alumno y un examen."]);
            exit;
        }

        // Obtener datos del examen para validaciones
        $stmt_examen_data = $conn->prepare("SELECT idCarrera, idMateria, idCurso FROM examenes_finales WHERE idExamen = ?");
        $stmt_examen_data->bind_param("i", $idExamen);
        $stmt_examen_data->execute();
        $res_examen_data = $stmt_examen_data->get_result();
        $examen_data = $res_examen_data->fetch_assoc();
        $idCarreraExamen = $examen_data['idCarrera'] ?? null;
        $idMateriaExamen = $examen_data['idMateria'] ?? null;
        $idCursoExamen = $examen_data['idCurso'] ?? null;
        $stmt_examen_data->close();

        if (!$idCarreraExamen || !$idMateriaExamen || !$idCursoExamen) {
            echo json_encode(["success" => false, "mensaje" => "Error: No se pudo obtener los datos del examen seleccionado."]);
            exit;
        }

        // NUEVA VALIDACIÓN: Verificar si el alumno ya aprobó la materia en alguna instancia de final.
        $stmt_aprobado_final = $conn->prepare("
            SELECT COUNT(*) FROM calificaciones
            WHERE idAlumno = ? AND idMateria = ? AND idCarrera = ? AND idCurso = ?
            AND (
                COALESCE(examenFinal, 0) >= 4 OR
                COALESCE(examenFinal2, 0) >= 4 OR
                COALESCE(examenFinal3, 0) >= 4
            )
        ");
        $stmt_aprobado_final->bind_param("iiii", $idAlumno, $idMateriaExamen, $idCarreraExamen, $idCursoExamen);
        $stmt_aprobado_final->execute();
        $stmt_aprobado_final->bind_result($aprobado_final_count);
        $stmt_aprobado_final->fetch();
        $stmt_aprobado_final->close();

        if ($aprobado_final_count > 0) {
            echo json_encode(["success" => false, "mensaje" => "El alumno ya aprobó la materia con un examen final anterior."]);
            exit;
        }

        // Lógica existente para verificar si está apto para rendir (parciales aprobados)
        $stmt_apto = $conn->prepare("
            SELECT COUNT(*) FROM calificaciones
            WHERE idAlumno = ? AND idMateria = ? AND idCarrera = ? AND idCurso = ?
            AND (
                (COALESCE(calificacion1, 0) >= 4 OR COALESCE(recuperatorio1, 0) >= 4)
                AND (COALESCE(calificacion2, 0) >= 4 OR COALESCE(recuperatorio2, 0) >= 4)
            )
        ");
        $stmt_apto->bind_param("iiii", $idAlumno, $idMateriaExamen, $idCarreraExamen, $idCursoExamen);
        $stmt_apto->execute();
        $stmt_apto->bind_result($apto_count);
        $stmt_apto->fetch();
        $stmt_apto->close();

        if ($apto_count == 0) {
            echo json_encode(["success" => false, "mensaje" => "El alumno no cumple con las condiciones de cursada para rendir este examen final (parciales no aprobados)."]);
            exit;
        }

        // **INICIO NUEVA VALIDACIÓN: Correlativas Aprobadas**
        // 1. Obtener las correlativas de la materia del examen
        $stmt_correlativas = $conn->prepare("SELECT correlativa FROM materias WHERE idMateria = ?");
        $stmt_correlativas->bind_param("i", $idMateriaExamen);
        $stmt_correlativas->execute();
        $res_correlativas = $stmt_correlativas->get_result();
        $materia_data = $res_correlativas->fetch_assoc();
        $correlativas_str = $materia_data['correlativa'] ?? '';
        $stmt_correlativas->close();

        if (!empty($correlativas_str) && $correlativas_str !== '-') {
            $correlativas_arr = explode('/', $correlativas_str); // Asume que las correlativas están separadas por '/'
            foreach ($correlativas_arr as $correlativa_nombre) {
                $correlativa_nombre = trim($correlativa_nombre);

                // Buscar el id de la materia correlativa por su nombre
                $stmt_get_correlativa_id = $conn->prepare("SELECT idMateria FROM materias WHERE nombre = ? AND idCarrera = ?");
                $stmt_get_correlativa_id->bind_param("si", $correlativa_nombre, $idCarreraExamen);
                $stmt_get_correlativa_id->execute();
                $res_get_correlativa_id = $stmt_get_correlativa_id->get_result();
                $correlativa_id_data = $res_get_correlativa_id->fetch_assoc();
                $idCorrelativa = $correlativa_id_data['idMateria'] ?? null;
                $stmt_get_correlativa_id->close();

                if ($idCorrelativa) {
                    // Verificar si el alumno tiene aprobada la correlativa (examen final >= 4)
                    $stmt_correlativa_aprobada = $conn->prepare("
                        SELECT COUNT(*) FROM calificaciones
                        WHERE idAlumno = ? AND idMateria = ? AND idCarrera = ?
                        AND (
                            COALESCE(examenFinal, 0) >= 4 OR
                            COALESCE(examenFinal2, 0) >= 4 OR
                            COALESCE(examenFinal3, 0) >= 4
                        )
                    ");
                    $stmt_correlativa_aprobada->bind_param("iii", $idAlumno, $idCorrelativa, $idCarreraExamen);
                    $stmt_correlativa_aprobada->execute();
                    $stmt_correlativa_aprobada->bind_result($correlativa_aprobada_count);
                    $stmt_correlativa_aprobada->fetch();
                    $stmt_correlativa_aprobada->close();

                    if ($correlativa_aprobada_count == 0) {
                        echo json_encode(["success" => false, "mensaje" => "El alumno no tiene aprobada la materia correlativa: " . $correlativa_nombre . " (examen final)."]);
                        exit;
                    }
                } else {
                    // Si una correlativa listada no se encuentra, podría ser un error de datos o una correlativa no de materia.
                    // Aquí se puede decidir si se permite o se bloquea. Por seguridad, se podría bloquear.
                    // Para este ejemplo, si no se encuentra la materia correlativa por nombre, se asume que no está aprobada.
                    echo json_encode(["success" => false, "mensaje" => "Error: No se encontró la materia correlativa '" . $correlativa_nombre . "'."]);
                    exit;
                }
            }
        }
        // **FIN NUEVA VALIDACIÓN: Correlativas Aprobadas**

        // Verificar si ya está inscrito en este mismo examen para evitar duplicados
        $stmt_check_inscripcion = $conn->prepare("SELECT COUNT(*) FROM inscripciones_examenes WHERE idAlumno = ? AND idExamen = ?");
        $stmt_check_inscripcion->bind_param("ii", $idAlumno, $idExamen);
        $stmt_check_inscripcion->execute();
        $stmt_check_inscripcion->bind_result($count_inscripcion);
        $stmt_check_inscripcion->fetch();
        $stmt_check_inscripcion->close();

        if ($count_inscripcion > 0) {
            echo json_encode(["success" => false, "mensaje" => "Este alumno ya está inscrito en este examen."]);
            exit;
        }
        
        // Si pasa todas las validaciones, proceder con la inscripción
        $stmt_insert = $conn->prepare("INSERT INTO inscripciones_examenes (idAlumno, idExamen, idCarrera, fechaInscripcion) VALUES (?, ?, ?, ?)");
        $stmt_insert->bind_param("iiis", $idAlumno, $idExamen, $idCarreraExamen, $fechaInscripcion);

        if ($stmt_insert->execute()) {
            echo json_encode(["success" => true, "mensaje" => "Inscripción realizada exitosamente."]);
        } else {
            echo json_encode(["success" => false, "mensaje" => "Error al inscribir al alumno: " . $conn->error]);
        }
        $stmt_insert->close();
        break;

    case 'eliminar_inscripcion':
        $idInscripcion = $_POST['idInscripcion'] ?? null;

        if (!$idInscripcion) {
            echo json_encode(["success" => false, "mensaje" => "ID de inscripción no proporcionado."]);
            exit;
        }

        $stmt = $conn->prepare("DELETE FROM inscripciones_examenes WHERE idInscripcion = ?");
        $stmt->bind_param("i", $idInscripcion);

        if ($stmt->execute()) {
            echo json_encode(["success" => true, "mensaje" => "Inscripción eliminada exitosamente."]);
        } else {
            echo json_encode(["success" => false, "mensaje" => "Error al eliminar la inscripción."]);
        }
        $stmt->close();
        break;

    default:
        echo json_encode(["success" => false, "mensaje" => "Acción no válida."]);
        break;
}

$conn->close();
?>