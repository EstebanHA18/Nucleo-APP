"use client";

import React from "react";
import { 
  Terminal, 
  Search, 
  Wifi, 
  WifiOff, 
  Sun, 
  Moon, 
  User, 
  SlidersHorizontal,
  ChevronDown
} from "lucide-react";
import { TenantSettings } from "@/types";

interface HeaderProps {
  tenant: TenantSettings;
  activeView: string;
  setActiveView: (view: string) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  isOnline: boolean;
  onOpenCommandPalette: () => void;
  onOpenSettingsWizard: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  tenant,
  activeView,
  setActiveView,
  darkMode,
  setDarkMode,
  isOnline,
  onOpenCommandPalette,
  onOpenSettingsWizard,
}) => {
  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-white/80 dark:bg-[#161617]/80 backdrop-blur-xl border-b border-neutral-200/80 dark:border-neutral-800/80 px-4 md:px-8 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Brand & Tenant Selector */}
        <div className="flex items-center gap-3">
          <div 
            onClick={() => setActiveView("spatial")}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-apple-blue flex items-center justify-center text-white shadow-sm font-bold text-xs">
              N
            </div>
            <span className="font-bold text-sm tracking-tight text-neutral-900 dark:text-white">
              NÚCLEO
            </span>
          </div>

          <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800" />

          {/* Business / Tenant Pill */}
          <button 
            type="button"
            onClick={onOpenSettingsWizard}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800 dark:hover:bg-neutral-700/80 text-neutral-700 dark:text-neutral-300 text-xs font-medium transition-all"
            title="Configuración de plantilla y módulos"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-apple-green animate-pulse" />
            <span className="truncate max-w-[170px]">{tenant.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          </button>
        </div>

        {/* Center: Command Bar (⌘K Spotlight) */}
        <div className="flex-1 max-w-md hidden md:block">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-full bg-neutral-100/90 dark:bg-neutral-800/90 hover:bg-neutral-200/70 dark:hover:bg-neutral-700/70 text-neutral-400 text-xs transition-all border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-neutral-400" />
              <span>Buscar producto, cliente o módulo...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-700 text-neutral-500 dark:text-neutral-300 text-[10px] font-mono border border-neutral-200 dark:border-neutral-600 shadow-2xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Connectivity, SuperAdmin, Dark Mode & Profile */}
        <div className="flex items-center gap-2">
          {/* Offline/Online Status Pill */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
            isOnline 
              ? "bg-apple-green/10 text-apple-green dark:bg-apple-green/20" 
              : "bg-apple-orange/10 text-apple-orange dark:bg-apple-orange/20"
          }`}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span className="hidden sm:inline">{isOnline ? "En Línea" : "Offline (Local)"}</span>
          </div>

          {/* SuperAdmin Terminal Pill */}
          <button
            type="button"
            onClick={() => setActiveView("terminal")}
            className={`px-2.5 py-1 rounded-full text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
              activeView === "terminal"
                ? "bg-neutral-900 text-apple-green dark:bg-black dark:text-apple-green ring-1 ring-apple-green/50"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
            title="Panel Maestro de Administración (God Mode)"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin Terminal</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300 transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4 text-apple-yellow" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Profile Avatar */}
          <div className="w-8 h-8 rounded-full bg-apple-blue/10 dark:bg-apple-blue/20 text-apple-blue font-bold text-xs flex items-center justify-center border border-apple-blue/30 cursor-pointer">
            <User className="w-4 h-4" />
          </div>
        </div>

      </div>
    </header>
  );
};
