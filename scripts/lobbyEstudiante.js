// funcion para mostrar el cartel de bienvenida al usuario
// Traer dos variables de SESSION globales desde varGlobales.php

function mostrarBienvenida(){
    $.ajax({
        type : 'POST',
        url: '../../php/varGlobales.php',
        dataType: 'json',
            success: function(datos){
                var nomUsuario = datos.nomUser;

                var userRol = localStorage.getItem('rol');
                
                var cartelBienvenida = "Bienvenid@, "+ nomUsuario +"!";
                document.getElementById("cartelBienvenida").innerHTML = cartelBienvenida;
                ComprobarRol(userRol);
            }, error:function(xhr, status,error){console.log('error: '+error);}
        });
};

function ComprobarRol(userRol){
    console.log(userRol);
    switch(userRol)
    {
        case "1":CargarMenuAlum();
        break;
        case "2":CargarMenuProf();
        break;
        case "3":CargarMenuAdmi();
        break;
    };
    
       
}



// Esto tiene el evento de todos los botones del lobbyEstudiante te redirecciona segun el boton que aprete el usuario
function CargarMenuAlum(){
    

            var btnMat = document.querySelector('.btn-materias');
            var btnDocument= document.querySelector('.btn-documentacion');
            var btnUsuario= document.querySelector('.btn-user');
            var btnPagWeb= document.querySelector('.btn-pagWeb');
            var btnCalAcademico = document.querySelector('.btn-calendar');
            
            btnMat.addEventListener('click', function(){
                window.location.href='./ALM_materias.html';
            });
            btnDocument.addEventListener('click', function(){
                window.location.href='./DocAlum.html';
            });
            btnUsuario.addEventListener('click', function(){
                window.location.href='./InfoAlum.html';
            });
            btnPagWeb.addEventListener('click', function(){
                window.location.href='https://isft172.edu.ar/';
            });

            btnCalAcademico.addEventListener('click', function(){
                window.location.href='./CalendarioC.html';
                console.log("clickk calendairo");
            });
        

 
}

function CargarMenuProf(){
    
        var btnCalificaciones = document.querySelector('.btn-calificaciones');
        var btnAsistencias= document.querySelector('.btn-asistencia');
        var btnCalendario = document.querySelector('.btn-calendario');
        var btnCartelera = document.querySelector('.btn-cartelera');
        var btnMisDatos = document.querySelector('.btn-mis-datos');

        btnCalificaciones.addEventListener('click',function(){
            console.log('calificaicones cliiiiick');
            window.location.href='./calificaciones.html';
        });

        btnAsistencias.addEventListener('click',function(){
            window.location.href='./asistencia.html';
        });

        btnCalendario.addEventListener('click',function(){
            window.location.href='./calendario.html';
        });

        btnCartelera.addEventListener('click',function(){
            window.location.href='./cartelera.html';
        });

        btnCalificaciones.addEventListener('click',function(){
            window.location.href='./calificaciones.html';
        });
        
        btnMisDatos.addEventListener('click',function(){
            window.location.href='./formulario_profesor.html';
        })

}

function CargarMenuAdmi(){
    var btnAltaCarrera = document.querySelector('.btn-alta-carrera');
    var btnAltaMateria = document.querySelector('.btn-alta-materia');
    var btnAltaAlum = document.querySelector('.btn-alta-alumno');
    var btnAltaProf = document.querySelector('.btn-alta-profesor');
    var btnAsignarAlum = document.querySelector('.btn-asignar-alumno');
    var btnAsignarProf = document.querySelector('.btn-asignar-profesor');
    var btnAsignarHorario= document.querySelector('.btn-asignar-horario');
    var btnExamenesFin = document.querySelector('.btn-examenes-finales');
    var btnSubirForm = document.querySelector('.btn-subir-formularios');

     btnAltaCarrera.addEventListener('click',function(){
        window.location.href='./abm_carrera.html';
    });
    btnAltaMateria.addEventListener('click',function(){
        window.location.href='./abm_materias.html';
    });
    btnAltaAlum.addEventListener('click',function(){
        window.location.href='./abm_alumno.html';
    });
    btnAltaProf.addEventListener('click',function(){
        window.location.href='./abm_profesor.html';
    });
    btnAsignarAlum.addEventListener('click',function(){
        window.location.href='./asignaciones_alumnos.html';
    });
    btnAsignarProf.addEventListener('click',function(){
        window.location.href='./asignaciones_profesores.html';
    });
    btnAsignarHorario.addEventListener('click',function(){
        window.location.href='./abm_horarios.html';
    });
    btnExamenesFin.addEventListener('click',function(){
        window.location.href='./examenes_finales.html';
    });
    btnSubirForm.addEventListener('click',function(){
        window.location.href='./subir_archivo.html';
    });

}


    

   