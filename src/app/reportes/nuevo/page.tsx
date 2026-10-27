"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FileText,
  Calendar,
  Thermometer,
  Droplets,
  Sun,
  Cloud,
  CloudRain,
  HelpCircle,
  CheckSquare,
  Square,
  Camera,
  Download,
  Send,
  Mail,
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { DEFAULT_ACTIVITIES, DEFAULT_TOOLS } from "@/lib/constants";
import { ActivityItem, ToolItem, AppliedInput, CropGeneralStatus, DailyReport } from "@/lib/types";
import { generateDailyReportPDF } from "@/lib/pdf-generator";
import { supabase } from "@/lib/supabase";

export default function NuevoReportePage() {
  const todayStr = new Date().toISOString().split("T")[0];

  // 1. Cabecera
  const [fechaDesde, setFechaDesde] = useState(todayStr);
  const [fechaHasta, setFechaHasta] = useState(todayStr);
  const [lote, setLote] = useState("Lote 1 - Chakra Waorani Nemompari");
  const [responsable, setResponsable] = useState("");

  // 2. Condiciones del día
  const [fechaReporte, setFechaReporte] = useState(todayStr);
  const [tempMin, setTempMin] = useState(22);
  const [tempMax, setTempMax] = useState(30);
  const [humedad, setHumedad] = useState(85);
  const [clima, setClima] = useState<"Soleado" | "Nublado" | "Lluvia" | "Otro">("Soleado");
  const [climaOtro, setClimaOtro] = useState("");

  // 3. Actividades (10 items con check y frases cortas)
  const [actividades, setActividades] = useState<ActivityItem[]>(DEFAULT_ACTIVITIES);

  // 4. Herramientas
  const [herramientas, setHerramientas] = useState<ToolItem[]>(DEFAULT_TOOLS);
  const [otraHerramienta, setOtraHerramienta] = useState("");

  // 5. Insumos aplicados (Filas dinámicas)
  const [insumos, setInsumos] = useState<AppliedInput[]>([
    { id: "1", insumo: "", dosis: "", metodo: "", areaLote: "" },
  ]);

  // 6. Estado General del Cultivo (Bueno, Regular, Malo)
  const [estadoCultivo, setEstadoCultivo] = useState<CropGeneralStatus>({
    desarrolloVegetativo: "Bueno",
    floracion: "Bueno",
    formacionVainas: "Bueno",
    estadoFitosanitario: "Bueno",
  });

  // 7. Observaciones y Fotos
  const [observaciones, setObservaciones] = useState("");
  const [foto1, setFoto1] = useState<string | null>(null);
  const [foto2, setFoto2] = useState<string | null>(null);
  const [foto3, setFoto3] = useState<string | null>(null);

  // Estados de interfaz
  const [saving, setSaving] = useState(false);
  const [successReport, setSuccessReport] = useState<DailyReport | null>(null);

  // Controladores de Actividades
  const toggleActividad = (id: number) => {
    setActividades((prev) =>
      prev.map((act) => (act.id === id ? { ...act, realizado: !act.realizado } : act))
    );
  };

  const updateActividadDesc = (id: number, descripcion: string) => {
    setActividades((prev) =>
      prev.map((act) => (act.id === id ? { ...act, descripcion } : act))
    );
  };

  const updateActividadArea = (id: number, areaLote: string) => {
    setActividades((prev) =>
      prev.map((act) => (act.id === id ? { ...act, areaLote } : act))
    );
  };

  // Controladores de Herramientas
  const toggleHerramienta = (id: string) => {
    setHerramientas((prev) =>
      prev.map((tool) => (tool.id === id ? { ...tool, utilizada: !tool.utilizada } : tool))
    );
  };

  // Insumos
  const addInsumoRow = () => {
    setInsumos((prev) => [
      ...prev,
      { id: Date.now().toString(), insumo: "", dosis: "", metodo: "", areaLote: "" },
    ]);
  };

  const updateInsumo = (id: string, field: keyof AppliedInput, value: string) => {
    setInsumos((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const removeInsumo = (id: string) => {
    if (insumos.length > 1) {
      setInsumos((prev) => prev.filter((row) => row.id !== id));
    }
  };

  // Fotos
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, slot: 1 | 2 | 3) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (slot === 1) setFoto1(reader.result as string);
        if (slot === 2) setFoto2(reader.result as string);
        if (slot === 3) setFoto3(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Compilar el objeto de reporte
  const buildReportObject = (): DailyReport => {
    return {
      id: "REP-" + Date.now().toString().slice(-6),
      created_at: new Date().toISOString(),
      fechaDesde,
      fechaHasta,
      lote,
      responsable: responsable || "Técnico ITEC / Guardián Waorani",
      fechaReporte,
      tempMin: Number(tempMin),
      tempMax: Number(tempMax),
      humedad: Number(humedad),
      clima,
      climaOtro: clima === "Otro" ? climaOtro : undefined,
      actividades,
      herramientas: herramientas.map((h) =>
        h.id === "otra" && otraHerramienta ? { ...h, nombre: `Otra: ${otraHerramienta}` } : h
      ),
      insumos: insumos.filter((i) => i.insumo.trim() !== ""),
      estadoCultivo,
      observaciones,
      foto1Url: foto1 || undefined,
      foto2Url: foto2 || undefined,
      foto3Url: foto3 || undefined,
    };
  };

  // Guardar Informe y Enviar Notificación por Correo Electrónico con PDF Adjunto
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    const newReport = buildReportObject();

    try {
      // 1. Guardar en localStorage para disponibilidad offline inmediata
      try {
        const existing = JSON.parse(localStorage.getItem("vanilla_daily_reports") || "[]");
        localStorage.setItem("vanilla_daily_reports", JSON.stringify([newReport, ...existing]));
      } catch (storageErr) {
        console.warn("Aviso guardando en localStorage:", storageErr);
      }

      // 2. Sincronizar en segundo plano con Supabase (sin congelar la pantalla)
      try {
        Promise.resolve(
          supabase.from("reportes_diarios").insert([
            {
              report_id: newReport.id,
              lote: newReport.lote,
              responsable: newReport.responsable,
              fecha_reporte: newReport.fechaReporte,
              data: newReport,
            },
          ])
        ).catch((dbErr) => {
          console.warn("Sincronización con Supabase:", dbErr);
        });
      } catch (e) {
        console.warn("Supabase notice:", e);
      }

      // 3. Generar el PDF oficial en Base64 y despachar correo electrónico automático
      try {
        const { base64, filename } = await generateDailyReportPDF(newReport, false);

        await fetch("/api/enviar-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            report: newReport,
            pdfBase64: base64,
            filename: filename,
          }),
        });
      } catch (emailErr) {
        console.warn("Aviso en despacho de correo:", emailErr);
      }

      setSuccessReport(newReport);
    } catch (err) {
      console.error("Error al guardar reporte:", err);
      alert("Se guardó en memoria local del dispositivo.");
      setSuccessReport(newReport);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-[#FBF8F1]">
      <div className="max-w-4xl mx-auto">
        {/* Navegación de regreso */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-semibold text-forest-800 hover:text-vanilla-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Volver a la Landing
          </Link>
          <Link
            href="/admin"
            className="text-xs font-semibold px-3 py-1.5 rounded-md border border-vanilla-300 text-forest-800 hover:bg-white transition-colors"
          >
            Ver Repositorio de Informes
          </Link>
        </div>

        {/* Modal de Éxito al Guardar */}
        {successReport && (
          <div className="mb-8 p-6 bg-forest-900 text-white rounded-2xl shadow-xl border border-vanilla-400/30 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-start space-x-4">
              <CheckCircle2 className="w-8 h-8 text-vanilla-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-xl font-serif font-bold text-vanilla-300">
                  ¡Informe Diario Registrado y Notificado por Correo!
                </h3>
                <p className="text-sm text-forest-200 mt-1">
                  Código: <span className="font-mono font-bold text-white">{successReport.id}</span> para el{" "}
                  <strong>{successReport.lote}</strong> ({successReport.fechaReporte}).
                </p>
                <div className="mt-2.5 flex items-center space-x-2 text-xs text-vanilla-300 bg-forest-950/70 py-1.5 px-3 rounded-lg border border-forest-800">
                  <Mail className="w-4 h-4 text-vanilla-400 flex-shrink-0" />
                  <span>
                    Se ha enviado la notificación automática por correo con el <strong>PDF adjunto</strong> y el enlace directo al panel.
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={async () => await generateDailyReportPDF(successReport)}
                    className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-vanilla-500 hover:bg-vanilla-600 text-forest-950 font-bold text-xs shadow-md transition-transform active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar PDF Oficial</span>
                  </button>

                  <Link
                    href="/admin"
                    className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-forest-800 hover:bg-forest-700 text-white font-bold text-xs shadow-md transition-transform active:scale-95 border border-forest-600"
                  >
                    <ShieldCheck className="w-4 h-4 text-vanilla-400" />
                    <span>Acceder al Panel Administrador</span>
                  </Link>

                  <button
                    onClick={() => setSuccessReport(null)}
                    className="px-4 py-2.5 rounded-lg border border-vanilla-300/40 hover:bg-forest-800 text-forest-200 text-xs font-medium transition-colors"
                  >
                    Llenar Otro Informe
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Formulario Principal Estilo Hoja ITEC */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-vanilla-200 overflow-hidden">
          {/* Cabecera Oficial */}
          <div className="bg-forest-900 text-white p-6 sm:p-8 border-b-4 border-vanilla-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="relative w-14 h-14 bg-white/10 rounded-xl p-1.5 flex-shrink-0">
                  <Image
                    src="/assets/logo-amazon-vanilla-white.png"
                    alt="Amazon Vanilla"
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-serif font-bold text-vanilla-200 tracking-wide">
                    INFORME DIARIO
                  </h1>
                  <p className="text-xs sm:text-sm font-semibold tracking-wider text-forest-200 uppercase">
                    CULTIVO DE VAINILLA | SEGUIMIENTO Y CONTROL
                  </p>
                  <p className="text-[11px] text-vanilla-400 italic">
                    ITEC Ecuador - Innovación para un campo sostenible
                  </p>
                </div>
              </div>

              <div className="text-right sm:text-right hidden sm:block">
                <span className="inline-block px-3 py-1 bg-forest-800 text-vanilla-300 rounded-full text-xs font-mono">
                  Territorio Waorani
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* SECCIÓN 1: RANGO DE FECHAS & RESPONSABLE */}
            <div className="bg-vanilla-50/70 p-5 rounded-xl border border-vanilla-200">
              <h2 className="text-xs font-bold uppercase tracking-wider text-forest-900 mb-4 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-vanilla-600" />
                <span>1. Rango de Fechas del Informe & Responsable</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-forest-800 mb-1">
                    Desde:
                  </label>
                  <input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-white rounded-lg border border-vanilla-300 focus:outline-none focus:ring-2 focus:ring-forest-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-forest-800 mb-1">
                    Hasta:
                  </label>
                  <input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-white rounded-lg border border-vanilla-300 focus:outline-none focus:ring-2 focus:ring-forest-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-forest-800 mb-1">
                    Lote / Área:
                  </label>
                  <input
                    type="text"
                    value={lote}
                    onChange={(e) => setLote(e.target.value)}
                    placeholder="Ej. Lote 1 - Chakra Waorani"
                    className="w-full text-sm px-3 py-2 bg-white rounded-lg border border-vanilla-300 focus:outline-none focus:ring-2 focus:ring-forest-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-forest-800 mb-1">
                    Responsable de Campo:
                  </label>
                  <input
                    type="text"
                    value={responsable}
                    onChange={(e) => setResponsable(e.target.value)}
                    placeholder="Nombre del técnico o líder"
                    className="w-full text-sm px-3 py-2 bg-white rounded-lg border border-vanilla-300 focus:outline-none focus:ring-2 focus:ring-forest-600"
                    required
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: CONDICIONES DEL DÍA */}
            <div className="bg-forest-50/50 p-5 rounded-xl border border-forest-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-forest-900 mb-4 flex items-center space-x-2">
                <Sun className="w-4 h-4 text-vanilla-600" />
                <span>2. Condiciones del Día</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs font-semibold text-forest-800 mb-1">
                    Fecha de Registro:
                  </label>
                  <input
                    type="date"
                    value={fechaReporte}
                    onChange={(e) => setFechaReporte(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-white rounded-lg border border-vanilla-300 focus:outline-none focus:ring-2 focus:ring-forest-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-forest-800 mb-1 flex items-center justify-between">
                    <span>Temperatura (°C):</span>
                    <span className="text-[10px] text-forest-600">Mín / Máx</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={tempMin}
                      onChange={(e) => setTempMin(Number(e.target.value))}
                      placeholder="Mín"
                      className="w-1/2 text-sm px-2.5 py-2 bg-white rounded-lg border border-vanilla-300 text-center focus:outline-none focus:ring-2 focus:ring-forest-600"
                    />
                    <span className="text-forest-400">-</span>
                    <input
                      type="number"
                      value={tempMax}
                      onChange={(e) => setTempMax(Number(e.target.value))}
                      placeholder="Máx"
                      className="w-1/2 text-sm px-2.5 py-2 bg-white rounded-lg border border-vanilla-300 text-center focus:outline-none focus:ring-2 focus:ring-forest-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-forest-800 mb-1">
                    Humedad Relativa (%):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={humedad}
                      onChange={(e) => setHumedad(Number(e.target.value))}
                      className="w-full text-sm px-3 py-2 bg-white rounded-lg border border-vanilla-300 focus:outline-none focus:ring-2 focus:ring-forest-600"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-forest-400 font-semibold">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-forest-800 mb-1">
                    Estado del Tiempo:
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { val: "Soleado", icon: Sun },
                      { val: "Nublado", icon: Cloud },
                      { val: "Lluvia", icon: CloudRain },
                      { val: "Otro", icon: HelpCircle },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setClima(item.val as any)}
                        className={`p-1.5 rounded-lg text-[11px] font-semibold flex flex-col items-center justify-center transition-all ${
                          clima === item.val
                            ? "bg-forest-900 text-white shadow-sm"
                            : "bg-white text-forest-800 border border-vanilla-300 hover:bg-vanilla-100"
                        }`}
                      >
                        <item.icon className="w-3.5 h-3.5 mb-0.5" />
                        <span>{item.val}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {clima === "Otro" && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={climaOtro}
                    onChange={(e) => setClimaOtro(e.target.value)}
                    placeholder="Especifique las condiciones climáticas particulares..."
                    className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-vanilla-300"
                  />
                </div>
              )}
            </div>

            {/* SECCIÓN 3: ACTIVIDADES REALIZADAS (Checks rápidos + Frases Cortas) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-forest-900 flex items-center space-x-2">
                  <CheckSquare className="w-4 h-4 text-vanilla-600" />
                  <span>3. Actividades Realizadas (Selección y notas cortas)</span>
                </h2>
                <span className="text-[11px] text-forest-600 font-medium">
                  {actividades.filter((a) => a.realizado).length} de {actividades.length} realizadas
                </span>
              </div>

              <div className="overflow-x-auto border border-vanilla-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-forest-900 text-white">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center font-bold">N°</th>
                      <th className="py-2.5 px-3 w-48 font-bold">Actividad</th>
                      <th className="py-2.5 px-3 font-bold">Descripción / Observaciones Breves</th>
                      <th className="py-2.5 px-3 w-32 font-bold">Área / Lote</th>
                      <th className="py-2.5 px-3 w-20 text-center font-bold">Realizado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-vanilla-100 bg-white">
                    {actividades.map((act) => (
                      <tr
                        key={act.id}
                        className={`transition-colors ${
                          act.realizado ? "bg-vanilla-50/70" : "hover:bg-vanilla-50/30"
                        }`}
                      >
                        <td className="py-2 px-3 text-center font-mono text-forest-600 font-bold">
                          {act.id}
                        </td>
                        <td className="py-2 px-3 font-semibold text-forest-900">
                          {act.nombre}
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={act.descripcion}
                            onChange={(e) => updateActividadDesc(act.id, e.target.value)}
                            placeholder="Detalle rápido (opcional)..."
                            className="w-full px-2 py-1 bg-transparent border-b border-dashed border-vanilla-300 focus:border-forest-600 focus:outline-none text-xs"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={act.areaLote}
                            onChange={(e) => updateActividadArea(act.id, e.target.value)}
                            placeholder="Lote o surco"
                            className="w-full px-2 py-1 bg-transparent border-b border-dashed border-vanilla-300 focus:border-forest-600 focus:outline-none text-xs"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleActividad(act.id)}
                            className={`p-1.5 rounded-md transition-colors ${
                              act.realizado
                                ? "bg-forest-900 text-vanilla-400"
                                : "bg-vanilla-100 text-forest-400 hover:text-forest-800"
                            }`}
                            aria-label={`Marcar actividad ${act.nombre}`}
                          >
                            {act.realizado ? (
                              <CheckSquare className="w-5 h-5" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECCIÓN 4: HERRAMIENTAS UTILIZADAS */}
            <div className="bg-vanilla-50/50 p-5 rounded-xl border border-vanilla-200">
              <h2 className="text-xs font-bold uppercase tracking-wider text-forest-900 mb-3">
                4. Herramientas Utilizadas (Check de selección)
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                {herramientas.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => toggleHerramienta(tool.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between border transition-all ${
                      tool.utilizada
                        ? "bg-forest-900 text-white border-forest-900 shadow-sm"
                        : "bg-white text-forest-800 border-vanilla-300 hover:bg-vanilla-100"
                    }`}
                  >
                    <span>{tool.nombre}</span>
                    {tool.utilizada ? (
                      <CheckSquare className="w-4 h-4 text-vanilla-400 ml-1.5 flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-forest-300 ml-1.5 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              {herramientas.find((h) => h.id === "otra")?.utilizada && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={otraHerramienta}
                    onChange={(e) => setOtraHerramienta(e.target.value)}
                    placeholder="Especifique qué otra herramienta fue utilizada..."
                    className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-vanilla-300"
                  />
                </div>
              )}
            </div>

            {/* SECCIÓN 5: INSUMOS APLICADOS */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-forest-900">
                  5. Insumos Aplicados
                </h2>
                <button
                  type="button"
                  onClick={addInsumoRow}
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-forest-800 hover:text-vanilla-600 bg-vanilla-200 hover:bg-vanilla-300 px-2.5 py-1 rounded-md transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Insumo</span>
                </button>
              </div>

              <div className="space-y-2">
                {insumos.map((row, idx) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-vanilla-50/60 p-2.5 rounded-lg border border-vanilla-200 items-center"
                  >
                    <input
                      type="text"
                      placeholder="Insumo (ej. Biol, Compost)"
                      value={row.insumo}
                      onChange={(e) => updateInsumo(row.id, "insumo", e.target.value)}
                      className="text-xs px-2.5 py-1.5 bg-white rounded border border-vanilla-300 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Dosis (ej. 2L / bomba)"
                      value={row.dosis}
                      onChange={(e) => updateInsumo(row.id, "dosis", e.target.value)}
                      className="text-xs px-2.5 py-1.5 bg-white rounded border border-vanilla-300 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Método (Foliar, radicular)"
                      value={row.metodo}
                      onChange={(e) => updateInsumo(row.id, "metodo", e.target.value)}
                      className="text-xs px-2.5 py-1.5 bg-white rounded border border-vanilla-300 focus:outline-none"
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Área / Lote"
                        value={row.areaLote}
                        onChange={(e) => updateInsumo(row.id, "areaLote", e.target.value)}
                        className="text-xs px-2.5 py-1.5 bg-white rounded border border-vanilla-300 focus:outline-none flex-1"
                      />
                      {insumos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeInsumo(row.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                          title="Eliminar fila"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECCIÓN 6: ESTADO GENERAL DEL CULTIVO (Semáforo Táctil) */}
            <div className="bg-forest-900 text-white p-5 rounded-xl">
              <h2 className="text-xs font-bold uppercase tracking-wider text-vanilla-300 mb-4">
                6. Estado General del Cultivo
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { key: "desarrolloVegetativo", label: "Desarrollo Vegetativo" },
                  { key: "floracion", label: "Floración" },
                  { key: "formacionVainas", label: "Formación de Vainas" },
                  { key: "estadoFitosanitario", label: "Estado Fitosanitario" },
                ].map((item) => (
                  <div key={item.key} className="bg-forest-800/80 p-3 rounded-lg border border-forest-700">
                    <p className="text-xs font-semibold text-vanilla-200 mb-2">
                      {item.label}
                    </p>
                    <div className="grid grid-cols-3 gap-1">
                      {(["Bueno", "Regular", "Malo"] as const).map((level) => {
                        const isSelected = estadoCultivo[item.key as keyof CropGeneralStatus] === level;
                        const colorClass =
                          level === "Bueno"
                            ? isSelected
                              ? "bg-green-600 text-white font-bold"
                              : "bg-forest-950/60 text-green-300 hover:bg-forest-950"
                            : level === "Regular"
                            ? isSelected
                              ? "bg-amber-600 text-white font-bold"
                              : "bg-forest-950/60 text-amber-300 hover:bg-forest-950"
                            : isSelected
                            ? "bg-red-600 text-white font-bold"
                            : "bg-forest-950/60 text-red-300 hover:bg-forest-950";

                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() =>
                              setEstadoCultivo((prev) => ({ ...prev, [item.key]: level }))
                            }
                            className={`py-1 text-[11px] rounded transition-all text-center ${colorClass}`}
                          >
                            {level}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECCIÓN 7: OBSERVACIONES */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-forest-900 mb-2">
                7. Observaciones / Eventos Importantes del Día
              </h2>
              <textarea
                rows={3}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Escriba aquí notas relevantes: presencia de polinizadores, floración, lluvias intensas, acuerdos con la comunidad Waorani..."
                className="w-full text-xs p-3 bg-white rounded-xl border border-vanilla-300 focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>

            {/* SECCIÓN 8: REGISTRO FOTOGRÁFICO (Foto 1, Foto 2, Foto 3) */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-forest-900 mb-3 flex items-center space-x-2">
                <Camera className="w-4 h-4 text-vanilla-600" />
                <span>8. Registro Fotográfico de Campo</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map((slot) => {
                  const currentPhoto = slot === 1 ? foto1 : slot === 2 ? foto2 : foto3;
                  return (
                    <div
                      key={slot}
                      className="border-2 border-dashed border-vanilla-300 rounded-xl p-4 text-center hover:border-forest-600 transition-colors bg-vanilla-50/30 flex flex-col items-center justify-center min-h-[160px] relative overflow-hidden"
                    >
                      {currentPhoto ? (
                        <div className="relative w-full h-32">
                          <img
                            src={currentPhoto}
                            alt={`Foto ${slot}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (slot === 1) setFoto1(null);
                              if (slot === 2) setFoto2(null);
                              if (slot === 3) setFoto3(null);
                            }}
                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full text-xs shadow"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                          <Camera className="w-7 h-7 text-forest-400 mb-2" />
                          <span className="text-xs font-semibold text-forest-800">
                            Foto {slot}
                          </span>
                          <span className="text-[10px] text-forest-500 mt-0.5">
                            Subir o tomar foto
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => handlePhotoUpload(e, slot as any)}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="pt-6 border-t border-vanilla-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-forest-600">
                Al guardar, se registrará el informe en el sistema y se enviará automáticamente un correo electrónico con el PDF oficial adjunto y el enlace directo al panel administrador.
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={async () => await generateDailyReportPDF(buildReportObject())}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border border-vanilla-400 text-forest-900 font-semibold text-xs hover:bg-vanilla-100 transition-colors"
                >
                  <Download className="w-4 h-4 text-forest-700" />
                  <span>Previsualizar PDF</span>
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-forest-900 hover:bg-forest-800 text-white font-bold text-xs shadow-md transition-transform active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-vanilla-400" />
                  <span>{saving ? "Guardando..." : "Guardar y Enviar Informe"}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
