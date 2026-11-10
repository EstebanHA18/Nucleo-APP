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
  ShieldCheck,
  User,
  Mail,
  Phone,
  KeyRound,
  MapPin,
  FileBadge,
  Dog,
  Stethoscope,
  Smile
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

  // 1. Datos del Propietario / Dueño
  const [ownerName, setOwnerName] = useState<string>("Esteban Hernández");
  const [ownerEmail, setOwnerEmail] = useState<string>("esteban@ferreteria.ni");
  const [ownerPhone, setOwnerPhone] = useState<string>("+505 8892-3344");
  const [ownerPin, setOwnerPin] = useState<string>("1234");
  const [ownerRole, setOwnerRole] = useState<string>("Propietario General");

  // 2. Datos de la Empresa / Negocio
  const [businessName, setBusinessName] = useState<string>("Ferretería El Tornillo Dorado");
  const [legalName, setLegalName] = useState<string>("Distribuidora Ferretera del Occidente S.A.");
  const [taxId, setTaxId] = useState<string>("J031000049102");
  const [businessPhone, setBusinessPhone] = useState<string>("+505 2341-2090");
  const [city, setCity] = useState<string>("Chinandega");
  const [address, setAddress] = useState<string>("Costado Norte del Parque Central, 1c al Este");
  const [currency, setCurrency] = useState<"NIO" | "USD">("NIO");
  const [exchangeRate, setExchangeRate] = useState<number>(36.62);

  // 3. Vertical & Módulos
  const [selectedVertical, setSelectedVertical] = useState<BusinessVertical>("ferreteria");
  const [activeModules, setActiveModules] = useState<ModuleKey[]>([
    "pos",
    "inventory",
    "billing",
    "customers",
    "expenses",
  ]);

  // 4. Ticket
  const [ticketFormat, setTicketFormat] = useState<"58mm" | "80mm" | "letter">("80mm");
  const [ticketFooter, setTicketFooter] = useState<string>("¡Gracias por su compra! Venta al contado.");

  const totalSteps = 5;

  const getVerticalIcon = (id: BusinessVertical) => {
    switch (id) {
      case "ferreteria": return <Wrench className="w-5 h-5" />;
      case "comercio": return <Store className="w-5 h-5" />;
      case "agroservicio": return <Wheat className="w-5 h-5" />;
      case "restaurante": return <Utensils className="w-5 h-5" />;
      case "farmacia": return <Pill className="w-5 h-5" />;
      case "distribuidora": return <Truck className="w-5 h-5" />;
      case "taller": return <Cog className="w-5 h-5" />;
      case "constructora": return <Building2 className="w-5 h-5" />;
      case "veterinaria": return <Dog className="w-5 h-5 text-amber-500" />;
      case "clinica": return <Stethoscope className="w-5 h-5 text-teal-500" />;
      case "dental": return <Smile className="w-5 h-5 text-sky-500" />;
      default: return <Sparkles className="w-5 h-5" />;
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
          // ignore
        }
        setTimeout(() => {
          const tenantData: TenantSettings = {
            id: "tenant-" + Date.now(),
            name: businessName,
            legalName,
            taxId,
            phone: businessPhone,
            email: ownerEmail,
            address,
            city,
            owner: {
              fullName: ownerName,
              email: ownerEmail,
              phone: ownerPhone,
              role: ownerRole,
              pinCode: ownerPin,
            },
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
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xl p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white dark:bg-[#1c1c1e] text-neutral-900 dark:text-neutral-100 rounded-3xl shadow-2xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden transition-all duration-300">
        
        {/* Apple Style Header */}
        <div className="px-8 pt-7 pb-4 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-apple-blue flex items-center justify-center text-white shadow-md font-bold text-sm tracking-wider">
              N
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight">Núcleo Setup Assistant</h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Configuración del Propietario y Negocio</p>
            </div>
          </div>
          
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
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
        <div className="p-8 min-h-[480px] flex flex-col justify-between">
          
          {/* PASO 1: Datos del Propietario / Dueño */}
          {step === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="text-center max-w-lg mx-auto mb-4">
                <span className="text-[10px] font-semibold text-apple-blue uppercase tracking-widest block mb-1">
                  Paso 1 de {totalSteps} • Perfil de Acceso
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                  Datos del Dueño del Sistema
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Este será el usuario maestro con control total para gestionar cajeros, precios y roles.
                </p>
              </div>

              <div className="space-y-3.5 max-w-xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Nombre y Apellidos
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="Ej. Esteban Hernández"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs focus:ring-2 focus:ring-apple-blue focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                        placeholder="esteban@negocio.com"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs focus:ring-2 focus:ring-apple-blue focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Teléfono / WhatsApp
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={ownerPhone}
                        onChange={(e) => setOwnerPhone(e.target.value)}
                        placeholder="+505 8892-3344"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      PIN Rápido (4 dígitos)
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        maxLength={4}
                        value={ownerPin}
                        onChange={(e) => setOwnerPin(e.target.value)}
                        placeholder="1234"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs font-mono tracking-widest text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Rol Asignado
                    </label>
                    <input
                      type="text"
                      disabled
                      value={ownerRole}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-200/60 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-apple-blue"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/60 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-apple-green/10 text-apple-green flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    Tu usuario tendrá privilegios de <strong>SuperAdmin Local</strong> con cifrado en Supabase Auth.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: Datos de la Empresa / Negocio */}
          {step === 2 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="text-center max-w-lg mx-auto mb-3">
                <span className="text-[10px] font-semibold text-apple-blue uppercase tracking-widest block mb-1">
                  Paso 2 de {totalSteps} • Identidad Comercial
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                  Información de la Empresa
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Estos datos aparecerán en los encabezados de tus facturas y comprobantes.
                </p>
              </div>

              <div className="space-y-3 max-w-xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Nombre Comercial del Negocio
                    </label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Ej. Ferretería El Tornillo Dorado"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs font-semibold focus:ring-2 focus:ring-apple-blue focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Razón Social o Legal
                    </label>
                    <input
                      type="text"
                      value={legalName}
                      onChange={(e) => setLegalName(e.target.value)}
                      placeholder="Ej. Distribuidora del Occidente S.A."
                      className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      RUC / Cédula Fiscal
                    </label>
                    <input
                      type="text"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      placeholder="J031000049102"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Ciudad / Departamento
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Chinandega"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Teléfono del Local
                    </label>
                    <input
                      type="text"
                      value={businessPhone}
                      onChange={(e) => setBusinessPhone(e.target.value)}
                      placeholder="+505 2341-2090"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Dirección Física del Establecimiento
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Costado Norte del Parque Central, 1c al Este"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Moneda Principal
                    </label>
                    <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs">
                      <button
                        type="button"
                        onClick={() => setCurrency("NIO")}
                        className={`py-1 font-semibold rounded-lg transition-all ${
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
                        className={`py-1 font-semibold rounded-lg transition-all ${
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
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Tipo de Cambio (NIO / USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 36.62)}
                      className="w-full px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASO 3: Selección de Vertical (Business Builder) */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-center max-w-lg mx-auto mb-2">
                <span className="text-[10px] font-semibold text-apple-blue uppercase tracking-widest block mb-1">
                  Paso 3 de {totalSteps} • Vertical de Negocio
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                  ¿A qué rubro te dedicas?
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Núcleo adaptará automáticamente las unidades de medida y módulos ideales.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                {VERTICAL_PRESETS.map((v) => {
                  const isSelected = selectedVertical === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleSelectVertical(v.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between relative ${
                        isSelected
                          ? "bg-apple-blue/5 dark:bg-apple-blue/15 border-apple-blue ring-2 ring-apple-blue/30 shadow-md"
                          : "bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-apple-blue text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                      <div>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${
                          isSelected ? "bg-apple-blue text-white" : "bg-neutral-200/80 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                        }`}>
                          {getVerticalIcon(v.id)}
                        </div>
                        <h3 className="text-xs font-bold text-neutral-900 dark:text-white leading-tight">
                          {v.name}
                        </h3>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
                          {v.tagline}
                        </p>
                      </div>
                      <span className="inline-block mt-2 text-[9px] font-semibold text-apple-blue">
                        {v.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASO 4: Módulos Asignados por el Administrador */}
          {step === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-center max-w-lg mx-auto mb-2">
                <span className="text-[10px] font-semibold text-apple-blue uppercase tracking-widest block mb-1">
                  Paso 4 de {totalSteps} • Paneles del Sistema
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                  Módulos Asignados por el Administrador
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Tu cuenta ha sido aprovisionada por el Administrador de Núcleo ERP con los módulos autorizados para tu plan.
                </p>
              </div>

              {/* Banner informativo de seguridad */}
              <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-600 dark:text-neutral-300 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  <strong>Aprovisionamiento Central:</strong> La selección de módulos es controlada por el Administrador según tu suscripción contratada ($35.00/mes).
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[280px] overflow-y-auto pr-1">
                {AVAILABLE_MODULES.map((mod) => {
                  const isAssigned = activeModules.includes(mod.key);
                  return (
                    <div
                      key={mod.key}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                        isAssigned
                          ? "bg-white dark:bg-neutral-800/90 border-neutral-200/90 dark:border-neutral-700 shadow-sm"
                          : "bg-neutral-50 dark:bg-neutral-900/40 border-neutral-200/50 dark:border-neutral-800/50 opacity-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isAssigned ? "bg-apple-blue text-white" : "bg-neutral-200 dark:bg-neutral-700 text-neutral-500"
                        }`}>
                          <Layers className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                              {mod.name}
                            </h4>
                            {mod.isCore && (
                              <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-bold">
                                CORE
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                            {mod.description}
                          </p>
                        </div>
                      </div>

                      {/* Badge Asignado por Admin */}
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full font-mono shrink-0 ${
                        isAssigned
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : "bg-neutral-200 dark:bg-neutral-800 text-neutral-500"
                      }`}>
                        {isAssigned ? "ASIGNADO" : "BLOQUEADO"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASO 5: Formato de Facturas & Tickets */}
          {step === 5 && !isFinishing && (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-center max-w-lg mx-auto mb-2">
                <span className="text-[10px] font-semibold text-apple-blue uppercase tracking-widest block mb-1">
                  Paso 5 de {totalSteps} • Comprobantes
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                  Formato de Facturas & Recibos
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Previsualización del ticket de mostrador (Ventas al contado y tarjeta).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Ancho del Ticket
                    </label>
                    <div className="space-y-1.5">
                      {[
                        { id: "80mm", name: "Térmica 80mm", desc: "Estándar de ferreterías y restaurantes" },
                        { id: "58mm", name: "Térmica 58mm", desc: "Compacta de mostrador" },
                        { id: "letter", name: "Media Carta / Carta", desc: "Factura comercial formal" },
                      ].map((fmt) => (
                        <div
                          key={fmt.id}
                          onClick={() => setTicketFormat(fmt.id as any)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                            ticketFormat === fmt.id
                              ? "bg-apple-blue/5 dark:bg-apple-blue/15 border-apple-blue font-semibold"
                              : "bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-800"
                          }`}
                        >
                          <div>
                            <span className="block text-neutral-900 dark:text-white">{fmt.name}</span>
                            <span className="text-[10px] text-neutral-500">{fmt.desc}</span>
                          </div>
                          {ticketFormat === fmt.id && <Check className="w-3.5 h-3.5 text-apple-blue" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Pie del ticket
                    </label>
                    <input
                      type="text"
                      value={ticketFooter}
                      onChange={(e) => setTicketFooter(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs"
                    />
                  </div>
                </div>

                {/* Ticket Mockup */}
                <div className="p-3.5 bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 flex flex-col justify-between font-mono text-[11px] text-neutral-800 dark:text-neutral-300 shadow-inner">
                  <div className="text-center border-b border-dashed border-neutral-300 dark:border-neutral-700 pb-2">
                    <p className="font-bold uppercase tracking-wider">{businessName}</p>
                    <p className="text-[9px] text-neutral-500">RUC: {taxId || "J031000049102"}</p>
                    <p className="text-[9px] text-neutral-500">{city}, Nicaragua • Tel: {businessPhone}</p>
                    <p className="text-[9px] text-apple-green font-bold mt-1">VENTA AL CONTADO</p>
                  </div>
                  <div className="py-2 space-y-1">
                    <div className="flex justify-between">
                      <span>1x Varilla 3/8" (9.5mm)</span>
                      <span>C$ 135.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>2x Cemento Holcim 42.5kg</span>
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
                  <div className="text-center border-t border-dashed border-neutral-300 dark:border-neutral-700 pt-1.5 text-[9px] text-neutral-500">
                    {ticketFooter}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Animación de carga final */}
          {isFinishing && (
            <div className="text-center py-16 space-y-5 animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-apple-blue/10 text-apple-blue flex items-center justify-center mx-auto animate-pulse">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                  Creando cuenta y configurando Núcleo
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Dueño: {ownerName} • {businessName}
                </p>
              </div>

              <div className="max-w-xs mx-auto w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-apple-blue h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Footer */}
          {!isFinishing && (
            <div className="pt-5 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Atrás</span>
                </button>
              ) : (
                <div />
              )}

              {step < totalSteps ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="px-5 py-2 rounded-full text-xs font-semibold bg-apple-blue text-white hover:bg-apple-blue-hover shadow-md shadow-apple-blue/25 transition-all flex items-center gap-1.5"
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinish}
                  className="px-6 py-2 rounded-full text-xs font-semibold bg-apple-green text-white hover:opacity-90 shadow-md shadow-apple-green/25 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Comenzar a Usar Núcleo</span>
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
