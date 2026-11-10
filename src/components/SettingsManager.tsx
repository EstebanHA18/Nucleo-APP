"use client";

import React, { useState } from "react";
import { 
  Sliders, 
  Receipt, 
  CreditCard, 
  ShieldCheck, 
  Building2, 
  Check, 
  Printer, 
  Lock, 
  Calendar, 
  DollarSign, 
  Coins, 
  FileText, 
  Layers, 
  UserCheck, 
  Phone, 
  MapPin, 
  Sparkles, 
  AlertCircle,
  HelpCircle,
  Clock,
  Barcode
} from "lucide-react";
import { TenantSettings, ModuleKey } from "@/types";
import { AVAILABLE_MODULES } from "@/lib/constants";
import { saveStoredTenant } from "@/lib/offlineStore";

interface SettingsManagerProps {
  tenant: TenantSettings;
  onUpdateTenant: (updated: TenantSettings) => void;
  onNavigate: (view: string) => void;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({
  tenant,
  onUpdateTenant,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<"invoice" | "subscription" | "modules" | "business">("invoice");
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Estados de diseño de factura
  const [ticketHeader, setTicketHeader] = useState(tenant.ticketHeader || tenant.name);
  const [legalName, setLegalName] = useState(tenant.legalName || "");
  const [taxId, setTaxId] = useState(tenant.taxId || "");
  const [phone, setPhone] = useState(tenant.phone || "");
  const [address, setAddress] = useState(tenant.address || "");
  const [city, setCity] = useState(tenant.city || "");
  const [invoiceSlogan, setInvoiceSlogan] = useState(tenant.invoiceSlogan || "Calidad, Servicio y Garantía para tu Negocio");
  const [ticketFooter, setTicketFooter] = useState(tenant.ticketFooter || "¡Gracias por su compra! Revise su mercadería al salir.");
  const [ticketFormat, setTicketFormat] = useState<"58mm" | "80mm" | "letter">(tenant.ticketFormat || "80mm");
  const [showTaxBreakdown, setShowTaxBreakdown] = useState<boolean>(tenant.showTaxBreakdown !== false);
  const [showUsdEquivalence, setShowUsdEquivalence] = useState<boolean>(tenant.showUsdEquivalence !== false);
  const [showBarcodeOnTicket, setShowBarcodeOnTicket] = useState<boolean>(tenant.showBarcodeOnTicket !== false);

  // Estados de Negocio
  const [exchangeRate, setExchangeRate] = useState(tenant.exchangeRate || 36.62);
  const [taxPercentage, setTaxPercentage] = useState(tenant.taxPercentage || 15.0);

  // Guardar cambios
  const handleSaveSettings = () => {
    const updated: TenantSettings = {
      ...tenant,
      name: ticketHeader,
      legalName,
      taxId,
      phone,
      address,
      city,
      ticketHeader,
      ticketFooter,
      invoiceSlogan,
      ticketFormat,
      showTaxBreakdown,
      showUsdEquivalence,
      showBarcodeOnTicket,
      exchangeRate,
      taxPercentage,
      // Asegurar campos de membresía
      monthlyPlanPrice: tenant.monthlyPlanPrice || 35.0,
      planName: tenant.planName || "Pro",
      billingCycle: tenant.billingCycle || "monthly",
      nextPaymentDate: tenant.nextPaymentDate || "15 de Diciembre, 2026",
      paymentStatus: tenant.paymentStatus || "active",
      adminAssignedBy: tenant.adminAssignedBy || "Administración Central Núcleo (SuperAdmin)",
    };

    saveStoredTenant(updated);
    onUpdateTenant(updated);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Principal del Panel de Ajustes */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-apple-blue/15 text-apple-blue flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
              Ajustes y Configuración del Sistema
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Personaliza el diseño de tus facturas, consulta tu plan contratado y gestiona los paneles del negocio.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSavedNotice && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 animate-fadeIn">
              <Check className="w-3.5 h-3.5" />
              ¡Ajustes guardados!
            </span>
          )}
          <button
            type="button"
            onClick={handleSaveSettings}
            className="px-5 py-2 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-semibold shadow-md shadow-apple-blue/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>

      {/* Navegación por Pestañas (Tabs estilo macOS) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-neutral-200/80 dark:border-neutral-800">
        <button
          type="button"
          onClick={() => setActiveTab("invoice")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === "invoice"
              ? "bg-apple-blue text-white shadow-sm"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Diseño de Factura & Tickets</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("subscription")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === "subscription"
              ? "bg-apple-blue text-white shadow-sm"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Mi Cuenta, Plan & Pagos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("modules")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === "modules"
              ? "bg-apple-blue text-white shadow-sm"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Paneles Asignados por Admin</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("business")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === "business"
              ? "bg-apple-blue text-white shadow-sm"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Datos del Negocio & Moneda</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* PESTAÑA 1: DISEÑO DE FACTURA Y VISTA PREVIA EN VIVO      */}
      {/* ======================================================== */}
      {activeTab === "invoice" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fadeIn">
          
          {/* Formulario de Configuración del Ticket */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-apple-blue" />
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Datos del Encabezado & Emisor
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-neutral-400 uppercase">
                  Impresión Térmica
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Nombre Comercial (Cabecera):
                  </label>
                  <input
                    type="text"
                    value={ticketHeader}
                    onChange={(e) => setTicketHeader(e.target.value)}
                    placeholder="Ej. Ferretería El Tornillo Dorado"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-apple-blue"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Razón Social Legal:
                  </label>
                  <input
                    type="text"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    placeholder="Ej. Distribuidora del Occidente S.A."
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs focus:outline-none focus:ring-2 focus:ring-apple-blue"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    RUC / Cédula Fiscal:
                  </label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="Ej. J031000049102"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-apple-blue"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Teléfono & WhatsApp de Contacto:
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej. +505 2341-2090"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-apple-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Ciudad / Municipio:
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ej. Chinandega"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs focus:outline-none focus:ring-2 focus:ring-apple-blue"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Lema o Slogan Superior:
                  </label>
                  <input
                    type="text"
                    value={invoiceSlogan}
                    onChange={(e) => setInvoiceSlogan(e.target.value)}
                    placeholder="Ej. Calidad y Confianza en Cada Tornillo"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs focus:outline-none focus:ring-2 focus:ring-apple-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Dirección Física del Establecimiento:
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej. Costado Norte del Parque Central, 1c al Este"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs focus:outline-none focus:ring-2 focus:ring-apple-blue"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Pie de Página / Políticas del Ticket:
                </label>
                <textarea
                  value={ticketFooter}
                  onChange={(e) => setTicketFooter(e.target.value)}
                  rows={2}
                  placeholder="Ej. ¡Gracias por su compra! Revise su mercadería al salir..."
                  className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs focus:outline-none focus:ring-2 focus:ring-apple-blue leading-relaxed"
                />
              </div>
            </div>

            {/* Agregados y Opciones Visuales */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-4">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Opciones Visuales y Agregados del Ticket
              </h3>

              <div className="space-y-3">
                {/* Selector de formato de papel */}
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1.5">
                    Ancho de Impresora Térmica
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                    {[
                      { id: "80mm", label: "80 mm", desc: "Estándar de Mostrador" },
                      { id: "58mm", label: "58 mm", desc: "Portátil / Móvil" },
                      { id: "letter", label: "Media Carta", desc: "Papel Hoja Estándar" },
                    ].map((fmt) => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setTicketFormat(fmt.id as any)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          ticketFormat === fmt.id
                            ? "bg-apple-blue text-white border-apple-blue shadow-sm"
                            : "bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"
                        }`}
                      >
                        <div className="font-bold">{fmt.label}</div>
                        <div className={`text-[10px] mt-0.5 ${ticketFormat === fmt.id ? "text-blue-100" : "text-neutral-400"}`}>
                          {fmt.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div 
                    onClick={() => setShowTaxBreakdown(!showTaxBreakdown)}
                    className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                        Desglose IVA (15%)
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        Mostrar subtotal e impuesto
                      </span>
                    </div>
                    <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${showTaxBreakdown ? "bg-apple-blue" : "bg-neutral-300 dark:bg-neutral-600"}`}>
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform ${showTaxBreakdown ? "translate-x-4" : "translate-x-0"}`} />
                    </div>
                  </div>

                  <div 
                    onClick={() => setShowUsdEquivalence(!showUsdEquivalence)}
                    className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                        Equivalente USD ($)
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        Conversión a tipo de cambio
                      </span>
                    </div>
                    <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${showUsdEquivalence ? "bg-apple-blue" : "bg-neutral-300 dark:bg-neutral-600"}`}>
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform ${showUsdEquivalence ? "translate-x-4" : "translate-x-0"}`} />
                    </div>
                  </div>

                  <div 
                    onClick={() => setShowBarcodeOnTicket(!showBarcodeOnTicket)}
                    className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                        Código de Barras
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        Código fiscal en el pie
                      </span>
                    </div>
                    <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${showBarcodeOnTicket ? "bg-apple-blue" : "bg-neutral-300 dark:bg-neutral-600"}`}>
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform ${showBarcodeOnTicket ? "translate-x-4" : "translate-x-0"}`} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Vista Previa en Vivo (Live Receipt Preview) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-apple-blue" />
                <span>Vista Previa del Ticket Impreso ({ticketFormat})</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                ● En vivo
              </span>
            </div>

            {/* Simulación física de papel térmico */}
            <div className="w-full max-w-[340px] mx-auto p-5 rounded-2xl bg-[#fafafa] dark:bg-[#111215] font-mono text-xs border border-dashed border-neutral-300 dark:border-neutral-700 shadow-xl space-y-2.5 text-neutral-900 dark:text-neutral-100">
              {/* Encabezado */}
              <div className="text-center pb-2 border-b border-dashed border-neutral-300 dark:border-neutral-700 space-y-0.5">
                <h4 className="font-extrabold text-sm uppercase tracking-tight">
                  {ticketHeader || "NOMBRE DE TU EMPRESA"}
                </h4>
                {legalName && (
                  <p className="text-[10px] text-neutral-500">{legalName}</p>
                )}
                {invoiceSlogan && (
                  <p className="text-[9px] italic text-neutral-400">"{invoiceSlogan}"</p>
                )}
                <p className="text-[10px] text-neutral-600 dark:text-neutral-400 font-bold mt-1">
                  RUC: {taxId || "J031000000000"}
                </p>
                <p className="text-[10px] text-neutral-500">
                  {address || "Dirección de la empresa"}
                </p>
                <p className="text-[10px] text-neutral-500">
                  {city || "Chinandega"}, Nicaragua • Tel: {phone || "+505 0000-0000"}
                </p>
                <div className="pt-1.5 flex justify-between text-[10px] text-neutral-500 font-bold border-t border-dashed border-neutral-200 dark:border-neutral-800 mt-1">
                  <span>FACTURA: FAC-004812</span>
                  <span>{new Date().toLocaleDateString("es-NI")}</span>
                </div>
              </div>

              {/* Datos de muestra del cliente */}
              <div className="text-[11px] pb-2 border-b border-dashed border-neutral-300 dark:border-neutral-700 space-y-0.5">
                <p><span className="text-neutral-500">CLIENTE:</span> Constructora Martínez & Hnos</p>
                <p><span className="text-neutral-500">RUC / CÉD:</span> J0310000192841</p>
                <p><span className="text-neutral-500">ATENDIÓ:</span> Juan Carlos (Cajero 1)</p>
              </div>

              {/* Ítems de ejemplo */}
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between font-semibold">
                  <span className="truncate max-w-[170px]">2x Cemento Holcim 42.5 Kg</span>
                  <span>C$ 690.00</span>
                </div>
                <div className="text-[9px] text-neutral-500 flex justify-between">
                  <span>Lote: LOT-2026-01</span>
                  <span>Vence: 2027-10-15</span>
                </div>

                <div className="flex justify-between font-semibold pt-1">
                  <span className="truncate max-w-[170px]">6x Varilla Grado 40 3/8"</span>
                  <span>C$ 810.00</span>
                </div>
              </div>

              {/* Desglose de totales */}
              <div className="pt-2 border-t border-dashed border-neutral-300 dark:border-neutral-700 space-y-1 text-xs">
                {showTaxBreakdown && (
                  <>
                    <div className="flex justify-between text-neutral-500 text-[10px]">
                      <span>Subtotal Gravado:</span>
                      <span>C$ 1,304.35</span>
                    </div>
                    <div className="flex justify-between text-neutral-500 text-[10px]">
                      <span>IVA (15%):</span>
                      <span>C$ 195.65</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between text-sm font-extrabold pt-1 border-t border-neutral-200 dark:border-neutral-800">
                  <span>TOTAL FACTURA:</span>
                  <span className="text-apple-blue font-mono">C$ 1,500.00</span>
                </div>

                {showUsdEquivalence && (
                  <div className="flex justify-between text-[10px] text-neutral-500">
                    <span>Equiv. Dólares (TC {exchangeRate}):</span>
                    <span>$ {(1500 / exchangeRate).toFixed(2)} USD</span>
                  </div>
                )}

                {/* Métodos, Pago y Vuelto */}
                <div className="pt-2 mt-1 border-t border-dashed border-neutral-300 dark:border-neutral-700 text-[11px] space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Forma de Pago:</span>
                    <span className="font-bold">EFECTIVO</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Monto Recibido:</span>
                    <span className="font-bold">C$ 2,000.00</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>VUELTO ENTREGADO:</span>
                    <span>C$ 500.00</span>
                  </div>
                </div>
              </div>

              {/* Código de barras y pie */}
              <div className="text-center pt-2 text-[9px] text-neutral-500 border-t border-dashed border-neutral-300 dark:border-neutral-700 space-y-1">
                {showBarcodeOnTicket && (
                  <div className="py-1">
                    <div className="font-mono tracking-widest text-neutral-400 text-xs">
                      ||||| | |||| |||| || ||||| | ||||
                    </div>
                    <p className="text-[8px] font-mono text-neutral-400">FAC-004812-NIC</p>
                  </div>
                )}
                <p className="text-[10px] leading-tight text-neutral-600 dark:text-neutral-400 font-sans">
                  {ticketFooter}
                </p>
                <p className="text-[8px] text-neutral-400 pt-0.5">
                  Emitido con Sistema NÚCLEO ERP Modular
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 2: MI CUENTA, PLAN CONTRATADO Y COBRO MENSUAL   */}
      {/* ======================================================== */}
      {activeTab === "subscription" && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Tarjeta Destacada del Plan Contratado */}
          <div className="p-6 rounded-3xl bg-linear-to-br from-white to-neutral-50 dark:from-[#1c1c1e] dark:to-[#161618] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-200/80 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-apple-blue text-white flex items-center justify-center shadow-md shadow-apple-blue/30 font-bold text-lg">
                  N
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                      Plan Núcleo {tenant.planName || "Pro"}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      🟢 ACTIVO / AL DÍA
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Suscripción SaaS para {tenant.name} • Asignada por la Administración Central
                  </p>
                </div>
              </div>

              {/* Cobro Mensual Definido por el Admin */}
              <div className="text-right">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-semibold">
                  Tarifa Mensual Contratada
                </span>
                <div className="text-3xl font-black text-apple-blue font-mono tracking-tight">
                  ${tenant.monthlyPlanPrice || 35.0}.00 <span className="text-xs font-normal text-neutral-400">USD/mes</span>
                </div>
                <span className="text-xs font-mono text-neutral-500">
                  ≈ C$ {((tenant.monthlyPlanPrice || 35.0) * tenant.exchangeRate).toLocaleString("es-NI", { minimumFractionDigits: 2 })} NIO
                </span>
              </div>
            </div>

            {/* Cuadrícula de Métricas de Facturación del Servicio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-medium">
              <div className="p-4 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 space-y-1">
                <span className="text-[10px] font-mono text-neutral-400 uppercase flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-apple-blue" />
                  Próxima Fecha de Corte
                </span>
                <div className="text-sm font-bold text-neutral-900 dark:text-white">
                  {tenant.nextPaymentDate || "15 de Diciembre, 2026"}
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                  Período corriente sin retrasos
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 space-y-1">
                <span className="text-[10px] font-mono text-neutral-400 uppercase flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-apple-blue" />
                  Ciclo de Facturación
                </span>
                <div className="text-sm font-bold text-neutral-900 dark:text-white">
                  Mensual Recurrente
                </div>
                <span className="text-[10px] text-neutral-500">
                  Facturación cada 30 días
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 space-y-1">
                <span className="text-[10px] font-mono text-neutral-400 uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-apple-blue" />
                  Asignado por Administrador
                </span>
                <div className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                  {tenant.adminAssignedBy || "SuperAdmin Central"}
                </div>
                <span className="text-[10px] text-neutral-500">
                  Soporte técnico preferencial
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 space-y-1">
                <span className="text-[10px] font-mono text-neutral-400 uppercase flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-apple-blue" />
                  Método Registrado
                </span>
                <div className="text-sm font-bold text-neutral-900 dark:text-white">
                  Transferencia BAC / Banpro
                </div>
                <span className="text-[10px] text-neutral-500">
                  Comprobante verificado
                </span>
              </div>
            </div>

            {/* Aviso de Política de Administrador */}
            <div className="p-3.5 rounded-2xl bg-apple-blue/5 dark:bg-apple-blue/10 border border-apple-blue/20 text-xs text-neutral-700 dark:text-neutral-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-apple-blue shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Tarifa Fija Garantizada:</strong> El valor mensual de tu suscripción ($35.00 USD/mes) ha sido acordado y fijado directamente por el Administrador de Núcleo ERP para tu negocio ({tenant.businessVertical}). No se aplican cargos automáticos imprevistos ni comisiones ocultas por venta.
              </div>
            </div>
          </div>

          {/* Historial de Comprobantes de Pago del Servicio */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-3">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Historial de Recibos de Membresía del SaaS
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 font-semibold">
                    <th className="py-2.5 px-3">Comprobante</th>
                    <th className="py-2.5 px-3">Período de Servicio</th>
                    <th className="py-2.5 px-3">Monto Cobrado</th>
                    <th className="py-2.5 px-3">Método de Pago</th>
                    <th className="py-2.5 px-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-neutral-900 dark:text-white">NUC-INV-2026-11</td>
                    <td className="py-2.5 px-3">01 Nov 2026 - 30 Nov 2026</td>
                    <td className="py-2.5 px-3 font-bold text-apple-blue">$35.00 USD</td>
                    <td className="py-2.5 px-3 text-neutral-500">Transf. BAC Credomatic #98214</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                        PAGADO
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-neutral-900 dark:text-white">NUC-INV-2026-10</td>
                    <td className="py-2.5 px-3">01 Oct 2026 - 31 Oct 2026</td>
                    <td className="py-2.5 px-3 font-bold text-apple-blue">$35.00 USD</td>
                    <td className="py-2.5 px-3 text-neutral-500">Transf. Banpro #77120</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                        PAGADO
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 3: PANELES Y MÓDULOS ASIGNADOS POR EL ADMIN       */}
      {/* ======================================================== */}
      {activeTab === "modules" && (
        <div className="space-y-5 animate-fadeIn">
          
          <div className="p-5 rounded-3xl bg-neutral-900 text-white border border-neutral-800 shadow-xl space-y-2">
            <div className="flex items-center gap-2 text-apple-blue font-bold text-xs uppercase tracking-wider font-mono">
              <Lock className="w-3.5 h-3.5" />
              <span>Aprovisionamiento Centralizado por el Administrador</span>
            </div>
            <h3 className="text-lg font-bold">
              Paneles y Módulos Autorizados para tu Empresa
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-3xl">
              Por políticas de control de licencias, <strong>los módulos ya no se seleccionan arbitrariamente desde la cuenta del cliente</strong>. Ahora es el <strong>Administrador del Sistema</strong> quien asigna, audita y habilita los paneles contratados para garantizar la estabilidad de la base de datos y la facturación correspondiente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AVAILABLE_MODULES.map((mod) => {
              const isAssigned = tenant.activeModules.includes(mod.key);

              return (
                <div
                  key={mod.key}
                  className={`p-4 rounded-2xl border transition-all flex items-start justify-between ${
                    isAssigned
                      ? "bg-white dark:bg-[#1c1c1e] border-neutral-200/90 dark:border-neutral-800 shadow-apple"
                      : "bg-neutral-50 dark:bg-neutral-900/40 border-neutral-200/50 dark:border-neutral-800/50 opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isAssigned 
                        ? "bg-apple-blue text-white shadow-sm" 
                        : "bg-neutral-200 dark:bg-neutral-800 text-neutral-500"
                    }`}>
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                          {mod.name}
                        </h4>
                        {mod.isCore && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                            CORE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-snug">
                        {mod.description}
                      </p>
                      
                      <div className="mt-2 text-[10px] font-mono flex items-center gap-1.5">
                        {isAssigned ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Habilitado por Admin
                          </span>
                        ) : (
                          <span className="text-neutral-400 flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            No incluido en tu plan actual
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full font-mono shrink-0 ${
                    isAssigned
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-neutral-200 dark:bg-neutral-800 text-neutral-500"
                  }`}>
                    {isAssigned ? "ACTIVO" : "BLOQUEADO"}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
              <HelpCircle className="w-4 h-4 text-apple-blue shrink-0" />
              <span>¿Necesitas un módulo especializado adicional (ej. Nómina, Producción o Rutas)?</span>
            </div>
            <button
              type="button"
              onClick={() => alert(`Para habilitar nuevos módulos, contacta a tu Administrador asignado (${tenant.adminAssignedBy || "Admin Central"}).`)}
              className="px-4 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 font-bold transition-all"
            >
              Contactar al Administrador
            </button>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 4: DATOS DEL NEGOCIO, MONEDA Y SUCURSAL         */}
      {/* ======================================================== */}
      {activeTab === "business" && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-5 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Parámetros Fiscales & Monedas
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Rubro / Vertical de Negocio:
                </label>
                <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold text-neutral-800 dark:text-neutral-200 uppercase font-mono">
                  {tenant.businessVertical}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Tipo de Cambio Oficial (NIO / USD):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 36.62)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-apple-blue"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Porcentaje de Impuesto (IVA %):
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={taxPercentage}
                  onChange={(e) => setTaxPercentage(parseFloat(e.target.value) || 15.0)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-apple-blue"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200/80 dark:border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-5 py-2 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-semibold shadow-md shadow-apple-blue/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Guardar Parámetros</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
