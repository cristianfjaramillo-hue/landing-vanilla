export interface DailyCondition {
  fecha: string;
  lote: string;
  responsable: string;
  tempMin: string;
  tempMax: string;
  humedad: string;
  clima: "Soleado" | "Nublado" | "Lluvia" | "Otro";
  climaOtro?: string;
}

export interface ActivityItem {
  id: number;
  nombre: string;
  descripcion: string;
  areaLote: string;
  fechaProxima?: string;
  realizado: boolean;
}

export interface ToolItem {
  id: string;
  nombre: string;
  utilizada: boolean;
}

export interface AppliedInput {
  id: string;
  insumo: string;
  dosis: string;
  metodo: string;
  areaLote: string;
}

export interface DailyReport {
  id: string;
  created_at: string;
  tipoReporte?: "diario" | "general";
  titulo?: string;
  // Encabezado
  proyecto?: string;
  area?: string;
  lote: string;
  responsable: string;
  // Fechas y Condiciones
  fechaReporte: string;
  fechaDesde?: string;
  fechaHasta?: string;
  temperatura?: number;
  tempMin?: number;
  tempMax?: number;
  humedad?: number;
  clima?: "Soleado" | "Nublado" | "Lluvia" | "Otro" | string;
  climaOtro?: string;
  // Condiciones del Terreno
  alcalinidad?: number | string;
  // Listas
  actividades: ActivityItem[];
  herramientas: ToolItem[];
  insumos: AppliedInput[];
  // Observaciones & Fotos
  observaciones: string;
  foto1Url?: string;
  foto2Url?: string;
  foto3Url?: string;
}

export interface ActivityProtocol {
  id: string;
  created_at: string;
  fecha: string;
  lote: string;
  responsable: string;
  observaciones: string;
  checkedItems: Record<string, boolean>;
  totalActividades: number;
  completadas: number;
  porcentaje: number;
  tipo?: string;
}

export interface ScheduledReminder {
  id: string;
  reportId: string;
  actividadNombre: string;
  area: string;
  responsable: string;
  observacionesPrevias?: string;
  fechaProgramada: string;
  recordatoriosEnviados: number; // 0, 1, 2, 3
  ultimoEnvio?: string;
  estado: "pendiente" | "completado" | "cancelado";
  created_at: string;
}
