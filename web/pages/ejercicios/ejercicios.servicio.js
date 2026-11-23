(() => {
    if (window.EjerciciosServicio) return;
    const rutaServicio = document.currentScript.src;
    const baseWeb = new URL("../../", rutaServicio);
    const iniciales = [
        {
            id: "hip-thrust",
            nombre: "Hip thrust",
            grupoMuscular: "Glúteos",
            archivo: "hip-thrust.png",
            instrucciones: [
                "Apoya la parte alta de la espalda en un banco y coloca los pies en el suelo.",
                "Eleva la cadera hasta alinear el tronco y los muslos.",
                "Baja la cadera con control.",
            ],
        },
        {
            id: "hip-thrust-mancuerna",
            nombre: "Hip thrust con mancuerna",
            grupoMuscular: "Glúteos",
            archivo: "hip-thrust-mancuerna.png",
            instrucciones: [
                "Apoya la parte alta de la espalda en un banco y sujeta la mancuerna sobre la cadera.",
                "Empuja el suelo con los pies para elevar la cadera.",
                "Desciende con control mientras sostienes la mancuerna.",
            ],
        },
        {
            id: "sentadilla",
            nombre: "Sentadilla",
            grupoMuscular: "Piernas",
            archivo: "sentadilla.png",
            instrucciones: [
                "Coloca los pies aproximadamente al ancho de los hombros.",
                "Flexiona las caderas y las rodillas para bajar con control.",
                "Empuja el suelo con los pies para volver a la posición inicial.",
            ],
        },
    ].map((e, orden) => ({
        ...e,
        imagen: new URL(`img/ejercicios/${e.archivo}`, baseWeb).href,
        orden,
        revision: "inicial",
        sincronizado: true,
        propio: false,
        archivado: false,
    }));
    // Incluye archivados para resolver referencias de los planes existentes.
    // El editor filtra archivados al ofrecer ejercicios para nuevas asignaciones.
    const catalogo = structuredClone(iniciales);
    const urls = new Map();
    let apertura,
        enProceso = false,
        firmaAnterior = "",
        versionLectura = 0;
    const esPropio = (e) => e.propio ?? e.revision !== "inicial";

    function abrir() {
        if (apertura) return apertura;
        apertura = new Promise((resolve, reject) => {
            // Misma base y versión: conserva todos los ejercicios existentes.
            const solicitud = indexedDB.open(
                "fitregister-catalogo-ejercicios-demo",
                1,
            );
            solicitud.onupgradeneeded = () => {
                const bd = solicitud.result;
                const almacen = bd.createObjectStore("ejercicios", {
                    keyPath: "id",
                });
                bd.createObjectStore("servidorEjercicios", {
                    keyPath: "id",
                });
                iniciales.forEach((e) => almacen.put(e));
            };
            solicitud.onsuccess = () => {
                const bd = solicitud.result;
                bd.onversionchange = () => {
                    bd.close();
                    apertura = null;
                };
                resolve(bd);
            };
            solicitud.onerror = () => {
                apertura = null;
                reject(new Error("No se pudo abrir el catálogo local."));
            };
        });
        return apertura;
    }
    async function leerTodos() {
        const bd = await abrir();
        return new Promise((resolve, reject) => {
            const tx = bd.transaction("ejercicios", "readonly");
            const solicitud = tx.objectStore("ejercicios").getAll();
            tx.oncomplete = () => resolve(solicitud.result);
            tx.onabort = () =>
                reject(new Error("No se pudo leer el catálogo."));
        });
    }
    async function refrescar() {
        const version = ++versionLectura;
        const registros = await leerTodos();
        if (version !== versionLectura) return;
        registros.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
        const firma = JSON.stringify(
            registros.map((e) => [
                e.id,
                e.revision,
                e.sincronizado,
                Boolean(e.archivado),
            ]),
        );
        if (firma === firmaAnterior) return;
        const disponibles = registros.map((e) => {
            let imagen = e.imagen;
            if (e.imagenBlob instanceof Blob) {
                let entrada = urls.get(e.id);
                if (!entrada || entrada.revision !== e.revision) {
                    // Las URL anteriores siguen disponibles para fichas abiertas.
                    entrada = {
                        revision: e.revision,
                        url: URL.createObjectURL(e.imagenBlob),
                    };
                    urls.set(e.id, entrada);
                }
                imagen = entrada.url;
            }
            return {
                ...e,
                imagen,
                propio: esPropio(e),
                archivado: Boolean(e.archivado),
                pendiente: !e.sincronizado,
            };
        });
        catalogo.splice(0, catalogo.length, ...disponibles);
        firmaAnterior = firma;
        window.dispatchEvent(new Event("fitregister:catalogo-actualizado"));
    }

    function validarTexto(datos) {
        if (
            typeof datos.nombre !== "string" ||
            !datos.nombre.trim() ||
            datos.nombre.trim().length > 80
        )
            throw new Error("Escribe un nombre de entre 1 y 80 caracteres.");
        if (
            typeof datos.grupoMuscular !== "string" ||
            !datos.grupoMuscular.trim()
        )
            throw new Error("Selecciona un grupo muscular.");
        if (
            !Array.isArray(datos.instrucciones) ||
            !datos.instrucciones.length ||
            datos.instrucciones.some(
                (p) => typeof p !== "string" || !p.trim(),
            ) ||
            datos.instrucciones.join("\n").length > 4000
        )
            throw new Error(
                "Escribe instrucciones válidas, de hasta 4000 caracteres.",
            );
    }

    function validarImagen(imagen) {
        if (!(imagen instanceof Blob) || !imagen.size)
            throw new Error("Selecciona una imagen.");
        if (!["image/jpeg", "image/png", "image/webp"].includes(imagen.type))
            throw new Error("Utiliza una imagen JPG, PNG o WebP.");
        if (imagen.size > 5 * 1024 * 1024)
            throw new Error("La imagen no debe superar los 5 MB.");
    }
    async function guardar(datos) {
        await listo;
        validarTexto(datos);
        const bd = await abrir();
        let idResultado;
        await new Promise((resolve, reject) => {
            const tx = bd.transaction("ejercicios", "readwrite");
            const almacen = tx.objectStore("ejercicios");
            let motivo;

            function escribir(anterior) {
                try {
                    if (datos.id) {
                        if (
                            !anterior ||
                            !esPropio(anterior) ||
                            anterior.archivado
                        )
                            throw new Error(
                                "Este ejercicio no puede modificarse.",
                            );
                        if (datos.revisionEsperada !== anterior.revision)
                            throw new Error(
                                "El ejercicio cambió en otra ventana. Ciérralo y vuelve a abrirlo.",
                            );
                    }
                    const imagen = datos.imagenBlob ?? anterior?.imagenBlob;
                    validarImagen(imagen);
                    idResultado = anterior?.id ?? crypto.randomUUID();
                    almacen.put({
                        ...anterior,
                        id: idResultado,
                        revision: crypto.randomUUID(),
                        nombre: datos.nombre.trim(),
                        grupoMuscular: datos.grupoMuscular.trim(),
                        instrucciones: datos.instrucciones.map((p) => p.trim()),
                        imagenBlob: imagen,
                        propio: true,
                        archivado: false,
                        sincronizado: false,
                        creadoEn:
                            anterior?.creadoEn ?? new Date().toISOString(),
                        actualizadoEn: new Date().toISOString(),
                        orden: anterior?.orden ?? Date.now(),
                    });
                } catch (error) {
                    motivo = error;
                    tx.abort();
                }
            }
            if (datos.id) {
                const solicitud = almacen.get(datos.id);
                solicitud.onsuccess = () => escribir(solicitud.result);
            } else escribir(null);
            tx.oncomplete = resolve;
            tx.onabort = () =>
                reject(motivo ?? new Error("No se pudo guardar el ejercicio."));
        });
        await refrescar();
        void sincronizar();
        return catalogo.find((e) => e.id === idResultado);
    }
    async function eliminar(id, revisionEsperada) {
        await listo;
        const bd = await abrir();
        await new Promise((resolve, reject) => {
            const tx = bd.transaction("ejercicios", "readwrite");
            const almacen = tx.objectStore("ejercicios");
            const solicitud = almacen.get(id);
            let motivo;
            solicitud.onsuccess = () => {
                try {
                    const actual = solicitud.result;
                    if (!actual || !esPropio(actual))
                        throw new Error(
                            "Solo puedes eliminar ejercicios propios.",
                        );
                    if (actual.archivado) return;
                    if (actual.revision !== revisionEsperada)
                        throw new Error(
                            "El ejercicio cambió en otra ventana. Vuelve a intentarlo.",
                        );
                    // Retirada lógica: no rompe los planes que ya usan su ID.
                    almacen.put({
                        ...actual,
                        archivado: true,
                        sincronizado: false,
                        revision: crypto.randomUUID(),
                        actualizadoEn: new Date().toISOString(),
                    });
                } catch (error) {
                    motivo = error;
                    tx.abort();
                }
            };
            tx.oncomplete = resolve;
            tx.onabort = () =>
                reject(
                    motivo ?? new Error("No se pudo eliminar el ejercicio."),
                );
        });
        await refrescar();
        void sincronizar();
    }
    async function comprobarConexion() {
        if (!navigator.onLine) return false;
        const url = new URL(rutaServicio);
        url.searchParams.set("comprobarConexion", crypto.randomUUID());
        const controlador = new AbortController();
        const tiempo = setTimeout(() => controlador.abort(), 4000);
        try {
            return (
                await fetch(url, {
                    cache: "no-store",
                    signal: controlador.signal,
                })
            ).ok;
        } catch {
            return false;
        } finally {
            clearTimeout(tiempo);
        }
    }
    async function confirmarRecepcion(ejercicio) {
        const bd = await abrir();
        return new Promise((resolve, reject) => {
            const tx = bd.transaction(
                ["ejercicios", "servidorEjercicios"],
                "readwrite",
            );
            const almacen = tx.objectStore("ejercicios");
            const solicitud = almacen.get(ejercicio.id);
            solicitud.onsuccess = () => {
                const actual = solicitud.result;
                if (
                    !actual ||
                    actual.revision !== ejercicio.revision ||
                    actual.sincronizado
                )
                    return;
                // Receptor simulado: incluye las retiradas del catálogo.
                tx.objectStore("servidorEjercicios").put({
                    ...actual,
                    recibidoEn: new Date().toISOString(),
                });
                almacen.put({
                    ...actual,
                    sincronizado: true,
                });
            };
            tx.oncomplete = resolve;
            tx.onabort = () =>
                reject(
                    new Error("No se pudo confirmar la recepción simulada."),
                );
        });
    }
    async function sincronizar() {
        if (enProceso) return;
        enProceso = true;
        try {
            await listo;
            const pendientes = (await leerTodos()).filter(
                (e) => !e.sincronizado,
            );
            for (const ejercicio of pendientes) {
                if (!(await comprobarConexion())) break;
                await confirmarRecepcion(ejercicio);
            }
            await refrescar();
        } catch (error) {
            console.error("Catálogo pendiente de sincronizar:", error);
        } finally {
            enProceso = false;
        }
    }
    const listo = refrescar();
    window.EjerciciosServicio = Object.freeze({
        catalogo,
        guardar,
        eliminar,
        sincronizar,
        listo,
    });
    void listo
        .then(() => sincronizar())
        .catch((error) =>
            console.error("No se pudo cargar el catálogo:", error),
        );
    window.addEventListener("online", () => void sincronizar());
    window.addEventListener("pageshow", () => void sincronizar());
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") void sincronizar();
    });
    setInterval(() => {
        if (document.visibilityState === "visible") void sincronizar();
    }, 10000);
})();