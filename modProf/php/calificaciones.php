<?php
// Conectar a la base de datos
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "sistemaeducativo";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode(["error" => "Conexión fallida: " . $conn->connect_error]));
}

// Configurar cabeceras para JSON
header('Content-Type: application/json');

// Obtener la acción solicitada por JavaScript
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'get_carreras':
        $sql_carreras = "SELECT idCarrera, nombre FROM carrera";
        $result_carreras = $conn->query($sql_carreras);
        $carreras = [];
        while ($row = $result_carreras->fetch_assoc()) {
            $carreras[] = $row;
        }
        echo json_encode($carreras);
        break;

    case 'get_materias':
        $sql_materias = "SELECT idMateria, nombre FROM materias";
        $result_materias = $conn->query($sql_materias);
        $materias = [];
        while ($row = $result_materias->fetch_assoc()) {
            $materias[] = $row;
        }
        echo json_encode($materias);
        break;

    case 'buscar_alumnos':
        $input = json_decode(file_get_contents('php://input'), true);

        $idCarrera = $input['idCarrera'] ?? '';
        $idMateria = $input['idMateria'] ?? '';
        $anioSeleccionado = $input['anio'] ?? '';
        $divisionSeleccionada = $input['division'] ?? '';

        $response = ['alumnos' => [], 'idCurso' => null];

        if (!$idCarrera || !$anioSeleccionado || !$divisionSeleccionada) {
            echo json_encode(["error" => "Faltan datos para buscar el curso."]);
            $conn->close();
            exit();
        }

        // Obtener idCurso basado en los filtros de año y división
        $sql_curso = "SELECT idCurso FROM curso WHERE año = '$anioSeleccionado' AND division = '$divisionSeleccionada' AND idCarrera = $idCarrera";
        $result_curso = $conn->query($sql_curso);

        if ($result_curso->num_rows > 0) {
            $row_curso = $result_curso->fetch_assoc();
            $idCurso = $row_curso['idCurso'];
            $response['idCurso'] = $idCurso;

            // Obtener los alumnos asignados al curso filtrado
            $sql_filtrado_asignaciones = "SELECT ac.idAlumno, u.apellido, u.nombre, u.idUsuario AS dni
                                          FROM alumno_curso ac
                                          JOIN usuarios u ON ac.idAlumno = u.idUsuario
                                          JOIN curso c ON ac.idCurso = c.idCurso
                                          WHERE c.idCurso = $idCurso";

            // Si se seleccionó materia, filtrar también por materia en la asignación
            if ($idMateria) {
                $sql_filtrado_asignaciones .= " AND ac.idMateria = $idMateria";
            }

            $alumnos_result = $conn->query($sql_filtrado_asignaciones);
            $alumnos = [];

            // Obtener calificaciones guardadas para estos alumnos y esta materia/curso
            $calificaciones_guardadas = [];
            if ($idCurso && $idMateria) {
                $sql_calificaciones_guardadas = "SELECT idAlumno, calificacion1, recuperatorio1, calificacion2, recuperatorio2, examenFinal
                                                 FROM calificaciones
                                                 WHERE idCurso = $idCurso AND idMateria = $idMateria AND idCarrera = $idCarrera";
                $result_calificaciones_guardadas = $conn->query($sql_calificaciones_guardadas);
                if ($result_calificaciones_guardadas) {
                    while ($row_cal = $result_calificaciones_guardadas->fetch_assoc()) {
                        $calificaciones_guardadas[$row_cal['idAlumno']] = $row_cal;
                    }
                } else {
                    error_log("Error al obtener calificaciones guardadas: " . $conn->error);
                }
            }
            
            while ($row = $alumnos_result->fetch_assoc()) {
                $alumno = $row;
                // Adjuntar calificaciones existentes
                if (isset($calificaciones_guardadas[$row['idAlumno']])) {
                    $alumno = array_merge($alumno, $calificaciones_guardadas[$row['idAlumno']]);
                }
                $alumnos[] = $alumno;
            }
            $response['alumnos'] = $alumnos;

        } else {
            $response["error"] = "No se encontró el curso para los parámetros seleccionados.";
        }
        echo json_encode($response);
        break;

    case 'guardar_calificaciones':
        $input = json_decode(file_get_contents('php://input'), true);

        $idMateria = $input['idMateria'] ?? '';
        $idCarrera = $input['idCarrera'] ?? '';
        $idCurso = $input['idCurso'] ?? '';
        $calificaciones = $input['calificaciones'] ?? [];

        if (empty($idCurso) || empty($idMateria) || empty($idCarrera) || empty($calificaciones)) {
            echo json_encode(["message" => "Faltan datos para guardar las calificaciones."]);
            $conn->close();
            exit();
        }

        // Ya no necesitamos $fecha_actual si no guardaremos la columna fechaRegistro
        // $fecha_actual = date('Y-m-d'); // Fecha actual

        $conn->begin_transaction(); // Iniciar transacción

        try {
            foreach ($calificaciones as $idAlumno => $calificacion) {
                $calificacion1 = !empty($calificacion['calificacion1']) ? $conn->real_escape_string($calificacion['calificacion1']) : NULL;
                $recuperatorio1 = !empty($calificacion['recuperatorio1']) ? $conn->real_escape_string($calificacion['recuperatorio1']) : NULL;
                $calificacion2 = !empty($calificacion['calificacion2']) ? $conn->real_escape_string($calificacion['calificacion2']) : NULL;
                $recuperatorio2 = !empty($calificacion['recuperatorio2']) ? $conn->real_escape_string($calificacion['recuperatorio2']) : NULL;
                $examenFinal = !empty($calificacion['examenFinal']) ? $conn->real_escape_string($calificacion['examenFinal']) : NULL;

                // Verificar si ya existe una calificación para este alumno, curso, materia y carrera
                $sql_check = "SELECT idCalificacion FROM calificaciones WHERE idAlumno = '$idAlumno' AND idCurso = $idCurso AND idMateria = $idMateria AND idCarrera = $idCarrera";
                $result_check = $conn->query($sql_check);

                if ($result_check->num_rows > 0) {
                    // Actualizar si ya existe
                    $sql_update_calificacion = "UPDATE calificaciones SET
                                                calificacion1 = " . ($calificacion1 !== NULL ? "'$calificacion1'" : "NULL") . ",
                                                recuperatorio1 = " . ($recuperatorio1 !== NULL ? "'$recuperatorio1'" : "NULL") . ",
                                                calificacion2 = " . ($calificacion2 !== NULL ? "'$calificacion2'" : "NULL") . ",
                                                recuperatorio2 = " . ($recuperatorio2 !== NULL ? "'$recuperatorio2'" : "NULL") . ",
                                                examenFinal = " . ($examenFinal !== NULL ? "'$examenFinal'" : "NULL") . "
                                                WHERE idAlumno = '$idAlumno' AND idCurso = $idCurso AND idMateria = $idMateria AND idCarrera = $idCarrera";
                    if (!$conn->query($sql_update_calificacion)) {
                        throw new Exception("Error al actualizar la calificación: " . $conn->error);
                    }
                } else {
                    // Insertar si no existe
                    // MODIFICACIÓN REALIZADA AQUÍ: Se eliminó 'fechaRegistro' y '$fecha_actual'
                    $sql_insert_calificacion = "INSERT INTO calificaciones (idAlumno, idCurso, idMateria, calificacion1, recuperatorio1, calificacion2, recuperatorio2, examenFinal, idCarrera)
                                                VALUES ('$idAlumno', $idCurso, $idMateria,
                                                        " . ($calificacion1 !== NULL ? "'$calificacion1'" : "NULL") . ",
                                                        " . ($recuperatorio1 !== NULL ? "'$recuperatorio1'" : "NULL") . ",
                                                        " . ($calificacion2 !== NULL ? "'$calificacion2'" : "NULL") . ",
                                                        " . ($recuperatorio2 !== NULL ? "'$recuperatorio2'" : "NULL") . ",
                                                        " . ($examenFinal !== NULL ? "'$examenFinal'" : "NULL") . ",
                                                        $idCarrera)";
                    if (!$conn->query($sql_insert_calificacion)) {
                        throw new Exception("Error al insertar la calificación: " . $conn->error);
                    }
                }
            }
            $conn->commit(); // Confirmar transacción
            echo json_encode(["message" => "Calificaciones guardadas con éxito."]);

        } catch (Exception $e) {
            $conn->rollback(); // Revertir transacción en caso de error
            echo json_encode(["message" => "Error al guardar calificaciones: " . $e->getMessage()]);
        }
        break;

    default:
        echo json_encode(["error" => "Acción no válida."]);
        break;
}

$conn->close();
?>