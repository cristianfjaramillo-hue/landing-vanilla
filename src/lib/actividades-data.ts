export interface ActivitySection {
  id: number;
  title: string;
  iconName: string;
  items: string[];
}

export const SECTIONS_DATA: ActivitySection[] = [
  {
    id: 1,
    title: "PLANIFICACIÓN E INSTALACIÓN DEL INVERNADERO",
    iconName: "Warehouse",
    items: [
      "Selección del sitio y análisis del microclima",
      "Diseño del invernadero y distribución de áreas",
      "Preparación del suelo o sustrato",
      "Instalación de drenajes",
      "Desinfección del área de cultivo",
      "Instalación de sistema de riego",
      "Instalación de mallas, sombra y ventilación",
      "Colocación de tutores o soportes",
      "Delimitación de lotes y codificación",
      "Registro inicial del cultivo"
    ]
  },
  {
    id: 2,
    title: "ESTABLECIMIENTO DEL CULTIVO",
    iconName: "Sprout",
    items: [
      "Selección de esquejes o material vegetativo sano",
      "Desinfección del material de siembra",
      "Siembra o trasplante",
      "Etiquetado por lote y fecha",
      "Amarre inicial de guías",
      "Manejo de sombra inicial",
      "Riego de establecimiento",
      "Reposición de plantas fallantes",
      "Monitoreo de prendimiento"
    ]
  },
  {
    id: 3,
    title: "MANTENIMIENTO DEL CULTIVO",
    iconName: "Wrench",
    items: [
      "Riego programado",
      "Fertilización",
      "Aplicación de materia orgánica",
      "Deshierbe o control de malezas",
      "Aporcado o manejo de base",
      "Poda sanitaria",
      "Poda de formación",
      "Guiado y amarre de lianas",
      "Manejo de tutores",
      "Regulación de sombra y ventilación",
      "Monitoreo de temperatura y humedad",
      "Muestreo y análisis de suelo o sustrato",
      "Limpieza del invernadero",
      "Mantenimiento de herramientas y equipos"
    ]
  },
  {
    id: 4,
    title: "SANIDAD Y CONTROL FITOSANITARIO",
    iconName: "ShieldAlert",
    items: [
      "Monitoreo de plagas",
      "Monitoreo de enfermedades",
      "Identificación de síntomas",
      "Retiro de material vegetal afectado",
      "Aplicación de controles biológicos",
      "Aplicación de controles preventivos",
      "Aplicación fitosanitaria correctiva",
      "Desinfección de herramientas",
      "Registro de incidencias fitosanitarias"
    ]
  },
  {
    id: 5,
    title: "FLORACIÓN Y PRODUCCIÓN",
    iconName: "Sparkles",
    items: [
      "Monitoreo de inducción floral",
      "Identificación de botones florales",
      "Polinización manual",
      "Registro de flores polinizadas",
      "Manejo de fructificación",
      "Raleo o selección de vainas si aplica",
      "Seguimiento del desarrollo de vainas",
      "Protección de vainas",
      "Evaluación de rendimiento por planta o lote"
    ]
  },
  {
    id: 6,
    title: "COSECHA",
    iconName: "ShoppingBag",
    items: [
      "Determinación del punto óptimo de cosecha",
      "Corte y recolección de vainas",
      "Clasificación preliminar",
      "Conteo y pesaje",
      "Registro de producción por lote",
      "Transporte interno al área de beneficiado"
    ]
  },
  {
    id: 7,
    title: "BENEFICIADO / CURADO DE VAINILLA",
    iconName: "Sun",
    items: [
      "Selección y clasificación de vainas",
      "Escaldado o matado",
      "Sudado",
      "Secado al sol o secado controlado",
      "Oreado y estabilización",
      "Acondicionamiento",
      "Clasificación por tamaño, aroma y calidad",
      "Control de humedad del producto",
      "Registro del proceso de beneficiado"
    ]
  },
  {
    id: 8,
    title: "EMPAQUE Y ALMACENAMIENTO",
    iconName: "Package",
    items: [
      "Limpieza del área de empaque",
      "Selección final del producto",
      "Pesaje final",
      "Empaque primario",
      "Etiquetado",
      "Sellado",
      "Empaque secundario",
      "Almacenamiento en condiciones adecuadas",
      "Control de inventario",
      "Trazabilidad por lote"
    ]
  },
  {
    id: 9,
    title: "GESTIÓN, CALIDAD Y SEGUIMIENTO",
    iconName: "TrendingUp",
    items: [
      "Registro diario de actividades",
      "Registro fotográfico",
      "Control de fechas de siembra, floración y cosecha",
      "Control de insumos utilizados",
      "Verificación de herramientas y EPP",
      "Capacitación del personal",
      "Cumplimiento de bioseguridad",
      "Elaboración de informes de seguimiento",
      "Evaluación de productividad",
      "Mejora continua del proceso"
    ]
  }
];

export const TOTAL_ACTIVIDADES_COUNT = SECTIONS_DATA.reduce((acc, s) => acc + s.items.length, 0);

export const RECOMENDACIONES_DATA: string[] = [
  "No dejar ingresar las gallinas",
  "Área de desinfección",
  "Formar el manto - Ramas hacia abajo",
  "Invernadero 1, rehacer las camas.",
  "Esqueje seco, NO POLINIZAR o cargar poco.",
  "Poner + Sustrato - (Clorosis).",
  "Limpieza de hierbas",
  "Amarrar con el hilo flojo.",
  "Alambre fino",
  "Desinfección de herramientas de poda y corte",
  "Control de humedad relativa y ventilación cruzada",
  "Regulación de polisombra (50% a 70% de luminosidad)",
  "Monitoreo fitosanitario de pudrición de raíz (Fusarium)",
  "Riego en sustrato sin humedecer flores abiertas",
  "Registro diario de floración y polinización manual"
];
