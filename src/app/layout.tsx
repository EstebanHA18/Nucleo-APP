import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Núcleo ERP // Sistema Modular Multi-Tenant",
  description: "ERP modular donde cada negocio construye su propio sistema activando únicamente los módulos que necesita.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-[#f5f5f7] dark:bg-[#0d0e11] text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
