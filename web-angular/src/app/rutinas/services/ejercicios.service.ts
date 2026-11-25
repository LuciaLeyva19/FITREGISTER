import { Injectable, signal } from '@angular/core';

import {
  EjercicioCatalogo
} from '../models/plan.model';

export interface DatosEjercicio {
  id?: string;
  revisionEsperada?: string;
  nombre: string;
  grupoMuscular: string;
  instrucciones: string[];
  imagenBlob?: Blob;
}

@Injectable({
  providedIn: 'root'
})
export class EjerciciosService {

  private readonly nombreBD =
    'fitregister-catalogo-ejercicios-demo';

  private readonly versionBD = 1;

  private readonly almacen = 'ejercicios';

  private conexionBD: Promise<IDBDatabase> | null = null;

  private urlsTemporales = new Map<string, string>();

  private readonly _catalogo =
    signal<EjercicioCatalogo[]>([]);

  readonly catalogo = this._catalogo.asReadonly();

  private readonly iniciales: EjercicioCatalogo[] = [
    {
      id: 'hip-thrust',
      nombre: 'Hip thrust',
      grupoMuscular: 'Glúteos',
      imagen: '/assets/img/ejercicios/hip-thrust.png',
      instrucciones: [
        'Apoya la parte alta de la espalda en un banco y coloca los pies en el suelo.',
        'Eleva la cadera hasta alinear el tronco y los muslos.',
        'Baja la cadera con control.'
      ],
      propio: false,
      archivado: false,
      pendiente: false,
      revision: 'inicial',
      sincronizado: true,
      orden: 0
    },
    {
      id: 'hip-thrust-mancuerna',
      nombre: 'Hip thrust con mancuerna',
      grupoMuscular: 'Glúteos',
      imagen:
        '/assets/img/ejercicios/hip-thrust-mancuerna.png',
      instrucciones: [
        'Apoya la parte alta de la espalda en un banco y sujeta la mancuerna sobre la cadera.',
        'Empuja el suelo con los pies para elevar la cadera.',
        'Desciende con control mientras sostienes la mancuerna.'
      ],
      propio: false,
      archivado: false,
      pendiente: false,
      revision: 'inicial',
      sincronizado: true,
      orden: 1
    },
    {
      id: 'sentadilla',
      nombre: 'Sentadilla',
      grupoMuscular: 'Piernas',
      imagen: '',
      instrucciones: [
        'Coloca los pies aproximadamente al ancho de los hombros.',
        'Flexiona las caderas y las rodillas para bajar con control.',
        'Empuja el suelo con los pies para volver a la posición inicial.'
      ],
      propio: false,
      archivado: false,
      pendiente: false,
      revision: 'inicial',
      sincronizado: true,
      orden: 2
    }
  ];

  /* =====================================
     Conexión con IndexedDB
     ===================================== */

  private abrirBD(): Promise<IDBDatabase> {
    if (this.conexionBD) {
      return this.conexionBD;
    }

    this.conexionBD = new Promise((resolve, reject) => {
      const solicitud = indexedDB.open(
        this.nombreBD,
        this.versionBD
      );

      solicitud.onupgradeneeded = () => {
        const bd = solicitud.result;
        const tx = solicitud.transaction!;

        let ejercicios: IDBObjectStore;

        if (!bd.objectStoreNames.contains(this.almacen)) {
          ejercicios = bd.createObjectStore(
            this.almacen,
            { keyPath: 'id' }
          );

          this.iniciales.forEach(ejercicio => {
            ejercicios.add(ejercicio);
          });
        } else {
          ejercicios = tx.objectStore(this.almacen);
        }

        if (!bd.objectStoreNames.contains('servidorEjercicios')) {
          bd.createObjectStore(
            'servidorEjercicios',
            { keyPath: 'id' }
          );
        }
      };

      solicitud.onsuccess = () => {
        const bd = solicitud.result;

        bd.onversionchange = () => {
          bd.close();
          this.conexionBD = null;
        };

        resolve(bd);
      };

      solicitud.onerror = () => {
        this.conexionBD = null;
        reject(
          solicitud.error ??
          new Error('No se pudo abrir el catálogo.')
        );
      };

      solicitud.onblocked = () => {
        console.warn(
          'IndexedDB está bloqueada por otra pestaña.'
        );
      };
    });

    return this.conexionBD;
  }

  /* =====================================
     Consultar catálogo
     ===================================== */

  private async leerTodos(): Promise<EjercicioCatalogo[]> {
    const bd = await this.abrirBD();

    return new Promise((resolve, reject) => {
      const tx = bd.transaction(
        this.almacen,
        'readonly'
      );

      const solicitud = tx
        .objectStore(this.almacen)
        .getAll();

      tx.oncomplete = () => {
        resolve(
          solicitud.result as EjercicioCatalogo[]
        );
      };

      tx.onabort = () => {
        reject(
          tx.error ??
          new Error('No se pudo leer el catálogo.')
        );
      };
    });
  }

  async cargarCatalogo(): Promise<void> {
    const registros = await this.leerTodos();

    registros.sort(
      (a, b) => (a.orden ?? 0) - (b.orden ?? 0)
    );

    const catalogo = registros.map(ejercicio => {
      const anterior = this.urlsTemporales.get(
        ejercicio.id
      );

      if (anterior) {
        URL.revokeObjectURL(anterior);
        this.urlsTemporales.delete(ejercicio.id);
      }

      let imagen = ejercicio.imagen;

      if (ejercicio.imagenBlob instanceof Blob) {
        imagen = URL.createObjectURL(
          ejercicio.imagenBlob
        );

        this.urlsTemporales.set(
          ejercicio.id,
          imagen
        );
      } else if (!ejercicio.propio) {
        const inicial = this.iniciales.find(
          e => e.id === ejercicio.id
        );

        imagen = inicial?.imagen ?? imagen;
      }

      return {
        ...ejercicio,
        imagen,
        propio:
          ejercicio.propio ??
          ejercicio.revision !== 'inicial',
        archivado: Boolean(ejercicio.archivado),
        pendiente: ejercicio.sincronizado === false
      };
    });

    this._catalogo.set(catalogo);
  }

  get disponibles(): EjercicioCatalogo[] {
    return this._catalogo().filter(
      ejercicio => !ejercicio.archivado
    );
  }

  buscar(texto: string): EjercicioCatalogo[] {
    const consulta = this.normalizar(texto);

    return this.disponibles.filter(ejercicio =>
      this.normalizar(ejercicio.nombre)
        .includes(consulta)
    );
  }

  obtenerPorId(
    id: string
  ): EjercicioCatalogo | undefined {
    // Incluye archivados para conservar
    // las referencias de planes anteriores.
    return this._catalogo().find(
      ejercicio => ejercicio.id === id
    );
  }

  private normalizar(texto: string): string {
    return texto
      .trim()
      .toLocaleLowerCase('es-MX')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  /* =====================================
     Validaciones
     ===================================== */

  private validarDatos(
    datos: DatosEjercicio,
    anterior?: EjercicioCatalogo
  ): void {
    const nombre = datos.nombre.trim();
    const grupo = datos.grupoMuscular.trim();

    if (!nombre || nombre.length > 80) {
      throw new Error(
        'El nombre debe tener entre 1 y 80 caracteres.'
      );
    }

    if (!grupo) {
      throw new Error(
        'Selecciona un grupo muscular.'
      );
    }

    if (
      !Array.isArray(datos.instrucciones) ||
      datos.instrucciones.length === 0 ||
      datos.instrucciones.some(
        instruccion =>
          typeof instruccion !== 'string' ||
          !instruccion.trim()
      ) ||
      datos.instrucciones.join('\n').length > 4000
    ) {
      throw new Error(
        'Escribe instrucciones válidas de hasta 4000 caracteres.'
      );
    }

    const imagen =
      datos.imagenBlob ?? anterior?.imagenBlob;

    if (!(imagen instanceof Blob) || !imagen.size) {
      throw new Error('Selecciona una imagen.');
    }

    if (
      !['image/jpeg', 'image/png', 'image/webp']
        .includes(imagen.type)
    ) {
      throw new Error(
        'La imagen debe ser JPG, PNG o WebP.'
      );
    }

    if (imagen.size > 5 * 1024 * 1024) {
      throw new Error(
        'La imagen no debe superar los 5 MB.'
      );
    }
  }

  /* =====================================
     Guardar o editar ejercicio
     ===================================== */

  async guardar(
    datos: DatosEjercicio
  ): Promise<EjercicioCatalogo> {
    const bd = await this.abrirBD();

    const id = datos.id ?? crypto.randomUUID();

    await new Promise<void>((resolve, reject) => {
      const tx = bd.transaction(
        this.almacen,
        'readwrite'
      );

      const almacen = tx.objectStore(
        this.almacen
      );

      let motivo: Error | null = null;

      const escribir = (
        anterior?: EjercicioCatalogo
      ) => {
        try {
          if (datos.id) {
            if (
              !anterior ||
              !anterior.propio ||
              anterior.archivado
            ) {
              throw new Error(
                'Este ejercicio no puede modificarse.'
              );
            }

            if (
              datos.revisionEsperada !==
              anterior.revision
            ) {
              throw new Error(
                'El ejercicio cambió. Vuelve a abrirlo.'
              );
            }
          }

          this.validarDatos(datos, anterior);

          const ahora = new Date().toISOString();

          const registro: EjercicioCatalogo = {
            ...anterior,
            id,
            nombre: datos.nombre.trim(),
            grupoMuscular:
              datos.grupoMuscular.trim(),
            instrucciones:
              datos.instrucciones.map(
                instruccion => instruccion.trim()
              ),
            imagen: anterior?.imagen ?? '',
            imagenBlob:
              datos.imagenBlob ??
              anterior?.imagenBlob,
            propio: true,
            archivado: false,
            pendiente: true,
            sincronizado: false,
            revision: crypto.randomUUID(),
            orden: anterior?.orden ?? Date.now(),
            creadoEn:
              anterior?.creadoEn ?? ahora,
            actualizadoEn: ahora
          };

          almacen.put(registro);
        } catch (error) {
          motivo = error instanceof Error
            ? error
            : new Error('No se pudo guardar.');

          tx.abort();
        }
      };

      if (datos.id) {
        const solicitud = almacen.get(
          datos.id
        );

        solicitud.onsuccess = () => {
          escribir(
            solicitud.result as
              EjercicioCatalogo | undefined
          );
        };
      } else {
        escribir();
      }

      tx.oncomplete = () => resolve();

      tx.onabort = () => reject(
        motivo ??
        tx.error ??
        new Error('No se pudo guardar el ejercicio.')
      );
    });

    await this.cargarCatalogo();

    const ejercicio = this.obtenerPorId(id);

    if (!ejercicio) {
      throw new Error(
        'No se pudo recuperar el ejercicio guardado.'
      );
    }

    return ejercicio;
  }

  /* =====================================
     Archivar ejercicio propio
     ===================================== */

  async archivar(
    id: string,
    revisionEsperada: string
  ): Promise<void> {
    const bd = await this.abrirBD();

    await new Promise<void>((resolve, reject) => {
      const tx = bd.transaction(
        this.almacen,
        'readwrite'
      );

      const almacen = tx.objectStore(
        this.almacen
      );

      let motivo: Error | null = null;

      const solicitud = almacen.get(id);

      solicitud.onsuccess = () => {
        try {
          const ejercicio =
            solicitud.result as
              EjercicioCatalogo | undefined;

          if (!ejercicio || !ejercicio.propio) {
            throw new Error(
              'Solo puedes eliminar ejercicios propios.'
            );
          }

          if (ejercicio.archivado) {
            return;
          }

          if (
            ejercicio.revision !==
            revisionEsperada
          ) {
            throw new Error(
              'El ejercicio cambió. Vuelve a intentarlo.'
            );
          }

          almacen.put({
            ...ejercicio,
            archivado: true,
            sincronizado: false,
            pendiente: true,
            revision: crypto.randomUUID(),
            actualizadoEn:
              new Date().toISOString()
          });
        } catch (error) {
          motivo = error instanceof Error
            ? error
            : new Error('No se pudo archivar.');

          tx.abort();
        }
      };

      tx.oncomplete = () => resolve();

      tx.onabort = () => reject(
        motivo ??
        tx.error ??
        new Error('No se pudo archivar el ejercicio.')
      );
    });

    await this.cargarCatalogo();
  }
}
