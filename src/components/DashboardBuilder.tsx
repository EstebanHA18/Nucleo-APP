"use client";

import React, { useState } from "react";
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
  DollarSign,
  Calendar,
  Sparkles
} from "lucide-react";
import { TenantSettings, Product, Customer, Sale } from "@/types";

interface DashboardBuilderProps {
  tenant: TenantSettings;
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  onNavigate: (view: string) => void;
}

interface WidgetItem {
  id: string;
  title: string;
  visible: boolean;
  type: string;
}

export const DashboardBuilder: React.FC<DashboardBuilderProps> = ({
  tenant,
  products,
  customers,
  sales,
  onNavigate,
}) => {
  const [widgets, setWidgets] = useState<WidgetItem[]>([
    { id: "w-sales", title: "Ventas del Turno (Hoy)", visible: true, type: "sales" },
    { id: "w-profit", title: "Ganancia & Margen Neto", visible: true, type: "profit" },
    { id: "w-stock", title: "Alertas de Stock Bajo", visible: true, type: "stock" },
    { id: "w-fiados", title: "Cuentas por Cobrar (Fiados)", visible: true, type: "fiados" },
    { id: "w-fastpos", title: "Acceso Rápido a Caja POS", visible: true, type: "fastpos" },
    { id: "w-top", title: "Productos de Mayor Demanda", visible: true, type: "top" },
  ]);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Calcs
  const lowStock = products.filter((p) => p.stock <= p.minStock);
  const totalDebt = customers.reduce((acc, c) => acc + c.currentBalance, 0);
  const totalSalesToday = sales.reduce((acc, s) => acc + s.total, 4892.5);
  const totalProfitToday = sales.reduce((acc, s) => acc + s.profit, 1420.0);

  const toggleVisibility = (id: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w))
    );
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
    setWidgets(updated);
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
            Dashboard Builder (Arrastra widgets para reorganizar estilo Notion)
          </h2>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {widgets.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => toggleVisibility(w.id)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all flex items-center gap-1 ${
                w.visible
                  ? "bg-apple-blue/10 text-apple-blue dark:bg-apple-blue/20"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
              }`}
            >
              {w.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>{w.title.split(" ")[0]}</span>
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
                className="text-neutral-400 hover:text-neutral-600 text-xs"
                title="Ocultar widget"
              >
                <EyeOff className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Widget Body Content */}
            <div className="py-4">
              {w.type === "sales" && (
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-semibold">Ingreso Monetario</span>
                  <div className="text-3xl font-extrabold text-apple-blue font-mono mt-0.5">
                    C$ {(totalSalesToday * (tenant.currency === "NIO" ? 1 : tenant.exchangeRate)).toLocaleString("es-NI", { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-xs text-neutral-500 font-mono mt-1 block">
                    ≈ ${(totalSalesToday / tenant.exchangeRate).toFixed(2)} USD • 48 tickets hoy
                  </span>
                </div>
              )}

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

              {w.type === "fiados" && (
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-semibold">Cuentas por Cobrar Activas</span>
                  <div className="text-3xl font-extrabold text-apple-red font-mono mt-0.5">
                    C$ {totalDebt.toLocaleString("es-NI", { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-xs text-neutral-500 mt-1 block">
                    {customers.filter((c) => c.currentBalance > 0).length} clientes con saldo pendiente
                  </span>
                </div>
              )}

              {w.type === "fastpos" && (
                <div className="text-center py-2 space-y-2">
                  <p className="text-xs text-neutral-500">
                    Caja Principal abierta con C$ 2,500.00 de fondo.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate("pos")}
                    className="w-full py-2.5 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-bold transition-all shadow-sm"
                  >
                    Nueva Venta en POS
                  </button>
                </div>
              )}

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
            </div>

            {/* Widget Footer */}
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
              <span>Actualización en tiempo real</span>
              <button
                type="button"
                onClick={() => onNavigate(w.type === "stock" ? "inventory" : w.type === "fiados" ? "receivables" : "pos")}
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
