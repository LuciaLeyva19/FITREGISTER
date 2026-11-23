(() => {
    const clientes = [
        { id: "diego", nombre: "Diego Ruiz", iniciales: "DR" },
        { id: "ana", nombre: "Ana Torres", iniciales: "AT" },
        { id: "sofia", nombre: "Sofía Vega", iniciales: "SV" }
    ];

    // Ejemplos exclusivos del prototipo.
    // Más adelante estos datos se consultarán mediante la API.
    // Un campo vacío significa información no proporcionada.
    const perfilesEjemplo = {
        diego: {
            objetivo: "Aumentar fuerza y masa muscular",
            experiencia: "Intermedio",
            disponibilidad: "Lunes, miércoles y viernes",
            equipo: "Gimnasio",
            lesiones: "",
            limitaciones: "",
            observaciones: "Prefiero entrenamientos por la tarde."
        },
        ana: {
            objetivo: "Mejorar condición física",
            experiencia: "Principiante",
            disponibilidad: "Martes, jueves y sábado",
            equipo: "Mancuernas y banco",
            lesiones: "",
            limitaciones: "",
            observaciones: "Me gustaría comenzar con sesiones de 45 minutos."
        },
        sofia: {
            objetivo: "",
            experiencia: "",
            disponibilidad: "",
            equipo: "",
            lesiones: "",
            limitaciones: "",
            observaciones: ""
        }
    };

    const semana = [
        ["lunes", "Lunes"],
        ["martes", "Martes"],
        ["miercoles", "Miércoles"],
        ["jueves", "Jueves"],
        ["viernes", "Viernes"],
        ["sabado", "Sábado"],
        ["domingo", "Domingo"]
    ];

    const rutinaEjemploAna = {
        nombre: "Pierna A",
        ejercicios: [
            { nombre: "Sentadilla", series: 3, repeticiones: 12 },
            { nombre: "Prensa de piernas", series: 3, repeticiones: 10 },
            { nombre: "Peso muerto rumano", series: 3, repeticiones: 12 }
        ]
    };

    const claveDesvinculados = "fitregister-clientes-desvinculados-demo";
    const porId = (id) => document.getElementById(id);

    const lista = porId("lista-clientes");
    const aviso = porId("aviso-rutinas");
    const buscador = porId("buscar-cliente");
    const resultadoBusqueda = porId("resultado-busqueda");

    const panel = porId("panel-rutinas");
    const contenidoPanel = porId("rutinas-panel");
    const nombrePanel = porId("nombre-cliente-panel");
    const avisoPanel = porId("aviso-panel");

    const panelPerfil = porId("panel-perfil-cliente");
    const datosEntrenamiento = porId("datos-entrenamiento-perfil");
    const datosLimitaciones = porId("datos-limitaciones-perfil");

    const confirmacion = porId("confirmar-plan");
    const tituloEliminar = porId("titulo-eliminar");
    const textoEliminar = porId("texto-eliminar");
    const botonConfirmar = confirmacion.querySelector(
        'button[value="eliminar"]'
    );

    const botonInvitacion = porId("abrir-invitacion");
    const invitacion = porId("invitacion");
    const generar = porId("generar-invitacion");
    const resultado = porId("resultado-invitacion");

    let pendienteEliminar = null;
    let clienteActivo = null;
    let clientePerfilActivo = null;

    function crear(etiqueta, texto = "", clase = "") {
        const elemento = document.createElement(etiqueta);
        elemento.textContent = texto;
        elemento.className = clase;
        return elemento;
    }

    function crearBoton(texto, clase, accion) {
        const boton = crear("button", texto, clase);
        boton.type = "button";
        boton.addEventListener("click", accion);
        return boton;
    }

    function normalizarTexto(texto) {
        return texto
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLocaleLowerCase("es")
            .trim()
            .replace(/\s+/g, " ");
    }

    function leerLista(clave) {
        const datos = JSON.parse(localStorage.getItem(clave) ?? "[]");

        if (!Array.isArray(datos)) {
            throw new Error("Se esperaba una lista guardada.");
        }

        return datos;
    }

    function clavePlanes(clienteId) {
        return `fitregister-planes-${clienteId}`;
    }

    function leerRutinasAnteriores(clienteId) {
        const dato = JSON.parse(
            localStorage.getItem(`fitregister-rutina-${clienteId}`)
        );

        const rutinas = dato === null
            ? []
            : Array.isArray(dato)
                ? dato
                : [dato];

        return clienteId === "ana"
            ? [rutinaEjemploAna, ...rutinas]
            : rutinas;
    }

    function leerAsignaciones(cliente) {
        const asignaciones = {
            planes: [],
            anteriores: []
        };

        try {
            asignaciones.planes = leerLista(clavePlanes(cliente.id));
        } catch {
            aviso.textContent =
                "No se pudieron leer algunos planes semanales.";
        }

        try {
            asignaciones.anteriores = leerRutinasAnteriores(cliente.id);
        } catch {
            aviso.textContent =
                "No se pudieron leer algunas rutinas anteriores.";
        }

        return asignaciones;
    }

    function crearEnlace(cliente, texto, clase, destino = "") {
        const enlace = crear("a", texto, clase);

        enlace.href =
            `../rutinas/rutinas.html?cliente=${
                encodeURIComponent(cliente.id)
            }${destino}`;

        return enlace;
    }

    function describirCantidad(cantidad, singular, plural) {
        return `${cantidad} ${cantidad === 1 ? singular : plural}`;
    }

    function valorPerfil(valor) {
        return typeof valor === "string" && valor.trim()
            ? valor.trim()
            : "Información no proporcionada";
    }

    function crearDatoPerfil(titulo, valor) {
        const contenedor = crear("div");

        contenedor.append(
            crear("dt", titulo),
            crear("dd", valorPerfil(valor))
        );

        return contenedor;
    }

    function abrirPerfil(cliente) {
        const perfil = perfilesEjemplo[cliente.id] ?? {};

        clientePerfilActivo = cliente;

        porId("nombre-perfil-cliente").textContent = cliente.nombre;
        porId("iniciales-perfil-cliente").textContent = cliente.iniciales;

        datosEntrenamiento.replaceChildren(
            crearDatoPerfil("Objetivo", perfil.objetivo),
            crearDatoPerfil("Experiencia", perfil.experiencia),
            crearDatoPerfil("Días disponibles", perfil.disponibilidad),
            crearDatoPerfil("Equipo disponible", perfil.equipo)
        );

        datosLimitaciones.replaceChildren(
            crearDatoPerfil("Lesiones o molestias", perfil.lesiones),
            crearDatoPerfil(
                "Limitaciones para entrenar",
                perfil.limitaciones
            )
        );

        porId("observaciones-perfil").textContent =
            valorPerfil(perfil.observaciones);

        porId("asignar-desde-perfil").href =
            `../rutinas/rutinas.html?cliente=${
                encodeURIComponent(cliente.id)
            }`;

        panelPerfil.showModal();
        panelPerfil.scrollTop = 0;
    }

    function pedirConfirmacion(cliente, plan = null) {
        pendienteEliminar = { cliente, plan };

        const accion = plan ? "Eliminar rutina" : "Eliminar cliente";

        tituloEliminar.textContent = accion;
        botonConfirmar.textContent = accion;

        textoEliminar.textContent = plan
            ? `¿Quieres eliminar «${plan.nombre}» de los planes asignados a ${cliente.nombre}?`
            : `¿Quieres quitar a ${cliente.nombre} de tu lista de clientes? Sus planes y registros quedarán guardados.`;

        confirmacion.returnValue = "";
        confirmacion.showModal();
    }

    function crearFicha(cliente) {
        const { planes, anteriores } = leerAsignaciones(cliente);

        const ficha = crear("article", "", "tarjeta ficha-cliente");
        const identidad = crear("div", "", "identidad-cliente");
        const iniciales = crear(
            "span",
            cliente.iniciales,
            "iniciales-cliente"
        );
        const datos = crear("div");
        const acciones = crear("div", "", "acciones-cliente");

        iniciales.setAttribute("aria-hidden", "true");

        let estado = "Sin rutinas asignadas";

        if (planes.length) {
            estado = describirCantidad(
                planes.length,
                "plan asignado",
                "planes asignados"
            );
        } else if (anteriores.length) {
            estado = describirCantidad(
                anteriores.length,
                "rutina individual",
                "rutinas individuales"
            );
        }

        datos.append(
            crear("h2", cliente.nombre),
            crear("p", estado, "estado-cliente")
        );

        identidad.append(iniciales, datos);

        const verPerfil = crearBoton(
            "Ver perfil",
            "boton boton-secundario",
            () => abrirPerfil(cliente)
        );

        verPerfil.id = `ver-perfil-${cliente.id}`;
        verPerfil.setAttribute("aria-haspopup", "dialog");
        verPerfil.setAttribute(
            "aria-label",
            `Ver perfil de ${cliente.nombre}`
        );

        const ver = crearBoton(
            "Ver rutinas",
            "boton ver-rutinas",
            () => {
                clienteActivo = cliente;
                mostrarPanel(cliente);
                panel.showModal();
                panel.scrollTop = 0;
            }
        );

        ver.id = `ver-rutinas-${cliente.id}`;
        ver.setAttribute("aria-haspopup", "dialog");

        const eliminar = crearBoton(
            "Eliminar cliente",
            "boton boton-peligro",
            () => pedirConfirmacion(cliente)
        );

        eliminar.setAttribute(
            "aria-label",
            `Eliminar cliente ${cliente.nombre}`
        );
        eliminar.setAttribute("aria-haspopup", "dialog");

        acciones.append(
            verPerfil,
            ver,
            crearEnlace(cliente, "Asignar plan", "boton"),
            eliminar
        );

        ficha.append(identidad, acciones);
        return ficha;
    }

    function mostrarClientes() {
        aviso.textContent = "";
        resultadoBusqueda.textContent = "";

        try {
            const desvinculados = new Set(
                leerLista(claveDesvinculados)
            );

            const vinculados = clientes.filter(
                ({ id }) => !desvinculados.has(id)
            );

            const consulta = normalizarTexto(buscador.value);
            const palabras = consulta.split(" ").filter(Boolean);

            const coincidencias = vinculados.filter((cliente) => {
                const nombre = normalizarTexto(cliente.nombre);

                return palabras.every(
                    (palabra) => nombre.includes(palabra)
                );
            });

            lista.replaceChildren(...coincidencias.map(crearFicha));

            if (!vinculados.length) {
                lista.append(
                    crear(
                        "p",
                        "Aún no hay clientes vinculados.",
                        "sin-resultados"
                    )
                );
                return;
            }

            if (!coincidencias.length) {
                lista.append(
                    crear(
                        "p",
                        "No se encontraron clientes. Prueba con otro nombre.",
                        "sin-resultados"
                    )
                );
            }

            if (consulta) {
                resultadoBusqueda.textContent = describirCantidad(
                    coincidencias.length,
                    "cliente encontrado",
                    "clientes encontrados"
                );
            }
        } catch {
            lista.replaceChildren();
            aviso.textContent =
                "No se pudo cargar la lista de clientes.";
        }
    }

    function crearListaEjercicios(ejercicios) {
        const elementos = crear(
            "ul",
            "",
            "ejercicios-plan-cliente"
        );

        for (const ejercicio of ejercicios) {
            elementos.append(
                crear(
                    "li",
                    `${ejercicio.nombre} · ${ejercicio.series} × ${ejercicio.repeticiones}`
                )
            );
        }

        return elementos;
    }

    function crearPlan(cliente, plan) {
        const detalle = crear("details", "", "plan-cliente");

        const cantidad = describirCantidad(
            plan.dias.length,
            "día",
            "días"
        );

        const dias = crear("ul", "", "dias-plan-cliente");
        const acciones = crear("div", "", "acciones-cliente");

        detalle.append(
            crear("summary", `${plan.nombre} · ${cantidad}`)
        );

        for (const [id, nombre] of semana) {
            const rutina = plan.dias.find(
                (dia) => dia.dia === id
            );

            const fila = crear("li");

            if (rutina) {
                const dia = crear("details", "", "dia-plan");

                dia.append(
                    crear(
                        "summary",
                        `${nombre} · ${rutina.nombre}`
                    ),
                    crearListaEjercicios(rutina.ejercicios)
                );

                fila.append(dia);
            } else {
                fila.append(
                    crear(
                        "span",
                        `${nombre} · Descanso`,
                        "dia-descanso"
                    )
                );
            }

            dias.append(fila);
        }

        acciones.append(
            crearEnlace(
                cliente,
                "Modificar rutina",
                "boton boton-secundario",
                "#planes-guardados"
            ),
            crearBoton(
                "Eliminar rutina",
                "boton boton-peligro",
                () => pedirConfirmacion(cliente, plan)
            )
        );

        detalle.append(dias, acciones);
        return detalle;
    }

    function crearRutinaAnterior(rutina) {
        const detalle = crear("details", "", "plan-cliente");

        const ejercicios = rutina.ejercicios ?? [{
            nombre: rutina.ejercicio,
            series: rutina.series,
            repeticiones: rutina.repeticiones
        }];

        detalle.append(
            crear("summary", rutina.nombre),
            crearListaEjercicios(ejercicios)
        );

        return detalle;
    }

    function mostrarPanel(cliente) {
        const { planes, anteriores } = leerAsignaciones(cliente);

        nombrePanel.textContent = cliente.nombre;
        avisoPanel.textContent = "";
        contenidoPanel.replaceChildren();

        planes.forEach((plan, indice) => {
            const detalle = crearPlan(cliente, plan);
            detalle.open = indice === 0;
            contenidoPanel.append(detalle);
        });

        if (anteriores.length) {
            contenidoPanel.append(
                crear("h3", "Rutinas individuales"),
                ...anteriores.map(crearRutinaAnterior)
            );
        }

        if (!planes.length && !anteriores.length) {
            contenidoPanel.append(
                crear(
                    "p",
                    "Este cliente aún no tiene rutinas asignadas."
                )
            );
        }

        contenidoPanel.append(
            crearEnlace(cliente, "Asignar plan semanal", "boton")
        );
    }

    function desvincularCliente(cliente) {
        try {
            const desvinculados = new Set(
                leerLista(claveDesvinculados)
            );

            desvinculados.add(cliente.id);

            localStorage.setItem(
                claveDesvinculados,
                JSON.stringify([...desvinculados])
            );
        } catch {
            aviso.textContent =
                "No se pudo eliminar al cliente. Vuelve a intentarlo.";
            return;
        }

        mostrarClientes();

        aviso.textContent =
            `${cliente.nombre} ya no aparece en tu lista de clientes.`;

        botonInvitacion.focus();
    }

    function eliminarPlan(cliente, plan) {
        try {
            const clave = clavePlanes(cliente.id);

            const restantes = leerLista(clave).filter(
                ({ id }) => id !== plan.id
            );

            localStorage.setItem(
                clave,
                JSON.stringify(restantes)
            );
        } catch {
            avisoPanel.textContent =
                "No se pudo eliminar el plan. Vuelve a intentarlo.";
            return;
        }

        mostrarClientes();
        mostrarPanel(cliente);

        avisoPanel.textContent =
            `Se eliminó «${plan.nombre}» de los planes asignados.`;

        panel.querySelector(".cerrar-panel").focus();
    }

    buscador.addEventListener("input", mostrarClientes);

    confirmacion.addEventListener("close", () => {
        const seleccion = pendienteEliminar;
        pendienteEliminar = null;

        if (
            confirmacion.returnValue !== "eliminar" ||
            !seleccion
        ) {
            return;
        }

        const { cliente, plan } = seleccion;

        if (plan) {
            eliminarPlan(cliente, plan);
        } else {
            desvincularCliente(cliente);
        }
    });

    panel.addEventListener("close", () => {
        if (clienteActivo) {
            porId(`ver-rutinas-${clienteActivo.id}`)?.focus();
        }

        clienteActivo = null;
    });

    panelPerfil.addEventListener("close", () => {
        if (clientePerfilActivo) {
            porId(`ver-perfil-${clientePerfilActivo.id}`)?.focus();
        }

        clientePerfilActivo = null;
    });

    botonInvitacion.addEventListener("click", () => {
        invitacion.hidden = !invitacion.hidden;

        botonInvitacion.setAttribute(
            "aria-expanded",
            String(!invitacion.hidden)
        );

        if (!invitacion.hidden) generar.focus();
    });

    generar.addEventListener("click", () => {
        const numero = Math.floor(
            100000 + Math.random() * 900000
        );

        resultado.textContent =
            `Código de demostración: FIT-${numero}`;

        generar.textContent = "Generar otro código";
    });

    mostrarClientes();

    window.addEventListener("pageshow", (evento) => {
        if (!evento.persisted) return;

        mostrarClientes();

        if (panel.open && clienteActivo) {
            mostrarPanel(clienteActivo);
        }
    });
})();