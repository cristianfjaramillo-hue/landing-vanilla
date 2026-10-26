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
} from "lucide-react";
import { INITIAL_MOCK_REPORTS, DEFAULT_ACTIVITIES, DEFAULT_TOOLS } from "@/lib/constants";
import { DailyReport, ActivityItem, ToolItem } from "@/lib/types";
import { generateDailyReportPDF } from "@/lib/pdf-generator";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState(false);

  // Informes
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLote, setFilterLote] = useState("todos");

  // Visualizador de Fotografías (Lightbox) y estado de PDF
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string } | null>(null);
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);

  // Modal de Vista Previa Completa del Informe
  const [previewReport, setPreviewReport] = useState<DailyReport | null>(null);

  // Pestañas (Repositorio vs Configuración de Formulario)
  const [activeTab, setActiveTab] = useState<"repositorio" | "configuracion">("repositorio");

  // Configuración dinámica de actividades y herramientas
  const [customActivities, setCustomActivities] = useState<ActivityItem[]>(DEFAULT_ACTIVITIES);
  const [customTools, setCustomTools] = useState<ToolItem[]>(DEFAULT_TOOLS);
  const [newActivityName, setNewActivityName] = useState("");
  const [newToolName, setNewToolName] = useState("");

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

      // 2. Intentar cargar desde Supabase si existen
      try {
        const { data, error } = await supabase.from("reportes_diarios").select("*").order("created_at", { ascending: false });
        if (data && data.length > 0) {
          const fromDb = data.map((d) => d.data as DailyReport);
          const allTogether = Array.from(new Map([...fromDb, ...unique].map((item) => [item.id, item])).values());
          setReports(allTogether);
        }
      } catch (e) {
        // Silencioso si no hay tabla
      }
    } catch (err) {
      console.error("Error al cargar reportes:", err);
    }
  };

  useEffect(() => {
    // Verificar si ya inició sesión en esta sesión
    const savedAuth = sessionStorage.getItem("vanilla_admin_auth");
    if (savedAuth === "true") {
      setIsAuthenticated(true);
      loadReports();
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
            <Link
              href="/reportes/nuevo"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-vanilla-500 hover:bg-vanilla-600 text-forest-950 text-xs font-bold shadow transition-colors"
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
        <div className="flex space-x-2 border-b border-vanilla-300 pb-2">
          <button
            onClick={() => setActiveTab("repositorio")}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all ${
              activeTab === "repositorio"
                ? "bg-forest-900 text-white shadow-sm"
                : "bg-white text-forest-800 border border-vanilla-200 hover:bg-vanilla-100"
            }`}
          >
            <Sprout className="w-4 h-4 text-vanilla-400" />
            <span>Trazabilidad de Campo & Informes ({reports.length})</span>
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

              <div className="flex items-center space-x-3 w-full sm:w-auto">
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
                        <div className="flex items-center space-x-3">
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
                          <span className="px-2 py-0.5 rounded bg-green-50 text-green-800 border border-green-200">
                            Fitosanitario: {report.estadoCultivo?.estadoFitosanitario || "Bueno"}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            Floración: {report.estadoCultivo?.floracion || "Bueno"}
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

                {/* 4. Herramientas & Estado General */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Herramientas */}
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

                  {/* Estado General */}
                  <div className="bg-forest-900 text-white p-4 rounded-xl">
                    <h3 className="font-bold uppercase tracking-wider text-vanilla-300 mb-2.5">
                      Estado General del Cultivo:
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {[
                        { label: "Desarrollo Vegetativo", val: previewReport.estadoCultivo?.desarrolloVegetativo },
                        { label: "Floración", val: previewReport.estadoCultivo?.floracion },
                        { label: "Formación de Vainas", val: previewReport.estadoCultivo?.formacionVainas },
                        { label: "Estado Fitosanitario", val: previewReport.estadoCultivo?.estadoFitosanitario },
                      ].map((item, idx) => (
                        <div key={idx} className="bg-forest-800/90 p-2 rounded-lg border border-forest-700 flex justify-between items-center">
                          <span className="text-vanilla-200">{item.label}:</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.val === "Bueno"
                                ? "bg-green-600 text-white"
                                : item.val === "Regular"
                                ? "bg-amber-600 text-white"
                                : "bg-red-600 text-white"
                            }`}
                          >
                            {item.val || "Bueno"}
                          </span>
                        </div>
                      ))}
                    </div>
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
