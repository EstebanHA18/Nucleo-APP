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
  Barcode,
  Bluetooth,
  Upload,
  Image as ImageIcon,
  Trash2,
  Radio,
  Smartphone,
  RefreshCw,
  MessageSquare,
  Send,
  Plus,
  Bug,
  Wrench,
  CheckCircle2,
  X,
  Database
} from "lucide-react";
import { TenantSettings, ModuleKey, SupportTicket, TicketRequestType, TicketPriority, AppUser } from "@/types";
import { AVAILABLE_MODULES } from "@/lib/constants";
import { NucleoIcon } from "./NucleoIcon";
import { saveStoredTenant, pushAllLocalDataToSupabase } from "@/lib/offlineStore";
import {
  getSupabaseCredentials,
  saveCustomSupabaseCredentials,
  testSupabaseConnection,
  getLastSupabaseSyncTime
} from "@/lib/supabase";
import { 
  connectBluetoothPrinter, 
  disconnectBluetoothPrinter, 
  getBluetoothPrinterState, 
  isBluetoothSupported, 
  printTestReceiptViaBluetooth, 
  BluetoothPrinterState 
} from "@/lib/bluetoothPrinter";
import { calculateTenantBilling } from "@/lib/centralAmericaBilling";

interface SettingsManagerProps {
  tenant: TenantSettings;
  onUpdateTenant: (updated: TenantSettings) => void;
  onNavigate: (view: string) => void;
  currentUser?: AppUser;
  supportTickets?: SupportTicket[];
  onSaveSupportTickets?: (tickets: SupportTicket[]) => void;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({
  tenant,
  onUpdateTenant,
  onNavigate,
  currentUser,
  supportTickets = [],
  onSaveSupportTickets,
}) => {
  const [activeTab, setActiveTab] = useState<"invoice" | "subscription" | "modules" | "helpdesk" | "business">("invoice");
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Estados de Helpdesk & Solicitudes al Admin (God Mode)
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqType, setReqType] = useState<TicketRequestType>("module_request");
  const [reqModules, setReqModules] = useState<ModuleKey[]>([]);
  const [reqSubject, setReqSubject] = useState("");
  const [reqDescription, setReqDescription] = useState("");
  const [reqPriority, setReqPriority] = useState<TicketPriority>("media");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [ticketNotice, setTicketNotice] = useState<string | null>(null);

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

  // Estados de Logotipo del Comercio
  const [logoUrl, setLogoUrl] = useState<string>(tenant.logoUrl || "");
  const [showLogoOnTicket, setShowLogoOnTicket] = useState<boolean>(tenant.showLogoOnTicket !== false);
  const [logoSize, setLogoSize] = useState<"sm" | "md" | "lg">(tenant.logoSize || "md");

  // Estados de Impresora Térmica Bluetooth
  const [btState, setBtState] = useState<BluetoothPrinterState>(getBluetoothPrinterState());
  const [isBtConnecting, setIsBtConnecting] = useState(false);
  const [isBtTesting, setIsBtTesting] = useState(false);
  const [btMessage, setBtMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [autoPrintBluetooth, setAutoPrintBluetooth] = useState<boolean>(tenant.autoPrintBluetooth || false);

  // Estados de Negocio
  const [exchangeRate, setExchangeRate] = useState(tenant.exchangeRate || 36.62);
  const [taxPercentage, setTaxPercentage] = useState(tenant.taxPercentage || 15.0);

  // Estados de Conexión Supabase Cloud Multi-Tenant
  const initialSupa = getSupabaseCredentials();
  const [supaUrl, setSupaUrl] = useState(initialSupa.url || "https://dpqwetqzqtzhccehogjy.supabase.co");
  const [supaAnonKey, setSupaAnonKey] = useState(initialSupa.isConfigured ? initialSupa.anonKey : "");
  const [isTestingSupa, setIsTestingSupa] = useState(false);
  const [isSyncingSupa, setIsSyncingSupa] = useState(false);
  const [supaFeedback, setSupaFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [lastSyncIso, setLastSyncIso] = useState<string | null>(() => getLastSupabaseSyncTime());

  const handleSaveAndTestSupabase = async () => {
    saveCustomSupabaseCredentials(supaUrl, supaAnonKey);
    setIsTestingSupa(true);
    setSupaFeedback(null);
    const res = await testSupabaseConnection();
    setIsTestingSupa(false);
    setSupaFeedback({ ok: res.ok, text: res.message });
    setLastSyncIso(getLastSupabaseSyncTime());
  };

  const handleFullSyncToSupabase = async () => {
    if (supaUrl.trim() && supaAnonKey.trim()) {
      saveCustomSupabaseCredentials(supaUrl, supaAnonKey);
    }
    setIsSyncingSupa(true);
    setSupaFeedback(null);
    const res = await pushAllLocalDataToSupabase(tenant.id);
    setIsSyncingSupa(false);
    setSupaFeedback({ ok: res.success, text: res.message });
    setLastSyncIso(getLastSupabaseSyncTime());
  };

  // Carga de archivo de logotipo (Base64)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona un archivo de imagen válido (PNG, JPG, SVG o WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setLogoUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl("");
  };

  // Conectar y emparejar impresora Bluetooth
  const handleConnectBluetooth = async () => {
    setIsBtConnecting(true);
    setBtMessage(null);
    const res = await connectBluetoothPrinter();
    setIsBtConnecting(false);
    if (res.success) {
      setBtState(getBluetoothPrinterState());
      setBtMessage({ text: `Impresora "${res.deviceName}" vinculada con éxito.`, type: "success" });
    } else {
      setBtMessage({ text: res.error || "No se pudo vincular la impresora.", type: "error" });
    }
  };

  // Desconectar impresora Bluetooth
  const handleDisconnectBluetooth = async () => {
    await disconnectBluetoothPrinter();
    setBtState(getBluetoothPrinterState());
    setBtMessage({ text: "Impresora Bluetooth desvinculada.", type: "info" });
  };

  // Probar impresión en impresora Bluetooth
  const handleTestBluetoothPrint = async () => {
    setIsBtTesting(true);
    setBtMessage(null);
    const res = await printTestReceiptViaBluetooth({
      ...tenant,
      ticketHeader,
      legalName,
      taxId,
      phone,
      address,
      city,
      ticketFormat,
    });
    setIsBtTesting(false);
    if (res.success) {
      setBtMessage({ text: "¡Ticket de prueba enviado a la impresora Bluetooth!", type: "success" });
    } else {
      setBtMessage({ text: res.error || "Error al imprimir ticket de prueba.", type: "error" });
    }
  };

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
      logoUrl,
      showLogoOnTicket,
      logoSize,
      autoPrintBluetooth,
      bluetoothPrinterName: btState.deviceName || undefined,
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

  // Tickets correspondientes a este negocio
  const tenantTickets = supportTickets.filter((t) => t.tenantId === tenant.id);
  const unreadClientCount = tenantTickets.filter((t) => t.unreadByClient).length;
  const activeTicket = tenantTickets.find((t) => t.id === selectedTicketId) || tenantTickets[0] || null;

  // Abrir modal para contactar al administrador (con módulo preseleccionado opcional)
  const handleOpenContactModal = (preselectedType: TicketRequestType = "module_request", preselectedMod?: ModuleKey) => {
    setReqType(preselectedType);
    if (preselectedMod) {
      setReqModules([preselectedMod]);
      const modObj = AVAILABLE_MODULES.find((m) => m.key === preselectedMod);
      setReqSubject(`Solicitud de habilitación: ${modObj?.name || preselectedMod}`);
      setReqDescription(`Estimado Administrador (God Mode), solicito habilitar el módulo "${modObj?.name || preselectedMod}" para nuestra cuenta (${tenant.name}).`);
    } else if (preselectedType === "module_request") {
      const lockedMods = AVAILABLE_MODULES.filter((m) => !tenant.activeModules.includes(m.key)).map((m) => m.key);
      setReqModules(lockedMods.slice(0, 1));
      setReqSubject("Solicitud de activación de nuevo módulo especializado");
      setReqDescription("");
    } else if (preselectedType === "bug_report") {
      setReqModules([]);
      setReqSubject("Reporte de problema técnico en el sistema");
      setReqDescription("");
    } else {
      setReqModules([]);
      setReqSubject("");
      setReqDescription("");
    }
    setReqPriority("media");
    setShowRequestModal(true);
  };

  // Crear nueva solicitud de Helpdesk hacia God Mode
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqSubject.trim() || !reqDescription.trim()) {
      alert("Por favor completa el asunto y el detalle de tu solicitud o reporte.");
      return;
    }

    const nowIso = new Date().toISOString();
    const ticketNum = 1001 + supportTickets.length;
    const senderName = currentUser?.fullName || tenant.owner?.fullName || "Propietario";

    const newTicket: SupportTicket = {
      id: `tkt-${Date.now().toString(36)}`,
      ticketCode: `TKT-${ticketNum}`,
      tenantId: tenant.id,
      tenantName: tenant.name,
      createdByUserId: currentUser?.id || "usr-owner",
      createdByName: senderName,
      type: reqType,
      requestedModules: reqType === "module_request" ? reqModules : undefined,
      subject: reqSubject.trim(),
      description: reqDescription.trim(),
      priority: reqPriority,
      status: "open",
      createdAt: nowIso,
      updatedAt: nowIso,
      unreadByAdmin: true,
      unreadByClient: false,
      messages: [
        {
          id: `msg-${Date.now().toString(36)}`,
          senderRole: "client",
          senderName,
          text: reqDescription.trim(),
          createdAt: nowIso,
        },
      ],
    };

    const updatedList = [newTicket, ...supportTickets];
    onSaveSupportTickets?.(updatedList);
    setSelectedTicketId(newTicket.id);
    setShowRequestModal(false);
    setActiveTab("helpdesk");
    setTicketNotice(`¡Solicitud ${newTicket.ticketCode} enviada al panel God Mode del Administrador!`);
    setTimeout(() => setTicketNotice(null), 4000);
  };

  // Enviar mensaje en el chat del ticket (Cliente -> God Mode)
  const handleSendClientMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;

    const nowIso = new Date().toISOString();
    const senderName = currentUser?.fullName || tenant.owner?.fullName || "Cliente";

    const newMsg = {
      id: `msg-${Date.now().toString(36)}`,
      senderRole: "client" as const,
      senderName,
      text: replyText.trim(),
      createdAt: nowIso,
    };

    const updatedList = supportTickets.map((t) => {
      if (t.id === activeTicket.id) {
        return {
          ...t,
          updatedAt: nowIso,
          unreadByAdmin: true,
          unreadByClient: false,
          status: t.status === "resolved" || t.status === "closed" ? ("open" as const) : t.status,
          messages: [...t.messages, newMsg],
        };
      }
      return t;
    });

    onSaveSupportTickets?.(updatedList);
    setReplyText("");
  };

  // Marcar ticket como leído por el cliente al seleccionarlo
  const handleSelectClientTicket = (ticket: SupportTicket) => {
    setSelectedTicketId(ticket.id);
    if (ticket.unreadByClient) {
      const updated = supportTickets.map((t) => (t.id === ticket.id ? { ...t, unreadByClient: false } : t));
      onSaveSupportTickets?.(updated);
    }
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
          onClick={() => {
            setActiveTab("helpdesk");
            if (activeTicket && activeTicket.unreadByClient) {
              handleSelectClientTicket(activeTicket);
            }
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === "helpdesk"
              ? "bg-apple-blue text-white shadow-sm"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Helpdesk & Soporte (God Mode)</span>
          {unreadClientCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse">
              {unreadClientCount}
            </span>
          )}
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

            {/* Tarjeta 1: Logotipo del Comercio & Marca */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-apple-blue" />
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Logotipo del Comercio
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-neutral-400">Mostrar en Ticket</span>
                  <div 
                    onClick={() => setShowLogoOnTicket(!showLogoOnTicket)}
                    className="cursor-pointer"
                  >
                    <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${showLogoOnTicket ? "bg-apple-blue" : "bg-neutral-300 dark:bg-neutral-600"}`}>
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform ${showLogoOnTicket ? "translate-x-4" : "translate-x-0"}`} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                {/* Visualizador del Logo */}
                <div className="sm:col-span-4 flex flex-col items-center justify-center p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-dashed border-neutral-200 dark:border-neutral-700 min-h-[110px]">
                  {logoUrl ? (
                    <div className="space-y-2 text-center">
                      <img 
                        src={logoUrl} 
                        alt="Logotipo del comercio" 
                        className={`object-contain mx-auto filter grayscale contrast-125 dark:invert ${
                          logoSize === "sm" ? "h-10" : logoSize === "lg" ? "h-16" : "h-12"
                        }`}
                      />
                      <span className="text-[10px] text-neutral-400 block font-mono">Simulación Térmica B/N</span>
                    </div>
                  ) : (
                    <div className="text-center text-neutral-400 space-y-1">
                      <ImageIcon className="w-8 h-8 mx-auto stroke-1 text-neutral-300 dark:text-neutral-600" />
                      <p className="text-[11px] font-medium">Sin logotipo</p>
                      <p className="text-[9px] text-neutral-400">PNG, JPG, SVG o WebP</p>
                    </div>
                  )}
                </div>

                {/* Controles de Carga y Tamaño */}
                <div className="sm:col-span-8 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-semibold shadow-xs transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{logoUrl ? "Cambiar Imagen" : "Subir Logotipo"}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoUpload} 
                        className="hidden" 
                      />
                    </label>

                    {logoUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Quitar Logo</span>
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                      Tamaño de Impresión en Ticket:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      {(["sm", "md", "lg"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setLogoSize(s)}
                          className={`py-1.5 px-2 rounded-xl border text-center font-medium transition-all ${
                            logoSize === s
                              ? "bg-apple-blue text-white border-apple-blue"
                              : "bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700"
                          }`}
                        >
                          {s === "sm" ? "Pequeño" : s === "md" ? "Mediano" : "Grande"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-[10px] text-neutral-400 leading-tight">
                    El logo se optimiza automáticamente en escala de grises de alto contraste para una impresión clara en tickets de papel térmico.
                  </p>
                </div>
              </div>
            </div>

            {/* Tarjeta 2: Datos del Encabezado & Emisor */}
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

            {/* Tarjeta 3: Configuración de Impresora Bluetooth (Térmica 58mm / 80mm) */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <Bluetooth className="w-4 h-4 text-apple-blue" />
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Impresora Térmica Bluetooth (ESC/POS)
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-full">
                  <span className={`w-2 h-2 rounded-full ${
                    btState.isConnected 
                      ? "bg-emerald-500 animate-pulse" 
                      : btState.deviceName 
                      ? "bg-blue-500" 
                      : "bg-neutral-400"
                  }`} />
                  <span className="text-[10px] font-mono font-bold text-neutral-700 dark:text-neutral-300">
                    {btState.isConnected 
                      ? `En Línea: ${btState.deviceName}` 
                      : btState.deviceName 
                      ? `Guardada: ${btState.deviceName}` 
                      : "Sin Vincular"}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleConnectBluetooth}
                    disabled={isBtConnecting}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                  >
                    <Bluetooth className="w-3.5 h-3.5" />
                    <span>{isBtConnecting ? "Buscando dispositivos..." : btState.deviceName ? "Reconectar / Cambiar Impresora" : "Emparejar Impresora Bluetooth"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestBluetoothPrint}
                    disabled={isBtTesting}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-all disabled:opacity-50"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{isBtTesting ? "Imprimiendo..." : "Imprimir Ticket de Prueba"}</span>
                  </button>

                  {btState.deviceName && (
                    <button
                      type="button"
                      onClick={handleDisconnectBluetooth}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-neutral-400 hover:text-red-500 text-xs transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Desvincular</span>
                    </button>
                  )}
                </div>

                {/* Notificación de estado interactivo */}
                {btMessage && (
                  <div className={`p-3 rounded-2xl text-xs flex items-center gap-2 animate-fadeIn ${
                    btMessage.type === "success" 
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20" 
                      : btMessage.type === "error"
                      ? "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20"
                      : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20"
                  }`}>
                    <Radio className="w-4 h-4 shrink-0" />
                    <span>{btMessage.text}</span>
                  </div>
                )}

                {/* Toggle de impresión automática */}
                <div 
                  onClick={() => setAutoPrintBluetooth(!autoPrintBluetooth)}
                  className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-apple-blue" />
                    <div>
                      <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                        Impresión Automática por Bluetooth al Cobrar
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        Envía el comando directo a la impresora portátil al completar una venta en Caja
                      </span>
                    </div>
                  </div>
                  <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${autoPrintBluetooth ? "bg-apple-blue" : "bg-neutral-300 dark:bg-neutral-600"}`}>
                    <div className={`w-3 h-3 rounded-full bg-white transition-transform ${autoPrintBluetooth ? "translate-x-4" : "translate-x-0"}`} />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-neutral-100/60 dark:bg-neutral-800/40 text-[10px] text-neutral-500 dark:text-neutral-400 space-y-1">
                  <p className="font-semibold text-neutral-700 dark:text-neutral-300">
                    💡 Compatibilidad Térmica Bluetooth:
                  </p>
                  <p>
                    Funciona en Google Chrome, Microsoft Edge y navegadores Android/Windows con Web Bluetooth. Soporta todas las impresoras térmicas portátiles ESC/POS estándar (GOOJPRT, PeriPage, MPT-II, POS-58, Xprinter, etc.).
                  </p>
                </div>
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
                {showLogoOnTicket && logoUrl && (
                  <div className="flex justify-center mb-1.5 animate-fadeIn">
                    <img 
                      src={logoUrl} 
                      alt="Logo Ticket" 
                      className={`object-contain filter grayscale contrast-125 dark:invert ${
                        logoSize === "sm" ? "h-9 max-w-[120px]" : logoSize === "lg" ? "h-16 max-w-[180px]" : "h-12 max-w-[150px]"
                      }`}
                    />
                  </div>
                )}
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
      {activeTab === "subscription" && (() => {
        const billing = calculateTenantBilling(tenant);
        return (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Tarjeta Destacada del Plan Contratado */}
            <div className="p-6 rounded-3xl bg-linear-to-br from-white to-neutral-50 dark:from-[#1c1c1e] dark:to-[#161618] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-200/80 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <NucleoIcon size={46} showGlow={true} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                        Plan Núcleo {tenant.planName || "Pro"}
                      </h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${billing.statusBadge.colorClass}`}>
                        {billing.statusBadge.label}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Suscripción SaaS para {tenant.name} • Facturación Centroamérica (UTC-6)
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
                  <span className="text-[10px] font-mono text-neutral-400 uppercase flex items-center gap-1 font-bold">
                    <Calendar className="w-3.5 h-3.5 text-apple-blue" />
                    Próximo Corte (Día 10)
                  </span>
                  <div className="text-sm font-bold text-neutral-900 dark:text-white font-mono">
                    {billing.nextCutDate}
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    Corte automático mensual
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 space-y-1">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase flex items-center gap-1 font-bold">
                    <Clock className="w-3.5 h-3.5 text-apple-blue" />
                    Último Día de Pago (Día 05)
                  </span>
                  <div className="text-sm font-bold text-neutral-900 dark:text-white font-mono">
                    {billing.nextDueDate}
                  </div>
                  <span className="text-[10px] text-neutral-500">
                    Vencimiento del período
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 space-y-1">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase flex items-center gap-1 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-apple-blue" />
                    Alta de Perfil
                  </span>
                  <div className="text-sm font-bold text-neutral-900 dark:text-white truncate font-mono">
                    {billing.startDate}
                  </div>
                  <span className="text-[10px] text-neutral-500">
                    Inicio de cómputo de servicio
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 space-y-1">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase flex items-center gap-1 font-bold">
                    <DollarSign className="w-3.5 h-3.5 text-apple-blue" />
                    Monto Próximo Corte
                  </span>
                  <div className="text-sm font-bold text-apple-blue font-mono">
                    ${billing.amountDueUsd.toFixed(2)} USD
                  </div>
                  <span className="text-[10px] text-neutral-500">
                    {billing.isFirstProRatedCycle ? `Prorrateo de ${billing.daysConsumed} días` : "Tarifa mensual regular"}
                  </span>
                </div>
              </div>

              {/* Alerta de Prorrateo si contrató a mitad de mes */}
              {billing.isFirstProRatedCycle && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1 animate-fadeIn">
                  <div className="flex items-center gap-2 font-bold">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Factura Proporcional Aplicada (Prorrateo Activo)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Tu perfil se activó el <strong>{billing.startDate}</strong>. Conforme a las políticas de Núcleo ERP, tu primera factura no cobra el mes completo, sino únicamente los <strong>{billing.daysConsumed} días consumidos</strong> hasta el corte del día 10 (${billing.amountDueUsd.toFixed(2)} USD). A partir del siguiente ciclo, tu mensualidad será la pactada (${tenant.monthlyPlanPrice || 35.0}.00 USD/mes).
                  </p>
                </div>
              )}

              {/* Aviso de Política de Administrador */}
              <div className="p-3.5 rounded-2xl bg-apple-blue/5 dark:bg-apple-blue/10 border border-apple-blue/20 text-xs text-neutral-700 dark:text-neutral-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-apple-blue shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Zona Horaria Oficial:</strong> {billing.timeZoneLabel}. Todos los cortes contables ocurren a las 23:59:59 del día 10 de cada mes y el plazo para registrar comprobante vence a las 23:59:59 del día 05.
                </div>
              </div>
            </div>

            {/* Historial de Comprobantes de Pago del Servicio */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Historial de Recibos de Membresía del SaaS
                </h3>
                <span className="text-[10px] font-mono text-neutral-400">
                  Corte: Cada día 10 • Pago: Cada día 05
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 font-semibold">
                      <th className="py-2.5 px-3">Comprobante</th>
                      <th className="py-2.5 px-3">Período de Servicio</th>
                      <th className="py-2.5 px-3">Fecha Corte</th>
                      <th className="py-2.5 px-3">Vence</th>
                      <th className="py-2.5 px-3">Monto Cobrado</th>
                      <th className="py-2.5 px-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                    {billing.invoicesHistory.map((inv) => (
                      <tr key={inv.id}>
                        <td className="py-2.5 px-3 font-bold text-neutral-900 dark:text-white">{inv.id}</td>
                        <td className="py-2.5 px-3">
                          <span>{inv.period}</span>
                          {inv.isProRated && (
                            <span className="ml-1 text-[9px] text-amber-500 font-sans block">
                              ★ Prorrateado
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-500">{inv.cutDate}</td>
                        <td className="py-2.5 px-3 text-neutral-500">{inv.dueDate}</td>
                        <td className="py-2.5 px-3 font-bold text-apple-blue">${inv.amountUsd.toFixed(2)} USD</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === "PAGADO"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        );
      })()}

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
                      
                      <div className="mt-2 text-[10px] font-mono flex items-center gap-2">
                        {isAssigned ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Habilitado por Admin
                          </span>
                        ) : (
                          <>
                            <span className="text-neutral-400 flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              No incluido en tu plan actual
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenContactModal("module_request", mod.key)}
                              className="text-apple-blue hover:underline font-sans font-bold text-[10px] cursor-pointer"
                            >
                              • Solicitar panel
                            </button>
                          </>
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
              <span>¿Necesitas un módulo especializado adicional (ej. Nómina, Producción o Rutas) o deseas reportar un problema?</span>
            </div>
            <div className="flex items-center gap-2">
              {tenantTickets.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab("helpdesk")}
                  className="px-3.5 py-1.5 rounded-xl bg-apple-blue/15 text-apple-blue hover:bg-apple-blue/25 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Ver Mis Solicitudes ({tenantTickets.length})</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleOpenContactModal("module_request")}
                className="px-4 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 font-bold transition-all cursor-pointer"
              >
                Contactar al Administrador
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA HELPDESK: COMUNICACIÓN CLIENTE <-> GOD MODE      */}
      {/* ======================================================== */}
      {activeTab === "helpdesk" && (
        <div className="space-y-4 animate-fadeIn">
          {/* Banner Informativo Helpdesk */}
          <div className="p-5 rounded-3xl bg-neutral-900 text-white border border-neutral-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider font-mono">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Helpdesk Directo // Conexión con SuperAdmin (God Mode)</span>
              </div>
              <h3 className="text-base font-bold">
                Centro de Solicitudes, Módulos y Soporte Técnico
              </h3>
              <p className="text-xs text-neutral-400 max-w-2xl">
                Envía solicitudes para habilitar nuevos paneles, reporta inconvenientes del sistema o comunícate en tiempo real con el Administrador General (God Mode).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenContactModal("module_request")}
                className="px-4 py-2 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Solicitar Panel / Módulo</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenContactModal("bug_report")}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Bug className="w-3.5 h-3.5 text-amber-400" />
                <span>Reportar un Problema</span>
              </button>
            </div>
          </div>

          {ticketNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{ticketNotice}</span>
            </div>
          )}

          {tenantTickets.length === 0 ? (
            <div className="p-10 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 text-center space-y-3">
              <MessageSquare className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto stroke-1" />
              <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                No tienes solicitudes ni tickets registrados aún
              </h4>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                Cuando necesites habilitar un panel adicional (como RRHH & Nómina o Producción) o reportar un problema técnico al Administrador God Mode, crea un ticket aquí.
              </p>
              <button
                type="button"
                onClick={() => handleOpenContactModal("module_request")}
                className="px-4 py-2 rounded-xl bg-apple-blue text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear Primera Solicitud</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Lista de Tickets del Cliente */}
              <div className="lg:col-span-5 space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-neutral-500 uppercase font-mono">
                    Mis Solicitudes ({tenantTickets.length})
                  </span>
                </div>

                {tenantTickets.map((tkt) => {
                  const isSelected = activeTicket?.id === tkt.id;
                  return (
                    <div
                      key={tkt.id}
                      onClick={() => handleSelectClientTicket(tkt)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                        isSelected
                          ? "bg-white dark:bg-[#1c1c1e] border-apple-blue ring-2 ring-apple-blue/20 shadow-md"
                          : "bg-white/80 dark:bg-[#1c1c1e]/70 border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[11px] text-apple-blue">
                            {tkt.ticketCode}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            tkt.type === "module_request"
                              ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                              : tkt.type === "bug_report"
                              ? "bg-red-500/15 text-red-600 dark:text-red-400"
                              : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                          }`}>
                            {tkt.type === "module_request"
                              ? "Solicitud de Panel"
                              : tkt.type === "bug_report"
                              ? "Reporte Problema"
                              : tkt.type === "billing_query"
                              ? "Facturación / Plan"
                              : "Soporte General"}
                          </span>
                          {tkt.unreadByClient && (
                            <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold">
                              NUEVA RESPUESTA
                            </span>
                          )}
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                          tkt.status === "open"
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            : tkt.status === "in_progress"
                            ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        }`}>
                          {tkt.status === "open"
                            ? "Abierto"
                            : tkt.status === "in_progress"
                            ? "En Revisión"
                            : tkt.status === "resolved"
                            ? "Resuelto"
                            : "Cerrado"}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white line-clamp-1">
                        {tkt.subject}
                      </h4>

                      {tkt.requestedModules && tkt.requestedModules.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {tkt.requestedModules.map((mKey) => {
                            const mInfo = AVAILABLE_MODULES.find((m) => m.key === mKey);
                            const alreadyActive = tenant.activeModules.includes(mKey);
                            return (
                              <span
                                key={mKey}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 ${
                                  alreadyActive
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                                }`}
                              >
                                <Layers className="w-2.5 h-2.5" />
                                {mInfo?.name || mKey} {alreadyActive && "✓ (Habilitado)"}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono pt-1">
                        <span>{new Date(tkt.createdAt).toLocaleString("es-NI")}</span>
                        <span>{tkt.messages.length} msg(s)</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Detalle y Chat en Vivo con God Mode */}
              <div className="lg:col-span-7">
                {activeTicket ? (
                  <div className="rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple overflow-hidden flex flex-col h-[520px]">
                    {/* Cabecera del Ticket */}
                    <div className="p-4 border-b border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-apple-blue">
                            {activeTicket.ticketCode}
                          </span>
                          <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                            {activeTicket.subject}
                          </h4>
                        </div>
                        <p className="text-[11px] text-neutral-500">
                          Canal directo con <strong>SuperAdmin // God Mode</strong> • Prioridad:{" "}
                          <span className="uppercase font-mono font-bold">{activeTicket.priority}</span>
                        </p>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                        activeTicket.status === "open"
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : activeTicket.status === "in_progress"
                          ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                          : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      }`}>
                        {activeTicket.status === "open"
                          ? "● Pendiente de Admin"
                          : activeTicket.status === "in_progress"
                          ? "● En Proceso por Admin"
                          : "✓ Resuelto por Admin"}
                      </span>
                    </div>

                    {/* Módulos solicitados si aplica */}
                    {activeTicket.requestedModules && activeTicket.requestedModules.length > 0 && (
                      <div className="px-4 py-2.5 bg-apple-blue/5 dark:bg-apple-blue/10 border-b border-neutral-200/60 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
                          Paneles solicitados al Administrador:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {activeTicket.requestedModules.map((mKey) => {
                            const mInfo = AVAILABLE_MODULES.find((m) => m.key === mKey);
                            const isNowEnabled = tenant.activeModules.includes(mKey);
                            return (
                              <span
                                key={mKey}
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                                  isNowEnabled
                                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                    : "bg-apple-blue/15 text-apple-blue border border-apple-blue/30"
                                }`}
                              >
                                {mInfo?.name || mKey} — {isNowEnabled ? "HABILITADO ✓" : "EN ESPERA"}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Hilo de Mensajes */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-neutral-50/30 dark:bg-[#141417]">
                      {activeTicket.messages.map((msg) => {
                        const isMe = msg.senderRole === "client";
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                          >
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                              <span className={`text-[10px] font-bold ${
                                isMe ? "text-apple-blue" : "text-emerald-500 font-mono"
                              }`}>
                                {isMe ? `${msg.senderName} (Cliente)` : `⚡ ${msg.senderName} (God Mode)`}
                              </span>
                              <span className="text-[9px] text-neutral-400 font-mono">
                                {new Date(msg.createdAt).toLocaleTimeString("es-NI", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <div
                              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                                isMe
                                  ? "bg-apple-blue text-white rounded-br-xs"
                                  : "bg-neutral-900 text-neutral-100 border border-emerald-500/30 rounded-bl-xs"
                              }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Caja de Respuesta del Cliente */}
                    <form
                      onSubmit={handleSendClientMessage}
                      className="p-3 border-t border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#1c1c1e] flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Escribe un mensaje o aclaración para el Administrador God Mode..."
                        className="flex-1 px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs focus:outline-none focus:ring-2 focus:ring-apple-blue"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Enviar</span>
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
            </div>
          )}
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

          {/* Panel de Base de Datos Real Multi-Tenant en Núcleo Cloud */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-200/80 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      Sincronización Multi-Tenant en Núcleo Cloud
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      getSupabaseCredentials().isConfigured
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    }`}>
                      {getSupabaseCredentials().isConfigured ? "● NÚCLEO CLOUD ACTIVO" : "○ MODO LOCAL"}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Respaldo automático en la nube para todos los módulos (POS, Facturas, Inventario, Lotes, Caja, Clientes, Salud, RRHH, Producción, Rutas y Ajustes) aislados por negocio (<code className="font-mono">{tenant.id}</code>).
                  </p>
                </div>
              </div>

              {lastSyncIso && (
                <span className="text-[11px] font-mono text-neutral-400">
                  Última sincr.: {new Date(lastSyncIso).toLocaleTimeString("es-NI")}
                </span>
              )}
            </div>

            {supaFeedback && (
              <div className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${
                supaFeedback.ok
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
              }`}>
                {supaFeedback.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{supaFeedback.text}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-neutral-400">
                Estado del motor: <strong>Núcleo Cloud Multi-Tenant Engine v3.5</strong>
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveAndTestSupabase}
                  disabled={isTestingSupa}
                  className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupa ? "animate-spin" : ""}`} />
                  <span>{isTestingSupa ? "Verificando..." : "Verificar Conexión Núcleo Cloud"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleFullSyncToSupabase}
                  disabled={isSyncingSupa}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>{isSyncingSupa ? "Sincronizando con Núcleo Cloud..." : "Sincronizar Todo a Núcleo Cloud"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONTACTAR AL ADMINISTRADOR (SOLICITUD A GOD MODE) */}
      {/* ======================================================== */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-xl bg-white dark:bg-[#18191f] text-neutral-900 dark:text-neutral-100 rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-apple-blue/15 text-apple-blue flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">
                    Contactar al Administrador // Helpdesk God Mode
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Tu solicitud caerá directamente en la bandeja del SuperAdmin para atención inmediata.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              {/* Tipo de Solicitud */}
              <div>
                <label className="block text-[11px] font-semibold mb-1.5">
                  ¿Qué deseas solicitar o reportar al Administrador?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "module_request", label: "Solicitar Panel", icon: Layers },
                    { id: "bug_report", label: "Reportar Problema", icon: Bug },
                    { id: "billing_query", label: "Plan & Facturación", icon: CreditCard },
                    { id: "system_support", label: "Soporte del Sistema", icon: Wrench },
                  ].map((item) => {
                    const IconComp = item.icon;
                    const isSelected = reqType === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setReqType(item.id as TicketRequestType)}
                        className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer ${
                          isSelected
                            ? "bg-apple-blue text-white border-apple-blue shadow-sm"
                            : "bg-neutral-50 dark:bg-neutral-800/70 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700"
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                        <span className="font-bold text-[11px] leading-tight">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selección de Paneles si es solicitud de módulo */}
              {reqType === "module_request" && (
                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-2">
                  <label className="block text-[11px] font-bold text-apple-blue">
                    Selecciona el panel o módulo que deseas habilitar:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {AVAILABLE_MODULES.map((mod) => {
                      const alreadyActive = tenant.activeModules.includes(mod.key);
                      const isChecked = reqModules.includes(mod.key);
                      return (
                        <button
                          key={mod.key}
                          type="button"
                          onClick={() => {
                            if (isChecked) {
                              setReqModules(reqModules.filter((k) => k !== mod.key));
                            } else {
                              setReqModules([...reqModules, mod.key]);
                            }
                          }}
                          className={`p-2 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                            isChecked
                              ? "bg-apple-blue/15 border-apple-blue text-apple-blue font-bold"
                              : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
                          }`}
                        >
                          <span className="truncate text-[11px]">{mod.name}</span>
                          <span className="text-[9px] font-mono ml-1 shrink-0">
                            {alreadyActive ? "(Ya activo)" : isChecked ? "✓" : "+"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Asunto y Prioridad */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold mb-1">
                    Asunto de la Solicitud:
                  </label>
                  <input
                    type="text"
                    required
                    value={reqSubject}
                    onChange={(e) => setReqSubject(e.target.value)}
                    placeholder="Ej. Habilitar módulo de Nómina / Error en impresora..."
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-apple-blue"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1">
                    Nivel de Prioridad:
                  </label>
                  <select
                    value={reqPriority}
                    onChange={(e) => setReqPriority(e.target.value as TicketPriority)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-apple-blue"
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media (Normal)</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              {/* Descripción Detallada */}
              <div>
                <label className="block text-[11px] font-semibold mb-1">
                  Detalle de lo que solicitas o del problema a reportar:
                </label>
                <textarea
                  rows={3}
                  required
                  value={reqDescription}
                  onChange={(e) => setReqDescription(e.target.value)}
                  placeholder="Describe aquí los detalles para que el Administrador God Mode pueda ayudarte o activar tu panel..."
                  className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs focus:outline-none focus:ring-2 focus:ring-apple-blue leading-relaxed"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Solicitud a God Mode</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
