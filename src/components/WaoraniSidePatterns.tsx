"use client";

import React from "react";

interface WaoraniSidePatternsProps {
  className?: string;
}

/**
 * Patrón Ancestral Waorani Vertical para Laterales
 * Diseñado para áreas verdes (Hero / Fondos forest-950/900).
 * Incluye desplazamiento vertical continuo, desvanecimiento dinámico (pulso y onda de cambio)
 * y una opacidad calibrada al 60%.
 */
export default function WaoraniSidePatterns({ className = "" }: WaoraniSidePatternsProps) {
  return (
    <>
      {/* Columna Lateral Izquierda */}
      <div
        className={`absolute left-1 sm:left-4 md:left-6 lg:left-8 xl:left-12 top-0 bottom-0 w-6 sm:w-8 md:w-10 lg:w-11 pointer-events-none select-none z-0 overflow-hidden flex flex-col justify-center items-center ${className}`}
        aria-hidden="true"
        title="Patrón Ancestral Waorani - Lateral Izquierdo"
      >
        <div className="relative w-full h-full waorani-strip">
          {/* Haz de luz de desvanecimiento dinámico en movimiento continuo (efecto de cambio) */}
          <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-transparent via-vanilla-300/40 to-transparent pointer-events-none waorani-wave-beam" />
        </div>
      </div>

      {/* Columna Lateral Derecha (Efecto Espejo) */}
      <div
        className={`absolute right-1 sm:right-4 md:right-6 lg:right-8 xl:right-12 top-0 bottom-0 w-6 sm:w-8 md:w-10 lg:w-11 pointer-events-none select-none z-0 overflow-hidden flex flex-col justify-center items-center scale-x-[-1] ${className}`}
        aria-hidden="true"
        title="Patrón Ancestral Waorani - Lateral Derecho"
      >
        <div className="relative w-full h-full waorani-strip-delayed">
          {/* Haz de luz de desvanecimiento dinámico en movimiento continuo (efecto de cambio) */}
          <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-transparent via-vanilla-300/40 to-transparent pointer-events-none waorani-wave-beam-delayed" />
        </div>
      </div>
    </>
  );
}
