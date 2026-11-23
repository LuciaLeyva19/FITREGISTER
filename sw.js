const CACHE = "fitregister-interfaz-v13";
const BASE = self.registration.scope;

const PRINCIPALES = [
    "index.html",
    "manifest.webmanifest",

    "web/img/iconos/icon-192.png",
    "web/img/iconos/icon-512.png",

    "web/pages/instalacion/instalacion.js",

    "web/index.js",
    "web/styles.css",
    "web/inicio.css",
    "web/perfil.css",

    "web/sincronizacion/sincronizacion.js",
    "web/sincronizacion/sincronizacion.css",

    "web/pages/notificaciones/notificaciones.js",
    "web/pages/notificaciones/notificaciones.css",

    "web/pages/auth/sesion.js",
    "web/pages/auth/login.html",
    "web/pages/auth/login.css",
    "web/pages/auth/login.js",

    "web/pages/clientes/clientes.html",
    "web/pages/clientes/clientes.css",
    "web/pages/clientes/clientes.js",

    "web/pages/rutinas/rutinas.html",
    "web/pages/rutinas/rutinas.css",
    "web/pages/rutinas/rutinas.js",
    "web/pages/rutinas/planes.servicio.js",

    "web/pages/ejercicios/ejercicios.servicio.js",
    "web/pages/ejercicios/ejercicios.js",
    "web/pages/ejercicios/ejercicios.css",

    "web/pages/seguimiento/seguimiento.html",
    "web/pages/seguimiento/seguimiento.css",
    "web/pages/seguimiento/seguimiento.js",

    "web/pages/plan-pro/plan-pro.html",
    "web/pages/plan-pro/plan-pro.css",
    "web/pages/plan-pro/plan-pro.js"
];

const ADICIONALES = [
    "web/img/mancuernas.png",

    "web/pages/auth/registro.html",
    "web/pages/auth/registro.css",
    "web/pages/auth/registro.js",

    "web/img/ejercicios/hip-thrust.png",
    "web/img/ejercicios/hip-thrust-mancuerna.png",
    "web/img/ejercicios/sentadilla.png"
];

const permitidos = new Set(
    [...PRINCIPALES, ...ADICIONALES].map(
        (ruta) => new URL(ruta, BASE).href
    )
);

async function descargar(cache, ruta) {
    const url = new URL(ruta, BASE).href;

    const respuesta = await fetch(url, {
        cache: "reload"
    });

    if (!respuesta.ok) {
        throw new Error(
            `No se pudo descargar ${ruta}: HTTP ${respuesta.status}`
        );
    }

    await cache.put(url, respuesta);
}

self.addEventListener("install", (evento) => {
    evento.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE);

            await Promise.all(
                PRINCIPALES.map(
                    (ruta) => descargar(cache, ruta)
                )
            );

            const resultados = await Promise.allSettled(
                ADICIONALES.map(
                    (ruta) => descargar(cache, ruta)
                )
            );

            resultados.forEach((resultado, indice) => {
                if (resultado.status === "rejected") {
                    console.warn(
                        `Recurso adicional no disponible: ${ADICIONALES[indice]}`,
                        resultado.reason
                    );
                }
            });

            await self.skipWaiting();
        })()
    );
});

self.addEventListener("activate", (evento) => {
    evento.waitUntil(
        (async () => {
            const nombres = await caches.keys();

            await Promise.all(
                nombres
                    .filter((nombre) => {
                        return (
                            nombre.startsWith("fitregister-interfaz-") &&
                            nombre !== CACHE
                        );
                    })
                    .map(
                        (nombre) => caches.delete(nombre)
                    )
            );

            await self.clients.claim();
        })()
    );
});

async function comprobarRed(solicitud) {
    try {
        return await fetch(solicitud, {
            cache: "no-store"
        });
    } catch {
        return new Response(
            JSON.stringify({
                conectado: false
            }),
            {
                status: 503,
                statusText: "Sin conexion",
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    "Cache-Control": "no-store"
                }
            }
        );
    }
}

async function responder(solicitud, clave) {
    const cache = await caches.open(CACHE);

    try {
        const respuesta = await fetch(solicitud);

        if (respuesta.ok) {
            try {
                await cache.put(
                    clave,
                    respuesta.clone()
                );
            } catch (error) {
                console.warn(
                    "No se pudo actualizar el archivo en caché:",
                    clave,
                    error
                );
            }

            return respuesta;
        }

        const guardada = await cache.match(clave);

        return guardada || respuesta;
    } catch {
        const guardada = await cache.match(clave);

        if (guardada) {
            return guardada;
        }

        return new Response(
            "Este recurso todavía no está disponible sin conexión. Abre la aplicación con conexión para prepararlo.",
            {
                status: 503,
                headers: {
                    "Content-Type": "text/plain; charset=utf-8"
                }
            }
        );
    }
}

self.addEventListener("fetch", (evento) => {
    const solicitud = evento.request;
    const url = new URL(solicitud.url);

    if (
        solicitud.method !== "GET" ||
        url.origin !== self.location.origin
    ) {
        return;
    }

    if (url.searchParams.has("comprobarConexion")) {
        evento.respondWith(
            comprobarRed(solicitud)
        );

        return;
    }

    url.search = "";
    url.hash = "";

    if (url.href === BASE) {
        url.pathname += "index.html";
    }

    if (!permitidos.has(url.href)) {
        return;
    }

    evento.respondWith(
        responder(solicitud, url.href)
    );
});