<?php
session_start();
$nomUser = $_SESSION['nomUser'];
$idUsuario = $_SESSION['idUsuario'];
$apellidoUser = $_SESSION['apellidoUser'];
$idRolUser = $_SESSION['rolUser'];

if($_SERVER['REQUEST_METHOD'] == 'POST'){
    
    $datos=array('nomUser'=>$nomUser, 'idUsuario'=>$idUsuario,'apellidoUser'=>$apellidoUser, 'idROl'=>$idRolUser);
    header('Content-Type: application/json');
    echo json_encode($datos);
}

?>