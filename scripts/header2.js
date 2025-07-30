//este script lo que hace es armar el header de todas las paginas con innerHTML.
const header = document.querySelector("header");

header.innerHTML=`
<link rel="stylesheet" href="/css/estilosHeader.css">
<img class="logo" src="/Img/Head/LogoInstBCurvo.png" alt="BKlogo">
<div class="Texto">
<h1>Sistema De Gestion Educativa</h1>
<p>Instituto Superior de Formacion Tecnica N°172</p>            
</div>
<div id="btnHead">
<button id="btnAtras">Inicio</button>
<button id="btnSalir">Salir</button>
</div>
  
`;