import { Injectable, signal } from '@angular/core';
import { BorradorPlan } from '../models/plan.model';

/*
 * FITREGISTER
 * Servicio de borradores de planes semanales.
 *
 * Almacena temporalmente el trabajo del entrenador
 * mediante IndexedDB.
 */

interface RegistroBorrador {
  id: string;
  actualizadoEn: string;
  datos: BorradorPlan;
}

@Injectable({
  providedIn: 'root'
})
export class BorradoresService {

  private readonly nombreBD =
    'fitregister-borradores-demo';

  private readonly versionBD = 1;
  private readonly nombreAlmacen = 'borradores';
  private readonly identificador = 'actual';

  private conexionBD: Promise<IDBDatabase> | null = null;

  // Evita que dos escrituras se ejecuten al mismo tiempo.
  private cola: Promise<unknown> = Promise.resolve();

  private readonly _guardando = signal(false);
  readonly guardando = this._guardando.asReadonly();

  private readonly _ultimoGuardado = signal<string | null>(null);
  readonly ultimoGuardado = this._ultimoGuardado.asReadonly();

  /*Abrir base de datos*/

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

        if (!bd.objectStoreNames.contains(this.nombreAlmacen)) {
          bd.createObjectStore(
            this.nombreAlmacen,
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
          new Error('No se pudo abrir el almacenamiento de borradores.')
        );
      };

      solicitud.onblocked = () => {
        console.warn(
          'Otra pestaña está utilizando la base de datos de borradores.'
        );
      };
    });

    return this.conexionBD;
  }

  /*Ejecutar operaciones en orden */

  private ejecutarEnOrden<T>(
    operacion: () => Promise<T>
  ): Promise<T> {

    const tarea = this.cola
      .catch(() => undefined)
      .then(operacion);

    this.cola = tarea.then(
      () => undefined,
      () => undefined
    );

    return tarea;
  }

  /* Leer borrador */

  private async leerRegistro(): Promise<RegistroBorrador | null> {
    const bd = await this.abrirBD();

    return new Promise((resolve, reject) => {

      const tx = bd.transaction(
        this.nombreAlmacen,
        'readonly'
      );

      const solicitud = tx
        .objectStore(this.nombreAlmacen)
        .get(this.identificador);

      tx.oncomplete = () => {
        resolve(
          (solicitud.result as RegistroBorrador | undefined)
          ?? null
        );
      };

      tx.onabort = () => {
        reject(
          tx.error ??
          new Error('No se pudo recuperar el borrador.')
        );
      };
    });
  }

  async recuperar(): Promise<BorradorPlan | null> {
    return this.ejecutarEnOrden(async () => {

      const registro = await this.leerRegistro();

      if (!registro) {
        this._ultimoGuardado.set(null);
        return null;
      }

      if (
        !registro.datos ||
        registro.datos.version !== 1
      ) {
        throw new Error(
          'El borrador tiene un formato que no es compatible.'
        );
      }

      this._ultimoGuardado.set(registro.actualizadoEn);

      return structuredClone(registro.datos);
    });
  }

  /* Guardar borrador*/

  async guardar(datos: BorradorPlan): Promise<void> {

    return this.ejecutarEnOrden(async () => {

      this._guardando.set(true);

      try {
        if (datos.version !== 1) {
          throw new Error('Versión de borrador no compatible.');
        }

        const bd = await this.abrirBD();
        const ahora = new Date().toISOString();

        const registro: RegistroBorrador = {
          id: this.identificador,
          actualizadoEn: ahora,
          datos: structuredClone(datos)
        };

        await new Promise<void>((resolve, reject) => {

          const tx = bd.transaction(
            this.nombreAlmacen,
            'readwrite'
          );

          tx.objectStore(this.nombreAlmacen)
            .put(registro);

          tx.oncomplete = () => resolve();

          tx.onabort = () => {
            reject(
              tx.error ??
              new Error('No se pudo guardar el borrador.')
            );
          };
        });

        this._ultimoGuardado.set(ahora);

      } finally {
        this._guardando.set(false);
      }
    });
  }

  /*Eliminar borrador */

  async eliminar(): Promise<void> {

    return this.ejecutarEnOrden(async () => {

      const bd = await this.abrirBD();

      await new Promise<void>((resolve, reject) => {

        const tx = bd.transaction(
          this.nombreAlmacen,
          'readwrite'
        );

        tx.objectStore(this.nombreAlmacen)
          .delete(this.identificador);

        tx.oncomplete = () => resolve();

        tx.onabort = () => {
          reject(
            tx.error ??
            new Error('No se pudo eliminar el borrador.')
          );
        };
      });

      this._ultimoGuardado.set(null);
    });
  }

  /*Comprobar si hay borrador */

  async existe(): Promise<boolean> {

    return this.ejecutarEnOrden(async () => {
      const registro = await this.leerRegistro();
      return registro !== null;
    });
  }
}
