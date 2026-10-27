import { CropGeneralStatus } from "./types";

export type SemaforoAlertLevel = "optimo" | "atencion" | "critico";

export interface CropAlertEvaluation {
  nivel: SemaforoAlertLevel;
  titulo: string;
  subtitulo: string;
  diagnostico: string;
  colorHex: string;
  badgeBgHex: string;
  badgeTextHex: string;
  badgeBorderHex: string;
  tailwindBg: string;
  tailwindBorder: string;
  tailwindText: string;
  puntosAlerta: string[];
  recomendaciones: string[];
}

export function evaluarEstadoCultivo(estado: CropGeneralStatus): CropAlertEvaluation {
  const { desarrolloVegetativo, floracion, formacionVainas, estadoFitosanitario } = estado;

  const malos: string[] = [];
  const regulares: string[] = [];

  if (desarrolloVegetativo === "Malo") malos.push("Desarrollo Vegetativo deficiente");
  else if (desarrolloVegetativo === "Regular") regulares.push("Desarrollo Vegetativo moderado");

  if (floracion === "Malo") malos.push("Floración deficiente o caída anómala");
  else if (floracion === "Regular") regulares.push("Floración irregular o baja inducción");

  if (formacionVainas === "Malo") malos.push("Aborto o bajo cuajado de vainas");
  else if (formacionVainas === "Regular") regulares.push("Carga o calibre irregular de vainas");

  if (estadoFitosanitario === "Malo") malos.push("Alerta Fitosanitaria crítica: Presencia de plagas / hongos");
  else if (estadoFitosanitario === "Regular") regulares.push("Alerta Fitosanitaria preventiva: Requiere monitoreo");

  // 1. ROJO: En mal estado / Crítico
  if (malos.length > 0 || estadoFitosanitario === "Malo") {
    const recomendaciones = [
      "Realizar inspección técnica prioritaria con el agrónomo responsable ITEC.",
      "Aislar y retirar de inmediato material vegetal afectado para cortar focos de infección.",
      "Revisar niveles de humedad en camas y drenajes para evitar pudrición radicular.",
      "Suspender polinización en guías débiles o deshidratadas hasta recuperar vigor.",
    ];

    return {
      nivel: "critico",
      titulo: "EN MAL ESTADO",
      subtitulo: "Alerta Crítica Agronómica (Intervención Inmediata)",
      diagnostico: `El cultivo presenta condiciones desfavorables en: ${malos.join(", ")}${
        regulares.length ? ` y aspectos a observar en: ${regulares.join(", ")}` : ""
      }. Requiere atención técnica inmediata.`,
      colorHex: "#DC2626",
      badgeBgHex: "#FEF2F2",
      badgeTextHex: "#991B1B",
      badgeBorderHex: "#F87171",
      tailwindBg: "bg-red-50",
      tailwindBorder: "border-red-500",
      tailwindText: "text-red-900",
      puntosAlerta: malos.concat(regulares),
      recomendaciones,
    };
  }

  // 2. AMARILLO: Necesita atención preventiva
  if (regulares.length > 0) {
    const recomendaciones = [
      "Incrementar monitoreo y evaluar aplicación de sustrato orgánico / bioles si hay signos de clorosis.",
      "Verificar regulación de mallas de sombra y ventilación para optimizar el microclima del invernadero.",
      "Realizar deshierbe manual cuidadoso alrededor de las camas sin dañar raíces superficiales.",
      "Revisar amarre de guías con hilo flojo para asegurar crecimiento sin estrangulamiento vascular.",
    ];

    return {
      nivel: "atencion",
      titulo: "NECESITA ATENCIÓN",
      subtitulo: "Alerta Preventiva de Manejo Agronómico",
      diagnostico: `El cultivo requiere manejo preventivo en: ${regulares.join(", ")}. Condiciones corregibles con ajustes de manejo y nutrición.`,
      colorHex: "#D97706",
      badgeBgHex: "#FFFBEB",
      badgeTextHex: "#92400E",
      badgeBorderHex: "#FBBF24",
      tailwindBg: "bg-amber-50",
      tailwindBorder: "border-amber-500",
      tailwindText: "text-amber-900",
      puntosAlerta: regulares,
      recomendaciones,
    };
  }

  // 3. VERDE: El cultivo va bien / Estado Óptimo
  const recomendaciones = [
    "Mantener la frecuencia de riego programado y la fertilización orgánica balanceada.",
    "Continuar guiado y formación del manto (ramas hacia abajo para inducción floral).",
    "Preservar estrictamente el área de desinfección y control de bioseguridad en el invernadero.",
    "Mantener registro fotográfico periódico para trazabilidad Waorani e ITEC.",
  ];

  return {
    nivel: "optimo",
    titulo: "EL CULTIVO VA BIEN",
    subtitulo: "Estado Agronómico Óptimo",
    diagnostico: "Todos los indicadores agronómicos se encuentran en nivel Bueno. Excelente vigor vegetativo, floración saludable y sanidad fitosanitaria bajo control.",
    colorHex: "#15803D",
    badgeBgHex: "#F0FDF4",
    badgeTextHex: "#166534",
    badgeBorderHex: "#86EFAC",
    tailwindBg: "bg-emerald-50",
    tailwindBorder: "border-emerald-500",
    tailwindText: "text-emerald-950",
    puntosAlerta: [],
    recomendaciones,
  };
}
