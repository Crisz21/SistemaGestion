<?php 
        include 'conexionDB.php';
        session_start();
        $idUsuario = $_SESSION['idUsuario'];


        if ($_POST['accion'] == 'ObtenerMateriasAlumno'){
            ObtenerMateriasAlumno($idUsuario,$conn);
        }elseif($_POST['accion'] == 'obtenerExamenes'){
            $materia = $_POST['materia'];
            ObtenerExamenPorMateria($materia,$idUsuario,$conn);
        }elseif($_POST['accion'] == 'obtenerinfoAlum'){
            obtenerDatosAlumnos($idUsuario,$conn);}


        function ObtenerMateriasAlumno($idUsuario,$conn){
            $query = "CALL ObtenerMateriasAlumno($idUsuario)";
        $resultado = mysqli_query($conn, $query); 
            while ($fila = $resultado->fetch_assoc()){
                $data[]=$fila;
            }
            
        mysqli_close($conn);
        echo json_encode($data);
        }

        function ObtenerExamenPorMateria($materia,$idUsuario,$conn)
        {
            $query = "CALL ObtenerDatosExamen ($idUsuario,'$materia')";
            $resultado = mysqli_query($conn,$query);
            while ($fila=$resultado->fetch_assoc()){
                $data[]=$fila;
            }
            mysqli_close($conn);
            echo json_encode($data);
        }

        function obtenerDatosAlumnos($idUsuario,$conn){
            $query = "CALL ObtenerDatosUsuario ($idUsuario)";
            $resultado = mysqli_query($conn,$query);
            while ($fila=$resultado->fetch_assoc()){
                $data[]=$fila;
            }
            mysqli_close($conn);
            echo json_encode($data);
        }

        
        
?>