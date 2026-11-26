import { Injectable, signal } from '@angular/core';

import {
  DiaSemana,
  PlanSemanal
} from '../models/plan.model';

export type DatosGuardarPlan = Omit<
  PlanSemanal,
  'id' | 'creadoEn' | 'actualizadoEn'
> & {
  id?: string;
};

interface RegistroPlanes {
  clienteId: string;
  planes: PlanSemanal[];
  revision?: string;
  contenido?: string;
  actualizadoEn?: string;
  recibidoEn?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlanesService {

  private readonly prefijo = 'fitregister-planes-';
  private readonly nombreBD = 'fitregister-cola-red-demo';
  private readonly versionBD = 2;

  private conexionBD: Promise<IDBDatabase> | null = null;
  private sincronizando = false;

  private readonly _actualizacion = signal(0);
  readonly actualizacion = this._actualizacion.asReadonly();

  private readonly diasPermitidos = new Set<DiaSemana>([
    'lunes',
    'martes',
    'miercoles',
    'jueves',
    'viernes',
    'sabado',
    'domingo'
  ]);

  constructor() {
    // Reanudar la sincronización SIMULADA
    // cuando el navegador recupere conexión.
    window.addEventListener('online', () => {
      void this.sincronizarDemo();
    });
  }

  // =====================================
  // ALMACENAMIENTO LOCAL
  // =====================================

  private clave(clienteId: string): string {
    if (!clienteId.trim()) {
      throw new Error('Selecciona un cliente.');
    }

    return `${this.prefijo}${clienteId}`;
  }

  listar(clienteId: string): Promise<PlanSemanal[]> {
    return Promise.resolve().then(() => {
      const contenido = localStorage.getItem(
        this.clave(clienteId)
      );

      if (!contenido) {
        return [];
      }

      let datos: unknown;

      try {
        datos = JSON.parse(contenido);
      } catch {
        throw new Error(
          'No se pudieron interpretar los planes guardados.'
        );
      }

      if (!Array.isArray(datos)) {
        throw new Error(
          'Los planes guardados tienen un formato inválido.'
        );
      }

      return structuredClone(datos as PlanSemanal[]);
    });
  }

  // =====================================
  // VALIDACIONES
  // =====================================

  private fechaValida(valor: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      return false;
    }

    const [anio, mes, dia] = valor.split('-').map(Number);
    const fecha = new Date(anio, mes - 1, dia, 12);

    return (
      anio >= 1000 &&
      anio <= 9999 &&
      fecha.getFullYear() === anio &&
      fecha.getMonth() === mes - 1 &&
      fecha.getDate() === dia
    );
  }

  private validarPeriodo(
    inicio: string,
    fin: string,
    dias: DiaSemana[]
  ): void {

    if (!this.fechaValida(inicio)) {
      throw new Error(
        'Selecciona una fecha de inicio válida.'
      );
    }

    if (!this.fechaValida(fin)) {
      throw new Error(
        'Selecciona una fecha de fin válida.'
      );
    }

    if (fin < inicio) {
      throw new Error(
        'La fecha de fin no puede ser anterior al inicio.'
      );
    }

    const orden: DiaSemana[] = [
      'domingo',
      'lunes',
      'martes',
      'miercoles',
      'jueves',
      'viernes',
      'sabado'
    ];

    const seleccionados = new Set(dias);
    const [anio, mes, dia] = inicio.split('-').map(Number);
    const fecha = new Date(anio, mes - 1, dia, 12);

    for (let i = 0; i < 7; i++) {
      const fechaActual = [
        fecha.getFullYear(),
        String(fecha.getMonth() + 1).padStart(2, '0'),
        String(fecha.getDate()).padStart(2, '0')
      ].join('-');

      if (fechaActual > fin) {
        break;
      }

      if (seleccionados.has(orden[fecha.getDay()])) {
        return;
      }

      fecha.setDate(fecha.getDate() + 1);
    }

    throw new Error(
      'El periodo no incluye ninguno de los días seleccionados.'
    );
  }

  private validar(datos: DatosGuardarPlan): void {
    if (
      !datos.nombre?.trim() ||
      datos.nombre.trim().length > 70
    ) {
      throw new Error(
        'Escribe un nombre válido para el plan.'
      );
    }

    if (!Array.isArray(datos.dias) || !datos.dias.length) {
      throw new Error(
        'Selecciona por lo menos un día de entrenamiento.'
      );
    }

    const utilizados = new Set<DiaSemana>();

    for (const dia of datos.dias) {
      if (
        !this.diasPermitidos.has(dia.dia) ||
        utilizados.has(dia.dia)
      ) {
        throw new Error(
          'Revisa los días seleccionados.'
        );
      }

      utilizados.add(dia.dia);

      if (!dia.nombre?.trim() || dia.nombre.length > 70) {
        throw new Error(
          'Cada día necesita un nombre de rutina.'
        );
      }

      if (
        !Array.isArray(dia.ejercicios) ||
        !dia.ejercicios.length
      ) {
        throw new Error(
          `Agrega ejercicios a la rutina del ${dia.dia}.`
        );
      }

      for (const ejercicio of dia.ejercicios) {
        if (
          !ejercicio.ejercicioId ||
          !ejercicio.nombre?.trim()
        ) {
          throw new Error(
            'Revisa la información de los ejercicios.'
          );
        }

        if (
          !Number.isSafeInteger(ejercicio.series) ||
          ejercicio.series < 1 ||
          !Number.isSafeInteger(ejercicio.repeticiones) ||
          ejercicio.repeticiones < 1
        ) {
          throw new Error(
            'Series y repeticiones deben ser enteros positivos.'
          );
        }
      }
    }

    this.validarPeriodo(
      datos.fechaInicio,
      datos.fechaFin,
      [...utilizados]
    );
  }

  // =====================================
  // INDEXEDDB
  // =====================================

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

        for (const nombre of [
          'estadoPlanes',
          'colaPlanes',
          'servidorPlanes'
        ]) {
          if (!bd.objectStoreNames.contains(nombre)) {
            bd.createObjectStore(nombre, {
              keyPath: 'clienteId'
            });
          }
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
          new Error('No se pudo abrir IndexedDB.')
        );
      };
    });

    return this.conexionBD;
  }

  private async obtenerRegistro(
    almacen: string,
    clienteId: string
  ): Promise<RegistroPlanes | undefined> {

    const bd = await this.abrirBD();

    return new Promise((resolve, reject) => {
      const tx = bd.transaction(almacen, 'readonly');

      const solicitud = tx.objectStore(almacen)
        .get(clienteId);

      tx.oncomplete = () => {
        resolve(
          solicitud.result as RegistroPlanes | undefined
        );
      };

      tx.onabort = () => {
        reject(
          tx.error ??
          new Error('No se pudo consultar IndexedDB.')
        );
      };
    });
  }

  // =====================================
  // COMPARACIÓN POR PLAN
  // =====================================

  private iguales(
    local: PlanSemanal,
    recibido: PlanSemanal
  ): boolean {
    return JSON.stringify(local) === JSON.stringify(recibido);
  }

  async planesPendientes(
    clienteId: string
  ): Promise<string[]> {

    const locales = await this.listar(clienteId);

    const registro = await this.obtenerRegistro(
      'servidorPlanes',
      clienteId
    );

    // Los planes que no existen en la copia recibida
    // o que fueron modificados siguen pendientes.
    const recibidos = registro?.planes ?? [];

    return locales
      .filter(plan => {
        const recibido = recibidos.find(
          actual => actual.id === plan.id
        );

        return (
          !recibido ||
          !this.iguales(plan, recibido)
        );
      })
      .map(plan => plan.id);
  }

  // =====================================
  // COLA DE CAMBIOS
  // =====================================

  private async encolar(
    clienteId: string,
    planes: PlanSemanal[]
  ): Promise<void> {

    const bd = await this.abrirBD();
    const revision = crypto.randomUUID();

    const registro: RegistroPlanes = {
      clienteId,
      revision,
      contenido: JSON.stringify(planes),
      planes: structuredClone(planes),
      actualizadoEn: new Date().toISOString()
    };

    await new Promise<void>((resolve, reject) => {
      const tx = bd.transaction(
        ['estadoPlanes', 'colaPlanes'],
        'readwrite'
      );

      tx.objectStore('estadoPlanes').put(registro);
      tx.objectStore('colaPlanes').put(registro);

      tx.oncomplete = () => resolve();

      tx.onabort = () => reject(
        tx.error ??
        new Error(
          'No se pudo registrar el cambio pendiente.'
        )
      );
    });

    this._actualizacion.update(valor => valor + 1);
  }

  private async persistir(
    clienteId: string,
    planes: PlanSemanal[]
  ): Promise<void> {

    // Conservamos la estructura local de FITREGISTER.
    localStorage.setItem(
      this.clave(clienteId),
      JSON.stringify(planes)
    );

    this._actualizacion.update(valor => valor + 1);

    try {
      await this.encolar(clienteId, planes);
    } catch (error) {
      console.error(
        'Plan guardado, pero no se pudo actualizar la cola:',
        error
      );

      throw new Error(
        'El plan quedó guardado localmente, pero no se pudo ' +
        'registrar correctamente su estado de sincronización.'
      );
    }

    // La sincronización de esta etapa es SIMULADA.
    // Si estamos offline, la cola permanece pendiente.
    if (navigator.onLine) {
      void this.sincronizarDemo();
    }
  }

  // =====================================
  // CREAR Y EDITAR PLAN
  // =====================================

  async guardar(
    clienteId: string,
    datos: DatosGuardarPlan
  ): Promise<PlanSemanal> {

    this.validar(datos);

    const planes = await this.listar(clienteId);

    const indice = datos.id
      ? planes.findIndex(plan => plan.id === datos.id)
      : -1;

    if (datos.id && indice < 0) {
      throw new Error(
        'El plan que quieres modificar no está disponible.'
      );
    }

    const ahora = new Date().toISOString();
    let resultado: PlanSemanal;

    if (indice < 0) {
      resultado = {
        ...structuredClone(datos),
        id: crypto.randomUUID(),
        nombre: datos.nombre.trim(),
        creadoEn: ahora
      };

      planes.push(resultado);

    } else {
      const anterior = planes[indice];

      resultado = {
        ...anterior,
        ...structuredClone(datos),
        id: anterior.id,
        nombre: datos.nombre.trim(),
        creadoEn: anterior.creadoEn,
        actualizadoEn: ahora
      };

      planes[indice] = resultado;
    }

    await this.persistir(clienteId, planes);

    return structuredClone(resultado);
  }

  // =====================================
  // ELIMINAR PLAN
  // =====================================

  async eliminar(
    clienteId: string,
    planId: string
  ): Promise<void> {

    const planes = await this.listar(clienteId);

    const restantes = planes.filter(
      plan => plan.id !== planId
    );

    if (restantes.length === planes.length) {
      throw new Error(
        'El plan que quieres eliminar no está disponible.'
      );
    }

    await this.persistir(clienteId, restantes);
  }

  // =====================================
  // SINCRONIZACIÓN SIMULADA
  // =====================================

  async sincronizarDemo(): Promise<void> {
    if (this.sincronizando || !navigator.onLine) {
      return;
    }

    this.sincronizando = true;

    try {
      const bd = await this.abrirBD();

      const pendientes = await new Promise<RegistroPlanes[]>(
        (resolve, reject) => {
          const tx = bd.transaction(
            'colaPlanes',
            'readonly'
          );

          const solicitud = tx.objectStore('colaPlanes')
            .getAll();

          tx.oncomplete = () => resolve(
            solicitud.result as RegistroPlanes[]
          );

          tx.onabort = () => reject(
            tx.error ??
            new Error('No se pudo consultar la cola.')
          );
        }
      );

      for (const pendiente of pendientes) {
        if (!navigator.onLine) {
          break;
        }

        // Simula la recepción de los cambios en IndexedDB.
        // NO hay comunicación con PostgreSQL.
        await new Promise<void>((resolve, reject) => {
          const tx = bd.transaction(
            ['colaPlanes', 'servidorPlanes'],
            'readwrite'
          );

          const cola = tx.objectStore('colaPlanes');
          const solicitud = cola.get(pendiente.clienteId);

          solicitud.onsuccess = () => {
            const actual = solicitud.result as
              RegistroPlanes | undefined;

            // Evita confirmar una revisión antigua
            // si el entrenador volvió a editar el plan.
            if (
              !actual ||
              actual.revision !== pendiente.revision
            ) {
              return;
            }

            tx.objectStore('servidorPlanes').put({
              ...actual,
              recibidoEn: new Date().toISOString()
            });

            cola.delete(pendiente.clienteId);
          };

          tx.oncomplete = () => resolve();

          tx.onabort = () => reject(
            tx.error ??
            new Error(
              'No se pudo completar la sincronización simulada.'
            )
          );
        });
      }

      this._actualizacion.update(valor => valor + 1);

    } catch (error) {
      console.error(
        'No se pudo completar la sincronización simulada:',
        error
      );

    } finally {
      this.sincronizando = false;
    }
  }
}
