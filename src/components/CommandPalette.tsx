"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Receipt, 
  Package, 
  Users, 
  Network, 
  Terminal, 
  Sliders, 
  ArrowRight,
  Dog,
  Stethoscope
} from "lucide-react";
import { Product } from "@/types";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  products: Product[];
  onOpenSettingsWizard: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  products,
  onOpenSettingsWizard,
}) => {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        isOpen ? onClose() : undefined;
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    { id: "pos", name: "Abrir Terminal POS (Caja & Ventas)", icon: <Receipt className="w-4 h-4 text-apple-blue" />, category: "Navegación" },
    { id: "inventory", name: "Gestionar Inventario & Kardex", icon: <Package className="w-4 h-4 text-apple-purple" />, category: "Navegación" },
    { id: "customers", name: "Directorio de Clientes", icon: <Users className="w-4 h-4 text-apple-green" />, category: "Navegación" },
    { id: "veterinary", name: "Veterinaria & Pacientes (Expediente Clínico y Vacunas)", icon: <Dog className="w-4 h-4 text-amber-500" />, category: "Salud" },
    { id: "clinical", name: "Clínica & Odontología (Historias Clínicas y Odontograma)", icon: <Stethoscope className="w-4 h-4 text-teal-500" />, category: "Salud" },
    { id: "spatial", name: "Ver Red Espacial (Topología de Nodos)", icon: <Network className="w-4 h-4 text-apple-teal" />, category: "Navegación" },
    { id: "terminal", name: "Abrir SuperAdmin Terminal (God Mode)", icon: <Terminal className="w-4 h-4 text-apple-orange" />, category: "Administración" },
    { id: "wizard", name: "Reconfigurar Negocio / Business Builder", icon: <Sliders className="w-4 h-4 text-apple-pink" />, category: "Configuración" },
  ];

  const filteredActions = actions.filter((a) =>
    a.name.toLowerCase().includes(query.toLowerCase())
  );

  const matchedProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase()) ||
      (p.barcode && p.barcode.includes(query)) ||
      (p.hasBatches && p.batches?.some(b => b.batchNumber.toLowerCase().includes(query.toLowerCase()) || (b.barcode && b.barcode.includes(query))))
  ).slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/40 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-xl bg-white dark:bg-[#1e1e20] text-neutral-900 dark:text-neutral-100 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-neutral-200/80 dark:border-neutral-700/80">
          <Search className="w-5 h-5 text-neutral-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar acción, módulo o producto (ej. Varilla, POS, Clientes)..."
            className="w-full bg-transparent text-sm focus:outline-none placeholder-neutral-400"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px] font-mono text-neutral-500 border border-neutral-200 dark:border-neutral-700">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="p-2 max-h-80 overflow-y-auto space-y-1">
          <div className="px-2.5 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
            Acciones & Módulos
          </div>
          {filteredActions.map((act) => (
            <button
              key={act.id}
              type="button"
              onClick={() => {
                if (act.id === "wizard") {
                  onOpenSettingsWizard();
                } else {
                  onNavigate(act.id);
                }
                onClose();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left text-xs transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  {act.icon}
                </div>
                <span className="font-medium text-neutral-800 dark:text-neutral-200">
                  {act.name}
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}

          {/* Products matches */}
          {matchedProducts.length > 0 && (
            <>
              <div className="px-2.5 pt-3 pb-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                Productos en Catálogo
              </div>
              {matchedProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    onNavigate("pos");
                    onClose();
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer text-xs transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4 text-apple-blue" />
                    <div>
                      <span className="font-medium text-neutral-900 dark:text-white block">
                        {p.name}
                      </span>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        SKU: {p.sku} • Stock: {p.stock} {p.unit}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-apple-blue">
                    C$ {p.salePrice.toFixed(2)}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
