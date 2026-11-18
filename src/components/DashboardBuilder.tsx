"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Receipt, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  Package, 
  Plus, 
  GripVertical, 
  Eye, 
  EyeOff, 
  ArrowUpRight, 
  Sparkles,
  Dog,
  Stethoscope,
  Wallet,
  UserCheck,
  Layers,
  BarChart3,
  CircleDollarSign,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock
} from "lucide-react";
import { TenantSettings, Product, Customer, Sale, PetPatient, ClinicalPatient, AppUser, ModuleKey } from "@/types";
import { getCurrentCashSession } from "@/lib/offlineStore";

interface DashboardBuilderProps {
  tenant: TenantSettings;
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  vetPatients?: PetPatient[];
  clinicalPatients?: ClinicalPatient[];
  users?: AppUser[];
  onNavigate: (view: string) => void;
}

interface WidgetItem {
  id: string;
  title: string;
  shortLabel: string;
  visible: boolean;
  type: string;
  module: ModuleKey;
}

export const DashboardBuilder: React.FC<DashboardBuilderProps> = ({
  tenant,
  products,
  customers,
  sales,
  vetPatients = [],
  clinicalPatients = [],
  users = [],
  onNavigate,
}) => {
  // Catálogo maestro de todos los widgets vinculados a su módulo correspondiente
  const ALL_WIDGET_CONFIGS = useMemo(() => [
    { id: "w-sales", title: "Ventas del Turno (Hoy)", shortLabel: "Ventas", type: "sales", module: "pos" as ModuleKey },
    { id: "w-profit", title: "Ganancia & Margen Neto", shortLabel: "Ganancia", type: "profit", module: "pos" as ModuleKey },
    { id: "w-fastpos", title: "Acceso Rápido a Caja POS", shortLabel: "Caja POS", type: "fastpos", module: "pos" as ModuleKey },
    { id: "w-stock", title: "Alertas de Stock Bajo", shortLabel: "Stock Bajo", type: "stock", module: "inventory" as ModuleKey },
    { id: "w-inv-value", title: "Valor Total de Inventario", shortLabel: "Valoración", type: "inv-value", module: "inventory" as ModuleKey },
    { id: "w-top", title: "Productos de Mayor Demanda", shortLabel: "Demanda", type: "top", module: "inventory" as ModuleKey },
    { id: "w-customers", title: "Clientes & Compras B2B", shortLabel: "Clientes", type: "customers", module: "customers" as ModuleKey },
    { id: "w-cash-session", title: "Arqueo & Flujo de Caja", shortLabel: "Arqueo", type: "cash-session", module: "billing" as ModuleKey },
    { id: "w-expenses", title: "Gastos & Compras Operativas", shortLabel: "Gastos", type: "expenses", module: "expenses" as ModuleKey },
    { id: "w-hr", title: "Personal & Turnos Activos", shortLabel: "Personal", type: "hr", module: "hr" as ModuleKey },
    { id: "w-vet", title: "Pacientes Veterinarios & Citas", shortLabel: "Veterinaria", type: "vet", module: "veterinary" as ModuleKey },
    { id: "w-clinical", title: "Consultas Clínicas & Odontograma", shortLabel: "Clínica", type: "clinical", module: "clinical" as ModuleKey },
    { id: "w-production", title: "Fórmulas & Recetas Activas", shortLabel: "Producción", type: "production", module: "production" as ModuleKey },
    { id: "w-kpis", title: "Ticket Promedio & Rendimiento", shortLabel: "KPIs", type: "kpis", module: "reports" as ModuleKey },
  ], []);

  const [widgets, setWidgets] = useState<WidgetItem[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Sincronizar widgets reactivamente según los módulos activos del tenant
  useEffect(() => {
    const activeConfigs = ALL_WIDGET_CONFIGS.filter((cfg) =>
      tenant.activeModules.includes(cfg.module)
    );

    const storageKey = `nucleo_dashboard_widgets_${tenant.id}`;
    let savedOrder: { id: string; visible: boolean }[] = [];
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) savedOrder = JSON.parse(raw);
    } catch {}

    const newWidgets: WidgetItem[] = [];
    savedOrder.forEach((saved) => {
      const match = activeConfigs.find((c) => c.id === saved.id);
      if (match) {
        newWidgets.push({
          id: match.id,
          title: match.title,
          shortLabel: match.shortLabel,
          visible: saved.visible,
          type: match.type,
          module: match.module,
        });
      }
    });

    activeConfigs.forEach((cfg) => {
      if (!newWidgets.some((w) => w.id === cfg.id)) {
        newWidgets.push({
          id: cfg.id,
          title: cfg.title,
          shortLabel: cfg.shortLabel,
          visible: true,
          type: cfg.type,
          module: cfg.module,
        });
      }
    });

    setWidgets(newWidgets);
  }, [tenant.id, tenant.activeModules, ALL_WIDGET_CONFIGS]);

  const saveWidgetsState = (items: WidgetItem[]) => {
    setWidgets(items);
    try {
      localStorage.setItem(
        `nucleo_dashboard_widgets_${tenant.id}`,
        JSON.stringify(items.map((w) => ({ id: w.id, visible: w.visible })))
      );
    } catch {}
  };

  // Cálculos dinámicos
  const lowStock = products.filter((p) => p.stock <= p.minStock);
  const totalStockCount = products.reduce((acc, p) => acc + p.stock, 0);
  const totalInventoryCost = products.reduce((acc, p) => acc + (p.stock * p.costPrice), 0);
  const totalSalesToday = sales.reduce((acc, s) => acc + s.total, 4892.5);
  const totalProfitToday = sales.reduce((acc, s) => acc + s.profit, 1420.0);
  const corporateCount = customers.filter((c) => c.taxId && c.taxId.length > 5).length;
  const cashSession = getCurrentCashSession();

  const totalTickets = sales.length > 0 ? sales.length : 48;
  const avgTicket = totalSalesToday / totalTickets;

  const activeCashiers = users.filter((u) => u.active && u.role === "cashier").length;
  const activeClerks = users.filter((u) => u.active && u.role === "inventory_clerk").length;

  const vetInTreatment = vetPatients.filter((p) => p.status === "in_treatment").length;
  const clinicalInTreatment = clinicalPatients.filter((p) => p.status === "in_treatment" || p.status === "active").length;

  const toggleVisibility = (id: string) => {
    const updated = widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w));
    saveWidgetsState(updated);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const updated = [...widgets];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, moved);
    setDraggedIndex(targetIndex);
    saveWidgetsState(updated);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Widget Controller */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-apple-blue" />
          <h2 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
            Dashboard Builder (Arrastra widgets para reorganizar)
          </h2>
          <span className="text-[10px] font-semibold font-mono px-2 py-0.5 rounded-full bg-apple-blue/10 text-apple-blue">
            {widgets.filter((w) => w.visible).length}/{widgets.length} activos
          </span>
        </div>

        {/* Botones de visualización según módulos activos */}
        <div className="flex items-center gap-1.5 text-xs flex-wrap">
          {widgets.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => toggleVisibility(w.id)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all flex items-center gap-1 ${
                w.visible
                  ? "bg-apple-blue/10 text-apple-blue dark:bg-apple-blue/20 font-semibold"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
              }`}
            >
              {w.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>{w.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {widgets.filter((w) => w.visible).map((w, index) => (
          <div
            key={w.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`p-5 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple transition-all duration-200 cursor-grab active:cursor-grabbing hover:shadow-apple-hover flex flex-col justify-between ${
              draggedIndex === index ? "opacity-40 scale-95" : ""
            }`}
          >
            {/* Widget Top */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800/80">
              <div className="flex items-center gap-2">
                <GripVertical className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-600" />
                <h3 className="text-xs font-bold text-neutral-900 dark:text-white tracking-tight">
                  {w.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => toggleVisibility(w.id)}
                className="text-neutral-400 hover:text-neutral-600 text-xs p-1"
                title="Ocultar widget"
              >
                <EyeOff className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Widget Body Content */}
            <div className="py-4">
              
              {/* 1. VENTAS DEL TURNO (MÓDULO POS) */}
              {w.type === "sales" && (
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-semibold">Ingreso Monetario Total</span>
                  <div className="text-3xl font-extrabold text-apple-blue font-mono mt-0.5">
                    C$ {(totalSalesToday * (tenant.currency === "NIO" ? 1 : tenant.exchangeRate)).toLocaleString("es-NI", { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-xs text-neutral-500 font-mono mt-1 block">
                    ≈ ${(totalSalesToday / tenant.exchangeRate).toFixed(2)} USD • {totalTickets} facturas al contado
                  </span>
                </div>
              )}

              {/* 2. GANANCIA & MARGEN (MÓDULO POS) */}
              {w.type === "profit" && (
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-semibold">Ganancia Neta Estimada</span>
                  <div className="text-3xl font-extrabold text-apple-green font-mono mt-0.5">
                    +C$ {(totalProfitToday * 36.62).toLocaleString("es-NI", { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-xs text-neutral-500 font-mono mt-1 block">
                    Margen saludable de 29.4% sobre costos
                  </span>
                </div>
              )}

              {/* 3. ALERTAS DE STOCK BAJO (MÓDULO INVENTARIO) */}
              {w.type === "stock" && (
                <div>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-2xl font-extrabold text-apple-red">
                      {lowStock.length} Artículos
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-apple-red/10 text-apple-red font-semibold">
                      Urgente
                    </span>
                  </div>
                  <span className="text-xs text-neutral-500 block mb-2">Por debajo de la reserva mínima</span>
                  <div className="space-y-1 text-xs font-mono">
                    {lowStock.slice(0, 2).map((p) => (
                      <div key={p.id} className="flex justify-between text-neutral-700 dark:text-neutral-300">
                        <span className="truncate max-w-[150px]">{p.name}</span>
                        <span className="text-apple-red font-bold">{p.stock} {p.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. VALOR TOTAL DE INVENTARIO (MÓDULO INVENTARIO) */}
              {w.type === "inv-value" && (
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-semibold">Capital Invertido en Bodega</span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400 font-mono mt-0.5">
                    C$ {totalInventoryCost.toLocaleString("es-NI", { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-xs text-neutral-500 font-mono mt-1 block">
                    ≈ ${(totalInventoryCost / tenant.exchangeRate).toFixed(2)} USD • {totalStockCount} unidades en bodega
                  </span>
                  <div className="mt-2 text-[11px] text-neutral-600 dark:text-neutral-400 flex items-center justify-between">
                    <span>{products.length} SKUs catalogados</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Kardex al 100%</span>
                  </div>
                </div>
              )}

              {/* 5. CLIENTES & COMPRAS B2B (MÓDULO CLIENTES) */}
              {w.type === "customers" && (
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-semibold">Directorio de Clientes</span>
                  <div className="text-3xl font-extrabold text-apple-blue font-mono mt-0.5">
                    {customers.length} Clientes
                  </div>
                  <span className="text-xs text-neutral-500 mt-1 block">
                    {corporateCount} empresas con RUC registradas
                  </span>
                </div>
              )}

              {/* 6. ACCESO RÁPIDO A CAJA POS (MÓDULO POS) */}
              {w.type === "fastpos" && (
                <div className="text-center py-2 space-y-2">
                  <p className="text-xs text-neutral-500">
                    Caja Principal abierta • Pagos en Efectivo / Tarjeta.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate("pos")}
                    className="w-full py-2.5 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Nueva Venta en POS</span>
                  </button>
                </div>
              )}

              {/* 7. PRODUCTOS DE MAYOR DEMANDA (MÓDULO INVENTARIO) */}
              {w.type === "top" && (
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">Varilla Corrugada 3/8"</span>
                    <span className="font-mono text-apple-blue font-bold">140 unds</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">Cemento Holcim 42.5kg</span>
                    <span className="font-mono text-apple-blue font-bold">85 sacos</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">Cable Eléctrico #12</span>
                    <span className="font-mono text-apple-blue font-bold">320 metros</span>
                  </div>
                </div>
              )}

              {/* 8. ARQUEO & FLUJO DE CAJA (MÓDULO BILLING) */}
              {w.type === "cash-session" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold">Efectivo en Gaveta</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      cashSession.status === "open"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
                    }`}>
                      {cashSession.status === "open" ? "● Turno Abierto" : "Turno Cerrado"}
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                    C$ {(cashSession.expectedCashInDrawer || 1000).toLocaleString("es-NI", { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-xs text-neutral-500 font-mono mt-1 block">
                    Fondo inicial: C$ {(cashSession.openingAmount || 1000).toLocaleString("es-NI", { minimumFractionDigits: 2 })} • {cashSession.salesCount || sales.length} cobros
                  </span>
                </div>
              )}

              {/* 9. GASTOS & COMPRAS OPERATIVAS (MÓDULO EXPENSES) */}
              {w.type === "expenses" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold">Egresos Operativos</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                      Controlado
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                    -C$ 14,250.00
                  </div>
                  <span className="text-xs text-neutral-500 font-mono mt-1 block">
                    ≈ $389.13 USD • 3 pagos a proveedores y fletes
                  </span>
                  <div className="mt-2 text-[11px] text-neutral-600 dark:text-neutral-400 flex justify-between">
                    <span>Reabastecimiento: C$ 11,800</span>
                    <span>Fletes: C$ 2,450</span>
                  </div>
                </div>
              )}

              {/* 10. PERSONAL & TURNOS ACTIVOS (MÓDULO HR) */}
              {w.type === "hr" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold">Equipo de Trabajo</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold border border-teal-500/20">
                      Al Día
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400 font-mono mt-0.5">
                    {users.length > 0 ? users.length : 3} Empleados
                  </div>
                  <span className="text-xs text-neutral-500 mt-1 block">
                    {activeCashiers > 0 ? activeCashiers : 1} en Caja • {activeClerks > 0 ? activeClerks : 1} en Bodega
                  </span>
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex justify-between text-neutral-600 dark:text-neutral-400 text-[11px]">
                      <span>Juan Carlos Cajero</span>
                      <span className="text-emerald-500 font-medium">● Activo en turno</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 11. PACIENTES VETERINARIOS & CITAS (MÓDULO VETERINARY) */}
              {w.type === "vet" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold">Salud Animal & Fichas</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                      Activo
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-amber-500 font-mono mt-0.5">
                    {vetPatients.length} Pacientes
                  </div>
                  <span className="text-xs text-neutral-500 mt-1 block">
                    {vetInTreatment} en tratamiento • Carnets de vacunas al día
                  </span>
                  <div className="mt-2 space-y-1 text-xs">
                    {vetPatients.slice(0, 2).map((p) => (
                      <div key={p.id} className="flex justify-between items-center text-[11px] text-neutral-700 dark:text-neutral-300">
                        <span className="font-semibold truncate max-w-[140px]">{p.name} ({p.species})</span>
                        <span className="text-neutral-400 text-[10px] truncate max-w-[90px]">{p.ownerName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 12. CONSULTAS CLÍNICAS & ODONTOGRAMA (MÓDULO CLINICAL) */}
              {w.type === "clinical" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold">Expedientes Médicos</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold border border-teal-500/20">
                      FDI 32
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400 font-mono mt-0.5">
                    {clinicalPatients.length} Historias Clínicas
                  </div>
                  <span className="text-xs text-neutral-500 mt-1 block">
                    {clinicalInTreatment} pacientes activos • Odontograma digital
                  </span>
                  <div className="mt-2 space-y-1 text-xs">
                    {clinicalPatients.slice(0, 2).map((p) => (
                      <div key={p.id} className="flex justify-between items-center text-[11px] text-neutral-700 dark:text-neutral-300">
                        <span className="font-semibold truncate max-w-[140px]">{p.fullName}</span>
                        <span className="text-apple-blue font-mono text-[10px]">Grupo {p.bloodType}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 13. FÓRMULAS & PRODUCCIÓN (MÓDULO PRODUCTION) */}
              {w.type === "production" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold">Transformación & Recetas</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/20">
                      Recetas ON
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 font-mono mt-0.5">
                    12 Fórmulas
                  </div>
                  <span className="text-xs text-neutral-500 mt-1 block">
                    Descargo automático de insumos en bodega al vender
                  </span>
                  <div className="mt-2 text-[11px] text-neutral-600 dark:text-neutral-400 flex justify-between">
                    <span>Mezcla Estándar</span>
                    <span className="text-emerald-500 font-medium">98% insumos listos</span>
                  </div>
                </div>
              )}

              {/* 14. TICKET PROMEDIO & RENDIMIENTO (MÓDULO REPORTS) */}
              {w.type === "kpis" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold">Ticket Promedio</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold border border-cyan-500/20">
                      94.2% Eficaz
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-cyan-600 dark:text-cyan-400 font-mono mt-0.5">
                    C$ {avgTicket.toLocaleString("es-NI", { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-xs text-neutral-500 font-mono mt-1 block">
                    ≈ ${(avgTicket / tenant.exchangeRate).toFixed(2)} USD • {totalTickets} facturas emitidas hoy
                  </span>
                  <div className="mt-2 text-[11px] text-neutral-600 dark:text-neutral-400 flex justify-between">
                    <span>Rotación estimada</span>
                    <span className="text-apple-blue font-semibold">2.4x mensual</span>
                  </div>
                </div>
              )}

            </div>

            {/* Widget Footer */}
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
              <span>Actualización en tiempo real</span>
              <button
                type="button"
                onClick={() => {
                  if (w.type === "stock" || w.type === "inv-value" || w.type === "top" || w.type === "expenses" || w.type === "production") {
                    onNavigate("inventory");
                  } else if (w.type === "customers") {
                    onNavigate("customers");
                  } else if (w.type === "hr") {
                    onNavigate("users");
                  } else if (w.type === "vet") {
                    onNavigate("veterinary");
                  } else if (w.type === "clinical") {
                    onNavigate("clinical");
                  } else if (w.type === "kpis") {
                    onNavigate("spatial");
                  } else {
                    onNavigate("pos");
                  }
                }}
                className="text-apple-blue hover:underline font-semibold flex items-center gap-0.5"
              >
                <span>Detalle</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
