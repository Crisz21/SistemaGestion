<?php

include 'conexion.php'; // Asegúrate de que este archivo conecta correctamente a tu DB

// Configurar cabeceras para JSON
header('Content-Type: application/json');

// Obtener la acción solicitada por JavaScript
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'get_carreras':
        $sql_carreras = "SELECT idCarrera, nombre FROM carrera";
        $result_carreras = $conn->query($sql_carreras);
        $carreras = [];
        if ($result_carreras) {
            while ($row = $result_carreras->fetch_assoc()) {
                $carreras[] = $row;
            }
        } else {
            error_log("Error al obtener carreras: " . $conn->error);
        }
        echo json_encode($carreras);
        break;

    case 'get_materias':
        $idCarrera = $_GET['idCarrera'] ?? '';
        $materias = [];

        if ($idCarrera) {
            $idCarrera = intval($idCarrera); // Sanitizar input
            $sql_materias = "SELECT idMateria, nombre FROM materias WHERE idCarrera = $idCarrera";
            $result_materias = $conn->query($sql_materias);

            if ($result_materias) {
                while ($row = $result_materias->fetch_assoc()) {
                    $materias[] = $row;
                }
            } else {
                error_log("Error al obtener materias (idCarrera: $idCarrera): " . $conn->error);
            }
        }
        echo json_encode($materias);
        break;

    case 'buscar_alumnos_cursada':
        $input = json_decode(file_get_contents('php://input'), true);

        $idCarrera = $input['idCarrera'] ?? '';
        $idMateria = $input['idMateria'] ?? ''; // Asegúrate de que idMateria se recibe correctamente
        $anioSeleccionado = $input['anio'] ?? '';
        $divisionSeleccionada = $input['division'] ?? '';

        $response = ['alumnos' => [], 'idCurso' => null];

        if (empty($idCarrera) || empty($anioSeleccionado) || empty($divisionSeleccionada) || empty($idMateria)) {
            echo json_encode(["error" => "Faltan datos para buscar el curso y alumnos de cursada. Asegúrate de seleccionar Carrera, Año, División y Materia."]);
            $conn->close();
            exit();
        }

        $idCarrera = intval($idCarrera); // Sanitizar
        $idMateria = intval($idMateria); // Sanitizar
        $anioSeleccionado = $conn->real_escape_string($anioSeleccionado); // Sanitizar
        $divisionSeleccionada = $conn->real_escape_string($divisionSeleccionada); // Sanitizar


        $sql_curso = "SELECT idCurso FROM curso WHERE año = '$anioSeleccionado' AND division = '$divisionSeleccionada' AND idCarrera = $idCarrera";
        $result_curso = $conn->query($sql_curso);

        if (!$result_curso) {
            error_log("Error al buscar el curso para cursada: " . $conn->error . " | SQL: " . $sql_curso);
            echo json_encode(["error" => "Error interno al buscar el curso para cursada."]);
            $conn->close();
            exit();
        }

        if ($result_curso->num_rows > 0) {
            $row_curso = $result_curso->fetch_assoc();
            $idCurso = $row_curso['idCurso'];
            $response['idCurso'] = $idCurso;
            error_log("ID Curso obtenido para cursada: " . $idCurso);

            // Consulta para alumnos asignados al curso Y A LA MATERIA ESPECÍFICA
            $sql_alumnos_cursada = "SELECT ac.idAlumno, u.apellido, u.nombre, u.idUsuario AS dni
                                           FROM alumno_curso ac
                                           JOIN usuarios u ON ac.idAlumno = u.idUsuario
                                           WHERE ac.idCurso = $idCurso AND ac.idMateria = $idMateria"; // <<-- FILTRO AGREGADO AQUÍ

            $alumnos_result = $conn->query($sql_alumnos_cursada);

            if (!$alumnos_result) {
                error_log("Error al buscar alumnos de cursada: " . $conn->error . " | SQL: " . $sql_alumnos_cursada);
                echo json_encode(["error" => "Error interno al buscar alumnos de cursada."]);
                $conn->close();
                exit();
            }

            $alumnos = [];
            $calificaciones_guardadas = [];

            // Obtener calificaciones de cursada ya existentes para estos alumnos, curso, materia y carrera
            $sql_calificaciones_guardadas = "SELECT idAlumno, calificacion1, recuperatorio1, calificacion2, recuperatorio2, examenFinal, examenFinal2, examenFinal3, tomo, folio
                                             FROM calificaciones
                                             WHERE idCurso = $idCurso AND idMateria = $idMateria AND idCarrera = $idCarrera";
            $result_calificaciones_guardadas = $conn->query($sql_calificaciones_guardadas);

            if ($result_calificaciones_guardadas) {
                while ($row_cal = $result_calificaciones_guardadas->fetch_assoc()) {
                    $calificaciones_guardadas[$row_cal['idAlumno']] = $row_cal;
                }
            } else {
                error_log("Error al obtener calificaciones de cursada guardadas: " . $conn->error . " | SQL: " . $sql_calificaciones_guardadas);
            }

            while ($row = $alumnos_result->fetch_assoc()) {
                $alumno = $row;
                if (isset($calificaciones_guardadas[$row['idAlumno']])) {
                    // Si hay calificaciones guardadas, fusionarlas con los datos del alumno
                    $alumno = array_merge($alumno, $calificaciones_guardadas[$row['idAlumno']]);
                }
                $alumnos[] = $alumno;
            }
            $response['alumnos'] = $alumnos;

        } else {
            $response["error"] = "No se encontró el curso para los parámetros seleccionados.";
            error_log("No se encontró el curso para cursada: Año=$anioSeleccionado, División=$divisionSeleccionada, Carrera=$idCarrera");
        }
        echo json_encode($response);
        break;

    case 'buscar_inscritos_mesa_final':
        $input = json_decode(file_get_contents('php://input'), true);

        $idCarrera = $input['idCarrera'] ?? '';
        $idMateria = $input['idMateria'] ?? '';
        $anioSeleccionado = $input['anio'] ?? '';
        $divisionSeleccionada = $input['division'] ?? '';

        $response = ['alumnos_inscritos' => [], 'idCurso' => null];

        if (empty($idCarrera) || empty($idMateria) || empty($anioSeleccionado) || empty($divisionSeleccionada)) {
            echo json_encode(["error" => "Faltan datos para buscar inscripciones a examen final."]);
            $conn->close();
            exit();
        }

        $idCarrera = intval($idCarrera); // Sanitizar
        $idMateria = intval($idMateria); // Sanitizar
        $anioSeleccionado = $conn->real_escape_string($anioSeleccionado); // Sanitizar
        $divisionSeleccionada = $conn->real_escape_string($divisionSeleccionada); // Sanitizar

        // Primero, obtener el idCurso
        $sql_curso = "SELECT idCurso FROM curso WHERE año = '$anioSeleccionado' AND division = '$divisionSeleccionada' AND idCarrera = $idCarrera";
        $result_curso = $conn->query($sql_curso);

        if (!$result_curso) {
            error_log("Error al buscar el curso para mesa final: " . $conn->error . " | SQL: " . $sql_curso);
            echo json_encode(["error" => "Error interno al buscar el curso para mesa final."]);
            $conn->close();
            exit();
        }

        if ($result_curso->num_rows > 0) {
            $row_curso = $result_curso->fetch_assoc();
            $idCurso = $row_curso['idCurso'];
            $response['idCurso'] = $idCurso;
            error_log("ID Curso obtenido para mesa final: " . $idCurso);

            // Consulta para alumnos inscritos a mesa de examen final (con GROUP BY)
            // Se incluyen examenFinal, examenFinal2, examenFinal3, tomo y folio para precargar las notas y datos existentes
            $sql_inscritos = "SELECT
                                        ie.idAlumno,
                                        u.apellido,
                                        u.nombre,
                                        u.idUsuario AS dni,
                                        COALESCE(c.examenFinal, '') AS examenFinal,
                                        COALESCE(c.examenFinal2, '') AS examenFinal2,
                                        COALESCE(c.examenFinal3, '') AS examenFinal3,
                                        COALESCE(c.tomo, '') AS tomo,
                                        COALESCE(c.folio, '') AS folio
                                FROM
                                        inscripciones_examenes ie
                                JOIN
                                        usuarios u ON ie.idAlumno = u.idUsuario
                                JOIN
                                        examenes_finales ef ON ie.idExamen = ef.idExamen
                                LEFT JOIN
                                        calificaciones c ON ie.idAlumno = c.idAlumno
                                        AND ef.idMateria = c.idMateria
                                        AND ef.idCarrera = c.idCarrera
                                        AND ef.idCurso = c.idCurso
                                WHERE
                                        ef.idCarrera = $idCarrera
                                        AND ef.idMateria = $idMateria
                                        AND ef.idCurso = $idCurso
                                GROUP BY
                                        ie.idAlumno, u.apellido, u.nombre, u.idUsuario, c.examenFinal, c.examenFinal2, c.examenFinal3, c.tomo, c.folio
                                ORDER BY
                                        u.apellido, u.nombre";

            error_log("SQL para buscar inscritos a mesa final (con GROUP BY): " . $sql_inscritos); // Log de la consulta generada
            $result_inscritos = $conn->query($sql_inscritos);
            $alumnos_inscritos = [];

            if ($result_inscritos) {
                if ($result_inscritos->num_rows > 0) {
                    while ($row_inscrito = $result_inscritos->fetch_assoc()) {
                        $alumnos_inscritos[] = $row_inscrito;
                    }
                    error_log("Se encontraron " . count($alumnos_inscritos) . " alumnos inscritos para mesa final.");
                } else {
                    error_log("No se encontraron alumnos inscritos para mesa final con los criterios dados.");
                }
            } else {
                error_log("Error al buscar alumnos inscritos para examen final: " . $conn->error . " | SQL: " . $sql_inscritos);
            }
            $response['alumnos_inscritos'] = $alumnos_inscritos;

        } else {
            $response["error"] = "No se encontró el curso para los parámetros seleccionados.";
            error_log("No se encontró el curso para mesa final: Año=$anioSeleccionado, División=$divisionSeleccionada, Carrera=$idCarrera");
        }
        echo json_encode($response);
        break;

    case 'guardar_calificaciones_cursada':
        $input = json_decode(file_get_contents('php://input'), true);

        $idMateria = $input['idMateria'] ?? '';
        $idCarrera = $input['idCarrera'] ?? '';
        $idCurso = $input['idCurso'] ?? '';
        $calificaciones = $input['calificaciones'] ?? [];

        if (empty($idCurso) || empty($idMateria) || empty($idCarrera) || empty($calificaciones)) {
            echo json_encode(["message" => "Faltan datos para guardar las calificaciones de cursada."]);
            $conn->close();
            exit();
        }

        $idMateria = intval($idMateria);
        $idCarrera = intval($idCarrera);
        $idCurso = intval($idCurso);

        $conn->begin_transaction(); // Iniciar transacción

        try {
            foreach ($calificaciones as $idAlumno => $calificacion) {
                $idAlumno = intval($idAlumno); // Sanitizar ID del alumno

                // Sanitizar y validar calificaciones, o establecer a NULL si están vacías o no son válidas
                $calificacion1 = filter_var($calificacion['calificacion1'], FILTER_VALIDATE_FLOAT, array("options" => array("min_range"=>1, "max_range"=>10))) !== false ? $calificacion['calificacion1'] : 'NULL';
                $recuperatorio1 = filter_var($calificacion['recuperatorio1'], FILTER_VALIDATE_FLOAT, array("options" => array("min_range"=>1, "max_range"=>10))) !== false ? $calificacion['recuperatorio1'] : 'NULL';
                $calificacion2 = filter_var($calificacion['calificacion2'], FILTER_VALIDATE_FLOAT, array("options" => array("min_range"=>1, "max_range"=>10))) !== false ? $calificacion['calificacion2'] : 'NULL';
                $recuperatorio2 = filter_var($calificacion['recuperatorio2'], FILTER_VALIDATE_FLOAT, array("options" => array("min_range"=>1, "max_range"=>10))) !== false ? $calificacion['recuperatorio2'] : 'NULL';
                // Los campos examenFinal, examenFinal2, examenFinal3, tomo y folio NO son parte de este formulario de cursada,
                // así que se mantienen como están en la DB o se insertan como NULL si es una nueva fila.
                // No los actualizamos aquí para evitar sobrescribir las notas del final de mesa.

                $calificacion1_val = ($calificacion1 === 'NULL') ? 'NULL' : $conn->real_escape_string($calificacion1);
                $recuperatorio1_val = ($recuperatorio1 === 'NULL') ? 'NULL' : $conn->real_escape_string($recuperatorio1);
                $calificacion2_val = ($calificacion2 === 'NULL') ? 'NULL' : $conn->real_escape_string($calificacion2);
                $recuperatorio2_val = ($recuperatorio2 === 'NULL') ? 'NULL' : $conn->real_escape_string($recuperatorio2);

                $sql_check = "SELECT idCalificacion FROM calificaciones
                                 WHERE idAlumno = $idAlumno
                                 AND idCurso = $idCurso
                                 AND idMateria = $idMateria
                                 AND idCarrera = $idCarrera";
                $result_check = $conn->query($sql_check);

                if ($result_check->num_rows > 0) {
                    $sql_update_calificacion = "UPDATE calificaciones SET
                                                     calificacion1 = $calificacion1_val,
                                                     recuperatorio1 = $recuperatorio1_val,
                                                     calificacion2 = $calificacion2_val,
                                                     recuperatorio2 = $recuperatorio2_val
                                                     WHERE idAlumno = $idAlumno
                                                     AND idCurso = $idCurso
                                                     AND idMateria = $idMateria
                                                     AND idCarrera = $idCarrera";
                    if (!$conn->query($sql_update_calificacion)) {
                        throw new Exception("Error al actualizar la calificación de cursada (Alumno ID: $idAlumno): " . $conn->error . " | SQL: " . $sql_update_calificacion);
                    }
                } else {
                    $sql_insert_calificacion = "INSERT INTO calificaciones (idAlumno, idCurso, idMateria, calificacion1, recuperatorio1, calificacion2, recuperatorio2, idCarrera)
                                                     VALUES ($idAlumno, $idCurso, $idMateria,
                                                             $calificacion1_val,
                                                             $recuperatorio1_val,
                                                             $calificacion2_val,
                                                             $recuperatorio2_val,
                                                             $idCarrera)";
                    if (!$conn->query($sql_insert_calificacion)) {
                        throw new Exception("Error al insertar la calificación de cursada (Alumno ID: $idAlumno): " . $conn->error . " | SQL: " . $sql_insert_calificacion);
                    }
                }
            }
            $conn->commit();
            echo json_encode(["message" => "Calificaciones de cursada guardadas con éxito."]);

        } catch (Exception $e) {
            $conn->rollback();
            error_log("Error al guardar calificaciones de cursada: " . $e->getMessage());
            echo json_encode(["message" => "Error al guardar calificaciones de cursada: " . $e->getMessage()]);
        }
        break;

    case 'guardar_calificaciones_mesa_final':
        $input = json_decode(file_get_contents('php://input'), true);

        $idMateria = $input['idMateria'] ?? '';
        $idCarrera = $input['idCarrera'] ?? '';
        $idCurso = $input['idCurso'] ?? '';
        $calificacionesMesaFinal = $input['calificacionesMesaFinal'] ?? [];

        if (empty($idCurso) || empty($idMateria) || empty($idCarrera) || empty($calificacionesMesaFinal)) {
            echo json_encode(["message" => "Faltan datos para guardar las calificaciones de mesa de examen final."]);
            $conn->close();
            exit();
        }

        $idMateria = intval($idMateria);
        $idCarrera = intval($idCarrera);
        $idCurso = intval($idCurso);

        $conn->begin_transaction(); // Iniciar transacción

        try {
            foreach ($calificacionesMesaFinal as $idAlumno => $calificacion) {
                $idAlumno = intval($idAlumno); // Sanitizar ID del alumno

                // Validar y sanear las notas, o establecer a NULL
                $examenFinal = filter_var($calificacion['examenFinal'], FILTER_VALIDATE_FLOAT, array("options" => array("min_range"=>1, "max_range"=>10))) !== false ? $calificacion['examenFinal'] : 'NULL';
                $examenFinal2 = filter_var($calificacion['examenFinal2'], FILTER_VALIDATE_FLOAT, array("options" => array("min_range"=>1, "max_range"=>10))) !== false ? $calificacion['examenFinal2'] : 'NULL';
                $examenFinal3 = filter_var($calificacion['examenFinal3'], FILTER_VALIDATE_FLOAT, array("options" => array("min_range"=>1, "max_range"=>10))) !== false ? $calificacion['examenFinal3'] : 'NULL';
                $tomo = $calificacion['tomo'] !== '' ? "'" . $conn->real_escape_string($calificacion['tomo']) . "'" : 'NULL';
                $folio = $calificacion['folio'] !== '' ? "'" . $conn->real_escape_string($calificacion['folio']) . "'" : 'NULL';

                $examenFinal_val = ($examenFinal === 'NULL') ? 'NULL' : $conn->real_escape_string($examenFinal);
                $examenFinal2_val = ($examenFinal2 === 'NULL') ? 'NULL' : $conn->real_escape_string($examenFinal2);
                $examenFinal3_val = ($examenFinal3 === 'NULL') ? 'NULL' : $conn->real_escape_string($examenFinal3);

                // Verificar si ya existe una entrada de calificación para este alumno, curso, materia y carrera
                $sql_check = "SELECT idCalificacion FROM calificaciones
                                 WHERE idAlumno = $idAlumno
                                 AND idCurso = $idCurso
                                 AND idMateria = $idMateria
                                 AND idCarrera = $idCarrera";
                $result_check = $conn->query($sql_check);

                if ($result_check->num_rows > 0) {
                    // Si ya existe, ACTUALIZAR las columnas 'examenFinal', 'examenFinal2', 'examenFinal3', 'tomo', 'folio'
                    $sql_update_final = "UPDATE calificaciones SET
                                                     examenFinal = $examenFinal_val,
                                                     examenFinal2 = $examenFinal2_val,
                                                     examenFinal3 = $examenFinal3_val,
                                                     tomo = $tomo,
                                                     folio = $folio
                                                     WHERE idAlumno = $idAlumno
                                                     AND idCurso = $idCurso
                                                     AND idMateria = $idMateria
                                                     AND idCarrera = $idCarrera";
                    if (!$conn->query($sql_update_final)) {
                        throw new Exception("Error al actualizar la calificación de mesa de examen final (Alumno ID: $idAlumno): " . $conn->error . " | SQL: " . $sql_update_final);
                    }
                } else {
                    // Si no existe, INSERTAR una nueva entrada con los datos clave y las notas del examen final, tomo y folio
                    // Los otros campos de calificación de cursada se insertarán como NULL por defecto
                    $sql_insert_final = "INSERT INTO calificaciones (idAlumno, idCurso, idMateria, idCarrera, examenFinal, examenFinal2, examenFinal3, tomo, folio)
                                                     VALUES ($idAlumno, $idCurso, $idMateria, $idCarrera, $examenFinal_val, $examenFinal2_val, $examenFinal3_val, $tomo, $folio)";
                    if (!$conn->query($sql_insert_final)) {
                        throw new Exception("Error al insertar la calificación de mesa de examen final (Alumno ID: $idAlumno): " . $conn->error . " | SQL: " . $sql_insert_final);
                    }
                }
            }
            $conn->commit();
            echo json_encode(["message" => "Calificaciones de mesa de examen final guardadas con éxito."]);

        } catch (Exception $e) {
            $conn->rollback();
            error_log("Error al guardar calificaciones de mesa de examen final: " . $e->getMessage());
            echo json_encode(["message" => "Error al guardar calificaciones de mesa de examen final: " . $e->getMessage()]);
        }
        break;

    default:
        echo json_encode(["error" => "Acción no válida."]);
        break;
}

$conn->close();
?>