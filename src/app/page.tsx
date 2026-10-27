import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FileText,
  Sparkles,
  ShieldCheck,
  ClipboardList,
  ExternalLink,
} from "lucide-react";
import WaoraniSidePatterns from "@/components/WaoraniSidePatterns";

export default function HomePage() {
  return (
    <div className="pb-8">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-forest-950 text-white pt-20 pb-20 sm:pt-24 sm:pb-24 border-b-4 border-vanilla-500">
        {/* Patrones Ancestrales Waorani en los Laterales Verdes (Verticales con Desvanecimiento y Movimiento al 60% de Opacidad) */}
        <WaoraniSidePatterns />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 z-10">
          {/* Logo Principal (40% más grande, sin cuadro ni sombra de fondo, con brillo que recorre las letras) */}
          <div className="relative w-[340px] sm:w-[540px] md:w-[670px] lg:w-[720px] h-40 sm:h-52 md:h-64 lg:h-72 mx-auto flex items-center justify-center my-2">
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src="/assets/logo-amazon-vanilla-hero.png"
                alt="Amazon Vanilla By Waorani People"
                fill
                className="object-contain"
                priority
              />

              {/* Haz de luz blanca que recorre EXCLUSIVAMENTE las líneas y letras de la marca */}
              <div
                className="absolute inset-0 pointer-events-none overflow-hidden"
                style={{
                  maskImage: "url('/assets/logo-amazon-vanilla-hero.png')",
                  WebkitMaskImage: "url('/assets/logo-amazon-vanilla-hero.png')",
                  maskSize: "contain",
                  WebkitMaskSize: "contain",
                  maskRepeat: "no-repeat",
                  WebkitMaskRepeat: "no-repeat",
                  maskPosition: "center",
                  WebkitMaskPosition: "center",
                }}
              >
                <div className="w-full h-full animate-line-shimmer bg-gradient-to-r from-transparent via-white/95 to-transparent" />
              </div>
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-forest-900/80 border border-vanilla-400/40 text-vanilla-300 text-xs sm:text-sm font-semibold tracking-wide">
            <Sparkles className="w-4 h-4 text-vanilla-400" />
            <span>Bioeconomía Regenerativa en Territorio Ancestral Waorani</span>
          </div>

          {/* Titular */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-extrabold tracking-tight max-w-4xl mx-auto leading-tight text-white">
            La Vainilla más pura del planeta, nacida en el corazón de la{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-vanilla-300 via-vanilla-400 to-vanilla-500">
              Amazonía Waorani
            </span>
          </h1>

          {/* Subtítulo */}
          <p className="text-base sm:text-xl text-forest-200/90 max-w-2xl mx-auto font-light leading-relaxed">
            Orquídeas de vainilla silvestre cultivadas bajo dosel de bosque por familias Waorani. Rigor científico, polinización manual y trazabilidad agronómica diaria respaldada por <strong>ITEC Ecuador</strong>.
          </p>

          {/* CTAs (Todos con el mismo color beige, cambiando a verde al pasar el mouse) */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 flex-wrap">
            <Link
              href="/reportes/nuevo"
              className="w-full sm:w-auto px-7 py-4 rounded-xl bg-[#F2E9D7] hover:bg-forest-900 text-forest-950 hover:text-white font-bold text-sm tracking-wider uppercase border border-vanilla-300 hover:border-forest-700 shadow-md transition-all hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 group"
            >
              <FileText className="w-4 h-4 text-forest-800 group-hover:text-vanilla-400 transition-colors" />
              <span>Generar Informe Diario</span>
            </Link>

            <Link
              href="/actividades"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-7 py-4 rounded-xl bg-[#F2E9D7] hover:bg-forest-900 text-forest-950 hover:text-white font-bold text-sm tracking-wider uppercase border border-vanilla-300 hover:border-forest-700 shadow-md transition-all hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 group"
            >
              <ClipboardList className="w-4 h-4 text-forest-800 group-hover:text-vanilla-400 transition-colors" />
              <span>Listado de Actividades</span>
              <ExternalLink className="w-3.5 h-3.5 text-forest-600 group-hover:text-vanilla-400 ml-0.5 transition-colors" />
            </Link>

            <Link
              href="/admin"
              className="w-full sm:w-auto px-7 py-4 rounded-xl bg-[#F2E9D7] hover:bg-forest-900 text-forest-950 hover:text-white font-bold text-sm tracking-wider uppercase border border-vanilla-300 hover:border-forest-700 shadow-md transition-all hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 group"
            >
              <ShieldCheck className="w-4 h-4 text-forest-800 group-hover:text-vanilla-400 transition-colors" />
              <span>Acceso Administrador</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
