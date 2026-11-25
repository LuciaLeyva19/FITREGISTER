import {
  Component,
  HostListener,
  OnDestroy,
  OnInit
} from '@angular/core';

import { RouterLink } from '@angular/router';

interface ClientePanel {
  id: string;
  nombre: string;
}

interface DiaPlan {
  dia: string;
  nombre: string;
}

interface PlanPanel {
  id: string;
  nombre: string;
  dias: DiaPlan[];
  fechaInicio?: string;
  fechaFin?: string;
  creadoEn?: string;
}

interface Periodo {
  inicio: string;
  fin: string;
}

interface Asignacion {
  cliente: ClientePanel;
  plan: PlanPanel;
  periodo: Periodo;
}

interface Registro {
  clienteId: string;
  planId: string;
  fecha: string;
  estado: 'completada' | 'no-entreno';
  rutinaNombre?: string;
  nombreRutina?: string;
}

interface RegistroTabla {
  id: string;
  cliente: string;
  rutina: string;
  fecha: string;
  estado: 'completada' | 'no-entreno';
}

interface ProximaRutina {
  id: string;
  cliente: string;
  rutina: string;
  plan: string;
  fecha: string;
}

interface PuntoGrafica {
  x: number;
  y: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {

  // CLIENTES DE DEMOSTRACIÓN

  private readonly clientes: ClientePanel[] = [
    { id: 'diego', nombre: 'Diego Ruiz' },
    { id: 'ana', nombre: 'Ana Torres' },
    { id: 'sofia', nombre: 'Sofía Vega' }
  ];

  private readonly dias = [
    'domingo',
    'lunes',
    'martes',
    'miercoles',
    'jueves',
    'viernes',
    'sabado'
  ];

  private readonly nombresDias = [
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
    'Domingo'
  ];

  private readonly formatoCorto =
    new Intl.DateTimeFormat('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });

  private readonly formatoFecha =
    new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

  private readonly formatoLargo =
    new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'short'
    });


  // INDICADORES


  totalClientes: number | string = '—';
  totalPlanes: number | string = '—';

  aviso = '';

  nota =
    'Información del prototipo guardada en este dispositivo.';


  // GRÁFICA SEMANAL


  rangoResumen = 'Esta semana';

  valoresSemana: number[] = [
    0, 0, 0, 0, 0, 0, 0
  ];

  puntosGrafica: PuntoGrafica[] = [];

  lineaPuntos = '';

  areaPath = 'M10 160 H610 V160 H10 Z';

  descripcionGrafica = '';

  detalleGrafica =
    'Aún no hay entrenamientos completados esta semana.';


  // ÚLTIMOS REGISTROS


  ultimosRegistros: RegistroTabla[] = [];


  // PRÓXIMAS RUTINAS


  proximasRutinas: ProximaRutina[] = [];


  // CUMPLIMIENTO SEMANAL


  porcentaje = 0;
  mostrarPorcentaje = false;

  completadas = 0;
  noEntreno = 0;
  sinConfirmar = 0;

  detalleCumplimiento =
    'No hay sesiones programadas hasta hoy para esta semana.';


  // TEMPORIZADOR


  private temporizador:
    ReturnType<typeof setInterval> | null = null;


  // INICIALIZACIÓN


  ngOnInit(): void {
    this.actualizarInicio();

    this.temporizador = setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.actualizarInicio();
      }
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.temporizador !== null) {
      clearInterval(this.temporizador);
      this.temporizador = null;
    }
  }

  // =====================================
  // ACTUALIZACIONES AUTOMÁTICAS
  // =====================================

  @HostListener('window:pageshow')
  alMostrarPagina(): void {
    this.actualizarInicio();
  }

  @HostListener('window:storage', ['$event'])
  alCambiarAlmacenamiento(
    evento: StorageEvent
  ): void {
    if (
      evento.key === null ||
      evento.key.startsWith('fitregister-planes-') ||
      [
        'fitregister-clientes-desvinculados-demo',
        'fitregister-cumplimiento-demo'
      ].includes(evento.key)
    ) {
      this.actualizarInicio();
    }
  }

  @HostListener('document:visibilitychange')
  alCambiarVisibilidad(): void {
    if (document.visibilityState === 'visible') {
      this.actualizarInicio();
    }
  }


  // LEER ALMACENAMIENTO LOCAL


  private leerLista<T>(clave: string): T[] {
    const datos: unknown = JSON.parse(
      localStorage.getItem(clave) ?? '[]'
    );

    if (!Array.isArray(datos)) {
      throw new Error(
        `Revisa los datos guardados en ${clave}.`
      );
    }

    return datos as T[];
  }


  // UTILIDADES DE FECHA


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

  private fechaLocal(clave: string): Date {
    const [anio, mes, dia] =
      clave.split('-').map(Number);

    return new Date(anio, mes - 1, dia, 12);
  }

  private fechaValida(valor: unknown): valor is string {
    if (
      typeof valor !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(valor)
    ) {
      return false;
    }

    const [anio, mes, dia] =
      valor.split('-').map(Number);

    const fecha = this.fechaLocal(valor);

    return (
      anio >= 1000 &&
      anio <= 9999 &&
      fecha.getFullYear() === anio &&
      fecha.getMonth() === mes - 1 &&
      fecha.getDate() === dia
    );
  }

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


  // PERIODO DE CADA PLAN


  private periodoDe(plan: PlanPanel): Periodo {
    if (plan.fechaInicio || plan.fechaFin) {
      if (
        !this.fechaValida(plan.fechaInicio) ||
        !this.fechaValida(plan.fechaFin) ||
        plan.fechaInicio > plan.fechaFin
      ) {
        throw new Error(
          `Revisa las fechas del plan «${plan.nombre}» en Rutinas.`
        );
      }

      return {
        inicio: plan.fechaInicio,
        fin: plan.fechaFin
      };
    }

    // Compatibilidad con planes antiguos.
    const creacion = plan.creadoEn
      ? new Date(plan.creadoEn)
      : null;

    return {
      inicio:
        creacion && !Number.isNaN(creacion.getTime())
          ? this.claveFecha(creacion)
          : '',
      fin: ''
    };
  }

  private vigente(
    asignacion: Asignacion,
    clave: string
  ): boolean {
    return (
      (
        !asignacion.periodo.inicio ||
        clave >= asignacion.periodo.inicio
      ) &&
      (
        !asignacion.periodo.fin ||
        clave <= asignacion.periodo.fin
      )
    );
  }


  // IDENTIFICAR REGISTROS


  private claveRegistro(
    clienteId: string,
    planId: string,
    fecha: string
  ): string {
    return JSON.stringify([
      clienteId,
      planId,
      fecha
    ]);
  }

  // LEER REGISTROS DE CUMPLIMIENTO

  private obtenerRegistros(
    vinculados: ClientePanel[],
    hoy: Date
  ): Map<string, Registro> {

    const ids = new Set(
      vinculados.map(cliente => cliente.id)
    );

    const mapa = new Map<string, Registro>();

    const fechaHoy = this.claveFecha(hoy);

    const datos = this.leerLista<Registro>(
      'fitregister-cumplimiento-demo'
    );

    for (const registro of datos) {
      if (
        !registro ||
        !ids.has(registro.clienteId) ||
        typeof registro.planId !== 'string' ||
        !this.fechaValida(registro.fecha) ||
        registro.fecha > fechaHoy ||
        !['completada', 'no-entreno'].includes(
          registro.estado
        )
      ) {
        continue;
      }

      const clave = this.claveRegistro(
        registro.clienteId,
        registro.planId,
        registro.fecha
      );

      // El último registro guardado prevalece.
      mapa.delete(clave);
      mapa.set(clave, registro);
    }

    return mapa;
  }

  // PRÓXIMAS RUTINAS

  private obtenerProximas(
    asignaciones: Asignacion[],
    registros: Map<string, Registro>,
    hoy: Date
  ): ProximaRutina[] {

    const sesiones: ProximaRutina[] = [];

    for (let avance = 0; avance < 7; avance++) {
      const fecha = this.sumarDias(hoy, avance);

      const clave = this.claveFecha(fecha);

      const dia = this.dias[fecha.getDay()];

      for (const asignacion of asignaciones) {
        if (!this.vigente(asignacion, clave)) {
          continue;
        }

        const rutina = asignacion.plan.dias.find(
          item => item.dia === dia
        );

        if (
          !rutina ||
          registros.has(
            this.claveRegistro(
              asignacion.cliente.id,
              asignacion.plan.id,
              clave
            )
          )
        ) {
          continue;
        }

        sesiones.push({
          id: this.claveRegistro(
            asignacion.cliente.id,
            asignacion.plan.id,
            clave
          ),
          cliente: asignacion.cliente.nombre,
          rutina: rutina.nombre,
          plan: asignacion.plan.nombre,
          fecha: this.formatoCorto.format(fecha)
        });
      }
    }

    return sesiones.slice(0, 5);
  }

  // ÚLTIMOS REGISTROS

  private obtenerUltimos(
    vinculados: ClientePanel[],
    asignaciones: Asignacion[],
    registros: Map<string, Registro>
  ): RegistroTabla[] {

    const ultimos = [...registros.values()]
      .reverse()
      .sort(
        (a, b) => b.fecha.localeCompare(a.fecha)
      )
      .slice(0, 5);

    return ultimos.map(registro => {
      const cliente = vinculados.find(
        item => item.id === registro.clienteId
      );

      const asignacion = asignaciones.find(
        item =>
          item.cliente.id === registro.clienteId &&
          item.plan.id === registro.planId
      );

      const fecha = this.fechaLocal(registro.fecha);

      const rutina = asignacion?.plan.dias.find(
        item =>
          item.dia === this.dias[fecha.getDay()]
      );

      const nombre =
        registro.rutinaNombre ||
        registro.nombreRutina ||
        rutina?.nombre ||
        asignacion?.plan.nombre ||
        'Rutina registrada';

      return {
        id: this.claveRegistro(
          registro.clienteId,
          registro.planId,
          registro.fecha
        ),
        cliente: cliente?.nombre ?? 'Cliente',
        rutina: nombre,
        fecha: this.formatoFecha.format(fecha),
        estado: registro.estado
      };
    });
  }

  // GRÁFICA SEMANAL

  private actualizarGrafica(
    registros: Map<string, Registro>,
    hoy: Date
  ): void {

    const lunes = this.lunesDe(hoy);

    this.valoresSemana = Array.from(
      { length: 7 },
      (_, indice) => {
        const clave = this.claveFecha(
          this.sumarDias(lunes, indice)
        );

        return [...registros.values()].filter(
          registro =>
            registro.fecha === clave &&
            registro.estado === 'completada'
        ).length;
      }
    );

    const maximo = Math.max(
      1,
      ...this.valoresSemana
    );

    this.puntosGrafica = this.valoresSemana.map(
      (cantidad, indice) => ({
        x: 10 + indice * 100,
        y: 160 - cantidad / maximo * 140
      })
    );

    this.lineaPuntos = this.puntosGrafica
      .map(punto => `${punto.x},${punto.y}`)
      .join(' ');

    this.areaPath =
      'M' +
      this.puntosGrafica
        .map(punto => `${punto.x} ${punto.y}`)
        .join(' L') +
      ' V160 H10 Z';

    this.descripcionGrafica =
      'Entrenamientos completados. ' +
      this.valoresSemana
        .map(
          (valor, indice) =>
            `${this.nombresDias[indice]}: ${valor}`
        )
        .join('. ') +
      '.';

    const domingo = this.sumarDias(lunes, 6);

    this.rangoResumen =
      `${this.formatoLargo.format(lunes)} – ` +
      this.formatoLargo.format(domingo);

    const total = this.valoresSemana.reduce(
      (suma, valor) => suma + valor,
      0
    );

    this.detalleGrafica = total
      ? `${total} ${
          total === 1
            ? 'entrenamiento completado'
            : 'entrenamientos completados'
        } esta semana.`
      : 'Aún no hay entrenamientos completados esta semana.';
  }

  // CUMPLIMIENTO SEMANAL

  private actualizarCumplimiento(
    asignaciones: Asignacion[],
    registros: Map<string, Registro>,
    hoy: Date
  ): void {

    const lunes = this.lunesDe(hoy);

    const fechaHoy = this.claveFecha(hoy);

    let programadas = 0;
    let completadas = 0;
    let noEntreno = 0;

    for (let indice = 0; indice < 7; indice++) {
      const fecha = this.sumarDias(lunes, indice);

      const clave = this.claveFecha(fecha);

      // No contamos días futuros.
      if (clave > fechaHoy) {
        continue;
      }

      for (const asignacion of asignaciones) {
        if (!this.vigente(asignacion, clave)) {
          continue;
        }

        const tieneRutina =
          asignacion.plan.dias.some(
            item =>
              item.dia === this.dias[fecha.getDay()]
          );

        if (!tieneRutina) {
          continue;
        }

        programadas++;

        const registro = registros.get(
          this.claveRegistro(
            asignacion.cliente.id,
            asignacion.plan.id,
            clave
          )
        );

        if (registro?.estado === 'completada') {
          completadas++;
        }

        if (registro?.estado === 'no-entreno') {
          noEntreno++;
        }
      }
    }

    this.porcentaje = programadas
      ? Math.round(
          completadas / programadas * 100
        )
      : 0;

    this.mostrarPorcentaje = programadas > 0;

    this.completadas = completadas;
    this.noEntreno = noEntreno;

    this.sinConfirmar =
      programadas - completadas - noEntreno;

    this.detalleCumplimiento = programadas
      ? 'Sesiones de esta semana programadas hasta hoy. No incluye días futuros ni descansos.'
      : 'No hay sesiones programadas hasta hoy para esta semana.';
  }

  // ACTUALIZAR TODO EL PANEL


  actualizarInicio(): void {

    this.aviso = '';

    try {
      const desvinculados = new Set(
        this.leerLista<string>(
          'fitregister-clientes-desvinculados-demo'
        )
      );

      const vinculados = this.clientes.filter(
        cliente => !desvinculados.has(cliente.id)
      );

      const asignaciones: Asignacion[] =
        vinculados.flatMap(cliente => {

          const planes = this.leerLista<PlanPanel>(
            `fitregister-planes-${cliente.id}`
          );

          return planes.map(plan => {
            if (
              !plan ||
              typeof plan.id !== 'string' ||
              typeof plan.nombre !== 'string' ||
              !Array.isArray(plan.dias) ||
              plan.dias.some(dia =>
                !dia ||
                !this.dias.includes(dia.dia) ||
                typeof dia.nombre !== 'string'
              )
            ) {
              throw new Error(
                `Revisa los planes guardados de ${cliente.nombre}.`
              );
            }

            return {
              cliente,
              plan,
              periodo: this.periodoDe(plan)
            };
          });
        });

      const hoy = new Date();

      const registros = this.obtenerRegistros(
        vinculados,
        hoy
      );

      // INDICADORES

      this.totalClientes = vinculados.length;

      // Incluye los planes finalizados.
      this.totalPlanes = asignaciones.length;

      // PRÓXIMAS RUTINAS

      this.proximasRutinas = this.obtenerProximas(
        asignaciones,
        registros,
        hoy
      );

      // ÚLTIMOS REGISTROS

      this.ultimosRegistros = this.obtenerUltimos(
        vinculados,
        asignaciones,
        registros
      );

      // GRÁFICA

      this.actualizarGrafica(registros, hoy);

      // CUMPLIMIENTO

      this.actualizarCumplimiento(
        asignaciones,
        registros,
        hoy
      );

      this.nota =
        'Información del prototipo guardada en este dispositivo. Los planes sin fechas conservan su programación desde la creación.';

    } catch (error) {
      console.error(
        'No se pudo actualizar el panel:',
        error
      );

      this.totalClientes = '—';
      this.totalPlanes = '—';

      this.ultimosRegistros = [];
      this.proximasRutinas = [];

      this.actualizarGrafica(
        new Map<string, Registro>(),
        new Date()
      );

      this.detalleGrafica =
        'Información no disponible.';

      this.porcentaje = 0;
      this.mostrarPorcentaje = false;

      this.completadas = 0;
      this.noEntreno = 0;
      this.sinConfirmar = 0;

      this.detalleCumplimiento =
        'Información no disponible.';

      this.aviso =
        error instanceof Error
          ? error.message
          : 'No se pudieron consultar los datos locales.';
    }
  }
}
