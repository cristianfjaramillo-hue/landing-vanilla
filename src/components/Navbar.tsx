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
          {/* Logo & Brand (Oculto en móvil para dar espacio completo a los 3 botones) */}
          <Link
            href="/"
            className="hidden sm:flex items-center group flex-shrink-0"
            title="Amazon Vanilla By Waorani People"
          >
            <div className="relative w-40 sm:w-52 md:w-60 h-11 sm:h-13 md:h-14 flex-shrink-0">
              <Image
                src="/assets/logo-navbar.png"
                alt="Amazon Vanilla - By Waorani People"
                fill
                className="object-contain object-left group-hover:opacity-85 transition-opacity"
                priority
              />
            </div>
          </Link>

          {/* Action Buttons (Distribuidos en todo el ancho en versión celular con texto en una sola línea) */}
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-1.5 sm:gap-3">
            {!isAdmin && (
              <>
                <Link
                  href="/reportes/nuevo"
                  className="inline-flex items-center justify-center space-x-1.5 px-2.5 sm:px-4 py-2 rounded-lg bg-forest-900 hover:bg-forest-800 text-white text-[11px] sm:text-xs font-semibold tracking-tight sm:tracking-wide transition-all shadow-sm hover:shadow whitespace-nowrap flex-1 sm:flex-initial text-center"
                >
                  <FileText className="w-3.5 h-3.5 text-vanilla-400 flex-shrink-0" />
                  <span className="whitespace-nowrap">Generar Informe Diario</span>
                </Link>

                <Link
                  href="/actividades"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center space-x-1 px-2 sm:px-3 py-2 rounded-lg bg-vanilla-500/20 hover:bg-vanilla-500/30 text-forest-900 border border-vanilla-400 text-[11px] sm:text-xs font-semibold transition-all shadow-sm whitespace-nowrap flex-shrink-0"
                  title="Abrir Listado Integral de Actividades en nueva ventana"
                >
                  <ClipboardList className="w-3.5 h-3.5 text-forest-800 flex-shrink-0" />
                  <span className="hidden sm:inline whitespace-nowrap">Listado de Actividades</span>
                  <span className="sm:hidden whitespace-nowrap">Actividades</span>
                  <ExternalLink className="w-3 h-3 text-forest-600 ml-0.5 flex-shrink-0" />
                </Link>
              </>
            )}

            {isAdmin ? (
              <Link
                href="/"
                className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg border border-vanilla-300 hover:border-forest-600 text-forest-900 text-xs font-semibold transition-all hover:bg-white shadow-sm whitespace-nowrap w-full sm:w-auto"
                title="Volver a la página principal"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-forest-700" />
                <span>Volver al Inicio</span>
              </Link>
            ) : (
              <Link
                href="/admin"
                className="inline-flex items-center justify-center space-x-1 px-2.5 sm:px-3 py-2 rounded-lg border border-vanilla-300 hover:border-vanilla-500 text-forest-900 text-[11px] sm:text-xs font-semibold transition-all hover:bg-white whitespace-nowrap flex-shrink-0"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-forest-700 flex-shrink-0" />
                <span className="whitespace-nowrap">Admin</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
