import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-forest-950 text-white border-t border-forest-900 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-forest-800">
          {/* Columna 1: Brand & Misión */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center space-x-3">
              <div className="relative w-10 h-10 bg-white/10 rounded-lg p-1">
                <Image
                  src="/assets/logo-amazon-vanilla-white.png"
                  alt="Amazon Vanilla Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold tracking-wider text-vanilla-300">
                  AMAZON VANILLA
                </h3>
                <p className="text-xs text-forest-300 tracking-widest uppercase">
                  By Waorani People
                </p>
              </div>
            </div>
            <p className="text-sm text-forest-200/80 max-w-md leading-relaxed">
              Iniciativa de bioeconomía y conservación de la Amazonía ecuatoriana. Orquídeas de vainilla cultivadas en sistemas agroforestales bajo dosel por guardianas y familias Waorani, con acompañamiento técnico y científico de <strong>ITEC Ecuador</strong>.
            </p>
            <div className="pt-2 text-xs text-vanilla-400 font-semibold italic">
              "Vainilla: Tradición que genera futuro"
            </div>
          </div>

          {/* Columna 2: Enlaces Rápidos */}
          <div>
            <h4 className="text-sm font-semibold tracking-wider uppercase text-vanilla-400 mb-4">
              Navegación
            </h4>
            <ul className="space-y-2.5 text-sm text-forest-200/80">
              <li>
                <Link href="/#origen" className="hover:text-white transition-colors">
                  Territorio y Comunidad
                </Link>
              </li>
              <li>
                <Link href="/reportes/nuevo" className="hover:text-white transition-colors">
                  Llenar Formulario Diario
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition-colors flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-vanilla-400" />
                  <span>Acceso Administrador</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Contacto & Alianza */}
          <div>
            <h4 className="text-sm font-semibold tracking-wider uppercase text-vanilla-400 mb-4">
              ITEC Ecuador
            </h4>
            <p className="text-xs text-forest-300 mb-3">
              Innovación para un campo sostenible
            </p>
            <div className="space-y-2 text-sm text-forest-200/80">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-vanilla-400 mt-0.5 flex-shrink-0" />
                <span>Territorio Waorani / Pastaza & Napo, Ecuador</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-vanilla-400 flex-shrink-0" />
                <span>info@itec.ec</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-vanilla-400 flex-shrink-0" />
                <span>+593 98 000 0000</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-forest-400">
          <p>© {new Date().getFullYear()} Amazon Vanilla & ITEC Ecuador. Todos los derechos reservados.</p>
          <p className="mt-2 sm:mt-0 text-forest-500">
            Desarrollado para la preservación biocultural y el comercio justo amazónico.
          </p>
        </div>
      </div>
    </footer>
  );
}
