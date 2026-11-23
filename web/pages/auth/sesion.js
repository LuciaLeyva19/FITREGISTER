(() => {
    const claveSesion = "fitregister-sesion-demo";
    const clavePerfil = "fitregister-perfil-demo";
    const urlScript = document.currentScript.src;

    const carpetaWeb = new URL("../../", urlScript);
    const carpetaProyecto = new URL("../", carpetaWeb);

    const urlLogin = new URL("login.html", urlScript);
    const urlPerfilCSS = new URL("perfil.css", carpetaWeb);
    const urlInicio = new URL("index.html", carpetaProyecto);
    const urlInicioAnterior = new URL("index.html", carpetaWeb);
    const urlSW = new URL("sw.js", carpetaProyecto);

    const urlManifest = new URL(
        "manifest.webmanifest",
        carpetaProyecto
    );

    function cargarScript(ruta) {
        const url = new URL(ruta, carpetaWeb).href;

        const existe = Array.from(document.scripts)
            .some((script) => script.src === url);

        if (existe) return;

        const script = document.createElement("script");
        script.src = url;
        document.head.append(script);
    }

    function configurarInstalacion() {
        let manifiesto = document.querySelector(
            'link[rel="manifest"]'
        );

        if (!manifiesto) {
            manifiesto = document.createElement("link");
            manifiesto.rel = "manifest";
            document.head.append(manifiesto);
        }

        manifiesto.href = urlManifest.href;

        let color = document.querySelector(
            'meta[name="theme-color"]'
        );

        if (!color) {
            color = document.createElement("meta");
            color.name = "theme-color";
            document.head.append(color);
        }

        color.content = "#10151d";

        let icono = document.querySelector('link[rel="icon"]');

        if (!icono) {
            icono = document.createElement("link");
            icono.rel = "icon";
            document.head.append(icono);
        }

        icono.type = "image/png";
        icono.href = new URL(
            "img/iconos/icon-192.png",
            carpetaWeb
        ).href;

        cargarScript("pages/instalacion/instalacion.js");
    }

    function verificarSesion() {
        if (sessionStorage.getItem(claveSesion) === "activa") {
            return true;
        }

        window.location.replace(urlLogin.href);
        return false;
    }

    async function registrarPWA() {
        if (!("serviceWorker" in navigator)) return;

        try {
            const registros =
                await navigator.serviceWorker.getRegistrations();

            for (const registro of registros) {
                const trabajador =
                    registro.active ||
                    registro.waiting ||
                    registro.installing;

                const esRegistroAnterior =
                    registro.scope === carpetaWeb.href &&
                    trabajador?.scriptURL ===
                        new URL("sw.js", carpetaWeb).href;

                if (esRegistroAnterior) {
                    await registro.unregister();
                }
            }

            await navigator.serviceWorker.register(urlSW.href, {
                scope: carpetaProyecto.href,
                updateViaCache: "none"
            });
        } catch (error) {
            console.error("No se pudo registrar la PWA:", error);
        }
    }

    function ajustarEnlacesInicio() {
        for (const enlace of document.querySelectorAll("a[href]")) {
            const url = new URL(enlace.href);

            if (
                url.origin === urlInicioAnterior.origin &&
                url.pathname === urlInicioAnterior.pathname
            ) {
                url.pathname = urlInicio.pathname;
                enlace.href = url.href;
            }
        }
    }

    function cargarEstilosPerfil() {
        const existe = Array.from(
            document.querySelectorAll('link[rel="stylesheet"]')
        ).some((hoja) => hoja.href === urlPerfilCSS.href);

        if (existe) return;

        const hoja = document.createElement("link");
        hoja.rel = "stylesheet";
        hoja.href = urlPerfilCSS.href;
        document.head.append(hoja);
    }

    function crearMenuPerfil() {
        const encabezado = document.querySelector(".encabezado");
        if (!encabezado) return null;

        const existente = encabezado.querySelector(".menu-perfil");
        if (existente) return existente;

        const perfil = encabezado.querySelector(".perfil");
        if (!perfil) return null;

        const menu = document.createElement("details");
        menu.className = "menu-perfil";

        menu.innerHTML = `
            <summary class="perfil">
                <span class="avatar" aria-hidden="true">LA</span>
                <span>Lucía</span>
                <span aria-hidden="true">▾</span>
            </summary>

            <div class="opciones-perfil">
                <button id="cerrar-sesion" type="button">
                    Cerrar sesión
                </button>
            </div>
        `;

        perfil.replaceWith(menu);
        return menu;
    }

    function mostrarPerfil(menu) {
        const guardado = sessionStorage.getItem(clavePerfil)?.trim();
        const nombre = guardado || "Lucía";

        const iniciales = guardado
            ? nombre.split(/\s+/).slice(0, 2)
                .map((palabra) => Array.from(palabra)[0])
                .join("")
                .toLocaleUpperCase("es-MX")
            : "LA";

        menu.querySelector("summary .avatar").textContent = iniciales;

        menu.querySelector(
            "summary span:not([aria-hidden])"
        ).textContent = nombre;
    }

    let menuPerfil = null;

    function iniciar() {
        if (!verificarSesion()) return;

        ajustarEnlacesInicio();
        cargarEstilosPerfil();
        menuPerfil = crearMenuPerfil();

        if (menuPerfil) {
            mostrarPerfil(menuPerfil);

            menuPerfil.querySelector("#cerrar-sesion")
                .addEventListener("click", () => {
                    sessionStorage.removeItem(claveSesion);
                    sessionStorage.removeItem(clavePerfil);
                    window.location.replace(urlLogin.href);
                });
        }

        cargarScript("sincronizacion/sincronizacion.js");
        cargarScript("pages/notificaciones/notificaciones.js");
    }

    configurarInstalacion();

    if (!verificarSesion()) return;

    void registrarPWA();

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar);
    } else {
        iniciar();
    }

    window.addEventListener("pageshow", () => {
        if (verificarSesion() && menuPerfil) {
            mostrarPerfil(menuPerfil);
        }
    });
})();