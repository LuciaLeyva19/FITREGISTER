import {
  Component,
  inject,
  HostListener,
  OnInit,
  OnDestroy
} from '@angular/core';

import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

import { SessionService } from './core/session.service';
import { PlanesService } from './rutinas/services/planes.service';

import { NotificacionesComponent } from './notificaciones/notificaciones.component';
import { InstalacionComponent } from './instalacion/instalacion.component';

@Component({
  selector: 'app-root',
  standalone: true,

  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NotificacionesComponent,
    InstalacionComponent
  ],

  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  // SERVICIOS

  readonly session = inject(SessionService);

  private readonly router = inject(Router);
  private readonly planesService = inject(PlanesService);

  // MENÚ

  menuAbierto = false;

  // ESTADO DE CONEXIÓN

  conectado = navigator.onLine;

  // SINCRONIZACIÓN LOCAL SIMULADA

  private temporizadorSincronizacion:
    ReturnType<typeof setInterval> | null = null;

  private sincronizando = false;

  // INICIALIZACIÓN

  ngOnInit(): void {
    this.actualizarConexion();

    this.temporizadorSincronizacion = setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.actualizarConexion();

        if (this.conectado) {
          void this.sincronizarPendientes();
        }
      }
    }, 10000);

    if (this.conectado) {
      void this.sincronizarPendientes();
    }
  }

  // LIMPIEZA

  ngOnDestroy(): void {
    if (this.temporizadorSincronizacion) {
      clearInterval(this.temporizadorSincronizacion);
      this.temporizadorSincronizacion = null;
    }
  }

  // INICIALES DEL ENTRENADOR

  get initials(): string {
    return this.session
      .name()
      .split(/\s+/)
      .slice(0, 2)
      .map(nombre => nombre[0] || '')
      .join('')
      .toLocaleUpperCase('es-MX');
  }

  // MENÚ MÓVIL

  abrirMenu(): void {
    this.menuAbierto = true;
  }

  cerrarMenu(): void {
    this.menuAbierto = false;
  }

  @HostListener('document:keydown.escape')
  manejarEscape(): void {
    if (this.menuAbierto) {
      this.cerrarMenu();
    }
  }

  // ESTADO DE CONEXIÓN

  private actualizarConexion(): void {
    this.conectado = navigator.onLine;
  }

  @HostListener('window:online')
  alConectarse(): void {
    this.actualizarConexion();

    if (this.conectado) {
      void this.sincronizarPendientes();
    }
  }

  @HostListener('window:offline')
  alDesconectarse(): void {
    this.actualizarConexion();
  }

  @HostListener('window:pageshow')
  alMostrarPagina(): void {
    this.actualizarConexion();

    if (this.conectado) {
      void this.sincronizarPendientes();
    }
  }

  @HostListener('document:visibilitychange')
  alCambiarVisibilidad(): void {
    if (document.visibilityState === 'visible') {
      this.actualizarConexion();

      if (this.conectado) {
        void this.sincronizarPendientes();
      }
    }
  }

  // SINCRONIZACIÓN LOCAL SIMULADA

  private async sincronizarPendientes(): Promise<void> {
    if (
      this.sincronizando ||
      !navigator.onLine
    ) {
      return;
    }

    this.sincronizando = true;

    try {
      await this.planesService.sincronizarDemo();

    } catch (error) {
      console.error(
        'No se pudo completar la sincronización simulada:',
        error
      );

    } finally {
      this.sincronizando = false;
    }
  }

  // CERRAR SESIÓN

  logout(): void {
    this.cerrarMenu();
    this.session.logout();
    void this.router.navigateByUrl('/login');
  }
}
