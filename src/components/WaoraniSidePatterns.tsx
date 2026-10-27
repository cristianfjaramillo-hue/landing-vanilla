"use client";

import React from "react";

interface WaoraniSidePatternsProps {
  className?: string;
}

/**
 * Patrón Ancestral Waorani Vertical para Laterales
 * Diseñado para áreas verdes (Hero / Fondos forest-950/900).
 * Configurado con 80% de transparencia (opacidad sutil 0.20),
 * desplazamiento vertical ultra lento y elegante, sin destellos ni luces invasivas.
 */
export default function WaoraniSidePatterns({ className = "" }: WaoraniSidePatternsProps) {
  return (
    <>
      {/* Columna Lateral Izquierda (50px más hacia adentro del filo) */}
      <div
        className={`absolute left-3 sm:left-[65px] md:left-[75px] lg:left-[85px] xl:left-[100px] top-0 bottom-0 w-6 sm:w-8 md:w-10 lg:w-11 pointer-events-none select-none z-0 overflow-hidden flex flex-col justify-center items-center ${className}`}
        aria-hidden="true"
        title="Patrón Ancestral Waorani - Lateral Izquierdo"
      >
        <div className="relative w-full h-full waorani-strip" />
      </div>

      {/* Columna Lateral Derecha (Efecto Espejo, 50px más hacia adentro del filo) */}
      <div
        className={`absolute right-3 sm:right-[65px] md:right-[75px] lg:right-[85px] xl:right-[100px] top-0 bottom-0 w-6 sm:w-8 md:w-10 lg:w-11 pointer-events-none select-none z-0 overflow-hidden flex flex-col justify-center items-center scale-x-[-1] ${className}`}
        aria-hidden="true"
        title="Patrón Ancestral Waorani - Lateral Derecho"
      >
        <div className="relative w-full h-full waorani-strip-delayed" />
      </div>
    </>
  );
}
