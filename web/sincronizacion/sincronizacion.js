(() => {
    if (window.fitregisterSincronizacionIniciada) return;

    window.fitregisterSincronizacionIniciada = true;

    const baseWeb = new URL("../", document.currentScript.src);

    const clientes = {
        "Diego Ruiz": "diego",
        "Ana Torres": "ana",
        "Sofía Vega": "sofia"
    };

    let indicador;
    let version = 0;
    let temporizador;

    function cargarServicio() {
        if (window.PlanesServicio) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement("script");

            script.src = new URL(
                "pages/rutinas/planes.servicio.js",
                baseWeb
            ).href;

            script.onload = resolve;

            script.onerror = () => {
                reject(
                    new Error(
                        "No se pudo cargar el servicio de planes."
                    )
                );
            };

            document.head.append(script);
        });
    }

    function cargarEstilos() {
        const url = new URL(
            "sincronizacion/sincronizacion.css",
            baseWeb
        ).href;

        const existe = Array.from(
            document.querySelectorAll('link[rel="stylesheet"]')
        ).some((hoja) => hoja.href === url);

        if (existe) return;

        const hoja = document.createElement("link");
        hoja.rel = "stylesheet";
        hoja.href = url;

        document.head.append(hoja);
    }

    function ponerEtiqueta(contenedor, pendiente) {
        const existente = contenedor.querySelector(
            ".pendiente-plan"
        );

        if (pendiente && !existente) {
            const etiqueta = document.createElement("span");

            etiqueta.className = "pendiente-plan";
            etiqueta.textContent = "Pendiente de sincronizar";
            etiqueta.title =
                "Este plan tiene cambios locales que aún no recibió el servidor simulado.";

            contenedor.append(etiqueta);
        } else if (!pendiente && existente) {
            existente.remove();
        }
    }

    function tituloSinEtiqueta(elemento) {
        return Array.from(elemento.childNodes)
            .filter((nodo) => {
                return !(
                    nodo.nodeType === 1 &&
                    nodo.classList.contains("pendiente-plan")
                );
            })
            .map((nodo) => nodo.textContent)
            .join("")
            .trim();
    }

    function limpiarEtiquetasEditor(lista) {
        for (const etiqueta of lista.querySelectorAll(".pendiente-plan")) {
            etiqueta.remove();
        }
    }

    async function actualizar() {
        const versionActual = ++version;
        const servicio = window.PlanesServicio;

        if (!servicio) return;

        const conectado = servicio.tieneConexion();
        const texto = conectado ? "Con conexión" : "Sin conexión";

        if (indicador) {
            if (indicador.textContent !== texto) {
                indicador.textContent = texto;
            }

            const valor = String(conectado);

            if (indicador.dataset.conectado !== valor) {
                indicador.dataset.conectado = valor;
            }
        }

        try {
            // Panel lateral en la pantalla de Clientes.
            const panel = document.querySelector("#rutinas-panel");

            const nombrePanel = document.querySelector(
                "#nombre-cliente-panel"
            )?.textContent.trim();

            const clientePanel = clientes[nombrePanel];

            if (panel && clientePanel) {
                const [planes, pendientes] = await Promise.all([
                    servicio.listar(clientePanel),
                    servicio.planesPendientes(clientePanel)
                ]);

                if (versionActual !== version) return;

                const idsPendientes = new Set(
                    pendientes.map((id) => String(id))
                );

                for (const detalle of panel.querySelectorAll(".plan-cliente")) {
                    const resumen = detalle.querySelector("summary");

                    if (!resumen) continue;

                    const titulo = tituloSinEtiqueta(resumen);

                    const plan = planes.find((actualPlan) => {
                        const cantidad = actualPlan.dias.length;
                        const unidad = cantidad === 1 ? "día" : "días";

                        return titulo ===
                            `${actualPlan.nombre} · ${cantidad} ${unidad}`;
                    });

                    ponerEtiqueta(
                        resumen,
                        Boolean(
                            plan &&
                            idsPendientes.has(String(plan.id))
                        )
                    );
                }
            }

            // Lista de planes debajo del editor de Rutinas.
            const lista = document.querySelector("#lista-planes");
            const formulario = document.querySelector("#form-plan");

            if (!lista || !formulario) return;

            const clienteEditor = formulario.dataset.clienteId;

            if (
                !clienteEditor ||
                lista.dataset.clienteId !== clienteEditor
            ) {
                limpiarEtiquetasEditor(lista);
                return;
            }

            const pendientes = await servicio.planesPendientes(
                clienteEditor
            );

            if (versionActual !== version) return;

            // Evita aplicar resultados si cambió el cliente
            // mientras se consultaba el almacenamiento.
            if (
                formulario.dataset.clienteId !== clienteEditor ||
                lista.dataset.clienteId !== clienteEditor
            ) {
                return;
            }

            const idsPendientes = new Set(
                pendientes.map((id) => String(id))
            );

            for (const fila of lista.querySelectorAll(".fila-plan-guardado")) {
                const titulo = fila.querySelector("strong");
                const planId = fila.dataset.planId;

                if (!titulo) continue;

                ponerEtiqueta(
                    titulo,
                    Boolean(
                        planId &&
                        idsPendientes.has(planId)
                    )
                );
            }
        } catch (error) {
            console.error(
                "No se pudo consultar la sincronización:",
                error
            );
        }
    }

    function programarActualizacion() {
        clearTimeout(temporizador);

        temporizador = setTimeout(() => {
            void actualizar();
        }, 50);
    }

    function revisar() {
        void actualizar();
        void window.PlanesServicio.sincronizar();
    }

    async function iniciar() {
        cargarEstilos();

        try {
            await cargarServicio();
        } catch (error) {
            console.error(error);
            return;
        }

        const encabezado = document.querySelector(".encabezado");

        if (encabezado) {
            indicador = encabezado.querySelector(".estado-conexion");

            if (!indicador) {
                indicador = document.createElement("span");
                indicador.className = "estado-conexion";
                indicador.setAttribute("role", "status");

                encabezado.prepend(indicador);
            }
        }

        const observador = new MutationObserver(
            programarActualizacion
        );

        for (const id of [
            "rutinas-panel",
            "lista-planes",
            "nombre-cliente-panel"
        ]) {
            const elemento = document.getElementById(id);

            if (elemento) {
                observador.observe(elemento, {
                    childList: true,
                    subtree: true,
                    characterData: true
                });
            }
        }

        const formulario = document.getElementById("form-plan");

        if (formulario) {
            observador.observe(formulario, {
                attributes: true,
                attributeFilter: ["data-cliente-id"]
            });
        }

        window.addEventListener(
            "fitregister:cliente-seleccionado",
            programarActualizacion
        );

        window.addEventListener(
            "fitregister:sincronizacion",
            programarActualizacion
        );

        window.addEventListener("storage", revisar);
        window.addEventListener("pageshow", revisar);

        window.addEventListener(
            "online",
            revisar
        );

        window.addEventListener(
            "offline",
            revisar
        );

        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
                revisar();
            }
        });

        setInterval(() => {
            if (document.visibilityState === "visible") {
                void window.PlanesServicio.sincronizar();
            }
        }, 10000);

        revisar();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar);
    } else {
        void iniciar();
    }
})();