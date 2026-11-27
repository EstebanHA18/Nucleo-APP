"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Terminal, 
  Search, 
  Sun, 
  Moon, 
  ChevronDown,
  Users,
  LogOut,
  Database,
  ShieldCheck
} from "lucide-react";
import { TenantSettings, AppUser } from "@/types";
import { NucleoIcon } from "./NucleoIcon";
import { getDefaultViewForUser } from "@/lib/offlineStore";
import { isSupabaseConfigured } from "@/lib/supabase";

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
  onLogout?: () => void;
  unreadGodModeTickets?: number;
  isImpersonating?: boolean;
  onReturnToOwner?: () => void;
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
  onLogout,
  unreadGodModeTickets = 0,
  isImpersonating = false,
  onReturnToOwner,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isSuperAdmin = currentUser.role === "superadmin";
  const isOwner = currentUser.role === "owner" || isSuperAdmin;
  const supabaseReady = isSupabaseConfigured();

  // Usuarios visibles para cambio rápido (SOLO para Dueño o SuperAdmin, jamás expuestos a empleados)
  const switchableUsers = isSuperAdmin
    ? users
    : isOwner
    ? users.filter((u) => u.role !== "superadmin" && (!u.tenantId || u.tenantId === tenant.id))
    : [];

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
            onClick={() => setActiveView(getDefaultViewForUser(currentUser, tenant))}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <NucleoIcon size={28} showGlow={true} />
            <span className="font-extrabold text-sm tracking-tight text-neutral-900 dark:text-white">
              NÚCLEO
            </span>
          </div>

          <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800" />

          {/* Business / Tenant Pill (Solo el propietario puede abrir el asistente de configuración) */}
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
              <span>
                {isOwner
                  ? "Buscar producto, cliente o módulo..."
                  : "Buscar en tu panel autorizado..."}
              </span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-700 text-neutral-500 dark:text-neutral-300 text-[10px] font-mono border border-neutral-200 dark:border-neutral-600 shadow-2xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Cloud Status Pill, Owner Tools, Dark Mode, Profile */}
        <div className="flex items-center gap-2">
          
          {/* Status Pill (Online + Supabase status) */}
          <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
            isOnline 
              ? "bg-apple-green/10 text-apple-green dark:bg-apple-green/20" 
              : "bg-apple-orange/10 text-apple-orange dark:bg-apple-orange/20"
          }`} title={supabaseReady ? "Sincronización Multi-Tenant con Supabase Activa" : "Modo Local Offline-First Activo"}>
            {supabaseReady ? (
              <Database className="w-3 h-3 text-apple-green" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-apple-green" />
            )}
            <span>{isOnline ? (supabaseReady ? "Supabase Cloud" : "En Línea") : "Offline"}</span>
          </div>

          {/* Si es Dueño: Botón directo a 'Gestión de Usuarios' */}
          {isOwner && (
            <button
              type="button"
              onClick={() => setActiveView("users")}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
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

          {/* SuperAdmin Terminal (EXCLUSIVO para SuperAdmin // God Mode) */}
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setActiveView("terminal")}
              className={`px-2.5 py-1 rounded-full text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeView === "terminal"
                  ? "bg-neutral-900 text-apple-green dark:bg-black dark:text-apple-green ring-1 ring-apple-green/50"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
              title="SuperAdmin Terminal (God Mode)"
            >
              <Terminal className="w-3.5 h-3.5 text-apple-green" />
              <span className="hidden sm:inline font-bold">God Mode</span>
              {unreadGodModeTickets > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[9px] font-bold animate-pulse">
                  {unreadGodModeTickets}
                </span>
              )}
            </button>
          )}

          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
          >
            {darkMode ? <Sun className="w-4 h-4 text-apple-yellow" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Account / Role Menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                currentUser.role === "superadmin"
                  ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30"
                  : currentUser.role === "owner"
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
                <div className="p-2.5 border-b border-neutral-100 dark:border-neutral-800 space-y-0.5">
                  <span className="text-[10px] text-neutral-400 font-mono block uppercase">Sesión Activa</span>
                  <div className="font-bold text-xs text-neutral-900 dark:text-white truncate">
                    {currentUser.fullName}
                  </div>
                  <span className="text-[10px] text-apple-blue font-semibold block">
                    {currentUser.roleLabel}
                  </span>
                  {!isOwner && (
                    <div className="pt-1 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Panel de Empleado Blindado</span>
                    </div>
                  )}
                </div>

                {/* Solo el propietario o superadmin puede previsualizar o cambiar entre cuentas de empleados sin cerrar sesión */}
                {isOwner && switchableUsers.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                      Simular Vista de Empleado:
                    </div>

                    {switchableUsers.map((u) => {
                      const isCur = u.id === currentUser.id;
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            onSwitchUser(u);
                            setShowUserMenu(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                            isCur
                              ? "bg-neutral-100 dark:bg-neutral-800 text-apple-blue font-bold"
                              : "hover:bg-neutral-50 dark:hover:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              u.role === "superadmin" ? "bg-purple-500" : u.role === "owner" ? "bg-apple-green" : u.role === "cashier" ? "bg-apple-blue" : "bg-apple-purple"
                            }`} />
                            <div>
                              <span className="block truncate max-w-[160px] leading-tight">{u.fullName}</span>
                              <span className="text-[9px] text-neutral-400 font-mono">{u.roleLabel}</span>
                            </div>
                          </div>
                          {isCur && (
                            <span className="text-[9px] font-mono text-apple-blue font-bold">Activo</span>
                          )}
                        </button>
                      );
                    })}
                  </>
                )}

                <div className="pt-1 border-t border-neutral-100 dark:border-neutral-800 space-y-0.5">
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveView("users");
                        setShowUserMenu(false);
                      }}
                      className="w-full py-1.5 px-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left text-xs font-semibold text-apple-blue flex items-center gap-1.5 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Administrar Usuarios & Roles...</span>
                    </button>
                  )}

                  {isImpersonating && onReturnToOwner && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onReturnToOwner();
                      }}
                      className="w-full py-1.5 px-2 rounded-xl hover:bg-apple-green/10 text-left text-xs font-semibold text-apple-green flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Salir de Simulación (Volver a Dueño)</span>
                    </button>
                  )}

                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full py-1.5 px-2 rounded-xl hover:bg-red-500/10 text-left text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Cerrar Sesión / Cambiar Usuario</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Botón directo de Logout rápido */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center text-neutral-500 dark:text-neutral-400 transition-colors cursor-pointer"
              title="Cerrar Sesión y volver al portal de inicio"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
