import { ActivityItem, ToolItem, DailyReport } from "./types";

export const DEFAULT_ACTIVITIES: ActivityItem[] = [
  { id: 1, nombre: "Riego", descripcion: "", areaLote: "", realizado: false },
  { id: 2, nombre: "Fertilización", descripcion: "", areaLote: "", realizado: false },
  { id: 3, nombre: "Control de malezas", descripcion: "", areaLote: "", realizado: false },
  { id: 4, nombre: "Poda / Manejo de guías", descripcion: "", areaLote: "", realizado: false },
  { id: 5, nombre: "Polinización manual de orquídeas", descripcion: "", areaLote: "", realizado: false },
  { id: 6, nombre: "Control de plagas", descripcion: "", areaLote: "", realizado: false },
  { id: 7, nombre: "Control de enfermedades", descripcion: "", areaLote: "", realizado: false },
  { id: 8, nombre: "Instalación / Mantenimiento de tutores vivos", descripcion: "", areaLote: "", realizado: false },
  { id: 9, nombre: "Revisión de brotes y conteo de vainas", descripcion: "", areaLote: "", realizado: false },
  { id: 10, nombre: "Otra actividad agronómica", descripcion: "", areaLote: "", realizado: false },
];

export const DEFAULT_TOOLS: ToolItem[] = [
  { id: "machete", nombre: "Machete", utilizada: false },
  { id: "tijera", nombre: "Tijera de poda", utilizada: false },
  { id: "azadon", nombre: "Azadón", utilizada: false },
  { id: "pala", nombre: "Pala", utilizada: false },
  { id: "fumigadora", nombre: "Mochila fumigadora", utilizada: false },
  { id: "regadera", nombre: "Regadera", utilizada: false },
  { id: "carretilla", nombre: "Carretilla", utilizada: false },
  { id: "manuales", nombre: "Herramientas manuales", utilizada: false },
  { id: "escalera", nombre: "Escalera", utilizada: false },
  { id: "otra", nombre: "Otra herramienta", utilizada: false },
];

export const INITIAL_MOCK_REPORTS: DailyReport[] = [
  {
    id: "rep-2026-001",
    created_at: "2026-10-26T08:30:00Z",
    fechaDesde: "2026-10-26",
    fechaHasta: "2026-10-26",
    lote: "Lote 1 - Chakra Waorani Nemompari",
    responsable: "Kowii Nenquimo & Equipo Técnico ITEC",
    fechaReporte: "2026-10-26",
    tempMin: 22,
    tempMax: 31,
    humedad: 86,
    clima: "Nublado",
    actividades: [
      { id: 4, nombre: "Poda / Manejo de guías", descripcion: "En tutor vivo de Guaba, elevación a 1.6m", areaLote: "Lote 1-A", realizado: true },
      { id: 5, nombre: "Polinización manual de orquídeas", descripcion: "Polinización matutina de 42 flores abiertas", areaLote: "Lote 1-A", realizado: true },
      { id: 9, nombre: "Revisión de brotes y conteo de vainas", descripcion: "Brotes vigorosos, sin signos de antracnosis", areaLote: "Lote 1-B", realizado: true },
    ],
    herramientas: [
      { id: "tijera", nombre: "Tijera de poda", utilizada: true },
      { id: "escalera", nombre: "Escalera", utilizada: true },
      { id: "manuales", nombre: "Herramientas manuales", utilizada: true },
    ],
    insumos: [
      { id: "1", insumo: "Biol fermentado orgánico (chicha de monte)", dosis: "2 L / bomba", metodo: "Foliar matutino", areaLote: "Lote 1-A" },
    ],
    estadoCultivo: {
      desarrolloVegetativo: "Bueno",
      floracion: "Bueno",
      formacionVainas: "Bueno",
      estadoFitosanitario: "Bueno",
    },
    observaciones: "Floración en pico óptimo. Polinización ejecutada entre las 06:30 y las 10:00 con éxito por las guardianas de la comunidad. Excelente retención de humedad en el suelo de bosque.",
    foto1Url: "/assets/informe-diario-referencia.jpg",
    foto2Url: "/assets/logo-amazon-vanilla-cream.png",
    foto3Url: "/assets/logo-amazon-vanilla-white.png",
  },
  {
    id: "rep-2026-002",
    created_at: "2026-10-25T09:00:00Z",
    fechaDesde: "2026-10-25",
    fechaHasta: "2026-10-25",
    lote: "Lote 2 - Sector Río Shiripuno",
    responsable: "Ing. Agrónomo ITEC Ecuador",
    fechaReporte: "2026-10-25",
    tempMin: 21,
    tempMax: 29,
    humedad: 90,
    clima: "Lluvia",
    actividades: [
      { id: 3, nombre: "Control de malezas", descripcion: "Plateo manual con machete sin tocar raíces superficiales", areaLote: "Lote 2", realizado: true },
      { id: 8, nombre: "Instalación / Mantenimiento de tutores vivos", descripcion: "Ajuste de tutores de Erythrina (porotillo)", areaLote: "Lote 2", realizado: true },
    ],
    herramientas: [
      { id: "machete", nombre: "Machete", utilizada: true },
      { id: "manuales", nombre: "Herramientas manuales", utilizada: true },
    ],
    insumos: [],
    estadoCultivo: {
      desarrolloVegetativo: "Bueno",
      floracion: "Regular",
      formacionVainas: "Bueno",
      estadoFitosanitario: "Bueno",
    },
    observaciones: "Lluvia persistente durante la tarde. Buen drenaje natural del suelo de chakra. Se programó fertilización foliar con biochar y compost para el día siguiente.",
  },
];
