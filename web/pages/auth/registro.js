const formularioRegistro = document.querySelector("#form-registro");
const nombreRegistro = document.querySelector("#nombre");
const contrasenaRegistro = document.querySelector("#contrasena-registro");
const confirmarContrasena = document.querySelector("#confirmar-contrasena");
const mensajeRegistro = document.querySelector("#mensaje-registro");

formularioRegistro.addEventListener("input", () => {
    mensajeRegistro.textContent = "";
});

formularioRegistro.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const nombre = nombreRegistro.value
        .trim()
        .replace(/\s+/g, " ");

    if (nombre.length < 2) {
        mensajeRegistro.textContent =
            "Escribe un nombre de al menos dos caracteres.";
        nombreRegistro.focus();
        return;
    }

    if (contrasenaRegistro.value !== confirmarContrasena.value) {
        mensajeRegistro.textContent =
            "Las contraseñas deben coincidir.";
        confirmarContrasena.focus();
        return;
    }

    try {
        sessionStorage.setItem("fitregister-perfil-demo", nombre);
        sessionStorage.setItem("fitregister-sesion-demo", "activa");
    } catch {
        mensajeRegistro.textContent =
            "No se pudo abrir la sesión de prueba.";
        return;
    }

    window.location.replace("../../../index.html");
});