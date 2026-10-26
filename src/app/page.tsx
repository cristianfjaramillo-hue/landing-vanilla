import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FileText,
  TreePine,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-forest-950 text-white pt-24 pb-28 sm:pb-36 border-b-4 border-vanilla-500">
        {/* Glow de fondo decorativo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full opacity-20 pointer-events-none">
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-vanilla-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-forest-600 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Logo principal */}
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 mx-auto drop-shadow-2xl">
            <Image
              src="/assets/logo-amazon-vanilla-cream.png"
              alt="Amazon Vanilla By Waorani People"
              fill
              className="object-contain"
              priority
            />
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

          {/* CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/reportes/nuevo"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-vanilla-500 hover:bg-vanilla-600 text-forest-950 font-bold text-sm tracking-wider uppercase shadow-lg shadow-vanilla-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>+ Llenar Informe Diario</span>
            </Link>
            <a
              href="#origen"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-forest-900/90 hover:bg-forest-800 text-white font-semibold text-sm border border-forest-700 transition-all flex items-center justify-center space-x-2"
            >
              <span>Conocer Territorio Waorani</span>
            </a>
          </div>
        </div>
      </section>

      {/* 2. BARRA DE MÉTRICAS & IMPACTO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-24 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white rounded-2xl shadow-xl border border-vanilla-200 p-6 sm:p-8">
          <div className="text-center p-3">
            <div className="text-2xl sm:text-3xl font-serif font-bold text-forest-900">
              100%
            </div>
            <div className="text-xs text-forest-600 font-medium mt-1">
              Selva Amazónica Viva
            </div>
            <p className="text-[10px] text-forest-400 mt-0.5">Cero deforestación</p>
          </div>

          <div className="text-center p-3 border-l border-vanilla-200">
            <div className="text-2xl sm:text-3xl font-serif font-bold text-vanilla-600">
              Grado A
            </div>
            <div className="text-xs text-forest-600 font-medium mt-1">
              Calidad Gourmet
            </div>
            <p className="text-[10px] text-forest-400 mt-0.5">Vainas carnosas y flexibles</p>
          </div>

          <div className="text-center p-3 border-l border-vanilla-200">
            <div className="text-2xl sm:text-3xl font-serif font-bold text-forest-900">
              Comercio Justo
            </div>
            <div className="text-xs text-forest-600 font-medium mt-1">
              Pueblo Waorani
            </div>
            <p className="text-[10px] text-forest-400 mt-0.5">Ingreso digno y soberanía</p>
          </div>

          <div className="text-center p-3 border-l border-vanilla-200">
            <div className="text-2xl sm:text-3xl font-serif font-bold text-vanilla-600">
              Sello ITEC
            </div>
            <div className="text-xs text-forest-600 font-medium mt-1">
              Innovación Sostenible
            </div>
            <p className="text-[10px] text-forest-400 mt-0.5">Rigor técnico y científico</p>
          </div>
        </div>
      </section>

      {/* 3. SECCIÓN: ORIGEN Y COMUNIDAD WAORANI */}
      <section id="origen" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-vanilla-700 bg-vanilla-100 px-3 py-1 rounded-md">
              <TreePine className="w-4 h-4 text-forest-800" />
              <span>Territorio Ancestral & Conservación</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-forest-950 leading-snug">
              Guardianes del Yasuní: Cultivando Vida donde el Bosque es Sagrado
            </h2>

            <p className="text-sm sm:text-base text-forest-800/90 leading-relaxed">
              En las profundidades de la Amazonía ecuatoriana, las familias de la nacionalidad Waorani cultivan orquídeas de vainilla en armonía con los árboles tutores de la chakra tradicional.
            </p>

            <p className="text-sm sm:text-base text-forest-800/90 leading-relaxed">
              Este proyecto es una respuesta contundente y sostenible a las actividades extractivas: un modelo de bioeconomía donde la protección del territorio genera prosperidad directa para las comunidades que lo defienden.
            </p>

            <div className="space-y-3 pt-2">
              {[
                "Recolección y polinización liderada por mujeres guardianas Waorani.",
                "Especies nativas como Vanilla odorata adaptadas naturalmente al microclima amazónico.",
                "Sistemas agroforestales que protegen la biodiversidad y cuencas hídricas.",
              ].map((item, idx) => (
                <div key={idx} className="flex items-start space-x-3 text-sm text-forest-900">
                  <CheckCircle2 className="w-5 h-5 text-forest-700 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative bg-gradient-to-br from-forest-900 to-forest-950 p-8 sm:p-12 rounded-3xl text-white shadow-2xl border border-forest-800 space-y-6">
            <div className="relative w-20 h-20 bg-white/10 rounded-2xl p-2">
              <Image
                src="/assets/logo-amazon-vanilla-white.png"
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>
            <blockquote className="font-serif italic text-lg sm:text-xl text-vanilla-200 leading-relaxed">
              "Nuestra selva no se tala ni se vende; florece en cada orquídea de vainilla que cuidamos con nuestras manos para el futuro de nuestros hijos."
            </blockquote>
            <div className="text-xs font-semibold tracking-wider uppercase text-forest-300">
              — Alianza Comunitaria Waorani & ITEC Ecuador
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
