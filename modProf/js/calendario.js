let mes = new Date().getMonth() + 1;
let anio = new Date().getFullYear();

// Cargar calendario
function cargarCalendario() {
    const calendarioContainer = document.getElementById("calendario");
    const h1 = document.querySelector("h1");
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const mesNombre = meses[mes - 1];
    h1.textContent = `Calendario Académico - ${mesNombre} ${anio}`;

    const primerDia = new Date(anio, mes - 1, 1);
    const ultimoDia = new Date(anio, mes, 0);
    const diasDelMes = Array.from({ length: ultimoDia.getDate() }, (v, k) => k + 1);

    // Obtener eventos del servidor
    fetch("../php/calendario.php")
        .then(response => {
            if (!response.ok) {
                // Manejo de errores de red
                throw new Error('Error al obtener los eventos: ' + response.statusText);
            }
            return response.json();
        })
        .then(eventos => {
            // Limpiar el contenedor antes de renderizar
            calendarioContainer.innerHTML = '';
            
            const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            
            // Cabecera de los días de la semana
            diasSemana.forEach(dia => {
                const diaElemento = document.createElement("div");
                diaElemento.classList.add("header");
                diaElemento.textContent = dia;
                calendarioContainer.appendChild(diaElemento);
            });

            // Rellenar días en blanco al principio
            for (let i = 0; i < primerDia.getDay(); i++) {
                calendarioContainer.appendChild(document.createElement("div"));
            }

            // Mostrar los días del mes
            diasDelMes.forEach(dia => {
                const fecha = `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                const diaElemento = document.createElement("div");
                diaElemento.classList.add("day");
                diaElemento.textContent = dia;
                diaElemento.dataset.fecha = fecha; // Agregar la fecha como atributo de datos

                // Verificar si hay eventos en este día
                if (eventos[fecha]) {
                    eventos[fecha].forEach(evento => {
                        const eventoElemento = document.createElement("div");
                        eventoElemento.classList.add("evento");
                        eventoElemento.textContent = evento.titulo;
                        diaElemento.appendChild(eventoElemento);
                    });
                }

                // Agregar evento click para seleccionar fecha
                diaElemento.addEventListener("click", function() {
                    document.getElementById("fecha").value = fecha;
                    const evento = eventos[fecha] ? eventos[fecha][0] : null;

                    if (evento) {
                        document.getElementById("titulo").value = evento.titulo;
                        document.getElementById("descripcion").value = evento.descripcion;
                        document.getElementById("hora").value = evento.hora;
                        document.getElementById("evento_id").value = evento.id;
                        document.getElementById("eliminarEvento").style.display = "inline-block";
                    } else {
                        document.getElementById("titulo").value = '';
                        document.getElementById("descripcion").value = '';
                        document.getElementById("hora").value = '';
                        document.getElementById("evento_id").value = '';
                        document.getElementById("eliminarEvento").style.display = "none";
                    }
                });
                calendarioContainer.appendChild(diaElemento);
            });
            
            // Rellenar días en blanco al final
            const totalCeldas = calendarioContainer.children.length;
            const celdasNecesarias = 42;  // 6 filas x 7 días
            for (let i = totalCeldas; i < celdasNecesarias; i++) {
                calendarioContainer.appendChild(document.createElement("div"));
            }
        })
        .catch(error => {
            console.error('Hubo un problema con la operación fetch:', error);
            document.getElementById("mensaje").textContent = "No se pudieron cargar los eventos. Por favor, revisa la conexión.";
            document.getElementById("mensaje").style.color = "red";
        });
}

// Navegar al mes anterior
document.getElementById("mesAnterior").addEventListener("click", function(event) {
    event.preventDefault();
    if (mes === 1) {
        mes = 12;
        anio--;
    } else {
        mes--;
    }
    cargarCalendario();
});

// Navegar al mes siguiente
document.getElementById("mesSiguiente").addEventListener("click", function(event) {
    event.preventDefault();
    if (mes === 12) {
        mes = 1;
        anio++;
    } else {
        mes++;
    }
    cargarCalendario();
});

// Guardar evento
document.getElementById("formularioEvento").addEventListener("submit", function(event) {
    event.preventDefault();

    const titulo = document.getElementById("titulo").value;
    const descripcion = document.getElementById("descripcion").value;
    const fecha = document.getElementById("fecha").value;
    const hora = document.getElementById("hora").value;
    const evento_id = document.getElementById("evento_id").value;

    const formData = new FormData();
    formData.append("accion", "guardar");
    formData.append("titulo", titulo);
    formData.append("descripcion", descripcion);
    formData.append("fecha", fecha);
    formData.append("hora", hora);
    formData.append("evento_id", evento_id);

    fetch("../php/calendario.php", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        const mensaje = document.getElementById("mensaje");
        if (data.success) {
            mensaje.textContent = data.message;
            mensaje.style.color = "green";
            cargarCalendario(); // Recargar calendario para ver el nuevo evento
            document.getElementById("formularioEvento").reset();
            document.getElementById("eliminarEvento").style.display = "none";
        } else {
            mensaje.textContent = data.message;
            mensaje.style.color = "red";
        }
    });
});

// Eliminar evento
document.getElementById("eliminarEvento").addEventListener("click", function() {
    const evento_id = document.getElementById("evento_id").value;
    if (evento_id) {
        const formData = new FormData();
        formData.append("accion", "eliminar");
        formData.append("evento_id", evento_id);

        fetch("../php/calendario.php", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            const mensaje = document.getElementById("mensaje");
            if (data.success) {
                mensaje.textContent = data.message;
                mensaje.style.color = "green";
                cargarCalendario();
                document.getElementById("formularioEvento").reset();
                document.getElementById("eliminarEvento").style.display = "none";
            } else {
                mensaje.textContent = data.message;
                mensaje.style.color = "red";
            }
        });
    }
});

// Inicializar el calendario al cargar la página
cargarCalendario();