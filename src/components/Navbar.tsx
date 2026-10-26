"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, FileText, ShieldCheck, Sprout } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

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

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-forest-800">
            <Link href="/#origen" className="hover:text-vanilla-600 transition-colors">
              Territorio Waorani
            </Link>
            <Link href="/#calidad" className="hover:text-vanilla-600 transition-colors">
              Innovación ITEC
            </Link>
            <Link href="/#trazabilidad" className="hover:text-vanilla-600 transition-colors flex items-center space-x-1">
              <Sprout className="w-4 h-4 text-forest-600" />
              <span>Trazabilidad de Campo</span>
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="hidden sm:flex items-center space-x-3">
            <Link
              href="/reportes/nuevo"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-forest-900 hover:bg-forest-800 text-white text-xs font-semibold tracking-wide transition-all shadow-sm hover:shadow"
            >
              <FileText className="w-3.5 h-3.5 text-vanilla-400" />
              <span>+ Nuevo Informe</span>
            </Link>

            <Link
              href="/admin"
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-vanilla-300 hover:border-vanilla-500 text-forest-900 text-xs font-semibold transition-all hover:bg-white"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-forest-700" />
              <span>Admin</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-2">
            <Link
              href="/reportes/nuevo"
              className="p-2 rounded-lg bg-forest-900 text-white text-xs"
              title="Llenar Informe"
            >
              <FileText className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-forest-900 hover:text-vanilla-600 hover:bg-vanilla-100 transition-colors"
              aria-label="Abrir Menú"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {isOpen && (
        <div className="md:hidden bg-[#FBF8F1] border-b border-vanilla-200 px-4 pt-3 pb-6 space-y-3">
          <Link
            href="/#origen"
            onClick={() => setIsOpen(false)}
            className="block py-2 text-forest-900 font-medium hover:text-vanilla-600"
          >
            Territorio Waorani
          </Link>
          <Link
            href="/#calidad"
            onClick={() => setIsOpen(false)}
            className="block py-2 text-forest-900 font-medium hover:text-vanilla-600"
          >
            Innovación ITEC
          </Link>
          <Link
            href="/#trazabilidad"
            onClick={() => setIsOpen(false)}
            className="block py-2 text-forest-900 font-medium hover:text-vanilla-600"
          >
            Trazabilidad de Campo
          </Link>
          <div className="pt-3 border-t border-vanilla-200 flex flex-col space-y-2">
            <Link
              href="/reportes/nuevo"
              onClick={() => setIsOpen(false)}
              className="w-full text-center py-2.5 rounded-lg bg-forest-900 text-white text-sm font-semibold flex items-center justify-center space-x-2"
            >
              <FileText className="w-4 h-4 text-vanilla-400" />
              <span>Llenar Informe Diario</span>
            </Link>
            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="w-full text-center py-2 rounded-lg border border-forest-800 text-forest-900 text-sm font-semibold flex items-center justify-center space-x-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-forest-700" />
              <span>Panel de Administración</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
