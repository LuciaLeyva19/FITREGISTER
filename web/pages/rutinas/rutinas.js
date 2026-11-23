(() => {
    const porId = (id) => document.getElementById(id);
    const formulario = porId("form-plan");
    if (!formulario) return;
    const servicio = window.PlanesServicio,
        servicioEjercicios = window.EjerciciosServicio;
    const claveDesvinculados = "fitregister-clientes-desvinculados-demo";
    const clientes = [
        {
            id: "diego",
            nombre: "Diego Ruiz",
        },
        {
            id: "ana",
            nombre: "Ana Torres",
        },
        {
            id: "sofia",
            nombre: "Sofía Vega",
        },
    ];
    const semana = [
        {
            id: "lunes",
            nombre: "Lunes",
            corto: "Lun",
        },
        {
            id: "martes",
            nombre: "Martes",
            corto: "Mar",
        },
        {
            id: "miercoles",
            nombre: "Miércoles",
            corto: "Mié",
        },
        {
            id: "jueves",
            nombre: "Jueves",
            corto: "Jue",
        },
        {
            id: "viernes",
            nombre: "Viernes",
            corto: "Vie",
        },
        {
            id: "sabado",
            nombre: "Sábado",
            corto: "Sáb",
        },
        {
            id: "domingo",
            nombre: "Domingo",
            corto: "Dom",
        },
    ];
    const catalogo = servicioEjercicios?.catalogo ?? [];
    const formatoFecha = new Intl.DateTimeFormat("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
    const buscarCliente = porId("buscar-cliente"),
        resultadosClientes = porId("resultados-clientes"),
        nombrePlan = porId("nombre-plan"),
        fechaInicio = porId("fecha-inicio"),
        fechaFin = porId("fecha-fin"),
        resumenPeriodo = porId("resumen-periodo");
    const buscarEjercicio = porId("buscar-ejercicio"),
        resultadosEjercicios = porId("resultados-ejercicios"),
        selectorDia = porId("dia-activo"),
        nombreDia = porId("nombre-dia"),
        foto = porId("foto-ejercicio"),
        series = porId("series"),
        repeticiones = porId("repeticiones"),
        agregar = porId("agregar-ejercicio"),
        guardar = porId("guardar-plan"),
        mensaje = porId("mensaje-plan");
    const casillas = new Map();
    const rutinasPorDia = Object.fromEntries(
        semana.map(({ id }) => [
            id,
            {
                nombre: "",
                ejercicios: [],
            },
        ]),
    );
    let cliente = null,
        clienteConfirmado = false,
        diaActivo = "",
        ejercicioSeleccionado = null,
        indiceEdicion = null,
        planEnEdicion = null,
        guardando = false,
        versionLista = 0;
    let iniciando = true,
        restaurando = false,
        firmaBase = "",
        ultimaFirmaSolicitada = "",
        borradorExiste = false,
        revisionBorrador = 0,
        aperturaBorradores,
        colaBorradores = Promise.resolve(),
        salidaAutorizada = false;

    function crear(tag, texto = "", clase = "") {
        const e = document.createElement(tag);
        e.textContent = texto;
        e.className = clase;
        return e;
    }

    function boton(texto, clase, accion) {
        const e = crear("button", texto, clase);
        e.type = "button";
        e.addEventListener("click", accion);
        return e;
    }

    function avisar(texto, error = false) {
        mensaje.textContent = texto;
        mensaje.dataset.error = String(error);
    }

    function normalizar(texto) {
        return texto
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/\p{M}/gu, "");
    }

    function clientesVinculados() {
        const datos = JSON.parse(
            localStorage.getItem(claveDesvinculados) ?? "[]",
        );
        if (!Array.isArray(datos) || datos.some((id) => typeof id !== "string"))
            throw new Error("No se pudo leer la vinculación de clientes.");
        const desvinculados = new Set(datos);
        return clientes.filter(({ id }) => !desvinculados.has(id));
    }

    function notificarCliente() {
        window.dispatchEvent(
            new CustomEvent("fitregister:cliente-seleccionado", {
                detail: {
                    clienteId: clienteConfirmado ? (cliente?.id ?? null) : null,
                },
            }),
        );
    }

    function notificarFicha() {
        window.dispatchEvent(
            new CustomEvent("fitregister:ficha-ejercicio", {
                detail: {
                    ejercicioId: ejercicioSeleccionado?.id ?? null,
                },
            }),
        );
    }

    function cerrarResultadosClientes() {
        resultadosClientes.replaceChildren();
        resultadosClientes.hidden = true;
        buscarCliente.setAttribute("aria-expanded", "false");
    }

    function ocultarPlanesGuardados() {
        versionLista += 1;
        const lista = porId("lista-planes");
        lista.replaceChildren();
        delete lista.dataset.clienteId;
        porId("planes-guardados").hidden = true;
        delete formulario.dataset.clienteId;
    }

    function descartarCliente(limpiar = false) {
        cliente = null;
        clienteConfirmado = false;
        planEnEdicion = null;
        buscarCliente.disabled = false;
        guardar.textContent = "Guardar plan semanal";
        if (limpiar) buscarCliente.value = "";
        ocultarPlanesGuardados();
        cerrarResultadosClientes();
        notificarCliente();
    }

    function validarClienteActual() {
        if (!cliente || !clienteConfirmado) {
            avisar("Busca y selecciona un cliente de los resultados.", true);
            return false;
        }
        try {
            if (clientesVinculados().some(({ id }) => id === cliente.id))
                return true;
            const nombre = cliente.nombre;
            descartarCliente(true);
            registrarCambio();
            avisar(
                `${nombre} ya no está vinculado. Selecciona otro cliente para continuar.`,
                true,
            );
        } catch {
            descartarCliente(true);
            registrarCambio();
            avisar("No se pudo comprobar la vinculación del cliente.", true);
        }
        return false;
    }

    function revisarVinculacion() {
        if (iniciando || restaurando) return;
        if (cliente) {
            try {
                if (!clientesVinculados().some(({ id }) => id === cliente.id)) {
                    const nombre = cliente.nombre;
                    descartarCliente(true);
                    registrarCambio();
                    avisar(
                        `${nombre} ya no está vinculado. Conservamos el trabajo como borrador.`,
                        true,
                    );
                }
            } catch {
                avisar(
                    "No se pudo comprobar la vinculación de clientes.",
                    true,
                );
            }
        }
        if (!resultadosClientes.hidden) buscarClientes();
    }

    function fechaValida(valor) {
        if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor))
            return false;
        const [a, m, d] = valor.split("-").map(Number),
            f = new Date(a, m - 1, d, 12);
        return (
            a >= 1000 &&
            a <= 9999 &&
            f.getFullYear() === a &&
            f.getMonth() === m - 1 &&
            f.getDate() === d
        );
    }

    function fechaLocal(valor) {
        const [a, m, d] = valor.split("-").map(Number);
        return new Date(a, m - 1, d, 12);
    }

    function periodoValido(inicio, fin) {
        return fechaValida(inicio) && fechaValida(fin) && inicio <= fin;
    }

    function textoPeriodo(inicio, fin) {
        return `Del ${formatoFecha.format(fechaLocal(inicio))} al ${formatoFecha.format(fechaLocal(fin))}`;
    }

    function diasSeleccionados() {
        return semana.filter(({ id }) => casillas.get(id).checked);
    }

    function actualizarPeriodo() {
        const inicio = fechaInicio.value,
            fin = fechaFin.value;
        if (fechaValida(inicio)) fechaFin.min = inicio;
        else fechaFin.removeAttribute("min");
        resumenPeriodo.textContent = "";
        resumenPeriodo.dataset.error = "false";
        if (!inicio || !fin) return;
        if (!periodoValido(inicio, fin)) {
            resumenPeriodo.textContent =
                "Revisa las fechas: el fin no puede ser anterior al inicio.";
            resumenPeriodo.dataset.error = "true";
            return;
        }
        const dias = diasSeleccionados().map(({ nombre }) => nombre);
        resumenPeriodo.textContent = `${textoPeriodo(inicio, fin)}. ${dias.length ? `Entrenamiento: ${dias.join(", ")}.` : "Selecciona los días de entrenamiento."}`;
    }

    function validarPeriodo() {
        if (!fechaValida(fechaInicio.value)) {
            avisar("Selecciona una fecha de inicio válida.", true);
            fechaInicio.focus();
            return false;
        }
        if (!fechaValida(fechaFin.value)) {
            avisar("Selecciona una fecha de fin válida.", true);
            fechaFin.focus();
            return false;
        }
        if (fechaFin.value < fechaInicio.value) {
            avisar(
                "La fecha de fin no puede ser anterior a la fecha de inicio.",
                true,
            );
            fechaFin.focus();
            return false;
        }
        const seleccionados = new Set(diasSeleccionados().map(({ id }) => id)),
            fecha = fechaLocal(fechaInicio.value),
            limite = fechaLocal(fechaFin.value);
        for (let i = 0; i < 7 && fecha <= limite; i += 1) {
            if (seleccionados.has(semana[(fecha.getDay() + 6) % 7].id))
                return true;
            fecha.setDate(fecha.getDate() + 1);
        }
        avisar(
            "El periodo no incluye ninguno de los días de entrenamiento seleccionados.",
            true,
        );
        fechaFin.focus();
        return false;
    }
    // Un borrador por navegador. No se escribe en la cola de sincronización.
    const panelBorrador = crear("section", "", "tarjeta");
    panelBorrador.hidden = true;
    panelBorrador.style.marginTop = "20px";
    panelBorrador.setAttribute("aria-labelledby", "titulo-recuperar-borrador");
    const tituloBorrador = crear("h2", "Tienes un borrador sin terminar");
    tituloBorrador.id = "titulo-recuperar-borrador";
    const detalleBorrador = crear("p", "", "texto-secundario"),
        accionesBorrador = crear("div", "", "acciones-plan");
    const continuarBorrador = boton("Continuar borrador", "boton", () => {}),
        descartarBorrador = boton(
            "Descartar",
            "boton boton-secundario",
            () => {},
        );
    accionesBorrador.append(continuarBorrador, descartarBorrador);
    panelBorrador.append(tituloBorrador, detalleBorrador, accionesBorrador);
    const estadoBorrador = crear("p", "", "texto-secundario");
    estadoBorrador.setAttribute("role", "status");
    estadoBorrador.hidden = true;
    estadoBorrador.style.fontSize = "13px";
    formulario.before(panelBorrador, estadoBorrador);

    function mostrarEstadoBorrador(texto) {
        estadoBorrador.textContent = texto;
        estadoBorrador.hidden = !texto;
    }

    function abrirBorradores() {
        if (aperturaBorradores) return aperturaBorradores;
        aperturaBorradores = new Promise((resolve, reject) => {
            const solicitud = indexedDB.open("fitregister-borradores-demo", 1);
            solicitud.onupgradeneeded = () =>
                solicitud.result.createObjectStore("borradores", {
                    keyPath: "id",
                });
            solicitud.onsuccess = () => {
                const bd = solicitud.result;
                bd.onversionchange = () => {
                    bd.close();
                    aperturaBorradores = null;
                };
                resolve(bd);
            };
            solicitud.onerror = () => {
                aperturaBorradores = null;
                reject(
                    new Error(
                        "No se pudo abrir el almacenamiento de borradores.",
                    ),
                );
            };
        });
        return aperturaBorradores;
    }

    function operarBorrador(accion, datos = null) {
        const tarea = colaBorradores
            .catch(() => {})
            .then(async () => {
                const bd = await abrirBorradores();
                return new Promise((resolve, reject) => {
                    const tx = bd.transaction(
                            "borradores",
                            accion === "leer" ? "readonly" : "readwrite",
                        ),
                        almacen = tx.objectStore("borradores");
                    let solicitud;
                    if (accion === "leer") solicitud = almacen.get("actual");
                    else if (accion === "guardar")
                        almacen.put({
                            id: "actual",
                            actualizadoEn: new Date().toISOString(),
                            datos,
                        });
                    else almacen.delete("actual");
                    tx.oncomplete = () => resolve(solicitud?.result);
                    tx.onabort = () =>
                        reject(new Error("No se pudo actualizar el borrador."));
                });
            });
        colaBorradores = tarea;
        return tarea;
    }

    function obtenerEstado() {
        return {
            version: 1,
            clienteId: cliente?.id ?? null,
            clienteConfirmado,
            busquedaCliente: buscarCliente.value,
            planId: planEnEdicion,
            nombre: nombrePlan.value,
            fechaInicio: fechaInicio.value,
            fechaFin: fechaFin.value,
            dias: diasSeleccionados().map(({ id }) => id),
            rutinas: structuredClone(rutinasPorDia),
            diaActivo,
            ejercicioId: ejercicioSeleccionado?.id ?? null,
            indiceEdicion,
            series: series.value,
            repeticiones: repeticiones.value,
            busquedaEjercicio: buscarEjercicio.value,
        };
    }

    function tieneContenido(e) {
        return Boolean(
            e.nombre.trim() ||
            e.fechaInicio ||
            e.fechaFin ||
            e.dias.length ||
            e.series ||
            e.repeticiones ||
            Object.values(e.rutinas).some(
                (r) => r.nombre.trim() || r.ejercicios.length,
            ),
        );
    }

    function hayCambios() {
        if (iniciando || restaurando) return false;
        const e = obtenerEstado();
        return tieneContenido(e) && JSON.stringify(e) !== firmaBase;
    }

    function antesDeSalir(evento) {
        if (salidaAutorizada || !hayCambios()) return;
        evento.preventDefault();
        evento.returnValue = "";
    }

    function actualizarAvisoSalida() {
        window.removeEventListener("beforeunload", antesDeSalir);
        if (hayCambios()) window.addEventListener("beforeunload", antesDeSalir);
    }
    async function marcarLimpio(eliminar = true) {
        firmaBase = JSON.stringify(obtenerEstado());
        ultimaFirmaSolicitada = "";
        revisionBorrador += 1;
        actualizarAvisoSalida();
        if (!eliminar || iniciando || restaurando) return;
        mostrarEstadoBorrador("");
        try {
            await operarBorrador("eliminar");
            borradorExiste = false;
        } catch {
            mostrarEstadoBorrador("No se pudo eliminar el borrador anterior.");
        }
    }

    function registrarCambio() {
        if (iniciando || restaurando || guardando) return;
        actualizarAvisoSalida();
        if (!hayCambios()) {
            if (borradorExiste || ultimaFirmaSolicitada) void marcarLimpio();
            return;
        }
        const estado = obtenerEstado(),
            firma = JSON.stringify(estado);
        if (firma === ultimaFirmaSolicitada) return;
        ultimaFirmaSolicitada = firma;
        const revision = ++revisionBorrador;
        mostrarEstadoBorrador("Guardando borrador…");
        void operarBorrador("guardar", estado)
            .then(() => {
                borradorExiste = true;
                if (revision === revisionBorrador)
                    mostrarEstadoBorrador(
                        "Borrador guardado automáticamente. Todavía no está asignado ni pendiente de sincronizar.",
                    );
            })
            .catch(() => {
                if (revision === revisionBorrador) {
                    ultimaFirmaSolicitada = "";
                    mostrarEstadoBorrador(
                        "No se pudo guardar el borrador. Guarda el plan antes de salir.",
                    );
                }
            });
    }

    function confirmarReemplazo() {
        return (
            !hayCambios() ||
            confirm(
                "Tienes cambios sin guardar. Si continúas, se descartarán el trabajo y el borrador actuales. ¿Quieres continuar?",
            )
        );
    }

    function limpiarFicha() {
        ejercicioSeleccionado = null;
        indiceEdicion = null;
        series.value = "";
        repeticiones.value = "";
        agregar.textContent = "Agregar al día";
        porId("titulo-ficha").textContent = "Selecciona un ejercicio";
        porId("ayuda-ficha").hidden = false;
        porId("ficha-ejercicio").hidden = true;
        marcarEjercicioSeleccionado();
        notificarFicha();
    }

    function limpiarPlan() {
        planEnEdicion = null;
        nombrePlan.value = "";
        fechaInicio.value = "";
        fechaFin.value = "";
        buscarCliente.disabled = false;
        guardar.textContent = "Guardar plan semanal";
        limpiarFicha();
        for (const { id } of semana) {
            casillas.get(id).checked = false;
            rutinasPorDia[id] = {
                nombre: "",
                ejercicios: [],
            };
        }
        actualizarDias("");
    }
    async function seleccionarCliente(nuevoCliente) {
        try {
            const disponible = clientesVinculados().find(
                ({ id }) => id === nuevoCliente.id,
            );
            if (!disponible) {
                descartarCliente(true);
                avisar("Ese cliente ya no está vinculado.", true);
                registrarCambio();
                return;
            }
            const cambia = cliente && cliente.id !== disponible.id;
            if (cambia && !confirmarReemplazo()) {
                buscarCliente.value = cliente.nombre;
                clienteConfirmado = true;
                formulario.dataset.clienteId = cliente.id;
                cerrarResultadosClientes();
                notificarCliente();
                await mostrarPlanesGuardados();
                registrarCambio();
                return;
            }
            if (cambia) limpiarPlan();
            cliente = disponible;
            clienteConfirmado = true;
            buscarCliente.value = cliente.nombre;
            formulario.dataset.clienteId = cliente.id;
            cerrarResultadosClientes();
            notificarCliente();
            if (cambia) await marcarLimpio();
            await mostrarPlanesGuardados();
            registrarCambio();
        } catch {
            avisar("No se pudo seleccionar el cliente.", true);
        }
    }

    function buscarClientes() {
        clienteConfirmado = false;
        ocultarPlanesGuardados();
        notificarCliente();
        const consulta = normalizar(buscarCliente.value);
        cerrarResultadosClientes();
        if (!consulta) return;
        resultadosClientes.hidden = false;
        buscarCliente.setAttribute("aria-expanded", "true");
        try {
            const disponibles = clientesVinculados(),
                coincidencias = disponibles.filter(({ nombre }) =>
                    normalizar(nombre).includes(consulta),
                );
            for (const coincidencia of coincidencias) {
                const fila = crear("li");
                fila.append(
                    boton(coincidencia.nombre, "opcion-plan", () => {
                        void seleccionarCliente(coincidencia);
                        buscarCliente.focus();
                    }),
                );
                resultadosClientes.append(fila);
            }
            if (!coincidencias.length)
                resultadosClientes.append(
                    crear(
                        "li",
                        disponibles.length
                            ? "No hay clientes vinculados con ese nombre."
                            : "Aún no tienes clientes vinculados.",
                    ),
                );
        } catch {
            resultadosClientes.append(
                crear("li", "No se pudo consultar la vinculación de clientes."),
            );
        }
    }

    function actualizarDias(preferido = diaActivo) {
        const seleccionados = diasSeleccionados();
        selectorDia.replaceChildren(
            ...seleccionados.map(({ id, nombre }) => new Option(nombre, id)),
        );
        const descansos = semana
            .filter(({ id }) => !casillas.get(id).checked)
            .map(({ nombre }) => nombre);
        porId("resumen-dias").textContent = descansos.length
            ? `${seleccionados.length} de entrenamiento. Descanso: ${descansos.join(", ")}.`
            : "7 días de entrenamiento.";
        mostrarDia(
            seleccionados.some(({ id }) => id === preferido)
                ? preferido
                : (seleccionados[0]?.id ?? ""),
        );
        actualizarPeriodo();
    }

    function mostrarDia(id) {
        if (id !== diaActivo) limpiarFicha();
        diaActivo = id;
        porId("editor-dia").hidden = !id;
        porId("ayuda-dia").hidden = Boolean(id);
        agregar.disabled = !id;
        if (!id) {
            porId("titulo-dia").textContent = "Rutina del día";
            return;
        }
        selectorDia.value = id;
        porId("titulo-dia").textContent = semana.find(
            (d) => d.id === id,
        ).nombre;
        nombreDia.value = rutinasPorDia[id].nombre;
        mostrarEjerciciosDelDia();
    }

    function marcarEjercicioSeleccionado() {
        for (const opcion of resultadosEjercicios.querySelectorAll("button"))
            opcion.setAttribute(
                "aria-pressed",
                String(opcion.dataset.ejercicio === ejercicioSeleccionado?.id),
            );
    }

    function mostrarCatalogo() {
        const consulta = normalizar(buscarEjercicio.value);
        resultadosEjercicios.replaceChildren();
        const coincidencias = catalogo.filter(
            (e) => !e.archivado && normalizar(e.nombre).includes(consulta),
        );
        for (const ejercicio of coincidencias) {
            const fila = crear("li"),
                opcion = boton("", "opcion-plan", () => {
                    mostrarFicha(ejercicio);
                    registrarCambio();
                }),
                imagen = crear("img", "", "miniatura-plan");
            imagen.alt = "";
            imagen.addEventListener("error", () => {
                imagen.hidden = true;
            });
            imagen.src = ejercicio.imagen;
            const texto = crear("span", "", "nombre-opcion-ejercicio");
            texto.append(crear("span", ejercicio.nombre));
            if (ejercicio.pendiente)
                texto.append(
                    crear(
                        "span",
                        "Pendiente de sincronizar",
                        "estado-ejercicio-pendiente",
                    ),
                );
            opcion.dataset.ejercicio = ejercicio.id;
            opcion.append(imagen, texto);
            fila.append(opcion);
            resultadosEjercicios.append(fila);
        }
        if (!coincidencias.length)
            resultadosEjercicios.append(
                crear("li", "No hay ejercicios con ese nombre."),
            );
        marcarEjercicioSeleccionado();
    }

    function mostrarFicha(ejercicio, indice = null) {
        ejercicioSeleccionado = ejercicio;
        indiceEdicion = indice;
        porId("titulo-ficha").textContent = ejercicio.nombre;
        porId("ayuda-ficha").hidden = true;
        porId("ficha-ejercicio").hidden = false;
        foto.alt = `Demostración de ${ejercicio.nombre}`;
        if (foto.src !== ejercicio.imagen) {
            foto.hidden = true;
            foto.src = ejercicio.imagen;
        } else foto.hidden = !foto.naturalWidth;
        porId("instrucciones-ejercicio").replaceChildren(
            ...ejercicio.instrucciones.map((p) => crear("li", p)),
        );
        const anterior =
            indice === null
                ? null
                : rutinasPorDia[diaActivo]?.ejercicios[indice];
        series.value = anterior?.series ?? "";
        repeticiones.value = anterior?.repeticiones ?? "";
        agregar.textContent =
            indice === null ? "Agregar al día" : "Guardar ejercicio";
        agregar.disabled =
            !diaActivo || (ejercicio.archivado && indice === null);
        marcarEjercicioSeleccionado();
        notificarFicha();
    }

    function mostrarEjerciciosDelDia() {
        const lista = porId("ejercicios-del-dia"),
            ejercicios = rutinasPorDia[diaActivo].ejercicios;
        lista.replaceChildren();
        if (!ejercicios.length)
            lista.append(
                crear(
                    "li",
                    "Agrega ejercicios desde el catálogo.",
                    "texto-secundario",
                ),
            );
        ejercicios.forEach((ejercicio, indice) => {
            const fila = crear("li", "", "fila-ejercicio"),
                ficha = catalogo.find(({ id }) => id === ejercicio.ejercicioId);
            fila.append(
                crear("strong", ejercicio.nombre),
                crear(
                    "span",
                    `${ejercicio.series} × ${ejercicio.repeticiones}`,
                ),
            );
            if (ficha)
                fila.append(
                    boton("Editar", "boton boton-secundario", () => {
                        mostrarFicha(ficha, indice);
                        registrarCambio();
                        series.focus();
                        if (ficha.archivado)
                            avisar(
                                "Ejercicio retirado del catálogo. Puedes ajustar sus series y repeticiones en esta rutina.",
                            );
                    }),
                );
            fila.append(
                boton("Quitar", "boton boton-secundario", () => {
                    ejercicios.splice(indice, 1);
                    if (indiceEdicion === indice) limpiarFicha();
                    else if (indiceEdicion !== null && indice < indiceEdicion)
                        indiceEdicion -= 1;
                    mostrarEjerciciosDelDia();
                    registrarCambio();
                    buscarEjercicio.focus();
                    avisar(`${ejercicio.nombre} se quitó de este día.`);
                }),
            );
            lista.append(fila);
        });
    }

    function guardarEjercicio() {
        if (!diaActivo || !ejercicioSeleccionado) return;
        const actual = catalogo.find((e) => e.id === ejercicioSeleccionado.id);
        if (!actual || (actual.archivado && indiceEdicion === null)) {
            avisar(
                "Este ejercicio fue retirado del catálogo. Selecciona otro.",
                true,
            );
            return;
        }
        const s = series.valueAsNumber,
            r = repeticiones.valueAsNumber;
        if (
            !Number.isSafeInteger(s) ||
            s < 1 ||
            !Number.isSafeInteger(r) ||
            r < 1
        ) {
            avisar(
                "Escribe series y repeticiones con números enteros mayores que cero.",
                true,
            );
            series.focus();
            return;
        }
        const editando = indiceEdicion !== null,
            ejercicios = rutinasPorDia[diaActivo].ejercicios;
        // Al ajustar una asignación conservamos el nombre guardado en el plan.
        const anterior = editando ? ejercicios[indiceEdicion] : null;
        const ejercicio = {
            ...anterior,
            ejercicioId: actual.id,
            nombre: anterior?.nombre ?? actual.nombre,
            series: s,
            repeticiones: r,
        };
        if (editando) ejercicios[indiceEdicion] = ejercicio;
        else ejercicios.push(ejercicio);
        limpiarFicha();
        mostrarEjerciciosDelDia();
        registrarCambio();
        buscarEjercicio.focus();
        avisar(
            `${ejercicio.nombre} ${editando ? "actualizado" : "agregado"} en este día.`,
        );
    }
    async function mostrarPlanesGuardados() {
        if (!validarClienteActual()) return;
        const solicitud = ++versionLista,
            consultado = cliente,
            lista = porId("lista-planes");
        lista.replaceChildren();
        lista.dataset.clienteId = consultado.id;
        porId("planes-guardados").hidden = false;
        lista.append(crear("li", "Cargando planes…"));
        try {
            const planes = await servicio.listar(consultado.id);
            if (
                solicitud !== versionLista ||
                !validarClienteActual() ||
                cliente.id !== consultado.id
            )
                return;
            lista.replaceChildren();
            for (const plan of planes) {
                const fila = crear("li", "", "fila-plan-guardado");
                fila.dataset.planId = String(plan.id);
                const periodo = periodoValido(plan.fechaInicio, plan.fechaFin)
                    ? textoPeriodo(plan.fechaInicio, plan.fechaFin)
                    : "Sin periodo definido. Abre el plan para asignar fechas.";
                fila.append(
                    crear("strong", plan.nombre),
                    crear(
                        "span",
                        `${plan.dias.length} ${plan.dias.length === 1 ? "día" : "días"}`,
                    ),
                    boton("Abrir en editor", "boton boton-secundario", () => {
                        if (!guardando) abrirPlan(plan);
                    }),
                    crear("span", periodo, "periodo-plan-guardado"),
                );
                lista.append(fila);
            }
            if (!planes.length)
                lista.append(
                    crear("li", "Este cliente aún no tiene planes semanales."),
                );
        } catch (error) {
            if (solicitud === versionLista)
                lista.replaceChildren(crear("li", error.message));
        }
    }

    function abrirPlan(plan) {
        if (!validarClienteActual() || !confirmarReemplazo()) return;
        limpiarPlan();
        planEnEdicion = plan.id;
        nombrePlan.value = plan.nombre;
        fechaInicio.value = fechaValida(plan.fechaInicio)
            ? plan.fechaInicio
            : "";
        fechaFin.value = fechaValida(plan.fechaFin) ? plan.fechaFin : "";
        buscarCliente.disabled = true;
        guardar.textContent = "Guardar cambios";
        for (const { id } of semana) {
            const rutina = plan.dias.find((d) => d.dia === id);
            casillas.get(id).checked = Boolean(rutina);
            rutinasPorDia[id] = {
                nombre: rutina?.nombre ?? "",
                ejercicios: structuredClone(rutina?.ejercicios ?? []),
            };
        }
        actualizarDias(plan.dias[0]?.dia ?? "");
        void marcarLimpio();
        avisar(
            `Editando «${plan.nombre}» para ${cliente.nombre}.${periodoValido(plan.fechaInicio, plan.fechaFin) ? "" : " Asigna las fechas antes de guardar."}`,
        );
        nombrePlan.focus();
    }
    async function guardarPlan(evento) {
        evento.preventDefault();
        if (guardando) return;
        if (!validarClienteActual()) {
            buscarCliente.focus();
            return;
        }
        if (!nombrePlan.value.trim()) {
            avisar("Escribe el nombre del plan.", true);
            nombrePlan.focus();
            return;
        }
        if (indiceEdicion !== null || series.value || repeticiones.value) {
            avisar(
                "Guarda el ejercicio que estás capturando antes de guardar el plan.",
                true,
            );
            return;
        }
        const seleccionados = diasSeleccionados();
        if (!seleccionados.length) {
            avisar("Selecciona al menos un día de entrenamiento.", true);
            casillas.get("lunes").focus();
            return;
        }
        if (!validarPeriodo()) return;
        for (const dia of seleccionados) {
            const rutina = rutinasPorDia[dia.id];
            if (!rutina.nombre.trim() || !rutina.ejercicios.length) {
                mostrarDia(dia.id);
                registrarCambio();
                avisar(
                    `${dia.nombre} necesita un nombre de rutina y al menos un ejercicio.`,
                    true,
                );
                return;
            }
        }
        const datos = {
            nombre: nombrePlan.value.trim(),
            fechaInicio: fechaInicio.value,
            fechaFin: fechaFin.value,
            dias: seleccionados.map(({ id }) => ({
                dia: id,
                nombre: rutinasPorDia[id].nombre.trim(),
                ejercicios: structuredClone(rutinasPorDia[id].ejercicios),
            })),
        };
        if (planEnEdicion) datos.id = planEnEdicion;
        const clienteGuardado = cliente,
            editando = Boolean(planEnEdicion);
        guardando = true;
        formulario.inert = true;
        guardar.disabled = true;
        avisar("Guardando plan…");
        try {
            const plan = await servicio.guardar(clienteGuardado.id, datos);
            limpiarPlan();
            await marcarLimpio();
            if (
                !clientesVinculados().some(
                    ({ id }) => id === clienteGuardado.id,
                )
            ) {
                descartarCliente(true);
                await marcarLimpio();
                avisar(
                    "El plan quedó guardado, pero el cliente fue desvinculado durante la operación.",
                    true,
                );
                return;
            }
            cliente = clienteGuardado;
            clienteConfirmado = true;
            buscarCliente.value = cliente.nombre;
            formulario.dataset.clienteId = cliente.id;
            await mostrarPlanesGuardados();
            await marcarLimpio();
            avisar(
                `«${plan.nombre}» ${editando ? "actualizado" : "guardado"} para ${clienteGuardado.nombre}.`,
            );
        } catch (error) {
            avisar(error.message || "No se pudo guardar el plan.", true);
        } finally {
            guardando = false;
            formulario.inert = false;
            guardar.disabled = false;
            registrarCambio();
        }
    }

    function validarEstadoBorrador(e) {
        const ids = new Set(semana.map(({ id }) => id));
        if (
            !e ||
            e.version !== 1 ||
            [
                "nombre",
                "fechaInicio",
                "fechaFin",
                "busquedaCliente",
                "busquedaEjercicio",
                "series",
                "repeticiones",
            ].some((k) => typeof e[k] !== "string") ||
            !Array.isArray(e.dias) ||
            e.dias.some((id) => !ids.has(id)) ||
            !e.rutinas
        )
            throw new Error("El borrador tiene un formato inválido.");
        for (const { id } of semana) {
            const r = e.rutinas[id];
            if (
                !r ||
                typeof r.nombre !== "string" ||
                !Array.isArray(r.ejercicios) ||
                r.ejercicios.some(
                    (x) =>
                        !x ||
                        typeof x.nombre !== "string" ||
                        !Number.isSafeInteger(x.series) ||
                        x.series < 1 ||
                        !Number.isSafeInteger(x.repeticiones) ||
                        x.repeticiones < 1,
                )
            )
                throw new Error(
                    "No se pudieron leer los ejercicios del borrador.",
                );
        }
    }
    async function restaurarBorrador(registro) {
        const e = registro.datos;
        validarEstadoBorrador(e);
        await servicioEjercicios.listo;
        const disponible = clientesVinculados().find(
            ({ id }) => id === e.clienteId,
        );
        let idPlan = null,
            nota = "";
        if (disponible && e.planId) {
            const planes = await servicio.listar(disponible.id);
            if (planes.some((p) => p.id === e.planId)) idPlan = e.planId;
            else
                nota =
                    " El plan original ya no existe; se recuperó como un plan nuevo.";
        }
        if (!disponible && e.clienteId)
            nota =
                " El cliente ya no está vinculado. Selecciona otro para continuar.";
        restaurando = true;
        try {
            limpiarPlan();
            descartarCliente(true);
            cliente = disponible ?? null;
            clienteConfirmado = Boolean(disponible && e.clienteConfirmado);
            buscarCliente.value = disponible
                ? clienteConfirmado
                    ? disponible.nombre
                    : e.busquedaCliente
                : "";
            nombrePlan.value = e.nombre;
            fechaInicio.value = e.fechaInicio;
            fechaFin.value = e.fechaFin;
            buscarEjercicio.value = e.busquedaEjercicio;
            for (const { id } of semana) {
                casillas.get(id).checked = e.dias.includes(id);
                rutinasPorDia[id] = structuredClone(e.rutinas[id]);
            }
            planEnEdicion = clienteConfirmado ? idPlan : null;
            buscarCliente.disabled = Boolean(planEnEdicion);
            guardar.textContent = planEnEdicion
                ? "Guardar cambios"
                : "Guardar plan semanal";
            if (clienteConfirmado) formulario.dataset.clienteId = cliente.id;
            notificarCliente();
            actualizarDias(e.diaActivo);
            mostrarCatalogo();
            const ejercicio = catalogo.find((x) => x.id === e.ejercicioId),
                indiceValido =
                    Number.isInteger(e.indiceEdicion) &&
                    e.indiceEdicion >= 0 &&
                    diaActivo &&
                    e.indiceEdicion <
                        rutinasPorDia[diaActivo].ejercicios.length;
            if (ejercicio) {
                mostrarFicha(ejercicio, indiceValido ? e.indiceEdicion : null);
                series.value = e.series;
                repeticiones.value = e.repeticiones;
                if (ejercicio.archivado && !indiceValido)
                    nota +=
                        " El ejercicio que estabas capturando fue retirado; selecciona otro.";
            }
            if (clienteConfirmado) await mostrarPlanesGuardados();
            firmaBase = "";
            ultimaFirmaSolicitada = "";
            panelBorrador.hidden = true;
            iniciando = false;
            avisar(`Borrador recuperado.${nota}`);
        } finally {
            restaurando = false;
        }
        formulario.inert = false;
        registrarCambio();
        nombrePlan.focus();
    }
    if (!servicio || !servicioEjercicios) {
        avisar("No se cargaron los servicios de planes y ejercicios.", true);
        guardar.disabled = true;
        return;
    }
    for (const dia of semana) {
        const etiqueta = crear("label"),
            casilla = document.createElement("input");
        casilla.type = "checkbox";
        casilla.setAttribute("aria-label", dia.nombre);
        casilla.addEventListener("change", () =>
            actualizarDias(casilla.checked ? dia.id : diaActivo),
        );
        casillas.set(dia.id, casilla);
        etiqueta.append(casilla, crear("span", dia.corto));
        porId("dias-plan").append(etiqueta);
    }
    buscarCliente.addEventListener("input", buscarClientes);
    buscarCliente.addEventListener("focus", () => {
        if (!clienteConfirmado && buscarCliente.value.trim()) buscarClientes();
    });
    buscarEjercicio.addEventListener("input", mostrarCatalogo);
    fechaInicio.addEventListener("input", actualizarPeriodo);
    fechaFin.addEventListener("input", actualizarPeriodo);
    for (const buscador of [buscarCliente, buscarEjercicio])
        buscador.addEventListener("keydown", (evento) => {
            if (evento.key === "Enter") evento.preventDefault();
        });
    buscarCliente.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape") cerrarResultadosClientes();
    });
    selectorDia.addEventListener("change", () => mostrarDia(selectorDia.value));
    nombreDia.addEventListener("input", () => {
        if (diaActivo) rutinasPorDia[diaActivo].nombre = nombreDia.value;
    });
    foto.addEventListener("load", () => {
        foto.hidden = false;
    });
    foto.addEventListener("error", () => {
        foto.hidden = true;
    });
    formulario.addEventListener("input", registrarCambio);
    formulario.addEventListener("change", registrarCambio);
    agregar.addEventListener("click", guardarEjercicio);
    formulario.addEventListener("submit", guardarPlan);
    porId("nuevo-plan").addEventListener("click", () => {
        if (!confirmarReemplazo()) return;
        limpiarPlan();
        revisarVinculacion();
        void marcarLimpio();
        avisar("Puedes preparar un nuevo plan.");
        nombrePlan.focus();
    });
    window.addEventListener("fitregister:catalogo-actualizado", () => {
        mostrarCatalogo();
        if (ejercicioSeleccionado) {
            const actual = catalogo.find(
                (e) => e.id === ejercicioSeleccionado.id,
            );
            if (!actual || (actual.archivado && indiceEdicion === null)) {
                limpiarFicha();
                registrarCambio();
                avisar(
                    "El ejercicio fue retirado del catálogo. Los ejercicios ya agregados a la rutina se conservan.",
                );
            } else if (
                actual.revision !== ejercicioSeleccionado.revision ||
                actual.imagen !== ejercicioSeleccionado.imagen
            ) {
                const s = series.value,
                    r = repeticiones.value,
                    indice = indiceEdicion;
                mostrarFicha(actual, indice);
                series.value = s;
                repeticiones.value = r;
            }
        }
        if (diaActivo) mostrarEjerciciosDelDia();
    });
    window.addEventListener("fitregister:seleccionar-ejercicio", (evento) => {
        const ejercicio = catalogo.find(
            (e) => e.id === evento.detail?.ejercicioId && !e.archivado,
        );
        if (!ejercicio) return;
        buscarEjercicio.value = "";
        mostrarCatalogo();
        if (indiceEdicion !== null || series.value || repeticiones.value) {
            avisar(
                `«${ejercicio.nombre}» guardado en el catálogo. Termina el ejercicio que estás capturando antes de seleccionarlo.`,
            );
            registrarCambio();
            return;
        }
        mostrarFicha(ejercicio);
        registrarCambio();
        avisar(
            `«${ejercicio.nombre}» guardado en el catálogo. ${diaActivo ? "Indica sus series y repeticiones." : "Selecciona un día para utilizarlo."}`,
        );
    });
    window.addEventListener("storage", (evento) => {
        if (evento.key === null || evento.key === claveDesvinculados)
            revisarVinculacion();
    });
    window.addEventListener("pageshow", revisarVinculacion);
    window.addEventListener("focus", revisarVinculacion);
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") revisarVinculacion();
        else registrarCambio();
    });
    document.addEventListener(
        "click",
        (evento) => {
            if (
                salidaAutorizada ||
                evento.button !== 0 ||
                evento.ctrlKey ||
                evento.metaKey ||
                evento.shiftKey ||
                evento.altKey
            )
                return;
            const enlace = evento.target.closest("a[href]"),
                cerrarSesion = evento.target.closest("#cerrar-sesion");
            if (!enlace && !cerrarSesion) return;
            if (enlace) {
                if (
                    enlace.hasAttribute("download") ||
                    (enlace.target && enlace.target !== "_self")
                )
                    return;
                const destino = new URL(enlace.href);
                if (
                    destino.origin === location.origin &&
                    destino.pathname === location.pathname &&
                    destino.search === location.search
                )
                    return;
            }
            if (!hayCambios() && !guardando) return;
            evento.preventDefault();
            evento.stopImmediatePropagation();
            if (guardando) {
                avisar("Espera a que termine el guardado del plan.", true);
                return;
            }
            void (async () => {
                if (
                    !confirm(
                        "Tienes cambios sin guardar. Se conservarán como borrador para continuar después. ¿Quieres salir?",
                    )
                )
                    return;
                try {
                    await operarBorrador("guardar", obtenerEstado());
                    borradorExiste = true;
                    salidaAutorizada = true;
                    if (cerrarSesion) cerrarSesion.click();
                    else location.assign(enlace.href);
                } catch {
                    avisar(
                        "No se pudo guardar el borrador. No salimos de la pantalla para conservar tu trabajo.",
                        true,
                    );
                }
            })();
        },
        true,
    );
    async function iniciar() {
        formulario.inert = true;
        mostrarCatalogo();
        actualizarDias();
        const clienteId = new URLSearchParams(location.search).get("cliente");
        if (clienteId) {
            const inicial = clientes.find(({ id }) => id === clienteId);
            if (inicial) await seleccionarCliente(inicial);
            else avisar("El cliente del enlace no está disponible.", true);
        }
        firmaBase = JSON.stringify(obtenerEstado());
        try {
            const registro = await operarBorrador("leer");
            if (!registro) {
                iniciando = false;
                formulario.inert = false;
                actualizarAvisoSalida();
                return;
            }
            borradorExiste = true;
            const fecha = new Date(registro.actualizadoEn);
            detalleBorrador.textContent = `Puedes continuar el plan que estabas preparando.${Number.isNaN(fecha.getTime()) ? "" : ` Último guardado: ${fecha.toLocaleString("es-MX")}.`} El borrador todavía no está asignado al cliente.`;
            panelBorrador.hidden = false;
            continuarBorrador.onclick = async () => {
                continuarBorrador.disabled = true;
                descartarBorrador.disabled = true;
                try {
                    await restaurarBorrador(registro);
                } catch (error) {
                    detalleBorrador.textContent =
                        error.message || "No se pudo recuperar el borrador.";
                } finally {
                    continuarBorrador.disabled = false;
                    descartarBorrador.disabled = false;
                }
            };
            descartarBorrador.onclick = async () => {
                continuarBorrador.disabled = true;
                descartarBorrador.disabled = true;
                try {
                    await operarBorrador("eliminar");
                    borradorExiste = false;
                    panelBorrador.hidden = true;
                    iniciando = false;
                    formulario.inert = false;
                    await marcarLimpio(false);
                    avisar("Borrador descartado. Puedes preparar un plan.");
                } catch {
                    detalleBorrador.textContent =
                        "No se pudo descartar el borrador. Inténtalo nuevamente.";
                } finally {
                    continuarBorrador.disabled = false;
                    descartarBorrador.disabled = false;
                }
            };
        } catch {
            iniciando = false;
            formulario.inert = false;
            mostrarEstadoBorrador(
                "El guardado automático no está disponible. Guarda el plan antes de salir.",
            );
        }
    }
    void iniciar();
})();