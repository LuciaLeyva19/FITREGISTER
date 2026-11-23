(() => {
    const clientes = [
        { id: "diego", nombre: "Diego Ruiz" },
        { id: "ana", nombre: "Ana Torres" },
        { id: "sofia", nombre: "Sofía Vega" }
    ];

    const claveDesvinculados =
        "fitregister-clientes-desvinculados-demo";

    const diasSemana = [
        "lunes", "martes", "miercoles", "jueves",
        "viernes", "sabado", "domingo"
    ];

    const estados = {
        completada: "Completada",
        "no-entreno": "No entrenó",
        pendiente: "Pendiente",
        "sin-registro": "Sin registro",
        descanso: "Descanso",
        "sin-programacion": "Sin programación"
    };

    const formatoDia = new Intl.DateTimeFormat("es-MX", {
        weekday: "short",
        day: "numeric"
    });

    const formatoFecha = new Intl.DateTimeFormat("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    const porId = (id) => document.getElementById(id);

    const buscador = porId("buscar-cliente");
    const resultados = porId("resultados-clientes");
    const selectorPlan = porId("plan-seguimiento");
    const aviso = porId("aviso-seguimiento");
    const vista = porId("vista-semana");
    const calendario = porId("dias-seguimiento");
    const periodoTexto = porId("periodo-seguimiento");

    let cliente = null;
    let planes = [];
    let inicioSemana = lunesDe(new Date());

    function clientesVinculados() {
        const datos = JSON.parse(
            localStorage.getItem(claveDesvinculados) ?? "[]"
        );

        if (
            !Array.isArray(datos) ||
            datos.some((id) => typeof id !== "string")
        ) {
            throw new Error(
                "No se pudo leer la vinculación de clientes."
            );
        }

        const desvinculados = new Set(datos);

        return clientes.filter(
            ({ id }) => !desvinculados.has(id)
        );
    }

    function sumarDias(fecha, cantidad) {
        const resultado = new Date(fecha);

        resultado.setHours(12, 0, 0, 0);
        resultado.setDate(resultado.getDate() + cantidad);

        return resultado;
    }

    function lunesDe(fecha) {
        return sumarDias(
            fecha,
            -((fecha.getDay() + 6) % 7)
        );
    }

    function claveFecha(fecha) {
        const anio = fecha.getFullYear();

        const mes = String(
            fecha.getMonth() + 1
        ).padStart(2, "0");

        const dia = String(
            fecha.getDate()
        ).padStart(2, "0");

        return `${anio}-${mes}-${dia}`;
    }

    function fechaValida(valor) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;

        const [anio, mes, dia] = valor.split("-").map(Number);

        if (anio < 1000 || anio > 9999) return false;

        const fecha = new Date(anio, mes - 1, dia, 12);

        return (
            fecha.getFullYear() === anio &&
            fecha.getMonth() === mes - 1 &&
            fecha.getDate() === dia
        );
    }

    function fechaLocal(valor) {
        const [anio, mes, dia] = valor.split("-").map(Number);
        return new Date(anio, mes - 1, dia, 12);
    }

    function normalizar(texto) {
        return texto.trim().toLowerCase()
            .normalize("NFD")
            .replace(/\p{M}/gu, "");
    }

    function leerLista(clave) {
        const datos = JSON.parse(
            localStorage.getItem(clave) ?? "[]"
        );

        if (!Array.isArray(datos)) {
            throw new Error(
                "Los datos guardados no son una lista."
            );
        }

        return datos;
    }

    function crear(etiqueta, texto = "", clase = "") {
        const nodo = document.createElement(etiqueta);
        nodo.textContent = texto;
        nodo.className = clase;
        return nodo;
    }

    function cerrarResultados() {
        resultados.replaceChildren();
        resultados.hidden = true;
        buscador.setAttribute("aria-expanded", "false");
    }

    function limpiarSeleccion(texto) {
        cliente = null;
        planes = [];
        buscador.value = "";
        vista.hidden = true;
        calendario.replaceChildren();
        periodoTexto.textContent = "";
        selectorPlan.disabled = true;

        selectorPlan.replaceChildren(
            new Option("Selecciona un cliente", "")
        );

        cerrarResultados();
        aviso.textContent = texto;
    }

    function validarClienteActual() {
        if (!cliente) return false;

        try {
            const disponible = clientesVinculados().some(
                ({ id }) => id === cliente.id
            );

            if (disponible) return true;

            const nombre = cliente.nombre;

            limpiarSeleccion(
                `${nombre} ya no está vinculado. Selecciona otro cliente.`
            );
        } catch {
            limpiarSeleccion(
                "No se pudo comprobar la vinculación del cliente."
            );
        }

        return false;
    }

    function revisarVinculacion() {
        if (cliente) {
            validarClienteActual();
        } else if (!resultados.hidden) {
            mostrarCoincidencias();
        }
    }

    function planSeleccionado() {
        return planes.find(
            (plan) => String(plan.id) === selectorPlan.value
        );
    }

    function obtenerPeriodo(plan) {
        const tieneInicio = Boolean(plan.fechaInicio);
        const tieneFin = Boolean(plan.fechaFin);

        if (tieneInicio || tieneFin) {
            if (
                !fechaValida(plan.fechaInicio) ||
                !fechaValida(plan.fechaFin) ||
                plan.fechaInicio > plan.fechaFin
            ) {
                throw new Error(
                    "Este plan tiene un periodo inválido. Corrígelo en Rutinas."
                );
            }

            return {
                inicio: plan.fechaInicio,
                fin: plan.fechaFin,
                anterior: false
            };
        }

        const creacion = plan.creadoEn
            ? new Date(plan.creadoEn)
            : null;

        return {
            inicio: creacion && !Number.isNaN(creacion.getTime())
                ? claveFecha(creacion)
                : "",
            fin: "",
            anterior: true
        };
    }

    function mostrarCoincidencias() {
        const consulta = normalizar(buscador.value);

        cerrarResultados();

        if (!consulta) return;

        resultados.hidden = false;
        buscador.setAttribute("aria-expanded", "true");

        try {
            const disponibles = clientesVinculados();

            const coincidencias = disponibles
                .filter(({ nombre }) =>
                    normalizar(nombre).includes(consulta)
                )
                .slice(0, 8);

            if (!coincidencias.length) {
                resultados.append(
                    crear(
                        "li",
                        disponibles.length
                            ? "No hay clientes vinculados con ese nombre."
                            : "Aún no tienes clientes vinculados."
                    )
                );
                return;
            }

            for (const coincidencia of coincidencias) {
                const fila = crear("li");
                const boton = crear(
                    "button",
                    coincidencia.nombre
                );

                boton.type = "button";

                boton.addEventListener("click", () => {
                    seleccionarCliente(coincidencia);
                    buscador.focus();
                });

                fila.append(boton);
                resultados.append(fila);
            }
        } catch {
            resultados.append(
                crear(
                    "li",
                    "No se pudo consultar la lista de clientes vinculados."
                )
            );
        }
    }

    function seleccionarCliente(seleccionado) {
        try {
            const disponible = clientesVinculados().find(
                ({ id }) => id === seleccionado.id
            );

            if (!disponible) {
                limpiarSeleccion(
                    "Ese cliente ya no está vinculado."
                );
                return;
            }

            cliente = disponible;
            buscador.value = cliente.nombre;

            cerrarResultados();
            cargarPlanes(true);
        } catch {
            limpiarSeleccion(
                "No se pudo comprobar la vinculación del cliente."
            );
        }
    }

    function ubicarSemanaDelPlan() {
        const plan = planSeleccionado();

        if (!plan) return;

        try {
            const periodo = obtenerPeriodo(plan);
            const hoy = claveFecha(new Date());

            let referencia = hoy;

            if (periodo.inicio && hoy < periodo.inicio) {
                referencia = periodo.inicio;
            } else if (periodo.fin && hoy > periodo.fin) {
                referencia = periodo.fin;
            }

            inicioSemana = lunesDe(
                fechaLocal(referencia)
            );
        } catch {
            inicioSemana = lunesDe(new Date());
        }
    }

    function cargarPlanes(reubicar = false) {
        const planAnterior = selectorPlan.value;

        planes = [];
        vista.hidden = true;
        selectorPlan.disabled = true;

        selectorPlan.replaceChildren(
            new Option("Selecciona un cliente", "")
        );

        if (!cliente) {
            aviso.textContent =
                "Busca y selecciona un cliente para ver su calendario.";
            return;
        }

        if (!validarClienteActual()) return;

        try {
            planes = leerLista(
                `fitregister-planes-${cliente.id}`
            );
        } catch {
            aviso.textContent =
                "No se pudieron leer los planes guardados.";
            return;
        }

        if (!planes.length) {
            selectorPlan.replaceChildren(
                new Option("Sin planes semanales", "")
            );

            aviso.textContent =
                `${cliente.nombre} todavía no tiene un plan semanal asignado.`;

            return;
        }

        selectorPlan.replaceChildren(
            ...planes.map(
                (plan) => new Option(plan.nombre, plan.id)
            )
        );

        selectorPlan.disabled = false;

        const conservaPlan = planes.some(
            (plan) => String(plan.id) === planAnterior
        );

        if (conservaPlan) {
            selectorPlan.value = planAnterior;
        }

        if (reubicar || !conservaPlan) {
            ubicarSemanaDelPlan();
        }

        mostrarSemana();
    }

    function crearDia(fecha, rutina, estado, fechaHoy) {
        const clave = claveFecha(fecha);
        const tarjeta = crear("li", "", "dia-seguimiento");

        const etiquetaFecha = crear(
            "time",
            formatoDia.format(fecha)
        );

        etiquetaFecha.dateTime = clave;
        tarjeta.append(etiquetaFecha);

        if (clave === fechaHoy) {
            tarjeta.setAttribute("aria-current", "date");
        }

        if (rutina) {
            tarjeta.append(
                crear(
                    "p",
                    rutina.nombre,
                    "rutina-del-dia"
                )
            );
        }

        tarjeta.append(
            crear(
                "span",
                estados[estado],
                `estado-seguimiento estado-${estado}`
            )
        );

        return tarjeta;
    }

    function mostrarSemana() {
        if (!validarClienteActual()) return;

        const plan = planSeleccionado();

        if (!plan) return;

        let registros;
        let periodo;

        try {
            registros = leerLista(
                "fitregister-cumplimiento-demo"
            );

            periodo = obtenerPeriodo(plan);

            if (!Array.isArray(plan.dias)) {
                throw new Error(
                    "Este plan no tiene días válidos. Revísalo en Rutinas."
                );
            }
        } catch (error) {
            vista.hidden = true;

            aviso.textContent =
                error.message ||
                "No se pudo mostrar el calendario.";

            return;
        }

        const fechaHoy = claveFecha(new Date());
        const domingo = sumarDias(inicioSemana, 6);
        const tarjetas = document.createDocumentFragment();

        let programadas = 0;
        let completadas = 0;

        for (const [indice, dia] of diasSemana.entries()) {
            const fecha = sumarDias(inicioSemana, indice);
            const clave = claveFecha(fecha);

            const vigente =
                (!periodo.inicio || clave >= periodo.inicio) &&
                (!periodo.fin || clave <= periodo.fin);

            const rutina = vigente
                ? plan.dias.find((item) => item.dia === dia)
                : null;

            let estado = vigente
                ? "descanso"
                : "sin-programacion";

            if (rutina) {
                programadas += 1;

                // Ante duplicados, usa la última entrada,
                // igual que Inicio.
                const registro = registros.findLast(
                    (item) =>
                        item &&
                        item.clienteId === cliente.id &&
                        item.planId === plan.id &&
                        item.fecha === clave &&
                        ["completada", "no-entreno"].includes(
                            item.estado
                        )
                );

                estado = clave < fechaHoy
                    ? "sin-registro"
                    : "pendiente";

                if (clave <= fechaHoy && registro) {
                    estado = registro.estado;
                }

                if (estado === "completada") {
                    completadas += 1;
                }
            }

            tarjetas.append(
                crearDia(
                    fecha,
                    rutina,
                    estado,
                    fechaHoy
                )
            );
        }

        aviso.textContent = "";

        if (periodo.anterior) {
            periodoTexto.textContent =
                "Plan anterior sin periodo definido. Se muestra desde su creación; asigna sus fechas en Rutinas.";
        } else {
            periodoTexto.textContent =
                `Periodo del plan: del ${
                    formatoFecha.format(
                        fechaLocal(periodo.inicio)
                    )
                } al ${
                    formatoFecha.format(
                        fechaLocal(periodo.fin)
                    )
                }.`;
        }

        calendario.replaceChildren(tarjetas);

        porId("rango-semana").textContent =
            formatoFecha.formatRange(
                inicioSemana,
                domingo
            );

        porId("porcentaje-semana").textContent = programadas
            ? `${Math.round(completadas / programadas * 100)}%`
            : "—";

        porId("resumen-semana").textContent = programadas
            ? `${completadas} de ${programadas} sesiones programadas completadas.`
            : "Esta semana no tiene sesiones programadas para este plan.";

        vista.hidden = false;
    }

    buscador.addEventListener("input", () => {
        cliente = null;
        cargarPlanes();
        mostrarCoincidencias();
    });

    buscador.addEventListener("focus", () => {
        if (!cliente) mostrarCoincidencias();
    });

    buscador.closest(".buscador-cliente").addEventListener(
        "keydown",
        (evento) => {
            if (evento.key === "Escape") {
                cerrarResultados();
                buscador.focus();
            }

            if (
                evento.key === "ArrowDown" &&
                evento.target === buscador &&
                !resultados.hidden
            ) {
                evento.preventDefault();
                resultados.querySelector("button")?.focus();
            }
        }
    );

    document.addEventListener("click", (evento) => {
        if (!evento.target.closest(".buscador-cliente")) {
            cerrarResultados();
        }
    });

    selectorPlan.addEventListener("change", () => {
        ubicarSemanaDelPlan();
        mostrarSemana();
    });

    porId("semana-anterior").addEventListener("click", () => {
        inicioSemana = sumarDias(inicioSemana, -7);
        mostrarSemana();
    });

    porId("semana-siguiente").addEventListener("click", () => {
        inicioSemana = sumarDias(inicioSemana, 7);
        mostrarSemana();
    });

    porId("semana-actual").addEventListener("click", () => {
        inicioSemana = lunesDe(new Date());
        mostrarSemana();
    });

    window.addEventListener("pageshow", () => {
        if (cliente) cargarPlanes();
    });

    window.addEventListener("focus", revisarVinculacion);

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            revisarVinculacion();
        }
    });

    window.addEventListener("storage", (evento) => {
        if (
            evento.key === null ||
            evento.key === claveDesvinculados
        ) {
            revisarVinculacion();
        }

        if (!cliente) return;

        if (
            evento.key === null ||
            evento.key === `fitregister-planes-${cliente.id}` ||
            evento.key === "fitregister-cumplimiento-demo"
        ) {
            cargarPlanes();
        }
    });

    const clienteId = new URLSearchParams(
        location.search
    ).get("cliente");

    if (clienteId) {
        const inicial = clientes.find(
            ({ id }) => id === clienteId
        );

        if (inicial) {
            seleccionarCliente(inicial);
        } else {
            limpiarSeleccion(
                "El cliente del enlace no está disponible."
            );
        }
    } else {
        cargarPlanes();
    }
})();