<?php
session_start();

include 'conexion.php'; 

header('Content-Type: application/json');

// 1. Verificar si el usuario está logueado
if (!isset($_SESSION['idUsuario'])) {
    echo json_encode([
        'success' => false,
        'message' => 'No se ha iniciado sesión o el ID de usuario no está disponible.'
    ]);
    exit;
}

$idUsuarioActual = $_SESSION['idUsuario'];

// 2. Consulta principal de los datos del profesor
$sql = "SELECT 
            u.idUsuario, 
            u.nombre, 
            u.apellido, 
            u.correo, 
            u.telefono, 
            CONCAT(u.calle, ' ', u.nroAltura) AS direccion,
            u.piso, 
            u.dpto, 
            u.codigoPostal, 
            u.localidad, 
            u.provincia, 
            c.nombre AS carrera
        FROM usuarios u
        JOIN rol r ON u.idRol = r.idRol
        LEFT JOIN carrera c ON u.idRol = 2  
        WHERE u.idUsuario = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $idUsuarioActual);
$stmt->execute();
$result = $stmt->get_result();

$profesor = $result->fetch_assoc();

// 3. Si no se encuentra el profesor, devuelve un error
if (!$profesor) {
    echo json_encode([
        'success' => false,
        'message' => 'No se encontró un profesor con el ID de usuario ' . $idUsuarioActual . ' en la base de datos.'
    ]);
    $stmt->close();
    $conn->close();
    exit;
}

// 4. Consulta de la contraseña
$sql_contrasena = "SELECT contraseña FROM login WHERE idUsuario = ?";
$stmt_contrasena = $conn->prepare($sql_contrasena);
$stmt_contrasena->bind_param("i", $idUsuarioActual);
$stmt_contrasena->execute();
$result_contrasena = $stmt_contrasena->get_result();

$contrasena = $result_contrasena->fetch_assoc()['contraseña'] ?? null;

// 5. Devolver la información del profesor en formato JSON
echo json_encode([
    'success' => true,
    'idUsuario' => $profesor['idUsuario'],
    'nombre' => $profesor['nombre'],
    'apellido' => $profesor['apellido'],
    'correo' => $profesor['correo'],
    'telefono' => $profesor['telefono'],
    'direccion' => $profesor['direccion'],
    'piso' => $profesor['piso'],
    'dpto' => $profesor['dpto'],
    'codigoPostal' => $profesor['codigoPostal'],
    'localidad' => $profesor['localidad'],
    'provincia' => $profesor['provincia'],
    'carrera' => $profesor['carrera'],
    'contrasena' => $contrasena
]);

$stmt->close();
$stmt_contrasena->close();
$conn->close();
?>