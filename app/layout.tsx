import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MainLayout from "@/components/layout/MainLayout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "HealthSignal RISA - Plataforma Clínica",
  description: "Plataforma de software de grado médico para monitoreo de señales clínicas y auditoría de evidencia.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
