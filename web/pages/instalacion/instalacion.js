(() => {
    if (window.fitregisterInstalacionIniciada) return;
    window.fitregisterInstalacionIniciada = true;

    let solicitudInstalacion = null;
    let boton = null;

    function estaInstalada() {
        return (
            window.matchMedia("(display-mode: standalone)").matches ||
            window.navigator.standalone === true
        );
    }

    function actualizarBoton() {
        if (!boton) return;

        boton.style.display =
            solicitudInstalacion && !estaInstalada()
                ? "inline-flex"
                : "none";
    }

    window.addEventListener("beforeinstallprompt", (evento) => {
        evento.preventDefault();
        solicitudInstalacion = evento;
        actualizarBoton();
    });

    window.addEventListener("appinstalled", () => {
        solicitudInstalacion = null;
        actualizarBoton();
    });

    function iniciar() {
        const menu = document.querySelector(".menu");
        if (!menu) return;

        boton = document.createElement("button");
        boton.type = "button";
        boton.className = "boton";
        boton.textContent = "Instalar FITREGISTER";
        boton.style.display = "none";
        boton.style.marginTop = "14px";
        boton.style.width = "100%";

        const mensaje = document.createElement("p");
        mensaje.setAttribute("role", "status");
        mensaje.style.fontSize = "12px";

        boton.addEventListener("click", async () => {
            if (!solicitudInstalacion) return;

            const solicitud = solicitudInstalacion;
            solicitudInstalacion = null;
            boton.disabled = true;
            mensaje.textContent = "";

            try {
                await solicitud.prompt();
                await solicitud.userChoice;
            } catch {
                mensaje.textContent =
                    "Puedes instalar FITREGISTER desde el menú del navegador.";
            } finally {
                boton.disabled = false;
                actualizarBoton();
            }
        });

        const promocionPro = menu.querySelector(".menu-pro");

        menu.insertBefore(boton, promocionPro);
        menu.insertBefore(mensaje, promocionPro);

        actualizarBoton();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar);
    } else {
        iniciar();
    }
})();