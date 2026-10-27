"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FileText, ShieldCheck, ClipboardList, ExternalLink, ArrowLeft } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  return (
    <header className="sticky top-0 z-50 bg-[#FBF8F1]/95 backdrop-blur-md border-b border-vanilla-200">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {isAdmin ? (
            <div className="w-full flex items-center justify-end">
              <Link
                href="/"
                className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg border border-vanilla-300 hover:border-forest-600 text-forest-900 text-xs font-semibold transition-all hover:bg-white shadow-sm whitespace-nowrap"
                title="Volver a la página principal"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-forest-700" />
                <span>Volver al Inicio</span>
              </Link>
            </div>
          ) : (
            /* Los 3 botones distribuidos de manera exacta (1/3 exacto cada uno) en todo el espacio del menú, con el logo oculto */
            <div className="w-full grid grid-cols-3 gap-1.5 sm:gap-4 md:gap-6 items-center">
              {/* Botón 1: Generar Informe Diario */}
              <Link
                href="/reportes/nuevo"
                className="w-full inline-flex items-center justify-center space-x-1 sm:space-x-2 px-1 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-forest-900 hover:bg-forest-800 text-white text-[10px] sm:text-xs md:text-sm font-semibold tracking-tighter sm:tracking-wide transition-all shadow-sm hover:shadow text-center whitespace-nowrap"
              >
                <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-vanilla-400 flex-shrink-0" />
                <span className="whitespace-nowrap">Generar Informe Diario</span>
              </Link>

              {/* Botón 2: Listado de Actividades */}
              <Link
                href="/actividades"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center space-x-1 sm:space-x-2 px-1 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-vanilla-500/20 hover:bg-vanilla-500/30 text-forest-900 border border-vanilla-400 text-[10px] sm:text-xs md:text-sm font-semibold transition-all shadow-sm text-center whitespace-nowrap"
                title="Abrir Listado Integral de Actividades en nueva ventana"
              >
                <ClipboardList className="w-3 h-3 sm:w-4 sm:h-4 text-forest-800 flex-shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">Listado de Actividades</span>
                <span className="sm:hidden whitespace-nowrap">Actividades</span>
                <ExternalLink className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-forest-600 ml-0.5 flex-shrink-0" />
              </Link>

              {/* Botón 3: Admin */}
              <Link
                href="/admin"
                className="w-full inline-flex items-center justify-center space-x-1 sm:space-x-2 px-1 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-vanilla-300 hover:border-vanilla-500 text-forest-900 text-[10px] sm:text-xs md:text-sm font-semibold transition-all hover:bg-white shadow-sm text-center whitespace-nowrap"
              >
                <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4 text-forest-700 flex-shrink-0" />
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
