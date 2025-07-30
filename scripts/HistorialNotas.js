//ahora llamo a la funcion que va a mandarle el nombre de la materia seleccionada y le envio la materia por
//la funcion deberia crear un ajax para enviarle el nombre de la materia a la base de datos
// y que la base de datos segun el nombre de la materia busque en la tabla examenes
//y me devuelva la informacion en formato json

window.onload = function(){
    $.ajax({
        type : 'POST',
        url: '../php/varGlobales.php',
        dataType: 'json',
            success: function(datos){
                var nomUsuario = datos.nomUser;
                var apellido = datos.apellidoUser;
                var materia = localStorage.getItem('materia'); //Estos localStorage se cargan en el documento ALM_Materias
                var carrera = localStorage.getItem('carrera');
                var division = localStorage.getItem('division');
                var nomProf = localStorage.getItem('nomProf');
                cargarDatos(materia,division,nomProf,carrera,nomUsuario,apellido);
                obtenerExamenes(materia);
            }, error:function(xhr, status,error){console.log('error: '+ error);}
        });
}


function obtenerExamenes(materia1){
    $.ajax({
      type:"POST",
      url:"./php/controlGeneral.php",
      data: {accion:"obtenerExamenes", materia: materia1},
      dataType: "json",
      success: function (data) {
        if (Object.keys(data[0]).length === 1){
          
            const tbody = document.getElementById("tExamen");
            const fila = document.createElement('tr');
            const celda = document.createElement('td');
            celda.textContent = "No Registras exámenes para esta materia por el momento";
            celda.colSpan = 5;
            fila.appendChild(celda);
            tbody.appendChild(fila);
        }else{
            const tabla = document.getElementById("tExamen");
            data.forEach(fila => {
            const row = document.createElement("tr");
            Object.keys(fila).forEach(key => {
                const cell = document.createElement("td");
                cell.textContent = fila[key];
                row.appendChild(cell);
            })
            tabla.appendChild(row);
        });
        
        
      }
        }
        
    });
   
  };
function cargarDatos(materia,carrera,nomProf,division,nomUsuario,apellido){
    document.getElementById("materia").textContent += ' '+materia;
    document.getElementById("carrera").textContent += ' '+carrera;
    document.getElementById("division").textContent += ' '+division;
    document.getElementById("nomProf").textContent += ' '+nomProf;
    document.getElementById("nomAlumno").textContent +=' ' + nomUsuario + ' ' + apellido;
    
}