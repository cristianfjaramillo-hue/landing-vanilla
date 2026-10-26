"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { FileText, ShieldCheck } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-[#FBF8F1]/95 backdrop-blur-md border-b border-vanilla-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative w-12 h-12 flex-shrink-0">
              <Image
                src="/assets/logo-amazon-vanilla-white.png"
                alt="Amazon Vanilla By Waorani People"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-serif tracking-widest text-lg font-bold text-forest-900 group-hover:text-vanilla-600 transition-colors">
                AMAZON VANILLA
              </span>
              <span className="text-[10px] tracking-wider uppercase text-vanilla-600 font-semibold">
                By Waorani People & ITEC
              </span>
            </div>
          </Link>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <Link
              href="/reportes/nuevo"
              className="inline-flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-lg bg-forest-900 hover:bg-forest-800 text-white text-xs font-semibold tracking-wide transition-all shadow-sm hover:shadow"
            >
              <FileText className="w-3.5 h-3.5 text-vanilla-400" />
              <span>Generar Informe Diario</span>
            </Link>

            <Link
              href="/admin"
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-vanilla-300 hover:border-vanilla-500 text-forest-900 text-xs font-semibold transition-all hover:bg-white"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-forest-700" />
              <span>Admin</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
