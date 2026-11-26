import {
  Component,
  HostListener,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import {
  ClientePlan,
  PlanSemanal
} from '../rutinas/models/plan.model';

import { PlanesService } from '../rutinas/services/planes.service';

type EstadoSeguimiento =
  | 'completada'
  | 'no-entreno'
  | 'pendiente'
  | 'sin-registro'
  | 'descanso'
  | 'sin-programacion';

interface DiaSeguimiento {
  clave: string;
  fecha: Date;
  fechaTexto: string;
  rutinaNombre: string | null;
  estado: EstadoSeguimiento;
  estadoTexto: string;
  esHoy: boolean;
}

interface RegistroCumplimiento {
  clienteId: string;
  planId: string;
  fecha: string;
  estado: string;
}

interface PeriodoPlan {
  inicio: string;
  fin: string;
  anterior: boolean;
}

@Component({
  selector: 'app-seguimiento',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './seguimiento.component.html',
  styleUrls: ['./seguimiento.component.css']
})
export class SeguimientoComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly planesService = inject(PlanesService);

  readonly clientes: ClientePlan[] = [
    {
      id: 'diego',
      nombre: 'Diego Ruiz'
    },
    {
      id: 'ana',
      nombre: 'Ana Torres'
    },
    {
      id: 'sofia',
      nombre: 'Sofía Vega'
    }
  ];

  readonly diasSemana = [
    'lunes',
    'martes',
    'miercoles',
    'jueves',
    'viernes',
    'sabado',
    'domingo'
  ];

  readonly nombresEstados: Record<
    EstadoSeguimiento,
    string
  > = {
    completada: 'Completada',
    'no-entreno': 'No entrenó',
    pendiente: 'Pendiente',
    'sin-registro': 'Sin registro',
    descanso: 'Descanso',
    'sin-programacion': 'Sin programación'
  };

  private readonly claveDesvinculados =
    'fitregister-clientes-desvinculados-demo';

  private readonly claveCumplimiento =
    'fitregister-cumplimiento-demo';

  private readonly formatoDia =
    new Intl.DateTimeFormat('es-MX', {
      weekday: 'short',
      day: 'numeric'
    });

  private readonly formatoFecha =
    new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

  // ESTADO DEL COMPONENTE

  busquedaCliente = '';

  clienteSeleccionado: ClientePlan | null = null;

  resultadosVisibles = false;

  planes: PlanSemanal[] = [];

  planIdSeleccionado = '';

  aviso =
    'Busca y selecciona un cliente para ver su calendario.';

  vistaVisible = false;

  inicioSemana = this.lunesDe(new Date());

  diasCalendario: DiaSeguimiento[] = [];

  rangoSemana = '';

  periodoTexto = '';

  porcentajeSemana = '—';

  resumenSemana = '';

  cargandoPlanes = false;

  private versionCarga = 0;

  // INICIALIZACIÓN

  async ngOnInit(): Promise<void> {

    const clienteId =
      this.route.snapshot.queryParamMap.get('cliente');

    if (!clienteId) {
      return;
    }

    const inicial = this.clientes.find(
      cliente => cliente.id === clienteId
    );

    if (inicial) {
      await this.seleccionarCliente(inicial);
    } else {
      this.limpiarSeleccion(
        'El cliente del enlace no está disponible.'
      );
    }
  }

  // UTILIDADES DE FECHAS

  private sumarDias(
    fecha: Date,
    cantidad: number
  ): Date {

    const resultado = new Date(fecha);

    resultado.setHours(12, 0, 0, 0);

    resultado.setDate(
      resultado.getDate() + cantidad
    );

    return resultado;
  }

  private lunesDe(fecha: Date): Date {

    return this.sumarDias(
      fecha,
      -((fecha.getDay() + 6) % 7)
    );
  }

  private claveFecha(fecha: Date): string {

    const anio = fecha.getFullYear();

    const mes = String(
      fecha.getMonth() + 1
    ).padStart(2, '0');

    const dia = String(
      fecha.getDate()
    ).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  private fechaValida(valor: string): boolean {

    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      return false;
    }

    const [anio, mes, dia] = valor
      .split('-')
      .map(Number);

    if (anio < 1000 || anio > 9999) {
      return false;
    }

    const fecha = new Date(
      anio,
      mes - 1,
      dia,
      12
    );

    return (
      fecha.getFullYear() === anio &&
      fecha.getMonth() === mes - 1 &&
      fecha.getDate() === dia
    );
  }

  private fechaLocal(valor: string): Date {

    const [anio, mes, dia] = valor
      .split('-')
      .map(Number);

    return new Date(
      anio,
      mes - 1,
      dia,
      12
    );
  }

  private normalizar(texto: string): string {

    return texto
      .trim()
      .toLocaleLowerCase('es-MX')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

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

  // CLIENTES VINCULADOS

  get clientesVinculados(): ClientePlan[] {

    const datos = this.leerLista<string>(
      this.claveDesvinculados
    );

    if (datos.some(id => typeof id !== 'string')) {
      throw new Error(
        'No se pudo leer la vinculación de clientes.'
      );
    }

    const desvinculados = new Set(datos);

    return this.clientes.filter(
      cliente => !desvinculados.has(cliente.id)
    );
  }

  get resultadosClientes(): ClientePlan[] {

    if (
      !this.resultadosVisibles ||
      this.clienteSeleccionado
    ) {
      return [];
    }

    const consulta = this.normalizar(
      this.busquedaCliente
    );

    if (!consulta) {
      return [];
    }

    try {
      return this.clientesVinculados
        .filter(cliente =>
          this.normalizar(cliente.nombre).includes(
            consulta
          )
        )
        .slice(0, 8);
    } catch {
      return [];
    }
  }

  get mensajeResultados(): string {

    try {
      return this.clientesVinculados.length
        ? 'No hay clientes vinculados con ese nombre.'
        : 'Aún no tienes clientes vinculados.';
    } catch {
      return 'No se pudo consultar la lista de clientes vinculados.';
    }
  }

  cambiarBusquedaCliente(): void {

    this.versionCarga++;

    this.clienteSeleccionado = null;

    this.planes = [];

    this.planIdSeleccionado = '';

    this.vistaVisible = false;

    this.diasCalendario = [];

    this.periodoTexto = '';

    this.resultadosVisibles =
      Boolean(this.busquedaCliente.trim());

    this.aviso =
      'Busca y selecciona un cliente para ver su calendario.';
  }

  mostrarResultados(): void {

    if (
      !this.clienteSeleccionado &&
      this.busquedaCliente.trim()
    ) {
      this.resultadosVisibles = true;
    }
  }

  cerrarResultados(): void {
    this.resultadosVisibles = false;
  }

  manejarTeclaBuscador(
    evento: KeyboardEvent
  ): void {

    if (evento.key === 'Escape') {
      this.cerrarResultados();
    }
  }

  @HostListener('document:click', ['$event'])
  alHacerClickDocumento(
    evento: MouseEvent
  ): void {

    const objetivo = evento.target;

    if (
      objetivo instanceof Element &&
      !objetivo.closest('.buscador-cliente')
    ) {
      this.cerrarResultados();
    }
  }

  private limpiarSeleccion(texto: string): void {

    this.versionCarga++;

    this.clienteSeleccionado = null;

    this.busquedaCliente = '';

    this.planes = [];

    this.planIdSeleccionado = '';

    this.vistaVisible = false;

    this.diasCalendario = [];

    this.periodoTexto = '';

    this.cerrarResultados();

    this.aviso = texto;
  }

  private validarClienteActual(): boolean {

    if (!this.clienteSeleccionado) {
      return false;
    }

    try {
      const disponible = this.clientesVinculados.some(
        cliente =>
          cliente.id === this.clienteSeleccionado?.id
      );

      if (disponible) {
        return true;
      }

      const nombre = this.clienteSeleccionado.nombre;

      this.limpiarSeleccion(
        `${nombre} ya no está vinculado. Selecciona otro cliente.`
      );

    } catch {

      this.limpiarSeleccion(
        'No se pudo comprobar la vinculación del cliente.'
      );
    }

    return false;
  }

  private revisarVinculacion(): void {

    if (this.clienteSeleccionado) {
      this.validarClienteActual();
    }
  }

  async seleccionarCliente(
    seleccionado: ClientePlan
  ): Promise<void> {

    let disponible: ClientePlan | undefined;

    try {
      disponible = this.clientesVinculados.find(
        cliente => cliente.id === seleccionado.id
      );

    } catch {
      this.limpiarSeleccion(
        'No se pudo comprobar la vinculación del cliente.'
      );

      return;
    }

    if (!disponible) {
      this.limpiarSeleccion(
        'Ese cliente ya no está vinculado.'
      );

      return;
    }

    this.clienteSeleccionado = disponible;

    this.busquedaCliente = disponible.nombre;

    this.cerrarResultados();

    await this.cargarPlanes(true);
  }

  // PLANES SEMANALES

  get planSeleccionado(): PlanSemanal | null {

    return this.planes.find(
      plan =>
        String(plan.id) === this.planIdSeleccionado
    ) ?? null;
  }

  private obtenerPeriodo(
    plan: PlanSemanal
  ): PeriodoPlan {

    const tieneInicio = Boolean(plan.fechaInicio);

    const tieneFin = Boolean(plan.fechaFin);

    if (tieneInicio || tieneFin) {

      if (
        !this.fechaValida(plan.fechaInicio) ||
        !this.fechaValida(plan.fechaFin) ||
        plan.fechaInicio > plan.fechaFin
      ) {
        throw new Error(
          'Este plan tiene un periodo inválido. Corrígelo en Rutinas.'
        );
      }

      return {
        inicio: plan.fechaInicio,
        fin: plan.fechaFin,
        anterior: false
      };
    }

    const creacion = plan.creadoEn
      ? new Date(plan.creadoEn)
      : null;

    return {
      inicio:
        creacion &&
        !Number.isNaN(creacion.getTime())
          ? this.claveFecha(creacion)
          : '',
      fin: '',
      anterior: true
    };
  }

  private ubicarSemanaDelPlan(): void {

    const plan = this.planSeleccionado;

    if (!plan) {
      return;
    }

    try {

      const periodo = this.obtenerPeriodo(plan);

      const hoy = this.claveFecha(new Date());

      let referencia = hoy;

      if (
        periodo.inicio &&
        hoy < periodo.inicio
      ) {
        referencia = periodo.inicio;

      } else if (
        periodo.fin &&
        hoy > periodo.fin
      ) {
        referencia = periodo.fin;
      }

      this.inicioSemana = this.lunesDe(
        this.fechaLocal(referencia)
      );

    } catch {
      this.inicioSemana = this.lunesDe(
        new Date()
      );
    }
  }

  async cargarPlanes(
    reubicar = false
  ): Promise<void> {

    const cliente = this.clienteSeleccionado;

    const anterior = this.planIdSeleccionado;

    const version = ++this.versionCarga;

    this.planes = [];

    this.vistaVisible = false;

    this.cargandoPlanes = true;

    if (!cliente) {
      this.planIdSeleccionado = '';

      this.aviso =
        'Busca y selecciona un cliente para ver su calendario.';

      this.cargandoPlanes = false;
      return;
    }

    if (!this.validarClienteActual()) {
      this.cargandoPlanes = false;
      return;
    }

    try {

      // Reutiliza los planes guardados por Rutinas.
      const planes = await this.planesService.listar(
        cliente.id
      );

      if (
        version !== this.versionCarga ||
        this.clienteSeleccionado?.id !== cliente.id
      ) {
        return;
      }

      this.planes = planes;

      if (!planes.length) {
        this.planIdSeleccionado = '';

        this.aviso =
          `${cliente.nombre} todavía no tiene un plan semanal asignado.`;

        return;
      }

      const conservaPlan = planes.some(
        plan => String(plan.id) === anterior
      );

      this.planIdSeleccionado = conservaPlan
        ? anterior
        : String(planes[0].id);

      if (reubicar || !conservaPlan) {
        this.ubicarSemanaDelPlan();
      }

      this.mostrarSemana();

    } catch {

      if (version === this.versionCarga) {
        this.aviso =
          'No se pudieron leer los planes guardados.';
      }

    } finally {

      if (version === this.versionCarga) {
        this.cargandoPlanes = false;
      }
    }
  }

  cambiarPlan(): void {
    this.ubicarSemanaDelPlan();
    this.mostrarSemana();
  }

  // CALENDARIO DE CUMPLIMIENTO

  mostrarSemana(): void {

    if (!this.validarClienteActual()) {
      return;
    }

    const cliente = this.clienteSeleccionado;

    const plan = this.planSeleccionado;

    if (!cliente || !plan) {
      this.vistaVisible = false;
      return;
    }

    let registros: RegistroCumplimiento[];

    let periodo: PeriodoPlan;

    try {

      registros =
        this.leerLista<RegistroCumplimiento>(
          this.claveCumplimiento
        );

      periodo = this.obtenerPeriodo(plan);

      if (!Array.isArray(plan.dias)) {
        throw new Error(
          'Este plan no tiene días válidos. Revísalo en Rutinas.'
        );
      }

    } catch (error) {

      this.vistaVisible = false;

      this.aviso = error instanceof Error
        ? error.message
        : 'No se pudo mostrar el calendario.';

      return;
    }

    const fechaHoy = this.claveFecha(new Date());

    const domingo = this.sumarDias(
      this.inicioSemana,
      6
    );

    const tarjetas: DiaSeguimiento[] = [];

    let programadas = 0;

    let completadas = 0;

    for (
      const [indice, dia] of this.diasSemana.entries()
    ) {

      const fecha = this.sumarDias(
        this.inicioSemana,
        indice
      );

      const clave = this.claveFecha(fecha);

      const vigente =
        (!periodo.inicio ||
          clave >= periodo.inicio) &&
        (!periodo.fin ||
          clave <= periodo.fin);

      const rutina = vigente
        ? plan.dias.find(
            item => item.dia === dia
          )
        : null;

      let estado: EstadoSeguimiento = vigente
        ? 'descanso'
        : 'sin-programacion';

      if (rutina) {

        programadas++;

        // Usamos una copia invertida y find()
        // para obtener el último registro válido.

        const registro: RegistroCumplimiento | undefined =
          [...registros]
            .reverse()
            .find(
              (item: RegistroCumplimiento) =>
                item != null &&
                item.clienteId === cliente.id &&
                item.planId === plan.id &&
                item.fecha === clave &&
                (
                  item.estado === 'completada' ||
                  item.estado === 'no-entreno'
                )
            );

        estado = clave < fechaHoy
          ? 'sin-registro'
          : 'pendiente';

        if (clave <= fechaHoy && registro) {
          estado = registro.estado as EstadoSeguimiento;
        }

        if (estado === 'completada') {
          completadas++;
        }
      }

      tarjetas.push({
        clave,
        fecha,
        fechaTexto: this.formatoDia.format(fecha),
        rutinaNombre: rutina?.nombre ?? null,
        estado,
        estadoTexto: this.nombresEstados[estado],
        esHoy: clave === fechaHoy
      });
    }

    this.diasCalendario = tarjetas;

    this.aviso = '';

    if (periodo.anterior) {
      this.periodoTexto =
        'Plan anterior sin periodo definido. Se muestra desde su creación; asigna sus fechas en Rutinas.';
    } else {
      this.periodoTexto =
        `Periodo del plan: del ${
          this.formatoFecha.format(
            this.fechaLocal(periodo.inicio)
          )
        } al ${
          this.formatoFecha.format(
            this.fechaLocal(periodo.fin)
          )
        }.`;
    }

    this.rangoSemana = this.formatoFecha.formatRange(
      this.inicioSemana,
      domingo
    );

    this.porcentajeSemana = programadas
      ? `${Math.round(
          completadas / programadas * 100
        )}%`
      : '—';

    this.resumenSemana = programadas
      ? `${completadas} de ${programadas} sesiones programadas completadas.`
      : 'Esta semana no tiene sesiones programadas para este plan.';

    this.vistaVisible = true;
  }

  // NAVEGACIÓN ENTRE SEMANAS

  semanaAnterior(): void {

    this.inicioSemana = this.sumarDias(
      this.inicioSemana,
      -7
    );

    this.mostrarSemana();
  }

  semanaSiguiente(): void {

    this.inicioSemana = this.sumarDias(
      this.inicioSemana,
      7
    );

    this.mostrarSemana();
  }

  semanaActual(): void {

    this.inicioSemana = this.lunesDe(
      new Date()
    );

    this.mostrarSemana();
  }

  // ACTUALIZACIÓN DE DATOS

  @HostListener('window:pageshow')
  alMostrarPagina(): void {

    if (this.clienteSeleccionado) {
      void this.cargarPlanes();
    }
  }

  @HostListener('window:focus')
  alRecuperarFoco(): void {

    this.revisarVinculacion();

    if (this.clienteSeleccionado) {
      void this.cargarPlanes();
    }
  }

  @HostListener('document:visibilitychange')
  alCambiarVisibilidad(): void {

    if (
      document.visibilityState === 'visible'
    ) {
      this.revisarVinculacion();

      if (this.clienteSeleccionado) {
        void this.cargarPlanes();
      }
    }
  }

  @HostListener('window:storage', ['$event'])
  alCambiarAlmacenamiento(
    evento: StorageEvent
  ): void {

    if (
      evento.key === null ||
      evento.key === this.claveDesvinculados
    ) {
      this.revisarVinculacion();
    }

    const cliente = this.clienteSeleccionado;

    if (!cliente) {
      return;
    }

    if (
      evento.key === null ||
      evento.key === `fitregister-planes-${cliente.id}` ||
      evento.key === this.claveCumplimiento
    ) {
      void this.cargarPlanes();
    }
  }
}
