"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Printer,
  Download,
  RotateCcw,
  CheckCircle2,
  CheckSquare,
  Square,
  Eye,
  X,
  Warehouse,
  Sprout,
  Wrench,
  ShieldAlert,
  Sparkles,
  ShoppingBag,
  Sun,
  Package,
  TrendingUp,
  FileText,
  Calendar,
  User,
  ExternalLink
} from "lucide-react";

interface ActivitySection {
  id: number;
  title: string;
  iconName: string;
  items: string[];
}

const SECTIONS_DATA: ActivitySection[] = [
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

export default function ActividadesPage() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [responsable, setResponsable] = useState("");
  const [fecha, setFecha] = useState("");
  const [lote, setLote] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [showOriginalModal, setShowOriginalModal] = useState(false);

  // Cargar estado guardado de localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("vanilla_actividades_checked");
      if (saved) {
        setCheckedItems(JSON.parse(saved));
      }
      const savedResp = localStorage.getItem("vanilla_actividades_responsable");
      if (savedResp) setResponsable(savedResp);
      const savedFecha = localStorage.getItem("vanilla_actividades_fecha");
      if (savedFecha) setFecha(savedFecha);
      else setFecha(new Date().toISOString().split("T")[0]);
      const savedLote = localStorage.getItem("vanilla_actividades_lote");
      if (savedLote) setLote(savedLote);
      const savedObs = localStorage.getItem("vanilla_actividades_obs");
      if (savedObs) setObservaciones(savedObs);
    } catch {
      // Ignore local storage error
    }
  }, []);

  const toggleItem = (key: string) => {
    setCheckedItems((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("vanilla_actividades_checked", JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const markAll = () => {
    const next: Record<string, boolean> = {};
    SECTIONS_DATA.forEach((sec) => {
      sec.items.forEach((item, idx) => {
        next[`${sec.id}-${idx}`] = true;
      });
    });
    setCheckedItems(next);
    try {
      localStorage.setItem("vanilla_actividades_checked", JSON.stringify(next));
    } catch {}
  };

  const clearAll = () => {
    if (confirm("¿Estás seguro de restablecer todas las casillas marcadas?")) {
      setCheckedItems({});
      try {
        localStorage.removeItem("vanilla_actividades_checked");
      } catch {}
    }
  };

  // Cálculos de progreso
  const totalItemsCount = SECTIONS_DATA.reduce((acc, s) => acc + s.items.length, 0);
  const completedItemsCount = Object.values(checkedItems).filter(Boolean).length;
  const progressPercentage = Math.round((completedItemsCount / totalItemsCount) * 100);

  const renderSectionIcon = (iconName: string) => {
    const props = { className: "w-5 h-5 text-vanilla-300 flex-shrink-0" };
    switch (iconName) {
      case "Warehouse":
        return <Warehouse {...props} />;
      case "Sprout":
        return <Sprout {...props} />;
      case "Wrench":
        return <Wrench {...props} />;
      case "ShieldAlert":
        return <ShieldAlert {...props} />;
      case "Sparkles":
        return <Sparkles {...props} />;
      case "ShoppingBag":
        return <ShoppingBag {...props} />;
      case "Sun":
        return <Sun {...props} />;
      case "Package":
        return <Package {...props} />;
      case "TrendingUp":
        return <TrendingUp {...props} />;
      default:
        return <CheckSquare {...props} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4EFEA] text-forest-950 pb-16 font-sans">
      {/* Barra Superior Flotante de Controles (Oculta al imprimir) */}
      <div className="print:hidden sticky top-0 z-40 bg-forest-900/95 backdrop-blur-md text-white border-b border-vanilla-600/30 px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="text-xs text-vanilla-300 hover:text-white flex items-center space-x-1"
            >
              <span>← Volver al Inicio</span>
            </Link>
            <span className="text-forest-400">|</span>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-white">Progreso General:</span>
              <div className="w-28 sm:w-40 bg-forest-950 rounded-full h-2.5 overflow-hidden border border-forest-700">
                <div
                  className="bg-vanilla-400 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span className="text-xs font-bold text-vanilla-300">
                {completedItemsCount}/{totalItemsCount} ({progressPercentage}%)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowOriginalModal(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-forest-800 hover:bg-forest-700 text-vanilla-200 text-xs font-medium border border-forest-600 transition-colors"
              title="Ver diseño original escaneado de ITEC"
            >
              <Eye className="w-3.5 h-3.5 text-vanilla-400" />
              <span>Ver Lámina Original HD</span>
            </button>

            <button
              onClick={markAll}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-forest-800 hover:bg-forest-700 text-white text-xs transition-colors"
              title="Marcar todas las actividades"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              <span className="hidden sm:inline">Marcar Todas</span>
            </button>

            <button
              onClick={clearAll}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-forest-800 hover:bg-forest-700 text-white text-xs transition-colors"
              title="Desmarcar todas"
            >
              <RotateCcw className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Limpiar</span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-vanilla-500 hover:bg-vanilla-600 text-forest-950 text-xs font-bold shadow transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Guardar PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenedor Principal (Formato Lámina Técnica) */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-4 sm:mt-6">
        <div className="bg-white rounded-2xl shadow-xl border border-vanilla-300 p-4 sm:p-8 print:shadow-none print:border-none print:p-0">
          {/* Cabecera Oficial ITEC */}
          <header className="border-b-4 border-forest-900 pb-5 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-forest-900 rounded-2xl p-2 flex items-center justify-center flex-shrink-0 shadow">
                  <Image
                    src="/assets/logo-amazon-vanilla-white.png"
                    alt="Logo Amazon Vanilla"
                    fill
                    className="object-contain p-1"
                  />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-forest-900 text-vanilla-300 font-mono text-[11px] font-bold tracking-wider uppercase">
                      Documento Técnico ITEC
                    </span>
                    <span className="text-xs text-forest-600 font-semibold">
                      Pastaza & Napo - Ecuador
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-3xl font-serif font-black text-forest-950 uppercase tracking-tight mt-1">
                    Listado Integral de Actividades
                  </h1>
                  <h2 className="text-sm sm:text-base font-bold text-forest-800 tracking-wide uppercase">
                    Cultivo de Vainilla en Invernadero
                  </h2>
                  <p className="text-xs text-forest-600 font-medium italic mt-0.5">
                    Mantenimiento, producción, beneficiado, empaque y seguimiento agronómico
                  </p>
                </div>
              </div>

              {/* Logo ITEC y Eslogan */}
              <div className="text-right flex flex-col items-end self-end sm:self-center">
                <div className="px-3 py-1 bg-forest-50 border border-forest-200 rounded-lg">
                  <span className="text-xs font-bold text-forest-900 tracking-wider">ITEC ECUADOR</span>
                  <p className="text-[10px] text-forest-600 uppercase font-semibold">
                    Innovación para un campo sostenible
                  </p>
                </div>
                <div className="mt-1 text-[11px] font-mono text-forest-500">
                  Código: <strong>ITEC-PROT-VAINILLA-01</strong>
                </div>
              </div>
            </div>

            {/* Metadatos Rápidos de Campo (Responsable, Fecha, Lote) */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-vanilla-50/80 p-3.5 rounded-xl border border-vanilla-200 text-xs">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-forest-700 flex-shrink-0" />
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase text-forest-600">
                    Responsable de Registro:
                  </label>
                  <input
                    type="text"
                    value={responsable}
                    onChange={(e) => {
                      setResponsable(e.target.value);
                      try {
                        localStorage.setItem("vanilla_actividades_responsable", e.target.value);
                      } catch {}
                    }}
                    placeholder="Ej. Ing. Agrónomo / Técnico Waorani"
                    className="w-full bg-white border border-vanilla-300 rounded px-2 py-1 text-xs text-forest-900 font-medium focus:outline-none focus:border-forest-700"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-forest-700 flex-shrink-0" />
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase text-forest-600">
                    Fecha de Verificación:
                  </label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => {
                      setFecha(e.target.value);
                      try {
                        localStorage.setItem("vanilla_actividades_fecha", e.target.value);
                      } catch {}
                    }}
                    className="w-full bg-white border border-vanilla-300 rounded px-2 py-1 text-xs text-forest-900 font-medium focus:outline-none focus:border-forest-700"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Warehouse className="w-4 h-4 text-forest-700 flex-shrink-0" />
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase text-forest-600">
                    Invernadero / Lote:
                  </label>
                  <input
                    type="text"
                    value={lote}
                    onChange={(e) => {
                      setLote(e.target.value);
                      try {
                        localStorage.setItem("vanilla_actividades_lote", e.target.value);
                      } catch {}
                    }}
                    placeholder="Ej. Invernadero N° 1 - Chakra Dikapare"
                    className="w-full bg-white border border-vanilla-300 rounded px-2 py-1 text-xs text-forest-900 font-medium focus:outline-none focus:border-forest-700"
                  />
                </div>
              </div>
            </div>
          </header>

          {/* Cuadrícula de las 9 Fases del Cultivo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {SECTIONS_DATA.map((section) => {
              const secCompleted = section.items.filter(
                (_, idx) => checkedItems[`${section.id}-${idx}`]
              ).length;
              const isSectionAllDone = secCompleted === section.items.length;

              return (
                <div
                  key={section.id}
                  className={`rounded-xl border transition-all flex flex-col overflow-hidden ${
                    isSectionAllDone
                      ? "border-green-600/60 bg-green-50/20 shadow-sm"
                      : "border-forest-900/30 bg-white hover:border-forest-800 hover:shadow-md"
                  }`}
                >
                  {/* Encabezado de la Sección */}
                  <div className="bg-forest-900 text-white p-3 flex items-center justify-between border-b-2 border-vanilla-500">
                    <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-vanilla-500 text-forest-950 font-bold text-xs flex items-center justify-center flex-shrink-0 shadow">
                        {section.id}
                      </span>
                      <h3 className="text-xs sm:text-[13px] font-bold text-vanilla-200 uppercase tracking-tight truncate leading-snug">
                        {section.title}
                      </h3>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      {renderSectionIcon(section.iconName)}
                    </div>
                  </div>

                  {/* Sub-barra de progreso de sección */}
                  <div className="bg-forest-950/90 px-3 py-1 flex items-center justify-between text-[11px] text-forest-200">
                    <span>
                      Completadas: <strong>{secCompleted}</strong> de {section.items.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const allDone = secCompleted === section.items.length;
                        setCheckedItems((prev) => {
                          const next = { ...prev };
                          section.items.forEach((_, idx) => {
                            next[`${section.id}-${idx}`] = !allDone;
                          });
                          try {
                            localStorage.setItem(
                              "vanilla_actividades_checked",
                              JSON.stringify(next)
                            );
                          } catch {}
                          return next;
                        });
                      }}
                      className="text-[10px] text-vanilla-300 hover:text-white underline print:hidden"
                    >
                      {secCompleted === section.items.length ? "Desmarcar bloque" : "Marcar bloque"}
                    </button>
                  </div>

                  {/* Lista de Checkboxes de Actividades */}
                  <div className="p-3.5 space-y-2 flex-1">
                    {section.items.map((item, idx) => {
                      const itemKey = `${section.id}-${idx}`;
                      const isChecked = !!checkedItems[itemKey];

                      return (
                        <label
                          key={itemKey}
                          onClick={() => toggleItem(itemKey)}
                          className={`flex items-start space-x-2.5 p-1.5 rounded-lg cursor-pointer transition-colors text-xs select-none ${
                            isChecked
                              ? "bg-green-100/70 text-forest-950 font-medium"
                              : "hover:bg-vanilla-50 text-forest-800"
                          }`}
                        >
                          <div className="mt-0.5 flex-shrink-0">
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-green-700" />
                            ) : (
                              <Square className="w-4 h-4 text-forest-300" />
                            )}
                          </div>
                          <span
                            className={`leading-relaxed ${
                              isChecked ? "line-through text-forest-900/80 font-normal" : ""
                            }`}
                          >
                            {item}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sección Inferior: Observaciones y Firma */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-5 pt-4 border-t-2 border-forest-900/20">
            {/* Observaciones */}
            <div className="lg:col-span-2 bg-vanilla-50/60 rounded-xl p-4 border border-vanilla-200">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="w-4 h-4 text-forest-800" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-forest-900">
                  Observaciones y Novedades de Campo
                </h4>
              </div>
              <textarea
                rows={4}
                value={observaciones}
                onChange={(e) => {
                  setObservaciones(e.target.value);
                  try {
                    localStorage.setItem("vanilla_actividades_obs", e.target.value);
                  } catch {}
                }}
                placeholder="Anota aquí cualquier condición climática atípica, alertas fitosanitarias, requerimientos de insumos o instrucciones específicas para las cuadrillas..."
                className="w-full p-2.5 text-xs bg-white border border-vanilla-300 rounded-lg text-forest-950 focus:outline-none focus:border-forest-800"
              />
            </div>

            {/* Cuadro de Firma y Validación */}
            <div className="bg-forest-50/70 rounded-xl p-4 border border-forest-200 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-forest-900 mb-2">
                  Validación del Protocolo
                </h4>
                <p className="text-[11px] text-forest-700">
                  Este protocolo certifica la ejecución de buenas prácticas agronómicas y el cumplimiento de los estándares de bioeconomía y comercio justo ITEC.
                </p>
              </div>

              <div className="mt-4 pt-6 border-t border-forest-300/80 text-center">
                <div className="text-xs font-bold text-forest-900">
                  {responsable || "_________________________________"}
                </div>
                <div className="text-[10px] text-forest-600 uppercase font-semibold">
                  Firma del Responsable / Inspector ITEC
                </div>
                <div className="text-[10px] text-forest-500 mt-1">
                  Fecha: {fecha || "____ / ____ / ________"}
                </div>
              </div>
            </div>
          </div>

          {/* Pie de Página Oficial */}
          <footer className="mt-8 pt-4 border-t-2 border-forest-900 flex flex-col sm:flex-row items-center justify-between text-xs text-forest-700 gap-3">
            <div className="flex items-center space-x-2">
              <span className="font-serif font-bold text-forest-900 tracking-wider">
                VAINILLA
              </span>
              <span>—</span>
              <span className="italic text-forest-600">Tradición que genera futuro</span>
            </div>

            <div className="text-center sm:text-right">
              <span className="font-semibold text-forest-900">ITEC Ecuador</span>
              <span className="mx-1">·</span>
              <span className="text-[11px]">Innovación para un campo sostenible</span>
            </div>
          </footer>
        </div>
      </main>

      {/* Modal para ver la Lámina Original Escaneada de ITEC en Alta Definición */}
      {showOriginalModal && (
        <div
          onClick={() => setShowOriginalModal(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[94vh] overflow-hidden shadow-2xl flex flex-col border border-vanilla-300"
          >
            <div className="p-4 bg-forest-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-vanilla-200">
                  Lámina Original Institucional - ITEC Ecuador
                </h3>
                <p className="text-[11px] text-forest-200">
                  Listado Integral de Actividades: Cultivo de Vainilla en Invernadero
                </p>
              </div>
              <button
                onClick={() => setShowOriginalModal(false)}
                className="p-1.5 rounded-full hover:bg-forest-800 text-forest-200 hover:text-white transition-colors"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex-1 flex items-center justify-center bg-forest-950/95 overflow-auto min-h-[350px]">
              <img
                src="/assets/listado-actividades-referencia.jpg"
                alt="Listado Integral de Actividades ITEC"
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
              />
            </div>

            <div className="p-3 bg-vanilla-50 flex items-center justify-between border-t border-vanilla-200 text-xs">
              <span className="text-forest-700">
                Archivo oficial de referencia de procesos agronómicos
              </span>
              <div className="flex items-center space-x-2">
                <a
                  href="/assets/listado-actividades-referencia.jpg"
                  download="Listado_Actividades_Vainilla_ITEC.jpg"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-forest-900 hover:bg-forest-800 text-white text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-vanilla-400" />
                  <span>Descargar Imagen</span>
                </a>
                <button
                  onClick={() => setShowOriginalModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-vanilla-300 text-forest-800 text-xs font-medium hover:bg-white"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
