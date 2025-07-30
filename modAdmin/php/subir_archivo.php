<?php
// Definir la ruta de subida
$uploadDir = "../uploads/"; // Ajustamos la ruta relativa

// Lógica para subir un archivo
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['pdfFile'])) {
    $file = $_FILES['pdfFile'];

    // Verificar si el archivo es un PDF
    $fileExtension = pathinfo($file['name'], PATHINFO_EXTENSION);
    if ($fileExtension === 'pdf') {
        // Crear el directorio de carga si no existe
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $targetFile = $uploadDir . basename($file['name']);

        // Mover el archivo al directorio de carga
        if (move_uploaded_file($file['tmp_name'], $targetFile)) {
            $response = ['status' => 'success', 'message' => 'Formulario PDF cargado exitosamente.'];
        } else {
            $response = ['status' => 'error', 'message' => 'Error al cargar el archivo.'];
        }
    } else {
        $response = ['status' => 'error', 'message' => 'Por favor, selecciona un archivo PDF.'];
    }
    header('Content-Type: application/json');
    echo json_encode($response);
    exit(); // Importante para detener la ejecución después de enviar la respuesta JSON
}

// Lógica para eliminar un archivo
if (isset($_POST['deleteFile']) && !empty($_POST['deleteFile'])) {
    $fileToDelete = $_POST['deleteFile'];
    $filePath = $uploadDir . $fileToDelete;

    // Eliminar el archivo si existe
    if (file_exists($filePath)) {
        if (unlink($filePath)) {
            $response = ['status' => 'success', 'message' => 'Archivo eliminado exitosamente.'];
        } else {
            $response = ['status' => 'error', 'message' => 'Error al eliminar el archivo.'];
        }
    } else {
        $response = ['status' => 'error', 'message' => 'El archivo no existe.'];
    }
    header('Content-Type: application/json');
    echo json_encode($response);
    exit(); // Importante para detener la ejecución después de enviar la respuesta JSON
}

// Lógica para obtener la lista de archivos subidos
if (isset($_GET['listFiles'])) {
    $uploadedFiles = [];
    if (is_dir($uploadDir)) {
        $uploadedFiles = array_diff(scandir($uploadDir), array('.', '..')); // Eliminar . y .. de la lista
    }
    header('Content-Type: application/json');
    echo json_encode(['files' => array_values($uploadedFiles)]); // Devolvemos un array indexado
    exit();
}
?>