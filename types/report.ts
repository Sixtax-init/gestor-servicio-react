export interface Actividad {
  actividad: string;
  descripcion?: string;
  fecha_entrega?: string;
  calificacion?: number;
  retroalimentacion?: string | null;
  curso?: string;
  estado?: string;
  fecha_revision?: string;
}

export interface ReportData {
  reportNumber: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombre: string;
  carrera: string;
  numeroControl: string;
  fechaInicioDia: string;
  fechaInicioMes: string;
  fechaInicioAno: string;
  fechaFinDia: string;
  fechaFinMes: string;
  fechaFinAno: string;
  dependencia: string;
  programa: string;
  resumenActividades: string;
  horasReporte: string;
  horasAcumuladas: string;
  nombreJefe: string;
  puestoJefe: string;
  actividades: Actividad[];
}
