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
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              try {
                var theme = localStorage.getItem('nucleo_theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else if (theme === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch(e) {
                document.documentElement.classList.add('dark');
              }
            })()`,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#f5f5f7] dark:bg-[#0d0e11] text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
