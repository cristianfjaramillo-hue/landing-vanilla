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
  Bell,
  Clock,
  FolderOpen,
  UploadCloud,
  ExternalLink,
  Check,
  X,
  MapPin,
} from "lucide-react";
import { DEFAULT_ACTIVITIES, DEFAULT_TOOLS } from "@/lib/constants";
import { ActivityItem, ToolItem, AppliedInput, DailyReport, ScheduledReminder } from "@/lib/types";
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

const INSUMOS_DISPONIBLES = [
  "Sustrato y abono",
  "Té de ceniza",
  "Té de ortiga",
  "Biofertilizante",
] as const;

const DOSIS_DISPONIBLES = [
  "1 dosis",
  "2 dosis",
  "3 dosis",
  "4 dosis",
  "5 dosis",
] as const;

const METODOS_APLICACION = [
  "A la raíz",
  "A la hoja",
] as const;

export default function NuevoReportePage() {
  const todayStr = new Date().toISOString().split("T")[0];

  // 1. Cabecera (Proyecto fijo y Responsable seleccionable)
  const [proyecto] = useState<string>("Proyecto Vainilla");
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
  const [openAreaDropdownId, setOpenAreaDropdownId] = useState<number | null>(null);

  // Controladores de Actividades
  const toggleActividadArea = (actId: number, areaName: string) => {
    setActividades((prev) =>
      prev.map((act) => {
        if (act.id !== actId) return act;
        const currentList = act.areaLote
          ? act.areaLote.split(",").map((s) => s.trim()).filter(Boolean)
          : [];
        const exists = currentList.includes(areaName);
        const nextList = exists
          ? currentList.filter((a) => a !== areaName)
          : [...currentList, areaName];
        const newAreaStr = nextList.join(", ");
        return {
          ...act,
          areaLote: newAreaStr,
          realizado: Boolean(
            nextList.length > 0 ||
            (act.descripcion && act.descripcion.trim() !== "") ||
            act.fechaProxima
          ),
        };
      })
    );
  };

  const clearActividadAreas = (actId: number) => {
    setActividades((prev) =>
      prev.map((act) =>
        act.id === actId
          ? {
              ...act,
              areaLote: "",
              realizado: Boolean(
                (act.descripcion && act.descripcion.trim() !== "") ||
                act.fechaProxima
              ),
            }
          : act
      )
    );
  };

  const updateActividadDesc = (id: number, descripcion: string) => {
    setActividades((prev) =>
      prev.map((act) =>
        act.id === id
          ? {
              ...act,
              descripcion,
              realizado: Boolean(
                (descripcion && descripcion.trim() !== "") ||
                (act.areaLote && act.areaLote.trim() !== "") ||
                act.fechaProxima
              ),
            }
          : act
      )
    );
  };

  const updateActividadArea = (id: number, areaLote: string) => {
    setActividades((prev) =>
      prev.map((act) =>
        act.id === id
          ? {
              ...act,
              areaLote,
              realizado: Boolean(
                (areaLote && areaLote.trim() !== "") ||
                (act.descripcion && act.descripcion.trim() !== "") ||
                act.fechaProxima
              ),
            }
          : act
      )
    );
  };

  const updateActividadFechaProx = (id: number, fechaProxima: string) => {
    setActividades((prev) =>
      prev.map((act) =>
        act.id === id
          ? {
              ...act,
              fechaProxima,
              realizado: Boolean(
                fechaProxima ||
                (act.areaLote && act.areaLote.trim() !== "") ||
                (act.descripcion && act.descripcion.trim() !== "")
              ),
            }
          : act
      )
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

  // Compresión optimizada para imágenes de la memoria del celular o de cámara
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const maxWidth = 800;
          const maxHeight = 800;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.65);
          resolve(dataUrl);
        };
        img.onerror = () => resolve(event.target?.result as string);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Fotos (permite navegar en la memoria del celular o usar la cámara)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, slot: 1 | 2 | 3) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        if (slot === 1) setFoto1(compressedBase64);
        if (slot === 2) setFoto2(compressedBase64);
        if (slot === 3) setFoto3(compressedBase64);
      } catch (err) {
        console.warn("Aviso procesando imagen:", err);
        const reader = new FileReader();
        reader.onloadend = () => {
          if (slot === 1) setFoto1(reader.result as string);
          if (slot === 2) setFoto2(reader.result as string);
          if (slot === 3) setFoto3(reader.result as string);
        };
        reader.readAsDataURL(file);
      } finally {
        e.target.value = "";
      }
    }
  };

  // Reiniciar formulario completo borrando todo dato ingresado
  const resetForm = () => {
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
    setOpenAreaDropdownId(null);
  };

  // Compilar el objeto de reporte
  const buildReportObject = (): DailyReport => {
    const tempVal = temperatura !== "" && !isNaN(Number(temperatura)) ? Number(temperatura) : 26;
    return {
      id: "REP-" + Date.now().toString().slice(-6),
      created_at: new Date().toISOString(),
      proyecto: "Proyecto Vainilla",
      area: "Proyecto Vainilla",
      lote: "Proyecto Vainilla",
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
      actividades: actividades.map((act) => ({
        ...act,
        realizado: Boolean(
          (act.areaLote && act.areaLote.trim() !== "") ||
          (act.descripcion && act.descripcion.trim() !== "") ||
          Boolean(act.fechaProxima) ||
          act.realizado
        ),
      })),
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

      // 1b. Registrar tareas programadas para recordatorios automáticos (24h antes)
      const tasksToRemind = newReport.actividades.filter(
        (a) => a.fechaProxima && a.fechaProxima.trim() !== ""
      );

      if (tasksToRemind.length > 0) {
        try {
          const existingReminders: ScheduledReminder[] = JSON.parse(
            localStorage.getItem("vanilla_scheduled_reminders") || "[]"
          );
          const newReminders: ScheduledReminder[] = tasksToRemind.map((task) => ({
            id: `REM-${newReport.id}-${task.id}`,
            reportId: newReport.id,
            actividadNombre: task.nombre,
            area: task.areaLote || "INVERNADERO N°1",
            responsable: newReport.responsable,
            observacionesPrevias: task.descripcion || newReport.observaciones,
            fechaProgramada: task.fechaProxima!,
            recordatoriosEnviados: 0,
            estado: "pendiente",
            created_at: new Date().toISOString(),
          }));

          const combined = [...newReminders, ...existingReminders];
          const deduped: ScheduledReminder[] = [];
          for (const item of combined) {
            const key = `${item.reportId}_${(item.actividadNombre || "").trim().toLowerCase()}_${item.fechaProgramada}`;
            if (!deduped.some(d => `${d.reportId}_${(d.actividadNombre || "").trim().toLowerCase()}_${d.fechaProgramada}` === key)) {
              deduped.push(item);
            }
          }

          localStorage.setItem(
            "vanilla_scheduled_reminders",
            JSON.stringify(deduped)
          );

          fetch("/api/recordatorios", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reminders: newReminders }),
          }).catch((err) => console.warn("Aviso sincronizando recordatorios:", err));
        } catch (remErr) {
          console.warn("Aviso guardando recordatorios locales:", remErr);
        }
      }

      // 2. Guardar garantizado en la base de datos Supabase con Service Role
      try {
        const dbRes = await fetch("/api/reportes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ report: newReport }),
        });
        const dbJson = await dbRes.json();
        if (!dbRes.ok || !dbJson.success) {
          console.warn("Aviso en API /api/reportes, intentando directo:", dbJson?.error);
          await supabase.from("reportes_diarios").upsert([
            {
              report_id: newReport.id,
              lote: newReport.lote,
              responsable: newReport.responsable,
              fecha_reporte: newReport.fechaReporte,
              data: newReport,
            },
          ]);
        }
      } catch (dbErr) {
        console.warn("Aviso al guardar en Supabase, reintentando directo:", dbErr);
        try {
          await supabase.from("reportes_diarios").upsert([
            {
              report_id: newReport.id,
              lote: newReport.lote,
              responsable: newReport.responsable,
              fecha_reporte: newReport.fechaReporte,
              data: newReport,
            },
          ]);
        } catch (e2) {
          console.error("Error definitivo al guardar en base de datos:", e2);
        }
      }

      // Notificar en tiempo real a otras ventanas (incluyendo Administrador)
      try {
        const bc = new BroadcastChannel("vanilla_reports_sync");
        bc.postMessage({ type: "REPORT_SAVED", report: newReport });
        bc.close();
      } catch {}

      // 3. Generar archivo PDF en memoria y despachar correo y Google Drive
      try {
        const { base64, filename } = await generateDailyReportPDF(newReport, false);

        // 3a. Enviar por correo con PDF adjunto
        await fetch("/api/enviar-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            report: newReport,
            pdfBase64: base64,
            filename: filename,
          }),
        });

        // 3b. Guardar y registrar automáticamente en la carpeta de Google Drive de Informes Diarios
        fetch("/api/drive-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "diario",
            filename: filename,
            pdfBase64: base64,
            reportId: newReport.id,
            fecha: newReport.fechaReporte,
          }),
        }).catch((dErr) => console.warn("Aviso Drive Upload:", dErr));
      } catch (emailErr) {
        console.warn("Aviso en despacho de correo y Drive:", emailErr);
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
                  ¡Informe Diario Guardado Exitosamente!
                </h3>
                <p className="text-sm text-forest-200 mt-1">
                  Código: <span className="font-mono font-bold text-white">{successReport.id}</span> para el{" "}
                  <strong>{successReport.lote}</strong> ({successReport.fechaReporte}).
                </p>
                <div className="mt-2.5 flex items-center space-x-2 text-xs text-vanilla-300 bg-forest-950/70 py-1.5 px-3 rounded-lg border border-forest-800">
                  <Mail className="w-4 h-4 text-vanilla-400 flex-shrink-0" />
                  <span>
                    El informe quedó guardado en la base de datos y actualizado en el panel Administrador. El formulario se ha reiniciado y está listo para ingresar otro informe.
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href="https://drive.google.com/drive/folders/1gGdDnhpOOM0zhKGEGhTuvXmOfHRYwmpN"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-transform active:scale-95"
                    title="Abrir carpeta compartida en Google Drive"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Abrir en Google Drive (Informes)</span>
                  </a>

                  <button
                    onClick={async () => await generateDailyReportPDF(successReport)}
                    className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-vanilla-500 hover:bg-vanilla-600 text-forest-950 font-bold text-xs shadow-md transition-transform active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar PDF (Opcional)</span>
                  </button>

                  <button
                    onClick={() => setSuccessReport(null)}
                    className="px-4 py-2.5 rounded-lg border border-vanilla-300/40 hover:bg-forest-800 text-forest-200 text-xs font-medium transition-colors"
                  >
                    Llenar Otro Informe
                  </button>

                  <Link
                    href="/admin"
                    className="px-4 py-2.5 rounded-lg border border-vanilla-300/40 hover:bg-forest-800 text-forest-200 text-xs font-medium transition-colors inline-flex items-center space-x-1"
                  >
                    <span>Ver en Administrador</span>
                  </Link>
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
            {/* SECCIÓN 1: FECHA DEL INFORME, PROYECTO & RESPONSABLE */}
            <div className="bg-vanilla-50/70 p-5 rounded-xl border border-vanilla-200">
              <h2 className="text-xs font-bold uppercase tracking-wider text-forest-900 mb-4 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-vanilla-600" />
                <span>1. Fecha del Informe, Proyecto & Responsable</span>
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

                {/* Casillero Proyecto (Fijo: Proyecto Vainilla) */}
                <div>
                  <label className="block text-xs font-semibold text-forest-800 mb-1 flex items-center justify-between">
                    <span>Proyecto:</span>
                    <span className="text-[10px] font-bold text-vanilla-800 bg-vanilla-100 px-2 py-0.5 rounded-full border border-vanilla-300">
                      Fijo
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value="Proyecto Vainilla"
                      readOnly
                      className="w-full text-sm font-bold px-3 py-2.5 bg-forest-50/60 rounded-lg border border-vanilla-300 text-forest-950 cursor-default select-none shadow-inner"
                    />
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
                  {actividades.filter((a) => (a.areaLote && a.areaLote.trim() !== "") || (a.descripcion && a.descripcion.trim() !== "") || a.realizado).length} de {actividades.length} con labor registrada
                </span>
              </div>

              <div className="mb-2.5 flex items-center space-x-2 text-[11px] text-forest-800 bg-forest-50 py-1.5 px-3 rounded-lg border border-forest-200">
                <Bell className="w-3.5 h-3.5 text-vanilla-600 flex-shrink-0" />
                <span>
                  <strong>Recordatorio Inteligente:</strong> Cada labor con <strong>Fecha Próx.</strong> recibirá individualmente <strong>3 correos de recordatorio 24 horas antes</strong> de su fecha fijada (sin límite diario en la cantidad de labores).
                </span>
              </div>

              <div className="overflow-x-auto border border-vanilla-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-forest-900 text-white">
                    <tr>
                      <th className="hidden sm:table-cell py-2 sm:py-2.5 px-1 sm:px-3 w-7 sm:w-10 text-center font-bold text-[11px] sm:text-xs">
                        N°
                      </th>
                      <th className="py-2 sm:py-2.5 pl-3 sm:pl-3 pr-2 sm:pr-3 w-28 sm:w-44 font-bold text-[11px] sm:text-xs text-left">
                        Actividad
                      </th>
                      <th className="py-2 sm:py-2.5 px-1.5 sm:px-3 w-36 sm:w-56 font-bold text-[11px] sm:text-xs">
                        <span>Observaciones</span>
                      </th>
                      <th className="py-2 sm:py-2.5 px-1 sm:px-2 w-28 sm:w-36 font-bold text-[11px] sm:text-xs text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-vanilla-300" />
                          <span>Fecha Próx.</span>
                        </div>
                      </th>
                      <th className="py-2 sm:py-2.5 px-1.5 sm:px-3 w-48 sm:w-72 font-bold text-[11px] sm:text-xs">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-vanilla-300" />
                          <span>Área(s) de Trabajo</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-vanilla-100 bg-white">
                    {actividades.map((act) => {
                      const selectedAreas = act.areaLote
                        ? act.areaLote.split(",").map((s) => s.trim()).filter(Boolean)
                        : [];
                      const isDropdownOpen = openAreaDropdownId === act.id;
                      const hasWork =
                        selectedAreas.length > 0 ||
                        (act.descripcion && act.descripcion.trim() !== "") ||
                        Boolean(act.fechaProxima);

                      return (
                        <tr
                          key={act.id}
                          className={`transition-colors ${
                            hasWork
                              ? "bg-forest-50/40 border-l-4 border-l-forest-700"
                              : "hover:bg-vanilla-50/30"
                          }`}
                        >
                          <td className="hidden sm:table-cell py-1.5 sm:py-2 px-1 sm:px-3 text-center font-mono text-forest-600 font-bold text-[11px] sm:text-xs">
                            {act.id}
                          </td>
                          <td className="py-1.5 sm:py-2 pl-3 sm:pl-3 pr-2 sm:pr-3 font-semibold text-forest-900 text-[11px] sm:text-xs leading-snug text-left">
                            <span className={hasWork ? "text-forest-950 font-bold" : "text-forest-800"}>
                              {act.nombre}
                            </span>
                          </td>
                          <td className="py-1.5 sm:py-2 px-1.5 sm:px-3 w-36 sm:w-56">
                            <input
                              type="text"
                              value={act.descripcion}
                              onChange={(e) => updateActividadDesc(act.id, e.target.value)}
                              onFocus={() => {
                                if (act.descripcion === "") updateActividadDesc(act.id, "");
                              }}
                              placeholder="Detalle u observación..."
                              className="w-full px-1 sm:px-2 py-1 bg-transparent border-b border-dashed border-vanilla-300 focus:border-forest-600 focus:outline-none text-[11px] sm:text-xs text-forest-900"
                            />
                          </td>
                          <td className="py-1.5 sm:py-2 px-1 sm:px-2 w-28 sm:w-36 text-center">
                            <input
                              type="date"
                              min={todayStr}
                              value={act.fechaProxima || ""}
                              onChange={(e) => updateActividadFechaProx(act.id, e.target.value)}
                              className="w-full text-[11px] sm:text-xs font-semibold px-2 py-1 bg-white rounded-md border border-vanilla-300 text-forest-950 focus:outline-none focus:ring-1 focus:ring-forest-600 shadow-xs cursor-pointer hover:border-forest-400 transition-colors"
                              title="Selecciona la fecha para la próxima labor"
                            />
                          </td>
                          <td className="py-1.5 sm:py-2 px-1.5 sm:px-3 w-48 sm:w-72">
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setOpenAreaDropdownId(isDropdownOpen ? null : act.id)}
                                className={`w-full text-left text-[11px] sm:text-xs font-semibold px-2 py-1.5 rounded-lg border transition-all flex items-center justify-between shadow-xs ${
                                  selectedAreas.length > 0
                                    ? "bg-white border-forest-600 text-forest-950 ring-1 ring-forest-600/30 font-bold"
                                    : "bg-white border-vanilla-300 text-forest-500 hover:border-forest-400"
                                }`}
                                title={
                                  selectedAreas.length > 0
                                    ? `Áreas: ${selectedAreas.join(", ")}`
                                    : "Clic para seleccionar áreas de trabajo"
                                }
                              >
                                <div className="flex items-center space-x-1 min-w-0 pr-1 flex-1">
                                  <MapPin
                                    className={`w-3.5 h-3.5 flex-shrink-0 ${
                                      selectedAreas.length > 0 ? "text-forest-700" : "text-forest-400"
                                    }`}
                                  />
                                  <span className="truncate">
                                    {selectedAreas.length === 0
                                      ? "Seleccionar áreas..."
                                      : selectedAreas.length === 1
                                      ? selectedAreas[0]
                                      : `${selectedAreas.length} áreas (${selectedAreas
                                          .map((a) => a.replace("INVERNADERO ", "INV. "))
                                          .join(", ")})`}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1 flex-shrink-0">
                                  {selectedAreas.length > 1 && (
                                    <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-forest-800 text-white font-bold leading-none">
                                      {selectedAreas.length}
                                    </span>
                                  )}
                                  <ChevronDown
                                    className={`w-3.5 h-3.5 text-forest-700 transition-transform ${
                                      isDropdownOpen ? "rotate-180" : ""
                                    }`}
                                  />
                                </div>
                              </button>

                              {/* MENÚ DESPLEGABLE DESKTOP (sm:) */}
                              {isDropdownOpen && (
                                <>
                                  <div
                                    className="fixed inset-0 z-30"
                                    onClick={() => setOpenAreaDropdownId(null)}
                                  />

                                  <div
                                    className={`hidden sm:block absolute z-40 w-64 bg-white rounded-xl shadow-2xl border border-vanilla-300 p-2.5 text-xs ${
                                      act.id > 10 ? "bottom-full mb-1.5" : "top-full mt-1.5"
                                    } right-0`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-vanilla-200">
                                      <span className="text-[11px] font-bold text-forest-950 uppercase tracking-wider">
                                        Áreas de trabajo ({selectedAreas.length})
                                      </span>
                                      {selectedAreas.length > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => clearActividadAreas(act.id)}
                                          className="text-[10px] text-red-600 hover:underline font-semibold"
                                        >
                                          Limpiar
                                        </button>
                                      )}
                                    </div>

                                    <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
                                      {AREAS_DISPONIBLES.map((area) => {
                                        const isSelected = selectedAreas.includes(area);
                                        return (
                                          <div
                                            key={area}
                                            onClick={() => toggleActividadArea(act.id, area)}
                                            className={`flex items-center space-x-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                                              isSelected
                                                ? "bg-forest-100 text-forest-950 font-bold"
                                                : "hover:bg-vanilla-100/60 text-forest-800 font-medium"
                                            }`}
                                          >
                                            <div
                                              className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                                                isSelected
                                                  ? "bg-forest-900 text-white border-forest-900"
                                                  : "border-vanilla-400 bg-white"
                                              }`}
                                            >
                                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                            </div>
                                            <span className="text-[11px] flex-1">{area}</span>
                                          </div>
                                        );
                                      })}
                                    </div>

                                    <div className="mt-2 pt-2 border-t border-vanilla-200 flex justify-end">
                                      <button
                                        type="button"
                                        onClick={() => setOpenAreaDropdownId(null)}
                                        className="px-3 py-1 bg-forest-900 hover:bg-forest-800 text-white text-[11px] font-bold rounded-lg transition-colors shadow-xs"
                                      >
                                        Listo
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )}

                              {/* MODAL / BOTTOM SHEET MOBILE (< sm) */}
                              {isDropdownOpen && (
                                <div
                                  className="sm:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-150"
                                  onClick={() => setOpenAreaDropdownId(null)}
                                >
                                  <div
                                    className="bg-white w-full rounded-t-2xl p-4 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-vanilla-200">
                                      <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-forest-600 block">
                                          Actividad N°{act.id}
                                        </span>
                                        <h4 className="text-sm font-bold text-forest-950">
                                          {act.nombre}
                                        </h4>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setOpenAreaDropdownId(null)}
                                        className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
                                      >
                                        <X className="w-5 h-5" />
                                      </button>
                                    </div>

                                    <p className="text-xs text-forest-700 mb-2.5 font-medium">
                                      Selecciona una o varias áreas donde se realizó este trabajo:
                                    </p>

                                    <div className="space-y-1.5 mb-4">
                                      {AREAS_DISPONIBLES.map((area) => {
                                        const isSelected = selectedAreas.includes(area);
                                        return (
                                          <div
                                            key={area}
                                            onClick={() => toggleActividadArea(act.id, area)}
                                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all active:scale-[0.99] ${
                                              isSelected
                                                ? "bg-forest-900 text-white border-forest-900 shadow-sm"
                                                : "bg-white hover:bg-vanilla-50 text-forest-900 border-vanilla-300"
                                            }`}
                                          >
                                            <div className="flex items-center space-x-3">
                                              <div
                                                className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                                                  isSelected
                                                    ? "bg-white text-forest-900 border-white"
                                                    : "border-vanilla-400 bg-white"
                                                }`}
                                              >
                                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                              </div>
                                              <span className="text-xs font-bold">{area}</span>
                                            </div>
                                            {isSelected && (
                                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-800 text-vanilla-200">
                                                Seleccionada
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-vanilla-200">
                                      <button
                                        type="button"
                                        onClick={() => clearActividadAreas(act.id)}
                                        disabled={selectedAreas.length === 0}
                                        className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-40 px-2 py-1"
                                      >
                                        Limpiar todas
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setOpenAreaDropdownId(null)}
                                        className="px-5 py-2.5 rounded-xl bg-forest-900 text-white text-xs font-bold shadow-md hover:bg-forest-800 transition-colors"
                                      >
                                        Listo ({selectedAreas.length} seleccionada{selectedAreas.length === 1 ? "" : "s"})
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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

              {/* Encabezados de columna para pantallas medianas/grandes */}
              <div className="hidden sm:grid grid-cols-4 gap-2.5 px-3 py-2 bg-forest-900 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider mb-2">
                <span>Insumo</span>
                <span>Dosis</span>
                <span>Método de Aplicación</span>
                <span>Área</span>
              </div>

              <div className="space-y-2">
                {insumos.map((row) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 bg-vanilla-50/60 p-2.5 rounded-xl border border-vanilla-200 items-center"
                  >
                    {/* 1. Insumo (Lista Desplegable) */}
                    <div>
                      <span className="sm:hidden block text-[10px] font-bold text-forest-700 uppercase mb-0.5">
                        Insumo:
                      </span>
                      <div className="relative">
                        <select
                          value={row.insumo}
                          onChange={(e) => updateInsumo(row.id, "insumo", e.target.value)}
                          className="w-full text-xs font-semibold px-3 py-2 bg-white rounded-lg border border-vanilla-300 text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-600 shadow-sm cursor-pointer appearance-none pr-8 hover:border-forest-400 transition-colors"
                        >
                          <option value="">Seleccione Insumo...</option>
                          {INSUMOS_DISPONIBLES.map((ins) => (
                            <option key={ins} value={ins} className="font-semibold text-forest-950 py-1">
                              {ins}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-forest-700">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>

                    {/* 2. Dosis (Lista Desplegable) */}
                    <div>
                      <span className="sm:hidden block text-[10px] font-bold text-forest-700 uppercase mb-0.5">
                        Dosis:
                      </span>
                      <div className="relative">
                        <select
                          value={row.dosis}
                          onChange={(e) => updateInsumo(row.id, "dosis", e.target.value)}
                          className="w-full text-xs font-semibold px-3 py-2 bg-white rounded-lg border border-vanilla-300 text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-600 shadow-sm cursor-pointer appearance-none pr-8 hover:border-forest-400 transition-colors"
                        >
                          <option value="">Seleccione Dosis...</option>
                          {DOSIS_DISPONIBLES.map((dos) => (
                            <option key={dos} value={dos} className="font-semibold text-forest-950 py-1">
                              {dos}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-forest-700">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>

                    {/* 3. Método de Aplicación (Lista Desplegable con 2 opciones) */}
                    <div>
                      <span className="sm:hidden block text-[10px] font-bold text-forest-700 uppercase mb-0.5">
                        Método:
                      </span>
                      <div className="relative">
                        <select
                          value={row.metodo}
                          onChange={(e) => updateInsumo(row.id, "metodo", e.target.value)}
                          className="w-full text-xs font-semibold px-3 py-2 bg-white rounded-lg border border-vanilla-300 text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-600 shadow-sm cursor-pointer appearance-none pr-8 hover:border-forest-400 transition-colors"
                        >
                          <option value="">Seleccione Método...</option>
                          {METODOS_APLICACION.map((met) => (
                            <option key={met} value={met} className="font-semibold text-forest-950 py-1">
                              {met}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-forest-700">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>

                    {/* 4. Área (Lista Desplegable) */}
                    <div>
                      <span className="sm:hidden block text-[10px] font-bold text-forest-700 uppercase mb-0.5">
                        Área:
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="relative flex-1">
                          <select
                            value={row.areaLote}
                            onChange={(e) => updateInsumo(row.id, "areaLote", e.target.value)}
                            className="w-full text-xs font-semibold px-3 py-2 bg-white rounded-lg border border-vanilla-300 text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-600 shadow-sm cursor-pointer appearance-none pr-8 hover:border-forest-400 transition-colors"
                          >
                            <option value="">Seleccione Área...</option>
                            {AREAS_DISPONIBLES.map((ar) => (
                              <option key={ar} value={ar} className="font-semibold text-forest-950 py-1">
                                {ar}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-forest-700">
                            <ChevronDown className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        {insumos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeInsumo(row.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                            title="Eliminar fila"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-forest-900 flex items-center space-x-2">
                  <Camera className="w-4 h-4 text-vanilla-600" />
                  <span>7. Registro Fotográfico de Campo</span>
                </h2>
                <span className="text-[11px] text-forest-600">
                  Elige imágenes de la galería/memoria de tu celular o toma fotos en vivo
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map((slot) => {
                  const currentPhoto = slot === 1 ? foto1 : slot === 2 ? foto2 : foto3;
                  return (
                    <div
                      key={slot}
                      className="border-2 border-dashed border-vanilla-300 rounded-xl p-4 text-center hover:border-forest-600 transition-colors bg-vanilla-50/30 flex flex-col items-center justify-center min-h-[175px] relative overflow-hidden"
                    >
                      {currentPhoto ? (
                        <div className="relative w-full h-36 rounded-lg overflow-hidden group">
                          <img
                            src={currentPhoto}
                            alt={`Foto ${slot}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-between p-2">
                            <span className="text-[10px] font-bold text-white bg-forest-900/80 px-2 py-0.5 rounded backdrop-blur-xs">
                              Foto {slot} adjunta
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (slot === 1) setFoto1(null);
                                if (slot === 2) setFoto2(null);
                                if (slot === 3) setFoto3(null);
                              }}
                              className="inline-flex items-center space-x-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold shadow transition-colors"
                              title="Eliminar foto"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Quitar</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full h-full py-1">
                          <div className="w-10 h-10 rounded-full bg-forest-50 border border-forest-100 flex items-center justify-center text-forest-700 mb-2">
                            <FolderOpen className="w-5 h-5 text-forest-600" />
                          </div>

                          <span className="text-xs font-bold text-forest-900">
                            Foto {slot}
                          </span>
                          <span className="text-[10px] text-forest-500 mb-3 text-center">
                            Navega en tu memoria o usa la cámara
                          </span>

                          <div className="flex flex-col sm:flex-row gap-2 w-full">
                            {/* Opción 1: Galería / Memoria interna del celular (SIN capture, permite navegar todos los archivos) */}
                            <label className="flex-1 cursor-pointer inline-flex items-center justify-center space-x-1.5 px-2.5 py-2 rounded-lg bg-forest-900 hover:bg-forest-800 text-white text-[11px] font-semibold shadow-xs transition-transform active:scale-95 text-center">
                              <FolderOpen className="w-3.5 h-3.5 text-vanilla-300 shrink-0" />
                              <span>Galería / Archivos</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handlePhotoUpload(e, slot as any)}
                                className="hidden"
                              />
                            </label>

                            {/* Opción 2: Cámara en vivo (con capture="environment") */}
                            <label className="flex-1 cursor-pointer inline-flex items-center justify-center space-x-1.5 px-2.5 py-2 rounded-lg bg-white hover:bg-vanilla-100 text-forest-900 border border-vanilla-300 text-[11px] font-semibold transition-transform active:scale-95 text-center">
                              <Camera className="w-3.5 h-3.5 text-forest-700 shrink-0" />
                              <span>Cámara</span>
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={(e) => handlePhotoUpload(e, slot as any)}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="pt-6 border-t border-vanilla-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-forest-600">
                Al guardar, el informe se registrará en la base de datos y se actualizará en el Administrador (puedes descargarlo después si lo necesitas).
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
