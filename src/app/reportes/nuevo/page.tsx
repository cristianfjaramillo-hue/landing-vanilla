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
  Plus,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  ChevronDown,
  Layers,
} from "lucide-react";
import { DEFAULT_ACTIVITIES, DEFAULT_TOOLS } from "@/lib/constants";
import { ActivityItem, ToolItem, AppliedInput, DailyReport } from "@/lib/types";
import { generateDailyReportPDF } from "@/lib/pdf-generator";
import { supabase } from "@/lib/supabase";

const AREAS_DISPONIBLES = [
  "INVERNADERO N°1",
  "INVERNADERO N°2",
  "INVERNADERO N°3",
  "INVERNADERO N°4",
  "INVERNADERO N°5",
  "CHACRA CACAO",
  "CHACRA VAINILLA",
] as const;

const RESPONSABLES_AUTORIZADOS = [
  "GUIMARE",
  "FELIPE",
  "PEGO",
  "DORE",
  "CINDY",
  "GEMENCA",
] as const;

export default function NuevoReportePage() {
  const todayStr = new Date().toISOString().split("T")[0];

  // 1. Cabecera (Área y Responsable seleccionables)
  const [area, setArea] = useState<string>("INVERNADERO N°1");
  const [responsable, setResponsable] = useState<string>("GUIMARE");

  // 2. Condiciones Diarias (Temperatura única)
  const [temperatura, setTemperatura] = useState<number | string>(26);
  const [humedad, setHumedad] = useState<number | string>(85);
  const [clima, setClima] = useState<"Soleado" | "Nublado" | "Lluvia" | "Otro">("Soleado");
  const [climaOtro, setClimaOtro] = useState("");

  // Condiciones del Terreno
  const [alcalinidad, setAlcalinidad] = useState<number | string>("");

  // 3. Actividades (19 items con check y notas cortas)
  const [actividades, setActividades] = useState<ActivityItem[]>(DEFAULT_ACTIVITIES);

  // 4. Herramientas
  const [herramientas, setHerramientas] = useState<ToolItem[]>(DEFAULT_TOOLS);
  const [otraHerramienta, setOtraHerramienta] = useState("");

  // 5. Insumos aplicados (Filas dinámicas)
  const [insumos, setInsumos] = useState<AppliedInput[]>([
    { id: "1", insumo: "", dosis: "", metodo: "", areaLote: "" },
  ]);

  // 6. Observaciones y Fotos
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

  // Reiniciar formulario completo borrando todo dato ingresado
  const resetForm = () => {
    setArea("INVERNADERO N°1");
    setResponsable("GUIMARE");
    setTemperatura(26);
    setHumedad(85);
    setClima("Soleado");
    setClimaOtro("");
    setAlcalinidad("");
    setActividades(DEFAULT_ACTIVITIES);
    setHerramientas(DEFAULT_TOOLS);
    setOtraHerramienta("");
    setInsumos([{ id: "1", insumo: "", dosis: "", metodo: "", areaLote: "" }]);
    setObservaciones("");
    setFoto1(null);
    setFoto2(null);
    setFoto3(null);
  };

  // Compilar el objeto de reporte
  const buildReportObject = (): DailyReport => {
    const tempVal = temperatura !== "" && !isNaN(Number(temperatura)) ? Number(temperatura) : 26;
    return {
      id: "REP-" + Date.now().toString().slice(-6),
      created_at: new Date().toISOString(),
      area,
      lote: area,
      responsable: responsable.trim() || "GUIMARE",
      fechaReporte: todayStr,
      fechaDesde: todayStr,
      fechaHasta: todayStr,
      temperatura: tempVal,
      tempMin: tempVal,
      tempMax: tempVal,
      humedad: humedad !== "" && !isNaN(Number(humedad)) ? Number(humedad) : 85,
      clima,
      climaOtro: clima === "Otro" ? climaOtro : undefined,
      alcalinidad: alcalinidad !== "" ? alcalinidad : undefined,
      actividades,
      herramientas: herramientas.map((h) =>
        h.id === "otra" && otraHerramienta ? { ...h, nombre: `Otra: ${otraHerramienta}` } : h
      ),
      insumos: insumos.filter((i) => i.insumo.trim() !== ""),
      observaciones,
      foto1Url: foto1 || undefined,
      foto2Url: foto2 || undefined,
      foto3Url: foto3 || undefined,
    };
  };

  // Guardar Informe, Descargar Archivo Oficial y Enviar Notificación por Correo
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

      // 3. Generar y guardar/descargar el archivo PDF automáticamente en el dispositivo y despachar correo electrónico
      try {
        const { base64, filename } = await generateDailyReportPDF(newReport, true);

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

      // 4. Reiniciar automáticamente el formulario borrando los datos ingresados para dejarlo listo para el próximo informe
      resetForm();
      setSuccessReport(newReport);
    } catch (err) {
      console.error("Error al guardar reporte:", err);
      alert("Se guardó en memoria local del dispositivo.");
      resetForm();
      setSuccessReport(newReport);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen py-6 sm:py-12 px-2 sm:px-6 lg:px-8 bg-[#FBF8F1]">
      <div className="max-w-4xl mx-auto">
        {/* Navegación de regreso */}
        <div className="mb-4 sm:mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-semibold text-forest-800 hover:text-vanilla-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Volver a la Landing
          </Link>
        </div>

        {/* Modal de Éxito al Guardar */}
        {successReport && (
          <div className="mb-8 p-6 bg-forest-900 text-white rounded-2xl shadow-xl border border-vanilla-400/30 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-start space-x-4">
              <CheckCircle2 className="w-8 h-8 text-vanilla-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-xl font-serif font-bold text-vanilla-300">
                  ¡Informe Diario Guardado, Descargado y Enviado!
                </h3>
                <p className="text-sm text-forest-200 mt-1">
                  Código: <span className="font-mono font-bold text-white">{successReport.id}</span> para el{" "}
                  <strong>{successReport.lote}</strong> ({successReport.fechaReporte}).
                </p>
                <div className="mt-2.5 flex items-center space-x-2 text-xs text-vanilla-300 bg-forest-950/70 py-1.5 px-3 rounded-lg border border-forest-800">
                  <Mail className="w-4 h-4 text-vanilla-400 flex-shrink-0" />
                  <span>
                    El documento PDF se descargó a tu dispositivo y fue notificado por correo. El formulario se ha reiniciado y está listo para ingresar un nuevo informe.
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

          <div className="p-3 sm:p-8 space-y-6 sm:space-y-8">
            {/* SECCIÓN 1: FECHA DEL INFORME, ÁREA & RESPONSABLE */}
            <div className="bg-vanilla-50/70 p-5 rounded-xl border border-vanilla-200">
              <h2 className="text-xs font-bold uppercase tracking-wider text-forest-900 mb-4 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-vanilla-600" />
                <span>1. Fecha del Informe, Área & Responsable</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Fecha Única y Automática */}
                <div>
                  <label className="block text-xs font-semibold text-forest-800 mb-1 flex items-center justify-between">
                    <span>Fecha del Informe:</span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300">
                      Fecha Actual Automática
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={todayStr}
                      readOnly
                      className="w-full text-sm font-semibold px-3 py-2.5 bg-forest-50/60 rounded-lg border border-vanilla-300 text-forest-900 cursor-default select-none shadow-inner"
                    />
                  </div>
                </div>

                {/* Casillero Área (Botón de Selección Desplegable) */}
                <div>
                  <label className="block text-xs font-semibold text-forest-800 mb-1">
                    Área:
                  </label>
                  <div className="relative">
                    <select
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full text-sm font-semibold px-3 py-2.5 bg-white rounded-lg border border-vanilla-300 text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-600 shadow-sm cursor-pointer appearance-none pr-9 hover:border-forest-400 transition-colors"
                      required
                    >
                      {AREAS_DISPONIBLES.map((a) => (
                        <option key={a} value={a} className="font-semibold text-forest-950 py-1">
                          {a}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-forest-700">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Casillero Responsable (Botón de Selección Desplegable) */}
                <div>
                  <label className="block text-xs font-semibold text-forest-800 mb-1">
                    Responsable Autorizado:
                  </label>
                  <div className="relative">
                    <select
                      value={responsable}
                      onChange={(e) => setResponsable(e.target.value)}
                      className="w-full text-sm font-semibold px-3 py-2.5 bg-white rounded-lg border border-vanilla-300 text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-600 shadow-sm cursor-pointer appearance-none pr-9 hover:border-forest-400 transition-colors"
                      required
                    >
                      {RESPONSABLES_AUTORIZADOS.map((r) => (
                        <option key={r} value={r} className="font-semibold text-forest-950 py-1">
                          {r}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-forest-700">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: CONDICIONES DIARIAS */}
            <div className="bg-forest-50/50 p-5 rounded-xl border border-forest-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-forest-900 mb-4 flex items-center space-x-2">
                <Sun className="w-4 h-4 text-vanilla-600" />
                <span>2. Condiciones Diarias</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                {/* Temperatura Única (Reubicada) */}
                <div>
                  <label className="block text-xs font-semibold text-forest-800 mb-1 flex items-center space-x-1.5">
                    <Thermometer className="w-4 h-4 text-forest-600" />
                    <span>Temperatura:</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={temperatura}
                      onChange={(e) => setTemperatura(e.target.value === "" ? "" : Number(e.target.value))}
                      onFocus={() => setTemperatura("")}
                      placeholder="26"
                      className="w-full text-sm font-semibold px-3 py-2.5 bg-white rounded-lg border border-vanilla-300 text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-600 shadow-sm pr-9"
                      required
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-forest-500 font-bold">°C</span>
                  </div>
                </div>

                {/* Humedad Relativa */}
                <div>
                  <label className="block text-xs font-semibold text-forest-800 mb-1 flex items-center space-x-1.5">
                    <Droplets className="w-4 h-4 text-blue-600" />
                    <span>Humedad Relativa:</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={humedad}
                      onChange={(e) => setHumedad(e.target.value === "" ? "" : Number(e.target.value))}
                      onFocus={() => setHumedad("")}
                      placeholder="85"
                      className="w-full text-sm font-semibold px-3 py-2.5 bg-white rounded-lg border border-vanilla-300 text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-600 shadow-sm pr-9"
                      required
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-forest-500 font-bold">%</span>
                  </div>
                </div>

                {/* Estado del Tiempo */}
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
                        className={`py-2 px-1 rounded-lg text-[11px] font-semibold flex flex-col items-center justify-center transition-all ${
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
                    onFocus={() => setClimaOtro("")}
                    placeholder="Especifique las condiciones climáticas particulares..."
                    className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-vanilla-300"
                  />
                </div>
              )}
            </div>

            {/* CONDICIONES DEL TERRENO */}
            <div className="bg-vanilla-50/70 p-5 rounded-xl border border-vanilla-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                {/* Título de la casilla */}
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-vanilla-600 flex-shrink-0" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-forest-900 whitespace-nowrap">
                    CONDICIONES DEL TERRENO:
                  </h2>
                </div>

                {/* Casilla activa fija ALCALINIDAD y Cuadro de Porcentaje */}
                <div className="flex items-center space-x-2 sm:space-x-3 flex-1 max-w-xl">
                  {/* Casilla activa que dice ALCALINIDAD como palabra fija */}
                  <div className="inline-flex items-center justify-center px-3.5 py-2.5 rounded-lg bg-forest-900 text-vanilla-300 font-bold text-xs uppercase tracking-wider select-none shadow-sm flex-shrink-0 border border-forest-800">
                    ALCALINIDAD
                  </div>

                  {/* Cuadro para escribir el porcentaje de alcalinidad */}
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="100"
                      value={alcalinidad}
                      onChange={(e) => setAlcalinidad(e.target.value)}
                      placeholder="Ingrese porcentaje de alcalinidad..."
                      className="w-full text-sm font-semibold px-3.5 py-2.5 bg-white rounded-lg border border-vanilla-300 text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-600 shadow-sm pr-9"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-forest-500 font-bold">%</span>
                  </div>
                </div>
              </div>
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
                      <th className="hidden sm:table-cell py-2 sm:py-2.5 px-1 sm:px-3 w-7 sm:w-10 text-center font-bold text-[11px] sm:text-xs">
                        N°
                      </th>
                      <th className="py-2 sm:py-2.5 pl-3 sm:pl-3 pr-2 sm:pr-3 w-28 sm:w-48 font-bold text-[11px] sm:text-xs text-left">
                        Actividad
                      </th>
                      <th className="py-2 sm:py-2.5 px-1.5 sm:px-3 font-bold text-[11px] sm:text-xs">
                        <span className="md:hidden">Descripción</span>
                        <span className="hidden md:inline">Descripción / Observaciones Breves</span>
                      </th>
                      <th className="py-2 sm:py-2.5 px-1.5 sm:px-3 w-16 sm:w-32 font-bold text-[11px] sm:text-xs">
                        <span>Área</span>
                      </th>
                      <th className="py-2 sm:py-2.5 pr-3 sm:pr-3 pl-1 sm:px-3 w-10 sm:w-20 text-center font-bold text-[10px] sm:text-xs">
                        <span className="sm:hidden">✓</span>
                        <span className="hidden sm:inline">Realizado</span>
                      </th>
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
                        <td className="hidden sm:table-cell py-1.5 sm:py-2 px-1 sm:px-3 text-center font-mono text-forest-600 font-bold text-[11px] sm:text-xs">
                          {act.id}
                        </td>
                        <td className="py-1.5 sm:py-2 pl-3 sm:pl-3 pr-2 sm:pr-3 font-semibold text-forest-900 text-[11px] sm:text-xs leading-snug text-left">
                          {act.nombre}
                        </td>
                        <td className="py-1.5 sm:py-2 px-1.5 sm:px-3">
                          <input
                            type="text"
                            value={act.descripcion}
                            onChange={(e) => updateActividadDesc(act.id, e.target.value)}
                            onFocus={() => updateActividadDesc(act.id, "")}
                            placeholder="Detalle..."
                            className="w-full px-1 sm:px-2 py-1 bg-transparent border-b border-dashed border-vanilla-300 focus:border-forest-600 focus:outline-none text-[11px] sm:text-xs"
                          />
                        </td>
                        <td className="py-1.5 sm:py-2 px-1.5 sm:px-3">
                          <input
                            type="text"
                            value={act.areaLote}
                            onChange={(e) => updateActividadArea(act.id, e.target.value)}
                            onFocus={() => updateActividadArea(act.id, "")}
                            placeholder="Área"
                            className="w-full px-1 sm:px-2 py-1 bg-transparent border-b border-dashed border-vanilla-300 focus:border-forest-600 focus:outline-none text-[11px] sm:text-xs"
                          />
                        </td>
                        <td className="py-1.5 sm:py-2 pr-3 sm:pr-3 pl-1 sm:px-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleActividad(act.id)}
                            className={`p-1 sm:p-1.5 rounded-md transition-colors ${
                              act.realizado
                                ? "bg-forest-900 text-vanilla-400"
                                : "bg-vanilla-100 text-forest-400 hover:text-forest-800"
                            }`}
                            aria-label={`Marcar actividad ${act.nombre}`}
                          >
                            {act.realizado ? (
                              <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                            ) : (
                              <Square className="w-4 h-4 sm:w-5 sm:h-5" />
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
                    onFocus={() => setOtraHerramienta("")}
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
                      onFocus={() => updateInsumo(row.id, "insumo", "")}
                      className="text-xs px-2.5 py-1.5 bg-white rounded border border-vanilla-300 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Dosis (ej. 2L / bomba)"
                      value={row.dosis}
                      onChange={(e) => updateInsumo(row.id, "dosis", e.target.value)}
                      onFocus={() => updateInsumo(row.id, "dosis", "")}
                      className="text-xs px-2.5 py-1.5 bg-white rounded border border-vanilla-300 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Método (Foliar, radicular)"
                      value={row.metodo}
                      onChange={(e) => updateInsumo(row.id, "metodo", e.target.value)}
                      onFocus={() => updateInsumo(row.id, "metodo", "")}
                      className="text-xs px-2.5 py-1.5 bg-white rounded border border-vanilla-300 focus:outline-none"
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Área"
                        value={row.areaLote}
                        onChange={(e) => updateInsumo(row.id, "areaLote", e.target.value)}
                        onFocus={() => updateInsumo(row.id, "areaLote", "")}
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

            {/* SECCIÓN 6: OBSERVACIONES */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-forest-900 mb-2">
                6. Observaciones / Eventos Importantes del Día
              </h2>
              <textarea
                rows={3}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                onFocus={() => setObservaciones("")}
                placeholder="Escriba aquí notas relevantes: presencia de polinizadores, floración, lluvias intensas, acuerdos con la comunidad Waorani..."
                className="w-full text-xs p-3 bg-white rounded-xl border border-vanilla-300 focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>

            {/* SECCIÓN 7: REGISTRO FOTOGRÁFICO (Foto 1, Foto 2, Foto 3) */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-forest-900 mb-3 flex items-center space-x-2">
                <Camera className="w-4 h-4 text-vanilla-600" />
                <span>7. Registro Fotográfico de Campo</span>
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
                Al guardar, se registrará el informe en el sistema y se enviará automáticamente un correo electrónico con el PDF oficial adjunto.
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
