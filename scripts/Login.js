//En este bloque se validan los datos del usuario con la base de datos, y si hay algun error de contraseña le envia un mensaje y cambia los estilos del documento css
$(document).ready(function(){
    var msjError = document.querySelector('#Mensaje');
    var user = document.querySelector('#nomUsuario');
    var pass = document.querySelector('#contraseña');
    function mostrarMsj(){
        msjError.style.display = 'block';
        user.focus();
        user.value="";
        pass.value="";
        user.addEventListener('focus',function(){
            user.style.outline="none";
            user.style.boxShadow = '0 0 0 2px red';
        });
        pass.addEventListener('focus',function(){
            pass.style.boxShadow = '0 0 0 2px red)';
            pass.style.outline="none";
        })
        user.style.border = '2px solid red';
        pass.style.border='2px solid red';
    }
    
    //Este bloque Le manda los datos al documento varGlobales.php para corroborar si los datos del usuario son correctos.
    //Si varGlobales le responde con un "ok" se inicia session, se guardan los datos del usuario, sino se muestra un mensaje de error de contraseña. 
    $('#login-form').submit(function(event){
        console.log("se hizo click")
        event.preventDefault();
        var usuario=$('#nomUsuario').val();
        var contraseña=$('#contraseña').val();
            $.ajax({
                type:'POST',
                url:'../php/login.php',
                data:{usuario: usuario, contraseña: contraseña },
                dataType:'json',
                success: function(data){
                    if(data.status ==='ok'){
                        var idRol = data.idRol;
                        console.log("se recibio el ok aca adentro y el rol es" + idRol);
                        switch (idRol){
                            
                            case '1': window.location.href= './modAlum/lobbyEstudiante.html';
                                break;
                            case '2': window.location.href= './modProf/html/panel_profesor.html';
                                break;
                            case '3': window.location.href= './modAdmin/html/panel_administrativo.html';
                                break;
                        }
                    }else{
                        mostrarMsj();
                    };
                },error: function(xhr,status,error){
                    console.log(error);
                }
            });
    });
});
