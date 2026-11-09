"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Terminal, 
  Search, 
  Wifi, 
  WifiOff, 
  Sun, 
  Moon, 
  User, 
  ChevronDown,
  UserCheck,
  Shield,
  KeyRound,
  LogIn,
  Users
} from "lucide-react";
import { TenantSettings, AppUser } from "@/types";

interface HeaderProps {
  tenant: TenantSettings;
  activeView: string;
  setActiveView: (view: string) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  isOnline: boolean;
  currentUser: AppUser;
  users: AppUser[];
  onSwitchUser: (user: AppUser) => void;
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
  currentUser,
  users,
  onSwitchUser,
  onOpenCommandPalette,
  onOpenSettingsWizard,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isOwner = currentUser.role === "owner";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-white/85 dark:bg-[#161617]/85 backdrop-blur-xl border-b border-neutral-200/80 dark:border-neutral-800/80 px-4 md:px-8 py-2.5 transition-colors">
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
            onClick={isOwner ? onOpenSettingsWizard : undefined}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              isOwner
                ? "bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800 dark:hover:bg-neutral-700/80 text-neutral-700 dark:text-neutral-300 cursor-pointer"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 cursor-default"
            }`}
            title={isOwner ? "Configuración de módulos del rubro" : tenant.name}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-apple-green animate-pulse" />
            <span className="truncate max-w-[170px]">{tenant.name}</span>
            {isOwner && <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />}
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

        {/* Right: User Switcher, Online Pill, SuperAdmin, Dark Mode */}
        <div className="flex items-center gap-2">
          
          {/* Status Pill */}
          <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
            isOnline 
              ? "bg-apple-green/10 text-apple-green dark:bg-apple-green/20" 
              : "bg-apple-orange/10 text-apple-orange dark:bg-apple-orange/20"
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-apple-green" />
            <span>{isOnline ? "En Línea" : "Offline"}</span>
          </div>

          {/* Si es Dueño: Botón directo a 'Gestión de Usuarios' */}
          {isOwner && (
            <button
              type="button"
              onClick={() => setActiveView("users")}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeView === "users"
                  ? "bg-apple-blue text-white shadow-sm"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              }`}
              title="Crear y administrar usuarios para caja e inventario"
            >
              <Users className="w-3.5 h-3.5 text-apple-blue" />
              <span className="hidden sm:inline">Usuarios & Roles</span>
            </button>
          )}

          {/* SuperAdmin Terminal (Solo para dueño) */}
          {isOwner && (
            <button
              type="button"
              onClick={() => setActiveView("terminal")}
              className={`px-2 py-1 rounded-full text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
                activeView === "terminal"
                  ? "bg-neutral-900 text-apple-green dark:bg-black dark:text-apple-green ring-1 ring-apple-green/50"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
              title="Terminal Master (God Mode)"
            >
              <Terminal className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300 transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4 text-apple-yellow" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Account / Role Switcher Menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                currentUser.role === "owner"
                  ? "bg-apple-green/10 text-apple-green border-apple-green/30"
                  : currentUser.role === "cashier"
                  ? "bg-apple-blue/10 text-apple-blue border-apple-blue/30"
                  : "bg-apple-purple/10 text-apple-purple border-apple-purple/30"
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white dark:bg-neutral-800 flex items-center justify-center text-[10px] font-bold shadow-2xs">
                {currentUser.fullName.charAt(0)}
              </div>
              <span className="hidden sm:inline font-mono text-[11px]">{currentUser.roleLabel.split(" ")[0]}</span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1c1c1e] text-neutral-900 dark:text-neutral-100 rounded-2xl p-2 shadow-2xl border border-neutral-200 dark:border-neutral-800 z-50 animate-fadeIn space-y-1">
                <div className="p-2 border-b border-neutral-100 dark:border-neutral-800">
                  <span className="text-[10px] text-neutral-400 font-mono block uppercase">Sesión Actual</span>
                  <div className="font-bold text-xs text-neutral-900 dark:text-white truncate">
                    {currentUser.fullName}
                  </div>
                  <span className="text-[10px] text-apple-blue font-semibold">
                    {currentUser.roleLabel}
                  </span>
                </div>

                <div className="px-2 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Cambiar de Usuario:
                </div>

                {users.map((u) => {
                  const isCur = u.id === currentUser.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        onSwitchUser(u);
                        setShowUserMenu(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                        isCur
                          ? "bg-neutral-100 dark:bg-neutral-800 text-apple-blue font-bold"
                          : "hover:bg-neutral-50 dark:hover:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          u.role === "owner" ? "bg-apple-green" : u.role === "cashier" ? "bg-apple-blue" : "bg-apple-purple"
                        }`} />
                        <div>
                          <span className="block truncate max-w-[140px] leading-tight">{u.fullName}</span>
                          <span className="text-[9px] text-neutral-400 font-mono">{u.roleLabel}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-400">
                        PIN: {u.pinCode}
                      </span>
                    </button>
                  );
                })}

                {isOwner && (
                  <div className="pt-1 border-t border-neutral-100 dark:border-neutral-800">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveView("users");
                        setShowUserMenu(false);
                      }}
                      className="w-full py-1.5 px-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left text-xs font-semibold text-apple-blue flex items-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Crear nuevo usuario...</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
