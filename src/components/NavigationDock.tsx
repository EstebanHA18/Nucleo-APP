"use client";

import React from "react";
import { 
  Network, 
  LayoutDashboard, 
  Receipt, 
  Package, 
  Users, 
  Sliders, 
  Shield, 
  LogIn,
  Dog,
  Stethoscope
} from "lucide-react";
import { TenantSettings, AppUser } from "@/types";

interface NavigationDockProps {
  tenant: TenantSettings;
  activeView: string;
  setActiveView: (view: string) => void;
  currentUser: AppUser;
  onOpenSettingsWizard: () => void;
  onReturnToOwner: () => void;
}

export const NavigationDock: React.FC<NavigationDockProps> = ({
  tenant,
  activeView,
  setActiveView,
  currentUser,
  onOpenSettingsWizard,
  onReturnToOwner,
}) => {
  const isOwner = currentUser.role === "owner" || currentUser.role === "superadmin";

  // Verificar si el usuario actual tiene permiso para ver un módulo específico
  const canAccess = (moduleKey: string) => {
    if (isOwner) {
      return tenant.activeModules.includes(moduleKey as any);
    }
    return currentUser.allowedModules.includes(moduleKey as any);
  };

  return (
    <aside className="fixed bottom-5 inset-x-0 z-40 pointer-events-none flex justify-center px-4">
      <nav className="pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-full bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xl transition-all">
        
        {/* 1. Red Espacial (Solo si es dueño o tiene dashboard) */}
        {isOwner && (
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
        )}

        {/* 2. Drag & Drop Dashboard (Solo dueño o supervisor) */}
        {isOwner && (
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
        )}

        {/* 3. POS (Si tiene permiso) */}
        {canAccess("pos") && (
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
            <span>Ventas & POS</span>
          </button>
        )}

        {/* 4. Inventory (Si tiene permiso) */}
        {canAccess("inventory") && (
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
            <span>Inventario</span>
          </button>
        )}

        {/* 5. Clientes (Si tiene permiso y está activo) */}
        {canAccess("customers") && (
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

        {/* 6. Módulo Veterinario (Si tiene permiso y está activo) */}
        {canAccess("veterinary") && (
          <button
            type="button"
            onClick={() => setActiveView("veterinary")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeView === "veterinary"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/30"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            <Dog className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Veterinaria</span>
          </button>
        )}

        {/* 7. Módulo Clínico & Dental (Si tiene permiso y está activo) */}
        {canAccess("clinical") && (
          <button
            type="button"
            onClick={() => setActiveView("clinical")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeView === "clinical"
                ? "bg-teal-600 text-white shadow-md shadow-teal-600/30"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clínica & Dental</span>
          </button>
        )}

        {/* Si es Dueño: Botón directo a Usuarios */}
        {isOwner && (
          <button
            type="button"
            onClick={() => setActiveView("users")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeView === "users"
                ? "bg-apple-blue text-white shadow-md shadow-apple-blue/30"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Usuarios</span>
          </button>
        )}

        {/* Si NO es dueño (es cajero o bodeguero), mostrar botón para volver al Dueño */}
        {!isOwner && (
          <button
            type="button"
            onClick={onReturnToOwner}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-apple-green/10 text-apple-green hover:bg-apple-green hover:text-white transition-all ml-1 border border-apple-green/30"
            title="Volver a la sesión del Dueño"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Volver a Dueño</span>
          </button>
        )}

        {/* SuperAdmin God Mode Terminal */}
        {currentUser.role === "superadmin" && (
          <button
            type="button"
            onClick={() => setActiveView("terminal")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-semibold transition-all ${
              activeView === "terminal"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
            }`}
            title="SuperAdmin Terminal // God Mode"
          >
            <span>&gt;_</span>
            <span className="hidden sm:inline">God Mode</span>
          </button>
        )}

        {/* Ajustes y Configuración del Sistema (Solo dueño) */}
        {isOwner && (
          <>
            <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700 mx-0.5" />
            <button
              type="button"
              onClick={() => setActiveView("settings")}
              className={`p-2 rounded-full transition-all flex items-center justify-center ${
                activeView === "settings"
                  ? "bg-apple-blue text-white shadow-md shadow-apple-blue/30 scale-105"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
              title="Ajustes de Factura, Plan y Módulos"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </>
        )}

      </nav>
    </aside>
  );
};
