import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Amazon Vanilla By Waorani People | ITEC Ecuador",
  description:
    "Vainilla silvestre y agroforestal cultivada por familias y guardianas Waorani en la Amazonía ecuatoriana. Innovación para un campo sostenible con ITEC Ecuador.",
  keywords: [
    "Amazon Vanilla",
    "Waorani",
    "Vainilla ecuatoriana",
    "ITEC Ecuador",
    "Vainilla gourmet",
    "Vanilla odorata",
    "Bioeconomía amazónica",
    "Comercio justo",
    "Chocolatería fina",
  ],
  icons: {
    icon: "/assets/logo-amazon-vanilla-white.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className="min-h-screen flex flex-col bg-[#FBF8F1] text-forest-950 antialiased selection:bg-vanilla-300 selection:text-forest-900">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
