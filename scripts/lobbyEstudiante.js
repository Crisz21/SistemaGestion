// funcion para mostrar el cartel de bienvenida al usuario
// Traer dos variables de SESSION globales desde varGlobales.php
function mostrarBienvenida(){
    $.ajax({
        type : 'POST',
        url: '../php/varGlobales.php',
        dataType: 'json',
            success: function(datos){
                var nomUsuario = datos.nomUser;
                
                var cartelBienvenida = "Bienvenid@, "+ nomUsuario +"!";
                
                document.getElementById("cartelBienvenida").innerHTML = cartelBienvenida;
            }, error:function(xhr, status,error){console.log('error: '+error);}
        });
};



// Esto tiene el evento de todos los botones del lobbyEstudiante te redirecciona segun el boton que aprete el usuario
document.addEventListener("DOMContentLoaded", function(){

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
        });
       

});

    

   