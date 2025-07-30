window.onload = function(){

            $.ajax({
                type:"POST",
                url:"../php/controlGeneral.php",
                data: {accion:"obtenerinfoAlum"},
                dataType: "json",
                success: function (data) {
                    console.log("deberia mostrar la data si esta aca"+data);
                 $.each(data, function(index,value){
                    //aca con este foreach se cargan los label con la informacion que traemos desde controlgeneral.php
                    //lo que hace controlGeneral.php es llamar al procedimiento almacenado ObtenerDatosAlumnos
                    $('#cont-DNI').html(value.idUsuario);
                    $('#cont-Nombre').html(value.nombre);
                    $('#cont-apellido').html(value.apellido);
                    //cargar email despues $('#cont-email').html(value.idUsuario);
                    //cargar carreras despues $('#cont-carreras').html(value.idUsuario);
                    $('#cont-direccion').html("calle: "+value.calle+' ' + "Altura: " + value.nroAltura +' '+ "Piso: " + value.piso);
                    $('#cont-partido').html(value.localidad);
                    $('#cont-DNI').html(value.idUsuario);
                    $('#cont-DNI').html(value.idUsuario);
                    $('#cont-DNI').html(value.idUsuario);
                    $('#cont-nroLegajo').html(value.legajoNro);
                 })
                  }
                  
              });
       
}