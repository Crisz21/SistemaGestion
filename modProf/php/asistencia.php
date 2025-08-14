<?php

include 'conexion.php';


/**
 * Función para obtener todas las carreras de la base de datos.
 * @param mysqli $conn Objeto de conexión a la base de datos.
 * @return array Un array de objetos con los datos de las carreras.
 */
function obtenerCarreras(mysqli $conn): array
{
    $sql_carreras = "SELECT idCarrera, nombre FROM carrera ORDER BY nombre ASC"; // Ordenar para mejor visualización
    $result_carreras = $conn->query($sql_carreras);
    $carreras = [];
    if ($result_carreras) {
        while ($row = $result_carreras->fetch_assoc()) {
            $carreras[] = $row;
        }
    }
    return $carreras;
}

/**
 * Función para obtener las materias de la base de datos, opcionalmente filtradas por carrera.
 * Esta versión asume que la tabla 'materias' tiene directamente la columna 'idCarrera'.
 * @param mysqli $conn Objeto de conexión a la base de datos.
 * @param int|null $idCarrera El ID de la carrera para filtrar las materias.
 * @return array Un array de objetos con los datos de las materias.
 */
function obtenerMaterias(mysqli $conn, ?int $idCarrera = null): array
{
    $materias = [];
    $sql_materias = "SELECT idMateria, nombre FROM materias"; // Consulta inicial
    $types = "";
    $params = [];

    if ($idCarrera !== null) {
        // Añadir la condición WHERE directamente en la tabla materias
        $sql_materias .= " WHERE idCarrera = ?"; 
        $types = "i"; // 'i' para entero
        $params[] = $idCarrera;
    }
    $sql_materias .= " ORDER BY nombre ASC"; // Ordenar para mejor visualización

    $stmt = $conn->prepare($sql_materias);
    if (!$stmt) {
        error_log("Error al preparar la consulta de materias: " . $conn->error);
        // Podrías devolver un mensaje de error más específico si lo deseas
        return [];
    }

    if ($idCarrera !== null) {
        // Solo enlazar parámetros si idCarrera no es nulo
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    $result_materias = $stmt->get_result();

    if ($result_materias) {
        while ($row = $result_materias->fetch_assoc()) {
            $materias[] = $row;
        }
    }
    $stmt->close();
    return $materias;
}

/**
 * Función para obtener los alumnos de un curso y materia específicos.
 * Se asume que idAlumno en alumno_curso es el mismo que idUsuario (DNI) en usuarios.
 * @param int $idCurso El ID del curso.
 * @param int|null $idMateria El ID de la materia (opcional).
 * @param mysqli $conn Objeto de conexión a la base de datos.
 * @return array Un array de objetos con los datos de los alumnos.
 */
function obtenerAlumnos(int $idCurso, ?int $idMateria, mysqli $conn): array
{
    $sql = "SELECT ac.idAlumno, u.apellido, u.nombre, u.idUsuario AS dni
            FROM alumno_curso ac
            JOIN usuarios u ON ac.idAlumno = u.idUsuario
            JOIN curso c ON ac.idCurso = c.idCurso
            WHERE c.idCurso = ?";
    
    $types = "i"; // Tipo para idCurso (integer)
    $params = [$idCurso];

    if ($idMateria !== null && $idMateria !== 0) { // Considerar 0 como "no seleccionado"
        $sql .= " AND ac.idMateria = ?";
        $types .= "i"; // Tipo para idMateria (integer)
        $params[] = $idMateria;
    }
    
    // Preparar la consulta para evitar inyección SQL
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        error_log("Error al preparar la consulta de alumnos: " . $conn->error);
        return []; // Devolver array vacío en caso de error
    }

    // Usar call_user_func_array para bind_param con un array de parámetros
    // Esta forma es para compatibilidad con versiones antiguas o cuando los parámetros son dinámicos.
    // Con PHP 5.6+ y el operador '...' (splat operator), se simplifica como `$stmt->bind_param($types, ...$params);`
    $stmt->bind_param($types, ...$params);

    $stmt->execute();
    $result = $stmt->get_result();
    $alumnos = [];
    while ($row = $result->fetch_assoc()) {
        $alumnos[] = $row;
    }
    $stmt->close();
    return $alumnos;
}

/**
 * Función para guardar la asistencia de los alumnos.
 * @param array $asistenciaData Array con los datos de asistencia (fecha, idCurso, idMateria, idCarrera, asistencia).
 * @param mysqli $conn Objeto de conexión a la base de datos.
 * @return string Un JSON con un mensaje de éxito o error.
 */
function guardarAsistencia(array $asistenciaData, mysqli $conn): string
{
    // Sanear y validar los datos de entrada
    $fecha = filter_var($asistenciaData['fecha'], FILTER_SANITIZE_STRING); // La fecha viene como string
    $idCurso = filter_var($asistenciaData['idCurso'], FILTER_VALIDATE_INT);
    $idMateria = filter_var($asistenciaData['idMateria'], FILTER_VALIDATE_INT);
    $idCarrera = filter_var($asistenciaData['idCarrera'], FILTER_VALIDATE_INT);
    
    // Decodificar los datos de asistencia que vienen como una cadena JSON
    $asistencia = json_decode($asistenciaData['asistencia'], true); 

    // Validar que los datos decodificados sean un array y no estén vacíos
    if (!is_array($asistencia) || empty($asistencia)) {
        return json_encode(["error" => "Datos de asistencia no válidos o vacíos."]);
    }

    // Validar IDs y fecha
    if ($idCurso === false || $idCurso === null || 
        $idMateria === false || $idMateria === null || 
        $idCarrera === false || $idCarrera === null || 
        empty($fecha)) {
        return json_encode(["error" => "Datos de curso, materia, carrera o fecha incompletos o inválidos."]);
    }

    // Preparar la inserción de la asistencia de forma segura con prepared statements
    $stmt_insert_asistencia = $conn->prepare(
        "INSERT INTO asistencia (dni, idCurso, idMateria, fecha, asistencia, idCarrera) VALUES (?, ?, ?, ?, ?, ?)"
    );

    if (!$stmt_insert_asistencia) {
        error_log("Error al preparar la consulta de inserción de asistencia: " . $conn->error);
        return json_encode(["error" => "Error interno al preparar la consulta para guardar asistencia."]);
    }
    
    foreach ($asistencia as $idAlumno => $presente) {
        // idAlumno ya es el DNI (idUsuario) según la lógica establecida
        $dni = filter_var($idAlumno, FILTER_SANITIZE_STRING); // Sanitizar el DNI
        // Aseguramos que 'presente' sea 1 o 0 (tinyint)
        $estado_asistencia = ($presente == 1) ? 1 : 0; 

        // Vincular parámetros y ejecutar la inserción
        // 'siiiii' -> string (dni), integer (idCurso), integer (idMateria), string (fecha), integer (asistencia), integer (idCarrera)
        $stmt_insert_asistencia->bind_param("siiisi", $dni, $idCurso, $idMateria, $fecha, $estado_asistencia, $idCarrera);
        
        if (!$stmt_insert_asistencia->execute()) {
            error_log("Error al guardar asistencia para DNI {$dni}: " . $stmt_insert_asistencia->error);
            // No se detiene la ejecución, sino que se registra el error y se puede informar
            // Si quieres que un error detenga todo, puedes cambiar este flujo
            // Para este caso, simplemente registramos el error y continuamos si hay más asistencias
        }
    }
    $stmt_insert_asistencia->close();

    return json_encode(["success" => "Asistencia guardada con éxito."]);
}

// --- Procesamiento de solicitudes AJAX ---
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // Asegurarse de que la acción esté definida en la solicitud POST
    if (isset($_POST['accion'])) {
        $accion = $_POST['accion'];

        switch ($accion) {
            case 'obtenerCarreras':
                $carreras = obtenerCarreras($conn);
                echo json_encode($carreras);
                break;

            case 'obtenerMaterias':
                // Recoger el idCarrera si viene en la solicitud
                $idCarrera = filter_var($_POST['idCarrera'] ?? null, FILTER_VALIDATE_INT);
                $materias = obtenerMaterias($conn, $idCarrera); // Pasar el idCarrera a la función
                echo json_encode($materias);
                break;

            case 'buscarAlumnos':
                // Recopilar y sanear entradas, usando null por defecto para valores no válidos
                $idCarrera = filter_var($_POST['idCarrera'] ?? null, FILTER_VALIDATE_INT);
                $idMateria = filter_var($_POST['idMateria'] ?? null, FILTER_VALIDATE_INT);  
                $anioSeleccionado = filter_var($_POST['anio'] ?? '', FILTER_SANITIZE_STRING);
                $divisionSeleccionada = filter_var($_POST['division'] ?? '', FILTER_SANITIZE_STRING);

                // Validar entradas mínimas
                if ($idCarrera === false || $idCarrera === null || empty($anioSeleccionado) || empty($divisionSeleccionada)) {
                    echo json_encode(["error" => "Datos de búsqueda incompletos o inválidos (carrera, año o división)."]);
                    break;
                }

                // Obtener el idCurso basado en año, división y carrera
                $sql_curso = "SELECT idCurso FROM curso WHERE año = ? AND division = ? AND idCarrera = ?";
                $stmt_curso = $conn->prepare($sql_curso);
                if (!$stmt_curso) {
                    error_log("Error al preparar la consulta del curso: " . $conn->error);
                    echo json_encode(["error" => "Error interno al buscar el curso."]);
                    break;
                }
                $stmt_curso->bind_param("ssi", $anioSeleccionado, $divisionSeleccionada, $idCarrera);
                $stmt_curso->execute();
                $result_curso = $stmt_curso->get_result();

                if ($result_curso->num_rows > 0) {
                    $row_curso = $result_curso->fetch_assoc();
                    $idCurso = $row_curso['idCurso'];   // Obtener idCurso
                    $alumnos = obtenerAlumnos($idCurso, $idMateria, $conn);
                    // Devolver tanto los alumnos como el idCurso
                    echo json_encode(["alumnos" => $alumnos, "idCurso" => $idCurso]); 
                } else {
                    echo json_encode(["error" => "No se encontró un curso que coincida con los parámetros seleccionados."]);
                }
                $stmt_curso->close();
                break;

            case 'guardarAsistencia':
                // Asegurarse de que todos los datos necesarios para guardar asistencia estén presentes
                if (isset($_POST['fecha'], $_POST['idCurso'], $_POST['idMateria'], $_POST['idCarrera'], $_POST['asistencia'])) {
                    $asistenciaData = [
                        'fecha' => $_POST['fecha'],
                        'idCurso' => $_POST['idCurso'],
                        'idMateria' => $_POST['idMateria'],
                        'idCarrera' => $_POST['idCarrera'],
                        'asistencia' => $_POST['asistencia']
                    ];
                    echo guardarAsistencia($asistenciaData, $conn);
                } else {
                    echo json_encode(["error" => "Datos de asistencia incompletos o ausentes en la solicitud."]);
                }
                break;

            default:
                echo json_encode(["error" => "Acción no reconocida."]);
                break;
        }
    } else {
        echo json_encode(["error" => "No se especificó ninguna acción en la solicitud."]);
    }
}

// Cerrar la conexión a la base de datos al finalizar el script
$conn->close();
?>