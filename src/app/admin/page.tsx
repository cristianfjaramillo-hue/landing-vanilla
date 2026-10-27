"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  FileText,
  Download,
  Trash2,
  Calendar,
  Search,
  Filter,
  Plus,
  ArrowLeft,
  Settings,
  Database,
  RefreshCw,
  ExternalLink,
  ClipboardList,
  MessageCircle,
  Lock,
  Sprout,
  Sun,
  Droplets,
  Thermometer,
  Camera,
  Maximize2,
  X,
  Loader2,
  Eye,
  CheckSquare,
  Square,
  CheckCircle2,
  Printer,
  Warehouse,
  Edit3,
  Save,
  MoveUp,
  MoveDown,
  RotateCcw,
  Check,
} from "lucide-react";
import { INITIAL_MOCK_REPORTS, DEFAULT_ACTIVITIES, DEFAULT_TOOLS } from "@/lib/constants";
import { DailyReport, ActivityItem, ToolItem, ActivityProtocol } from "@/lib/types";
import { generateDailyReportPDF, generateActivityProtocolPDF } from "@/lib/pdf-generator";
import { SECTIONS_DATA, RECOMENDACIONES_DATA } from "@/lib/actividades-data";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState(false);

  // Informes
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLote, setFilterLote] = useState("todos");

  // Listados de Actividades Guardados
  const [protocols, setProtocols] = useState<ActivityProtocol[]>([]);
  const [searchProtocolTerm, setSearchProtocolTerm] = useState("");
  const [previewProtocol, setPreviewProtocol] = useState<ActivityProtocol | null>(null);
  const [generatingProtocolPdfId, setGeneratingProtocolPdfId] = useState<string | null>(null);

  // Visualizador de Fotografías (Lightbox) y estado de PDF
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string } | null>(null);
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);

  // Modal de Vista Previa Completa del Informe
  const [previewReport, setPreviewReport] = useState<DailyReport | null>(null);

  // Pestañas (Repositorio vs Actividades vs Configuración vs Recomendaciones)
  const [activeTab, setActiveTab] = useState<"repositorio" | "actividades" | "configuracion" | "recomendaciones">("repositorio");

  // Configuración dinámica de actividades y herramientas
  const [customActivities, setCustomActivities] = useState<ActivityItem[]>(DEFAULT_ACTIVITIES);
  const [customTools, setCustomTools] = useState<ToolItem[]>(DEFAULT_TOOLS);
  const [newActivityName, setNewActivityName] = useState("");
  const [newToolName, setNewToolName] = useState("");

  // Gestión de Recomendaciones Técnicas de Invernadero
  const [recomendaciones, setRecomendaciones] = useState<string[]>(RECOMENDACIONES_DATA);
  const [customCreated, setCustomCreated] = useState<string[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newInputText, setNewInputText] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [isSavingRecs, setIsSavingRecs] = useState(false);
  const [recsSavedSuccess, setRecsSavedSuccess] = useState(false);
  const [landingUpdatedNotice, setLandingUpdatedNotice] = useState<{
    show: boolean;
    count: number;
    time: string;
  }>({ show: false, count: 0, time: "" });

  // Cargar datos
  const loadReports = async () => {
    try {
      // 1. Cargar desde localStorage
      const localData = JSON.parse(localStorage.getItem("vanilla_daily_reports") || "[]");
      const combined = [...localData, ...INITIAL_MOCK_REPORTS];
      // Eliminar duplicados por ID
      const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
      // Ordenar por fecha de más reciente a más antiguo
      unique.sort(
        (a, b) => new Date(b.created_at || b.fechaReporte).getTime() - new Date(a.created_at || a.fechaReporte).getTime()
      );
      setReports(unique);

      // 2. Cargar Protocolos de Actividades desde localStorage (más reciente primero)
      const localProtocols: ActivityProtocol[] = JSON.parse(
        localStorage.getItem("vanilla_saved_actividades") || "[]"
      );
      localProtocols.sort(
        (a, b) => new Date(b.created_at || b.fecha).getTime() - new Date(a.created_at || a.fecha).getTime()
      );
      setProtocols(localProtocols);

      // 3. Cargar Recomendaciones Técnicas desde localStorage
      const savedRecs = localStorage.getItem("vanilla_recomendaciones_data");
      let activeRecsList = RECOMENDACIONES_DATA;
      if (savedRecs) {
        try {
          const parsedRecs = JSON.parse(savedRecs);
          if (Array.isArray(parsedRecs) && parsedRecs.length > 0) {
            // Respetar exactamente la cantidad del usuario (incluso si son menos de 15)
            setRecomendaciones(parsedRecs);
            activeRecsList = parsedRecs;
          } else {
            setRecomendaciones(RECOMENDACIONES_DATA);
            activeRecsList = RECOMENDACIONES_DATA;
            localStorage.setItem("vanilla_recomendaciones_data", JSON.stringify(RECOMENDACIONES_DATA));
          }
        } catch {}
      } else {
        setRecomendaciones(RECOMENDACIONES_DATA);
        activeRecsList = RECOMENDACIONES_DATA;
        localStorage.setItem("vanilla_recomendaciones_data", JSON.stringify(RECOMENDACIONES_DATA));
      }

      const savedCustom = localStorage.getItem("vanilla_recomendaciones_custom_ids");
      if (savedCustom) {
        try {
          const parsedCustom = JSON.parse(savedCustom);
          if (Array.isArray(parsedCustom)) {
            setCustomCreated(parsedCustom);
          }
        } catch {}
      } else {
        const extra = activeRecsList.filter((r) => !RECOMENDACIONES_DATA.includes(r));
        setCustomCreated(extra.slice(0, 5));
      }

      // 4. Intentar cargar desde Supabase si existen
      try {
        const { data, error } = await supabase.from("reportes_diarios").select("*").order("created_at", { ascending: false });
        if (data && data.length > 0) {
          const dbReports: DailyReport[] = [];
          const dbProtocols: ActivityProtocol[] = [];

          data.forEach((row) => {
            const rowData = row.data as any;
            if (row.report_id === "CONFIG_RECOMENDACIONES" && rowData?.recomendaciones) {
              if (Array.isArray(rowData.recomendaciones) && rowData.recomendaciones.length > 0) {
                setRecomendaciones(rowData.recomendaciones);
                localStorage.setItem("vanilla_recomendaciones_data", JSON.stringify(rowData.recomendaciones));
                activeRecsList = rowData.recomendaciones;
              }
            } else if (row.report_id?.startsWith("ACT-") || rowData?.tipo === "protocolo_actividades") {
              dbProtocols.push(rowData as ActivityProtocol);
            } else {
              dbReports.push(rowData as DailyReport);
            }
          });

          if (dbReports.length > 0) {
            const allTogether = Array.from(new Map([...dbReports, ...unique].map((item) => [item.id, item])).values());
            allTogether.sort(
              (a, b) => new Date(b.created_at || b.fechaReporte).getTime() - new Date(a.created_at || a.fechaReporte).getTime()
            );
            setReports(allTogether);
          }

          if (dbProtocols.length > 0) {
            const allProtocols = Array.from(
              new Map([...dbProtocols, ...localProtocols].map((item) => [item.id, item])).values()
            );
            allProtocols.sort(
              (a, b) => new Date(b.created_at || b.fecha).getTime() - new Date(a.created_at || a.fecha).getTime()
            );
            setProtocols(allProtocols);
          }
        }
      } catch (e) {
        // Silencioso si no hay tabla
      }
    } catch (err) {
      console.error("Error al cargar reportes:", err);
    }
  };

  // Guardar y sincronizar recomendaciones técnicas
  const handleSaveRecomendaciones = async (updatedList: string[]) => {
    setIsSavingRecs(true);
    try {
      localStorage.setItem("vanilla_recomendaciones_data", JSON.stringify(updatedList));

      try {
        await supabase.from("reportes_diarios").upsert([
          {
            report_id: "CONFIG_RECOMENDACIONES",
            lote: "Configuración General",
            responsable: "Administrador ITEC",
            fecha_reporte: new Date().toISOString().split("T")[0],
            data: {
              tipo: "configuracion_recomendaciones",
              recomendaciones: updatedList,
              updated_at: new Date().toISOString(),
            },
          },
        ]);
      } catch (dbErr) {
        console.warn("Aviso sincronizando recomendaciones:", dbErr);
      }

      setRecsSavedSuccess(true);
      setTimeout(() => setRecsSavedSuccess(false), 3500);
    } catch (err) {
      console.error("Error guardando recomendaciones:", err);
      alert("Error al guardar recomendaciones en almacenamiento local.");
    } finally {
      setIsSavingRecs(false);
    }
  };

  // Guardar y notificar cambios directamente a la Landing Page
  const handlePublishToLandingPage = async () => {
    setIsSavingRecs(true);
    try {
      localStorage.setItem("vanilla_recomendaciones_data", JSON.stringify(recomendaciones));
      localStorage.setItem("vanilla_recomendaciones_custom_ids", JSON.stringify(customCreated));
      localStorage.setItem("vanilla_recs_user_configured", "true");
      localStorage.setItem("vanilla_recs_count", recomendaciones.length.toString());
      localStorage.setItem("vanilla_recs_last_updated", Date.now().toString());

      try {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "vanilla_recomendaciones_data",
            newValue: JSON.stringify(recomendaciones),
          })
        );
        window.dispatchEvent(
          new CustomEvent("vanilla_recomendaciones_updated", {
            detail: { count: recomendaciones.length, list: recomendaciones },
          })
        );
      } catch {}

      try {
        await supabase.from("reportes_diarios").upsert([
          {
            report_id: "CONFIG_RECOMENDACIONES",
            lote: "Configuración General",
            responsable: "Administrador ITEC",
            fecha_reporte: new Date().toISOString().split("T")[0],
            data: {
              tipo: "configuracion_recomendaciones",
              cantidad: recomendaciones.length,
              recomendaciones: recomendaciones,
              updated_at: new Date().toISOString(),
            },
          },
        ]);
      } catch (dbErr) {
        console.warn("Aviso sincronizando recomendaciones con Supabase:", dbErr);
      }

      setLandingUpdatedNotice({
        show: true,
        count: recomendaciones.length,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      });
      setRecsSavedSuccess(true);
      setTimeout(() => setRecsSavedSuccess(false), 5000);
    } catch (err) {
      console.error("Error al guardar recomendaciones:", err);
      alert("Error al guardar recomendaciones en el sistema.");
    } finally {
      setIsSavingRecs(false);
    }
  };

  const handleStartAddNew = () => {
    if (customCreated.length >= 5) {
      alert("Se ha alcanzado el límite máximo permitido de 5 creaciones de recomendaciones adicionales.");
      return;
    }
    setIsAddingNew(true);
    setNewInputText("");
  };

  const handleConfirmAddNew = async () => {
    const trimmed = newInputText.trim();
    if (!trimmed) return;
    if (customCreated.length >= 5) {
      alert("Se ha alcanzado el límite máximo permitido de 5 creaciones.");
      return;
    }

    const updatedRecs = [...recomendaciones, trimmed];
    const updatedCustom = [...customCreated, trimmed];

    setRecomendaciones(updatedRecs);
    setCustomCreated(updatedCustom);
    setIsAddingNew(false);
    setNewInputText("");

    localStorage.setItem("vanilla_recomendaciones_custom_ids", JSON.stringify(updatedCustom));
    await handleSaveRecomendaciones(updatedRecs);
  };

  const handleUpdateRecomendacion = async (index: number, newText: string) => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    const oldText = recomendaciones[index];
    const updated = [...recomendaciones];
    updated[index] = trimmed;
    setRecomendaciones(updated);
    setEditingIndex(null);

    // Si estaba en customCreated, actualizar su texto
    if (customCreated.includes(oldText)) {
      const updatedCustom = customCreated.map((item) => (item === oldText ? trimmed : item));
      setCustomCreated(updatedCustom);
      localStorage.setItem("vanilla_recomendaciones_custom_ids", JSON.stringify(updatedCustom));
    }

    await handleSaveRecomendaciones(updated);
  };

  const handleDeleteRecomendacion = async (index: number) => {
    const itemToDelete = recomendaciones[index];
    if (confirm(`¿Eliminar la directriz: "${itemToDelete}"?`)) {
      const updatedRecs = recomendaciones.filter((_, i) => i !== index);
      const updatedCustom = customCreated.filter((item) => item !== itemToDelete);

      setRecomendaciones(updatedRecs);
      setCustomCreated(updatedCustom);

      localStorage.setItem("vanilla_recomendaciones_custom_ids", JSON.stringify(updatedCustom));
      await handleSaveRecomendaciones(updatedRecs);
    }
  };

  const handleMoveRecomendacion = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= recomendaciones.length) return;
    const updated = [...recomendaciones];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setRecomendaciones(updated);
    await handleSaveRecomendaciones(updated);
  };

  const handleResetRecomendaciones = async () => {
    if (confirm("¿Restablecer las 15 directrices originales de ITEC Ecuador? Se eliminarán las creaciones adicionales.")) {
      setRecomendaciones(RECOMENDACIONES_DATA);
      setCustomCreated([]);
      setIsAddingNew(false);
      setNewInputText("");
      localStorage.removeItem("vanilla_recomendaciones_custom_ids");
      await handleSaveRecomendaciones(RECOMENDACIONES_DATA);
    }
  };

  useEffect(() => {
    // Verificar si ya inició sesión en esta sesión
    const savedAuth = sessionStorage.getItem("vanilla_admin_auth");
    if (savedAuth === "true") {
      setIsAuthenticated(true);
      loadReports();

      // Abrir pestaña directamente si viene por URL (ej. ?tab=recomendaciones)
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get("tab");
        if (tab === "recomendaciones") {
          setActiveTab("recomendaciones");
        } else if (tab === "actividades") {
          setActiveTab("actividades");
        } else if (tab === "configuracion") {
          setActiveTab("configuracion");
        }
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // La clave configurada en .env o por defecto
    if (passwordInput === "VANILLA2026" || passwordInput === "admin") {
      setIsAuthenticated(true);
      sessionStorage.setItem("vanilla_admin_auth", "true");
      setAuthError(false);
      loadReports();
    } else {
      setAuthError(true);
    }
  };

  // Descargar PDF con Fotos
  const handleDownloadPdf = async (report: DailyReport) => {
    try {
      setGeneratingPdfId(report.id);
      await generateDailyReportPDF(report);
    } catch (err) {
      console.error("Error al generar PDF:", err);
      alert("Hubo un error al generar el PDF.");
    } finally {
      setGeneratingPdfId(null);
    }
  };

  // Eliminar informe
  const handleDeleteReport = (id: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente el reporte ${id}?`)) {
      const updated = reports.filter((r) => r.id !== id);
      setReports(updated);
      localStorage.setItem("vanilla_daily_reports", JSON.stringify(updated));

      try {
        supabase.from("reportes_diarios").delete().eq("report_id", id);
      } catch (e) {}
    }
  };

  // Descargar PDF del Protocolo de Actividades
  const handleDownloadProtocolPdf = async (protocol: ActivityProtocol) => {
    try {
      setGeneratingProtocolPdfId(protocol.id);
      await generateActivityProtocolPDF(protocol);
    } catch (err) {
      console.error("Error al generar PDF del protocolo:", err);
      alert("Hubo un error al generar el PDF del protocolo.");
    } finally {
      setGeneratingProtocolPdfId(null);
    }
  };

  // Eliminar protocolo de actividades
  const handleDeleteProtocol = async (id: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente el protocolo de actividades ${id}?`)) {
      const updated = protocols.filter((p) => p.id !== id);
      setProtocols(updated);
      localStorage.setItem("vanilla_saved_actividades", JSON.stringify(updated));

      try {
        await supabase.from("reportes_diarios").delete().eq("report_id", id);
      } catch (e) {
        console.warn("Error eliminando protocolo en Supabase:", e);
      }
    }
  };

  // Exportar todo a CSV
  const exportAllToCSV = () => {
    if (reports.length === 0) return alert("No hay reportes para exportar.");

    const headers = ["ID", "Fecha", "Lote", "Responsable", "Clima", "TempMin", "TempMax", "Humedad", "Actividades", "Observaciones"];
    const rows = reports.map((r) => [
      `"${r.id}"`,
      `"${r.fechaReporte}"`,
      `"${r.lote}"`,
      `"${r.responsable}"`,
      `"${r.clima}"`,
      r.tempMin,
      r.tempMax,
      r.humedad,
      `"${r.actividades.filter((a) => a.realizado).map((a) => a.nombre).join("; ")}"`,
      `"${(r.observaciones || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reportes_Vainilla_ITEC_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Configuración de formulario: Agregar actividad
  const handleAddActivity = () => {
    if (!newActivityName.trim()) return;
    const newAct: ActivityItem = {
      id: customActivities.length + 1,
      nombre: newActivityName.trim(),
      descripcion: "",
      areaLote: "",
      realizado: false,
    };
    setCustomActivities([...customActivities, newAct]);
    setNewActivityName("");
    alert("Nueva actividad agregada al catálogo del formulario.");
  };

  // Configuración de formulario: Eliminar actividad
  const handleDeleteActivity = (id: number) => {
    setCustomActivities(customActivities.filter((a) => a.id !== id));
  };

  // Filtrado de reportes
  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.lote.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.responsable.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.fechaReporte.includes(searchTerm);

    const matchesLote = filterLote === "todos" || r.lote === filterLote;

    return matchesSearch && matchesLote;
  });

  // Filtrado de protocolos de actividades (organizados con el más reciente primero)
  const filteredProtocols = protocols.filter((p) => {
    const term = searchProtocolTerm.toLowerCase();
    return (
      (p.id && p.id.toLowerCase().includes(term)) ||
      (p.lote && p.lote.toLowerCase().includes(term)) ||
      (p.responsable && p.responsable.toLowerCase().includes(term)) ||
      (p.fecha && p.fecha.includes(term))
    );
  });

  const uniqueLotes = Array.from(new Set(reports.map((r) => r.lote)));

  // Pantalla de Autenticación si no está logueado
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen py-16 px-4 bg-[#FBF8F1] flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-vanilla-200 p-8 text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <Image
              src="/assets/logo-amazon-vanilla-white.png"
              alt="Amazon Vanilla"
              fill
              className="object-contain"
            />
          </div>
          <h1 className="text-xl font-serif font-bold text-forest-900">
            Acceso Administrativo
          </h1>
          <p className="text-xs text-forest-600 mt-1 mb-6">
            Gestión de Informes Diarios y Parámetros ITEC Ecuador
          </p>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-forest-800 mb-1">
                Contraseña de Administrador:
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Ingrese su contraseña (VANILLA2026)"
                  className="w-full text-sm px-3 py-2.5 bg-vanilla-50/50 rounded-lg border border-vanilla-300 focus:outline-none focus:ring-2 focus:ring-forest-600 pl-9"
                  required
                />
                <Lock className="w-4 h-4 text-forest-400 absolute left-3 top-3" />
              </div>
              {authError && (
                <p className="text-xs text-red-600 mt-1 font-medium">
                  Contraseña incorrecta. (Prueba con: VANILLA2026)
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-forest-900 hover:bg-forest-800 text-white font-bold text-xs tracking-wide shadow-md transition-colors"
            >
              Iniciar Sesión
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-vanilla-100 text-center">
            <Link href="/" className="text-xs text-forest-600 hover:text-vanilla-600">
              ← Volver al inicio de la Landing
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-[#FBF8F1]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Admin */}
        <div className="bg-forest-900 text-white p-6 sm:p-8 rounded-2xl shadow-lg border border-forest-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative w-12 h-12 bg-white/10 rounded-xl p-1 flex-shrink-0">
              <Image
                src="/assets/logo-amazon-vanilla-white.png"
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-vanilla-400" />
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-vanilla-200">
                  Panel de Administración & Trazabilidad de Campo
                </h1>
              </div>
              <p className="text-xs text-forest-200 mt-0.5">
                Repositorio Oficial y Control Agronómico de Informes Diarios | ITEC Ecuador & Territorio Waorani
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab("recomendaciones")}
              className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow ${
                activeTab === "recomendaciones"
                  ? "bg-vanilla-400 text-forest-950 ring-2 ring-vanilla-200"
                  : "bg-vanilla-500 hover:bg-vanilla-600 text-forest-950"
              }`}
              title="Editar directrices y recomendaciones técnicas del listado de actividades"
            >
              <Edit3 className="w-3.5 h-3.5 text-forest-950" />
              <span>Editar Recomendaciones</span>
            </button>
            <Link
              href="/reportes/nuevo"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-forest-800 hover:bg-forest-700 text-vanilla-200 text-xs font-semibold border border-forest-600 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generar Informe Diario</span>
            </Link>
            <Link
              href="/actividades"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-forest-800 hover:bg-forest-700 text-vanilla-200 text-xs font-semibold border border-forest-600 transition-colors"
              title="Abrir Listado Integral de Actividades en nueva ventana"
            >
              <ClipboardList className="w-3.5 h-3.5 text-vanilla-400" />
              <span>Listado de Actividades</span>
              <ExternalLink className="w-3 h-3 text-vanilla-400" />
            </Link>
            <button
              onClick={exportAllToCSV}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-forest-800 hover:bg-forest-700 text-white text-xs font-semibold border border-forest-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-vanilla-400" />
              <span>Exportar Excel / CSV</span>
            </button>
            <button
              onClick={() => {
                sessionStorage.removeItem("vanilla_admin_auth");
                setIsAuthenticated(false);
              }}
              className="px-3 py-2 rounded-lg text-xs text-forest-300 hover:text-white transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex flex-wrap gap-2 border-b border-vanilla-300 pb-2">
          <button
            onClick={() => setActiveTab("repositorio")}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all ${
              activeTab === "repositorio"
                ? "bg-forest-900 text-white shadow-sm"
                : "bg-white text-forest-800 border border-vanilla-200 hover:bg-vanilla-100"
            }`}
          >
            <Sprout className="w-4 h-4 text-vanilla-400" />
            <span>Trazabilidad & Informes ({reports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("actividades")}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all ${
              activeTab === "actividades"
                ? "bg-forest-900 text-white shadow-sm"
                : "bg-white text-forest-800 border border-vanilla-200 hover:bg-vanilla-100"
            }`}
          >
            <ClipboardList className="w-4 h-4 text-vanilla-400" />
            <span>Listados de Actividades ({protocols.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("recomendaciones")}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all ${
              activeTab === "recomendaciones"
                ? "bg-forest-900 text-white shadow-sm"
                : "bg-white text-forest-800 border border-vanilla-200 hover:bg-vanilla-100"
            }`}
          >
            <Edit3 className="w-4 h-4 text-vanilla-400" />
            <span>Recomendaciones ({recomendaciones.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("configuracion")}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all ${
              activeTab === "configuracion"
                ? "bg-forest-900 text-white shadow-sm"
                : "bg-white text-forest-800 border border-vanilla-200 hover:bg-vanilla-100"
            }`}
          >
            <Settings className="w-4 h-4 text-vanilla-400" />
            <span>Configuración del Formulario</span>
          </button>
        </div>

        {/* PESTAÑA 1: REPOSITORIO Y TRAZABILIDAD DE CAMPO */}
        {activeTab === "repositorio" && (
          <div className="space-y-6">
            {/* Resumen de Métricas de Trazabilidad */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-vanilla-200 shadow-sm text-center">
                <span className="text-xs text-forest-600 font-medium">Informes Emitidos</span>
                <p className="text-2xl font-serif font-bold text-forest-900 mt-1">{reports.length}</p>
                <span className="text-[10px] text-forest-400">Total en territorio</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-vanilla-200 shadow-sm text-center">
                <span className="text-xs text-forest-600 font-medium">Chakras / Lotes</span>
                <p className="text-2xl font-serif font-bold text-vanilla-600 mt-1">{uniqueLotes.length}</p>
                <span className="text-[10px] text-forest-400">En monitoreo activo</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-vanilla-200 shadow-sm text-center">
                <span className="text-xs text-forest-600 font-medium">Temp. Promedio</span>
                <p className="text-2xl font-serif font-bold text-forest-900 mt-1">
                  {reports.length > 0
                    ? Math.round(reports.reduce((acc, r) => acc + (r.tempMax || 28), 0) / reports.length)
                    : 28}
                  °C
                </p>
                <span className="text-[10px] text-forest-400">Condición térmica</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-vanilla-200 shadow-sm text-center">
                <span className="text-xs text-forest-600 font-medium">Humedad Promedio</span>
                <p className="text-2xl font-serif font-bold text-blue-600 mt-1">
                  {reports.length > 0
                    ? Math.round(reports.reduce((acc, r) => acc + (r.humedad || 85), 0) / reports.length)
                    : 85}
                  %
                </p>
                <span className="text-[10px] text-forest-400">Humedad de bosque</span>
              </div>
            </div>

            {/* Barra de Filtros y Búsqueda */}
            <div className="bg-white p-4 rounded-xl border border-vanilla-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-forest-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por lote, responsable, fecha..."
                  className="w-full text-xs pl-9 pr-3 py-2 bg-vanilla-50/50 rounded-lg border border-vanilla-200 focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
              </div>

              <div className="flex flex-wrap items-center space-x-3 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-forest-600" />
                <select
                  value={filterLote}
                  onChange={(e) => setFilterLote(e.target.value)}
                  className="text-xs px-3 py-2 bg-white rounded-lg border border-vanilla-200 focus:outline-none"
                >
                  <option value="todos">Todos los Lotes</option>
                  {uniqueLotes.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>

                <button
                  onClick={loadReports}
                  className="p-2 rounded-lg text-forest-600 hover:bg-vanilla-100 transition-colors"
                  title="Actualizar listado"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Listado de Informes Ordenados Cronológicamente */}
            {filteredReports.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-vanilla-200">
                <FileText className="w-12 h-12 text-forest-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-forest-900">
                  No se encontraron informes diarios
                </h3>
                <p className="text-xs text-forest-600 mt-1 mb-4">
                  Comienza registrando las actividades de la chakra desde el formulario de campo.
                </p>
                <Link
                  href="/reportes/nuevo"
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-forest-900 text-white text-xs font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Primer Informe</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredReports.map((report) => {
                  const actRealizadasCount = report.actividades.filter((a) => a.realizado).length;
                  return (
                    <div
                      key={report.id}
                      className="bg-white rounded-xl p-5 border border-vanilla-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      {/* Información Principal */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-forest-100 text-forest-900">
                            {report.id}
                          </span>
                          <span className="text-xs font-semibold text-forest-700 flex items-center space-x-1">
                            <Calendar className="w-3.5 h-3.5 text-vanilla-600" />
                            <span>{report.fechaReporte}</span>
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-vanilla-100 text-vanilla-800 font-medium">
                            {report.clima} ({report.tempMin}°C - {report.tempMax}°C)
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-forest-900">
                          {report.lote}
                        </h3>
                        <p className="text-xs text-forest-600">
                          Responsable: <strong>{report.responsable}</strong>
                        </p>

                        <div className="pt-2 flex flex-wrap gap-1.5 text-[11px]">
                          <span className="px-2 py-0.5 rounded bg-forest-50 text-forest-800 border border-forest-200">
                            Actividades: <strong>{actRealizadasCount}</strong> realizadas
                          </span>
                        </div>

                        {/* Fotografías de Campo Adjuntas */}
                        {Boolean(report.foto1Url || report.foto2Url || report.foto3Url) && (
                          <div className="pt-2.5 mt-2 border-t border-vanilla-100">
                            <span className="text-[11px] font-bold text-forest-700 flex items-center space-x-1 mb-2">
                              <Camera className="w-3.5 h-3.5 text-vanilla-600" />
                              <span>
                                Registro Fotográfico ({[report.foto1Url, report.foto2Url, report.foto3Url].filter(Boolean).length} fotos):
                              </span>
                            </span>
                            <div className="flex flex-wrap items-center gap-2.5">
                              {[
                                { label: "Foto 1", url: report.foto1Url },
                                { label: "Foto 2", url: report.foto2Url },
                                { label: "Foto 3", url: report.foto3Url },
                              ]
                                .filter((item) => Boolean(item.url))
                                .map((item, idx) => (
                                  <div
                                    key={idx}
                                    onClick={() =>
                                      setSelectedPhoto({
                                        url: item.url!,
                                        title: `${item.label} | ${report.lote} (${report.fechaReporte})`,
                                      })
                                    }
                                    className="group relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-vanilla-300 hover:border-forest-600 cursor-pointer shadow-sm transition-all hover:scale-105 bg-vanilla-100"
                                    title={`Click para ampliar ${item.label}`}
                                  >
                                    <img
                                      src={item.url!}
                                      alt={item.label}
                                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-forest-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                      <Maximize2 className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="absolute bottom-0 inset-x-0 bg-forest-950/80 text-white text-[9px] text-center py-0.5 font-semibold">
                                      {item.label}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Botones de Acción (Vista Previa, Descarga PDF con fotos, WhatsApp, Eliminar) */}
                      <div className="flex flex-wrap items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-vanilla-100">
                        <button
                          onClick={() => setPreviewReport(report)}
                          className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-vanilla-500 hover:bg-vanilla-600 text-forest-950 text-xs font-bold transition-transform active:scale-95 shadow-sm"
                          title="Ver Vista Previa Completa del Informe"
                        >
                          <Eye className="w-3.5 h-3.5 text-forest-950" />
                          <span>Vista Previa</span>
                        </button>

                        <button
                          onClick={() => handleDownloadPdf(report)}
                          disabled={generatingPdfId === report.id}
                          className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-forest-900 hover:bg-forest-800 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                          title="Descargar PDF Oficial con Fotos"
                        >
                          {generatingPdfId === report.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-vanilla-400" />
                              <span>Generando...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5 text-vanilla-400" />
                              <span>PDF con Fotos</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            const text = `Informe ${report.id} - Lote: ${report.lote} (${report.fechaReporte}).`;
                            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
                          }}
                          className="p-2 rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] text-white transition-colors"
                          title="Compartir por WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                          title="Eliminar Reporte"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 2: LISTADOS DE ACTIVIDADES GUARDADOS */}
        {activeTab === "actividades" && (
          <div className="space-y-6">
            {/* Métricas de Protocolos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-vanilla-200 shadow-sm text-center">
                <span className="text-xs text-forest-600 font-medium">Protocolos Registrados</span>
                <p className="text-2xl font-serif font-bold text-forest-900 mt-1">{protocols.length}</p>
                <span className="text-[10px] text-forest-400">Total guardados en sistema</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-vanilla-200 shadow-sm text-center">
                <span className="text-xs text-forest-600 font-medium">Promedio de Cumplimiento</span>
                <p className="text-2xl font-serif font-bold text-emerald-700 mt-1">
                  {protocols.length > 0
                    ? Math.round(protocols.reduce((acc, p) => acc + (p.porcentaje || 0), 0) / protocols.length)
                    : 0}
                  %
                </p>
                <span className="text-[10px] text-forest-400">Avance agronómico general</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-vanilla-200 shadow-sm text-center">
                <span className="text-xs text-forest-600 font-medium">Invernaderos Monitoreados</span>
                <p className="text-2xl font-serif font-bold text-vanilla-600 mt-1">
                  {Array.from(new Set(protocols.map((p) => p.lote))).length}
                </p>
                <span className="text-[10px] text-forest-400">Chakras / sectores</span>
              </div>
            </div>

            {/* Barra de Búsqueda y Acciones */}
            <div className="bg-white p-4 rounded-xl border border-vanilla-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-forest-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por código, invernadero, responsable o fecha..."
                  value={searchProtocolTerm}
                  onChange={(e) => setSearchProtocolTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-vanilla-300 text-xs text-forest-900 focus:outline-none focus:border-forest-700 bg-vanilla-50/40"
                />
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <Link
                  href="/actividades"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo Protocolo</span>
                  <ExternalLink className="w-3 h-3 text-vanilla-300 ml-0.5" />
                </Link>

                <button
                  onClick={loadReports}
                  className="p-2 rounded-lg border border-vanilla-300 hover:bg-vanilla-50 text-forest-700 transition-colors"
                  title="Actualizar listado"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Listado de Protocolos Guardados (Nuevo primero) */}
            {filteredProtocols.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-vanilla-200">
                <ClipboardList className="w-12 h-12 text-forest-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-forest-900">
                  No se encontraron protocolos de actividades guardados
                </h3>
                <p className="text-xs text-forest-600 mt-1 mb-4">
                  Comienza completando y guardando las actividades desde la lámina integral de invernadero.
                </p>
                <Link
                  href="/actividades"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Primer Protocolo</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredProtocols.map((protocol) => {
                  return (
                    <div
                      key={protocol.id}
                      className="bg-white rounded-xl p-5 border border-vanilla-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      {/* Datos Principales */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-forest-900 text-vanilla-300">
                            {protocol.id}
                          </span>
                          <span className="text-xs font-semibold text-forest-700 flex items-center space-x-1">
                            <Calendar className="w-3.5 h-3.5 text-vanilla-600" />
                            <span>{protocol.fecha}</span>
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              protocol.porcentaje >= 75
                                ? "bg-emerald-100 text-emerald-800"
                                : protocol.porcentaje >= 40
                                ? "bg-amber-100 text-amber-800"
                                : "bg-forest-100 text-forest-800"
                            }`}
                          >
                            {protocol.completadas} de {protocol.totalActividades} completadas ({protocol.porcentaje}%)
                          </span>
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-forest-950">
                            {protocol.lote || "Invernadero Principal"}
                          </h3>
                          <p className="text-xs text-forest-600">
                            Responsable: <span className="font-semibold text-forest-800">{protocol.responsable}</span>
                          </p>
                        </div>

                        {/* Barra de progreso visual */}
                        <div className="w-full max-w-md bg-vanilla-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-2 rounded-full transition-all"
                            style={{ width: `${protocol.porcentaje}%` }}
                          />
                        </div>

                        {protocol.observaciones && (
                          <p className="text-xs text-forest-700 italic bg-vanilla-50/80 p-2 rounded-lg border border-vanilla-200 line-clamp-2">
                            "{protocol.observaciones}"
                          </p>
                        )}
                      </div>

                      {/* Botones de Acción */}
                      <div className="flex items-center space-x-2 self-end md:self-center flex-shrink-0">
                        {/* Vista Previa */}
                        <button
                          onClick={() => setPreviewProtocol(protocol)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-forest-900 hover:bg-forest-800 text-white text-xs font-semibold transition-colors"
                          title="Ver Vista Previa del Protocolo"
                        >
                          <Eye className="w-3.5 h-3.5 text-vanilla-400" />
                          <span>Vista Previa</span>
                        </button>

                        {/* Descarga PDF */}
                        <button
                          onClick={() => handleDownloadProtocolPdf(protocol)}
                          disabled={generatingProtocolPdfId === protocol.id}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-vanilla-500 hover:bg-vanilla-600 text-forest-950 text-xs font-bold transition-colors disabled:opacity-50"
                          title="Descargar Protocolo en PDF"
                        >
                          {generatingProtocolPdfId === protocol.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Generando...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>Descargar PDF</span>
                            </>
                          )}
                        </button>

                        {/* Eliminar */}
                        <button
                          onClick={() => handleDeleteProtocol(protocol.id)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                          title="Eliminar Protocolo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 2: CONFIGURACIÓN DINÁMICA DEL FORMULARIO */}
        {activeTab === "configuracion" && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-vanilla-200 shadow-sm space-y-8">
            <div>
              <h2 className="text-lg font-serif font-bold text-forest-900 mb-1">
                Personalización de Campos del Formulario
              </h2>
              <p className="text-xs text-forest-600">
                Como administrador, puedes modificar las actividades y herramientas disponibles para los técnicos en campo.
              </p>
            </div>

            {/* Catálogo de Actividades */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-forest-900 mb-3">
                1. Catálogo de Actividades Agronómicas
              </h3>

              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  value={newActivityName}
                  onChange={(e) => setNewActivityName(e.target.value)}
                  placeholder="Nombre de la nueva actividad (ej. Cosecha y curado de vainas)"
                  className="flex-1 text-xs px-3 py-2 bg-vanilla-50/50 rounded-lg border border-vanilla-300 focus:outline-none"
                />
                <button
                  onClick={handleAddActivity}
                  className="px-4 py-2 bg-forest-900 text-white rounded-lg text-xs font-semibold hover:bg-forest-800 transition-colors"
                >
                  Agregar Actividad
                </button>
              </div>

              <div className="space-y-2">
                {customActivities.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-center justify-between p-2.5 bg-vanilla-50/60 rounded-lg border border-vanilla-200 text-xs"
                  >
                    <span className="font-semibold text-forest-900">
                      {act.id}. {act.nombre}
                    </span>
                    <button
                      onClick={() => handleDeleteActivity(act.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Eliminar de la lista"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Mensaje de Persistencia */}
            <div className="p-4 bg-forest-50 rounded-xl border border-forest-200 text-xs text-forest-800">
              💡 <strong>Nota del Sistema:</strong> Cualquier cambio en los catálogos se refleja de inmediato en la interfaz del formulario de campo en territorio.
            </div>
          </div>
        )}

        {/* PESTAÑA: GESTIÓN Y EDICIÓN DE RECOMENDACIONES TÉCNICAS */}
        {activeTab === "recomendaciones" && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-vanilla-200 shadow-sm space-y-8 animate-in fade-in duration-200">
            {/* Header del Editor */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-vanilla-200 pb-5">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-forest-900 text-vanilla-400 flex items-center justify-center font-bold">
                    ★
                  </div>
                  <h2 className="text-xl font-serif font-bold text-forest-900">
                    Editor de Recomendaciones Técnicas
                  </h2>
                </div>
                <p className="text-xs text-forest-600 mt-1">
                  Administra las directrices agronómicas que se muestran en el cuadro <strong>"RECOMENDACIONES"</strong> del Listado de Actividades de Invernadero. Cualquier cambio se actualiza inmediatamente en el sistema.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                {/* Botón Principal Guardar e Informar a la Landing Page */}
                <button
                  type="button"
                  onClick={handlePublishToLandingPage}
                  disabled={isSavingRecs}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 border border-emerald-500"
                  title="Guardar todos los cambios e informar a la Landing Page la nueva cantidad de recomendaciones"
                >
                  {isSavingRecs ? (
                    <Loader2 className="w-4 h-4 animate-spin text-vanilla-300" />
                  ) : (
                    <Save className="w-4 h-4 text-vanilla-300 stroke-[2.5]" />
                  )}
                  <span>Guardar y Actualizar Landing Page</span>
                  <span className="text-[10px] bg-emerald-900 px-1.5 py-0.5 rounded text-emerald-100 font-mono">
                    {recomendaciones.length}
                  </span>
                </button>

                <Link
                  href="/actividades"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-700 text-white text-xs font-semibold transition-colors border border-forest-700"
                >
                  <Eye className="w-3.5 h-3.5 text-vanilla-400" />
                  <span className="hidden sm:inline">Ver en Actividades</span>
                  <ExternalLink className="w-3 h-3 text-vanilla-400" />
                </Link>

                <button
                  type="button"
                  onClick={handleResetRecomendaciones}
                  className="inline-flex items-center space-x-1 px-3 py-2.5 rounded-xl border border-vanilla-300 text-forest-700 hover:bg-vanilla-50 text-xs font-medium transition-colors"
                  title="Restablecer a las 15 directrices predeterminadas de ITEC"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-forest-600" />
                  <span>Restablecer ITEC</span>
                </button>
              </div>
            </div>

            {/* Banner Específico de Notificación a la Landing Page */}
            {landingUpdatedNotice.show && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 border-2 border-emerald-500 text-emerald-950 shadow-md flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950 flex items-center space-x-2">
                      <span>¡Guardado Exitoso! Landing Page Notificada</span>
                      <span className="text-[11px] bg-emerald-800 text-white px-2 py-0.5 rounded-full font-mono">
                        {landingUpdatedNotice.count} Directrices Activas
                      </span>
                    </h4>
                    <p className="text-xs text-emerald-900 mt-1">
                      Se ha informado a la <strong>Landing Page</strong>, a la <strong>Barra de Navegación</strong> y al <strong>Listado de Actividades</strong> que la cantidad total de recomendaciones ahora es de <strong>{landingUpdatedNotice.count} casilleros</strong>. Los cambios ya son visibles en tiempo real para todos los visitantes.
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <Link
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-emerald-900 font-bold hover:underline"
                      >
                        <span>Ver Landing Page Principal</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                      <span className="text-emerald-400">•</span>
                      <Link
                        href="/actividades"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-emerald-900 font-bold hover:underline"
                      >
                        <span>Ver Listado de Actividades</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                      <span className="text-emerald-400">•</span>
                      <span className="text-[10px] text-emerald-700 font-mono">
                        Actualizado a las {landingUpdatedNotice.time}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLandingUpdatedNotice((prev) => ({ ...prev, show: false }))}
                  className="p-1 text-emerald-700 hover:text-emerald-950 hover:bg-emerald-200/60 rounded-lg text-xs"
                  title="Cerrar notificación"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Banner de Éxito al Guardar */}
            {recsSavedSuccess && !landingUpdatedNotice.show && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-400 text-emerald-900 text-xs font-semibold flex items-center space-x-2 animate-in fade-in duration-200">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 stroke-[3]" />
                <span>
                  ¡Recomendaciones guardadas y sincronizadas con éxito! Los técnicos ya pueden visualizarlas actualizadas en el Listado de Actividades.
                </span>
              </div>
            )}

            {/* Vista Previa Interactiva Estilo Lámina de Invernadero */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-forest-900">
                  Directrices Activas ({recomendaciones.length}) — Haz clic en el lápiz para editar cualquier texto
                </h3>
                <span className="text-[11px] text-forest-500">
                  Usa las flechas ↑ ↓ para ordenar la posición
                </span>
              </div>

              {/* Contenedor del Cuadro tal como se ve en Actividades */}
              <div className="rounded-xl overflow-hidden border-2 border-forest-900 shadow-md">
                {/* Encabezado del Cuadro */}
                <div className="bg-forest-900 text-white p-3.5 flex items-center justify-between border-b-2 border-vanilla-500">
                  <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-vanilla-500 text-forest-950 font-bold text-xs flex items-center justify-center flex-shrink-0 shadow">
                      ★
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-vanilla-200 uppercase tracking-tight truncate">
                      RECOMENDACIONES
                    </h3>
                  </div>
                  <div className="px-2.5 py-0.5 rounded bg-forest-800 text-vanilla-300 text-[10px] font-semibold border border-forest-700 uppercase tracking-wider">
                    Directrices Técnicas • Sin Checklist
                  </div>
                </div>

                {/* Sub-barra informativa */}
                <div className="bg-forest-950/90 px-3 py-1.5 flex items-center justify-between text-[11px] text-forest-200">
                  <span>
                    Total: <strong>{recomendaciones.length}</strong> directrices esenciales de manejo agronómico y bioseguridad
                  </span>
                  <span className="text-vanilla-300 text-[10px] font-medium hidden sm:inline">
                    Supervisión ITEC Ecuador
                  </span>
                </div>

                {/* Lista de Items con edición individual y reacomodo automático */}
                <div className="p-4 bg-gradient-to-b from-[#FAF7F2] to-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 auto-rows-fr">
                  {recomendaciones.map((item, idx) => {
                    const isEditing = editingIndex === idx;

                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                          isEditing
                            ? "bg-amber-50/80 border-amber-400 ring-2 ring-amber-300 shadow-md"
                            : "bg-white border-vanilla-300 hover:border-forest-600 hover:shadow-sm"
                        }`}
                      >
                        {isEditing ? (
                          <div className="space-y-2.5 flex flex-col justify-between h-full">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-[11px] font-bold text-forest-900">
                                <span className="flex items-center space-x-1.5">
                                  <Edit3 className="w-3.5 h-3.5 text-forest-700" />
                                  <span>Editando Casillero #{idx + 1}:</span>
                                </span>
                                <span className="text-[10px] text-forest-500 font-normal">
                                  Enter para guardar
                                </span>
                              </div>
                              <textarea
                                rows={3}
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleUpdateRecomendacion(idx, editingText);
                                  } else if (e.key === "Escape") {
                                    setEditingIndex(null);
                                  }
                                }}
                                className="w-full text-xs p-2.5 bg-white rounded-lg border-2 border-forest-700 focus:outline-none focus:ring-2 focus:ring-forest-900 font-medium text-forest-950 shadow-inner"
                                autoFocus
                              />
                            </div>
                            <div className="flex items-center justify-end space-x-2 pt-1 border-t border-vanilla-300">
                              <button
                                type="button"
                                onClick={() => setEditingIndex(null)}
                                className="px-2.5 py-1 rounded-md border border-vanilla-300 hover:bg-white text-forest-700 text-xs font-semibold"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateRecomendacion(idx, editingText)}
                                disabled={!editingText.trim() || isSavingRecs}
                                className="px-3 py-1 rounded-md bg-forest-900 hover:bg-forest-800 text-white text-xs font-bold shadow flex items-center space-x-1 disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5 text-vanilla-400" />
                                <span>{isSavingRecs ? "Guardando..." : "Guardar"}</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col justify-between h-full gap-2.5">
                            {/* Texto del casillero con acceso directo a edición al hacer clic */}
                            <div
                              onClick={() => {
                                setEditingIndex(idx);
                                setEditingText(item);
                              }}
                              className="flex items-start space-x-2.5 flex-1 min-w-0 cursor-pointer group"
                              title="Haz clic para editar este casillero directamente"
                            >
                              <div className="w-4 h-4 rounded-full border border-forest-800 bg-vanilla-400 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs group-hover:scale-110 transition-transform">
                                <div className="w-1.5 h-1.5 rounded-full bg-forest-950" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-1.5 mb-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 bg-vanilla-100 px-1.5 py-0.2 rounded border border-vanilla-300">
                                    Casillero #{idx + 1}
                                  </span>
                                  {customCreated.includes(item) && (
                                    <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                                      Personalizada
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-semibold text-forest-950 leading-snug break-words group-hover:text-forest-700 transition-colors">
                                  {item}
                                </p>
                              </div>
                            </div>

                            {/* Barra inferior de acciones del casillero: Botón Editar y Botones Reordenar / Eliminar */}
                            <div className="flex items-center justify-between pt-2 border-t border-vanilla-200/80">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingIndex(idx);
                                  setEditingText(item);
                                }}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-vanilla-200/90 hover:bg-forest-900 text-forest-900 hover:text-vanilla-200 text-xs font-bold transition-all shadow-xs"
                                title="Editar texto de este casillero"
                              >
                                <Edit3 className="w-3 h-3 text-forest-700 group-hover:text-vanilla-300" />
                                <span>Editar</span>
                              </button>

                              <div className="flex items-center space-x-1 bg-vanilla-100/70 p-0.5 rounded-lg border border-vanilla-200">
                                <button
                                  type="button"
                                  onClick={() => handleMoveRecomendacion(idx, "up")}
                                  disabled={idx === 0}
                                  className="p-1 text-forest-600 hover:text-forest-950 hover:bg-white rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Mover arriba"
                                >
                                  <MoveUp className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleMoveRecomendacion(idx, "down")}
                                  disabled={idx === recomendaciones.length - 1}
                                  className="p-1 text-forest-600 hover:text-forest-950 hover:bg-white rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Mover abajo"
                                >
                                  <MoveDown className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteRecomendacion(idx)}
                                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                  title="Eliminar este casillero"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sección Final: Botón Agregar Recomendación a la Derecha con Límite de 5 y Casilla para Escribir */}
              <div className="mt-4 flex flex-col items-end">
                <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between w-full gap-2">
                  <div className="text-xs text-forest-700 flex items-center space-x-2">
                    <span className="font-semibold">Creaciones adicionales:</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        customCreated.length >= 5
                          ? "bg-red-100 text-red-700 border border-red-300"
                          : "bg-forest-100 text-forest-800 border border-forest-200"
                      }`}
                    >
                      {customCreated.length} de 5 utilizadas
                    </span>
                    {customCreated.length >= 5 && (
                      <span className="text-red-600 text-[11px] font-medium hidden sm:inline">
                        (Límite de 5 alcanzado)
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Botón de Guardado para la Landing Page */}
                    <button
                      type="button"
                      onClick={handlePublishToLandingPage}
                      disabled={isSavingRecs}
                      className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 border border-emerald-500"
                      title="Guardar todos los cambios e informar a la Landing Page la nueva cantidad de recomendaciones"
                    >
                      {isSavingRecs ? (
                        <Loader2 className="w-4 h-4 animate-spin text-vanilla-300" />
                      ) : (
                        <Save className="w-4 h-4 text-vanilla-300 stroke-[2.5]" />
                      )}
                      <span>Guardar y Actualizar Landing Page</span>
                      <span className="text-[10px] bg-emerald-900 px-1.5 py-0.5 rounded text-emerald-100 font-mono">
                        {recomendaciones.length} casilleros
                      </span>
                    </button>

                    {/* Botón al final de todo al lado derecho */}
                    <button
                      type="button"
                      onClick={handleStartAddNew}
                      disabled={customCreated.length >= 5 || isAddingNew}
                      className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-forest-900 hover:bg-forest-800 active:bg-forest-950 text-vanilla-200 hover:text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-forest-700 border border-vanilla-500/40"
                      title={
                        customCreated.length >= 5
                          ? "Límite máximo de 5 creaciones alcanzado"
                          : "Agregar una nueva recomendación técnica"
                      }
                    >
                      <Plus className="w-4 h-4 text-vanilla-400 stroke-[2.5]" />
                      <span>Agregar Recomendación</span>
                      <span className="text-[10px] bg-forest-950 px-1.5 py-0.5 rounded text-vanilla-300 font-mono">
                        {customCreated.length}/5
                      </span>
                    </button>
                  </div>
                </div>

                {/* Casilla interactiva para escribir nueva recomendación al dar clic bajo esa opción */}
                {isAddingNew && (
                  <div className="w-full mt-3 p-4 sm:p-5 rounded-xl border-2 border-forest-800 bg-amber-50/40 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-forest-900 flex items-center space-x-1.5">
                        <Plus className="w-4 h-4 text-forest-700 stroke-[2.5]" />
                        <span>Nueva Casilla de Redacción ({customCreated.length + 1} de 5 permitidas)</span>
                      </span>
                      <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                        Disponibles: {5 - customCreated.length}
                      </span>
                    </div>

                    <textarea
                      rows={3}
                      value={newInputText}
                      onChange={(e) => setNewInputText(e.target.value)}
                      placeholder="Escribe aquí la recomendación técnica a incorporar en el invernadero..."
                      className="w-full text-xs p-3 bg-white rounded-lg border border-vanilla-400 focus:outline-none focus:ring-2 focus:ring-forest-600 font-medium text-forest-950 placeholder:text-forest-400 shadow-inner resize-y"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                          e.preventDefault();
                          handleConfirmAddNew();
                        }
                      }}
                    />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3">
                      <p className="text-[11px] text-forest-600">
                        Presiona <strong>Guardar Recomendación</strong> para incorporarla al protocolo y sincronizar en tiempo real.
                      </p>

                      <div className="flex items-center space-x-2 self-end">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingNew(false);
                            setNewInputText("");
                          }}
                          className="px-3.5 py-1.5 rounded-lg border border-vanilla-300 hover:bg-vanilla-100 text-forest-700 text-xs font-semibold transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmAddNew}
                          disabled={!newInputText.trim() || isSavingRecs}
                          className="px-4 py-1.5 rounded-lg bg-forest-900 hover:bg-forest-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow flex items-center space-x-1.5 transition-colors"
                        >
                          <Save className="w-3.5 h-3.5 text-vanilla-400" />
                          <span>{isSavingRecs ? "Guardando..." : "Guardar Recomendación"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Nota de sincronización */}
            <div className="p-4 bg-vanilla-50 rounded-xl border border-vanilla-200 text-xs text-forest-800 flex items-start space-x-2">
              <span className="text-base">💡</span>
              <p>
                <strong>Sincronización en tiempo real:</strong> Cada vez que agregues, edites, reordenes o elimines una recomendación, el cambio se guardará automáticamente en el sistema y se actualizará tanto en la lámina técnica de invernadero como en los protocolos impresos y descargados.
              </p>
            </div>
          </div>
        )}

        {/* Modal de Vista Previa Completa del Informe */}
        {previewReport && (
          <div
            onClick={() => setPreviewReport(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-vanilla-200 flex flex-col my-auto"
            >
              {/* Cabecera Oficial del Informe */}
              <div className="bg-forest-900 text-white p-5 sm:p-6 border-b-4 border-vanilla-500 sticky top-0 z-10 flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  <div className="relative w-12 h-12 bg-white/10 rounded-xl p-1 flex-shrink-0">
                    <Image
                      src="/assets/logo-amazon-vanilla-white.png"
                      alt="Logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-vanilla-500 text-forest-950">
                        {previewReport.id}
                      </span>
                      <h2 className="text-base sm:text-lg font-serif font-bold text-vanilla-200">
                        INFORME DIARIO - CULTIVO DE VAINILLA
                      </h2>
                    </div>
                    <p className="text-[11px] text-forest-200 uppercase tracking-wider">
                      Seguimiento y Control del Cultivo | ITEC Ecuador - Territorio Waorani
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setPreviewReport(null)}
                  className="p-1.5 rounded-full hover:bg-forest-800 text-forest-200 hover:text-white transition-colors"
                  title="Cerrar Vista Previa"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contenido Completo del Informe */}
              <div className="p-6 space-y-6 text-xs text-forest-900">
                {/* 1. Rango de Fechas & Responsable */}
                <div className="bg-vanilla-50 p-4 rounded-xl border border-vanilla-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="font-bold text-forest-700 block uppercase text-[10px]">
                      Rango de Fechas del Informe:
                    </span>
                    <p className="font-medium text-sm mt-0.5">
                      Desde: <span className="font-semibold">{previewReport.fechaDesde}</span> — Hasta:{" "}
                      <span className="font-semibold">{previewReport.fechaHasta}</span>
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-forest-700 block uppercase text-[10px]">
                      Lote / Chakra:
                    </span>
                    <p className="font-bold text-sm text-forest-950 mt-0.5">
                      {previewReport.lote}
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-forest-700 block uppercase text-[10px]">
                      Responsable de Campo:
                    </span>
                    <p className="font-semibold text-sm mt-0.5">
                      {previewReport.responsable}
                    </p>
                  </div>
                </div>

                {/* 2. Condiciones del Día */}
                <div className="bg-forest-50/60 p-4 rounded-xl border border-forest-100 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-vanilla-600" />
                    <span>Fecha de Registro: <strong>{previewReport.fechaReporte}</strong></span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Sun className="w-4 h-4 text-vanilla-600" />
                    <span>Clima: <strong>{previewReport.clima} {previewReport.climaOtro ? `(${previewReport.climaOtro})` : ""}</strong></span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Thermometer className="w-4 h-4 text-forest-700" />
                    <span>Temperatura: <strong>{previewReport.tempMin}°C - {previewReport.tempMax}°C</strong></span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Droplets className="w-4 h-4 text-blue-600" />
                    <span>Humedad: <strong>{previewReport.humedad}%</strong></span>
                  </div>
                </div>

                {/* 3. Actividades Realizadas */}
                <div>
                  <h3 className="font-bold uppercase tracking-wider text-forest-900 mb-2.5 flex items-center justify-between">
                    <span>Actividades Realizadas:</span>
                    <span className="text-[11px] text-forest-600 font-medium">
                      {previewReport.actividades.filter((a) => a.realizado).length} ejecutadas
                    </span>
                  </h3>
                  <div className="overflow-x-auto border border-vanilla-200 rounded-xl">
                    <table className="w-full text-left">
                      <thead className="bg-forest-900 text-white text-[11px]">
                        <tr>
                          <th className="py-2 px-3 w-10 text-center">N°</th>
                          <th className="py-2 px-3 w-48">Actividad</th>
                          <th className="py-2 px-3">Descripción / Observaciones Breves</th>
                          <th className="py-2 px-3 w-32">Área / Lote</th>
                          <th className="py-2 px-3 w-20 text-center">Realizado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-vanilla-100 bg-white">
                        {previewReport.actividades.map((act) => (
                          <tr
                            key={act.id}
                            className={act.realizado ? "bg-vanilla-50/70" : "hover:bg-vanilla-50/20"}
                          >
                            <td className="py-2 px-3 text-center font-mono text-forest-600 font-bold">
                              {act.id}
                            </td>
                            <td className="py-2 px-3 font-semibold text-forest-950">
                              {act.nombre}
                            </td>
                            <td className="py-2 px-3 text-forest-700">
                              {act.descripcion || "-"}
                            </td>
                            <td className="py-2 px-3 text-forest-600">
                              {act.areaLote || "-"}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {act.realizado ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-800 font-bold text-[10px]">
                                  SÍ [✓]
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-vanilla-100 text-forest-400 text-[10px]">
                                  NO
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. Herramientas Utilizadas */}
                <div className="bg-vanilla-50/60 p-4 rounded-xl border border-vanilla-200">
                  <h3 className="font-bold uppercase tracking-wider text-forest-900 mb-2.5">
                    Herramientas Utilizadas:
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {previewReport.herramientas.filter((h) => h.utilizada).length > 0 ? (
                      previewReport.herramientas
                        .filter((h) => h.utilizada)
                        .map((tool) => (
                          <span
                            key={tool.id}
                            className="px-2.5 py-1 rounded-lg bg-forest-900 text-white font-medium text-[11px]"
                          >
                            ✓ {tool.nombre}
                          </span>
                        ))
                    ) : (
                      <span className="text-forest-400 italic">No se registraron herramientas en esta jornada.</span>
                    )}
                  </div>
                </div>

                {/* 5. Insumos Aplicados */}
                {previewReport.insumos && previewReport.insumos.length > 0 && (
                  <div>
                    <h3 className="font-bold uppercase tracking-wider text-forest-900 mb-2">
                      Insumos Aplicados:
                    </h3>
                    <div className="overflow-x-auto border border-vanilla-200 rounded-xl">
                      <table className="w-full text-left">
                        <thead className="bg-forest-900 text-white text-[11px]">
                          <tr>
                            <th className="py-2 px-3">Insumo</th>
                            <th className="py-2 px-3">Dosis</th>
                            <th className="py-2 px-3">Método de Aplicación</th>
                            <th className="py-2 px-3">Área / Lote</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-vanilla-100 bg-white">
                          {previewReport.insumos.map((i, idx) => (
                            <tr key={idx} className="hover:bg-vanilla-50/50">
                              <td className="py-2 px-3 font-semibold">{i.insumo}</td>
                              <td className="py-2 px-3">{i.dosis}</td>
                              <td className="py-2 px-3">{i.metodo}</td>
                              <td className="py-2 px-3">{i.areaLote}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 6. Observaciones */}
                <div>
                  <h3 className="font-bold uppercase tracking-wider text-forest-900 mb-1.5">
                    Observaciones / Eventos Importantes:
                  </h3>
                  <div className="p-3 bg-vanilla-50 rounded-xl border border-vanilla-200 text-forest-800 leading-relaxed italic">
                    "{previewReport.observaciones || "Sin observaciones adicionales registradas para este día."}"
                  </div>
                </div>

                {/* 7. Registro Fotográfico de Campo */}
                {(previewReport.foto1Url || previewReport.foto2Url || previewReport.foto3Url) && (
                  <div>
                    <h3 className="font-bold uppercase tracking-wider text-forest-900 mb-2.5 flex items-center space-x-1.5">
                      <Camera className="w-4 h-4 text-vanilla-600" />
                      <span>Fotografías de Inspección de Campo:</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { label: "Foto 1", url: previewReport.foto1Url },
                        { label: "Foto 2", url: previewReport.foto2Url },
                        { label: "Foto 3", url: previewReport.foto3Url },
                      ].map((item, idx) =>
                        item.url ? (
                          <div
                            key={idx}
                            onClick={() =>
                              setSelectedPhoto({
                                url: item.url!,
                                title: `${item.label} | ${previewReport.lote} (${previewReport.fechaReporte})`,
                              })
                            }
                            className="group relative h-40 rounded-xl overflow-hidden border-2 border-vanilla-300 hover:border-forest-600 cursor-pointer shadow transition-all hover:scale-[1.02] bg-vanilla-100"
                          >
                            <img
                              src={item.url}
                              alt={item.label}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-forest-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Maximize2 className="w-5 h-5 text-white" />
                            </div>
                            <span className="absolute bottom-0 inset-x-0 bg-forest-950/80 text-white text-[10px] text-center py-1 font-semibold">
                              {item.label} (Click para ampliar)
                            </span>
                          </div>
                        ) : (
                          <div
                            key={idx}
                            className="h-40 rounded-xl border-2 border-dashed border-vanilla-200 bg-vanilla-50/50 flex flex-col items-center justify-center text-forest-400"
                          >
                            <Camera className="w-6 h-6 mb-1 text-forest-300" />
                            <span className="text-[11px] italic">Sin captura {item.label}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Barra de Acciones del Modal */}
              <div className="p-4 bg-vanilla-50 border-t border-vanilla-200 flex flex-wrap items-center justify-between gap-3 sticky bottom-0 z-10">
                <span className="text-xs text-forest-600">
                  Documento Oficial de Trazabilidad | Amazon Vanilla & ITEC Ecuador
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDownloadPdf(previewReport)}
                    disabled={generatingPdfId === previewReport.id}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-forest-900 hover:bg-forest-800 text-white text-xs font-semibold shadow transition-colors disabled:opacity-50"
                  >
                    {generatingPdfId === previewReport.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-vanilla-400" />
                        <span>Generando...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5 text-vanilla-400" />
                        <span>Descargar PDF con Fotos</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      const text = `🌿 *INFORME DIARIO CULTIVO DE VAINILLA*%0A` +
                        `*ID:* ${previewReport.id}%0A` +
                        `*Lote:* ${previewReport.lote}%0A` +
                        `*Fecha:* ${previewReport.fechaReporte}%0A` +
                        `*Responsable:* ${previewReport.responsable}%0A` +
                        `*Clima:* ${previewReport.clima} (${previewReport.tempMin}°C - ${previewReport.tempMax}°C)`;
                      window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
                    }}
                    className="p-2 rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] text-white transition-colors"
                    title="Compartir por WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setPreviewReport(null)}
                    className="px-4 py-2 rounded-lg border border-vanilla-300 hover:bg-white text-forest-800 text-xs font-medium transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Vista Previa Completa del Protocolo de Actividades */}
        {previewProtocol && (
          <div
            style={{ zIndex: 99990 }}
            onClick={() => setPreviewProtocol(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-vanilla-200 flex flex-col my-auto"
            >
              {/* Cabecera Oficial del Protocolo */}
              <div className="bg-forest-900 text-white p-5 sm:p-6 border-b-4 border-vanilla-500 sticky top-0 z-10 flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  <div className="relative w-12 h-12 bg-white/10 rounded-xl p-1 flex-shrink-0">
                    <Image
                      src="/assets/logo-amazon-vanilla-white.png"
                      alt="Logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-vanilla-500 text-forest-950">
                        {previewProtocol.id}
                      </span>
                      <h2 className="text-base sm:text-lg font-serif font-bold text-vanilla-200">
                        LISTADO INTEGRAL DE ACTIVIDADES - VISTA PREVIA
                      </h2>
                    </div>
                    <p className="text-[11px] text-forest-200 uppercase tracking-wider">
                      Cultivo de Vainilla en Invernadero | ITEC Ecuador - Innovación Sostenible
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setPreviewProtocol(null)}
                  className="p-1.5 rounded-full hover:bg-forest-800 text-forest-200 hover:text-white transition-colors"
                  title="Cerrar Vista Previa"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contenido Completo del Protocolo */}
              <div className="p-6 space-y-6 text-xs text-forest-900">
                {/* 1. Metadatos Rápidos */}
                <div className="bg-vanilla-50 p-4 rounded-xl border border-vanilla-200 grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="font-bold text-forest-700 block uppercase text-[10px]">Fecha de Registro:</span>
                    <p className="font-bold text-sm text-forest-950 mt-0.5">{previewProtocol.fecha}</p>
                  </div>
                  <div>
                    <span className="font-bold text-forest-700 block uppercase text-[10px]">Invernadero / Lote:</span>
                    <p className="font-bold text-sm text-forest-950 mt-0.5">{previewProtocol.lote}</p>
                  </div>
                  <div>
                    <span className="font-bold text-forest-700 block uppercase text-[10px]">Responsable Técnico:</span>
                    <p className="font-semibold text-sm mt-0.5">{previewProtocol.responsable}</p>
                  </div>
                  <div>
                    <span className="font-bold text-forest-700 block uppercase text-[10px]">Avance Cumplido:</span>
                    <p className="font-bold text-sm text-emerald-700 mt-0.5">
                      {previewProtocol.completadas} / {previewProtocol.totalActividades} ({previewProtocol.porcentaje}%)
                    </p>
                  </div>
                </div>

                {/* 2. Cuadrícula de las 9 Fases con Estados */}
                <div>
                  <h3 className="font-bold uppercase text-xs text-forest-800 mb-3 border-b border-vanilla-200 pb-1">
                    Verificación de Fases Agronómicas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {SECTIONS_DATA.map((section) => {
                      const secCompleted = section.items.filter(
                        (_, idx) => previewProtocol.checkedItems[`${section.id}-${idx}`]
                      ).length;

                      return (
                        <div
                          key={section.id}
                          className="rounded-lg border border-forest-900/20 bg-white overflow-hidden shadow-xs"
                        >
                          <div className="bg-forest-900 text-white px-2.5 py-1.5 flex items-center justify-between text-[11px]">
                            <span className="font-bold truncate">
                              {section.id}. {section.title}
                            </span>
                            <span className="font-mono text-[10px] text-vanilla-300 ml-1">
                              {secCompleted}/{section.items.length}
                            </span>
                          </div>
                          <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
                            {section.items.map((item, idx) => {
                              const isChecked = !!previewProtocol.checkedItems[`${section.id}-${idx}`];
                              return (
                                <div
                                  key={idx}
                                  className={`flex items-start space-x-1.5 text-[11px] p-1 rounded ${
                                    isChecked ? "bg-green-50 text-forest-950 font-medium" : "text-forest-600 opacity-60"
                                  }`}
                                >
                                  {isChecked ? (
                                    <CheckSquare className="w-3.5 h-3.5 text-green-700 flex-shrink-0 mt-0.5" />
                                  ) : (
                                    <Square className="w-3.5 h-3.5 text-forest-300 flex-shrink-0 mt-0.5" />
                                  )}
                                  <span className={isChecked ? "" : "line-through text-gray-400"}>{item}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Cuadro Adicional de Recomendaciones Técnicas */}
                  <div className="mt-3 rounded-lg border border-forest-900/20 bg-white overflow-hidden shadow-xs">
                    <div className="bg-forest-900 text-white px-3 py-1.5 flex items-center justify-between text-xs">
                      <span className="font-bold flex items-center space-x-1.5">
                        <span className="w-4 h-4 rounded-full bg-vanilla-500 text-forest-950 font-bold text-[10px] flex items-center justify-center">★</span>
                        <span>RECOMENDACIONES</span>
                      </span>
                      <span className="text-[10px] text-vanilla-300">Directrices Técnicas • Sin Checklist</span>
                    </div>
                    <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-2 bg-[#FAF7F2]">
                      {RECOMENDACIONES_DATA.map((rec, idx) => (
                        <div key={idx} className="flex items-start space-x-2 text-[11px] p-2 rounded bg-white border border-vanilla-200">
                          <div className="w-3.5 h-3.5 rounded-full border border-forest-800 bg-vanilla-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-forest-900" />
                          </div>
                          <span className="font-medium text-forest-950 leading-snug">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Observaciones */}
                <div className="bg-vanilla-50 p-4 rounded-xl border border-vanilla-200">
                  <span className="font-bold text-forest-700 block uppercase text-[10px] mb-1">
                    Observaciones y Novedades de Campo:
                  </span>
                  <p className="text-xs text-forest-900 italic">
                    {previewProtocol.observaciones || "Sin novedades adicionales reportadas durante esta verificación."}
                  </p>
                </div>

                {/* 4. Validación / Firma */}
                <div className="border-t border-forest-200 pt-3 flex items-center justify-between text-xs text-forest-700">
                  <div>
                    <span>Documento Oficial: <strong>ITEC-PROT-VAINILLA-01</strong></span>
                  </div>
                  <div className="text-right">
                    <span>Firma / Responsable: <strong>{previewProtocol.responsable}</strong></span>
                  </div>
                </div>
              </div>

              {/* Pie de Acciones del Modal */}
              <div className="p-4 bg-vanilla-50 border-t border-vanilla-200 flex items-center justify-between">
                <span className="text-xs text-forest-600">
                  Registro agronómico oficial ITEC Ecuador
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDownloadProtocolPdf(previewProtocol)}
                    disabled={generatingProtocolPdfId === previewProtocol.id}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-forest-900 hover:bg-forest-800 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {generatingProtocolPdfId === previewProtocol.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-vanilla-400" />
                        <span>Generando PDF...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5 text-vanilla-400" />
                        <span>Descargar PDF</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setPreviewProtocol(null)}
                    className="px-4 py-2 rounded-lg border border-vanilla-300 hover:bg-white text-forest-800 text-xs font-medium transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Modal Lightbox de Fotografía (Se renderiza delante de TODO con zIndex: 99999) */}
        {selectedPhoto && (
          <div
            style={{ zIndex: 99999 }}
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          >
            <div
              style={{ zIndex: 100000 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border border-vanilla-300"
            >
              <div className="p-4 bg-forest-900 text-white flex items-center justify-between">
                <span className="text-xs sm:text-sm font-semibold text-vanilla-200 truncate">
                  {selectedPhoto.title}
                </span>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="p-1.5 rounded-full hover:bg-forest-800 text-forest-200 hover:text-white transition-colors"
                  title="Cerrar imagen y volver a la vista previa"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 flex-1 flex items-center justify-center bg-forest-950/95 overflow-auto min-h-[300px]">
                <img
                  src={selectedPhoto.url}
                  alt="Fotografía de campo"
                  className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
                />
              </div>

              <div className="p-3 bg-vanilla-50 flex items-center justify-between border-t border-vanilla-200">
                <span className="text-xs text-forest-700">
                  Inspección fitosanitaria y seguimiento agronómico ITEC
                </span>
                <div className="flex items-center space-x-2">
                  <a
                    href={selectedPhoto.url}
                    download={`foto_vainilla_${Date.now()}.jpg`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-forest-900 hover:bg-forest-800 text-white text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-vanilla-400" />
                    <span>Descargar Foto</span>
                  </a>
                  <button
                    onClick={() => setSelectedPhoto(null)}
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
    </div>
  );
}
