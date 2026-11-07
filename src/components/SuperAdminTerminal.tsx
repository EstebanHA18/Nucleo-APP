"use client";

import React, { useState } from "react";
import { 
  Terminal as TerminalIcon, 
  ShieldAlert, 
  DollarSign, 
  Server, 
  Check, 
  ToggleLeft, 
  ToggleRight, 
  Play, 
  Database,
  Users,
  Sliders
} from "lucide-react";
import { TenantSettings, ModuleKey } from "@/types";
import { AVAILABLE_MODULES } from "@/lib/constants";

interface SuperAdminTerminalProps {
  currentTenant: TenantSettings;
  onUpdateTenantSettings: (updated: TenantSettings) => void;
}

export const SuperAdminTerminal: React.FC<SuperAdminTerminalProps> = ({
  currentTenant,
  onUpdateTenantSettings,
}) => {
  const [commandInput, setCommandInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([
    "Núcleo Master System OS [Version 3.4.1-LTS]",
    "Authenticated as SUPERADMIN (Master God Mode) // Root Session Established.",
    "Type 'help' for executive commands or use the interactive control matrix below.",
  ]);

  const [tenants, setTenants] = useState<any[]>([
    {
      id: currentTenant.id,
      name: currentTenant.name,
      vertical: currentTenant.businessVertical,
      plan: currentTenant.planName,
      monthlyPrice: currentTenant.monthlyPlanPrice,
      status: "ACTIVE",
      activeModules: currentTenant.activeModules,
      usersCount: 6,
    },
    {
      id: "tenant-demo-2",
      name: "Agroservicio San Isidro",
      vertical: "agroservicio",
      plan: "Enterprise",
      monthlyPrice: 59.0,
      status: "ACTIVE",
      activeModules: ["pos", "inventory", "billing", "receivables", "expenses"],
      usersCount: 14,
    },
    {
      id: "tenant-demo-3",
      name: "Farmacia La Providencia",
      vertical: "farmacia",
      plan: "Starter",
      monthlyPrice: 19.0,
      status: "TRIAL",
      activeModules: ["pos", "inventory", "billing"],
      usersCount: 3,
    },
  ]);

  // Command executor
  const handleExecuteCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = commandInput.trim();
    if (!cmd) return;

    const newHistory = [...commandHistory, `nucleo@root:~$ ${cmd}`];

    if (cmd === "clear") {
      setCommandHistory([]);
      setCommandInput("");
      return;
    }

    if (cmd === "help") {
      newHistory.push(
        "AVAILABLE GOD-MODE COMMANDS:",
        "  list-tenants             - List all registered business accounts",
        "  set-price <id> <amount>  - Override monthly subscription rate",
        "  enable-module <mod_key>  - Force push a module to the current tenant",
        "  status                   - Check database, RLS and offline sync pipeline",
        "  clear                    - Clear terminal console"
      );
    } else if (cmd === "list-tenants") {
      tenants.forEach((t) => {
        newHistory.push(`[TENANT] ${t.name} | Plan: ${t.plan} | Rate: $${t.monthlyPrice}/mo | Status: ${t.status}`);
      });
    } else if (cmd.startsWith("set-price")) {
      const parts = cmd.split(" ");
      const price = parseFloat(parts[1] || parts[2]);
      if (!isNaN(price)) {
        const updated = { ...currentTenant, monthlyPlanPrice: price };
        onUpdateTenantSettings(updated);
        newHistory.push(`SUCCESS: Monthly price for '${currentTenant.name}' set to $${price.toFixed(2)} USD.`);
      } else {
        newHistory.push("ERROR: Syntax: set-price <amount>");
      }
    } else if (cmd === "status") {
      newHistory.push(
        "SYSTEM METRICS:",
        "  Supabase PostgreSQL: CONNECTED (RLS Enforced)",
        "  Offline Sync Buffer: 0 pending transactions",
        "  Global MRR: $107.00 USD / month",
        "  Worker Uptime: 99.98%"
      );
    } else {
      newHistory.push(`command not recognized: '${cmd}'. Type 'help' for guidance.`);
    }

    setCommandHistory(newHistory);
    setCommandInput("");
  };

  const handleUpdatePrice = (tenantId: string, newPrice: number) => {
    const updated = tenants.map((t) => {
      if (t.id === tenantId) {
        return { ...t, monthlyPrice: newPrice };
      }
      return t;
    });
    setTenants(updated);
    if (tenantId === currentTenant.id) {
      onUpdateTenantSettings({ ...currentTenant, monthlyPlanPrice: newPrice });
    }
  };

  const handleToggleModuleForTenant = (moduleKey: ModuleKey) => {
    const isPresent = currentTenant.activeModules.includes(moduleKey);
    const updatedModules = isPresent
      ? currentTenant.activeModules.filter((m) => m !== moduleKey)
      : [...currentTenant.activeModules, moduleKey];

    const updatedTenant = { ...currentTenant, activeModules: updatedModules };
    onUpdateTenantSettings(updatedTenant);
  };

  const totalMRR = tenants.reduce((acc, t) => acc + (t.status === "ACTIVE" ? t.monthlyPrice : 0), 0);

  return (
    <div className="space-y-6">
      
      {/* SuperAdmin Master Banner */}
      <div className="p-5 rounded-3xl bg-neutral-900 text-white border border-neutral-800 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-apple-green/20 text-apple-green flex items-center justify-center font-mono font-bold text-sm">
            #
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight">SuperAdmin Terminal // God Mode</h2>
              <span className="px-2 py-0.5 rounded-full bg-apple-green/20 text-apple-green text-[10px] font-mono font-semibold">
                ROOT PRIVILEGES
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Control central de planes, mensualidades, tenants y switches globales de módulos.
            </p>
          </div>
        </div>

        {/* Global SaaS Stats */}
        <div className="flex items-center gap-6 font-mono text-xs">
          <div>
            <span className="text-neutral-500 block text-[10px]">TOTAL MRR (SAAS)</span>
            <span className="text-apple-green font-bold text-base">${totalMRR.toFixed(2)} USD</span>
          </div>
          <div className="h-6 w-px bg-neutral-800" />
          <div>
            <span className="text-neutral-500 block text-[10px]">TENANTS ACTIVOS</span>
            <span className="text-white font-bold text-base">{tenants.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Terminal Window (Left 6 Cols) */}
        <div className="lg:col-span-6 rounded-3xl bg-black text-apple-green font-mono text-xs p-5 shadow-2xl border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800 text-neutral-400">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-apple-red inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-apple-yellow inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-apple-green inline-block" />
              </div>
              <span className="text-[11px] ml-2 text-neutral-400">terminal.nucleo.sh</span>
            </div>
            <span className="text-[10px]">tty-master-01</span>
          </div>

          {/* Terminal Logs */}
          <div className="h-64 overflow-y-auto space-y-1 pr-1 font-mono text-[11px] leading-relaxed">
            {commandHistory.map((line, idx) => (
              <div key={idx} className={line.startsWith("nucleo@root") ? "text-neutral-300" : line.startsWith("ERROR") ? "text-apple-red" : "text-apple-green"}>
                {line}
              </div>
            ))}
          </div>

          {/* Command Prompt Form */}
          <form onSubmit={handleExecuteCommand} className="pt-2 border-t border-neutral-800 flex items-center gap-2">
            <span className="text-apple-green font-bold">nucleo@root:~$</span>
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="Escribe 'help' o 'list-tenants'..."
              className="flex-1 bg-transparent text-white focus:outline-none placeholder-neutral-700"
            />
          </form>
        </div>

        {/* Interactive Tenant & Modules Manager (Right 6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Tenant Pricing & Plans Matrix */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-3">
            <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
              Control de Mensualidades & Planes
            </h3>

            <div className="space-y-2.5">
              {tenants.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-neutral-900 dark:text-white block">
                      {t.name}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      Vertical: {t.vertical} • Plan: {t.plan}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-400 font-mono">Tarifa:</span>
                    <div className="flex items-center bg-white dark:bg-neutral-700 rounded-lg px-2 py-1 border border-neutral-200 dark:border-neutral-600">
                      <span className="text-neutral-400 font-mono text-[11px] mr-1">$</span>
                      <input
                        type="number"
                        value={t.monthlyPrice}
                        onChange={(e) => handleUpdatePrice(t.id, parseFloat(e.target.value) || 0)}
                        className="w-12 bg-transparent font-mono font-bold text-apple-green text-xs focus:outline-none"
                      />
                      <span className="text-neutral-400 font-mono text-[10px]">/mes</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Module Toggles for Current Tenant */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                  Switches de Módulos (Master Override)
                </h3>
                <span className="text-[11px] text-neutral-500">
                  Activación forzada para {currentTenant.name}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {AVAILABLE_MODULES.map((mod) => {
                const isEnabled = currentTenant.activeModules.includes(mod.key);
                return (
                  <button
                    key={mod.key}
                    type="button"
                    onClick={() => handleToggleModuleForTenant(mod.key)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                      isEnabled
                        ? "bg-apple-blue/10 border-apple-blue text-apple-blue"
                        : "bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-neutral-700"
                    }`}
                  >
                    <span className="truncate">{mod.name}</span>
                    <span className="text-[10px] font-mono">
                      {isEnabled ? "ON" : "OFF"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
