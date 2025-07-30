<?php
// Conectar a la base de datos
$servername = "localhost";  
$username = "root";        
$password = "";            
$dbname = "sistemaeducativo"; 

// Crear la conexión
$conn = new mysqli($servername, $username, $password, $dbname);

// Comprobar la conexión
if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
}

// Consultar los datos del primer profesor en la base de datos
$sql = "SELECT u.idUsuario, u.nombre, u.apellido, u.correo, u.telefono, u.calle, u.nroAltura, u.piso, u.codigoPostal, u.dpto, u.localidad, u.provincia, c.nombre AS carrera
        FROM usuarios u
        JOIN rol r ON u.idRol = r.idRol
        LEFT JOIN carrera c ON u.idRol = 2  -- Solo profesores (rol 2)
        WHERE r.nombreRol = 'Profesor' LIMIT 1"; // Selecciona el primer profesor
$result = $conn->query($sql);

// Si se encuentra el profesor, asignamos los datos a las variables
$profesor = null;
if ($result->num_rows > 0) {
    $profesor = $result->fetch_assoc();
} else {
    die("No se encontraron profesores en la base de datos.");
}

// Consultar la contraseña del profesor en la tabla login
$sql_contrasena = "SELECT contraseña FROM login WHERE idUsuario = ".$profesor['idUsuario'];
$result_contrasena = $conn->query($sql_contrasena);
$contrasena = null;
if ($result_contrasena->num_rows > 0) {
    $contrasena = $result_contrasena->fetch_assoc()['contraseña'];
} else {
    die("No se encontró la contraseña para este usuario.");
}

// Cerrar la conexión
$conn->close();

// Enviar los datos en formato JSON
echo json_encode([
    'idUsuario' => $profesor['idUsuario'],
    'nombre' => $profesor['nombre'],
    'apellido' => $profesor['apellido'],
    'correo' => $profesor['correo'],
    'telefono' => $profesor['telefono'],
    'direccion' => $profesor['calle'] . ' ' . $profesor['nroAltura'],
    'piso' => $profesor['piso'],
    'dpto' => $profesor['dpto'],
    'codigoPostal' => $profesor['codigoPostal'],
    'localidad' => $profesor['localidad'],
    'provincia' => $profesor['provincia'],
    'carrera' => $profesor['carrera'],
    'contrasena' => $contrasena
]);
?>
