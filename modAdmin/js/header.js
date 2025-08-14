const header = document.querySelector("header");

header.innerHTML = `
<link rel="stylesheet" href="/css/estilosHeader.css">
<img class="logo" src="../Img/Head/LogoInstBCurvo.png" alt="BKlogo">
<div class="Texto">
<h1>Sistema De Gestion Educativa</h1>
<p>Instituto Superior de Formacion Tecnica N°172</p>
</div>
<div id="btnHead">
<button id="btnAtras">Inicio</button>
<button id="btnSalir">Salir</button>
</div>
`;

// Obtener el botón después de que se haya añadido al DOM
const btnAtras = document.getElementById("btnAtras");

// Añadir un escuchador de eventos al botón
btnAtras.addEventListener("click", () => {
    // Redirigir a la página panel_administrativo.html
    window.location.href = "panel_administrativo.html";
});

// También podrías añadir funcionalidad para el botón Salir
const btnSalir = document.getElementById("btnSalir");
btnSalir.addEventListener("click", () => {
    // Aquí puedes añadir la funcionalidad deseada para "Salir" (cerrar sesión, etc.)
    console.log("Botón Salir clickeado");
    // window.location.href = "login.html"; // Ejemplo: redirigir a una página de inicio de sesión
});