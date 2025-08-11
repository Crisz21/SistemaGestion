<?php
require_once 'conexionDB.php';

$usuario= $_POST['usuario'];
$contraseña= $_POST['contraseña'];
$sql="SELECT * FROM login WHERE correo='$usuario' AND contraseña='$contraseña'";
$result = mysqli_query($conn,$sql);

if(mysqli_num_rows($result)>0){
    $query="SELECT u.idUsuario, u.nombre, u.apellido,u.idRol FROM usuarios u  JOIN login l ON  u.idUsuario = l.idUsuario WHERE l.correo = '$usuario'";
    $result_usuario = mysqli_query($conn,$query);
    $row=mysqli_fetch_assoc($result_usuario);
    $nomUser=$row['nombre'];
    $idUsuario =$row['idUsuario'];
    $apellidoUser = $row['apellido'];
    $idRolUser = $row ['idRol'];
    echo json_encode(array (
        'status' => 'ok',
        'idRol' => $idRolUser
    ));
    session_start();
    $_SESSION['nomUser']=$nomUser;
    $_SESSION['idUsuario']=$idUsuario;
    $_SESSION['apellidoUser'] = $apellidoUser;
    $_SESSION['idRol'] = $idRolUser;
    
}else{
    echo 'false';
}





/*$query="SELECT idUsuario, nombre FROM usuarios where correo='$usuario'";
$result_usuario = mysqli_query($conn,$query);

if(mysqli_num_rows($result_usuario)>0){
    $row=mysqli_fetch_assoc($result_usuario);
    $nomUser=$row['nombre'];
    $idUsuario =$row['idUsuario'];
    session_start();
    $_SESSION['nomUser']=$nomUser;
    $_SESSION['idUsuario']=$idUsuario;
}else{
    echo "Usuario o contraseña incorrectos";
}*/

mysqli_close($conn);


/*if(!empty($_POST["IniciarSesion"])){
    if(empty($_POST["usuario"])and empty($_POST["contraseña"])){
        echo '<div class:"alert">Los campos estan vacios"</div>';
    } else{
            $usuario = $_POST["usuario"];
            $clave = $_POST["contraseña"];
            $sql = $conn->query(" select * from login where correo='$usuario' and contraseña= '$clave'");
        if($datos=$sql->fetch_object()){
            $sql_usuario = "select idUsuario, nombre from usuarios where correo = '$usuario'";
            $result_usuario = $conn->query($sql_usuario);
            { while ($fila = $result_usuario->fetch_assoc()){
                session_start();
                $_SESSION['nomUser'] = $fila['nombre'];
                $_SESSION['IdUser'] = $fila['idUsuario'];
            } 
            }
            //$datos_usuario = traerId($usuario,$conn);
            //$_SESSION['nombre'] = $nomUser;
            header("Location:lobbyEstudiante.php");
            exit;
        }else{
            echo '<div class:"alert">Usuario o contraseña incorrectos</div>';
        }
    }
}

if (isset($_POST ['salir'])&& $_POST['salir'] == 'true')
{
    session_start();
    session_destroy();
    header('Location:./index.php');
    exit;
}

$conn->close();
?>*/