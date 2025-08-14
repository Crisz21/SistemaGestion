<?php

include 'conexion.php'; // Asegúrate de que este archivo maneje la conexión a la base de datos

// Función auxiliar para pasar argumentos por referencia a bind_param si es necesario
// Esto es para PHP < 8.1 cuando se usa call_user_func_array con bind_param
// Si usas PHP 8.1+ y el unpacking de arrays, esta función no es estrictamente necesaria.
function refValues($arr){
    if (strnatcmp(phpversion(),'5.3') >= 0) // PHP 5.3+
    {
        $refs = array();
        foreach($arr as $key => $value)
            $refs[$key] = &$arr[$key];
        return $refs;
    }
    return $arr;
}


if (isset($_GET['action'])) {
    $action = $_GET['action'];

    // Acción para obtener todas las carreras
    if ($action == 'getCarreras') {
        $sql = "SELECT * FROM carrera";
        $result = $conn->query($sql);
        $carreras = [];
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $carreras[] = $row;
            }
        }
        echo json_encode($carreras);
    }

    // Acción para obtener materias que pueden ser correlativas
    // Opcionalmente, permite filtrar por idCarrera
    if ($action == 'getCorrelativas') {
        $idCarrera = isset($_GET['idCarrera']) ? $_GET['idCarrera'] : null;

        $sql = "SELECT idMateria, nombre FROM materias"; 
        $params = [];
        $types = "";

        if ($idCarrera) {
            $sql .= " WHERE idCarrera = ?"; // Añadir condición si se proporciona idCarrera
            $params[] = $idCarrera;
            $types .= "i"; // 'i' para entero
        }

        $stmt = $conn->prepare($sql);
        
        if ($stmt) {
            if ($idCarrera) { // Solo si hay parámetros para enlazar
                // Enlazar parámetros dinámicamente para la consulta preparada
                call_user_func_array([$stmt, 'bind_param'], refValues(array_merge([$types], $params)));
            }
            $stmt->execute();
            $result = $stmt->get_result();
            $materias = [];
            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    $materias[] = $row;
                }
            }
            echo json_encode($materias);
            $stmt->close();
        } else {
            echo json_encode(["error" => "Error al preparar la declaración para obtener correlativas: " . $conn->error]);
        }
    }

    // Acción para obtener todas las materias registradas junto con el nombre de su carrera y los nombres de sus correlativas
    if ($action == 'getMaterias') {
        $sql = "SELECT m.*, c.nombre AS carrera_nombre FROM materias m JOIN carrera c ON m.idCarrera = c.idCarrera";
        $result = $conn->query($sql);
        $materias = [];
        
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $materia = $row;
                $correlativa_ids_str = $materia['correlativa']; // Obtener la cadena de IDs de correlativas
                $correlativa_nombres = [];

                // Procesar IDs de correlativas si existen y no son el valor por defecto '-'
                if (!empty($correlativa_ids_str) && $correlativa_ids_str != '-') {
                    $correlativa_ids = explode(',', $correlativa_ids_str);
                    
                    // Limpiar y asegurar que todos los IDs sean enteros para la consulta IN
                    $safe_correlativa_ids = array_filter(array_map('intval', $correlativa_ids));

                    if (!empty($safe_correlativa_ids)) {
                        // Crear placeholders para la cláusula IN de la consulta preparada
                        $placeholders = implode(',', array_fill(0, count($safe_correlativa_ids), '?'));
                        $sql_correlativas = "SELECT nombre FROM materias WHERE idMateria IN ($placeholders)";
                        $stmt_correlativas = $conn->prepare($sql_correlativas);
                        
                        if ($stmt_correlativas) {
                            // Enlazar parámetros dinámicamente
                            $types = str_repeat('i', count($safe_correlativa_ids));
                            call_user_func_array([$stmt_correlativas, 'bind_param'], refValues(array_merge([$types], $safe_correlativa_ids)));
                            
                            $stmt_correlativas->execute();
                            $result_correlativas = $stmt_correlativas->get_result();
                            
                            if ($result_correlativas) {
                                while ($correlativa_row = $result_correlativas->fetch_assoc()) {
                                    $correlativa_nombres[] = $correlativa_row['nombre'];
                                }
                            }
                            $stmt_correlativas->close();
                        } else {
                            error_log("Error preparing correlativas statement: " . $conn->error);
                        }
                    }
                }
                $materia['correlativa_nombres'] = $correlativa_nombres; // Añadir un array de nombres de correlativas a la materia
                $materias[] = $materia;
            }
        } else {
            error_log("Error getting materias: " . $conn->error);
        }
        echo json_encode($materias);
    }

    // Acción para guardar una nueva materia
    if ($action == 'guardarMateria') {
        $nombre = $_POST['nombre'];
        $año = $_POST['año'];
        $modalidad = $_POST['modalidad'];
        $division = $_POST['division'];
        $idCarrera = $_POST['idCarrera'];
        
        // Determinar el valor de correlativa (cadena de IDs o '-')
        $correlativa = isset($_POST['correlativa']) && !empty($_POST['correlativa']) ? $_POST['correlativa'] : '-';

        $sql = "INSERT INTO materias (nombre, año, correlativa, modalidad, division, idCarrera) 
                VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        
        if ($stmt) {
            // Enlazar parámetros de la consulta preparada
            $stmt->bind_param("sssssi", $nombre, $año, $correlativa, $modalidad, $division, $idCarrera);

            if ($stmt->execute()) {
                echo json_encode(["success" => "Materia guardada correctamente."]);
            } else {
                echo json_encode(["error" => "Error al guardar la materia: " . $stmt->error]);
            }
            $stmt->close();
        } else {
            echo json_encode(["error" => "Error al preparar la declaración de guardado: " . $conn->error]);
        }
    }

    // Acción para eliminar una materia por su ID
    if ($action == 'eliminarMateria') {
        $idMateria = $_GET['idMateria'];
        $sql = "DELETE FROM materias WHERE idMateria = ?";
        $stmt = $conn->prepare($sql);
        
        if ($stmt) {
            // Enlazar parámetro de la consulta preparada
            $stmt->bind_param("i", $idMateria);

            if ($stmt->execute()) {
                echo json_encode(["success" => "Materia eliminada correctamente."]);
            } else {
                echo json_encode(["error" => "Error al eliminar la materia: " . $stmt->error]);
            }
            $stmt->close();
        } else {
            echo json_encode(["error" => "Error al preparar la declaración de eliminación: " . $conn->error]);
        }
    }

    // Acción para obtener una materia por su ID para edición
    if ($action == 'getMateriaById') {
        $idMateria = $_GET['idMateria'];
        $sql = "SELECT * FROM materias WHERE idMateria = ?";
        $stmt = $conn->prepare($sql);
        
        if ($stmt) {
            // Enlazar parámetro de la consulta preparada
            $stmt->bind_param("i", $idMateria);
            $stmt->execute();
            $result = $stmt->get_result();
            $materia = $result->fetch_assoc();
            echo json_encode([$materia]); // Devuelve un array con un solo objeto materia
            $stmt->close();
        } else {
            echo json_encode(["error" => "Error al preparar la declaración para obtener materia por ID: " . $conn->error]);
        }
    }

    // Acción para actualizar una materia existente
    if ($action == 'actualizarMateria') {
        $idMateria = $_GET['idMateria'];
        $nombre = $_POST['nombre'];
        $año = $_POST['año'];
        $modalidad = $_POST['modalidad'];
        $division = $_POST['division'];
        $idCarrera = $_POST['idCarrera'];
        
        // Determinar el valor de correlativa (cadena de IDs o '-')
        $correlativa = isset($_POST['correlativa']) && !empty($_POST['correlativa']) ? $_POST['correlativa'] : '-';

        $sql = "UPDATE materias SET nombre = ?, año = ?, correlativa = ?, modalidad = ?, division = ?, idCarrera = ? WHERE idMateria = ?";
        $stmt = $conn->prepare($sql);
        
        if ($stmt) {
            // Enlazar parámetros de la consulta preparada
            $stmt->bind_param("ssssssi", $nombre, $año, $correlativa, $modalidad, $division, $idCarrera, $idMateria);

            if ($stmt->execute()) {
                echo json_encode(["success" => "Materia actualizada correctamente."]);
            } else {
                echo json_encode(["error" => "Error al actualizar la materia: " . $stmt->error]);
            }
            $stmt->close();
        } else {
            echo json_encode(["error" => "Error al preparar la declaración de actualización: " . $conn->error]);
        }
    }
}
?>