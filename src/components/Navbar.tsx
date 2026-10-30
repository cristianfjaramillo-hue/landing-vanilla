"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, FileSpreadsheet, ShieldCheck, ClipboardList, ExternalLink, ArrowLeft } from "lucide-react";
import { RECOMENDACIONES_DATA } from "@/lib/actividades-data";

export default function Navbar() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const [recsCount, setRecsCount] = useState<number>(RECOMENDACIONES_DATA.length);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("vanilla_recomendaciones_data");
      const isUserConfigured = localStorage.getItem("vanilla_recs_user_configured") === "true";
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && (parsed.length > 0 || isUserConfigured)) {
          setRecsCount(parsed.length);
        }
      }
    } catch {}

    try {
      fetch("/api/recomendaciones")
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success && Array.isArray(data.recomendaciones)) {
            const localUpdated = localStorage.getItem("vanilla_recs_last_updated");
            const isDbNewer = !localUpdated || !data.updated_at || new Date(data.updated_at) >= new Date(localUpdated);
            if (isDbNewer) {
              setRecsCount(typeof data.count === "number" ? data.count : data.recomendaciones.length);
            }
          }
        })
        .catch(() => {});
    } catch {}

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("vanilla_recomendaciones_channel");
      channel.onmessage = (event) => {
        if (event.data?.type === "RECOMENDACIONES_UPDATED") {
          const newCount = typeof event.data.count === "number" ? event.data.count : event.data.list?.length;
          if (typeof newCount === "number") {
            setRecsCount(newCount);
          }
        }
      };
    } catch {}

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "vanilla_recomendaciones_data" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setRecsCount(parsed.length);
        } catch {}
      }
    };
    const handleCustomUpdate = (e: any) => {
      if (typeof e.detail?.count === "number") setRecsCount(e.detail.count);
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("vanilla_recomendaciones_updated", handleCustomUpdate);
    return () => {
      if (channel) {
        try {
          channel.close();
        } catch {}
      }
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("vanilla_recomendaciones_updated", handleCustomUpdate);
    };
  }, []);

  const isReportesActive = pathname === "/reportes/nuevo";
  const isGeneralActive = pathname === "/reportes/general";
  const isActividadesActive = pathname === "/actividades" || pathname?.startsWith("/actividades");
  const isAdminActive = pathname === "/admin" || pathname?.startsWith("/admin");

  return (
    <header className="sticky top-0 z-50 bg-[#FBF8F1]/95 backdrop-blur-md border-b border-vanilla-200">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-16 py-2 sm:py-0 sm:h-20">
          {isAdmin ? (
            <div className="w-full flex items-center justify-end">
              <Link
                href="/"
                className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg bg-[#F2E9D7] hover:bg-forest-900 text-forest-950 hover:text-white border border-vanilla-300 hover:border-forest-700 text-xs font-semibold transition-all shadow-sm whitespace-nowrap group"
                title="Volver a la página principal"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-forest-700 group-hover:text-vanilla-400 transition-colors" />
                <span>Volver al Inicio</span>
              </Link>
            </div>
          ) : (
            /* Los 4 botones distribuidos armónicamente en todo el espacio del menú */
            <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2.5 md:gap-4 items-center">
              {/* Botón 1: Generar Informe Diario */}
              <Link
                href="/reportes/nuevo"
                className={`w-full inline-flex items-center justify-center space-x-1 sm:space-x-1.5 px-1 sm:px-2.5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs md:text-sm font-semibold tracking-tighter sm:tracking-normal transition-all shadow-sm text-center whitespace-nowrap group border ${
                  isReportesActive
                    ? "bg-forest-900 text-white border-forest-900 shadow-md ring-1 ring-forest-800"
                    : "bg-[#F2E9D7] hover:bg-forest-900 text-forest-950 hover:text-white border-vanilla-300 hover:border-forest-900"
                }`}
              >
                <FileText
                  className={`w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 transition-colors ${
                    isReportesActive ? "text-vanilla-400" : "text-forest-800 group-hover:text-vanilla-400"
                  }`}
                />
                <span className="hidden sm:inline whitespace-nowrap">Informe Diario</span>
                <span className="sm:hidden whitespace-nowrap">Inf. Diario</span>
              </Link>

              {/* Botón 2: Informe General */}
              <Link
                href="/reportes/general"
                className={`w-full inline-flex items-center justify-center space-x-1 sm:space-x-1.5 px-1 sm:px-2.5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs md:text-sm font-semibold tracking-tighter sm:tracking-normal transition-all shadow-sm text-center whitespace-nowrap group border ${
                  isGeneralActive
                    ? "bg-forest-900 text-white border-forest-900 shadow-md ring-1 ring-forest-800"
                    : "bg-[#F2E9D7] hover:bg-forest-900 text-forest-950 hover:text-white border-vanilla-300 hover:border-forest-900"
                }`}
              >
                <FileSpreadsheet
                  className={`w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 transition-colors ${
                    isGeneralActive ? "text-vanilla-400" : "text-forest-800 group-hover:text-vanilla-400"
                  }`}
                />
                <span className="hidden sm:inline whitespace-nowrap">Informe General</span>
                <span className="sm:hidden whitespace-nowrap">Inf. General</span>
              </Link>

              {/* Botón 3: Listado de Actividades */}
              <Link
                href="/actividades"
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full inline-flex items-center justify-center space-x-1 sm:space-x-1.5 px-1 sm:px-2.5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs md:text-sm font-semibold transition-all shadow-sm text-center whitespace-nowrap group border ${
                  isActividadesActive
                    ? "bg-forest-900 text-white border-forest-900 shadow-md ring-1 ring-forest-800"
                    : "bg-[#F2E9D7] hover:bg-forest-900 text-forest-950 hover:text-white border-vanilla-300 hover:border-forest-900"
                }`}
                title="Abrir Listado Integral de Actividades en nueva ventana"
              >
                <ClipboardList
                  className={`w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 transition-colors ${
                    isActividadesActive ? "text-vanilla-400" : "text-forest-800 group-hover:text-vanilla-400"
                  }`}
                />
                <span className="hidden md:inline whitespace-nowrap">Actividades ({recsCount})</span>
                <span className="md:hidden whitespace-nowrap">Actividades</span>
                <ExternalLink
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ml-0.5 flex-shrink-0 transition-colors ${
                    isActividadesActive ? "text-vanilla-400" : "text-forest-600 group-hover:text-vanilla-400"
                  }`}
                />
              </Link>

              {/* Botón 4: Admin */}
              <Link
                href="/admin"
                className={`w-full inline-flex items-center justify-center space-x-1 sm:space-x-1.5 px-1 sm:px-2.5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs md:text-sm font-semibold transition-all shadow-sm text-center whitespace-nowrap group border ${
                  isAdminActive
                    ? "bg-forest-900 text-white border-forest-900 shadow-md ring-1 ring-forest-800"
                    : "bg-[#F2E9D7] hover:bg-forest-900 text-forest-950 hover:text-white border-vanilla-300 hover:border-forest-900"
                }`}
              >
                <ShieldCheck
                  className={`w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 transition-colors ${
                    isAdminActive ? "text-vanilla-400" : "text-forest-700 group-hover:text-vanilla-400"
                  }`}
                />
                <span className="hidden md:inline whitespace-nowrap">Administrador</span>
                <span className="md:hidden whitespace-nowrap">Admin</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
