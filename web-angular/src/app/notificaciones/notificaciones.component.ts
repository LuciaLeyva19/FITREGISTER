import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface Notificacion {
  id: string;
  clienteId: string;
  cliente: string;
  planId: string;
  plan: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
  atendida: boolean;
}

interface PlanGuardado {
  id: string;
  nombre: string;
}

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notificaciones.component.html',
  styleUrls: ['./notificaciones.component.css']
})
export class NotificacionesComponent implements OnInit {

  private readonly router = inject(Router);

  @ViewChild('dialogoNotificaciones')
  dialogoNotificaciones?: ElementRef<HTMLDialogElement>;

  @ViewChild('botonCampana')
  botonCampana?: ElementRef<HTMLButtonElement>;


  private readonly clave =
    'fitregister-notificaciones-demo-v1';

  private readonly clientes = [
    { id: 'ana', nombre: 'Ana Torres' },
    { id: 'diego', nombre: 'Diego Ruiz' },
    { id: 'sofia', nombre: 'Sofía Vega' }
  ];

  notificaciones: Notificacion[] = [];

  filtro: 'todas' | 'sin-leer' = 'todas';

  aviso = '';

  // INICIALIZACIÓN

  ngOnInit(): void {
    this.actualizar();
  }

  // ALMACENAMIENTO LOCAL

  private leer(): Notificacion[] {
    const contenido = localStorage.getItem(this.clave);

    const datos: unknown = JSON.parse(contenido ?? '[]');

    if (!Array.isArray(datos)) {
      throw new Error('Formato de notificaciones inválido.');
    }

    return datos as Notificacion[];
  }

  private guardar(datos: Notificacion[]): void {
    localStorage.setItem(
      this.clave,
      JSON.stringify(datos)
    );
  }

  private leerPlanes(clienteId: string): PlanGuardado[] {
    const contenido = localStorage.getItem(
      `fitregister-planes-${clienteId}`
    );

    const datos: unknown = JSON.parse(contenido ?? '[]');

    if (!Array.isArray(datos)) {
      return [];
    }

    return datos as PlanGuardado[];
  }

  // GENERAR SOLICITUDES DEMO

  private generarEjemplos(): void {
    const datos = this.leer();

    for (const cliente of this.clientes) {
      const planes = this.leerPlanes(cliente.id);
      const plan = planes[0];

      if (
        !plan ||
        datos.some(
          item => item.clienteId === cliente.id
        )
      ) {
        continue;
      }

      datos.push({
        id: crypto.randomUUID(),
        clienteId: cliente.id,
        cliente: cliente.nombre,
        planId: plan.id,
        plan: plan.nombre,
        mensaje:
          'Me gustaría ajustar los ejercicios de este plan. ¿Puedes revisarlo?',
        fecha: new Date().toISOString(),
        leida: false,
        atendida: false
      });
    }

    this.guardar(datos);
  }

  // ACTUALIZAR NOTIFICACIONES

  actualizar(): void {
    try {
      this.generarEjemplos();

      this.notificaciones = this.leer();
      this.aviso = '';

    } catch (error) {
      console.error(
        'No se pudieron cargar las notificaciones:',
        error
      );

      this.notificaciones = [];
      this.aviso =
        'No se pudieron cargar las notificaciones.';
    }
  }

  // CONTADOR Y FILTROS

  get sinLeer(): number {
    return this.notificaciones.filter(
      notificacion => !notificacion.leida
    ).length;
  }

  get visibles(): Notificacion[] {
    return this.notificaciones
      .filter(notificacion =>
        this.filtro === 'todas' ||
        !notificacion.leida
      )
      .slice()
      .reverse();
  }

  cambiarFiltro(
    nuevoFiltro: 'todas' | 'sin-leer'
  ): void {
    this.filtro = nuevoFiltro;
    this.aviso = '';
  }

  // ABRIR Y CERRAR PANEL

  abrirPanel(): void {
    this.actualizar();

    const dialogo =
      this.dialogoNotificaciones?.nativeElement;

    if (dialogo && !dialogo.open) {
      dialogo.showModal();
    }
  }

  cerrarPanel(): void {
    const dialogo =
      this.dialogoNotificaciones?.nativeElement;

    if (dialogo?.open) {
      dialogo.close();
    }
  }

  devolverFoco(): void {
    this.botonCampana?.nativeElement.focus();
  }

  // CAMBIAR ESTADO

  private cambiar(
    id: string,
    cambios: Partial<Notificacion>
  ): void {
    try {
      const datos = this.leer().map(item =>
        item.id === id
          ? { ...item, ...cambios }
          : item
      );

      this.guardar(datos);
      this.actualizar();

    } catch (error) {
      console.error(
        'No se pudo guardar el cambio:',
        error
      );

      this.aviso = 'No se pudo guardar el cambio.';
    }
  }

  marcarLeida(item: Notificacion): void {
    this.cambiar(item.id, {
      leida: true
    });
  }

  marcarAtendida(item: Notificacion): void {
    this.cambiar(item.id, {
      leida: true,
      atendida: true
    });
  }

  // REVISAR RUTINA

  async revisarRutina(
    item: Notificacion
  ): Promise<void> {
    try {
      const planes = this.leerPlanes(item.clienteId);

      const existe = planes.some(
        plan => plan.id === item.planId
      );

      if (!existe) {
        this.aviso =
          'El plan de esta solicitud ya no está disponible.';
        return;
      }

      const datos = this.leer().map(actual =>
        actual.id === item.id
          ? { ...actual, leida: true }
          : actual
      );

      this.guardar(datos);
      this.actualizar();

      // Navegación Angular en lugar de HTML legacy.
      const navego = await this.router.navigate(
        ['/rutinas'],
        {
          queryParams: {
            cliente: item.clienteId,
            plan: item.planId
          }
        }
      );

      if (navego) {
        this.cerrarPanel();
      } else {
        this.aviso = 'No se pudo abrir la sección de Rutinas.';
      }

    } catch (error) {
      console.error(
        'No se pudo abrir el plan:',
        error
      );

      this.aviso = 'No se pudo abrir el plan.';
    }
  }

  // SINCRONIZAR ENTRE PESTAÑAS

  @HostListener('window:storage', ['$event'])
  alCambiarAlmacenamiento(
    evento: StorageEvent
  ): void {
    if (
      evento.key === this.clave ||
      evento.key?.startsWith('fitregister-planes-') ||
      evento.key === null
    ) {
      this.actualizar();
    }
  }
  // RECARGA Y REGRESO A LA PESTAÑA

  @HostListener('window:pageshow')
  alMostrarPagina(): void {
    this.actualizar();
  }

  @HostListener('document:visibilitychange')
  alCambiarVisibilidad(): void {
    if (document.visibilityState === 'visible') {
      this.actualizar();
    }
  }
}
