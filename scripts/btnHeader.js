$(window).on('load', function() {
  var $btnInicio = $("#btnAtras");
  var $btnSalir = $("#btnSalir");
  // Objeto que mapea rutas con acciones
  var rutaAcciones = {

    //Mapeo de rutas Alumno
    "/modAlum/lobbyEstudiante.html": "mostrarSalir",
    "/modProf/html/panel_profesor.html": "mostrarSalir",
    "/modAlum/ALM_materias.html": "mostrarInicio",
    "/modAlum/CalendarioC.html": "mostrarInicio",
    "/modAlum/HistorialNotas.html": "mostrarInicio",
    "/modAlum/InfoAlum.html": "mostrarInicio",
    "/modAlum/DocAlum.html": "mostrarInicio",

    //mapeo de rutas Administrativo
    "/modAdmin/html/panel_administrativo.html": "mostrarSalir",
    "/modAdmin/html/abm_alumno.html":"mostrarInicio",
    "/modAdmin/html/abm_carrera.html":"mostrarInicio",
    "/modAdmin/html/abm_horarios.html":"mostrarInicio",
    "/modAdmin/html/abm_materias.html":"mostrarInicio",
    "/modAdmin/html/abm_profesor.html":"mostrarInicio",
    "/modAdmin/html/asignaciones_alumnos.html":"mostrarInicio",
    "/modAdmin/html/asignaciones_profesores.html":"mostrarInicio",
    "/modAdmin/html/descargar_archivo.html":"mostrarInicio",
    "/modAdmin/html/examenes_finales.html":"mostrarInicio",
    "/modAdmin/html/subir_archivo.html":"mostrarInicio",

    //Mapeo de rutas Profesor
    "modProf/html/asistencia.html":"mostrarInicio",
    "modProf/html/calendario.html":"mostrarInicio",
    "modProf/html/calificaciones.html":"mostrarInicio",
    "modProf/html/formulario_profesor.html":"mostrarInicio",
    "modProf/html/panel_profesor.html":"mostrarSalir"
  };

  // Función para mostrar u ocultar botones según la ruta
  function mostrarBotones() {
    var rutaActual = window.location.pathname;
    var accion = rutaAcciones[rutaActual];

    if (accion === "mostrarSalir") {
      mostrarSalir();
    } else if (accion === "mostrarInicio") {
      mostrarInicio();
    } else {
      // Si no se encuentra la ruta en el objeto, puedes mostrar un botón por defecto
      // mostrarInicio(); // Descomenta esta línea si deseas mostrar el botón inicio por defecto
    }
  }

  // Funciones para mostrar u ocultar botones
  function mostrarSalir() {
    $btnInicio.hide();
    $btnSalir.show();
  }

  function mostrarInicio() {
    $btnInicio.show();
    $btnSalir.hide();
  }

  // Limpia formularios si se encuentra en la ruta raíz
  function LimpiarFormularios() {
    if (window.location.pathname === "/") {
      var formularios = document.querySelectorAll('form');
      formularios.forEach(function(formulario) {
        formulario.reset();
      });
    }
  }

  // Eventos para los botones
  $btnSalir.on("click", function() {
    window.history.go(-window.history.length);
    window.localStorage.clear();
    window.location.replace('/');
  });

  $btnInicio.on("click", function() {
    window.location.href = "../modAlum/lobbyEstudiante.html";
  });

  // Ejecuta la función para mostrar botones según la ruta
  mostrarBotones();
  LimpiarFormularios();
});