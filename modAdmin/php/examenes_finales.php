<?php
// Conectar a la base de datos
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "sistemaeducativo";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode(['error' => "Conexión fallida: " . $conn->connect_error]));
}

header('Content-Type: application/json');

// Determinar la acción a realizar según el parámetro 'accion'
$accion = $_GET['accion'] ?? $_POST['accion'] ?? '';

switch ($accion) {
    case 'cargar_carreras':
        $sql_carreras = "SELECT idCarrera, nombre FROM carrera";
        $result_carreras = $conn->query($sql_carreras);
        $carreras = [];
        while ($row = $result_carreras->fetch_assoc()) {
            $carreras[] = $row;
        }
        echo json_encode($carreras);
        break;

    case 'cargar_materias':
        $sql_materias = "SELECT idMateria, nombre FROM materias";
        $result_materias = $conn->query($sql_materias);
        $materias = [];
        while ($row = $result_materias->fetch_assoc()) {
            $materias[] = $row;
        }
        echo json_encode($materias);
        break;

    case 'listar_examenes':
        $sql = "SELECT e.idExamen, e.fecha, e.hora, m.nombre AS materia, c.nombre AS carrera, cu.año, cu.division, e.llamado
                FROM examenes_finales e
                JOIN materias m ON e.idMateria = m.idMateria
                JOIN carrera c ON e.idCarrera = c.idCarrera
                JOIN curso cu ON e.idCurso = cu.idCurso";
        $result = $conn->query($sql);
        $examenes = [];
        while ($row = $result->fetch_assoc()) {
            $examenes[] = $row;
        }
        echo json_encode($examenes);
        break;

    case 'obtener_examen':
        $idExamen = $_GET['editar_id'] ?? null;
        if ($idExamen) {
            $sql_editar = "SELECT e.idExamen, e.fecha, e.hora, m.idMateria, m.nombre AS materia, c.idCarrera, c.nombre AS carrera, cu.año, cu.division, e.llamado
                                   FROM examenes_finales e
                                   JOIN materias m ON e.idMateria = m.idMateria
                                   JOIN carrera c ON e.idCarrera = c.idCarrera
                                   JOIN curso cu ON e.idCurso = cu.idCurso
                                   WHERE e.idExamen = ?";
            $stmt_editar = $conn->prepare($sql_editar);
            $stmt_editar->bind_param("i", $idExamen);
            $stmt_editar->execute();
            $result_editar = $stmt_editar->get_result();

            if ($result_editar->num_rows > 0) {
                $examen = $result_editar->fetch_assoc();
                echo json_encode($examen);
            } else {
                echo json_encode(['error' => 'Examen no encontrado.']);
            }
        } else {
            echo json_encode(['error' => 'ID de examen no proporcionado.']);
        }
        break;

    case 'guardar_examen':
        $idMateria = $_POST['idMateria'] ?? null;
        $fecha = $_POST['fecha'] ?? null;
        $hora = $_POST['hora'] ?? null;
        $idCarrera = $_POST['idCarrera'] ?? null;
        $año = $_POST['año'] ?? null;
        $division = $_POST['division'] ?? null;
        $llamado = $_POST['llamado'] ?? null;
        $editar_id = $_POST['editar_id'] ?? null;

        if ($idMateria && $fecha && $hora && $idCarrera && $año && $division && $llamado) {
            // Validar la fecha en el servidor
            $fecha_obj = DateTime::createFromFormat('Y-m-d', $fecha);
            $año_actual = (int)date('Y');

            if (!$fecha_obj || $fecha_obj->format('Y-m-d') !== $fecha || (int)$fecha_obj->format('Y') < $año_actual) {
                echo json_encode(['error' => 'Por favor, ingrese una fecha válida y no anterior al año actual.']);
                break;
            }

            // Buscar el idCurso correspondiente al año y división seleccionados
            $sql_curso = "SELECT idCurso FROM curso WHERE año = ? AND division = ?";
            $stmt_curso = $conn->prepare($sql_curso);
            $stmt_curso->bind_param("ss", $año, $division);
            $stmt_curso->execute();
            $result_curso = $stmt_curso->get_result();

            if ($result_curso->num_rows > 0) {
                $row_curso = $result_curso->fetch_assoc();
                $idCurso = $row_curso['idCurso'];

                // Verificación de datos duplicados (ahora permite el mismo examen con diferente llamado)
                $sql_check = "SELECT 1 FROM examenes_finales
                                  WHERE idMateria = ? AND fecha = ? AND hora = ? AND idCarrera = ? AND idCurso = ? AND llamado = ?";
                $stmt_check = $conn->prepare($sql_check);
                $stmt_check->bind_param("sssiii", $idMateria, $fecha, $hora, $idCarrera, $idCurso, $llamado);
                $stmt_check->execute();
                $result_check = $stmt_check->get_result();

                if ($result_check->num_rows > 0 && !$editar_id) {
                    echo json_encode(['error' => "Este examen ya ha sido asignado con los mismos detalles."]);
                } else {
                    if ($editar_id) {
                        // Si estamos editando, actualizar el examen
                        $sql = "UPDATE examenes_finales SET idMateria=?, fecha=?, hora=?, idCarrera=?, idCurso=?, llamado=? WHERE idExamen=?";
                        $stmt = $conn->prepare($sql);
                        $stmt->bind_param("sssiiis", $idMateria, $fecha, $hora, $idCarrera, $idCurso, $llamado, $editar_id);

                        if ($stmt->execute()) {
                            echo json_encode(['success' => "Examen actualizado exitosamente."]);
                        } else {
                            echo json_encode(['error' => "Error al actualizar el examen: " . $stmt->error]);
                        }
                    } else {
                        // Si es nuevo, insertar el nuevo examen en la tabla examenes_finales
                        $sql = "INSERT INTO examenes_finales (idMateria, fecha, hora, idCarrera, idCurso, llamado)
                                      VALUES (?, ?, ?, ?, ?, ?)";
                        $stmt = $conn->prepare($sql);
                        $stmt->bind_param("sssiii", $idMateria, $fecha, $hora, $idCarrera, $idCurso, $llamado);

                        if ($stmt->execute()) {
                            echo json_encode(['success' => "Examen asignado exitosamente."]);
                        } else {
                            echo json_encode(['error' => "Error al asignar el examen: " . $stmt->error]);
                        }
                    }
                }
            } else {
                echo json_encode(['error' => "No se encontró un curso para el año y la división seleccionados."]);
            }
        } else {
            echo json_encode(['error' => "Por favor, complete todos los campos."]);
        }
        break;

    case 'eliminar_examen':
        $idExamen = $_POST['idExamen'] ?? null;
        if ($idExamen) {
            $sql = "DELETE FROM examenes_finales WHERE idExamen = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $idExamen);

            if ($stmt->execute()) {
                echo json_encode(['success' => "Examen eliminado exitosamente."]);
            } else {
                echo json_encode(['error' => "Error al eliminar el examen."]);
            }
        } else {
            echo json_encode(['error' => "ID de examen no proporcionado para eliminar."]);
        }
        break;

    default:
        echo json_encode(['error' => "Acción no válida."]);
        break;
}

$conn->close();
?>