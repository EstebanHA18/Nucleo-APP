"use client";

import React from "react";
import { 
  Network, 
  LayoutDashboard, 
  Receipt, 
  Package, 
  Users, 
  Terminal, 
  Sliders
} from "lucide-react";
import { TenantSettings } from "@/types";

interface NavigationDockProps {
  tenant: TenantSettings;
  activeView: string;
  setActiveView: (view: string) => void;
  onOpenSettingsWizard: () => void;
}

export const NavigationDock: React.FC<NavigationDockProps> = ({
  tenant,
  activeView,
  setActiveView,
  onOpenSettingsWizard,
}) => {
  const isModuleActive = (key: string) => tenant.activeModules.includes(key as any);

  return (
    <aside className="fixed bottom-5 inset-x-0 z-40 pointer-events-none flex justify-center px-4">
      <nav className="pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-full bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xl transition-all">
        
        {/* 1. Spatial Network Canvas */}
        <button
          type="button"
          onClick={() => setActiveView("spatial")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
            activeView === "spatial"
              ? "bg-apple-blue text-white shadow-md shadow-apple-blue/30"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Red Espacial</span>
        </button>

        {/* 2. Drag & Drop Dashboard */}
        <button
          type="button"
          onClick={() => setActiveView("dashboard")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
            activeView === "dashboard"
              ? "bg-apple-blue text-white shadow-md shadow-apple-blue/30"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Dashboard</span>
        </button>

        {/* 3. POS */}
        {isModuleActive("pos") && (
          <button
            type="button"
            onClick={() => setActiveView("pos")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeView === "pos"
                ? "bg-apple-blue text-white shadow-md shadow-apple-blue/30"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ventas & POS</span>
          </button>
        )}

        {/* 4. Inventory */}
        {isModuleActive("inventory") && (
          <button
            type="button"
            onClick={() => setActiveView("inventory")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeView === "inventory"
                ? "bg-apple-blue text-white shadow-md shadow-apple-blue/30"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Inventario</span>
          </button>
        )}

        {/* 5. Customers Directory (Sin fiados) */}
        {isModuleActive("customers") && (
          <button
            type="button"
            onClick={() => setActiveView("customers")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeView === "customers"
                ? "bg-apple-blue text-white shadow-md shadow-apple-blue/30"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clientes</span>
          </button>
        )}

        <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700 mx-0.5" />

        {/* Wizard Quick Trigger */}
        <button
          type="button"
          onClick={onOpenSettingsWizard}
          className="p-1.5 rounded-full text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Reconfigurar Negocio (Wizard)"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>

      </nav>
    </aside>
  );
};
