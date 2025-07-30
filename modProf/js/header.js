document.addEventListener("DOMContentLoaded", () => {
    const btnAtras = document.getElementById("btnAtras");
    const btnSalir = document.getElementById("btnSalir");

    // Función para redirigir al inicio
    btnAtras.addEventListener("click", () => {
        window.location.href = "/index.html";  // Cambia esto por la URL de tu página de inicio
    });

    // Función para cerrar sesión
    btnSalir.addEventListener("click", () => {
        // Aquí puedes implementar la lógica para cerrar sesión, por ejemplo, redirigir a una página de logout o eliminar cookies.
        alert("Cerrando sesión...");
        window.location.href = "/logout.html";  // Cambia esto por la URL de tu página de logout
    });
});
