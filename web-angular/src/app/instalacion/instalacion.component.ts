import {
  Component,
  HostListener,
  OnInit
} from '@angular/core';

// Evento especial de instalación de una PWA.
interface EventoInstalacion extends Event {
  prompt(): Promise<void>;

  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

@Component({
  selector: 'app-instalacion',
  standalone: true,
  templateUrl: './instalacion.component.html',
  styleUrls: ['./instalacion.component.css']
})
export class InstalacionComponent implements OnInit {

  // Solicitud proporcionada por el navegador.
  private solicitudInstalacion:
    EventoInstalacion | null = null;

  // Controla la visibilidad del botón.
  mostrarBoton = false;

  // Evita pulsaciones repetidas.
  instalando = false;

  // Mensajes para el entrenador.
  mensaje = '';

  // INICIALIZACIÓN

  ngOnInit(): void {
    this.actualizarBoton();
  }

  // COMPROBAR SI ESTÁ INSTALADA

  private estaInstalada(): boolean {
    const modoIndependiente = window.matchMedia(
      '(display-mode: standalone)'
    ).matches;

    // Compatibilidad con Safari en iOS.
    const navegadorIOS = navigator as Navigator & {
      standalone?: boolean;
    };

    return (
      modoIndependiente ||
      navegadorIOS.standalone === true
    );
  }

  // MOSTRAR U OCULTAR BOTÓN

  private actualizarBoton(): void {
    this.mostrarBoton =
      this.solicitudInstalacion !== null &&
      !this.estaInstalada();
  }

  // DETECTAR INSTALACIÓN DISPONIBLE

  @HostListener('window:beforeinstallprompt', ['$event'])
  alPermitirInstalacion(evento: Event): void {
    evento.preventDefault();

    this.solicitudInstalacion =
      evento as EventoInstalacion;

    this.actualizarBoton();
  }

  // DETECTAR INSTALACIÓN COMPLETADA

  @HostListener('window:appinstalled')
  alInstalarAplicacion(): void {
    this.solicitudInstalacion = null;
    this.mensaje = '';

    this.actualizarBoton();
  }

  // ABRIR SOLICITUD DE INSTALACIÓN

  async instalar(): Promise<void> {
    if (
      !this.solicitudInstalacion ||
      this.instalando
    ) {
      return;
    }

    const solicitud = this.solicitudInstalacion;

    this.solicitudInstalacion = null;
    this.instalando = true;
    this.mensaje = '';

    try {
      await solicitud.prompt();

      // Esperar la decisión del usuario.
      await solicitud.userChoice;

    } catch (error) {
      console.error(
        'No se pudo iniciar la instalación:',
        error
      );

      this.mensaje =
        'Puedes instalar FITREGISTER desde el menú del navegador.';

    } finally {
      this.instalando = false;
      this.actualizarBoton();
    }
  }

  // ACTUALIZAR AL REGRESAR A LA PÁGINA

  @HostListener('window:pageshow')
  alMostrarPagina(): void {
    this.actualizarBoton();
  }
}
