
//aclarar bien lo que hace este metodo mas adelante.
$(document).ready(function(){
    $.ajax({
        type: "POST",
        url: "../php/ControlGeneral.php",
        data: {accion: "ObtenerMateriasAlumno"},
        dataType: "json",
        success: function(data) {
          console.log(data);
          const tabla = document.getElementById("datos");
          data.forEach(fila => {
            const row = document.createElement("tr");
            Object.keys(fila).forEach(key => {
              const cell = document.createElement("td");
              cell.textContent = fila[key];
              row.appendChild(cell);
            });
            //Ahora le agrego un evento click a cada fila de la tabla 
            row.addEventListener('click', function(){
              var materia = fila.nombre_materia;
              var carrera = fila.nombre_carrera;
              var division = fila.division;
              var nomProf = fila.nombre_prof;

              localStorage.setItem('materia', materia);
              localStorage.setItem('division', carrera);
              localStorage.setItem('carrera', division);
              localStorage.setItem('nomProf', nomProf);

              window.location.href='./HistorialNotas.html';
            });
            tabla.appendChild(row);
          });
        }       
      });  
});
  






