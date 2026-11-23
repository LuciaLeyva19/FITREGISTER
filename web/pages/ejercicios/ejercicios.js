(() => {
    if (window.fitregisterEjerciciosIniciados) return;
    const servicio = window.EjerciciosServicio;
    const resultados = document.getElementById("resultados-ejercicios");
    const ficha = document.getElementById("ficha-ejercicio");
    if (!servicio || !resultados || !ficha) return;
    window.fitregisterEjerciciosIniciados = true;
    const crear = (tag, texto = "", clase = "") => {
        const e = document.createElement(tag);
        e.textContent = texto;
        e.className = clase;
        return e;
    };
    const nuevo = crear(
        "button",
        "+ Agregar ejercicio",
        "boton boton-secundario boton-nuevo-ejercicio",
    );
    nuevo.type = "button";
    nuevo.setAttribute("aria-haspopup", "dialog");
    nuevo.setAttribute("aria-controls", "dialogo-nuevo-ejercicio");
    resultados.after(nuevo);
    const avisoCatalogo = crear("p", "", "mensaje-ejercicio aviso-catalogo");
    avisoCatalogo.setAttribute("role", "status");
    nuevo.after(avisoCatalogo);
    const controles = crear("div", "", "acciones-ficha-ejercicio");
    controles.hidden = true;
    const editar = crear(
        "button",
        "Editar ejercicio",
        "boton boton-secundario",
    );
    editar.type = "button";
    editar.setAttribute("aria-haspopup", "dialog");
    const eliminar = crear(
        "button",
        "Eliminar ejercicio",
        "boton peligro-ejercicio",
    );
    eliminar.type = "button";
    controles.append(editar, eliminar);
    ficha.append(controles);
    let seleccionado = null,
        editando = null,
        temporal = null,
        guardando = false;
    const dialogo = crear("dialog", "", "dialogo-ejercicio");
    dialogo.id = "dialogo-nuevo-ejercicio";
    dialogo.setAttribute("aria-labelledby", "titulo-nuevo-ejercicio");
    dialogo.innerHTML = `
        <div class="cabecera-ejercicio">
            <div><h2 id="titulo-nuevo-ejercicio">Agregar ejercicio</h2><p>Prepara la ficha que utilizarás en tus rutinas.</p></div>
            <button id="cerrar-nuevo-ejercicio" class="cerrar-ejercicio" type="button" aria-label="Cerrar ventana">×</button>
        </div>
        <form id="form-nuevo-ejercicio" class="formulario-ejercicio">
            <div><label for="nombre-nuevo-ejercicio">Nombre del ejercicio</label><input id="nombre-nuevo-ejercicio" maxlength="80" required placeholder="Ej. Remo con mancuerna"></div>
            <div><label for="grupo-nuevo-ejercicio">Grupo muscular</label><select id="grupo-nuevo-ejercicio" required><option value="">Selecciona un grupo</option><option>Glúteos</option><option>Piernas</option><option>Espalda</option><option>Pecho</option><option>Hombros</option><option>Brazos</option><option>Abdomen</option><option>Cuerpo completo</option><option>Otro</option></select></div>
            <div><label for="imagen-nuevo-ejercicio">Imagen del ejercicio</label><input id="imagen-nuevo-ejercicio" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="ayuda-imagen-ejercicio"><p id="ayuda-imagen-ejercicio" class="ayuda-ejercicio">JPG, PNG o WebP. Máximo 5 MB.</p><img id="preview-nuevo-ejercicio" class="preview-ejercicio" alt="Vista previa del ejercicio" hidden></div>
            <div><label for="pasos-nuevo-ejercicio">Cómo se realiza</label><textarea id="pasos-nuevo-ejercicio" maxlength="4000" required aria-describedby="ayuda-pasos-ejercicio" placeholder="Escribe una instrucción por línea."></textarea><p id="ayuda-pasos-ejercicio" class="ayuda-ejercicio">Una instrucción por línea. Las series y repeticiones se indican al asignarlo.</p></div>
            <p id="mensaje-nuevo-ejercicio" class="mensaje-ejercicio" role="status"></p>
            <div class="acciones-ejercicio"><button id="cancelar-nuevo-ejercicio" class="boton boton-secundario" type="button">Cancelar</button><button id="guardar-nuevo-ejercicio" class="boton" type="submit">Guardar ejercicio</button></div>
        </form>`;
    document.body.append(dialogo);
    const buscar = (id) => dialogo.querySelector(`#${id}`);
    const formulario = buscar("form-nuevo-ejercicio"),
        nombre = buscar("nombre-nuevo-ejercicio"),
        grupo = buscar("grupo-nuevo-ejercicio"),
        archivo = buscar("imagen-nuevo-ejercicio"),
        preview = buscar("preview-nuevo-ejercicio"),
        pasos = buscar("pasos-nuevo-ejercicio"),
        mensaje = buscar("mensaje-nuevo-ejercicio"),
        guardar = buscar("guardar-nuevo-ejercicio"),
        cerrar = buscar("cerrar-nuevo-ejercicio"),
        cancelar = buscar("cancelar-nuevo-ejercicio");

    function avisar(texto, error = false) {
        mensaje.textContent = texto;
        mensaje.dataset.error = String(error);
    }

    function limpiarPreview() {
        preview.hidden = true;
        preview.removeAttribute("src");
        if (temporal) {
            URL.revokeObjectURL(temporal);
            temporal = null;
        }
    }

    function actualizarControles() {
        const actual = servicio.catalogo.find((e) => e.id === seleccionado);
        controles.hidden = !actual?.propio || actual.archivado;
    }

    function abrir(ejercicio = null) {
        editando = ejercicio
            ? {
                  id: ejercicio.id,
                  revision: ejercicio.revision,
              }
            : null;
        formulario.reset();
        limpiarPreview();
        avisar("");
        buscar("titulo-nuevo-ejercicio").textContent = ejercicio
            ? "Editar ejercicio"
            : "Agregar ejercicio";
        guardar.textContent = ejercicio
            ? "Guardar cambios"
            : "Guardar ejercicio";
        archivo.required = !ejercicio;
        buscar("ayuda-imagen-ejercicio").textContent = ejercicio
            ? "Puedes conservar la imagen actual o elegir otra. JPG, PNG o WebP, hasta 5 MB."
            : "JPG, PNG o WebP. Máximo 5 MB.";
        if (ejercicio) {
            nombre.value = ejercicio.nombre;
            grupo.value = ejercicio.grupoMuscular;
            pasos.value = ejercicio.instrucciones.join("\n");
            preview.src = ejercicio.imagen;
            preview.hidden = false;
        }
        dialogo.showModal();
        dialogo.scrollTop = 0;
        nombre.focus();
    }
    nuevo.addEventListener("click", () => abrir());
    editar.addEventListener("click", () => {
        const actual = servicio.catalogo.find((e) => e.id === seleccionado);
        if (actual?.propio && !actual.archivado) abrir(actual);
    });
    eliminar.addEventListener("click", async () => {
        const actual = servicio.catalogo.find((e) => e.id === seleccionado);
        if (!actual?.propio || actual.archivado) return;
        if (
            !confirm(
                `¿Quieres retirar «${actual.nombre}» del catálogo? Su ficha se conservará para los planes que ya lo utilizan.`,
            )
        )
            return;
        eliminar.disabled = true;
        editar.disabled = true;
        try {
            await servicio.eliminar(actual.id, actual.revision);
            avisoCatalogo.textContent =
                "Ejercicio retirado del catálogo. Sus datos siguen disponibles para las rutinas existentes.";
        } catch (error) {
            avisoCatalogo.textContent =
                error.message || "No se pudo eliminar el ejercicio.";
        } finally {
            eliminar.disabled = false;
            editar.disabled = false;
            actualizarControles();
        }
    });
    const cerrarVentana = () => {
        if (!guardando) dialogo.close();
    };
    cerrar.addEventListener("click", cerrarVentana);
    cancelar.addEventListener("click", cerrarVentana);
    dialogo.addEventListener("cancel", (evento) => {
        if (guardando) evento.preventDefault();
    });
    dialogo.addEventListener("close", () => {
        limpiarPreview();
        if (editando && !controles.hidden) editar.focus();
        else nuevo.focus();
    });
    archivo.addEventListener("change", () => {
        limpiarPreview();
        avisar("");
        const imagen = archivo.files[0];
        if (!imagen) {
            const actual = servicio.catalogo.find((e) => e.id === editando?.id);
            if (actual) {
                preview.src = actual.imagen;
                preview.hidden = false;
            }
            return;
        }
        if (
            !["image/jpeg", "image/png", "image/webp"].includes(imagen.type) ||
            imagen.size > 5 * 1024 * 1024
        ) {
            archivo.value = "";
            avisar(
                "Selecciona una imagen JPG, PNG o WebP de hasta 5 MB.",
                true,
            );
            return;
        }
        temporal = URL.createObjectURL(imagen);
        preview.src = temporal;
        preview.hidden = false;
    });
    preview.addEventListener("error", () => {
        limpiarPreview();
        archivo.value = "";
        avisar("No se pudo abrir la imagen. Selecciona otra.", true);
    });
    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        if (guardando || !formulario.reportValidity()) return;
        guardando = true;
        formulario.inert = true;
        cerrar.disabled = true;
        guardar.disabled = true;
        avisar("Guardando ejercicio…");
        try {
            const eraEdicion = Boolean(editando);
            const ejercicio = await servicio.guardar({
                id: editando?.id,
                revisionEsperada: editando?.revision,
                nombre: nombre.value,
                grupoMuscular: grupo.value,
                imagenBlob: archivo.files[0],
                instrucciones: pasos.value
                    .split(/\r?\n/)
                    .map((p) => p.trim())
                    .filter(Boolean),
            });
            dialogo.close();
            avisoCatalogo.textContent = eraEdicion
                ? "Cambios guardados. Si no hay conexión, quedarán pendientes de sincronizar."
                : "Ejercicio guardado en el catálogo.";
            if (!eraEdicion)
                window.dispatchEvent(
                    new CustomEvent("fitregister:seleccionar-ejercicio", {
                        detail: {
                            ejercicioId: ejercicio.id,
                        },
                    }),
                );
        } catch (error) {
            avisar(error.message || "No se pudo guardar el ejercicio.", true);
        } finally {
            guardando = false;
            formulario.inert = false;
            cerrar.disabled = false;
            guardar.disabled = false;
            actualizarControles();
        }
    });
    window.addEventListener("fitregister:ficha-ejercicio", (evento) => {
        seleccionado = evento.detail?.ejercicioId ?? null;
        actualizarControles();
    });
    window.addEventListener(
        "fitregister:catalogo-actualizado",
        actualizarControles,
    );
})();