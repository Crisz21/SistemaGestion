<?php
include 'conexionDB.php';
//Esta funcion obtiene el rol del usuario para mostrar el menu que corresponda en el calendario
session_start();
$idRolUser = $_SESSION['rolUser'];
$nomUser = $_SESSION['nomUser'];
$idUser = $_SESSION['idUsuario'];

if ($_POST["accion"]=="obtenerInfoProf")
    {
       obtenerInfoProf($idUser,$conn); 
    }
if ($_POST["accion"]=="verRol")
{
    echo json_encode ($idRolUser);
}
if ($_POST["accion"]=="crearEvento")
    {
        $tipoExamen= $_POST ['valorTipoExamen'];
        $fechaHora= $_POST ['fechaHora'];
        $descripcion= $_POST ['descripcion'];
        $curso = $_POST ['curso'];
        $carrera = $_POST ['carrera'];
        $materia = $_POST ['materia'];
        CrearEventosCal($tipoExamen,$fechaHora,$descripcion,$curso,$carrera,$materia,$conn);
       
    }


    function obtenerInfoProf($idUser,$conn){
        $resultado = mysqli_query($conn,"CALL sp_ObtenerInfoProf($idUser)");
        if (!$resultado){
            die("error en la consulta:" . mysqli_error($conn));
        } else {
            
            $datos = array();
            while ($fila = mysqli_fetch_assoc($resultado)){
                $datos[] = $fila;
                
            }
            echo json_encode($datos);
        }
       
    }

    function CrearEventosCal($tipoExamen,$fechaHora,$descripcion,$curso,$carrera,$materia,$conn){
        $resultado = mysqli_query($conn,"CALL sp_insertarEventos('$tipoExamen','$fechaHora','$descripcion','$curso','$materia','$carrera')");
        if (!$resultado){
            echo json_encode(array('error' => mysqli_error($conn)));
        }else {
            echo json_encode(array('succes'=> true));
        }
    }
    
?>