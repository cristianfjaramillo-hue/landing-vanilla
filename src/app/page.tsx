"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sprout,
  ShieldCheck,
  FileText,
  Download,
  Calendar,
  Thermometer,
  Droplets,
  Sun,
  Award,
  Globe2,
  TreePine,
  CheckCircle2,
  Send,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { INITIAL_MOCK_REPORTS } from "@/lib/constants";
import { DailyReport } from "@/lib/types";
import { generateDailyReportPDF } from "@/lib/pdf-generator";

export default function HomePage() {
  const [reports, setReports] = useState<DailyReport[]>(INITIAL_MOCK_REPORTS);
  const [contactSubmitted, setContactSubmitted] = useState(false);

  useEffect(() => {
    // Cargar reportes guardados localmente para actualizar la ventana en vivo
    try {
      const local = JSON.parse(localStorage.getItem("vanilla_daily_reports") || "[]");
      if (local.length > 0) {
        const combined = [...local, ...INITIAL_MOCK_REPORTS];
        const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
        unique.sort(
          (a, b) => new Date(b.created_at || b.fechaReporte).getTime() - new Date(a.created_at || a.fechaReporte).getTime()
        );
        setReports(unique);
      }
    } catch (e) {}
  }, []);

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
            <a
              href="#b2b"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-vanilla-500 hover:bg-vanilla-600 text-forest-950 font-bold text-sm tracking-wider uppercase shadow-lg shadow-vanilla-500/20 transition-all hover:scale-105 active:scale-95"
            >
              Solicitar Muestra B2B
            </a>
            <a
              href="#trazabilidad"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-forest-900/90 hover:bg-forest-800 text-white font-semibold text-sm border border-forest-700 transition-all flex items-center justify-center space-x-2"
            >
              <Sprout className="w-4 h-4 text-vanilla-400" />
              <span>Ver Trazabilidad en Vivo</span>
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
              Punto a Punto
            </div>
            <div className="text-xs text-forest-600 font-medium mt-1">
              Trazabilidad ITEC
            </div>
            <p className="text-[10px] text-forest-400 mt-0.5">Informes diarios de campo</p>
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

      {/* 4. SECCIÓN: INNOVACIÓN Y CALIDAD ITEC ECUADOR */}
      <section id="calidad" className="bg-forest-900 text-white py-20 border-y border-forest-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-vanilla-400">
              ITEC Ecuador | Innovación para un campo sostenible
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white">
              El Rigor Técnico que Garantiza un Estándar de Exportación
            </h2>
            <p className="text-sm sm:text-base text-forest-200 font-light">
              Uniendo la sabiduría milenaria indígena con protocolos agronómicos modernos de seguimiento diario, sanidad vegetal orgánica y curado artesanal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-forest-950/80 p-8 rounded-2xl border border-forest-800 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-forest-800 flex items-center justify-center text-vanilla-400 font-bold text-lg">
                01
              </div>
              <h3 className="text-lg font-serif font-bold text-vanilla-300">
                Polinización de Precisión
              </h3>
              <p className="text-xs sm:text-sm text-forest-200/80 leading-relaxed">
                Cada flor de orquídea abre solo una mañana. El equipo técnico capacita y acompaña en la polinización manual flor por flor en las primeras horas del alba para máxima fecundación.
              </p>
            </div>

            <div className="bg-forest-950/80 p-8 rounded-2xl border border-forest-800 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-forest-800 flex items-center justify-center text-vanilla-400 font-bold text-lg">
                02
              </div>
              <h3 className="text-lg font-serif font-bold text-vanilla-300">
                Nutrición y Sanidad Biológica
              </h3>
              <p className="text-xs sm:text-sm text-forest-200/80 leading-relaxed">
                Uso exclusivo de bioles fermentados, microorganismos eficientes de montaña y biochar para fortalecer los tutores vivos y prevenir patógenos de forma 100% orgánica.
              </p>
            </div>

            <div className="bg-forest-950/80 p-8 rounded-2xl border border-forest-800 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-forest-800 flex items-center justify-center text-vanilla-400 font-bold text-lg">
                03
              </div>
              <h3 className="text-lg font-serif font-bold text-vanilla-300">
                Curado y Concentración Aromática
              </h3>
              <p className="text-xs sm:text-sm text-forest-200/80 leading-relaxed">
                Proceso escalonado de sudado solar, secado en sombra y maduración en cajones de madera noble amazónica para alcanzar vainas negras y cristalizadas con alta vanillina.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. VENTANA DE INFORMACIÓN Y TRAZABILIDAD EN VIVO (REQUERIMIENTO CLAVE) */}
      <section id="trazabilidad" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-vanilla-300 pb-6">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-forest-800 bg-forest-100 px-3 py-1 rounded-md mb-2">
              <Sprout className="w-4 h-4 text-forest-700" />
              <span>Transparencia y Datos en Tiempo Real</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-forest-950">
              Ventana de Informes Diarios de Cultivo
            </h2>
            <p className="text-xs sm:text-sm text-forest-600 mt-1 max-w-2xl">
              Aquí puedes auditar el seguimiento agronómico en territorio. Cada informe se actualiza automáticamente al ser emitido desde el campo y cuenta con descarga en PDF oficial ITEC.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/reportes/nuevo"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-forest-900 hover:bg-forest-800 text-white font-bold text-xs shadow-md transition-transform active:scale-95"
            >
              <FileText className="w-4 h-4 text-vanilla-400" />
              <span>+ Llenar Informe Diario</span>
            </Link>

            <Link
              href="/admin"
              className="inline-flex items-center space-x-1.5 px-3 py-2.5 rounded-xl border border-vanilla-300 text-forest-900 font-semibold text-xs hover:bg-white transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-forest-700" />
              <span>Ver Todo</span>
            </Link>
          </div>
        </div>

        {/* Tarjetas de Informes Recientes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.slice(0, 4).map((report) => {
            const actRealizadas = report.actividades.filter((a) => a.realizado);
            return (
              <div
                key={report.id}
                className="bg-white rounded-2xl p-6 border border-vanilla-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Encabezado del reporte */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-forest-100 text-forest-900">
                      {report.id}
                    </span>
                    <div className="flex items-center space-x-1 text-xs text-forest-600">
                      <Calendar className="w-3.5 h-3.5 text-vanilla-600" />
                      <span>{report.fechaReporte}</span>
                    </div>
                  </div>

                  {/* Lote y Responsable */}
                  <div>
                    <h3 className="text-base font-bold text-forest-950">
                      {report.lote}
                    </h3>
                    <p className="text-xs text-forest-600">
                      Responsable: <strong>{report.responsable}</strong>
                    </p>
                  </div>

                  {/* Condiciones climáticas */}
                  <div className="flex items-center space-x-4 bg-vanilla-50/70 p-2.5 rounded-lg text-xs text-forest-800">
                    <span className="flex items-center space-x-1">
                      <Sun className="w-3.5 h-3.5 text-vanilla-600" />
                      <span>{report.clima}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Thermometer className="w-3.5 h-3.5 text-forest-600" />
                      <span>{report.tempMin}°C - {report.tempMax}°C</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Droplets className="w-3.5 h-3.5 text-blue-600" />
                      <span>{report.humedad}% Hum</span>
                    </span>
                  </div>

                  {/* Actividades destacadas */}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-forest-500 mb-1.5">
                      Actividades Ejecutadas:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {actRealizadas.length > 0 ? (
                        actRealizadas.map((act) => (
                          <span
                            key={act.id}
                            className="text-[11px] px-2 py-0.5 rounded bg-forest-50 text-forest-800 border border-forest-200"
                          >
                            ✓ {act.nombre}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-forest-400 italic">
                          Sin actividades marcadas
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Observaciones */}
                  {report.observaciones && (
                    <p className="text-xs text-forest-700 italic bg-vanilla-50/40 p-2.5 rounded-md border-l-2 border-vanilla-500">
                      "{report.observaciones}"
                    </p>
                  )}
                </div>

                {/* Botón de Descarga del Informe en PDF */}
                <div className="pt-3 border-t border-vanilla-100 flex items-center justify-between">
                  <span className="text-[11px] text-forest-500">
                    Seguimiento y Control ITEC
                  </span>
                  <button
                    onClick={() => generateDailyReportPDF(report)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-forest-900 hover:bg-forest-800 text-white text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-vanilla-400" />
                    <span>Descargar PDF</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. FORMULARIO B2B: SOLICITUD DE MUESTRAS Y CONTACTO */}
      <section id="b2b" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-vanilla-200">
          <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-vanilla-600">
              Canal Comercial Exclusivo B2B
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-forest-950">
              Solicita Muestras Comerciales o Reserva de Lotes
            </h2>
            <p className="text-xs sm:text-sm text-forest-700">
              Atendemos a maestros chocolateros, alta repostería gourmet, perfumería botánica y fondos de impacto global.
            </p>
          </div>

          {contactSubmitted ? (
            <div className="p-6 bg-forest-900 text-white rounded-2xl text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-vanilla-400 mx-auto" />
              <h3 className="text-lg font-serif font-bold text-vanilla-200">
                ¡Solicitud Recibida Correctamente!
              </h3>
              <p className="text-xs text-forest-200 max-w-md mx-auto">
                El equipo comercial de Amazon Vanilla e ITEC Ecuador se comunicará contigo en menos de 24 horas con la ficha técnica y opciones de envío.
              </p>
              <button
                onClick={() => setContactSubmitted(false)}
                className="mt-2 text-xs text-vanilla-300 underline"
              >
                Enviar otra solicitud
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setContactSubmitted(true);
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-forest-900 mb-1">
                    Nombre Completo:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Tu nombre y apellido"
                    className="w-full text-xs p-3 bg-vanilla-50/50 rounded-xl border border-vanilla-300 focus:outline-none focus:ring-2 focus:ring-forest-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-forest-900 mb-1">
                    Empresa / Marca:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Chocolatería, Pastelería, etc."
                    className="w-full text-xs p-3 bg-vanilla-50/50 rounded-xl border border-vanilla-300 focus:outline-none focus:ring-2 focus:ring-forest-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-forest-900 mb-1">
                    Correo Electrónico Corporativo:
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="contacto@empresa.com"
                    className="w-full text-xs p-3 bg-vanilla-50/50 rounded-xl border border-vanilla-300 focus:outline-none focus:ring-2 focus:ring-forest-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-forest-900 mb-1">
                    País / Ciudad de Destino:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Ecuador, Francia, EE.UU., Japón"
                    className="w-full text-xs p-3 bg-vanilla-50/50 rounded-xl border border-vanilla-300 focus:outline-none focus:ring-2 focus:ring-forest-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-forest-900 mb-1">
                  Mensaje o Especificación de Interés:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Indícanos si buscas muestras de vaina curada Grado A, volumen estimado de compra, o interés en visitas a territorio..."
                  className="w-full text-xs p-3 bg-vanilla-50/50 rounded-xl border border-vanilla-300 focus:outline-none focus:ring-2 focus:ring-forest-600"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-forest-900 hover:bg-forest-800 text-white font-bold text-xs tracking-wider uppercase shadow-lg transition-transform active:scale-98"
              >
                Enviar Solicitud Comercial
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
