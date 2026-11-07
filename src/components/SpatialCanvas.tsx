"use client";

import React, { useState } from "react";
import { 
  Users, 
  Receipt, 
  Package, 
  Wallet, 
  Cpu, 
  ArrowRight, 
  TrendingUp, 
  AlertTriangle, 
  X, 
  Sparkles,
  CheckCircle2,
  Maximize2
} from "lucide-react";
import { TenantSettings, Product } from "@/types";

interface SpatialCanvasProps {
  tenant: TenantSettings;
  products: Product[];
  onNavigate: (view: string) => void;
}

export const SpatialCanvas: React.FC<SpatialCanvasProps> = ({
  tenant,
  products,
  onNavigate,
}) => {
  const [selectedNode, setSelectedNode] = useState<string | null>("sales");

  // Calcs
  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);
  const totalStockCount = products.reduce((acc, p) => acc + p.stock, 0);

  const nodeDetails: Record<string, any> = {
    crm: {
      tag: "CRM & CUENTAS B2B",
      title: "Nodo Clientes & WhatsApp Cloud",
      desc: "Gestión de cartera, cotizaciones y recordatorios de crédito automáticos.",
      stat: "1,420 Clientes",
      statSub: "+18 registrados este mes",
      linkView: "receivables",
      linkText: "Abrir Cartera de Clientes",
      events: [
        "[16:44:10] WA_SESSION: 1,420 cuentas sincronizadas",
        "[16:43:50] PIPELINE: Cotización aprobada #912",
        "[16:42:15] ALERTA: Constructora Martínez cupo crediticio 80%",
      ],
    },
    sales: {
      tag: "CORE TRANSACCIONAL",
      title: "Terminal POS & Facturación",
      desc: "Ventas de mostrador rápidas con soporte multimoneda NIO/USD y descuento inmediato de inventario.",
      stat: "$4,892.50 USD",
      statSub: `≈ C$ ${(4892.5 * tenant.exchangeRate).toLocaleString()} NIO`,
      linkView: "pos",
      linkText: "Ir al Terminal de Ventas",
      events: [
        "[16:44:02] VENTA_POS: Factura #000482 - C$ 825.00",
        "[16:43:21] CAJA_CHICA: Arqueo parcial conforme",
        "[16:42:01] FISCAL_SYNC: Comprobante validado DGI",
      ],
    },
    inventory: {
      tag: "LOGÍSTICA & KARDEX",
      title: "Inventario Multi-Unidad & Lotes",
      desc: "Control por varas, metros, quintales, sacos y alertas de stock mínimo o caducidad.",
      stat: `${products.length} SKUs Registrados`,
      statSub: `${lowStockProducts.length} productos con stock bajo`,
      linkView: "inventory",
      linkText: "Gestionar Bodega & Kardex",
      events: [
        `[16:43:12] ALERTA_STOCK: ${lowStockProducts.length} artículos por debajo de la reserva mínima`,
        "[16:41:55] KARDEX: Salida de almacén vinculada a POS",
        "[16:40:00] BODEGA_A1: 99.2% de precisión física",
      ],
    },
    finance: {
      tag: "TESORERÍA & BÓVEDA",
      title: "Finanzas & Cuentas por Cobrar",
      desc: "Libro de ingresos, arqueo de efectivo y control de abonos de fiados.",
      stat: "$148,920.00 USD",
      statSub: "Valoración de activos líquidos",
      linkView: "receivables",
      linkText: "Ver Cuentas por Cobrar",
      events: [
        "[16:44:11] COBRANZA: Abono registrado C$ 2,500.00 Don Manuel",
        "[16:43:00] ASIENTO_AUTO: Registro automático de ingresos diarios",
        "[16:38:22] CAJA_FISICA: Efectivo arqueado C$ 18,400.00",
      ],
    },
    automation: {
      tag: "MOTOR DE REGLAS",
      title: "Automatizaciones & Disparadores",
      desc: "Reabastecimiento predictivo de materiales y recordatorios amigables de cobranza.",
      stat: "18 Reglas Activas",
      statSub: "100% de ejecuciones exitosas",
      linkView: "pos",
      linkText: "Ver Automatizaciones",
      events: [
        "[16:43:40] REORDEN: Sugerencia de compra para Cemento Holcim",
        "[16:42:10] CRON_RECORDATORIO: 6 avisos emitidos",
        "[16:39:50] STATUS: Motor operativo sin incidencias",
      ],
    },
  };

  const activeMeta = selectedNode ? nodeDetails[selectedNode] : null;

  return (
    <div className="relative w-full min-h-[740px] rounded-3xl bg-neutral-50/70 dark:bg-[#121214]/60 border border-neutral-200/80 dark:border-neutral-800/80 overflow-hidden select-none p-4 md:p-6 transition-colors">
      
      {/* Subtle Dot Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20"
        style={{
          backgroundImage: "radial-gradient(#86868b 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-apple-blue/10 dark:bg-apple-blue/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-apple-purple/10 dark:bg-apple-purple/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Telemetry Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-6 px-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md border border-neutral-200 dark:border-neutral-700/80 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-apple-green animate-pulse" />
          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            Topología: Constelación {tenant.name}
          </span>
          <span className="text-neutral-300 dark:text-neutral-600">/</span>
          <span className="text-xs text-neutral-500 font-mono">
            {tenant.activeModules.length} Módulos Activos
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-3 text-xs text-neutral-500 font-mono">
            <span>Latencia: <strong className="text-apple-green">12ms</strong></span>
            <span>•</span>
            <span>Sync: <strong className="text-apple-blue">Local ⇄ Nube</strong></span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("pos")}
            className="px-3 py-1 rounded-full bg-apple-blue text-white text-xs font-semibold hover:bg-apple-blue-hover transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span>Ir al POS</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Spatial SVG Connections */}
      <div className="relative w-full h-[620px] max-w-5xl mx-auto">
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0071e3" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#af52de" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Circuit Lines */}
          <path d="M 220 140 C 340 140, 360 260, 480 260" fill="none" stroke="#d2d2d7" strokeWidth="2" strokeDasharray="4 4" className="dark:stroke-neutral-800" />
          <path d="M 640 240 C 740 240, 760 140, 840 140" fill="none" stroke="#d2d2d7" strokeWidth="2" strokeDasharray="4 4" className="dark:stroke-neutral-800" />
          <path d="M 600 340 C 650 440, 720 480, 800 480" fill="none" stroke="#d2d2d7" strokeWidth="2" strokeDasharray="4 4" className="dark:stroke-neutral-800" />
          <path d="M 840 240 C 840 380, 640 480, 480 480" fill="none" stroke="#d2d2d7" strokeWidth="2" strokeDasharray="4 4" className="dark:stroke-neutral-800" />

          {/* Animated SVG Pulses */}
          <circle fill="#0071e3" r="4">
            <animateMotion dur="4s" repeatCount="indefinite" path="M 220 140 C 340 140, 360 260, 480 260" />
          </circle>
          <circle fill="#34c759" r="4">
            <animateMotion dur="3.5s" repeatCount="indefinite" path="M 640 240 C 740 240, 760 140, 840 140" />
          </circle>
          <circle fill="#af52de" r="4">
            <animateMotion dur="5s" repeatCount="indefinite" path="M 600 340 C 650 440, 720 480, 800 480" />
          </circle>
        </svg>

        {/* NODE 1: CRM & Clientes (Top Left) */}
        <div
          onClick={() => setSelectedNode("crm")}
          className={`absolute top-10 left-4 sm:left-10 w-64 p-4 rounded-2xl cursor-pointer transition-all duration-300 z-10 ${
            selectedNode === "crm"
              ? "bg-white dark:bg-neutral-800/95 ring-2 ring-apple-blue shadow-apple-hover"
              : "bg-white/80 dark:bg-neutral-800/70 hover:bg-white dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-apple"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-apple-blue/10 text-apple-blue flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-neutral-400 block font-semibold">NODO 01</span>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white">CRM & Cuentas</h4>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-apple-green/10 text-apple-green font-semibold">
              WhatsApp
            </span>
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
            1,420
          </div>
          <span className="text-[11px] text-neutral-500 block">Clientes activos en cartera</span>
        </div>

        {/* NODE 2: POS Central (Center Nuclear) */}
        <div
          onClick={() => setSelectedNode("sales")}
          className={`absolute top-44 left-1/2 -translate-x-1/2 w-80 p-5 rounded-3xl cursor-pointer transition-all duration-300 z-20 ${
            selectedNode === "sales"
              ? "bg-white dark:bg-neutral-800/95 ring-2 ring-apple-blue shadow-2xl scale-105"
              : "bg-white/90 dark:bg-neutral-800/80 hover:bg-white dark:hover:bg-neutral-800 border-2 border-apple-blue/30 shadow-apple"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-apple-blue text-white flex items-center justify-center shadow-md shadow-apple-blue/30">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-apple-blue block font-bold">NODO NUCLEAR 02</span>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Ventas & POS Terminal</h3>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-apple-blue/10 text-apple-blue font-bold">
              CORE
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-100/80 dark:bg-neutral-900/80 mb-3">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase block">Ventas Hoy (Turno)</span>
            <div className="text-2xl font-extrabold text-apple-blue tracking-tight">
              C$ {(4892.5 * tenant.exchangeRate).toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-neutral-400 font-mono">
              ≈ $4,892.50 USD (TC {tenant.exchangeRate})
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Tickets: <strong className="text-neutral-800 dark:text-neutral-200">48 transacciones</strong></span>
            <span className="text-apple-blue font-semibold flex items-center gap-1">
              <span>Abrir POS</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* NODE 3: Inventario & Kardex (Top Right) */}
        <div
          onClick={() => setSelectedNode("inventory")}
          className={`absolute top-10 right-4 sm:right-10 w-64 p-4 rounded-2xl cursor-pointer transition-all duration-300 z-10 ${
            selectedNode === "inventory"
              ? "bg-white dark:bg-neutral-800/95 ring-2 ring-apple-purple shadow-apple-hover"
              : "bg-white/80 dark:bg-neutral-800/70 hover:bg-white dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-apple"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-apple-purple/10 text-apple-purple flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-neutral-400 block font-semibold">NODO 03</span>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Inventario & Kardex</h4>
              </div>
            </div>
            {lowStockProducts.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-apple-red/10 text-apple-red font-semibold flex items-center gap-0.5">
                <AlertTriangle className="w-2.5 h-2.5" />
                {lowStockProducts.length} bajo
              </span>
            )}
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
            {products.length} SKUs
          </div>
          <span className="text-[11px] text-neutral-500 block">
            {totalStockCount} unidades en bodega
          </span>
        </div>

        {/* NODE 4: Finanzas & Bóveda (Bottom Right) */}
        <div
          onClick={() => setSelectedNode("finance")}
          className={`absolute bottom-8 right-4 sm:right-14 w-64 p-4 rounded-2xl cursor-pointer transition-all duration-300 z-10 ${
            selectedNode === "finance"
              ? "bg-white dark:bg-neutral-800/95 ring-2 ring-apple-green shadow-apple-hover"
              : "bg-white/80 dark:bg-neutral-800/70 hover:bg-white dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-apple"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-apple-green/10 text-apple-green flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-neutral-400 block font-semibold">NODO 04</span>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Finanzas & Bóveda</h4>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-apple-green/10 text-apple-green font-semibold">
              Conciliado
            </span>
          </div>
          <div className="text-xl font-bold text-apple-green tracking-tight font-mono">
            $148,920.00
          </div>
          <span className="text-[11px] text-neutral-500 block">Flujo de caja y cuentas BAC/BDF</span>
        </div>

        {/* NODE 5: Automatizaciones & Lógica (Bottom Left) */}
        <div
          onClick={() => setSelectedNode("automation")}
          className={`absolute bottom-8 left-4 sm:left-14 w-64 p-4 rounded-2xl cursor-pointer transition-all duration-300 z-10 ${
            selectedNode === "automation"
              ? "bg-white dark:bg-neutral-800/95 ring-2 ring-apple-blue shadow-apple-hover"
              : "bg-white/80 dark:bg-neutral-800/70 hover:bg-white dark:hover:bg-neutral-800 border-l-4 border-l-apple-blue border-neutral-200 dark:border-neutral-700 shadow-apple"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-apple-blue/10 text-apple-blue flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-neutral-400 block font-semibold">NODO 05</span>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Motor de Lógica</h4>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-apple-blue/10 text-apple-blue font-semibold">
              18 Activas
            </span>
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
            100% Éxito
          </div>
          <span className="text-[11px] text-neutral-500 block">
            Reórdenes y avisos automáticos
          </span>
        </div>
      </div>

      {/* Slide-over Inspector for Selected Node */}
      {activeMeta && (
        <aside className="absolute top-0 right-0 h-full w-80 sm:w-96 bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl p-6 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl z-30 flex flex-col justify-between animate-fadeIn">
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80 dark:border-neutral-800">
              <span className="text-[10px] font-mono font-bold text-apple-blue uppercase tracking-wider">
                {activeMeta.tag}
              </span>
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 flex items-center justify-center text-neutral-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                {activeMeta.title}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                {activeMeta.desc}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-100/80 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60">
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                Métrica Principal
              </span>
              <div className="text-xl font-extrabold text-neutral-900 dark:text-white mt-0.5">
                {activeMeta.stat}
              </div>
              <span className="text-xs text-neutral-500">{activeMeta.statSub}</span>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                Eventos en Tiempo Real
              </span>
              <div className="p-3 rounded-2xl bg-neutral-100/90 dark:bg-neutral-900/90 font-mono text-[11px] text-neutral-700 dark:text-neutral-300 space-y-1.5 border border-neutral-200/80 dark:border-neutral-800">
                {activeMeta.events.map((ev: string, idx: number) => (
                  <div key={idx} className="leading-tight truncate">
                    {ev}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-200/80 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => onNavigate(activeMeta.linkView)}
              className="w-full py-2.5 px-4 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-semibold shadow-md shadow-apple-blue/25 transition-all flex items-center justify-center gap-2"
            >
              <span>{activeMeta.linkText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>
      )}
    </div>
  );
};
