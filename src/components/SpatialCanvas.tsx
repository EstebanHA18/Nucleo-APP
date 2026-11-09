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
  Layers,
  UserCheck,
  FileText,
  BarChart3,
  SlidersHorizontal
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
  const [selectedNodeKey, setSelectedNodeKey] = useState<ModuleKey | "automation">("pos");

  // Métricas calculadas
  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);
  const totalStockCount = products.reduce((acc, p) => acc + p.stock, 0);
  const totalSalesToday = sales.reduce((acc, s) => acc + s.total, 4892.5);
  const totalProfitToday = sales.reduce((acc, s) => acc + s.profit, 1420.0);
  const corporateCustomers = customers.filter((c) => c.taxId && c.taxId.length > 5).length;

  // Definición completa de cada módulo posible con sus datos dinámicos
  const moduleMetaRegistry: Record<string, {
    nodeNum: string;
    title: string;
    category: string;
    badge: string;
    icon: React.ReactNode;
    color: string;
    statMain: string;
    statSub: string;
    actionView: string;
    actionLabel: string;
    desc: string;
    events: string[];
  }> = {
    pos: {
      nodeNum: "01",
      title: "Ventas & POS Terminal",
      category: "CORE TRANSACCIONAL",
      badge: "CORE",
      icon: <Receipt className="w-5 h-5" />,
      color: "apple-blue",
      statMain: `C$ ${(totalSalesToday * (tenant.currency === "NIO" ? 1 : tenant.exchangeRate)).toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      statSub: `≈ $${(totalSalesToday / tenant.exchangeRate).toFixed(2)} USD • ${sales.length + 48} tickets emitidos`,
      actionView: "pos",
      actionLabel: "Abrir Terminal de Ventas",
      desc: "Terminal de venta rápida de mostrador, cálculo de márgenes y descuento automático de inventario.",
      events: [
        "[16:44:02] VENTA_POS: Factura emitida al contado",
        "[16:43:21] CAJA: Pago en efectivo recibido conforme",
        "[16:42:01] FISCAL_SYNC: Comprobante registrado",
      ],
    },
    inventory: {
      nodeNum: "02",
      title: "Inventario & Kardex",
      category: "LOGÍSTICA & BODEGA",
      badge: lowStockProducts.length > 0 ? `${lowStockProducts.length} bajo` : "Óptimo",
      icon: <Package className="w-5 h-5" />,
      color: "apple-purple",
      statMain: `${products.length} SKUs`,
      statSub: `${totalStockCount} unidades clasificadas en bodega`,
      actionView: "inventory",
      actionLabel: "Gestionar Bodega & Kardex",
      desc: "Control por medidas de unidad (varas, metros, sacos), lotes con vencimiento y reservas mínimas.",
      events: [
        `[16:43:12] ALERTA_STOCK: ${lowStockProducts.length} artículos por debajo del stock mínimo`,
        "[16:41:55] KARDEX: Salida sincronizada con mostrador",
        "[16:40:00] BODEGA_A1: 99.8% congruencia física",
      ],
    },
    customers: {
      nodeNum: "03",
      title: "Directorio de Clientes",
      category: "GESTIÓN COMERCIAL",
      badge: "Activo",
      icon: <Users className="w-5 h-5" />,
      color: "apple-green",
      statMain: `${customers.length} Clientes`,
      statSub: `${corporateCustomers} con RUC registrado para facturación`,
      actionView: "customers",
      actionLabel: "Ver Directorio de Clientes",
      desc: "Cartera de clientes, teléfonos, datos fiscales para facturas y volumen acumulado de compras.",
      events: [
        `[16:44:10] DIRECTORY: ${customers.length} expedientes sincronizados`,
        "[16:43:50] HISTORIAL: Compra asociada a cliente corporativo",
        "[16:42:15] PERFIL: Datos de entrega y RUC verificados",
      ],
    },
    billing: {
      nodeNum: "04",
      title: "Finanzas & Reportes",
      category: "TESORERÍA & CAJA",
      badge: "Conciliado",
      icon: <FileText className="w-5 h-5" />,
      color: "apple-green",
      statMain: `$148,920.00 USD`,
      statSub: "Valoración líquida y flujo de ingresos",
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
      icon: <Wallet className="w-5 h-5" />,
      color: "apple-orange",
      statMain: "C$ 14,250.00",
      statSub: "Compras a proveedores del período",
      actionView: "inventory",
      actionLabel: "Ver Compras y Egresos",
      desc: "Registro de facturas de compras a proveedores, reabastecimiento y caja chica operativa.",
      events: [
        "[15:20:10] ORDEN_COMPRA: Cemento Holcim 50 sacos",
        "[14:10:00] GASTO_LOCAL: Pago de flete verificado",
        "[12:00:00] PROVEEDOR: Factura ingresada al sistema",
      ],
    },
    hr: {
      nodeNum: "06",
      title: "RRHH & Nómina",
      category: "TALENTO & ASISTENCIA",
      badge: "Al Día",
      icon: <UserCheck className="w-5 h-5" />,
      color: "apple-teal",
      statMain: "8 Empleados",
      statSub: "Asistencia y cálculo salarial de turno",
      actionView: "users",
      actionLabel: "Gestionar Personal & Roles",
      desc: "Control de asistencia de cajeros y bodegueros, turnos laborales y permisos de sistema.",
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
      icon: <Layers className="w-5 h-5" />,
      color: "apple-pink",
      statMain: "24 Fórmulas",
      statSub: "Descuento automático de insumos",
      actionView: "inventory",
      actionLabel: "Ver Recetas e Insumos",
      desc: "Descuenta automáticamente materia prima e insumos al registrar la venta del producto terminado.",
      events: [
        "[16:30:00] RECETA: Descuento de ingredientes en bodega",
        "[15:45:00] PRODUCCIÓN: Lote preparado con éxito",
        "[14:00:00] STOCK: Insumos verificados",
      ],
    },
    reports: {
      nodeNum: "08",
      title: "Inteligencia & Reportes",
      category: "MÉTRICAS GERENCIALES",
      badge: "Auditoría",
      icon: <BarChart3 className="w-5 h-5" />,
      color: "apple-blue",
      statMain: "+29.4% Margen",
      statSub: "Rendimiento neto sobre costos",
      actionView: "dashboard",
      actionLabel: "Abrir Dashboard Gerencial",
      desc: "Gráficos de rotación, proyección de ventas e inteligencia de negocio para el propietario.",
      events: [
        "[16:40:00] KPI: Ticket promedio en alza",
        "[15:00:00] AUDIT: Margen bruto consolidado",
        "[12:30:00] REPORTE: Cierre de jornada proyectado",
      ],
    },
  };

  // Filtrar los módulos que REALMENTE están activos para este negocio
  const activeKeys = tenant.activeModules.filter((k) => moduleMetaRegistry[k]);

  // Si por alguna razón no hubiera módulos, asegurarse de mostrar al menos POS e Inventario
  const displayKeys = activeKeys.length > 0 ? activeKeys : (["pos", "inventory"] as ModuleKey[]);

  const activeInspectorMeta = selectedNodeKey ? moduleMetaRegistry[selectedNodeKey] : null;

  return (
    <div className="relative w-full min-h-[760px] rounded-3xl bg-neutral-50/70 dark:bg-[#121214]/60 border border-neutral-200/80 dark:border-neutral-800/80 overflow-hidden select-none p-4 md:p-6 transition-colors">
      
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
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md border border-neutral-200 dark:border-neutral-700/80 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-apple-green animate-pulse" />
          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            Topología: Constelación {tenant.name}
          </span>
          <span className="text-neutral-300 dark:text-neutral-600">/</span>
          <span className="text-xs text-neutral-500 font-mono">
            {displayKeys.length} Módulos Activos ({tenant.businessVertical.toUpperCase()})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSettingsWizard}
            className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-xs font-medium transition-all flex items-center gap-1.5 border border-neutral-200 dark:border-neutral-700"
          >
            <SlidersHorizontal className="w-3 h-3 text-apple-blue" />
            <span>Editar Módulos del Rubro</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("pos")}
            className="px-3.5 py-1 rounded-full bg-apple-blue text-white text-xs font-semibold hover:bg-apple-blue-hover transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span>Ir al POS</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Dynamic Spatial Grid de Nodos según los módulos seleccionados por el rubro */}
      <div className="relative z-10 max-w-6xl mx-auto py-4">
        
        <div className="text-center mb-6">
          <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-widest block">
            Arquitectura Modular Dinámica
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Panel Central del Propietario
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Cada cuadro representa un módulo activo para tu negocio ({tenant.businessVertical}). Haz clic en cualquiera para inspeccionar o acceder.
          </p>
        </div>

        {/* Grid adaptable de módulos seleccionados */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayKeys.map((key, index) => {
            const meta = moduleMetaRegistry[key];
            if (!meta) return null;
            const isSelected = selectedNodeKey === key;
            const isCore = key === "pos";

            return (
              <div
                key={key}
                onClick={() => setSelectedNodeKey(key)}
                className={`p-5 rounded-3xl cursor-pointer transition-all duration-300 flex flex-col justify-between relative group ${
                  isSelected
                    ? "bg-white dark:bg-neutral-800/95 ring-2 ring-apple-blue shadow-2xl scale-[1.02]"
                    : isCore
                    ? "bg-white/95 dark:bg-neutral-800/90 hover:bg-white dark:hover:bg-neutral-800 border-2 border-apple-blue/30 shadow-apple hover:shadow-apple-hover"
                    : "bg-white/80 dark:bg-neutral-800/70 hover:bg-white dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-apple hover:shadow-apple-hover hover:-translate-y-0.5"
                }`}
              >
                {/* Port bioluminiscente superior */}
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-neutral-100 dark:border-neutral-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                      isCore 
                        ? "bg-apple-blue text-white shadow-md shadow-apple-blue/30" 
                        : "bg-neutral-100 dark:bg-neutral-700 text-apple-blue"
                    }`}>
                      {meta.icon}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-neutral-400 block font-semibold">
                        NODO {String(index + 1).padStart(2, "0")} • {meta.category}
                      </span>
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-white tracking-tight">
                        {meta.title}
                      </h3>
                    </div>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isCore
                      ? "bg-apple-blue/10 text-apple-blue"
                      : meta.badge.includes("bajo")
                      ? "bg-apple-red/10 text-apple-red"
                      : "bg-apple-green/10 text-apple-green"
                  }`}>
                    {meta.badge}
                  </span>
                </div>

                {/* Contenido principal del cuadro */}
                <div className="py-3">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                    Métrica en Tiempo Real
                  </span>
                  <div className="text-2xl font-extrabold text-neutral-900 dark:text-white font-mono tracking-tight mt-0.5">
                    {meta.statMain}
                  </div>
                  <span className="text-xs text-neutral-500 font-mono mt-1 block">
                    {meta.statSub}
                  </span>
                  <p className="text-[11px] text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                    {meta.desc}
                  </p>
                </div>

                {/* Footer del cuadro con acción directa */}
                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs">
                  <span className="text-neutral-400 text-[11px] flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-apple-green" />
                    Enlace Activo
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate(meta.actionView);
                    }}
                    className="text-apple-blue hover:text-apple-blue-hover font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Entrar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Slide-over Inspector para el módulo seleccionado */}
      {activeInspectorMeta && (
        <aside className="fixed top-0 right-0 h-full w-80 sm:w-96 bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl p-6 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl z-50 flex flex-col justify-between animate-fadeIn">
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80 dark:border-neutral-800">
              <span className="text-[10px] font-mono font-bold text-apple-blue uppercase tracking-wider">
                {activeInspectorMeta.category}
              </span>
              <button
                type="button"
                onClick={() => setSelectedNodeKey("pos")}
                className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 flex items-center justify-center text-neutral-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                {activeInspectorMeta.title}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                {activeInspectorMeta.desc}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-100/80 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60">
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                Estado Actual
              </span>
              <div className="text-xl font-extrabold text-neutral-900 dark:text-white mt-0.5 font-mono">
                {activeInspectorMeta.statMain}
              </div>
              <span className="text-xs text-neutral-500">{activeInspectorMeta.statSub}</span>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                Telemetría & Eventos de Módulo
              </span>
              <div className="p-3 rounded-2xl bg-neutral-100/90 dark:bg-neutral-900/90 font-mono text-[11px] text-neutral-700 dark:text-neutral-300 space-y-1.5 border border-neutral-200/80 dark:border-neutral-800">
                {activeInspectorMeta.events.map((ev: string, idx: number) => (
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
              onClick={() => onNavigate(activeInspectorMeta.actionView)}
              className="w-full py-2.5 px-4 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-semibold shadow-md shadow-apple-blue/25 transition-all flex items-center justify-center gap-2"
            >
              <span>{activeInspectorMeta.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>
      )}
    </div>
  );
};
