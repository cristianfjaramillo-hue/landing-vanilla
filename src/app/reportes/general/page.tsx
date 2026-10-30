"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FileText,
  FileSpreadsheet,
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
  Plus,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  ChevronDown,
  Bell,
  Clock,
  FolderOpen,
  UploadCloud,
  ExternalLink,
  Check,
  X,
  MapPin,
  Warehouse,
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

export default function InformeGeneralPage() {
  const todayStr = new Date().toISOString().split("T")[0];

  // 1. Cabecera (Proyecto y Responsable editables libremente)
  const [proyecto, setProyecto] = useState<string>("Proyecto Vainilla");
  const [responsable, setResponsable] = useState<string>("GUIMARE");

  // Fecha (inicia con hoy, editable hacia fechas anteriores o posteriores)
  const [fecha, setFecha] = useState<string>(todayStr);

  // 3. Actividades (19 items con notas cortas y selección de áreas múltiples)
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

  // Controladores de Insumos Dinámicos
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

  // Compresión automática de imágenes
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new (window as any).Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          const maxDim = 800;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
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
          resolve(canvas.toDataURL("image/jpeg", 0.65));
        };
        img.onerror = () => resolve(event.target?.result as string);
      };
      reader.onerror = (error) => reject(error);
    });
  };

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

  // Reiniciar formulario
  const resetForm = () => {
    setFecha(todayStr);
    setProyecto("Proyecto Vainilla");
    setResponsable("GUIMARE");
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

  // Compilar el objeto de reporte general
  const buildReportObject = (): DailyReport => {
    return {
      id: "GEN-" + Date.now().toString().slice(-6),
      created_at: new Date().toISOString(),
      tipoReporte: "general",
      titulo: "Informe General",
      proyecto: proyecto.trim() || "Proyecto Vainilla",
      area: "Proyecto Vainilla",
      lote: "Proyecto Vainilla",
      responsable: responsable.trim() || "GUIMARE",
      fechaReporte: fecha,
      fechaDesde: fecha,
      fechaHasta: fecha,
      temperatura: undefined,
      tempMin: undefined,
      tempMax: undefined,
      humedad: undefined,
      clima: undefined,
      climaOtro: undefined,
      alcalinidad: undefined,
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

  // Guardar Informe General, Descargar Archivo Oficial y Subir a Google Drive
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    const newReport = buildReportObject();

    try {
      // 1. Guardar en localStorage para disponibilidad offline inmediata (SEPARADO de informes diarios)
      try {
        const existing = JSON.parse(localStorage.getItem("vanilla_general_reports") || "[]");
        localStorage.setItem("vanilla_general_reports", JSON.stringify([newReport, ...existing]));
      } catch (storageErr) {
        console.warn("Aviso guardando en localStorage:", storageErr);
      }

      // 1b. Registrar tareas programadas para recordatorios si aplica
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
            if (!deduped.some((d) => `${d.reportId}_${(d.actividadNombre || "").trim().toLowerCase()}_${d.fechaProgramada}` === key)) {
              deduped.push(item);
            }
          }

          localStorage.setItem("vanilla_scheduled_reminders", JSON.stringify(deduped));
          fetch("/api/recordatorios", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reminders: newReminders }),
          }).catch((err) => console.warn("Aviso sincronizando recordatorios:", err));
        } catch (remErr) {
          console.warn("Aviso guardando recordatorios:", remErr);
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
          throw new Error(dbJson.error || "No se pudo guardar en Supabase");
        }
      } catch (apiErr) {
        console.warn("Aviso guardando vía API, usando cliente directo:", apiErr);
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

      // 3. Generar y descargar el PDF Oficial de Informe General
      let pdfBase64 = "";
      let pdfFilename = `Informe_General_${newReport.id}_${todayStr}.pdf`;
      try {
        const pdfResult = await generateDailyReportPDF(newReport, true);
        pdfBase64 = pdfResult.base64;
        pdfFilename = pdfResult.filename;
      } catch (pdfErr) {
        console.error("Error al generar PDF:", pdfErr);
      }

      // 4. Subida automática a Google Drive
      if (pdfBase64) {
        try {
          fetch("/api/drive-upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "general",
              filename: pdfFilename,
              pdfBase64,
              reportId: newReport.id,
              fecha: newReport.fechaReporte,
            }),
          }).catch((driveErr) => console.warn("Aviso subiendo a Drive en segundo plano:", driveErr));
        } catch (uploadErr) {
          console.warn("Aviso petición Drive:", uploadErr);
        }
      }

      // 5. Notificación por correo electrónico
      try {
        fetch("/api/enviar-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ report: newReport, tipo: "informe-general" }),
        }).catch((emailErr) => console.warn("Aviso notificando por correo:", emailErr));
      } catch (emailErr) {
        console.warn("Aviso petición Email:", emailErr);
      }

      setSuccessReport(newReport);
    } catch (err: any) {
      console.error("Error al guardar informe general:", err);
      alert("Hubo un detalle al guardar en la nube: " + (err.message || "Error desconocido") + ". Tus datos están protegidos en tu memoria local.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-vanilla-100/60 py-8 px-4 sm:px-6 lg:px-8">
      {/* MODAL DE ÉXITO */}
      {successReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl border border-vanilla-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-forest-100 text-forest-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-forest-300">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 bg-forest-50 px-2.5 py-1 rounded-full border border-forest-200">
              {successReport.id}
            </span>

            <h3 className="text-xl font-serif font-bold text-forest-950 mt-2 mb-2">
              ¡Informe General Guardado con Éxito!
            </h3>

            <p className="text-xs text-forest-700 mb-6 leading-relaxed">
              El <strong>Informe General oficial</strong> ha sido registrado en la base de datos, descargado en formato PDF en tu dispositivo y enviado a la carpeta de Google Drive.
            </p>

            <div className="space-y-2">
              <Link
                href="/admin"
                className="w-full inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-forest-900 hover:bg-forest-800 text-white font-bold text-xs shadow-md transition-transform active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4 text-vanilla-400" />
                <span>Ver en Panel Administrador (Área General)</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setSuccessReport(null);
                  resetForm();
                }}
                className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-vanilla-100 hover:bg-vanilla-200 text-forest-900 font-semibold text-xs border border-vanilla-300 transition-colors"
              >
                <span>Crear Otro Informe General</span>
              </button>

              <Link
                href="/"
                className="block text-center text-xs text-forest-600 hover:text-forest-900 font-medium pt-2"
              >
                Volver a la Página Principal
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        {/* ENCABEZADO DE PÁGINA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-vanilla-200 shadow-sm">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="p-2.5 rounded-xl border border-vanilla-300 hover:bg-vanilla-100 text-forest-800 transition-colors"
              title="Volver"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-forest-900 text-vanilla-400">
                  <FileSpreadsheet className="w-3 h-3 mr-1" />
                  <span>INFORME GENERAL</span>
                </span>
                <span className="text-xs text-forest-500 font-mono">
                  {fecha}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-forest-950 mt-1">
                Informe General de Actividades
              </h1>
              <p className="text-xs text-forest-600">
                Amazon Vanilla & Waorani People | ITEC Ecuador
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-2 text-xs font-semibold text-forest-700 hover:text-forest-950 bg-vanilla-100 hover:bg-vanilla-200 rounded-lg border border-vanilla-300 transition-colors"
            >
              Limpiar Formulario
            </button>
          </div>
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-vanilla-200 shadow-sm p-6 sm:p-8">
          <div className="space-y-8">
            {/* SECCIÓN 1: DATOS DE IDENTIFICACIÓN Y RESPONSABLE */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-forest-900 mb-4 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-forest-700" />
                <span>1. Datos de Identificación y Responsable</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Fecha (inicia con hoy, editable hacia fechas anteriores o posteriores) */}
                <div>
                  <label className="block text-xs font-bold text-forest-900 mb-1 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-forest-600" />
                    <span>Fecha:</span>
                  </label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full text-xs font-semibold px-3.5 py-2.5 bg-white rounded-lg border border-vanilla-300 text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-600 shadow-sm transition-colors"
                  />
                </div>

                {/* Proyecto (Editable) */}
                <div>
                  <label className="block text-xs font-bold text-forest-900 mb-1 flex items-center space-x-1">
                    <Warehouse className="w-3.5 h-3.5 text-forest-600" />
                    <span>Proyecto:</span>
                  </label>
                  <input
                    type="text"
                    value={proyecto}
                    onChange={(e) => setProyecto(e.target.value)}
                    placeholder="Escribe el proyecto..."
                    className="w-full text-xs font-semibold px-3.5 py-2.5 bg-white rounded-lg border border-vanilla-300 text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-600 shadow-sm transition-colors"
                  />
                </div>

                {/* Responsable Oficial (Editable con sugerencias) */}
                <div>
                  <label className="block text-xs font-bold text-forest-900 mb-1 flex items-center space-x-1">
                    <CheckSquare className="w-3.5 h-3.5 text-forest-600" />
                    <span>Responsable Oficial:</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      list="responsables-sugeridos"
                      value={responsable}
                      onChange={(e) => setResponsable(e.target.value)}
                      placeholder="Escribe o selecciona responsable..."
                      className="w-full text-xs font-semibold px-3.5 py-2.5 bg-white rounded-lg border border-vanilla-300 text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-600 shadow-sm transition-colors"
                    />
                    <datalist id="responsables-sugeridos">
                      {RESPONSABLES_AUTORIZADOS.map((resp) => (
                        <option key={resp} value={resp} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: INFORME GENERAL (TABLA DE ACTIVIDADES) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-forest-900 flex items-center space-x-2">
                  <span className="p-1.5 rounded-lg bg-forest-900 text-vanilla-300">
                    <FileSpreadsheet className="w-4 h-4" />
                  </span>
                  <span>Informe General</span>
                </h2>
                <span className="text-[11px] text-forest-600 font-medium">
                  {actividades.filter((a) => (a.areaLote && a.areaLote.trim() !== "") || (a.descripcion && a.descripcion.trim() !== "") || a.realizado).length} de {actividades.length} con labor registrada
                </span>
              </div>

              <div className="mb-2.5 flex items-center space-x-2 text-[11px] text-forest-800 bg-forest-50 py-1.5 px-3 rounded-lg border border-forest-200">
                <Bell className="w-3.5 h-3.5 text-vanilla-600 flex-shrink-0" />
                <span>
                  <strong>Informe General Agronómico:</strong> Registra las labores realizadas con sus áreas múltiples, observaciones y fecha programada para la siguiente jornada.
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
                        <ChevronDown className="w-3.5 h-3.5 text-forest-700 absolute right-2.5 top-3 pointer-events-none" />
                      </div>
                    </div>

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
                        <ChevronDown className="w-3.5 h-3.5 text-forest-700 absolute right-2.5 top-3 pointer-events-none" />
                      </div>
                    </div>

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
                        <ChevronDown className="w-3.5 h-3.5 text-forest-700 absolute right-2.5 top-3 pointer-events-none" />
                      </div>
                    </div>

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
                          <ChevronDown className="w-3.5 h-3.5 text-forest-700 absolute right-2.5 top-3 pointer-events-none" />
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

            {/* SECCIÓN 6: OBSERVACIONES GENERALES Y FOTOGRAFÍAS */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-forest-900 mb-3">
                6. Observaciones Generales y Fotografías de Campo
              </h2>

              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
                placeholder="Ingrese comentarios generales sobre el estado del cultivo, vigor de plantas, brotes, plagas o requerimientos de manejo..."
                className="w-full text-xs px-3.5 py-2.5 bg-white rounded-xl border border-vanilla-300 text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-600 mb-4"
              />

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
                Al guardar, este informe se registrará en el área de <strong>Informes Generales</strong> del Administrador.
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
                  <span>{saving ? "Guardando..." : "Guardar Informe General"}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
