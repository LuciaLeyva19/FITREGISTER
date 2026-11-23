(() => {
    const clavePro = "fitregister-pro-demo";
    const activar = document.querySelector("#activar-pro");
    const estadoGratis = document.querySelector("#estado-gratis");
    const estadoPro = document.querySelector("#estado-pro");

    function mostrarEstado() {
        try {
            const activo = localStorage.getItem(clavePro) === "activo";

            activar.hidden = activo;
            estadoGratis.hidden = activo;
            estadoPro.textContent = activo
                ? "Plan Pro activo · Simulación"
                : "Activación de prueba sin cobro.";
        } catch {
            activar.hidden = true;
            estadoGratis.hidden = true;
            estadoPro.textContent = "No se pudo consultar el plan en este navegador.";
        }
    }

    activar.addEventListener("click", () => {
        try {
            localStorage.setItem(clavePro, "activo");
        } catch {
            estadoPro.textContent = "No se pudo guardar la activación. Inténtalo de nuevo.";
            return;
        }

        mostrarEstado();
        estadoPro.tabIndex = -1;
        estadoPro.focus();
    });

    window.addEventListener("pageshow", mostrarEstado);
    mostrarEstado();
})();