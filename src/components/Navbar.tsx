"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, ShieldCheck, ClipboardList, ExternalLink, ArrowLeft } from "lucide-react";
import { RECOMENDACIONES_DATA } from "@/lib/actividades-data";

export default function Navbar() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const [recsCount, setRecsCount] = useState<number>(RECOMENDACIONES_DATA.length);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("vanilla_recomendaciones_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecsCount(parsed.length);
        }
      }
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
      if (e.detail?.count) setRecsCount(e.detail.count);
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("vanilla_recomendaciones_updated", handleCustomUpdate);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("vanilla_recomendaciones_updated", handleCustomUpdate);
    };
  }, []);

  const isReportesActive = pathname === "/reportes/nuevo" || pathname?.startsWith("/reportes");
  const isActividadesActive = pathname === "/actividades" || pathname?.startsWith("/actividades");
  const isAdminActive = pathname === "/admin" || pathname?.startsWith("/admin");

  return (
    <header className="sticky top-0 z-50 bg-[#FBF8F1]/95 backdrop-blur-md border-b border-vanilla-200">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
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
            /* Los 3 botones distribuidos de manera exacta (1/3 exacto cada uno) en todo el espacio del menú, con el logo oculto */
            <div className="w-full grid grid-cols-3 gap-1.5 sm:gap-4 md:gap-6 items-center">
              {/* Botón 1: Generar Informe Diario */}
              <Link
                href="/reportes/nuevo"
                className={`w-full inline-flex items-center justify-center space-x-1 sm:space-x-2 px-1 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs md:text-sm font-semibold tracking-tighter sm:tracking-wide transition-all shadow-sm text-center whitespace-nowrap group border ${
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
                <span className="whitespace-nowrap">Generar Informe Diario</span>
              </Link>

              {/* Botón 2: Listado de Actividades */}
              <Link
                href="/actividades"
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full inline-flex items-center justify-center space-x-1 sm:space-x-2 px-1 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs md:text-sm font-semibold transition-all shadow-sm text-center whitespace-nowrap group border ${
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
                <span className="hidden sm:inline whitespace-nowrap">Listado de Actividades ({recsCount})</span>
                <span className="sm:hidden whitespace-nowrap">Actividades ({recsCount})</span>
                <ExternalLink
                  className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 ml-0.5 flex-shrink-0 transition-colors ${
                    isActividadesActive ? "text-vanilla-400" : "text-forest-600 group-hover:text-vanilla-400"
                  }`}
                />
              </Link>

              {/* Botón 3: Admin */}
              <Link
                href="/admin"
                className={`w-full inline-flex items-center justify-center space-x-1 sm:space-x-2 px-1 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs md:text-sm font-semibold transition-all shadow-sm text-center whitespace-nowrap group border ${
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
                <span className="hidden sm:inline whitespace-nowrap">Panel Administrador</span>
                <span className="sm:hidden whitespace-nowrap">Admin</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
