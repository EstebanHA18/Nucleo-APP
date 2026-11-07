"use client";

import React, { useState } from "react";
import { 
  Building2, 
  Wrench, 
  Store, 
  Wheat, 
  Utensils, 
  Pill, 
  Truck, 
  Cog, 
  Sparkles, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Sliders,
  DollarSign,
  Receipt,
  Package,
  Layers,
  Users,
  ShieldCheck
} from "lucide-react";
import confetti from "canvas-confetti";
import { BusinessVertical, ModuleKey, TenantSettings } from "@/types";
import { VERTICAL_PRESETS, AVAILABLE_MODULES } from "@/lib/constants";
import { saveStoredTenant } from "@/lib/offlineStore";

interface AppleWizardProps {
  onComplete: (tenant: TenantSettings) => void;
}

export const AppleWizard: React.FC<AppleWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(1);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  // Form states
  const [businessName, setBusinessName] = useState<string>("Ferretería El Tornillo Dorado");
  const [currency, setCurrency] = useState<"NIO" | "USD">("NIO");
  const [exchangeRate, setExchangeRate] = useState<number>(36.62);
  const [selectedVertical, setSelectedVertical] = useState<BusinessVertical>("ferreteria");
  const [activeModules, setActiveModules] = useState<ModuleKey[]>([
    "pos",
    "inventory",
    "billing",
    "receivables",
    "expenses",
  ]);
  const [ticketFormat, setTicketFormat] = useState<"58mm" | "80mm" | "letter">("80mm");
  const [ticketFooter, setTicketFooter] = useState<string>("¡Gracias por su compra!");

  // Vertical icon mapping
  const getVerticalIcon = (id: BusinessVertical) => {
    switch (id) {
      case "ferreteria": return <Wrench className="w-6 h-6" />;
      case "comercio": return <Store className="w-6 h-6" />;
      case "agroservicio": return <Wheat className="w-6 h-6" />;
      case "restaurante": return <Utensils className="w-6 h-6" />;
      case "farmacia": return <Pill className="w-6 h-6" />;
      case "distribuidora": return <Truck className="w-6 h-6" />;
      case "taller": return <Cog className="w-6 h-6" />;
      case "constructora": return <Building2 className="w-6 h-6" />;
      default: return <Sparkles className="w-6 h-6" />;
    }
  };

  const handleSelectVertical = (vertical: BusinessVertical) => {
    setSelectedVertical(vertical);
    const preset = VERTICAL_PRESETS.find((v) => v.id === vertical);
    if (preset) {
      setActiveModules(preset.defaultModules as ModuleKey[]);
    }
  };

  const toggleModule = (moduleKey: ModuleKey) => {
    if (activeModules.includes(moduleKey)) {
      setActiveModules(activeModules.filter((m) => m !== moduleKey));
    } else {
      setActiveModules([...activeModules, moduleKey]);
    }
  };

  const handleFinish = () => {
    setIsFinishing(true);
    let current = 0;
    const interval = setInterval(() => {
      current += 20;
      setProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        try {
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore if canvas-confetti is not loaded
        }
        setTimeout(() => {
          const tenantData: TenantSettings = {
            id: "tenant-" + Date.now(),
            name: businessName,
            businessVertical: selectedVertical,
            currency,
            secondaryCurrency: currency === "NIO" ? "USD" : "NIO",
            exchangeRate,
            taxPercentage: 15.0,
            activeModules,
            ticketFormat,
            ticketHeader: businessName,
            ticketFooter,
            isSetupCompleted: true,
            monthlyPlanPrice: 29.0,
            planName: "Pro",
          };
          saveStoredTenant(tenantData);
          onComplete(tenantData);
        }, 1200);
      }
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xl p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white dark:bg-[#1c1c1e] text-neutral-900 dark:text-neutral-100 rounded-3xl shadow-2xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden transition-all duration-300">
        
        {/* Apple Style Top Header */}
        <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-apple-blue flex items-center justify-center text-white shadow-md shadow-apple-blue/30 font-bold text-sm tracking-wider">
              N
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight">Núcleo Setup Assistant</h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Configuración inteligente de tu negocio</p>
            </div>
          </div>
          
          {/* Step indicator dots */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === i
                    ? "w-6 bg-apple-blue"
                    : step > i
                    ? "w-2 bg-neutral-400 dark:bg-neutral-600"
                    : "w-2 bg-neutral-200 dark:bg-neutral-800"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Wizard Body */}
        <div className="p-8 min-h-[460px] flex flex-col justify-between">
          {/* STEP 1: Bienvenida e Identidad */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center max-w-lg mx-auto mb-8">
                <span className="text-xs font-semibold text-apple-blue uppercase tracking-widest block mb-2">
                  Paso 1 de 4
                </span>
                <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                  Dale identidad a tu negocio
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
                  Núcleo se adapta a tu moneda local y reglas de negocio para operar con total claridad.
                </p>
              </div>

              <div className="space-y-4 max-w-md mx-auto">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Nombre comercial del negocio
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Ej. Ferretería El Tornillo Dorado"
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-apple-blue text-sm transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Moneda Principal
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl border border-neutral-200 dark:border-neutral-700">
                      <button
                        type="button"
                        onClick={() => setCurrency("NIO")}
                        className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                          currency === "NIO"
                            ? "bg-white dark:bg-neutral-700 text-apple-blue shadow-sm"
                            : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                        }`}
                      >
                        Córdobas (C$)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrency("USD")}
                        className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                          currency === "USD"
                            ? "bg-white dark:bg-neutral-700 text-apple-blue shadow-sm"
                            : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                        }`}
                      >
                        Dólares ($)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Tipo de Cambio (NIO / USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 36.62)}
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-apple-blue text-sm font-mono transition-all"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/60 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-apple-green/10 text-apple-green flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    Al registrarte, tu cuenta es asignada como <strong>Dueño del Sistema</strong> con privilegios totales para crear cajeros, supervisores y permisos.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Business Builder (Verticales) */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center max-w-lg mx-auto mb-4">
                <span className="text-xs font-semibold text-apple-blue uppercase tracking-widest block mb-2">
                  Paso 2 de 4
                </span>
                <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                  ¿Qué tipo de negocio tienes?
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Núcleo autoinstalará las unidades de medida, catálogo sugerido y módulos ideales.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[310px] overflow-y-auto pr-1">
                {VERTICAL_PRESETS.map((v) => {
                  const isSelected = selectedVertical === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleSelectVertical(v.id)}
                      className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between relative ${
                        isSelected
                          ? "bg-apple-blue/5 dark:bg-apple-blue/15 border-apple-blue ring-2 ring-apple-blue/30 shadow-md"
                          : "bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-apple-blue text-white flex items-center justify-center shadow-sm">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                      <div>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 ${
                          isSelected ? "bg-apple-blue text-white" : "bg-neutral-200/80 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                        }`}>
                          {getVerticalIcon(v.id)}
                        </div>
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white leading-tight">
                          {v.name}
                        </h3>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                          {v.tagline}
                        </p>
                      </div>
                      <span className="inline-block mt-3 text-[10px] font-semibold text-apple-blue">
                        {v.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Módulos Activos */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center max-w-lg mx-auto mb-4">
                <span className="text-xs font-semibold text-apple-blue uppercase tracking-widest block mb-2">
                  Paso 3 de 4
                </span>
                <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                  Activa solo lo que necesitas
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Tu menú lateral y panel se construirán dinámicamente con los módulos que enciendas.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[310px] overflow-y-auto pr-1">
                {AVAILABLE_MODULES.map((mod) => {
                  const isChecked = activeModules.includes(mod.key);
                  return (
                    <div
                      key={mod.key}
                      onClick={() => toggleModule(mod.key)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        isChecked
                          ? "bg-white dark:bg-neutral-800/90 border-apple-blue/50 shadow-sm"
                          : "bg-neutral-50 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isChecked ? "bg-apple-blue text-white" : "bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
                        }`}>
                          <Sliders className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                            {mod.name}
                          </h4>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                            {mod.description}
                          </p>
                        </div>
                      </div>

                      {/* iOS Style Toggle Switch */}
                      <div
                        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 p-0.5 ${
                          isChecked ? "bg-apple-blue" : "bg-neutral-300 dark:bg-neutral-700"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                            isChecked ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Terminal de Ventas & Facturación */}
          {step === 4 && !isFinishing && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center max-w-lg mx-auto mb-6">
                <span className="text-xs font-semibold text-apple-blue uppercase tracking-widest block mb-2">
                  Paso 4 de 4
                </span>
                <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                  Formato de Factura & Tickets
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Configura cómo imprimirán tus recibos de venta o facturas comerciales.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Ancho de Papel / Impresora
                    </label>
                    <div className="space-y-2">
                      {[
                        { id: "80mm", name: "Térmica 80mm", desc: "Estándar de restaurantes y ferreterías" },
                        { id: "58mm", name: "Térmica 58mm", desc: "Tickets compactos de mostrador" },
                        { id: "letter", name: "Media Carta / Carta", desc: "Factura formal membretada" },
                      ].map((fmt) => (
                        <div
                          key={fmt.id}
                          onClick={() => setTicketFormat(fmt.id as any)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            ticketFormat === fmt.id
                              ? "bg-apple-blue/5 dark:bg-apple-blue/15 border-apple-blue font-semibold"
                              : "bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-800"
                          }`}
                        >
                          <div>
                            <span className="text-xs block text-neutral-900 dark:text-white">{fmt.name}</span>
                            <span className="text-[10px] text-neutral-500">{fmt.desc}</span>
                          </div>
                          {ticketFormat === fmt.id && <Check className="w-4 h-4 text-apple-blue" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Pie del ticket
                    </label>
                    <input
                      type="text"
                      value={ticketFooter}
                      onChange={(e) => setTicketFooter(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs"
                    />
                  </div>
                </div>

                {/* Live Ticket Mockup */}
                <div className="p-4 bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 flex flex-col justify-between font-mono text-[11px] text-neutral-800 dark:text-neutral-300 shadow-inner">
                  <div className="text-center border-b border-dashed border-neutral-300 dark:border-neutral-700 pb-2">
                    <p className="font-bold uppercase tracking-wider">{businessName}</p>
                    <p className="text-[9px] text-neutral-500">RUC: J03100002941 • Managua, NIC</p>
                    <p className="text-[9px] text-neutral-500">TICKET #000481 • {ticketFormat}</p>
                  </div>
                  <div className="py-3 space-y-1">
                    <div className="flex justify-between">
                      <span>1x Varilla 3/8" Grado 40</span>
                      <span>C$ 135.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>2x Cemento Holcim 42kg</span>
                      <span>C$ 690.00</span>
                    </div>
                    <div className="border-t border-dashed border-neutral-300 dark:border-neutral-700 pt-1 mt-1 font-bold flex justify-between">
                      <span>TOTAL:</span>
                      <span className="text-apple-blue">C$ 825.00</span>
                    </div>
                    <div className="text-[9px] text-neutral-500 flex justify-between">
                      <span>Equivalente USD:</span>
                      <span>$ 22.53</span>
                    </div>
                  </div>
                  <div className="text-center border-t border-dashed border-neutral-300 dark:border-neutral-700 pt-2 text-[10px] text-neutral-500">
                    {ticketFooter}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FINISHING ANIMATION */}
          {isFinishing && (
            <div className="text-center py-16 space-y-6 animate-fadeIn">
              <div className="w-16 h-16 rounded-3xl bg-apple-blue/10 text-apple-blue flex items-center justify-center mx-auto animate-pulse">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                  Construyendo tu ERP Núcleo
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Optimizando módulos para {businessName}...
                </p>
              </div>

              {/* Progress bar */}
              <div className="max-w-xs mx-auto w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-apple-blue h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Wizard Action Footer */}
          {!isFinishing && (
            <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Atrás</span>
                </button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="px-6 py-2.5 rounded-full text-xs font-semibold bg-apple-blue text-white hover:bg-apple-blue-hover shadow-md shadow-apple-blue/25 transition-all flex items-center gap-1.5"
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinish}
                  className="px-7 py-2.5 rounded-full text-xs font-semibold bg-apple-green text-white hover:opacity-90 shadow-md shadow-apple-green/25 transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Lanzar mi Sistema</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
