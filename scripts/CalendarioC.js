$(document).ready(function(){

    //Capturo elementos del DOM y los Guardo en variables
    let fechaActual = new Date();
    let mesActual = fechaActual.getMonth();
    let anoActual = fechaActual.getFullYear();
    let calendario = document.getElementById('calendario-cuerpo');
    let mesAno = document.getElementById('mes-año');
    let btnAntes = document.getElementById('btn-antes');
    let btnDespues = document.getElementById('btn-despues');
    let btnVerCal = document.getElementById('VerCal');
    let btnAgregarEvento = document.getElementById('AgregarEvento');
    let calendarioCon=document.getElementsByClassName('calendario').item(0);
    let Eventos = document.getElementsByClassName('ContenedorMenus').item(0);

    

    //variables que cree para ocultar o mostrar el calendario y la tabla de agregar eventos
    var estado = "oculto";
    var estado2 = "oculto";

   

    btnVerCal.addEventListener('click',function(){
        if (estado2 === "oculto"){
            calendarioCon.style.display="block";
            estado2 = "visible";
        } else{
            calendarioCon.style.display="none";
            estado2 = "oculto";
        }

        let eventos = [];
        function crearCalendario(mes, ano) {
            let primerDiaMes = new Date(ano, mes, 1);
            let ultimoDiaMes = new Date(ano, mes + 1, 0);
            
            let fila = document.createElement('tr');
            for (let i = 0; i < primerDiaMes.getDay(); i++) {
                let celda = document.createElement('td');
                celda.textContent = '';
                fila.appendChild(celda);
              }
              
              for (let i = 1; i <= ultimoDiaMes.getDate(); i++) {
                let celda = document.createElement('td');
                celda.textContent = i;
                celda.addEventListener('click', function() {
                  let fechaSeleccionada = `${ano}-${mes + 1}-${this.textContent}`;
                  cargarEvento(fechaSeleccionada);
                });
                fila.appendChild(celda);
                if ((i + primerDiaMes.getDay()) % 7 === 0) {
                  calendario.appendChild(fila);
                  fila = document.createElement('tr');
                }
              }
    
        }
        
        // Función para actualizar el calendario
        function actualizarCalendario(mes, ano) {
            calendario.innerHTML = '';
            crearCalendario(mes, ano);
            mesAno.textContent = getMesNombre(mes) + ' ' + ano;
        }
        
        // Función para obtener el nombre del mes
        function getMesNombre(mes) {
            let meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            return meses[mes];
        }
        
        // Eventos para los botones
        btnAntes.addEventListener('click', () => {
            if (mesActual === 0) {
                mesActual = 11;
                anoActual--;
            } else {
                mesActual--;
            }
            actualizarCalendario(mesActual, anoActual);
        });
        
        btnDespues.addEventListener('click', () => {
            if (mesActual === 11) {
                mesActual = 0;
                anoActual++;
            } else {
                mesActual++;
            }
            actualizarCalendario(mesActual, anoActual);
        });
        
        // Inicializar el calendario
        actualizarCalendario(mesActual, anoActual);
    })
   
    

    //Aca se generan los div que muestran la informacion a los alumnos y deja agregar eventos a los administradores y profesores
    const menuCalendario = $('.ContenedorMenus')[0];
    mostrarEventos(menuCalendario);

        function mostrarEventos(menuCalendario){
            $.ajax({
                type:'POST',
                url:'./php/calendario.php',
                data:{accion:"verRol"},
                dataType: 'json',
                success: function(data){
                        switch(data){
                            case "3":mostrarAdmin(menuCalendario);
                            break;
                            case "2":mostrarProf(menuCalendario);
                            console.log(menuCalendario);
                            break;
                            case "1":mostrarAlumno(menuCalendario)
                            console.log("esta en alumno es 1 el rol");
                            break;
                           
                        }
                    
                },error: function(xhr,status,error){
                    console.log(error);
                }
            });
        }
    

    
    
    
        function mostrarAdmin(menuCalendario){
            console.log("deberia dibujar el div");
            menuCalendario.innerHTML=`
                    <div id="menuAdmin">
                        <form class="AgregarEvento">
                            <label for="Titulo">Establecer Eventos</label>

                            <label for="Tipo de Evento">Tipo de Evento:</label>
                            <input type="text" id="TipoEvento">

                            <label for="fecha/hora">Fecha y Hora</label>
                            <input type="text" id="fecha/hora">
                            
                            <label for="Curso">Curso</label>
                            <input type="text" id="Curso">

                            <label for="Carrera">Carrera</label>
                            <input type="text" id="Carrera">
                        </form>
                    </div>
            `;
        }
        function mostrarProf(menuCalendario){
            menuCalendario.innerHTML=`
                    <div id="menuProf">
                    
                        <form class="AgregarEventoProf">

                            <div id="encabezadoEvent">
                                <h1>Establecer Eventos</h1> 
                               
                            </div>

                            <div id="bodyMenu">
                                    <div id="Descrip">
                                        <label for="Tipo de Evento">Tipo de Evento:</label>
                                        <select id="cmbtipoExamen" name="cmbtipoExamen">
                                        <option value="" disable selected>Seleccione un tipo de examen</option>
                                        <option value="" >Trabajo Practico</option>
                                        <option value="" >Examen Parcial</option>
                                        <option value="" >Examen Final</option>
                                        </select>

                                        <label for="fecha">Fecha y Hora</label>
                                        <input type="datetime-local" id="fechaHora" name="fechaHora"
                                        min="2025-01-01T00:00"
                                        max="2080-12-31T23:59">

                                        <label for="descripcion">Descripcion</label>
                                        <textarea id="descripcionInput" wrap="hard"></textarea>

                                        

                                    </div>
                                    <div id="datosProf">
                                        <label for="Curso">Curso</label>
                                        <select id="cmbCurso" name="cmbCurso">
                                        <option value="" disable selected>Seleccione un Curso</option>
                                        </select>

                                        <label for="Carrera">Carrera</label>
                                        <select id="cmbCarrera" name="cmbCarrera">
                                        <option value="" disable selected>Seleccione una Carrera</option>
                                        </select>

                                        <label for="Materia">Materia</label>
                                        <select id="cmbMateria" name="cmbMateria">
                                        <option value="" disable selected>Seleccione una Materia</option>
                                        </select>

                                        <input type="button" id="btnCrearEvento" value="Agregar Evento">
                                    </div>
                                
                            </div>
                        </form>
                    </div>
            `;
            cargarCMBProf();
        }
        function mostrarAlumno(menuCalendario){
            console.log("deberia dibujar el div");
            menuCalendario.innerHTML=`
                    <div id="divParaCentrar">
                        <div id="menuAlumno">
                            <label for="Titulo">Eventos Proximos</label>

                            <label for="Tipo de Evento">Tipo de Evento</label>
                            <input type="text" id="TipoEvento" readonly >

                            <label for="fecha/hora">Fecha y Hora</label>
                            <input type="text" id="fecha/hora" readonly >

                            <label for="Materia">Materia</label>
                            <input type="text" id="Materia"readonly >
                        </div>
                    </div>
            `;
        }

         //Establezco eventos a los botones del calendario y mostrar o agregar evento 
        btnAgregarEvento.addEventListener('click',function(){
            
            

            if (estado === "oculto"){
                Eventos.style.display="block";
                estado = "visible";
            } else{
                Eventos.style.display="none";
                estado = "oculto";
            }
            
            cargarEvento();
           
        })
        

        function cargarCMBProf(){
            $.ajax({
                type:"POST",
                url: "./php/calendario.php",
                data:{accion:"obtenerInfoProf"},
                dataType:"json",
                success: function(data){
                    //cargamos los cmb segun los datos que recibo de la solicitud ajax
                    data.forEach(function(item){
                        cargarCmbCarrera(item.nombre_carrera);
                        cargarCmbMateria(item.nombre_materia);
                        cargarCmbCurso(item.division);  
                    })
                    
                },error: function(xhr,status,error){
                    console.log(error);
                }
            });
        }
        //funcion para cargar cada cmb con jquery usando un foreach, Recordar que aca se maneja todo como si usaramos un vector, Indice - Valor. Index - value.

        function cargarCmbCarrera(data){

            
            let cmbCarrera = $("#cmbCarrera");
            cmbCarrera.append($("<option>").val(data).text(data));
            
        };

        function cargarCmbMateria(data){

            var cmbMateria = $("#cmbMateria");
            cmbMateria.append($("<option>").val(data).text(data));
            
        };

        function cargarCmbCurso(data){

         var cmbCurso = $("#cmbCurso");

        cmbCurso.append($("<option>").val(data).text(data))
           
        };

        // Declaro aca la variable para llamar al boton de crear evento porque primero hay que cargar todo el contenido segun el usuario
        //y recien despues se puede obtener el boton desde el DOM
        
         
        //Creo el evento para el botón Crear eventol, para guardar en la bd el evento creado por el profesor
        function cargarEvento(){
            let btnCrearEvento = document.getElementById("btnCrearEvento");
            btnCrearEvento.addEventListener("click",function(){
                var tipoExamen = document.getElementById('cmbtipoExamen');
                var valorTipoExamen = tipoExamen.options[tipoExamen.selectedIndex].text
                var fechaHora= document.getElementById('fechaHora').value;
                var descripcion = document.getElementById('descripcionInput').value;
                var curso = document.getElementById('cmbCurso').value;
                var carrera = document.getElementById('cmbCarrera').value;
                var materia = document.getElementById('cmbMateria').value;

                //creamos un vector llamado datos para almacenar los datos que ingresó el profesor
               
                //Solicitud ajax que envia el vector datos, este vector tiene todo los datos del evento que creó el profesor
                $.ajax({
                    type: "POST",
                    url: "./php/calendario.php",
                    data:{accion: "crearEvento", valorTipoExamen: valorTipoExamen, fechaHora: fechaHora, descripcion: descripcion, curso: curso, carrera: carrera, materia: materia},
                    dataType:"json",
                    success: function(data){
                            alert("Evento Guardado con Exito!");
                            Eventos.style.display="none";
                    },
                    error: function(xhr,status,error){
                        console.log(error);
                    }
                })

                

            })
        }

    

        /*Hay que normalizar las tablas porque se repiten profesores y alumnos, luego crear el procedimiento almacenado ObtenerInfoProf para que 
        en el cuadro de agregar eventos a materias aparezca la materia, los cursos y las carreras en las que ese profesor esta dictando clases.
        pero primeor hay que normalizar y corregir los errores de logica que tiene la bd creando columnas unicas para que no se repitan los datos
        luego comprobar que los datos se cargan en los CMB y asignar eventos al boton Agregar Evento y cargar los datos a la tabla calendario,
        Luego mostrar ese evento como una fecha en el calendario y darle la opcion de editarlo al profesor. Luego crear algun procedimiento almacenado
        que traiga o lea los eventos y los muestre en el modulo alumno. Este procedimiento tiene lugar cuando el alumno da click en el boton
        calendario del menu. Debe mostrarse un cuadro con las fechas donde el alumno tenga Eventos asignados, junto con el boton de mostrar calendario,
        si el Alumno hace click debe mostrarse la descripcion del evento y en caso de que sea un examen debe mostrar los temas o la descripcion que
        puso el profesor.
        
        23/06/2025
        */

        /*function cargarEvento(fechaSelect){
            var btnCrearEvento=document.getElementById("btnCrearEvento");
            btnCrearEvento.addEventListener("click", function(){
                var TipoEvento = document.getElementById("TipoEvento");
                var fechahora = document.getElementById("fecha/hora");
                var materia = document.getElementById("materia");
                var Curso = document.getElementById("Curso");

                $.ajax({
                    type:'POST',
                    url:'/php/calendario.php',
                    data:{accion:"CrearEvento", TipoEvento: TipoEvento, fechahora: fechahora, materia: materia, Curso},
                    dataType: 'json',
                    success: function(){
   
                    },error: function(xhr,status,error){
                        console.log(error);
                    }
                });

            });
                
        }*/

        /* 
        Cuando el usuario que es alumno hace click en el boton calendario del lobbyAlumno debemos hacer lo siguiente

        debemos traer estos datos y verificar:

        -Curso
        -Materias en curso del alumno
        -Profesor
        -Carrera
        -Nombre ( ya lo tenemos en variables globales)
        -id usuario ( ya lo tenemos en varibales globales)
        -Apellido ( ya lo tenemos en variables globales)

        1ero: verificamos que el alumno exista en el curso, buscamos a que cursos esta anotado el alumno.
        2do: una vez que sabemos a que curso esta anotado, buscamos las materias que esta cursando en el curso.
        3ero: una vez que tenemos todas las materias de todos los cursos a los que esta anotado, buscamos en la tabla eventos
                los eventos que correspondan a ese curso y verificamos que el curso y la materia sea una materia a la cual el alumno se anoto.
        4to: cargamos todos los eventos que correspondan.


        En el apartado de profesor, tenemos:

        -id profesor en variables globales
        -curso hay que sacarlo de la bd
        -materia hay que sacarlo de la bd
        
        el profesor puede cargar eventos especificando carrera, curso y materia.

        para el profesor deberiamos hacer lo mismo, verificar que curso y materia esta dictando clases para mostrar los eventos es decir si
        tiene que tomar parciales y eso


        con el administrativo pasa lo mismo, pero el administrativo tiene el poder de crear eventos que sean del instituto, asique este 
        hay que crear dos botones donde pueda elegir si crear un evento para un curso que puede ser parcial o final. O crear un evento universal
        que abarque a todos lo alumnos y profesores del instituto. Deberiamos darle una opcion para que el administrativo nos indique
        el alcance del evento que quiere crear.

        
        
        */



});
