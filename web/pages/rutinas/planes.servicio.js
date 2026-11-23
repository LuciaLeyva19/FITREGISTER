(() => {
    if (window.PlanesServicio) return;

    const rutaServicio = document.currentScript.src;

    let apertura;
    let enProceso = false;
    let conectado = navigator.onLine;

    function avisar() {
        window.dispatchEvent(
            new Event("fitregister:sincronizacion")
        );
    }

    function abrir() {
        if (apertura) return apertura;

        apertura = new Promise((resolve, reject) => {
            const solicitud = indexedDB.open(
                "fitregister-cola-red-demo",
                2
            );

            solicitud.onupgradeneeded = () => {
                const bd = solicitud.result;

                for (const nombre of [
                    "estadoPlanes",
                    "colaPlanes",
                    "servidorPlanes"
                ]) {
                    if (!bd.objectStoreNames.contains(nombre)) {
                        bd.createObjectStore(nombre, {
                            keyPath: "clienteId"
                        });
                    }
                }
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
                reject(
                    new Error("No se pudo abrir el almacenamiento local.")
                );
            };
        });

        return apertura;
    }

    function leer(clienteId) {
        if (!clienteId) {
            throw new Error("Selecciona un cliente.");
        }

        const planes = JSON.parse(
            localStorage.getItem(
                `fitregister-planes-${clienteId}`
            ) ?? "[]"
        );

        if (!Array.isArray(planes)) {
            throw new Error(
                "Los planes guardados tienen un formato inválido."
            );
        }

        return planes;
    }

    async function consultar(nombre) {
        const bd = await abrir();

        return new Promise((resolve, reject) => {
            const transaccion = bd.transaction(
                nombre,
                "readonly"
            );

            const solicitud = transaccion
                .objectStore(nombre)
                .getAll();

            transaccion.oncomplete = () => {
                resolve(solicitud.result);
            };

            transaccion.onabort = () => {
                reject(
                    new Error("No se pudieron consultar los datos locales.")
                );
            };
        });
    }

    async function encolar(clienteId) {
        const planes = leer(clienteId);
        const contenido = JSON.stringify(planes);
        const bd = await abrir();

        return new Promise((resolve, reject) => {
            const transaccion = bd.transaction(
                ["estadoPlanes", "colaPlanes"],
                "readwrite"
            );

            const estados = transaccion.objectStore(
                "estadoPlanes"
            );
            const cola = transaccion.objectStore("colaPlanes");
            const solicitud = estados.get(clienteId);

            solicitud.onsuccess = () => {
                if (solicitud.result?.contenido === contenido) {
                    return;
                }

                const cambio = {
                    clienteId,
                    revision: crypto.randomUUID(),
                    contenido,
                    planes,
                    actualizadoEn: new Date().toISOString()
                };

                estados.put(cambio);
                cola.put(cambio);
            };

            transaccion.oncomplete = () => resolve();

            transaccion.onabort = () => {
                reject(
                    new Error("No se pudo preparar el envío pendiente.")
                );
            };
        });
    }

    async function prepararCambios() {
        const ids = new Set(["diego", "ana", "umwe", "sofia"]);
        const prefijo = "fitregister-planes-";

        for (let indice = 0; indice < localStorage.length; indice += 1) {
            const clave = localStorage.key(indice);

            if (clave?.startsWith(prefijo)) {
                ids.add(clave.slice(prefijo.length));
            }
        }

        for (const clienteId of ids) {
            await encolar(clienteId);
        }
    }

    async function comprobarConexion() {
        const url = new URL(rutaServicio);

        url.searchParams.set(
            "comprobarConexion",
            crypto.randomUUID()
        );

        const controlador = new AbortController();
        const temporizador = setTimeout(
            () => controlador.abort(),
            4000
        );

        try {
            const respuesta = await fetch(url, {
                cache: "no-store",
                signal: controlador.signal
            });

            conectado = respuesta.ok;
        } catch {
            conectado = false;
        } finally {
            clearTimeout(temporizador);
        }

        return conectado;
    }

    async function confirmarRecepcion(cambio) {
        const bd = await abrir();

        return new Promise((resolve, reject) => {
            const transaccion = bd.transaction(
                ["colaPlanes", "servidorPlanes"],
                "readwrite"
            );

            const cola = transaccion.objectStore("colaPlanes");
            const servidor = transaccion.objectStore(
                "servidorPlanes"
            );

            const solicitud = cola.get(cambio.clienteId);

            solicitud.onsuccess = () => {
                if (
                    solicitud.result?.revision !== cambio.revision
                ) {
                    return;
                }

                servidor.put({
                    clienteId: cambio.clienteId,
                    revision: cambio.revision,
                    planes: cambio.planes,
                    recibidoEn: new Date().toISOString()
                });

                cola.delete(cambio.clienteId);
            };

            transaccion.oncomplete = () => resolve();

            transaccion.onabort = () => {
                reject(
                    new Error(
                        "No se pudo confirmar la recepción simulada."
                    )
                );
            };
        });
    }

    async function sincronizar() {
        if (enProceso) return;

        enProceso = true;

        try {
            await prepararCambios();

            if (!await comprobarConexion()) return;

            let pendientes = await consultar("colaPlanes");

            while (pendientes.length) {
                const cambio = pendientes[0];

                await new Promise((resolve) => {
                    setTimeout(resolve, 500);
                });

                if (!await comprobarConexion()) return;

                await confirmarRecepcion(cambio);
                avisar();

                await prepararCambios();
                pendientes = await consultar("colaPlanes");
            }
        } catch (error) {
            console.error("Cambios pendientes:", error);
        } finally {
            enProceso = false;
            avisar();
        }
    }

    function validar(plan) {
        if (!plan?.nombre?.trim()) {
            throw new Error("Escribe el nombre del plan.");
        }

        if (!Array.isArray(plan.dias) || !plan.dias.length) {
            throw new Error("Selecciona días de entrenamiento.");
        }

        const permitidos = new Set([
            "lunes",
            "martes",
            "miercoles",
            "jueves",
            "viernes",
            "sabado",
            "domingo"
        ]);

        const usados = new Set();

        for (const dia of plan.dias) {
            if (
                !permitidos.has(dia.dia) ||
                usados.has(dia.dia)
            ) {
                throw new Error("Revisa los días del plan.");
            }

            usados.add(dia.dia);

            if (
                !dia.nombre?.trim() ||
                !Array.isArray(dia.ejercicios) ||
                !dia.ejercicios.length
            ) {
                throw new Error(
                    "Cada día necesita nombre y ejercicios."
                );
            }

            for (const ejercicio of dia.ejercicios) {
                if (
                    !ejercicio.nombre?.trim() ||
                    !Number.isSafeInteger(ejercicio.series) ||
                    ejercicio.series < 1 ||
                    !Number.isSafeInteger(ejercicio.repeticiones) ||
                    ejercicio.repeticiones < 1
                ) {
                    throw new Error(
                        "Revisa los ejercicios, las series y las repeticiones."
                    );
                }
            }
        }
    }

    async function persistir(clienteId, planes) {
        localStorage.setItem(
            `fitregister-planes-${clienteId}`,
            JSON.stringify(planes)
        );

        try {
            await encolar(clienteId);
        } catch (error) {
            console.error(
                "Plan guardado localmente. Envío pendiente:",
                error
            );
        }

        avisar();
        void sincronizar();
    }

    async function guardar(clienteId, datos) {
        validar(datos);

        const planes = leer(clienteId);

        const indice = datos.id
            ? planes.findIndex((plan) => plan.id === datos.id)
            : -1;

        if (datos.id && indice < 0) {
            throw new Error("El plan ya no está disponible.");
        }

        let resultado;

        if (indice < 0) {
            resultado = {
                ...structuredClone(datos),
                id: crypto.randomUUID(),
                creadoEn: new Date().toISOString()
            };

            planes.push(resultado);
        } else {
            resultado = {
                ...planes[indice],
                ...structuredClone(datos),
                actualizadoEn: new Date().toISOString()
            };

            planes[indice] = resultado;
        }

        await persistir(clienteId, planes);

        return structuredClone(resultado);
    }

    async function eliminar(clienteId, planId) {
        const restantes = leer(clienteId)
            .filter((plan) => plan.id !== planId);

        await persistir(clienteId, restantes);
    }

    async function planesPendientes(clienteId) {
        const servidores = await consultar("servidorPlanes");

        const recibidos = servidores.find(
            (registro) => registro.clienteId === clienteId
        )?.planes ?? [];

        return leer(clienteId)
            .filter((plan) => {
                const recibido = recibidos.find(
                    (actual) => actual.id === plan.id
                );

                return JSON.stringify(plan) !== JSON.stringify(recibido);
            })
            .map((plan) => plan.id);
    }

    window.PlanesServicio = Object.freeze({
        listar: async (clienteId) => structuredClone(leer(clienteId)),
        guardar,
        eliminar,
        sincronizar,
        planesPendientes,
        tieneConexion: () => conectado
    });

    window.addEventListener("offline", () => {
        conectado = false;
        avisar();
    });

    window.addEventListener("online", () => {
        void sincronizar();
    });
})();