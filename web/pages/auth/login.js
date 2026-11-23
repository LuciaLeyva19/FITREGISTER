const formulario = document.querySelector("#form-login");
const correo = document.querySelector("#correo");
const contrasena = document.querySelector("#contrasena");
const botonMostrar = document.querySelector("#mostrar-contrasena");
const mensaje = document.querySelector("#mensaje-login");

botonMostrar.addEventListener("click", () => {
    const mostrar = contrasena.type === "password";

    contrasena.type = mostrar ? "text" : "password";
    botonMostrar.textContent = mostrar ? "Ocultar" : "Mostrar";
});

formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const correoIngresado = correo.value.trim().toLowerCase();

    const accesoValido =
        correoIngresado === "demo@fitregister.test" &&
        contrasena.value === "FitDemo2026";

    if (!accesoValido) {
        mensaje.textContent =
            "Revisa el correo y la contraseña de la cuenta de prueba.";
        contrasena.focus();
        return;
    }

    try {
        sessionStorage.removeItem("fitregister-perfil-demo");
        sessionStorage.setItem("fitregister-sesion-demo", "activa");
    } catch {
        mensaje.textContent =
            "No se pudo iniciar la sesión de prueba.";
        return;
    }

    window.location.replace("../../../index.html");
});