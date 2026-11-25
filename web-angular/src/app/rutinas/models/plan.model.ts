/*
 * FITREGISTER
 * Modelos para Rutinas y Ejercicios
 */

export type DiaSemana =
  | 'lunes'
  | 'martes'
  | 'miercoles'
  | 'jueves'
  | 'viernes'
  | 'sabado'
  | 'domingo';

/* Cliente vinculado con el entrenador */
export interface ClientePlan {
  id: string;
  nombre: string;
}

/* Ejercicio del catálogo */
export interface EjercicioCatalogo {
  id: string;
  nombre: string;
  grupoMuscular: string;
  imagen: string;
  instrucciones: string[];

  propio: boolean;
  archivado: boolean;
  pendiente?: boolean;
  revision?: string;
  sincronizado?: boolean;

  imagenBlob?: Blob;
  orden?: number;
  creadoEn?: string;
  actualizadoEn?: string;
}

/* Ejercicio agregado a una rutina */
export interface EjercicioAsignado {
  ejercicioId: string;
  nombre: string;
  series: number;
  repeticiones: number;
}

/* Rutina correspondiente a un día */
export interface RutinaDia {
  dia: DiaSemana;
  nombre: string;
  ejercicios: EjercicioAsignado[];
}

/* Plan semanal asignado a un cliente */
export interface PlanSemanal {
  id: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  dias: RutinaDia[];

  creadoEn?: string;
  actualizadoEn?: string;
}

/* Datos utilizados al crear un plan */
export type DatosPlan = Omit<
  PlanSemanal,
  'creadoEn' | 'actualizadoEn'
>;

/* Estado del editor para guardar borradores */
export interface BorradorPlan {
  version: number;

  clienteId: string | null;
  clienteConfirmado: boolean;
  busquedaCliente: string;

  planId: string | null;
  nombre: string;

  fechaInicio: string;
  fechaFin: string;

  dias: DiaSemana[];

  rutinas: Record<
    DiaSemana,
    {
      nombre: string;
      ejercicios: EjercicioAsignado[];
    }
  >;

  diaActivo: DiaSemana | '';

  ejercicioId: string | null;
  indiceEdicion: number | null;

  series: string;
  repeticiones: string;
  busquedaEjercicio: string;
}

/* Días utilizados en el formulario */
export const DIAS_SEMANA: {
  id: DiaSemana;
  nombre: string;
  corto: string;
}[] = [
  { id: 'lunes', nombre: 'Lunes', corto: 'Lun' },
  { id: 'martes', nombre: 'Martes', corto: 'Mar' },
  { id: 'miercoles', nombre: 'Miércoles', corto: 'Mié' },
  { id: 'jueves', nombre: 'Jueves', corto: 'Jue' },
  { id: 'viernes', nombre: 'Viernes', corto: 'Vie' },
  { id: 'sabado', nombre: 'Sábado', corto: 'Sáb' },
  { id: 'domingo', nombre: 'Domingo', corto: 'Dom' }
];
