(() => {
    const clientes = [
        { id: "diego", nombre: "Diego Ruiz" },
        { id: "ana", nombre: "Ana Torres" },
        { id: "sofia", nombre: "Sofía Vega" }
    ];

    const dias = [
        "domingo", "lunes", "martes", "miercoles",
        "jueves", "viernes", "sabado"
    ];

    const porId = (id) => document.getElementById(id);

    const formatoCorto = new Intl.DateTimeFormat("es-MX", {
        weekday: "short",
        day: "numeric",
        month: "short"
    });

    const formatoFecha = new Intl.DateTimeFormat("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });

    const formatoLargo = new Intl.DateTimeFormat("es-MX", {
        day: "numeric",
        month: "short"
    });

    const SVG = "http://www.w3.org/2000/svg";

    function leerLista(clave) {
        const datos = JSON.parse(
            localStorage.getItem(clave) ?? "[]"
        );

        if (!Array.isArray(datos)) {
            throw new Error(
                `Revisa los datos guardados en ${clave}.`
            );
        }

        return datos;
    }

    function claveFecha(fecha) {
        return `${fecha.getFullYear()}-${
            String(fecha.getMonth() + 1).padStart(2, "0")
        }-${
            String(fecha.getDate()).padStart(2, "0")
        }`;
    }

    function fechaLocal(clave) {
        const [anio, mes, dia] = clave.split("-").map(Number);
        return new Date(anio, mes - 1, dia, 12);
    }

    function fechaValida(valor) {
        if (
            typeof valor !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(valor)
        ) {
            return false;
        }

        const [anio, mes, dia] = valor.split("-").map(Number);
        const fecha = fechaLocal(valor);

        return (
            anio >= 1000 &&
            anio <= 9999 &&
            fecha.getFullYear() === anio &&
            fecha.getMonth() === mes - 1 &&
            fecha.getDate() === dia
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

    function crear(etiqueta, texto = "", clase = "") {
        const elemento = document.createElement(etiqueta);
        elemento.textContent = texto;
        elemento.className = clase;
        return elemento;
    }

    function periodoDe(plan) {
        if (plan.fechaInicio || plan.fechaFin) {
            if (
                !fechaValida(plan.fechaInicio) ||
                !fechaValida(plan.fechaFin) ||
                plan.fechaInicio > plan.fechaFin
            ) {
                throw new Error(
                    `Revisa las fechas del plan «${plan.nombre}» en Rutinas.`
                );
            }

            return {
                inicio: plan.fechaInicio,
                fin: plan.fechaFin
            };
        }

        // Compatibilidad con los planes anteriores,
        // igual que en Seguimiento.
        const creacion = plan.creadoEn
            ? new Date(plan.creadoEn)
            : null;

        return {
            inicio: creacion && !Number.isNaN(creacion.getTime())
                ? claveFecha(creacion)
                : "",
            fin: ""
        };
    }

    function vigente(asignacion, clave) {
        return (
            (
                !asignacion.periodo.inicio ||
                clave >= asignacion.periodo.inicio
            ) &&
            (
                !asignacion.periodo.fin ||
                clave <= asignacion.periodo.fin
            )
        );
    }

    function claveRegistro(clienteId, planId, fecha) {
        return JSON.stringify([
            clienteId,
            planId,
            fecha
        ]);
    }

    function obtenerRegistros(vinculados, hoy) {
        const ids = new Set(
            vinculados.map(({ id }) => id)
        );

        const mapa = new Map();
        const fechaHoy = claveFecha(hoy);

        for (
            const registro of leerLista(
                "fitregister-cumplimiento-demo"
            )
        ) {
            if (
                !registro ||
                !ids.has(registro.clienteId) ||
                typeof registro.planId !== "string" ||
                !fechaValida(registro.fecha) ||
                registro.fecha > fechaHoy ||
                !["completada", "no-entreno"].includes(
                    registro.estado
                )
            ) {
                continue;
            }

            // Ante duplicados, prevalece la última
            // entrada guardada en la lista.
            const clave = claveRegistro(
                registro.clienteId,
                registro.planId,
                registro.fecha
            );

            mapa.delete(clave);
            mapa.set(clave, registro);
        }

        return mapa;
    }

    function obtenerProximas(asignaciones, registros, hoy) {
        const sesiones = [];

        for (let avance = 0; avance < 7; avance += 1) {
            const fecha = sumarDias(hoy, avance);
            const clave = claveFecha(fecha);
            const dia = dias[fecha.getDay()];

            for (const asignacion of asignaciones) {
                if (!vigente(asignacion, clave)) continue;

                const { cliente, plan } = asignacion;

                const rutina = plan.dias.find(
                    (item) => item.dia === dia
                );

                if (
                    !rutina ||
                    registros.has(
                        claveRegistro(
                            cliente.id,
                            plan.id,
                            clave
                        )
                    )
                ) {
                    continue;
                }

                sesiones.push({
                    cliente,
                    plan,
                    rutina,
                    fecha
                });
            }
        }

        return sesiones.slice(0, 5);
    }

    function mostrarProximas(sesiones) {
        const lista = porId("proximas-rutinas");

        if (!sesiones.length) {
            lista.replaceChildren(
                crear(
                    "li",
                    "No hay rutinas pendientes en los próximos 7 días."
                )
            );
            return;
        }

        lista.replaceChildren(
            ...sesiones.map(
                ({ cliente, plan, rutina, fecha }) => {
                    const fila = crear("li");
                    const datos = crear(
                        "div",
                        "",
                        "datos-proxima"
                    );

                    datos.append(
                        crear("strong", cliente.nombre),
                        crear(
                            "span",
                            `${rutina.nombre} · ${
                                formatoCorto.format(fecha)
                            }`
                        ),
                        crear("small", plan.nombre)
                    );

                    fila.append(datos);
                    return fila;
                }
            )
        );
    }

    function mostrarUltimos(vinculados, asignaciones, registros) {
        const tabla = porId("ultimos-registros");

        const ultimos = [...registros.values()]
            .reverse()
            .sort(
                (a, b) => b.fecha.localeCompare(a.fecha)
            )
            .slice(0, 5);

        if (!ultimos.length) {
            const fila = crear("tr");

            const celda = crear(
                "td",
                "Aún no hay confirmaciones de entrenamiento."
            );

            celda.colSpan = 4;
            fila.append(celda);
            tabla.replaceChildren(fila);

            return;
        }

        tabla.replaceChildren(
            ...ultimos.map((registro) => {
                const cliente = vinculados.find(
                    ({ id }) => id === registro.clienteId
                );

                const asignacion = asignaciones.find(
                    ({ cliente, plan }) =>
                        cliente.id === registro.clienteId &&
                        plan.id === registro.planId
                );

                const fecha = fechaLocal(registro.fecha);

                const rutina = asignacion?.plan.dias.find(
                    (item) =>
                        item.dia === dias[fecha.getDay()]
                );

                const nombre =
                    registro.rutinaNombre ||
                    registro.nombreRutina ||
                    rutina?.nombre ||
                    asignacion?.plan.nombre ||
                    "Rutina registrada";

                const fila = crear("tr");
                const celdaEstado = crear("td");

                celdaEstado.append(
                    crear(
                        "span",
                        registro.estado === "completada"
                            ? "Completada"
                            : "No entrenó",
                        registro.estado === "completada"
                            ? "estado"
                            : "estado estado-no-entreno"
                    )
                );

                fila.append(
                    crear("td", cliente.nombre),
                    crear("td", nombre),
                    crear(
                        "td",
                        formatoFecha.format(fecha)
                    ),
                    celdaEstado
                );

                return fila;
            })
        );
    }

    function mostrarGrafica(registros, hoy) {
        const lunes = lunesDe(hoy);

        const valores = Array.from(
            { length: 7 },
            (_, indice) => {
                const clave = claveFecha(
                    sumarDias(lunes, indice)
                );

                return [...registros.values()].filter(
                    (registro) =>
                        registro.fecha === clave &&
                        registro.estado === "completada"
                ).length;
            }
        );

        const maximo = Math.max(1, ...valores);

        const puntos = valores.map(
            (cantidad, indice) => [
                10 + indice * 100,
                160 - cantidad / maximo * 140
            ]
        );

        const recorrido = puntos
            .map(([x, y]) => `${x},${y}`)
            .join(" ");

        porId("linea-semana").setAttribute(
            "points",
            recorrido
        );

        porId("area-semana").setAttribute(
            "d",
            `M${
                puntos
                    .map(([x, y]) => `${x} ${y}`)
                    .join(" L")
            } V160 H10 Z`
        );

        porId("puntos-semana").replaceChildren(
            ...puntos.map(([x, y]) => {
                const punto = document.createElementNS(
                    SVG,
                    "circle"
                );

                punto.setAttribute("cx", x);
                punto.setAttribute("cy", y);
                punto.setAttribute("r", "5");

                return punto;
            })
        );

        const nombres = [
            "Lunes", "Martes", "Miércoles", "Jueves",
            "Viernes", "Sábado", "Domingo"
        ];

        porId("grafica-semana").setAttribute(
            "aria-label",
            `Entrenamientos completados. ${
                valores
                    .map(
                        (valor, indice) =>
                            `${nombres[indice]}: ${valor}`
                    )
                    .join(". ")
            }.`
        );

        porId("rango-resumen").textContent =
            `${formatoLargo.format(lunes)} – ${
                formatoLargo.format(sumarDias(lunes, 6))
            }`;

        const total = valores.reduce(
            (suma, valor) => suma + valor,
            0
        );

        porId("detalle-grafica").textContent = total
            ? `${total} ${
                total === 1
                    ? "entrenamiento completado"
                    : "entrenamientos completados"
            } esta semana.`
            : "Aún no hay entrenamientos completados esta semana.";
    }

    function mostrarCumplimiento(asignaciones, registros, hoy) {
        const lunes = lunesDe(hoy);
        const fechaHoy = claveFecha(hoy);

        let programadas = 0;
        let completadas = 0;
        let noEntreno = 0;

        for (let indice = 0; indice < 7; indice += 1) {
            const fecha = sumarDias(lunes, indice);
            const clave = claveFecha(fecha);

            if (clave > fechaHoy) continue;

            for (const asignacion of asignaciones) {
                if (!vigente(asignacion, clave)) continue;

                const tieneRutina = asignacion.plan.dias.some(
                    (dia) =>
                        dia.dia === dias[fecha.getDay()]
                );

                if (!tieneRutina) continue;

                programadas += 1;

                const registro = registros.get(
                    claveRegistro(
                        asignacion.cliente.id,
                        asignacion.plan.id,
                        clave
                    )
                );

                if (registro?.estado === "completada") {
                    completadas += 1;
                }

                if (registro?.estado === "no-entreno") {
                    noEntreno += 1;
                }
            }
        }

        const porcentaje = programadas
            ? Math.round(completadas / programadas * 100)
            : 0;

        porId("porcentaje-inicio").textContent =
            programadas ? `${porcentaje}%` : "—";

        porId("anillo-inicio").style.setProperty(
            "--cumplimiento",
            `${porcentaje}%`
        );

        porId("completadas-inicio").textContent = completadas;
        porId("no-entreno-inicio").textContent = noEntreno;

        porId("sin-confirmar-inicio").textContent =
            programadas - completadas - noEntreno;

        porId("detalle-cumplimiento").textContent = programadas
            ? "Sesiones de esta semana programadas hasta hoy. No incluye días futuros ni descansos."
            : "No hay sesiones programadas hasta hoy para esta semana.";
    }

    function actualizarInicio() {
        const aviso = porId("aviso-inicio");
        aviso.textContent = "";

        try {
            const desvinculados = new Set(
                leerLista(
                    "fitregister-clientes-desvinculados-demo"
                )
            );

            const vinculados = clientes.filter(
                ({ id }) => !desvinculados.has(id)
            );

            const asignaciones = vinculados.flatMap(
                (cliente) =>
                    leerLista(
                        `fitregister-planes-${cliente.id}`
                    ).map((plan) => {
                        if (
                            !plan ||
                            typeof plan.id !== "string" ||
                            typeof plan.nombre !== "string" ||
                            !Array.isArray(plan.dias) ||
                            plan.dias.some(
                                (dia) =>
                                    !dia ||
                                    !dias.includes(dia.dia) ||
                                    typeof dia.nombre !== "string"
                            )
                        ) {
                            throw new Error(
                                `Revisa los planes guardados de ${cliente.nombre}.`
                            );
                        }

                        return {
                            cliente,
                            plan,
                            periodo: periodoDe(plan)
                        };
                    })
            );

            const hoy = new Date();
            const registros = obtenerRegistros(vinculados, hoy);

            porId("total-clientes").textContent =
                vinculados.length;

            porId("total-clientes-tarjeta").textContent =
                vinculados.length;

            porId("total-rutinas").textContent =
                asignaciones.length;

            mostrarProximas(
                obtenerProximas(asignaciones, registros, hoy)
            );

            mostrarUltimos(
                vinculados,
                asignaciones,
                registros
            );

            mostrarGrafica(registros, hoy);

            mostrarCumplimiento(
                asignaciones,
                registros,
                hoy
            );

            porId("nota-inicio").textContent =
                "Información del prototipo guardada en este dispositivo. Los planes sin fechas conservan su programación desde la creación.";
        } catch (error) {
            for (const id of [
                "total-clientes",
                "total-clientes-tarjeta",
                "total-rutinas",
                "porcentaje-inicio",
                "completadas-inicio",
                "no-entreno-inicio",
                "sin-confirmar-inicio"
            ]) {
                porId(id).textContent = "—";
            }

            porId("anillo-inicio").style.setProperty(
                "--cumplimiento",
                "0%"
            );

            porId("proximas-rutinas").replaceChildren(
                crear(
                    "li",
                    "No se pudo cargar la programación."
                )
            );

            porId("ultimos-registros").replaceChildren();

            mostrarGrafica(new Map(), new Date());

            porId("detalle-grafica").textContent =
                "Información no disponible.";

            porId("detalle-cumplimiento").textContent =
                "Información no disponible.";

            aviso.textContent =
                error.message ||
                "No se pudieron consultar los datos locales.";
        }
    }

    window.addEventListener("pageshow", actualizarInicio);

    window.addEventListener("storage", (evento) => {
        if (
            evento.key === null ||
            evento.key.startsWith("fitregister-planes-") ||
            [
                "fitregister-clientes-desvinculados-demo",
                "fitregister-cumplimiento-demo"
            ].includes(evento.key)
        ) {
            actualizarInicio();
        }
    });

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            actualizarInicio();
        }
    });

    setInterval(() => {
        if (document.visibilityState === "visible") {
            actualizarInicio();
        }
    }, 60000);

    actualizarInicio();
})();