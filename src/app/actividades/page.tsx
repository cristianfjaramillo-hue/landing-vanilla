"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Printer,
  Download,
  CheckSquare,
  Square,
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
  ExternalLink,
  Save,
  Check,
  ShieldCheck,
  ArrowRight
} from "lucide-react";
import { SECTIONS_DATA, TOTAL_ACTIVIDADES_COUNT, RECOMENDACIONES_DATA } from "@/lib/actividades-data";
import { ActivityProtocol } from "@/lib/types";
import { generateActivityProtocolPDF } from "@/lib/pdf-generator";
import { supabase } from "@/lib/supabase";

export default function ActividadesPage() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [responsable, setResponsable] = useState("");
  const [fecha, setFecha] = useState("");
  const [lote, setLote] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccessProtocol, setSavedSuccessProtocol] = useState<ActivityProtocol | null>(null);
  const [lastSentProtocol, setLastSentProtocol] = useState<ActivityProtocol | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

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

  // Cálculos de progreso
  const totalItemsCount = TOTAL_ACTIVIDADES_COUNT;
  const completedItemsCount = Object.values(checkedItems).filter(Boolean).length;
  const progressPercentage = Math.round((completedItemsCount / totalItemsCount) * 100);

  // Guardar Envío / Protocolo (Se puede presionar una sola vez; al enviar se reinicia automáticamente)
  const handleSaveProtocol = async () => {
    if (isSaving || completedItemsCount === 0) return;
    setIsSaving(true);

    try {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const protocolId = `ACT-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

      const newProtocol: ActivityProtocol = {
        id: protocolId,
        created_at: now.toISOString(),
        fecha: fecha || now.toISOString().split("T")[0],
        lote: lote.trim() || "Invernadero Principal",
        responsable: responsable.trim() || "Técnico Agrónomo",
        observaciones: observaciones.trim(),
        checkedItems: { ...checkedItems },
        totalActividades: totalItemsCount,
        completadas: completedItemsCount,
        porcentaje: progressPercentage,
        tipo: "protocolo_actividades",
      };

      // 1. Guardar de inmediato en localStorage histórico (el más reciente primero)
      try {
        const rawSaved = localStorage.getItem("vanilla_saved_actividades");
        const existing: ActivityProtocol[] = rawSaved ? JSON.parse(rawSaved) : [];
        const updated = [newProtocol, ...existing.filter((p) => p.id !== newProtocol.id)];
        localStorage.setItem("vanilla_saved_actividades", JSON.stringify(updated));
      } catch (storageErr) {
        console.warn("Aviso guardando en localStorage:", storageErr);
      }

      // 2. Sincronizar en segundo plano en Supabase (sin bloquear ni congelar la pantalla)
      try {
        Promise.resolve(
          supabase.from("reportes_diarios").insert([
            {
              report_id: newProtocol.id,
              lote: newProtocol.lote,
              responsable: newProtocol.responsable,
              fecha_reporte: newProtocol.fecha,
              data: newProtocol,
            },
          ])
        )
          .then((res) => {
            if (res && (res as any).error) console.warn("Supabase sync notice:", (res as any).error);
          })
          .catch((dbErr) => {
            console.warn("Sincronización Supabase:", dbErr);
          });
      } catch (e) {
        console.warn("Supabase launch notice:", e);
      }

      // 3. REINICIAR Y LIMPIAR INMEDIATAMENTE TODO EL FORMULARIO (0 casillas marcadas)
      setCheckedItems({});
      setResponsable("");
      setLote("");
      setObservaciones("");
      setFecha(now.toISOString().split("T")[0]);

      // Purgar claves de cache temporal en localStorage
      try {
        localStorage.removeItem("vanilla_actividades_checked");
        localStorage.removeItem("vanilla_actividades_responsable");
        localStorage.removeItem("vanilla_actividades_lote");
        localStorage.removeItem("vanilla_actividades_obs");
        localStorage.removeItem("vanilla_actividades_fecha");
      } catch (e) {
        // Ignore
      }

      // 4. Activar banner informativo y modal de confirmación
      setLastSentProtocol(newProtocol);
      setShowSuccessToast(true);
      setSavedSuccessProtocol(newProtocol);

      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      console.error("Error al guardar protocolo:", err);
      alert("Error al procesar el guardado.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = async (protocol: ActivityProtocol) => {
    try {
      await generateActivityProtocolPDF(protocol);
    } catch (err) {
      console.error("Error generando PDF:", err);
      alert("Error al generar el PDF del protocolo.");
    }
  };

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
      <div className="print:hidden sticky top-0 z-40 bg-forest-900/95 backdrop-blur-md text-white border-b border-vanilla-600/30 px-3 sm:px-4 py-2.5 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="text-xs text-vanilla-300 hover:text-white flex items-center space-x-1"
            >
              <span>← Inicio</span>
            </Link>
            <span className="text-forest-400">|</span>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-white hidden md:inline">Progreso:</span>
              <div className="w-24 sm:w-36 bg-forest-950 rounded-full h-2.5 overflow-hidden border border-forest-700">
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
            {/* Botón Principal Guardar Envío (Solo activo si hay actividades marcadas; se presiona una sola vez) */}
            <button
              onClick={handleSaveProtocol}
              disabled={isSaving || completedItemsCount === 0}
              className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-md transition-all ${
                isSaving || completedItemsCount === 0
                  ? "bg-forest-800 text-forest-400 cursor-not-allowed opacity-60"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95 cursor-pointer"
              }`}
              title={
                completedItemsCount === 0
                  ? "Marca al menos una actividad para poder enviar"
                  : "Guardar este protocolo (se reiniciará el formulario automáticamente)"
              }
            >
              <Save className="w-3.5 h-3.5" />
              <span>
                {isSaving
                  ? "Enviando..."
                  : completedItemsCount === 0
                  ? "Guardar Envío"
                  : `Guardar Envío (${completedItemsCount})`}
              </span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-vanilla-500 hover:bg-vanilla-600 text-forest-950 text-xs font-bold shadow transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <Link
              href="/admin"
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-forest-800/80 hover:bg-forest-700 text-forest-200 hover:text-white text-xs border border-forest-700"
              title="Ir al Panel de Administración"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-vanilla-400" />
              <span className="hidden md:inline">Admin</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Contenedor Principal (Formato Lámina Técnica) */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-4 sm:mt-6">
        <div className="bg-white rounded-2xl shadow-xl border border-vanilla-300 p-4 sm:p-8 print:shadow-none print:border-none print:p-0">
          {/* Banner de Éxito y Reinicio Automático */}
          {showSuccessToast && lastSentProtocol && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border-2 border-emerald-500 text-forest-950 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-950 flex items-center space-x-2">
                    <span>¡Envío Registrado con Éxito! Formulario Reiniciado</span>
                    <span className="font-mono text-[11px] font-semibold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded">
                      {lastSentProtocol.id}
                    </span>
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Se guardaron <strong>{lastSentProtocol.completadas}</strong> actividades del lote <em>{lastSentProtocol.lote}</em>. Todas las casillas han quedado desmarcadas para un nuevo envío.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(lastSentProtocol)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSuccessToast(false)}
                  className="p-1.5 text-emerald-700 hover:text-emerald-950 rounded-lg hover:bg-emerald-100 transition-colors"
                  title="Cerrar aviso"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

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

            {/* Cuadro Adicional: Recomendaciones (Sin checklist, con puntos distintivos) */}
            <div className="md:col-span-2 lg:col-span-3 rounded-xl border border-forest-900/30 bg-white hover:border-forest-800 transition-all shadow-sm overflow-hidden flex flex-col">
              {/* Encabezado del Cuadro */}
              <div className="bg-forest-900 text-white p-3 flex items-center justify-between border-b-2 border-vanilla-500">
                <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-vanilla-500 text-forest-950 font-bold text-xs flex items-center justify-center flex-shrink-0 shadow">
                    ★
                  </span>
                  <div>
                    <h3 className="text-xs sm:text-[13px] font-bold text-vanilla-200 uppercase tracking-tight truncate leading-snug">
                      RECOMENDACIONES
                    </h3>
                  </div>
                </div>
                <div className="px-2.5 py-0.5 rounded bg-forest-800 text-vanilla-300 text-[10px] font-semibold border border-forest-700 uppercase tracking-wider">
                  Directrices Técnicas • Sin Checklist
                </div>
              </div>

              {/* Sub-barra informativa */}
              <div className="bg-forest-950/90 px-3 py-1 flex items-center justify-between text-[11px] text-forest-200">
                <span>
                  Total: <strong>{RECOMENDACIONES_DATA.length}</strong> directrices esenciales de manejo agronómico y bioseguridad
                </span>
                <span className="text-vanilla-300 text-[10px] font-medium hidden sm:inline">
                  Supervisión ITEC Ecuador
                </span>
              </div>

              {/* Lista de Recomendaciones con Punto Distintivo */}
              <div className="p-4 bg-gradient-to-b from-[#FAF7F2] to-white grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 flex-1">
                {RECOMENDACIONES_DATA.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start space-x-2.5 p-2 rounded-lg bg-white border border-vanilla-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-forest-600 transition-all"
                  >
                    {/* Punto distintivo */}
                    <div className="w-4 h-4 rounded-full border border-forest-800 bg-vanilla-400 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-forest-950" />
                    </div>
                    <span className="text-xs font-semibold text-forest-950 leading-snug">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
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
                placeholder="Anota aquí cualquier condición climática atípica, observaciones fitosanitarias, requerimientos de insumos o instrucciones específicas para las cuadrillas..."
                className="w-full p-2.5 text-xs bg-white border border-vanilla-300 rounded-lg text-forest-950 focus:outline-none focus:border-forest-800"
              />
            </div>

            {/* Cuadro de Firma, Validación y Botón Guardar */}
            <div className="bg-forest-50/70 rounded-xl p-4 border border-forest-200 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-forest-900 mb-2">
                  Validación del Protocolo
                </h4>
                <p className="text-[11px] text-forest-700">
                  Este protocolo certifica la ejecución de buenas prácticas agronómicas y el cumplimiento de los estándares de bioeconomía y comercio justo ITEC.
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-forest-300/80 text-center">
                <div className="text-xs font-bold text-forest-900">
                  {responsable || "_________________________________"}
                </div>
                <div className="text-[10px] text-forest-600 uppercase font-semibold">
                  Firma del Responsable / Inspector ITEC
                </div>
                <div className="text-[10px] text-forest-500 mt-1">
                  Fecha: {fecha || "____ / ____ / ________"}
                </div>

                <button
                  type="button"
                  onClick={handleSaveProtocol}
                  disabled={isSaving || completedItemsCount === 0}
                  className={`w-full mt-4 py-3 px-4 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center space-x-2 print:hidden ${
                    isSaving || completedItemsCount === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-300"
                      : "bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer active:scale-95 shadow-lg hover:shadow-xl"
                  }`}
                  title={
                    completedItemsCount === 0
                      ? "Debes marcar al menos una actividad para poder enviar"
                      : "Presiona una sola vez para enviar; el formulario se reiniciará automáticamente"
                  }
                >
                  <Save className={`w-4 h-4 ${completedItemsCount === 0 ? "text-gray-400" : "text-vanilla-300"}`} />
                  <span>
                    {isSaving
                      ? "Enviando y Reiniciando..."
                      : completedItemsCount === 0
                      ? "Marca actividades para enviar"
                      : `Guardar Envío de Actividades (${completedItemsCount})`}
                  </span>
                </button>
                {completedItemsCount > 0 && !isSaving && (
                  <p className="text-[10px] text-forest-600 mt-1.5 italic">
                    * Al presionar, se guardará y el formulario se reiniciará automáticamente (un solo envío).
                  </p>
                )}
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

      {/* Modal de Confirmación de Guardado Exitoso */}
      {savedSuccessProtocol && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-vanilla-300 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div>
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-forest-900 text-vanilla-300">
                {savedSuccessProtocol.id}
              </span>
              <h3 className="text-xl font-serif font-bold text-forest-950 mt-2">
                ¡Protocolo Guardado Exitosamente!
              </h3>
              <p className="text-xs text-forest-600 mt-1">
                El envío ha sido registrado en el sistema histórico y sincronizado con el repositorio institucional.
              </p>
            </div>

            <div className="bg-vanilla-50 p-3.5 rounded-xl border border-vanilla-200 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-forest-600">Fecha:</span>
                <span className="font-bold text-forest-900">{savedSuccessProtocol.fecha}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-forest-600">Invernadero / Lote:</span>
                <span className="font-bold text-forest-900">{savedSuccessProtocol.lote}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-forest-600">Responsable:</span>
                <span className="font-bold text-forest-900">{savedSuccessProtocol.responsable}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-forest-600">Actividades completadas:</span>
                <span className="font-bold text-emerald-700">
                  {savedSuccessProtocol.completadas} de {savedSuccessProtocol.totalActividades} ({savedSuccessProtocol.porcentaje}%)
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <button
                onClick={() => handleDownloadPdf(savedSuccessProtocol)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-forest-900 hover:bg-forest-800 text-white text-xs font-bold shadow flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Download className="w-4 h-4 text-vanilla-400" />
                <span>Descargar PDF</span>
              </button>

              <Link
                href="/admin"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-vanilla-500 hover:bg-vanilla-600 text-forest-950 text-xs font-bold shadow flex items-center justify-center space-x-1.5 transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Ver en Administrador</span>
              </Link>

              <button
                onClick={() => setSavedSuccessProtocol(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-vanilla-300 hover:bg-vanilla-50 text-forest-800 text-xs font-semibold transition-colors"
                title="Cerrar y continuar con el formulario limpio"
              >
                Nuevo Envío / Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
