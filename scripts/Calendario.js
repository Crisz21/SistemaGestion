
window.onload = function(){
        traerDatos(); 
}
function traerDatos(){
        //var btnMat = document.querySelector('.btn-materias'); ejemplo de como se llama al objeto del dom
    var TipoEvent= document.querySelector('.TipoEvento').value;
    var Descrip= document.querySelector('.Descripcion').value;
    var fecha= document.querySelector('.fecha').value;
    var Hora= document.querySelector('.hora').value;
    var btnGuardar = document.querySelector('.btnSave');
    btnGuardar.addEventListener('click', function(){
        $.ajax({
            type:"POST",
            url:"../php/calendario.php",
            data: {accion:"cargarEventoInst", TipoEvent:TipoEvent, Descrip:Descrip, fecha:fecha, Hora: Hora},
            dataType: "json",
            success: function (data) {             
            }       
        });     
    });
        
}



