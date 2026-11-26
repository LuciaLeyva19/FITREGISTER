import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild
} from '@angular/core';

@Component({
  selector: 'app-plan-pro',
  standalone: true,
  templateUrl: './plan-pro.component.html',
  styleUrls: ['./plan-pro.component.css']
})
export class PlanProComponent implements OnInit {

  @ViewChild('estadoProElemento')
  estadoProElemento?: ElementRef<HTMLElement>;

  // Misma clave utilizada en el JavaScript original.
  private readonly clavePro = 'fitregister-pro-demo';

  // Estado de la suscripción.
  proActivo = false;

  // Control de disponibilidad del almacenamiento.
  almacenamientoDisponible = true;

  // Mensaje mostrado debajo del botón.
  mensajePro = 'Activación de prueba sin cobro.';

  // INICIALIZACIÓN

  ngOnInit(): void {
    this.mostrarEstado();
  }

  // CONSULTAR ESTADO DEL PLAN

  mostrarEstado(): void {
    try {
      const activo =
        localStorage.getItem(this.clavePro) === 'activo';

      this.proActivo = activo;
      this.almacenamientoDisponible = true;

      this.mensajePro = activo
        ? 'Plan Pro activo · Simulación'
        : 'Activación de prueba sin cobro.';

    } catch (error) {
      console.error(
        'No se pudo consultar el estado de Plan Pro:',
        error
      );

      this.proActivo = false;
      this.almacenamientoDisponible = false;

      this.mensajePro =
        'No se pudo consultar el plan en este navegador.';
    }
  }

  // ACTIVAR PLAN PRO DE PRUEBA

  activarPro(): void {
    if (
      this.proActivo ||
      !this.almacenamientoDisponible
    ) {
      return;
    }

    try {
      localStorage.setItem(
        this.clavePro,
        'activo'
      );

    } catch (error) {
      console.error(
        'No se pudo guardar la activación:',
        error
      );

      this.mensajePro =
        'No se pudo guardar la activación. Inténtalo de nuevo.';

      return;
    }

    // Actualizar interfaz.
    this.mostrarEstado();

    // Conservar el enfoque del mensaje,
    // como hacía el JavaScript original.
    setTimeout(() => {
      this.estadoProElemento?.nativeElement.focus();
    }, 0);
  }

  // RESTAURAR ESTADO AL MOSTRAR LA PÁGINA

  @HostListener('window:pageshow')
  alMostrarPagina(): void {
    this.mostrarEstado();
  }

  // Si otra pestaña modifica la activación,
  // actualizar esta pantalla automáticamente.
  @HostListener('window:storage', ['$event'])
  alCambiarAlmacenamiento(
    evento: StorageEvent
  ): void {
    if (
      evento.key === this.clavePro ||
      evento.key === null
    ) {
      this.mostrarEstado();
    }
  }
}
