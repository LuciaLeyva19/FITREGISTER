/**
 * MÓDULO DE CLIENTES - IMPLEMENTACIÓN DEMOSTRATIVA
 *
 * Actualmente, la gestión de clientes utiliza datos simulados.
 * La integración con la API REST y la base de datos
 * se realizará en una etapa posterior del proyecto.
 */

import {
  Component,
  ElementRef,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PlanesService } from '../rutinas/services/planes.service';

interface Cliente {
  id: string;
  nombre: string;
  iniciales: string;
}

interface Ejercicio {
  nombre: string;
  series: number;
  repeticiones: number | string;
}

interface Rutina {
  nombre: string;
  ejercicios?: Ejercicio[];
  ejercicio?: string;
  series?: number;
  repeticiones?: number | string;
}

interface DiaPlan {
  dia: string;
  nombre: string;
  ejercicios: Ejercicio[];
}

interface Plan {
  id: string;
  nombre: string;
  dias: DiaPlan[];
}

interface Perfil {
  objetivo: string;
  experiencia: string;
  disponibilidad: string;
  equipo: string;
  lesiones: string;
  limitaciones: string;
  observaciones: string;
}

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css']
})
export class ClientesComponent implements OnDestroy {

  @ViewChild('dialogPerfil')
  dialogPerfil!: ElementRef<HTMLDialogElement>;

  @ViewChild('dialogRutinas')
  dialogRutinas!: ElementRef<HTMLDialogElement>;

  @ViewChild('dialogConfirmar')
  dialogConfirmar!: ElementRef<HTMLDialogElement>;

  readonly clientes: Cliente[] = [
    { id: 'diego', nombre: 'Diego Ruiz', iniciales: 'DR' },
    { id: 'ana', nombre: 'Ana Torres', iniciales: 'AT' },
    { id: 'sofia', nombre: 'Sofía Vega', iniciales: 'SV' }
  ];

  readonly perfiles: Record<string, Perfil> = {
    diego: {
      objetivo: 'Aumentar fuerza y masa muscular',
      experiencia: 'Intermedio',
      disponibilidad: 'Lunes, miércoles y viernes',
      equipo: 'Gimnasio',
      lesiones: '',
      limitaciones: '',
      observaciones: 'Prefiero entrenamientos por la tarde.'
    },
    ana: {
      objetivo: 'Mejorar condición física',
      experiencia: 'Principiante',
      disponibilidad: 'Martes, jueves y sábado',
      equipo: 'Mancuernas y banco',
      lesiones: '',
      limitaciones: '',
      observaciones:
        'Me gustaría comenzar con sesiones de 45 minutos.'
    },
    sofia: {
      objetivo: '',
      experiencia: '',
      disponibilidad: '',
      equipo: '',
      lesiones: '',
      limitaciones: '',
      observaciones: ''
    }
  };

  readonly semana = [
    { id: 'lunes', nombre: 'Lunes' },
    { id: 'martes', nombre: 'Martes' },
    { id: 'miercoles', nombre: 'Miércoles' },
    { id: 'jueves', nombre: 'Jueves' },
    { id: 'viernes', nombre: 'Viernes' },
    { id: 'sabado', nombre: 'Sábado' },
    { id: 'domingo', nombre: 'Domingo' }
  ];

  busqueda = '';
  invitacionVisible = false;
  codigoInvitacion = '';

  aviso = '';
  avisoPanel = '';

  vinculados: Cliente[] = [];

  clienteActivo: Cliente | null = null;
  perfilActivo: Perfil | null = null;

  planesActivos: Plan[] = [];
  rutinasAnteriores: Rutina[] = [];

  /* Estado de sincronización por plan */
  planesPendientesIds = new Set<string>();
  consultandoPendientes = false;

  pendienteEliminar:
    | { cliente: Cliente; plan?: Plan }
    | null = null;

  private readonly claveDesvinculados =
    'fitregister-clientes-desvinculados-demo';

  private consultaPendientesVersion = 0;
  private destruido = false;

  private readonly alRecuperarConexion = () => {
    void this.sincronizarYActualizar();
  };

  constructor(
    private readonly planesService: PlanesService
  ) {
    this.cargarClientes();

    window.addEventListener(
      'online',
      this.alRecuperarConexion
    );
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.consultaPendientesVersion++;

    window.removeEventListener(
      'online',
      this.alRecuperarConexion
    );
  }

  /* =====================================
     ALMACENAMIENTO
     ===================================== */

  private leerLista<T>(clave: string): T[] {
    const datos = JSON.parse(
      localStorage.getItem(clave) ?? '[]'
    );

    if (!Array.isArray(datos)) {
      throw new Error(
        'Los datos guardados no son una lista.'
      );
    }

    return datos as T[];
  }

  private normalizar(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('es')
      .trim()
      .replace(/\s+/g, ' ');
  }

  /* =====================================
     CLIENTES
     ===================================== */

  cargarClientes(): void {
    try {
      const desvinculados = new Set(
        this.leerLista<string>(
          this.claveDesvinculados
        )
      );

      this.vinculados = this.clientes.filter(
        cliente => !desvinculados.has(cliente.id)
      );
    } catch {
      this.vinculados = [];
      this.aviso =
        'No se pudo cargar la lista de clientes.';
    }
  }

  get clientesFiltrados(): Cliente[] {
    const palabras = this.normalizar(this.busqueda)
      .split(' ')
      .filter(Boolean);

    return this.vinculados.filter(cliente => {
      const nombre = this.normalizar(cliente.nombre);

      return palabras.every(
        palabra => nombre.includes(palabra)
      );
    });
  }

  private obtenerPlanes(id: string): Plan[] {
    return this.leerLista<Plan>(
      `fitregister-planes-${id}`
    );
  }

  private obtenerRutinasAnteriores(
    id: string
  ): Rutina[] {

    const dato = JSON.parse(
      localStorage.getItem(
        `fitregister-rutina-${id}`
      ) ?? 'null'
    );

    const guardadas: Rutina[] =
      dato === null
        ? []
        : Array.isArray(dato)
          ? dato
          : [dato];

    if (id === 'ana') {
      return [
        {
          nombre: 'Pierna A',
          ejercicios: [
            {
              nombre: 'Sentadilla',
              series: 3,
              repeticiones: 12
            },
            {
              nombre: 'Prensa de piernas',
              series: 3,
              repeticiones: 10
            },
            {
              nombre: 'Peso muerto rumano',
              series: 3,
              repeticiones: 12
            }
          ]
        },
        ...guardadas
      ];
    }

    return guardadas;
  }

  private asignaciones(cliente: Cliente): {
    planes: Plan[];
    anteriores: Rutina[];
  } {

    let planes: Plan[] = [];
    let anteriores: Rutina[] = [];

    try {
      planes = this.obtenerPlanes(cliente.id);
    } catch {
      this.aviso =
        'No se pudieron leer algunos planes semanales.';
    }

    try {
      anteriores = this.obtenerRutinasAnteriores(
        cliente.id
      );
    } catch {
      this.aviso =
        'No se pudieron leer algunas rutinas anteriores.';
    }

    return { planes, anteriores };
  }

  estadoCliente(cliente: Cliente): string {
    const { planes, anteriores } =
      this.asignaciones(cliente);

    if (planes.length) {
      return `${planes.length} ${
        planes.length === 1
          ? 'plan asignado'
          : 'planes asignados'
      }`;
    }

    if (anteriores.length) {
      return `${anteriores.length} ${
        anteriores.length === 1
          ? 'rutina individual'
          : 'rutinas individuales'
      }`;
    }

    return 'Sin rutinas asignadas';
  }

  /* =====================================
     PERFIL
     ===================================== */

  valorPerfil(
    valor: string | undefined
  ): string {
    return valor?.trim() ||
      'Información no proporcionada';
  }

  abrirPerfil(cliente: Cliente): void {
    this.clienteActivo = cliente;
    this.perfilActivo =
      this.perfiles[cliente.id] ?? null;

    this.dialogPerfil.nativeElement.showModal();
  }

  cerrarPerfil(): void {
    this.dialogPerfil.nativeElement.close();
  }

  /* =====================================
     SINCRONIZACIÓN DE PLANES
     ===================================== */

  async actualizarPlanesPendientes(): Promise<void> {
    const cliente = this.clienteActivo;

    if (!cliente || this.destruido) {
      return;
    }

    const version = ++this.consultaPendientesVersion;
    this.consultandoPendientes = true;

    try {
      const ids =
        await this.planesService.planesPendientes(
          cliente.id
        );

      // Evita aplicar resultados de otro cliente.
      if (
        this.destruido ||
        version !== this.consultaPendientesVersion ||
        this.clienteActivo?.id !== cliente.id
      ) {
        return;
      }

      this.planesPendientesIds = new Set(ids);

    } catch (error) {
      console.error(
        'No se pudo consultar la sincronización de planes:',
        error
      );

      if (
        !this.destruido &&
        version === this.consultaPendientesVersion
      ) {
        this.avisoPanel =
          'No se pudo comprobar el estado de sincronización.';

        this.planesPendientesIds = new Set();
      }

    } finally {
      if (
        !this.destruido &&
        version === this.consultaPendientesVersion
      ) {
        this.consultandoPendientes = false;
      }
    }
  }

  planPendiente(plan: Plan): boolean {
    return this.planesPendientesIds.has(plan.id);
  }

  private async sincronizarYActualizar(): Promise<void> {
    if (!this.clienteActivo) {
      return;
    }

    // Esta llamada procesa únicamente el receptor
    // simulado de IndexedDB, no la API real.
    await this.planesService.sincronizarDemo();

    await this.actualizarPlanesPendientes();
  }

  /* =====================================
     VER RUTINAS
     ===================================== */

  abrirRutinas(cliente: Cliente): void {
    this.clienteActivo = cliente;
    this.avisoPanel = '';

    this.planesPendientesIds = new Set();

    const { planes, anteriores } =
      this.asignaciones(cliente);

    this.planesActivos = planes;
    this.rutinasAnteriores = anteriores;

    this.dialogRutinas.nativeElement.showModal();

    void this.actualizarPlanesPendientes();
  }

  cerrarRutinas(): void {
    this.consultaPendientesVersion++;
    this.dialogRutinas.nativeElement.close();

    this.planesPendientesIds = new Set();
    this.consultandoPendientes = false;
  }

  obtenerDia(
    plan: Plan,
    id: string
  ): DiaPlan | undefined {
    return plan.dias?.find(
      dia => dia.dia === id
    );
  }

  ejerciciosRutina(rutina: Rutina): Ejercicio[] {
    if (Array.isArray(rutina.ejercicios)) {
      return rutina.ejercicios;
    }

    if (rutina.ejercicio) {
      return [
        {
          nombre: rutina.ejercicio,
          series: rutina.series ?? 0,
          repeticiones: rutina.repeticiones ?? 0
        }
      ];
    }

    return [];
  }

  destinoRutinas(
    cliente: Cliente,
    modificar = false
  ): string {

    const url = '/rutinas?cliente=' +
      encodeURIComponent(cliente.id);

    return modificar
      ? url + '#planes-guardados'
      : url;
  }

  /* =====================================
     INVITACIONES
     ===================================== */

  generarCodigo(): void {
    const numero = Math.floor(
      100000 + Math.random() * 900000
    );

    this.codigoInvitacion =
      `FIT-${numero}`;
  }

  /* =====================================
     ELIMINAR PLAN / DESVINCULAR
     ===================================== */

  pedirEliminar(
    cliente: Cliente,
    plan?: Plan
  ): void {

    this.pendienteEliminar = {
      cliente,
      plan
    };

    this.dialogConfirmar.nativeElement.showModal();
  }

  get textoConfirmacion(): string {
    if (!this.pendienteEliminar) {
      return '';
    }

    const { cliente, plan } =
      this.pendienteEliminar;

    return plan
      ? `¿Quieres eliminar «${plan.nombre}» de los planes asignados a ${cliente.nombre}?`
      : `¿Quieres quitar a ${cliente.nombre} de tu lista de clientes? Sus planes y registros quedarán guardados.`;
  }

  cancelarEliminar(): void {
    this.pendienteEliminar = null;
    this.dialogConfirmar.nativeElement.close();
  }

  async confirmarEliminar(): Promise<void> {
    if (!this.pendienteEliminar) {
      return;
    }

    const { cliente, plan } =
      this.pendienteEliminar;

    try {
      if (plan) {

        // No eliminamos directamente de localStorage.
        // El servicio también registra la modificación
        // en la cola de sincronización.
        await this.planesService.eliminar(
          cliente.id,
          plan.id
        );

        const { planes, anteriores } =
          this.asignaciones(cliente);

        this.planesActivos = planes;
        this.rutinasAnteriores = anteriores;

        this.avisoPanel =
          `Se eliminó «${plan.nombre}» de los planes asignados.`;

        await this.actualizarPlanesPendientes();

      } else {
        const desvinculados = new Set(
          this.leerLista<string>(
            this.claveDesvinculados
          )
        );

        desvinculados.add(cliente.id);

        localStorage.setItem(
          this.claveDesvinculados,
          JSON.stringify([...desvinculados])
        );

        this.cargarClientes();

        this.aviso =
          `${cliente.nombre} ya no aparece en tu lista de clientes.`;
      }

      this.dialogConfirmar.nativeElement.close();
      this.pendienteEliminar = null;

    } catch (error) {
      console.error(
        'No se pudo completar la eliminación:',
        error
      );

      if (plan) {
        this.avisoPanel =
          error instanceof Error
            ? error.message
            : 'No se pudo eliminar el plan.';
      } else {
        this.aviso =
          'No se pudo eliminar al cliente. Vuelve a intentarlo.';
      }

      this.dialogConfirmar.nativeElement.close();
      this.pendienteEliminar = null;
    }
  }
}
