(() => {
    if (window.fitNotificaciones) return;
    window.fitNotificaciones = true;

    // Desde pages/notificaciones/ regresamos a web/.
    const base = new URL("../../", document.currentScript.src);
    const clave = "fitregister-notificaciones-demo-v1";

    const clientes = [
        { id: "ana", nombre: "Ana Torres" },
        { id: "diego", nombre: "Diego Ruiz" },
        { id: "sofia", nombre: "Sofía Vega" }
    ];

    let filtro = "todas";
    let campana;
    let dialogo;
    let lista;
    let contador;
    let aviso;

    function leer() {
        const datos = JSON.parse(
            localStorage.getItem(clave) ?? "[]"
        );

        if (!Array.isArray(datos)) {
            throw new Error("Formato de notificaciones inválido.");
        }

        return datos;
    }

    function guardar(datos) {
        localStorage.setItem(clave, JSON.stringify(datos));
    }

    function generarEjemplos() {
        const datos = leer();

        for (const cliente of clientes) {
            const planes = JSON.parse(
                localStorage.getItem(
                    `fitregister-planes-${cliente.id}`
                ) ?? "[]"
            );

            const plan = Array.isArray(planes) ? planes[0] : null;

            if (
                !plan ||
                datos.some((item) => item.clienteId === cliente.id)
            ) {
                continue;
            }

            datos.push({
                id: crypto.randomUUID(),
                clienteId: cliente.id,
                cliente: cliente.nombre,
                planId: plan.id,
                plan: plan.nombre,
                mensaje:
                    "Me gustaría ajustar los ejercicios de este plan. ¿Puedes revisarlo?",
                fecha: new Date().toISOString(),
                leida: false,
                atendida: false
            });
        }

        guardar(datos);
    }

    function texto(etiqueta, contenido, clase = "") {
        const nodo = document.createElement(etiqueta);
        nodo.textContent = contenido;
        nodo.className = clase;
        return nodo;
    }

    function boton(
        contenido,
        accion,
        clase = "boton boton-secundario"
    ) {
        const nodo = texto("button", contenido, clase);
        nodo.type = "button";
        nodo.addEventListener("click", accion);
        return nodo;
    }

    function cambiar(id, cambios) {
        try {
            const datos = leer().map((item) =>
                item.id === id
                    ? { ...item, ...cambios }
                    : item
            );

            guardar(datos);
            mostrar();
        } catch {
            aviso.textContent = "No se pudo guardar el cambio.";
        }
    }

    function revisarRutina(item) {
        try {
            const planes = JSON.parse(
                localStorage.getItem(
                    `fitregister-planes-${item.clienteId}`
                ) ?? "[]"
            );

            if (
                !Array.isArray(planes) ||
                !planes.some((plan) => plan.id === item.planId)
            ) {
                aviso.textContent =
                    "El plan de esta solicitud ya no está disponible.";
                return;
            }

            guardar(
                leer().map((actual) =>
                    actual.id === item.id
                        ? { ...actual, leida: true }
                        : actual
                )
            );

            const destino = new URL(
                "pages/rutinas/rutinas.html",
                base
            );

            destino.searchParams.set("cliente", item.clienteId);
            destino.searchParams.set("plan", item.planId);

            location.assign(destino.href);
        } catch {
            aviso.textContent = "No se pudo abrir el plan.";
        }
    }

    function mostrar() {
        aviso.textContent = "";

        try {
            const datos = leer();
            const sinLeer = datos.filter(
                (item) => !item.leida
            ).length;

            contador.textContent = String(sinLeer);
            contador.hidden = sinLeer === 0;

            campana.setAttribute(
                "aria-label",
                `Notificaciones, ${sinLeer} sin leer`
            );

            lista.replaceChildren();

            const visibles = datos
                .filter((item) =>
                    filtro === "todas" || !item.leida
                )
                .reverse();

            for (const item of visibles) {
                const tarjeta = texto(
                    "li",
                    "",
                    "solicitud-notificacion"
                );

                tarjeta.dataset.leida = String(item.leida);

                tarjeta.append(
                    texto(
                        "h3",
                        `${item.cliente} solicita un cambio`
                    ),
                    texto("p", item.plan, "plan-notificacion"),
                    texto("p", item.mensaje)
                );

                const fecha = texto(
                    "time",
                    new Date(item.fecha).toLocaleString("es-MX")
                );

                fecha.dateTime = item.fecha;
                tarjeta.append(fecha);

                const acciones = texto(
                    "div",
                    "",
                    "acciones-notificacion"
                );

                acciones.append(
                    boton(
                        "Revisar rutina",
                        () => revisarRutina(item),
                        "boton"
                    )
                );

                if (item.atendida) {
                    acciones.append(
                        texto(
                            "span",
                            "Atendida",
                            "estado-atendida"
                        )
                    );
                } else {
                    acciones.append(
                        boton("Marcar atendida", () => {
                            cambiar(item.id, {
                                leida: true,
                                atendida: true
                            });
                        })
                    );
                }

                if (!item.leida) {
                    acciones.append(
                        boton("Marcar leída", () => {
                            cambiar(item.id, { leida: true });
                        })
                    );
                }

                tarjeta.append(acciones);
                lista.append(tarjeta);
            }

            if (!visibles.length) {
                lista.append(
                    texto(
                        "li",
                        "No hay notificaciones en esta vista."
                    )
                );
            }
        } catch {
            aviso.textContent =
                "No se pudieron cargar las notificaciones.";
        }
    }

    function abrirPlanSolicitado() {
        const parametros = new URLSearchParams(location.search);
        const planId = parametros.get("plan");
        const clienteId = parametros.get("cliente");
        const contenedor = document.querySelector("#lista-planes");

        if (!planId || !clienteId || !contenedor) return;

        let terminado = false;

        function intentar() {
            if (terminado) return;

            try {
                const planes = JSON.parse(
                    localStorage.getItem(
                        `fitregister-planes-${clienteId}`
                    ) ?? "[]"
                );

                if (!Array.isArray(planes)) return;

                const indice = planes.findIndex(
                    (plan) => plan.id === planId
                );

                if (indice < 0) return;

                const filas = contenedor.querySelectorAll(
                    ".fila-plan-guardado"
                );

                const fila = filas[indice];
                const abrir = fila?.querySelector("button");

                if (!abrir) return;

                // Comprueba que la fila corresponde al plan solicitado.
                if (
                    fila.querySelector("strong")?.firstChild
                        ?.textContent.trim() !== planes[indice].nombre
                ) {
                    return;
                }

                terminado = true;
                observador.disconnect();
                abrir.click();

                const url = new URL(location.href);
                url.searchParams.delete("plan");
                history.replaceState(null, "", url.href);
            } catch (error) {
                console.error(
                    "No se pudo seleccionar el plan:",
                    error
                );
            }
        }

        const observador = new MutationObserver(intentar);

        observador.observe(contenedor, {
            childList: true,
            subtree: true
        });

        intentar();
    }

    function iniciar() {
        const encabezado = document.querySelector(".encabezado");
        if (!encabezado) return;

        const hoja = document.createElement("link");
        hoja.rel = "stylesheet";
        hoja.href = new URL(
            "pages/notificaciones/notificaciones.css",
            base
        ).href;

        document.head.append(hoja);

        campana = boton("🔔", () => {
            try {
                generarEjemplos();
            } catch (error) {
                console.error(error);
            }

            mostrar();
            dialogo.showModal();
        }, "campana-notificaciones");

        campana.setAttribute("aria-haspopup", "dialog");

        contador = texto(
            "span",
            "",
            "contador-notificaciones"
        );

        contador.hidden = true;
        campana.append(contador);

        const perfil = encabezado.querySelector(
            ".menu-perfil, .perfil"
        );

        encabezado.insertBefore(campana, perfil);

        dialogo = document.createElement("dialog");
        dialogo.className = "panel-notificaciones";
        dialogo.setAttribute(
            "aria-labelledby",
            "titulo-notificaciones"
        );

        const cabecera = texto(
            "div",
            "",
            "cabecera-notificaciones"
        );

        const titulo = texto("h2", "Notificaciones");
        titulo.id = "titulo-notificaciones";

        const cerrar = boton(
            "×",
            () => dialogo.close(),
            "cerrar-notificaciones"
        );

        cerrar.setAttribute(
            "aria-label",
            "Cerrar notificaciones"
        );

        cabecera.append(titulo, cerrar);

        const filtros = texto(
            "div",
            "",
            "filtros-notificaciones"
        );

        for (const [id, nombre] of [
            ["todas", "Todas"],
            ["sin-leer", "Sin leer"]
        ]) {
            const filtroBoton = boton(nombre, () => {
                filtro = id;

                for (const elemento of filtros.querySelectorAll("button")) {
                    elemento.setAttribute(
                        "aria-pressed",
                        String(elemento === filtroBoton)
                    );
                }

                mostrar();
            });

            filtroBoton.setAttribute(
                "aria-pressed",
                String(id === filtro)
            );

            filtros.append(filtroBoton);
        }

        lista = texto("ul", "", "lista-notificaciones");
        aviso = texto("p", "");
        aviso.setAttribute("role", "status");

        dialogo.append(cabecera, filtros, aviso, lista);
        document.body.append(dialogo);

        dialogo.addEventListener("close", () => {
            campana.focus();
        });

        window.addEventListener("storage", (evento) => {
            if (evento.key === clave) mostrar();
        });

        try {
            generarEjemplos();
        } catch (error) {
            console.error(error);
        }

        mostrar();
        abrirPlanSolicitado();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar);
    } else {
        iniciar();
    }
})();