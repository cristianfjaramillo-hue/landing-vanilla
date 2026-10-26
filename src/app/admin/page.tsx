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
  MessageCircle,
  Lock,
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
                  Panel de Control Administrativo
                </h1>
              </div>
              <p className="text-xs text-forest-200 mt-0.5">
                Repositorio Oficial de Informes Diarios | ITEC Ecuador & Territorio Waorani
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/reportes/nuevo"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-vanilla-500 hover:bg-vanilla-600 text-forest-950 text-xs font-bold shadow transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nuevo Informe</span>
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
            <Database className="w-4 h-4 text-vanilla-400" />
            <span>Repositorio de Informes ({reports.length})</span>
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

        {/* PESTAÑA 1: REPOSITORIO DE INFORMES */}
        {activeTab === "repositorio" && (
          <div className="space-y-6">
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
                      </div>

                      {/* Botones de Acción (Descarga PDF, WhatsApp, Eliminar) */}
                      <div className="flex items-center space-x-2 pt-3 md:pt-0 border-t md:border-t-0 border-vanilla-100">
                        <button
                          onClick={() => generateDailyReportPDF(report)}
                          className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-forest-900 hover:bg-forest-800 text-white text-xs font-semibold transition-colors"
                          title="Descargar PDF Oficial"
                        >
                          <Download className="w-3.5 h-3.5 text-vanilla-400" />
                          <span>PDF</span>
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
      </div>
    </div>
  );
}
