import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  RouterLink,
  ActivatedRoute,
  ParamMap
} from '@angular/router';

import { Subscription } from 'rxjs';

import {
  BorradorPlan,
  ClientePlan,
  DiaSemana,
  DIAS_SEMANA,
  EjercicioAsignado,
  EjercicioCatalogo,
  PlanSemanal
} from './models/plan.model';

import {
  EjerciciosService,
  DatosEjercicio
} from './services/ejercicios.service';

import { PlanesService } from './services/planes.service';
import { BorradoresService } from './services/borradores.service';

type ContenidoDia = {
  nombre: string;
  ejercicios: EjercicioAsignado[];
};

@Component({
  selector: 'app-rutinas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './rutinas.component.html',
  styleUrls: ['./rutinas.component.css']
})
export class RutinasComponent implements OnInit, OnDestroy {

  @ViewChild('dialogoEjercicio')
  dialogoEjercicio?: ElementRef<HTMLDialogElement>;

  readonly ejerciciosService = inject(EjerciciosService);
  readonly planesService = inject(PlanesService);
  readonly borradoresService = inject(BorradoresService);

  private readonly route = inject(ActivatedRoute);

  readonly semana = DIAS_SEMANA;

  readonly clientes: ClientePlan[] = [
    { id: 'diego', nombre: 'Diego Ruiz' },
    { id: 'ana', nombre: 'Ana Torres' },
    { id: 'sofia', nombre: 'Sofía Vega' }
  ];

  readonly gruposMusculares = [
    'Glúteos',
    'Piernas',
    'Espalda',
    'Pecho',
    'Hombros',
    'Brazos',
    'Abdomen',
    'Cuerpo completo',
    'Otro'
  ];

  private readonly claveDesvinculados =
    'fitregister-clientes-desvinculados-demo';

  // ESTADO DEL PLAN

  busquedaCliente = '';
  clienteSeleccionado: ClientePlan | null = null;

  nombrePlan = '';
  fechaInicio = '';
  fechaFin = '';

  diasSeleccionados: DiaSemana[] = [];
  diaActivo: DiaSemana | '' = '';

  rutinasPorDia: Record<DiaSemana, ContenidoDia> =
    this.crearRutinasVacias();

  busquedaEjercicio = '';
  ejercicioSeleccionado: EjercicioCatalogo | null = null;

  series: number | null = null;
  repeticiones: number | null = null;
  indiceEdicion: number | null = null;

  planEnEdicion: string | null = null;
  planesGuardados: PlanSemanal[] = [];

  // SINCRONIZACIÓN SIMULADA

  planesPendientesIds = new Set<string>();
  consultandoPendientes = false;
  errorSincronizacion = false;

  private versionConsultaPendientes = 0;
  private destruido = false;

  private readonly alVolverInternet = () => {
    void this.sincronizarYActualizarPlanes();
  };

  // NAVEGACIÓN DESDE NOTIFICACIONES

  private suscripcionParametros: Subscription | null = null;
  private versionNavegacion = 0;

  guardando = false;
  cargando = false;

  mensaje = '';
  mensajeError = false;

  // ADMINISTRACIÓN DEL CATÁLOGO

  editandoEjercicioId: string | null = null;
  revisionEjercicio: string | null = null;

  nombreNuevoEjercicio = '';
  grupoNuevoEjercicio = '';
  instruccionesNuevoEjercicio = '';

  imagenEjercicio: File | null = null;
  previewEjercicio = '';

  guardandoEjercicio = false;
  mensajeEjercicio = '';
  errorEjercicio = false;

  private urlPreviewTemporal: string | null = null;

  // BORRADORES

  borradorDisponible: BorradorPlan | null = null;
  mensajeBorrador = '';

  private temporizadorBorrador:
    ReturnType<typeof setTimeout> | null = null;

  private versionBorrador = 0;
  private restaurando = false;
  private firmaGuardada = '';

  // INICIALIZACIÓN

  async ngOnInit(): Promise<void> {
    window.addEventListener(
      'online',
      this.alVolverInternet
    );

    this.cargando = true;

    try {
      await this.ejerciciosService.cargarCatalogo();

      if (this.destruido) return;

      this.firmaGuardada = JSON.stringify(
        this.obtenerEstado()
      );

      this.borradorDisponible =
        await this.borradoresService.recuperar();

      if (this.destruido) return;

      // Escucha los parámetros incluso si ya
      // estamos dentro de la pantalla de Rutinas.
      this.suscripcionParametros =
        this.route.queryParamMap.subscribe(parametros => {
          const version = ++this.versionNavegacion;

          void this.abrirPlanDesdeURL(
            parametros,
            version
          ).catch(error => {
            if (
              !this.destruido &&
              version === this.versionNavegacion
            ) {
              this.avisar(
                this.textoError(
                  error,
                  'No se pudo abrir la rutina solicitada.'
                ),
                true
              );
            }
          });
        });

    } catch (error) {
      this.avisar(
        this.textoError(
          error,
          'No se pudo cargar Rutinas.'
        ),
        true
      );
    } finally {
      if (!this.destruido) {
        this.cargando = false;
      }
    }
  }

  // ABRIR PLAN DESDE NOTIFICACIONES

  private async abrirPlanDesdeURL(
    parametros: ParamMap,
    version: number
  ): Promise<void> {

    const clienteId = parametros.get('cliente');
    const planId = parametros.get('plan');

    // Entrar a Rutinas normalmente no debe
    // modificar el editor.
    if (!clienteId || this.destruido) {
      return;
    }

    const cliente = this.clientesVinculados.find(
      actual => actual.id === clienteId
    );

    if (!cliente) {
      this.avisar(
        'El cliente solicitado no está vinculado.',
        true
      );
      return;
    }

    // Si ya estamos editando ese mismo plan,
    // no recargarlo ni perder cambios.
    if (
      planId &&
      this.clienteSeleccionado?.id === clienteId &&
      this.planEnEdicion === planId
    ) {
      this.irAlFormulario();
      return;
    }

    // PROTECCIÓN DEL BORRADOR GUARDADO.
    if (this.borradorDisponible) {
      const autorizado = confirm(
        'Tienes un borrador guardado. ' +
        '¿Quieres descartarlo para abrir la rutina solicitada? ' +
        'Si cancelas, lo conservaremos.'
      );

      if (!autorizado) {
        this.avisar(
          'Se conservó tu borrador. ' +
          'Puedes recuperarlo desde Rutinas.'
        );
        return;
      }

      await this.descartarBorrador();

      if (
        this.destruido ||
        version !== this.versionNavegacion ||
        this.borradorDisponible
      ) {
        return;
      }
    }

    // Seleccionar el cliente de la solicitud.
    if (this.clienteSeleccionado?.id !== cliente.id) {
      await this.seleccionarCliente(cliente);

      if (
        this.destruido ||
        version !== this.versionNavegacion ||
        this.clienteSeleccionado?.id !== cliente.id
      ) {
        return;
      }

    } else if (this.planesGuardados.length === 0) {
      await this.cargarPlanes();

      if (
        this.destruido ||
        version !== this.versionNavegacion
      ) {
        return;
      }
    }

    // Si la URL solo indica un cliente,
    // mostrarlo seleccionado sin abrir plan.
    if (!planId) {
      return;
    }

    // Buscar el plan exacto de la notificación.
    const plan = this.planesGuardados.find(
      actual => actual.id === planId
    );

    if (!plan) {
      this.avisar(
        'No se encontró el plan solicitado. ' +
        'Es posible que haya sido eliminado.',
        true
      );
      return;
    }

    // Reutilizar la edición existente.
    await this.abrirPlan(plan);

    // Desplazarse hasta el editor cuando
    // efectivamente se abrió el plan.
    if (
      !this.destruido &&
      version === this.versionNavegacion &&
      this.planEnEdicion === planId
    ) {
      this.irAlFormulario();
    }
  }

  private irAlFormulario(): void {
    document.getElementById('form-plan')
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
  }

  // LIMPIEZA DEL COMPONENTE

  ngOnDestroy(): void {
    this.destruido = true;

    this.versionConsultaPendientes++;
    this.versionNavegacion++;

    this.suscripcionParametros?.unsubscribe();
    this.suscripcionParametros = null;

    window.removeEventListener(
      'online',
      this.alVolverInternet
    );

    if (this.temporizadorBorrador) {
      clearTimeout(this.temporizadorBorrador);
      this.temporizadorBorrador = null;
    }

    this.liberarPreview();

    if (this.hayCambios()) {
      void this.borradoresService.guardar(
        this.obtenerEstado()
      ).catch(error => {
        console.error(
          'No se pudo conservar el borrador:',
          error
        );
      });
    }
  }

  // UTILIDADES

  private crearRutinasVacias():
    Record<DiaSemana, ContenidoDia> {

    return Object.fromEntries(
      DIAS_SEMANA.map(dia => [
        dia.id,
        { nombre: '', ejercicios: [] }
      ])
    ) as unknown as Record<DiaSemana, ContenidoDia>;
  }

  private normalizar(texto: string): string {
    return texto
      .trim()
      .toLocaleLowerCase('es-MX')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private textoError(
    error: unknown,
    alternativa: string
  ): string {
    return error instanceof Error
      ? error.message
      : alternativa;
  }

  private avisar(
    texto: string,
    error = false
  ): void {
    this.mensaje = texto;
    this.mensajeError = error;
  }

  private limpiarAviso(): void {
    this.mensaje = '';
    this.mensajeError = false;
  }

  // CLIENTES

  get clientesVinculados(): ClientePlan[] {
    try {
      const datos = JSON.parse(
        localStorage.getItem(
          this.claveDesvinculados
        ) ?? '[]'
      );

      if (!Array.isArray(datos)) {
        return [];
      }

      const desvinculados = new Set(datos);

      return this.clientes.filter(
        cliente => !desvinculados.has(cliente.id)
      );
    } catch {
      return [];
    }
  }

  get resultadosClientes(): ClientePlan[] {
    const consulta = this.normalizar(
      this.busquedaCliente
    );

    if (!consulta || this.clienteSeleccionado) {
      return [];
    }

    return this.clientesVinculados.filter(
      cliente => this.normalizar(cliente.nombre)
        .includes(consulta)
    );
  }

  cambiarBusquedaCliente(): void {
    if (
      this.clienteSeleccionado &&
      this.busquedaCliente !==
        this.clienteSeleccionado.nombre
    ) {
      this.clienteSeleccionado = null;
      this.planesGuardados = [];
      this.planEnEdicion = null;
    }

    this.limpiarAviso();
    this.registrarCambio();
  }

  async seleccionarCliente(
    cliente: ClientePlan
  ): Promise<void> {

    this.limpiarAviso();

    if (!this.clientesVinculados.some(
      actual => actual.id === cliente.id
    )) {
      this.avisar(
        'Este cliente ya no está vinculado.',
        true
      );
      return;
    }

    if (
      this.clienteSeleccionado?.id !== cliente.id &&
      this.hayCambios() &&
      !confirm(
        'Tienes cambios sin guardar. ' +
        '¿Quieres cambiar de cliente?'
      )
    ) {
      return;
    }

    if (this.clienteSeleccionado?.id !== cliente.id) {
      this.reiniciarFormulario();
    }

    this.clienteSeleccionado = cliente;
    this.busquedaCliente = cliente.nombre;

    try {
      await this.cargarPlanes();
      await this.marcarLimpio();
    } catch (error) {
      this.avisar(
        this.textoError(
          error,
          'No se pudieron consultar los planes.'
        ),
        true
      );
    }
  }

  // PLANES GUARDADOS

  async cargarPlanes(): Promise<void> {
    const clienteId = this.clienteSeleccionado?.id;

    if (!clienteId) {
      this.versionConsultaPendientes++;
      this.planesGuardados = [];
      this.planesPendientesIds = new Set();
      this.consultandoPendientes = false;
      this.errorSincronizacion = false;
      return;
    }

    const planes = await this.planesService.listar(
      clienteId
    );

    if (
      this.destruido ||
      this.clienteSeleccionado?.id !== clienteId
    ) {
      return;
    }

    this.planesGuardados = planes;
    await this.actualizarPlanesPendientes();
  }

  async actualizarPlanesPendientes(): Promise<void> {
    const clienteId = this.clienteSeleccionado?.id;

    if (!clienteId || this.destruido) return;

    const version = ++this.versionConsultaPendientes;

    this.consultandoPendientes = true;
    this.errorSincronizacion = false;

    try {
      const ids = await this.planesService.planesPendientes(
        clienteId
      );

      if (
        this.destruido ||
        version !== this.versionConsultaPendientes ||
        this.clienteSeleccionado?.id !== clienteId
      ) {
        return;
      }

      this.planesPendientesIds = new Set(ids);
      this.errorSincronizacion = false;

    } catch (error) {
      console.error(
        'No se pudo comprobar la sincronización:',
        error
      );

      if (
        !this.destruido &&
        version === this.versionConsultaPendientes
      ) {
        this.errorSincronizacion = true;
        this.planesPendientesIds = new Set();

        this.avisar(
          'No se pudo consultar la sincronización de los planes.',
          true
        );
      }

    } finally {
      if (
        !this.destruido &&
        version === this.versionConsultaPendientes
      ) {
        this.consultandoPendientes = false;
      }
    }
  }

  planPendiente(plan: PlanSemanal): boolean {
    return this.planesPendientesIds.has(plan.id);
  }

  private async sincronizarYActualizarPlanes():
    Promise<void> {

    // Únicamente sincronización SIMULADA
    // dentro del navegador, mediante IndexedDB.

    await this.planesService.sincronizarDemo();

    if (this.clienteSeleccionado && !this.destruido) {
      await this.actualizarPlanesPendientes();
    }
  }

  // DÍAS DE ENTRENAMIENTO

  get diasActivos() {
    return this.semana.filter(
      dia => this.diasSeleccionados.includes(dia.id)
    );
  }

  get diasDescanso() {
    return this.semana.filter(
      dia => !this.diasSeleccionados.includes(dia.id)
    );
  }

  get resumenDias(): string {
    if (!this.diasSeleccionados.length) {
      return 'Selecciona los días de entrenamiento.';
    }

    if (!this.diasDescanso.length) {
      return '7 días de entrenamiento.';
    }

    return (
      `${this.diasSeleccionados.length} de entrenamiento. ` +
      `Descanso: ${this.diasDescanso
        .map(dia => dia.nombre)
        .join(', ')}.`
    );
  }

  diaMarcado(id: DiaSemana): boolean {
    return this.diasSeleccionados.includes(id);
  }

  cambiarDia(
    id: DiaSemana,
    marcado: boolean
  ): void {

    if (marcado) {
      if (!this.diasSeleccionados.includes(id)) {
        this.diasSeleccionados.push(id);
      }
    } else {
      this.diasSeleccionados =
        this.diasSeleccionados.filter(
          dia => dia !== id
        );
    }

    this.diasSeleccionados = this.semana
      .filter(dia =>
        this.diasSeleccionados.includes(dia.id)
      )
      .map(dia => dia.id);

    if (
      !this.diaActivo ||
      !this.diasSeleccionados.includes(this.diaActivo)
    ) {
      this.diaActivo =
        this.diasSeleccionados[0] ?? '';
    }

    this.limpiarEjercicio();
    this.registrarCambio();
  }

  seleccionarDia(id: DiaSemana): void {
    if (!this.diasSeleccionados.includes(id)) return;

    this.diaActivo = id;
    this.limpiarEjercicio();
    this.registrarCambio();
  }

  get rutinaActual(): ContenidoDia | null {
    return this.diaActivo
      ? this.rutinasPorDia[this.diaActivo]
      : null;
  }

  cambiarNombreDia(nombre: string): void {
    if (!this.diaActivo) return;

    this.rutinasPorDia[this.diaActivo].nombre = nombre;
    this.registrarCambio();
  }

  // FECHAS Y PERIODO

  private fechaValida(valor: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      return false;
    }

    const [anio, mes, dia] =
      valor.split('-').map(Number);

    const fecha = new Date(anio, mes - 1, dia, 12);

    return (
      anio >= 1000 &&
      anio <= 9999 &&
      fecha.getFullYear() === anio &&
      fecha.getMonth() === mes - 1 &&
      fecha.getDate() === dia
    );
  }

  private formatoFecha(valor: string): string {
    const [anio, mes, dia] =
      valor.split('-').map(Number);

    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(anio, mes - 1, dia, 12));
  }

  get resumenPeriodo(): string {
    if (!this.fechaInicio || !this.fechaFin) return '';

    if (
      !this.fechaValida(this.fechaInicio) ||
      !this.fechaValida(this.fechaFin) ||
      this.fechaFin < this.fechaInicio
    ) {
      return 'Revisa las fechas: el fin no puede ser anterior al inicio.';
    }

    return (
      `Del ${this.formatoFecha(this.fechaInicio)} ` +
      `al ${this.formatoFecha(this.fechaFin)}. ` +
      `Entrenamiento: ${
        this.diasActivos.length
          ? this.diasActivos.map(d => d.nombre).join(', ')
          : 'Selecciona los días de entrenamiento'
      }.`
    );
  }

  get periodoConError(): boolean {
    return Boolean(
      this.fechaInicio &&
      this.fechaFin &&
      (
        !this.fechaValida(this.fechaInicio) ||
        !this.fechaValida(this.fechaFin) ||
        this.fechaFin < this.fechaInicio
      )
    );
  }
  // EJERCICIOS ASIGNADOS

  get ejerciciosFiltrados(): EjercicioCatalogo[] {
    return this.ejerciciosService.buscar(
      this.busquedaEjercicio
    );
  }

  seleccionarEjercicio(
    ejercicio: EjercicioCatalogo,
    indice: number | null = null
  ): void {

    this.ejercicioSeleccionado = ejercicio;
    this.indiceEdicion = indice;

    const anterior = indice !== null
      ? this.rutinaActual?.ejercicios[indice]
      : null;

    this.series = anterior?.series ?? null;
    this.repeticiones = anterior?.repeticiones ?? null;

    this.registrarCambio();
  }

  limpiarEjercicio(): void {
    this.ejercicioSeleccionado = null;
    this.indiceEdicion = null;
    this.series = null;
    this.repeticiones = null;
  }

  agregarEjercicio(): void {
    if (!this.diaActivo || !this.ejercicioSeleccionado) {
      this.avisar(
        'Selecciona un día y un ejercicio.',
        true
      );
      return;
    }

    const actual = this.ejerciciosService.obtenerPorId(
      this.ejercicioSeleccionado.id
    );

    if (
      !actual ||
      (actual.archivado && this.indiceEdicion === null)
    ) {
      this.avisar(
        'Este ejercicio ya no está disponible.',
        true
      );
      return;
    }

    const series = Number(this.series);
    const repeticiones = Number(this.repeticiones);

    if (
      !Number.isSafeInteger(series) ||
      series < 1 ||
      !Number.isSafeInteger(repeticiones) ||
      repeticiones < 1
    ) {
      this.avisar(
        'Las series y repeticiones deben ser enteros mayores que cero.',
        true
      );
      return;
    }

    const lista =
      this.rutinasPorDia[this.diaActivo].ejercicios;

    const anterior = this.indiceEdicion !== null
      ? lista[this.indiceEdicion]
      : undefined;

    const ejercicio: EjercicioAsignado = {
      ejercicioId: actual.id,
      nombre: anterior?.nombre ?? actual.nombre,
      series,
      repeticiones
    };

    if (this.indiceEdicion !== null) {
      lista[this.indiceEdicion] = ejercicio;
    } else {
      lista.push(ejercicio);
    }

    this.limpiarEjercicio();
    this.registrarCambio();

    this.avisar(
      `${ejercicio.nombre} agregado o actualizado.`
    );
  }

  editarEjercicio(
    ejercicio: EjercicioAsignado,
    indice: number
  ): void {

    const ficha = this.ejerciciosService.obtenerPorId(
      ejercicio.ejercicioId
    );

    if (!ficha) {
      this.avisar(
        'No se encontró la ficha del ejercicio.',
        true
      );
      return;
    }

    this.seleccionarEjercicio(ficha, indice);
  }

  quitarEjercicio(indice: number): void {
    if (!this.diaActivo) return;

    this.rutinasPorDia[this.diaActivo]
      .ejercicios.splice(indice, 1);

    this.limpiarEjercicio();
    this.registrarCambio();
  }

  // CREAR Y EDITAR EJERCICIOS DEL CATÁLOGO

  private liberarPreview(): void {
    if (this.urlPreviewTemporal) {
      URL.revokeObjectURL(this.urlPreviewTemporal);
      this.urlPreviewTemporal = null;
    }
  }

  private limpiarFormularioEjercicio(): void {
    this.liberarPreview();

    this.editandoEjercicioId = null;
    this.revisionEjercicio = null;
    this.nombreNuevoEjercicio = '';
    this.grupoNuevoEjercicio = '';
    this.instruccionesNuevoEjercicio = '';
    this.imagenEjercicio = null;
    this.previewEjercicio = '';
    this.mensajeEjercicio = '';
    this.errorEjercicio = false;
  }

  get ejercicioPropioSeleccionado(): boolean {
    return Boolean(
      this.ejercicioSeleccionado?.propio &&
      !this.ejercicioSeleccionado?.archivado
    );
  }

  abrirNuevoEjercicio(): void {
    this.limpiarFormularioEjercicio();
    this.dialogoEjercicio?.nativeElement.showModal();
  }

  abrirEditarEjercicio(): void {
    const ejercicio = this.ejercicioSeleccionado;

    if (
      !ejercicio ||
      !ejercicio.propio ||
      ejercicio.archivado
    ) {
      this.avisar(
        'Solo puedes editar ejercicios creados por ti.',
        true
      );
      return;
    }

    this.limpiarFormularioEjercicio();

    this.editandoEjercicioId = ejercicio.id;
    this.revisionEjercicio = ejercicio.revision ?? null;
    this.nombreNuevoEjercicio = ejercicio.nombre;
    this.grupoNuevoEjercicio = ejercicio.grupoMuscular;

    this.instruccionesNuevoEjercicio =
      ejercicio.instrucciones.join('\n');

    this.previewEjercicio = ejercicio.imagen;

    this.dialogoEjercicio?.nativeElement.showModal();
  }

  cerrarFormularioEjercicio(): void {
    if (this.guardandoEjercicio) return;

    this.dialogoEjercicio?.nativeElement.close();
    this.limpiarFormularioEjercicio();
  }

  alCambiarImagen(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;

    this.mensajeEjercicio = '';
    this.errorEjercicio = false;

    this.liberarPreview();

    if (!archivo) {
      this.imagenEjercicio = null;

      this.previewEjercicio =
        this.editandoEjercicioId
          ? this.ejerciciosService.obtenerPorId(
              this.editandoEjercicioId
            )?.imagen ?? ''
          : '';

      return;
    }

    const formatos = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (
      !formatos.includes(archivo.type) ||
      archivo.size > 5 * 1024 * 1024 ||
      archivo.size === 0
    ) {
      this.imagenEjercicio = null;
      input.value = '';

      this.previewEjercicio =
        this.editandoEjercicioId
          ? this.ejerciciosService.obtenerPorId(
              this.editandoEjercicioId
            )?.imagen ?? ''
          : '';

      this.mensajeEjercicio =
        'Selecciona una imagen JPG, PNG o WebP de hasta 5 MB.';

      this.errorEjercicio = true;
      return;
    }

    this.imagenEjercicio = archivo;
    this.urlPreviewTemporal = URL.createObjectURL(archivo);
    this.previewEjercicio = this.urlPreviewTemporal;
  }

  async guardarEjercicioCatalogo(): Promise<void> {
    if (this.guardandoEjercicio) return;

    this.mensajeEjercicio = '';
    this.errorEjercicio = false;

    const instrucciones = this.instruccionesNuevoEjercicio
      .split(/\r?\n/)
      .map(linea => linea.trim())
      .filter(Boolean);

    const datos: DatosEjercicio = {
      id: this.editandoEjercicioId ?? undefined,
      revisionEsperada: this.revisionEjercicio ?? undefined,
      nombre: this.nombreNuevoEjercicio,
      grupoMuscular: this.grupoNuevoEjercicio,
      instrucciones,
      imagenBlob: this.imagenEjercicio ?? undefined
    };

    this.guardandoEjercicio = true;

    try {
      const eraEdicion =
        this.editandoEjercicioId !== null;

      const ejercicio =
        await this.ejerciciosService.guardar(datos);

      this.dialogoEjercicio?.nativeElement.close();
      this.limpiarFormularioEjercicio();

      this.ejercicioSeleccionado = ejercicio;
      this.busquedaEjercicio = ejercicio.nombre;

      this.avisar(
        eraEdicion
          ? 'Ejercicio actualizado y guardado localmente.'
          : 'Ejercicio agregado al catálogo local.'
      );

    } catch (error) {
      this.mensajeEjercicio = this.textoError(
        error,
        'No se pudo guardar el ejercicio.'
      );

      this.errorEjercicio = true;

    } finally {
      this.guardandoEjercicio = false;
    }
  }

  async archivarEjercicioCatalogo(): Promise<void> {
    const ejercicio = this.ejercicioSeleccionado;

    if (
      !ejercicio ||
      !ejercicio.propio ||
      ejercicio.archivado ||
      !ejercicio.revision
    ) {
      this.avisar(
        'Solo puedes retirar ejercicios propios.',
        true
      );
      return;
    }

    const confirmado = confirm(
      `¿Quieres retirar «${ejercicio.nombre}» del catálogo? ` +
      'Se conservará en las rutinas donde ya esté asignado.'
    );

    if (!confirmado) return;

    try {
      await this.ejerciciosService.archivar(
        ejercicio.id,
        ejercicio.revision
      );

      this.limpiarEjercicio();

      this.avisar(
        'Ejercicio retirado del catálogo. ' +
        'Sus referencias anteriores se conservan.'
      );

    } catch (error) {
      this.avisar(
        this.textoError(
          error,
          'No se pudo retirar el ejercicio.'
        ),
        true
      );
    }
  }

  // GUARDAR PLANES

  async guardarPlan(): Promise<void> {
    if (this.guardando) return;

    if (
      !this.clienteSeleccionado ||
      !this.clientesVinculados.some(
        cliente =>
          cliente.id === this.clienteSeleccionado?.id
      )
    ) {
      this.avisar(
        'Busca y selecciona un cliente vinculado.',
        true
      );
      return;
    }

    const dias = this.diasActivos.map(dia => ({
      dia: dia.id,
      nombre: this.rutinasPorDia[dia.id].nombre,
      ejercicios: structuredClone(
        this.rutinasPorDia[dia.id].ejercicios
      )
    }));

    this.guardando = true;

    try {
      const plan = await this.planesService.guardar(
        this.clienteSeleccionado.id,
        {
          id: this.planEnEdicion ?? undefined,
          nombre: this.nombrePlan,
          fechaInicio: this.fechaInicio,
          fechaFin: this.fechaFin,
          dias
        }
      );

      this.planEnEdicion = plan.id;

      await this.cargarPlanes();
      await this.marcarLimpio();

      this.avisar(
        'Plan guardado localmente. ' +
        'Todavía no está sincronizado con la API.'
      );

    } catch (error) {
      this.avisar(
        this.textoError(
          error,
          'No se pudo guardar el plan.'
        ),
        true
      );

    } finally {
      this.guardando = false;
    }
  }

  // ABRIR PLAN EXISTENTE

  async abrirPlan(plan: PlanSemanal): Promise<void> {
    if (
      this.hayCambios() &&
      !confirm(
        'Tienes cambios sin guardar. ' +
        '¿Quieres abrir otro plan?'
      )
    ) {
      return;
    }

    this.reiniciarFormulario();

    this.planEnEdicion = plan.id;
    this.nombrePlan = plan.nombre;
    this.fechaInicio = plan.fechaInicio;
    this.fechaFin = plan.fechaFin;

    this.diasSeleccionados = plan.dias.map(
      dia => dia.dia
    );

    for (const dia of plan.dias) {
      this.rutinasPorDia[dia.dia] = {
        nombre: dia.nombre,
        ejercicios: structuredClone(dia.ejercicios)
      };
    }

    this.diaActivo = this.diasSeleccionados[0] ?? '';

    await this.marcarLimpio();

    this.avisar(
      `Editando «${plan.nombre}».`
    );
  }

  // NUEVO PLAN

  async nuevoPlan(): Promise<void> {
    if (
      this.hayCambios() &&
      !confirm(
        'Tienes cambios sin guardar. ' +
        '¿Quieres comenzar otro plan?'
      )
    ) {
      return;
    }

    this.reiniciarFormulario();
    await this.marcarLimpio();

    this.avisar(
      'Puedes comenzar un nuevo plan semanal.'
    );
  }

  private reiniciarFormulario(): void {
    this.nombrePlan = '';
    this.fechaInicio = '';
    this.fechaFin = '';
    this.diasSeleccionados = [];
    this.diaActivo = '';

    this.rutinasPorDia = this.crearRutinasVacias();

    this.busquedaEjercicio = '';
    this.planEnEdicion = null;

    this.limpiarEjercicio();
  }

  // BORRADORES

  registrarCambio(): void {
    if (this.restaurando || this.guardando) return;

    if (this.temporizadorBorrador) {
      clearTimeout(this.temporizadorBorrador);
    }

    const version = ++this.versionBorrador;

    this.temporizadorBorrador = setTimeout(() => {
      if (version !== this.versionBorrador) return;
      if (!this.hayCambios()) return;

      this.mensajeBorrador = 'Guardando borrador…';

      void this.borradoresService.guardar(
        this.obtenerEstado()
      ).then(() => {
        if (version === this.versionBorrador) {
          this.mensajeBorrador =
            'Borrador guardado automáticamente.';
        }
      }).catch(error => {
        console.error(error);

        if (version === this.versionBorrador) {
          this.mensajeBorrador =
            'No se pudo guardar el borrador.';
        }
      });
    }, 500);
  }

  private obtenerEstado(): BorradorPlan {
    return {
      version: 1,
      clienteId: this.clienteSeleccionado?.id ?? null,
      clienteConfirmado: this.clienteSeleccionado !== null,
      busquedaCliente: this.busquedaCliente,
      planId: this.planEnEdicion,
      nombre: this.nombrePlan,
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin,
      dias: [...this.diasSeleccionados],
      rutinas: structuredClone(this.rutinasPorDia),
      diaActivo: this.diaActivo,
      ejercicioId: this.ejercicioSeleccionado?.id ?? null,
      indiceEdicion: this.indiceEdicion,
      series: this.series?.toString() ?? '',
      repeticiones: this.repeticiones?.toString() ?? '',
      busquedaEjercicio: this.busquedaEjercicio
    };
  }

  private hayCambios(): boolean {
    const actual = this.obtenerEstado();

    const tieneContenido = Boolean(
      actual.nombre.trim() ||
      actual.fechaInicio ||
      actual.fechaFin ||
      actual.dias.length ||
      Object.values(actual.rutinas).some(
        rutina =>
          rutina.nombre.trim() ||
          rutina.ejercicios.length
      )
    );

    return (
      tieneContenido &&
      JSON.stringify(actual) !== this.firmaGuardada
    );
  }

  // RECUPERAR BORRADOR

  async recuperarBorrador(): Promise<void> {
    if (!this.borradorDisponible) return;

    const borrador = this.borradorDisponible;

    this.restaurando = true;

    try {
      this.reiniciarFormulario();

      this.clienteSeleccionado =
        this.clientesVinculados.find(
          cliente => cliente.id === borrador.clienteId
        ) ?? null;

      this.busquedaCliente =
        this.clienteSeleccionado?.nombre ??
        borrador.busquedaCliente;

      this.planEnEdicion = borrador.planId;
      this.nombrePlan = borrador.nombre;
      this.fechaInicio = borrador.fechaInicio;
      this.fechaFin = borrador.fechaFin;
      this.diasSeleccionados = [...borrador.dias];

      this.rutinasPorDia = {
        ...this.crearRutinasVacias(),
        ...structuredClone(borrador.rutinas)
      };

      this.diaActivo = borrador.diaActivo;
      this.busquedaEjercicio = borrador.busquedaEjercicio;

      this.ejercicioSeleccionado = borrador.ejercicioId
        ? this.ejerciciosService.obtenerPorId(
            borrador.ejercicioId
          ) ?? null
        : null;

      this.indiceEdicion = borrador.indiceEdicion;

      this.series = borrador.series
        ? Number(borrador.series)
        : null;

      this.repeticiones = borrador.repeticiones
        ? Number(borrador.repeticiones)
        : null;

      await this.cargarPlanes();

      this.borradorDisponible = null;

      this.avisar(
        'Recuperamos tu borrador. ' +
        'Puedes continuar editándolo.'
      );

    } finally {
      this.restaurando = false;
    }
  }

  // DESCARTAR BORRADOR

  async descartarBorrador(): Promise<void> {
    try {
      this.versionBorrador++;

      if (this.temporizadorBorrador) {
        clearTimeout(this.temporizadorBorrador);
        this.temporizadorBorrador = null;
      }

      await this.borradoresService.eliminar();

      this.borradorDisponible = null;
      this.mensajeBorrador = '';

      this.avisar('Borrador descartado.');

    } catch (error) {
      this.avisar(
        this.textoError(
          error,
          'No se pudo descartar el borrador.'
        ),
        true
      );
    }
  }

  // MARCAR ESTADO COMO GUARDADO

  private async marcarLimpio(): Promise<void> {
    this.versionBorrador++;

    if (this.temporizadorBorrador) {
      clearTimeout(this.temporizadorBorrador);
      this.temporizadorBorrador = null;
    }

    this.firmaGuardada = JSON.stringify(
      this.obtenerEstado()
    );

    this.mensajeBorrador = '';
    this.borradorDisponible = null;

    await this.borradoresService.eliminar();
  }
}
