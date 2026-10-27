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
  // Encabezado
  fechaDesde: string;
  fechaHasta: string;
  lote: string;
  responsable: string;
  // Condiciones
  fechaReporte: string;
  tempMin: number;
  tempMax: number;
  humedad: number;
  clima: "Soleado" | "Nublado" | "Lluvia" | "Otro";
  climaOtro?: string;
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
