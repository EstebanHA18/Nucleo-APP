"use client";

import React, { useState } from "react";
import { 
  Users, 
  Receipt, 
  Package, 
  Wallet, 
  ArrowRight, 
  X, 
  Layers,
  UserCheck,
  FileText,
  BarChart3,
  SlidersHorizontal,
  Activity,
  Cpu
} from "lucide-react";
import { TenantSettings, Product, Customer, Sale, ModuleKey } from "@/types";

interface SpatialCanvasProps {
  tenant: TenantSettings;
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  onNavigate: (view: string) => void;
  onOpenSettingsWizard: () => void;
}

export const SpatialCanvas: React.FC<SpatialCanvasProps> = ({
  tenant,
  products,
  customers,
  sales,
  onNavigate,
  onOpenSettingsWizard,
}) => {
  // POR DEFECTO CERRADO (null), solo se abre al hacer clic en un módulo
  const [selectedNodeKey, setSelectedNodeKey] = useState<string | null>(null);

  // Métricas dinámicas calculadas
  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);
  const totalStockCount = products.reduce((acc, p) => acc + p.stock, 0);
  const totalSalesToday = sales.reduce((acc, s) => acc + s.total, 4892.5);
  const corporateCustomers = customers.filter((c) => c.taxId && c.taxId.length > 5).length;

  // Catálogo completo de módulos con datos específicos
  const moduleMetaRegistry: Record<string, {
    nodeNum: string;
    title: string;
    category: string;
    badge: string;
    icon: React.ReactNode;
    colorScheme: {
      accent: string;
      bg: string;
      glow: string;
      lineColor: string;
    };
    statMain: string;
    statSub: string;
    actionView: string;
    actionLabel: string;
    desc: string;
    events: string[];
  }> = {
    pos: {
      nodeNum: "02",
      title: "Ventas & POS Terminal",
      category: "CORE TRANSACCIONAL",
      badge: "CORE",
      icon: <Receipt className="w-5 h-5" />,
      colorScheme: {
        accent: "text-apple-blue",
        bg: "bg-apple-blue",
        glow: "rgba(0, 122, 255, 0.3)",
        lineColor: "#007aff",
      },
      statMain: `C$ ${(totalSalesToday * (tenant.currency === "NIO" ? 1 : tenant.exchangeRate)).toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      statSub: `≈ $${(totalSalesToday / tenant.exchangeRate).toFixed(2)} USD (TC ${tenant.exchangeRate.toFixed(2)})`,
      actionView: "pos",
      actionLabel: "Abrir Terminal de Ventas",
      desc: "Terminal de venta rápida de mostrador, cálculo de márgenes y descuento automático de inventario.",
      events: [
        "[16:44:02] VENTA_POS: Factura emitida al contado",
        "[16:43:21] CAJA: Pago en efectivo recibido conforme",
        "[16:42:01] FISCAL_SYNC: Comprobante registrado",
      ],
    },
    customers: {
      nodeNum: "01",
      title: "Directorio Clientes",
      category: "GESTIÓN COMERCIAL",
      badge: "Activo",
      icon: <Users className="w-4 h-4" />,
      colorScheme: {
        accent: "text-sky-400",
        bg: "bg-sky-500",
        glow: "rgba(56, 189, 248, 0.25)",
        lineColor: "#38bdf8",
      },
      statMain: `${customers.length}`,
      statSub: "Clientes registrados para facturación",
      actionView: "customers",
      actionLabel: "Ver Directorio de Clientes",
      desc: "Directorio B2B y B2C con RUC, teléfonos de contacto y volumen acumulado de compras.",
      events: [
        `[16:44:10] DIRECTORY: ${customers.length} expedientes sincronizados`,
        "[16:43:50] HISTORIAL: Compra asociada a cliente",
        "[16:42:15] PERFIL: Datos de entrega y RUC verificados",
      ],
    },
    inventory: {
      nodeNum: "03",
      title: "Inventario & Kardex",
      category: "LOGÍSTICA & BODEGA",
      badge: lowStockProducts.length > 0 ? `⚠️ ${lowStockProducts.length} bajo` : "Óptimo",
      icon: <Package className="w-4 h-4" />,
      colorScheme: {
        accent: "text-purple-400",
        bg: "bg-purple-500",
        glow: "rgba(168, 85, 247, 0.25)",
        lineColor: "#a855f7",
      },
      statMain: `${products.length} SKUs`,
      statSub: `${totalStockCount} unidades en bodega`,
      actionView: "inventory",
      actionLabel: "Gestionar Bodega & Kardex",
      desc: "Control por unidades (varas, metros, sacos), lotes con vencimiento y alertas de stock mínimo.",
      events: [
        `[16:43:12] ALERTA_STOCK: ${lowStockProducts.length} artículos por debajo del mínimo`,
        "[16:41:55] KARDEX: Salida sincronizada con mostrador",
        "[16:40:00] BODEGA: 99.8% congruencia física",
      ],
    },
    billing: {
      nodeNum: "04",
      title: "Finanzas & Caja",
      category: "TESORERÍA & CAJA",
      badge: "Conciliado",
      icon: <FileText className="w-4 h-4" />,
      colorScheme: {
        accent: "text-emerald-400",
        bg: "bg-emerald-500",
        glow: "rgba(52, 211, 153, 0.25)",
        lineColor: "#34d399",
      },
      statMain: `$148,920.00`,
      statSub: "Flujo de caja y cuentas bancarias",
      actionView: "pos",
      actionLabel: "Ver Libro Diario y Caja",
      desc: "Libro de ingresos, arqueo de turno y consolidación de pagos en efectivo, tarjeta o transferencia.",
      events: [
        "[16:44:11] BANCO_BAC: Pago electrónico verificado",
        "[16:43:00] CAJA: Arqueo conforme con recibos",
        "[16:38:22] FLUJO: Ingresos netos acumulados",
      ],
    },
    expenses: {
      nodeNum: "05",
      title: "Gastos & Compras",
      category: "CONTROL DE EGRESOS",
      badge: "Controlado",
      icon: <Wallet className="w-4 h-4" />,
      colorScheme: {
        accent: "text-amber-400",
        bg: "bg-amber-500",
        glow: "rgba(251, 191, 36, 0.25)",
        lineColor: "#fbbf24",
      },
      statMain: "C$ 14,250.00",
      statSub: "Egresos y compras operativas",
      actionView: "inventory",
      actionLabel: "Ver Compras y Egresos",
      desc: "Registro de facturas de compras a proveedores, reabastecimiento y caja chica operativa.",
      events: [
        "[15:20:10] COMPRA: Factura a proveedor registrada",
        "[14:10:00] GASTO: Pago de flete verificado",
        "[12:00:00] PROVEEDOR: Reabastecimiento conforme",
      ],
    },
    hr: {
      nodeNum: "06",
      title: "RRHH & Turnos",
      category: "PERSONAL",
      badge: "Al Día",
      icon: <UserCheck className="w-4 h-4" />,
      colorScheme: {
        accent: "text-teal-400",
        bg: "bg-teal-500",
        glow: "rgba(45, 212, 191, 0.25)",
        lineColor: "#2dd4bf",
      },
      statMain: "8 Colaboradores",
      statSub: "Turnos de cajeros y bodegueros",
      actionView: "users",
      actionLabel: "Gestionar Personal",
      desc: "Asistencia de empleados, roles de acceso restringido y control de turnos.",
      events: [
        "[08:00:10] ASISTENCIA: Cajero 1 inició turno",
        "[08:02:00] ASISTENCIA: Bodeguero inició turno",
        "[07:55:00] TURNO: Caja aperturada conforme",
      ],
    },
    production: {
      nodeNum: "07",
      title: "Recetas & Producción",
      category: "TRANSFORMACIÓN",
      badge: "Recetas ON",
      icon: <Layers className="w-4 h-4" />,
      colorScheme: {
        accent: "text-rose-400",
        bg: "bg-rose-500",
        glow: "rgba(251, 113, 133, 0.25)",
        lineColor: "#fb7185",
      },
      statMain: "24 Fórmulas",
      statSub: "Descuento automático de insumos",
      actionView: "inventory",
      actionLabel: "Ver Recetas e Insumos",
      desc: "Descuenta materias primas automáticamente con cada venta de producto terminado.",
      events: [
        "[16:30:00] RECETA: Descuento de ingredientes en bodega",
        "[15:45:00] PRODUCCIÓN: Lote preparado con éxito",
        "[14:00:00] STOCK: Insumos verificados",
      ],
    },
    reports: {
      nodeNum: "08",
      title: "Motor de Lógica & KPIs",
      category: "INTELIGENCIA",
      badge: "10 Activas",
      icon: <Cpu className="w-4 h-4" />,
      colorScheme: {
        accent: "text-cyan-400",
        bg: "bg-cyan-500",
        glow: "rgba(34, 211, 238, 0.25)",
        lineColor: "#22d3ee",
      },
      statMain: "100% Éxito",
      statSub: "Reórdenes y avisos automáticos",
      actionView: "dashboard",
      actionLabel: "Abrir Dashboard Gerencial",
      desc: "Monitoreo continuo de rotación, alertas automáticas de reposición y auditoría de ventas.",
      events: [
        "[16:40:00] KPI: Ticket promedio en alza",
        "[15:00:00] MOTOR: Alerta de reposición despachada",
        "[12:30:00] REPORTE: Cierre de jornada proyectado",
      ],
    },
  };

  // Módulos activos para la empresa (excluyendo POS que es el nodo central nuclear)
  const activeSatelliteKeys = tenant.activeModules.filter(
    (k) => k !== "pos" && moduleMetaRegistry[k]
  );

  // Si por alguna razón hay pocos satélites, aseguramos los representativos del rubro
  const satelliteKeys = activeSatelliteKeys.length > 0 
    ? activeSatelliteKeys 
    : (["customers", "inventory", "reports", "billing"] as ModuleKey[]);

  // Asignación de posiciones de órbita espacial alrededor del centro
  // Cuadrantes: 0: Top-Left, 1: Top-Right, 2: Bottom-Left, 3: Bottom-Right
  const orbitCoordinates = [
    { posClass: "top-10 md:top-14 left-4 md:left-12", animClass: "animate-float-slow", x: 230, y: 160 },
    { posClass: "top-10 md:top-14 right-4 md:right-12", animClass: "animate-float-reverse", x: 770, y: 160 },
    { posClass: "bottom-10 md:bottom-14 left-4 md:left-12", animClass: "animate-float-delayed", x: 230, y: 540 },
    { posClass: "bottom-10 md:bottom-14 right-4 md:right-12", animClass: "animate-float-slow", x: 770, y: 540 },
    { posClass: "top-1/2 -translate-y-1/2 left-2 md:left-6", animClass: "animate-float-reverse", x: 140, y: 350 },
    { posClass: "top-1/2 -translate-y-1/2 right-2 md:right-6", animClass: "animate-float-delayed", x: 860, y: 350 },
  ];

  const posCoreMeta = moduleMetaRegistry["pos"];
  const activeInspectorMeta = selectedNodeKey ? moduleMetaRegistry[selectedNodeKey] : null;

  return (
    <div className="relative w-full min-h-[760px] md:h-[780px] rounded-3xl bg-[#0d0e12] border border-neutral-800/80 overflow-hidden select-none p-4 md:p-6 transition-all shadow-2xl">
      
      {/* Fondo de constelación con rejilla radial fina */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: "radial-gradient(#4b5563 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Bioluminiscencia de fondo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-apple-blue/10 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Barra superior de telemetría tipo Starlink / Apple UI */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 px-2 mb-2">
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-neutral-900/90 backdrop-blur-md border border-neutral-800 shadow-sm text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-neutral-200">
            Topología: Constelación {tenant.name}
          </span>
          <span className="text-neutral-600">/</span>
          <span className="text-neutral-400 font-mono">
            {satelliteKeys.length + 1} Módulos Activos
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-neutral-400 px-3 py-1 rounded-full bg-neutral-900/80 border border-neutral-800/80">
            <span>Latencia: 12ms</span>
            <span className="text-neutral-600">•</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <Activity className="w-3 h-3 inline" />
              Sync: Local ⇄ Nube
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenSettingsWizard}
            className="px-3 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-medium transition-all flex items-center gap-1.5 border border-neutral-700/80 hover:border-neutral-600"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-apple-blue" />
            <span className="hidden md:inline">Configurar</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("pos")}
            className="px-4 py-1.5 rounded-full bg-apple-blue text-white text-xs font-semibold hover:bg-apple-blue-hover transition-all flex items-center gap-1.5 shadow-md shadow-apple-blue/20"
          >
            <span>Ir al POS</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG de Circuitos & Cables Bézier que conectan los nodos satélites al nodo central */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none z-0 hidden md:block" 
        viewBox="0 0 1000 700" 
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#007aff" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="grad-purple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#007aff" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="grad-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#007aff" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="grad-amber" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#007aff" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {satelliteKeys.slice(0, 4).map((_, idx) => {
          const coord = orbitCoordinates[idx];
          if (!coord) return null;
          // Curvas suaves hacia el centro (500, 350)
          const midX = (coord.x + 500) / 2;
          const pathD = `M ${coord.x} ${coord.y} C ${midX} ${coord.y}, ${midX} 350, 500 350`;
          const strokeColors = ["url(#grad-blue)", "url(#grad-purple)", "url(#grad-amber)", "url(#grad-emerald)"];

          return (
            <g key={idx}>
              <path
                d={pathD}
                fill="none"
                stroke={strokeColors[idx % strokeColors.length]}
                strokeWidth="1.5"
                strokeDasharray="4 5"
                className="opacity-70"
              />
              {/* Punto de enlace en el extremo satélite */}
              <circle cx={coord.x} cy={coord.y} r="3" fill="#60a5fa" className="animate-ping opacity-75" />
              <circle cx={coord.x} cy={coord.y} r="2.5" fill="#93c5fd" />
            </g>
          );
        })}
      </svg>

      {/* LIENZO ESPACIAL CONSTELACIÓN: Posiciones orbitales flotantes */}
      <div className="relative z-10 w-full h-[660px] flex items-center justify-center">

        {/* ========================================================= */}
        {/* NODO NUCLEAR CENTRAL: POS & VENTAS (Flotando en el centro) */}
        {/* ========================================================= */}
        <div 
          onClick={() => setSelectedNodeKey("pos")}
          className={`cursor-pointer transition-all duration-300 z-10 w-[330px] sm:w-[380px] rounded-3xl p-5 md:p-6 bg-[#16171d]/90 backdrop-blur-2xl border-2 ${
            selectedNodeKey === "pos"
              ? "border-apple-blue shadow-[0_0_40px_rgba(0,122,255,0.4)] scale-105"
              : "border-apple-blue/40 hover:border-apple-blue shadow-[0_20px_50px_rgba(0,0,0,0.8)] hover:shadow-[0_0_35px_rgba(0,122,255,0.3)] hover:scale-[1.02]"
          } animate-float-slow`}
        >
          {/* Header del Nodo Central */}
          <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-apple-blue text-white flex items-center justify-center shadow-lg shadow-apple-blue/40">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-apple-blue tracking-wider block">
                  NODO NUCLEAR 02
                </span>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {posCoreMeta.title}
                </h3>
              </div>
            </div>

            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-apple-blue/15 text-apple-blue border border-apple-blue/30 font-mono">
              CORE
            </span>
          </div>

          {/* Caja Interna de Métrica de Turno */}
          <div className="p-4 rounded-2xl bg-[#0f1015]/90 border border-neutral-800/90 mb-3.5">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-medium">
              VENTAS HOY (TURNO)
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight mt-1">
              {posCoreMeta.statMain}
            </div>
            <span className="text-[11px] text-neutral-400 font-mono mt-1 block">
              {posCoreMeta.statSub}
            </span>
          </div>

          {/* Footer del Nodo Central */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-neutral-400 font-mono text-[11px]">
              Tickets: {sales.length + 48} transacciones
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate("pos");
              }}
              className="text-apple-blue hover:text-white font-semibold text-xs flex items-center gap-1 group transition-colors"
            >
              <span>Abrir POS</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* NODOS SATÉLITE FLOTANTES EN ÓRBITA                         */}
        {/* ========================================================= */}
        {satelliteKeys.slice(0, 4).map((key, index) => {
          const meta = moduleMetaRegistry[key];
          if (!meta) return null;
          const isSelected = selectedNodeKey === key;
          const coord = orbitCoordinates[index];

          return (
            <div
              key={key}
              onClick={() => setSelectedNodeKey(key)}
              className={`absolute ${coord.posClass} ${coord.animClass} cursor-pointer transition-all duration-300 w-[240px] sm:w-[270px] rounded-2xl p-4 bg-[#14151b]/85 backdrop-blur-xl border ${
                isSelected
                  ? "border-apple-blue ring-2 ring-apple-blue/50 shadow-[0_0_30px_rgba(0,122,255,0.35)] scale-105 z-30"
                  : "border-neutral-800/90 hover:border-neutral-700 hover:scale-105 shadow-[0_16px_36px_rgba(0,0,0,0.6)] hover:shadow-[0_0_25px_rgba(255,255,255,0.08)] z-10"
              }`}
            >
              {/* Header de Satélite */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800/80">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-xl ${meta.colorScheme.bg}/20 ${meta.colorScheme.accent} flex items-center justify-center border border-white/5`}>
                    {meta.icon}
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-neutral-400 font-semibold block leading-tight">
                      NODO {meta.nodeNum}
                    </span>
                    <h4 className="text-xs font-bold text-white tracking-tight truncate max-w-[130px]">
                      {meta.title}
                    </h4>
                  </div>
                </div>

                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full font-mono ${
                  meta.badge.includes("bajo")
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : "bg-neutral-800 text-neutral-300 border border-neutral-700"
                }`}>
                  {meta.badge}
                </span>
              </div>

              {/* Métrica Principal */}
              <div className="py-1">
                <div className="text-lg font-bold text-white font-mono tracking-tight">
                  {meta.statMain}
                </div>
                <p className="text-[10px] text-neutral-400 mt-0.5 leading-snug line-clamp-1">
                  {meta.statSub}
                </p>
              </div>

              {/* Indicador de conexión activo */}
              <div className="pt-2 mt-1 border-t border-neutral-800/60 flex items-center justify-between text-[10px] text-neutral-500">
                <span className="flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Conectado
                </span>
                <span className="text-apple-blue font-semibold hover:underline">
                  Inspeccionar →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* SLIDE-OVER INSPECTOR LATERAL (CERRADO POR DEFECTO)        */}
      {/* SOLO SE MUESTRA AL HACER CLIC EN UN MÓDULO                 */}
      {/* ========================================================= */}
      {activeInspectorMeta && (
        <>
          {/* Backdrop semi-transparente para cerrar al hacer clic afuera */}
          <div 
            onClick={() => setSelectedNodeKey(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity animate-fadeIn"
          />

          <aside className="fixed top-0 right-0 h-full w-80 sm:w-96 bg-[#18191f]/95 backdrop-blur-2xl p-6 border-l border-neutral-800 shadow-2xl z-50 flex flex-col justify-between animate-fadeIn text-neutral-200">
            <div className="space-y-5">
              {/* Header del Inspector con botón X que SÍ cierra */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <span className="text-[10px] font-mono font-bold text-apple-blue uppercase tracking-wider">
                  {activeInspectorMeta.category}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedNodeKey(null)}
                  className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-300 hover:text-white transition-colors"
                  aria-label="Cerrar inspector"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-6 h-6 rounded-lg ${activeInspectorMeta.colorScheme.bg}/20 ${activeInspectorMeta.colorScheme.accent} flex items-center justify-center`}>
                    {activeInspectorMeta.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {activeInspectorMeta.title}
                  </h3>
                </div>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  {activeInspectorMeta.desc}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#0f1014] border border-neutral-800">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block font-mono">
                  Métrica en Tiempo Real
                </span>
                <div className="text-2xl font-extrabold text-white mt-1 font-mono">
                  {activeInspectorMeta.statMain}
                </div>
                <span className="text-xs text-neutral-400 mt-0.5 block">
                  {activeInspectorMeta.statSub}
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block font-mono">
                  Telemetría & Eventos de Módulo
                </span>
                <div className="p-3 rounded-2xl bg-[#0f1014] font-mono text-[11px] text-neutral-300 space-y-1.5 border border-neutral-800/90 max-h-48 overflow-y-auto">
                  {activeInspectorMeta.events.map((ev: string, idx: number) => (
                    <div key={idx} className="leading-tight truncate text-neutral-300">
                      {ev}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedNodeKey(null);
                  onNavigate(activeInspectorMeta.actionView);
                }}
                className="w-full py-3 px-4 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-semibold shadow-lg shadow-apple-blue/25 transition-all flex items-center justify-center gap-2"
              >
                <span>{activeInspectorMeta.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
};
