//Este script muestra o oculta los botones segun la ruta donde este el usuario, lo hace con un switch comparando las URL con el metodo
//pathname
$(window).on('load',function(){
    var $btnInicio = $("#btnAtras");
    var $btnSalir = $("#btnSalir");
    console.log($btnInicio.length);
    function mostrarSalir(){
      $btnInicio.hide();
      $btnSalir.show();
    }
  
    function mostrarInicio(){
      $btnInicio.show();
      $btnSalir.hide();
    }
    function LimpiarFormularios(){
      var formularios = document.querySelectorAll('form');
      formularios.forEach(function(formulario){
        formulario.reset();
      })
    };

    var rutasSalir=[
      "/modAlum/lobbyEstudiante.html",
      "/modAlum/panel_administrativo.html",
      "/modProf/panel_profesor.html"
    ];

    var rutaActual = window.location.pathname;
    /*
    switch(rutaActual){
        case "/modAlum/lobbyEstudiante.html":
        mostrarSalir();
        console.log("deberia mostrar el boton, al menos esta adentro del switch")
        case "/":
          LimpiarFormularios();
        break;
        case "/modAlum/ALM_materias.html":
        mostrarInicio();
        console.log("deberia mostrar el boton, al menos esta adentro del switch")
        break;
        case "/modAlum/CalendarioC.html":
        mostrarInicio();
        break;
        case "/modAlum/HistorialNotas.html":
          console.log("deberia mostrar el boton, al menos esta adentro del switch")
        mostrarInicio();
        break;
        case "/modAlum/InfoAlum.html":
        mostrarInicio();
        break;
        case "/modAlum/DocAlum.html":
        mostrarInicio();
        break;
    }
    */
    $btnSalir.on("click", function(){
      window.history.go(-window.history.length);
      window.localStorage.clear();
      window.location.replace('/');
      
      /*window.open('/','self');
      window.close;*/
     
    });
  
    $btnInicio.on("click", function(){
      window.location.href = "../modAlum/lobbyEstudiante.html";
    });
  });
/*window.onload = function(){
    var btnInicio = document.getElementById("btnAtras");
    var btnSalir = document.getElementById("btnSalir");
    
    function mostrarSalir(){
        btnInicio.style.display="none";
        btnSalir.style.display="block";
    }
    function mostrarInicio(){
        btnInicio.style.display="block";
        btnSalir.style.display="none";
    }
    const rutaActual = window.location.pathname;
    
            switch(rutaActual){
                case "/lobbyEstudiante.html": mostrarSalir()
                    break;
                case "/ALM_materias.html": mostrarInicio()
                    break;
            }

            btnSalir.addEventListener("click",function(){
                window.location.href="/";
            })
            btnInicio.addEventListener("click", function(){
                window.location.href="/lobbyEstudiante.html"
            })
    
    
};*/
