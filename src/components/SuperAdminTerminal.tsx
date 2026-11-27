"use client";

import React, { useState } from "react";
import { 
  Terminal as TerminalIcon, 
  ShieldAlert, 
  DollarSign, 
  Server, 
  Check, 
  Play, 
  Database,
  Users,
  Sliders,
  Plus,
  Edit2,
  Trash2,
  KeyRound,
  Calendar,
  Building2,
  ExternalLink,
  Clock,
  Sparkles,
  X,
  Lock,
  Eye,
  EyeOff,
  MessageSquare,
  Send,
  Layers,
  Bug,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import { TenantSettings, ModuleKey, AppUser, BusinessVertical, SupportTicket, TicketStatus, ClientLead, LeadStatus } from "@/types";
import { AVAILABLE_MODULES, VERTICAL_PRESETS } from "@/lib/constants";
import { calculateTenantBilling, getCentralAmericaNow, formatCentralAmericaDate } from "@/lib/centralAmericaBilling";
import { pushAllLocalDataToSupabase } from "@/lib/offlineStore";
import { isSupabaseConfigured } from "@/lib/supabase";

interface SuperAdminTerminalProps {
  currentTenant: TenantSettings;
  allTenants: TenantSettings[];
  onUpdateTenantSettings: (updated: TenantSettings) => void;
  onSaveAllTenants: (tenants: TenantSettings[]) => void;
  onSwitchTenant: (tenant: TenantSettings) => void;
  allUsers: AppUser[];
  onSaveAllUsers: (users: AppUser[]) => void;
  supportTickets?: SupportTicket[];
  onSaveSupportTickets?: (tickets: SupportTicket[]) => void;
  clientLeads?: ClientLead[];
  onSaveClientLeads?: (leads: ClientLead[]) => void;
  onReturnToDashboard?: () => void;
}

export const SuperAdminTerminal: React.FC<SuperAdminTerminalProps> = ({
  currentTenant,
  allTenants,
  onUpdateTenantSettings,
  onSaveAllTenants,
  onSwitchTenant,
  allUsers,
  onSaveAllUsers,
  supportTickets = [],
  onSaveSupportTickets,
  clientLeads = [],
  onSaveClientLeads,
  onReturnToDashboard,
}) => {
  const [activeTab, setActiveTab] = useState<"tenants" | "leads" | "helpdesk" | "passwords" | "cli">("tenants");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [filterLeadStatus, setFilterLeadStatus] = useState<"all" | LeadStatus>("all");
  const [convertingLeadId, setConvertingLeadId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState("");
  const [filterTicketStatus, setFilterTicketStatus] = useState<"all" | TicketStatus>("all");
  const [adminActionNotice, setAdminActionNotice] = useState<string | null>(null);
  const [commandInput, setCommandInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([
    "Núcleo Master System OS [Version 3.5.0-LTS]",
    "Authenticated as SUPERADMIN (Master God Mode) // Root Session Established.",
    "Central America Billing Zone: UTC-6 (America/Managua) Active.",
    "Rules: Cut Date = Every 10th | Payment Due = Every 05th | Auto Pro-rata enabled.",
    "Type 'help' for executive commands or use the interactive admin control matrix.",
  ]);

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantSettings | null>(null);
  const [editingUserPassword, setEditingUserPassword] = useState<AppUser | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState("");
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);

  // Formulario de Nuevo Negocio
  const [newBizName, setNewBizName] = useState("");
  const [newBizLegal, setNewBizLegal] = useState("");
  const [newBizTaxId, setNewBizTaxId] = useState("");
  const [newBizPhone, setNewBizPhone] = useState("");
  const [newBizCity, setNewBizCity] = useState("Managua");
  const [newBizAddress, setNewBizAddress] = useState("");
  const [newBizVertical, setNewBizVertical] = useState<BusinessVertical>("ferreteria");
  const [newBizPrice, setNewBizPrice] = useState<number>(35.0);
  const [newBizOwnerName, setNewBizOwnerName] = useState("");
  const [newBizOwnerUser, setNewBizOwnerUser] = useState("");
  const [newBizOwnerPass, setNewBizOwnerPass] = useState("1234");
  const [newBizModules, setNewBizModules] = useState<ModuleKey[]>([
    "pos",
    "inventory",
    "billing",
    "customers",
    "expenses",
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
        "  billing-status           - Check billing cycle & pro-rata calculations (Cut: 10, Due: 05)",
        "  set-price <id> <amount>  - Override monthly subscription rate in USD",
        "  reset-pass <user> <pass> - Reset password for any account",
        "  sync-cloud               - Push all multi-tenant tables and invoices to Núcleo Cloud",
        "  status                   - Check system metrics, memory & timezone",
        "  clear                    - Clear terminal console"
      );
    } else if (cmd === "list-tenants") {
      allTenants.forEach((t) => {
        const billing = calculateTenantBilling(t);
        newHistory.push(
          `[TENANT] ${t.name} (${t.businessVertical}) | Tarifa: $${t.monthlyPlanPrice}/mo | Cobro actual: $${billing.amountDueUsd.toFixed(
            2
          )} USD (${billing.isFirstProRatedCycle ? "Prorrateado" : "Regular"}) | Corte: ${billing.nextCutDate}`
        );
      });
    } else if (cmd === "billing-status") {
      newHistory.push(
        "CENTRAL AMERICA SAAS BILLING ENGINE:",
        "  Zona Horaria Oficial: America/Managua (UTC-6)",
        "  Día de Corte: 10 de cada mes (23:59:59)",
        "  Último Día de Pago: 05 del mes posterior",
        `  Total Negocios Registrados: ${allTenants.length}`
      );
      allTenants.forEach((t) => {
        const b = calculateTenantBilling(t);
        newHistory.push(`  • ${t.name}: Próximo corte ${b.nextCutDate} - A pagar: $${b.amountDueUsd.toFixed(2)} USD`);
      });
    } else if (cmd.startsWith("set-price")) {
      const parts = cmd.split(" ");
      const price = parseFloat(parts[parts.length - 1]);
      if (!isNaN(price)) {
        handleUpdatePrice(currentTenant.id, price);
        newHistory.push(`SUCCESS: Monthly price for '${currentTenant.name}' set to $${price.toFixed(2)} USD.`);
      } else {
        newHistory.push("ERROR: Syntax: set-price <amount>");
      }
    } else if (cmd.startsWith("reset-pass")) {
      const parts = cmd.split(" ");
      if (parts.length >= 3) {
        const uName = parts[1];
        const newPass = parts[2];
        const updated = allUsers.map((u) => {
          if (u.username.toLowerCase() === uName.toLowerCase()) {
            return { ...u, password: newPass, pinCode: newPass };
          }
          return u;
        });
        onSaveAllUsers(updated);
        newHistory.push(`SUCCESS: Password for user '${uName}' updated to '${newPass}'.`);
      } else {
        newHistory.push("ERROR: Syntax: reset-pass <username> <new_password>");
      }
    } else if (cmd === "sync-cloud" || cmd === "sync-supabase") {
      newHistory.push("INITIATING FULL MULTI-TENANT NÚCLEO CLOUD SYNC (15 TABLES)...");
      pushAllLocalDataToSupabase(currentTenant.id).then((res) => {
        setCommandHistory((prev) => [...prev, `[NÚCLEO CLOUD] ${res.message}`]);
      });
    } else if (cmd === "status") {
      newHistory.push(
        "SYSTEM METRICS:",
        "  Kernel: Núcleo Cloud OS 3.5.0-LTS",
        "  Timezone: America/Managua (UTC-6)",
        `  Núcleo Cloud Engine: ${isSupabaseConfigured() ? "CONNECTED (Multi-Tenant Sync Active)" : "LOCAL OFFLINE-FIRST MODE"}`,
        "  Offline LocalStore: Synchronized (100% Operational)",
        `  Active Tenants: ${allTenants.length}`,
        `  Registered System Users: ${allUsers.length}`
      );
    } else {
      newHistory.push(`command not recognized: '${cmd}'. Type 'help' for guidance.`);
    }

    setCommandHistory(newHistory);
    setCommandInput("");
  };

  // Actualizar precio de suscripción
  const handleUpdatePrice = (tenantId: string, newPrice: number) => {
    const updated = allTenants.map((t) => {
      if (t.id === tenantId) {
        return { ...t, monthlyPlanPrice: newPrice };
      }
      return t;
    });
    onSaveAllTenants(updated);
    if (tenantId === currentTenant.id) {
      onUpdateTenantSettings({ ...currentTenant, monthlyPlanPrice: newPrice });
    }
  };

  // Toggle de módulos para el tenant actual
  const handleToggleModuleForTenant = (tenantId: string, moduleKey: ModuleKey) => {
    const updated = allTenants.map((t) => {
      if (t.id === tenantId) {
        const isPresent = t.activeModules.includes(moduleKey);
        const newMods = isPresent
          ? t.activeModules.filter((m) => m !== moduleKey)
          : [...t.activeModules, moduleKey];
        return { ...t, activeModules: newMods };
      }
      return t;
    });
    onSaveAllTenants(updated);

    if (tenantId === currentTenant.id) {
      const target = updated.find((t) => t.id === tenantId);
      if (target) onUpdateTenantSettings(target);
    }
  };

  // Crear nuevo negocio desde SuperAdmin
  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName.trim()) {
      alert("Por favor ingresa el nombre comercial del negocio.");
      return;
    }

    const nowIso = getCentralAmericaNow().toISOString();
    const newId = `tenant-${Date.now().toString(36)}`;
    const newUsername = newBizOwnerUser.trim() || `admin_${newBizName.toLowerCase().replace(/\s+/g, "")}`;
    const newPassword = newBizOwnerPass.trim() || "1234";

    const newTenant: TenantSettings = {
      id: newId,
      name: newBizName.trim(),
      legalName: newBizLegal.trim() || newBizName.trim(),
      taxId: newBizTaxId.trim() || "J031000000000",
      phone: newBizPhone.trim() || "+505 0000-0000",
      city: newBizCity.trim() || "Managua",
      address: newBizAddress.trim() || "Dirección del establecimiento",
      owner: {
        fullName: newBizOwnerName.trim() || "Propietario",
        email: `${newUsername}@nucleo.ni`,
        phone: newBizPhone.trim() || "+505 0000-0000",
        role: "owner",
        pinCode: newPassword,
      },
      businessVertical: newBizVertical,
      currency: "NIO",
      secondaryCurrency: "USD",
      exchangeRate: 36.62,
      taxPercentage: 15.0,
      activeModules: newBizModules,
      ticketFormat: "80mm",
      ticketHeader: newBizName.trim(),
      ticketFooter: "¡Gracias por su compra!",
      invoiceSlogan: "Calidad y Garantía para tu Negocio",
      showTaxBreakdown: true,
      showUsdEquivalence: true,
      showBarcodeOnTicket: true,
      showLogoOnTicket: true,
      logoSize: "md",
      autoPrintBluetooth: false,
      isSetupCompleted: false, // Se pone en false para que al iniciar sesión por 1ra vez al propietario le aparezca el Wizard de bienvenida
      monthlyPlanPrice: Number(newBizPrice) || 35.0,
      planName: Number(newBizPrice) > 40 ? "Enterprise" : "Pro",
      billingCycle: "monthly",
      paymentStatus: "active",
      adminAssignedBy: "SuperAdmin Central // God Mode",
      createdAt: nowIso,
      planAssignedDate: nowIso.split("T")[0],
      billingCutDay: 10,
      billingDueDay: 5,
      loginUsername: newUsername,
      loginPassword: newPassword,
    };

    // Agregar nuevo usuario dueño
    const newOwnerUser: AppUser = {
      id: `usr-${Date.now().toString(36)}`,
      fullName: newBizOwnerName.trim() || `Dueño ${newBizName.trim()}`,
      username: newUsername,
      password: newPassword,
      pinCode: newPassword,
      email: `${newUsername}@nucleo.ni`,
      role: "owner",
      roleLabel: "Propietario / Dueño",
      allowedModules: newBizModules,
      active: true,
      createdAt: nowIso,
      tenantId: newId,
    };

    const updatedTenants = [...allTenants, newTenant];
    const updatedUsers = [...allUsers, newOwnerUser];

    onSaveAllTenants(updatedTenants);
    onSaveAllUsers(updatedUsers);

    // Si este negocio se creó desde una solicitud de Futuro Cliente (Lead), marcar el Lead como convertido
    if (convertingLeadId && onSaveClientLeads) {
      const updatedLeads = clientLeads.map((l) =>
        l.id === convertingLeadId
          ? {
              ...l,
              status: "converted" as const,
              unreadByAdmin: false,
              createdTenantId: newId,
              createdUsername: newUsername,
            }
          : l
      );
      onSaveClientLeads(updatedLeads);
      setConvertingLeadId(null);
    }

    // Limpiar formulario y cerrar
    setNewBizName("");
    setNewBizLegal("");
    setNewBizTaxId("");
    setNewBizPhone("");
    setNewBizAddress("");
    setNewBizOwnerName("");
    setNewBizOwnerUser("");
    setNewBizOwnerPass("1234");
    setShowCreateModal(false);

    alert(
      `¡Perfil del negocio "${newTenant.name}" creado con éxito!\n\nUsuario de Propietario: ${newUsername}\nContraseña inicial: ${newPassword}\n\nAl iniciar sesión por primera vez, el propietario verá el Asistente de Configuración Inicial (Wizard).`
    );
  };

  // Guardar edición de datos de un negocio
  const handleSaveEditTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;

    const updated = allTenants.map((t) => (t.id === editingTenant.id ? editingTenant : t));
    onSaveAllTenants(updated);
    if (editingTenant.id === currentTenant.id) {
      onUpdateTenantSettings(editingTenant);
    }
    setEditingTenant(null);
  };

  // Restablecer contraseña de usuario
  const handleSavePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserPassword || !newPasswordVal.trim()) return;

    const updated = allUsers.map((u) => {
      if (u.id === editingUserPassword.id) {
        return {
          ...u,
          password: newPasswordVal.trim(),
          pinCode: newPasswordVal.trim(),
        };
      }
      return u;
    });

    onSaveAllUsers(updated);
    setPasswordNotice(`Contraseña del usuario "${editingUserPassword.username}" actualizada a "${newPasswordVal.trim()}".`);
    setTimeout(() => {
      setPasswordNotice(null);
      setEditingUserPassword(null);
      setNewPasswordVal("");
    }, 1500);
  };

  // ==========================================
  // LÓGICA DE BANDEJA DE FUTUROS CLIENTES (LEADS)
  // ==========================================
  const unreadLeadsCount = clientLeads.filter((l) => l.unreadByAdmin || l.status === "new").length;
  const filteredLeads = clientLeads.filter((l) =>
    filterLeadStatus === "all" ? true : l.status === filterLeadStatus
  );
  const activeLead =
    filteredLeads.find((l) => l.id === selectedLeadId) ||
    clientLeads.find((l) => l.id === selectedLeadId) ||
    filteredLeads[0] ||
    null;

  const handleSelectLead = (lead: ClientLead) => {
    setSelectedLeadId(lead.id);
    if (lead.unreadByAdmin && onSaveClientLeads) {
      const updated = clientLeads.map((l) => (l.id === lead.id ? { ...l, unreadByAdmin: false } : l));
      onSaveClientLeads(updated);
    }
  };

  const handleUpdateLeadStatus = (leadId: string, newStatus: LeadStatus) => {
    if (!onSaveClientLeads) return;
    const updated = clientLeads.map((l) =>
      l.id === leadId ? { ...l, status: newStatus, unreadByAdmin: false } : l
    );
    onSaveClientLeads(updated);
    setAdminActionNotice(`Estado del prospecto actualizado a "${newStatus.toUpperCase()}".`);
    setTimeout(() => setAdminActionNotice(null), 3000);
  };

  const handleOpenCreateAccountFromLead = (lead: ClientLead) => {
    setConvertingLeadId(lead.id);
    setNewBizName(lead.businessName);
    setNewBizLegal(lead.businessName);
    setNewBizTaxId(lead.taxId || "J031000000000");
    setNewBizPhone(lead.phone);
    setNewBizCity(lead.city || "Managua");
    setNewBizAddress(lead.address || lead.city || "Nicaragua");
    setNewBizVertical(lead.businessVertical || "ferreteria");
    setNewBizOwnerName(lead.fullName);
    const cleanUser = lead.businessName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 14);
    setNewBizOwnerUser(cleanUser || `dueno_${Date.now().toString().slice(-4)}`);
    setNewBizOwnerPass("1234");
    setNewBizModules(
      lead.interestedModules && lead.interestedModules.length > 0
        ? lead.interestedModules
        : ["pos", "inventory", "billing", "customers"]
    );
    setShowCreateModal(true);
  };

  // ==========================================
  // LÓGICA DE HELPDESK & SOLICITUDES (GOD MODE)
  // ==========================================

  const unreadAdminCount = supportTickets.filter((t) => t.unreadByAdmin || t.status === "open").length;
  const filteredTickets = supportTickets.filter((t) =>
    filterTicketStatus === "all" ? true : t.status === filterTicketStatus
  );
  const activeAdminTicket =
    filteredTickets.find((t) => t.id === selectedTicketId) ||
    supportTickets.find((t) => t.id === selectedTicketId) ||
    filteredTickets[0] ||
    null;

  const handleSelectAdminTicket = (ticket: SupportTicket) => {
    setSelectedTicketId(ticket.id);
    if (ticket.unreadByAdmin) {
      const updated = supportTickets.map((t) => (t.id === ticket.id ? { ...t, unreadByAdmin: false } : t));
      onSaveSupportTickets?.(updated);
    }
  };

  const handleSendAdminReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAdminTicket || !adminReplyText.trim()) return;

    const nowIso = new Date().toISOString();
    const newMsg = {
      id: `msg-${Date.now().toString(36)}`,
      senderRole: "superadmin" as const,
      senderName: "SuperAdmin // God Mode",
      text: adminReplyText.trim(),
      createdAt: nowIso,
    };

    const updated = supportTickets.map((t) => {
      if (t.id === activeAdminTicket.id) {
        return {
          ...t,
          status: t.status === "open" ? ("in_progress" as const) : t.status,
          updatedAt: nowIso,
          unreadByAdmin: false,
          unreadByClient: true,
          messages: [...t.messages, newMsg],
        };
      }
      return t;
    });

    onSaveSupportTickets?.(updated);
    setAdminReplyText("");
  };

  const handleChangeTicketStatus = (ticketId: string, newStatus: TicketStatus) => {
    const nowIso = new Date().toISOString();
    const updated = supportTickets.map((t) => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: newStatus,
          updatedAt: nowIso,
          unreadByAdmin: false,
          unreadByClient: true,
        };
      }
      return t;
    });
    onSaveSupportTickets?.(updated);
    setAdminActionNotice(`Estado de solicitud actualizado a "${newStatus.toUpperCase()}".`);
    setTimeout(() => setAdminActionNotice(null), 3000);
  };

  // Habilitar módulo solicitado directamente desde el ticket en 1 clic y avisar al cliente
  const handleApproveAndEnableModule = (ticket: SupportTicket, modKey: ModuleKey) => {
    const targetTenant = allTenants.find((t) => t.id === ticket.tenantId);
    if (!targetTenant) return;

    const modInfo = AVAILABLE_MODULES.find((m) => m.key === modKey);
    const isAlreadyEnabled = targetTenant.activeModules.includes(modKey);

    if (!isAlreadyEnabled) {
      handleToggleModuleForTenant(targetTenant.id, modKey);
    }

    const nowIso = new Date().toISOString();
    const autoMsg = {
      id: `msg-${Date.now().toString(36)}`,
      senderRole: "superadmin" as const,
      senderName: "SuperAdmin // God Mode",
      text: `✅ Solicitud aprobada: El panel "${modInfo?.name || modKey}" ha sido habilitado en el perfil de ${targetTenant.name}. Ya puedes acceder a él desde tu menú principal.`,
      createdAt: nowIso,
    };

    const updatedTickets = supportTickets.map((t) => {
      if (t.id === ticket.id) {
        return {
          ...t,
          status: "resolved" as const,
          updatedAt: nowIso,
          unreadByAdmin: false,
          unreadByClient: true,
          messages: [...t.messages, autoMsg],
        };
      }
      return t;
    });

    onSaveSupportTickets?.(updatedTickets);
    setAdminActionNotice(`¡Módulo "${modInfo?.name || modKey}" habilitado para ${targetTenant.name} y cliente notificado!`);
    setTimeout(() => setAdminActionNotice(null), 4000);
  };

  const totalMRR = allTenants.reduce((acc, t) => acc + (t.monthlyPlanPrice || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* SuperAdmin Master Banner */}
      <div className="p-6 rounded-3xl bg-neutral-900 text-white border border-neutral-800 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-apple-green/20 text-apple-green flex items-center justify-center font-mono font-bold text-base shadow-lg shadow-apple-green/10">
            #
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight">SuperAdmin Terminal // God Mode</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-apple-green/20 text-apple-green text-[10px] font-mono font-bold">
                ROOT PRIVILEGES
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Control central de negocios, facturador SaaS Centroamérica (Corte 10 / Pago 5) y administración de contraseñas.
            </p>
          </div>
        </div>

        {/* Global SaaS Stats */}
        <div className="flex items-center gap-6 font-mono text-xs">
          <div>
            <span className="text-neutral-500 block text-[10px]">TOTAL MRR SAAS</span>
            <span className="text-apple-green font-bold text-lg">${totalMRR.toFixed(2)} USD</span>
          </div>
          <div className="h-7 w-px bg-neutral-800" />
          <div>
            <span className="text-neutral-500 block text-[10px]">NEGOCIOS ACTIVOS</span>
            <span className="text-white font-bold text-lg">{allTenants.length}</span>
          </div>
          <div className="h-7 w-px bg-neutral-800" />
          <div>
            <span className="text-neutral-500 block text-[10px]">ZONA HORARIA</span>
            <span className="text-blue-400 font-bold text-xs">UTC-6 (Centroamérica)</span>
          </div>
        </div>
      </div>

      {/* Selector de Pestañas SuperAdmin */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("tenants")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "tenants"
                ? "bg-apple-blue text-white shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Perfiles de Negocios & Facturación SaaS</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("leads");
              if (activeLead && activeLead.unreadByAdmin) {
                handleSelectLead(activeLead);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "leads"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Futuros Clientes (Solicitudes de Cuenta)</span>
            {unreadLeadsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-mono font-bold animate-pulse">
                {unreadLeadsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("helpdesk");
              if (activeAdminTicket && activeAdminTicket.unreadByAdmin) {
                handleSelectAdminTicket(activeAdminTicket);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "helpdesk"
                ? "bg-apple-blue text-white shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Helpdesk & Solicitudes de Clientes</span>
            {unreadAdminCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-mono font-bold animate-pulse">
                {unreadAdminCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("passwords")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "passwords"
                ? "bg-apple-blue text-white shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Administrar Contraseñas ({allUsers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cli")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "cli"
                ? "bg-apple-blue text-white shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <TerminalIcon className="w-4 h-4" />
            <span>Consola Unix God Mode (CLI)</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-xl bg-apple-green hover:bg-emerald-600 text-black font-bold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Crear Nuevo Perfil de Negocio</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* PESTAÑA 1: GESTIÓN DE NEGOCIOS & FACTURADOR SAAS         */}
      {/* ======================================================== */}
      {activeTab === "tenants" && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allTenants.map((t) => {
              const billing = calculateTenantBilling(t);
              const isCurrent = t.id === currentTenant.id;

              return (
                <div
                  key={t.id}
                  className={`p-5 rounded-3xl bg-white dark:bg-[#18191f] border transition-all space-y-4 shadow-sm hover:shadow-md ${
                    isCurrent
                      ? "border-apple-blue ring-2 ring-apple-blue/20"
                      : "border-neutral-200/80 dark:border-neutral-800"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm text-neutral-900 dark:text-white">
                          {t.name}
                        </h3>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-apple-blue text-white text-[9px] font-bold">
                            ACTUAL
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 capitalize">
                        Rubro: {t.businessVertical} • RUC: {t.taxId || "J031000000000"}
                      </p>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-xs font-bold text-apple-green">
                        ${t.monthlyPlanPrice || 35.0} <span className="text-[10px] text-neutral-400 font-normal">USD/mes</span>
                      </span>
                    </div>
                  </div>

                  {/* Tarjeta de Facturación y Prorrateo Centroamérica */}
                  <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-500 flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-apple-blue" />
                        Próx. Corte:
                      </span>
                      <span className="font-bold font-mono text-neutral-900 dark:text-white">
                        {billing.nextCutDate}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-500 font-mono">Último Día Pago:</span>
                      <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {billing.nextDueDate}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                      <span className="text-[11px] text-neutral-500">Monto Próx. Factura:</span>
                      <div className="text-right">
                        <span className="font-bold font-mono text-apple-blue">
                          ${billing.amountDueUsd.toFixed(2)} USD
                        </span>
                        {billing.isFirstProRatedCycle && (
                          <span className="text-[9px] text-amber-500 block font-mono">
                            (Prorrateo {billing.daysConsumed} días)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onSwitchTenant(t)}
                      className="flex-1 py-2 px-3 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{isCurrent ? "En este Panel" : "Abrir Panel"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingTenant(t)}
                      className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-600 dark:text-neutral-300"
                      title="Editar Datos del Negocio"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Switches de Módulos Activos */}
                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 space-y-1.5">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-semibold">
                      Módulos Asignados por SuperAdmin:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {AVAILABLE_MODULES.map((mod) => {
                        const isEnabled = t.activeModules.includes(mod.key);
                        return (
                          <button
                            key={mod.key}
                            type="button"
                            onClick={() => handleToggleModuleForTenant(t.id, mod.key)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all ${
                              isEnabled
                                ? "bg-apple-blue/15 border-apple-blue/30 text-apple-blue"
                                : "bg-neutral-100 dark:bg-neutral-800/40 border-transparent text-neutral-400 hover:text-neutral-700"
                            }`}
                          >
                            {mod.name.split(" ")[0]} {isEnabled ? "✓" : "+"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA FUTUROS CLIENTES: SOLICITUDES DESDE LOGIN        */}
      {/* ======================================================== */}
      {activeTab === "leads" && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-5 rounded-3xl bg-white dark:bg-[#18191f] border border-neutral-200/80 dark:border-neutral-800 shadow-apple flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">
                  Bandeja de Futuros Clientes // Solicitudes de Cuenta desde Login
                </h3>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Prospectos que completaron sus datos personales y de su negocio solicitando una cuenta de Propietario.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {[
                { id: "all", label: `Todos (${clientLeads.length})` },
                { id: "new", label: `Nuevos (${clientLeads.filter((l) => l.status === "new").length})` },
                { id: "contacted", label: `Contactados (${clientLeads.filter((l) => l.status === "contacted").length})` },
                { id: "converted", label: `Cuentas Creadas (${clientLeads.filter((l) => l.status === "converted").length})` },
              ].map((flt) => (
                <button
                  key={flt.id}
                  type="button"
                  onClick={() => setFilterLeadStatus(flt.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    filterLeadStatus === flt.id
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200"
                  }`}
                >
                  {flt.label}
                </button>
              ))}
            </div>
          </div>

          {adminActionNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{adminActionNotice}</span>
            </div>
          )}

          {filteredLeads.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white dark:bg-[#18191f] border border-neutral-200/80 dark:border-neutral-800 text-center space-y-2">
              <UserPlus className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto stroke-1" />
              <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                No hay solicitudes de futuros clientes en esta categoría
              </h4>
              <p className="text-xs text-neutral-400">
                Cuando un visitante pulse &quot;Solicitar Cuenta&quot; en el portal de inicio de sesión, sus datos aparecerán aquí automáticamente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              
              {/* Lista Izquierda de Prospectos */}
              <div className="lg:col-span-5 space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {filteredLeads.map((lead) => {
                  const isSelected = activeLead?.id === lead.id;
                  return (
                    <div
                      key={lead.id}
                      onClick={() => handleSelectLead(lead)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                        isSelected
                          ? "bg-white dark:bg-[#18191f] border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                          : "bg-white/80 dark:bg-[#18191f]/70 border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-[11px] text-emerald-500">
                            {lead.leadCode}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-apple-blue/15 text-apple-blue">
                            {lead.businessVertical}
                          </span>
                          {lead.unreadByAdmin && (
                            <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold animate-pulse">
                              NUEVO PROSPECTO
                            </span>
                          )}
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                          lead.status === "new"
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            : lead.status === "contacted"
                            ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        }`}>
                          {lead.status === "new"
                            ? "Por Atender"
                            : lead.status === "contacted"
                            ? "Contactado"
                            : "Cuenta Creada ✓"}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-extrabold text-neutral-900 dark:text-white">
                          🏢 {lead.businessName}
                        </h4>
                        <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 block mt-0.5">
                          👤 {lead.fullName} • 📍 {lead.city}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono pt-1 border-t border-neutral-100 dark:border-neutral-800/60">
                        <span>📞 {lead.phone}</span>
                        <span>{new Date(lead.createdAt).toLocaleString("es-NI")}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Panel Derecho: Expediente Personal y Comercial del Futuro Cliente */}
              <div className="lg:col-span-7">
                {activeLead ? (
                  <div className="p-6 rounded-3xl bg-white dark:bg-[#18191f] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-5">
                    
                    <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-neutral-200 dark:border-neutral-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500 font-mono font-bold text-xs">
                            {activeLead.leadCode}
                          </span>
                          <h3 className="text-base font-black text-neutral-900 dark:text-white">
                            {activeLead.businessName}
                          </h3>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Solicitud recibida el {new Date(activeLead.createdAt).toLocaleString("es-NI")}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateLeadStatus(activeLead.id, "contacted")}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            activeLead.status === "contacted"
                              ? "bg-apple-blue text-white border-apple-blue"
                              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700"
                          }`}
                        >
                          Marcar Contactado
                        </button>
                      </div>
                    </div>

                    {/* Tarjetas de Datos Personales y del Negocio */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                      <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 space-y-2">
                        <span className="text-[10px] font-mono font-bold uppercase text-apple-blue block">
                          Datos Personales del Solicitante
                        </span>
                        <div>
                          <span className="text-neutral-400 text-[10px] block">Nombre Completo:</span>
                          <span className="font-bold text-neutral-900 dark:text-white text-sm">{activeLead.fullName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="font-mono font-bold">{activeLead.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-apple-blue" />
                          <span className="font-mono">{activeLead.email}</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 space-y-2">
                        <span className="text-[10px] font-mono font-bold uppercase text-emerald-500 block">
                          Ficha Comercial de la Empresa
                        </span>
                        <div>
                          <span className="text-neutral-400 text-[10px] block">Rubro / Vertical:</span>
                          <span className="font-bold text-neutral-900 dark:text-white uppercase font-mono">{activeLead.businessVertical}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-amber-500" />
                          <span>Ciudad: <strong>{activeLead.city}</strong></span>
                        </div>
                        <div>
                          <span className="text-neutral-400 text-[11px]">RUC / Cédula: </span>
                          <span className="font-mono font-bold">{activeLead.taxId || "Por definir en Wizard"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Módulos de Interés */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-300 block">
                        Paneles Solicitados por el Futuro Cliente:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeLead.interestedModules.map((mKey) => {
                          const mInfo = AVAILABLE_MODULES.find((m) => m.key === mKey);
                          return (
                            <span
                              key={mKey}
                              className="px-2.5 py-1 rounded-xl bg-apple-blue/10 border border-apple-blue/20 text-apple-blue text-xs font-bold flex items-center gap-1.5"
                            >
                              <Layers className="w-3 h-3" />
                              <span>{mInfo?.name || mKey}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Comentarios / Notas */}
                    {activeLead.notes && (
                      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                        <span className="text-[10px] font-mono font-bold uppercase text-amber-600 dark:text-amber-400 block">
                          Comentarios del Solicitante:
                        </span>
                        <p className="text-neutral-700 dark:text-neutral-200 leading-relaxed">
                          &ldquo;{activeLead.notes}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* Acción Principal: Crear Cuenta de Propietario en 1 Clic */}
                    <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
                      {activeLead.status === "converted" ? (
                        <div className="w-full p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3">
                          <div className="text-xs">
                            <span className="font-extrabold text-emerald-700 dark:text-emerald-300 block">
                              ✓ Cuenta de Propietario Ya Creada para este Cliente
                            </span>
                            <span className="font-mono text-[11px] text-neutral-600 dark:text-neutral-300">
                              Usuario asignado: <strong>{activeLead.createdUsername || "propietario"}</strong> • El cliente verá el Wizard en su 1er inicio de sesión.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenCreateAccountFromLead(activeLead)}
                            className="px-3.5 py-2 rounded-xl bg-neutral-900 text-white text-xs font-bold cursor-pointer"
                          >
                            Crear Otra Sucursal
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenCreateAccountFromLead(activeLead)}
                          className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          <span>Crear Cuenta de Propietario y Negocio desde esta Solicitud (1-Clic)</span>
                        </button>
                      )}
                    </div>

                  </div>
                ) : null}
              </div>

            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA HELPDESK: BANDEJA DE SOLICITUDES & CHAT GOD MODE */}
      {/* ======================================================== */}
      {activeTab === "helpdesk" && (
        <div className="space-y-4 animate-fadeIn">
          {/* Header & Filtros del Helpdesk Central */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#18191f] border border-neutral-200/80 dark:border-neutral-800 shadow-apple flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-apple-green" />
                <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">
                  Centro de Comando Helpdesk // Solicitudes y Reportes de Clientes
                </h3>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Recibe solicitudes de activación de módulos, reportes de fallos y comunícate en tiempo real con los propietarios de cada negocio.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {[
                { id: "all", label: `Todos (${supportTickets.length})` },
                { id: "open", label: `Pendientes (${supportTickets.filter((t) => t.status === "open").length})` },
                { id: "in_progress", label: `En Revisión (${supportTickets.filter((t) => t.status === "in_progress").length})` },
                { id: "resolved", label: `Resueltos (${supportTickets.filter((t) => t.status === "resolved").length})` },
              ].map((flt) => (
                <button
                  key={flt.id}
                  type="button"
                  onClick={() => setFilterTicketStatus(flt.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    filterTicketStatus === flt.id
                      ? "bg-apple-blue text-white shadow-xs"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200"
                  }`}
                >
                  {flt.label}
                </button>
              ))}
            </div>
          </div>

          {adminActionNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{adminActionNotice}</span>
            </div>
          )}

          {filteredTickets.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white dark:bg-[#18191f] border border-neutral-200/80 dark:border-neutral-800 text-center space-y-2">
              <MessageSquare className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto stroke-1" />
              <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                No hay solicitudes en esta categoría
              </h4>
              <p className="text-xs text-neutral-400">
                Las solicitudes creadas por los clientes desde &quot;Contactar al Administrador&quot; aparecerán aquí al instante.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Columna Izquierda: Bandeja de Tickets */}
              <div className="lg:col-span-5 space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {filteredTickets.map((tkt) => {
                  const isSelected = activeAdminTicket?.id === tkt.id;
                  return (
                    <div
                      key={tkt.id}
                      onClick={() => handleSelectAdminTicket(tkt)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                        isSelected
                          ? "bg-white dark:bg-[#18191f] border-apple-blue ring-2 ring-apple-blue/20 shadow-md"
                          : "bg-white/80 dark:bg-[#18191f]/70 border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
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
                              ? "Problema / Bug"
                              : tkt.type === "billing_query"
                              ? "Facturación"
                              : "Soporte"}
                          </span>
                          {tkt.unreadByAdmin && (
                            <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold animate-pulse">
                              NUEVO
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
                            ? "En Proceso"
                            : "Resuelto"}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono font-bold text-apple-green block">
                          🏢 {tkt.tenantName} • ({tkt.createdByName})
                        </span>
                        <h4 className="text-xs font-extrabold text-neutral-900 dark:text-white mt-0.5 line-clamp-1">
                          {tkt.subject}
                        </h4>
                      </div>

                      {tkt.requestedModules && tkt.requestedModules.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {tkt.requestedModules.map((mKey) => {
                            const mInfo = AVAILABLE_MODULES.find((m) => m.key === mKey);
                            return (
                              <span
                                key={mKey}
                                className="px-2 py-0.5 rounded-md bg-apple-blue/10 text-apple-blue text-[10px] font-bold flex items-center gap-1"
                              >
                                <Layers className="w-2.5 h-2.5" />
                                {mInfo?.name || mKey}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono pt-1 border-t border-neutral-100 dark:border-neutral-800/60">
                        <span>Prioridad: <strong className="uppercase">{tkt.priority}</strong></span>
                        <span>{new Date(tkt.updatedAt).toLocaleString("es-NI")}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Columna Derecha: Panel de Acción God Mode & Chat */}
              <div className="lg:col-span-7">
                {activeAdminTicket ? (() => {
                  const ticketTenant = allTenants.find((t) => t.id === activeAdminTicket.tenantId);

                  return (
                    <div className="rounded-3xl bg-white dark:bg-[#18191f] border border-neutral-200/80 dark:border-neutral-800 shadow-apple overflow-hidden flex flex-col h-[580px]">
                      {/* Cabecera de Control del Ticket */}
                      <div className="p-4 border-b border-neutral-200/80 dark:border-neutral-800 bg-neutral-900 text-white space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-apple-green/20 text-apple-green font-mono font-bold text-xs">
                                {activeAdminTicket.ticketCode}
                              </span>
                              <span className="text-xs font-mono text-neutral-300 font-bold">
                                {activeAdminTicket.tenantName}
                              </span>
                              <span className="text-[10px] text-neutral-400">
                                (Solicitado por: {activeAdminTicket.createdByName})
                              </span>
                            </div>
                            <h4 className="font-extrabold text-sm text-white mt-1">
                              {activeAdminTicket.subject}
                            </h4>
                          </div>

                          {/* Cambiar Estado del Ticket */}
                          <div className="flex items-center gap-1">
                            {(["open", "in_progress", "resolved"] as TicketStatus[]).map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleChangeTicketStatus(activeAdminTicket.id, st)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                                  activeAdminTicket.status === st
                                    ? st === "resolved"
                                      ? "bg-emerald-500 text-black"
                                      : st === "in_progress"
                                      ? "bg-apple-blue text-white"
                                      : "bg-amber-500 text-black"
                                    : "bg-neutral-800 text-neutral-400 hover:text-white"
                                }`}
                              >
                                {st === "open" ? "Abierto" : st === "in_progress" ? "En Revisión" : "Resuelto ✓"}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Acción Rápida de God Mode: Habilitar Paneles Solicitados con 1 Clic */}
                        {activeAdminTicket.requestedModules && activeAdminTicket.requestedModules.length > 0 && (
                          <div className="p-3 rounded-2xl bg-neutral-800/90 border border-neutral-700 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs">
                              <Layers className="w-4 h-4 text-apple-green shrink-0" />
                              <span className="font-semibold text-neutral-200">
                                Acción Rápida God Mode (Aprovisionamiento de Panel):
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {activeAdminTicket.requestedModules.map((modKey) => {
                                const modInfo = AVAILABLE_MODULES.find((m) => m.key === modKey);
                                const isAlreadyActive = ticketTenant?.activeModules.includes(modKey);
                                return (
                                  <button
                                    key={modKey}
                                    type="button"
                                    onClick={() => handleApproveAndEnableModule(activeAdminTicket, modKey)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                      isAlreadyActive
                                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                        : "bg-apple-green hover:bg-emerald-500 text-black shadow-md"
                                    }`}
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                    <span>
                                      {isAlreadyActive
                                        ? `${modInfo?.name || modKey} (Ya Habilitado)`
                                        : `Aprobar y Habilitar "${modInfo?.name || modKey}"`}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Conversación / Hilo de Mensajes Bidireccional */}
                      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-neutral-50/40 dark:bg-[#121318]">
                        {activeAdminTicket.messages.map((msg) => {
                          const isAdmin = msg.senderRole === "superadmin";
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                            >
                              <div className="flex items-center gap-1.5 mb-1 px-1">
                                <span className={`text-[10px] font-bold ${
                                  isAdmin ? "text-emerald-500 font-mono" : "text-apple-blue"
                                }`}>
                                  {isAdmin
                                    ? `⚡ ${msg.senderName}`
                                    : `👤 ${msg.senderName} (${activeAdminTicket.tenantName})`}
                                </span>
                                <span className="text-[9px] text-neutral-400 font-mono">
                                  {new Date(msg.createdAt).toLocaleTimeString("es-NI", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                              <div
                                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                                  isAdmin
                                    ? "bg-neutral-900 text-apple-green border border-apple-green/30 rounded-br-xs font-mono"
                                    : "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 rounded-bl-xs"
                                }`}
                              >
                                {msg.text}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Caja de Respuesta del SuperAdmin (God Mode -> Cliente) */}
                      <form
                        onSubmit={handleSendAdminReply}
                        className="p-3 border-t border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#18191f] flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={adminReplyText}
                          onChange={(e) => setAdminReplyText(e.target.value)}
                          placeholder={`Responder a ${activeAdminTicket.createdByName} (${activeAdminTicket.tenantName})...`}
                          className="flex-1 px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs focus:outline-none focus:ring-2 focus:ring-apple-green"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2.5 rounded-xl bg-apple-green hover:bg-emerald-500 text-black text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Responder como God Mode</span>
                        </button>
                      </form>
                    </div>
                  );
                })() : null}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 2: ADMINISTRAR CONTRASEÑAS & USUARIOS            */}
      {/* ======================================================== */}
      {activeTab === "passwords" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#18191f] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80 dark:border-neutral-800">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Control Central de Contraseñas y Accesos
              </h3>
              <p className="text-xs text-neutral-400">
                Visualiza y restablece al instante las credenciales de cualquier dueño o empleado de cualquier negocio.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400">
                  <th className="py-2.5 px-3">Usuario</th>
                  <th className="py-2.5 px-3">Nombre Completo</th>
                  <th className="py-2.5 px-3">Rol</th>
                  <th className="py-2.5 px-3">Contraseña Actual</th>
                  <th className="py-2.5 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {allUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                    <td className="py-3 px-3 font-bold text-neutral-900 dark:text-white">
                      {u.username}
                    </td>
                    <td className="py-3 px-3 text-neutral-600 dark:text-neutral-300">
                      {u.fullName}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === "superadmin" 
                          ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                          : u.role === "owner"
                          ? "bg-apple-blue/15 text-apple-blue"
                          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
                      }`}>
                        {u.roleLabel}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {u.password || u.pinCode || "1234"}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUserPassword(u);
                          setNewPasswordVal(u.password || u.pinCode || "");
                        }}
                        className="px-3 py-1.5 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-bold transition-all shadow-xs"
                      >
                        Cambiar Contraseña
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 3: CONSOLA UNIX GOD MODE (CLI)                   */}
      {/* ======================================================== */}
      {activeTab === "cli" && (
        <div className="rounded-3xl bg-black text-apple-green font-mono text-xs p-6 shadow-2xl border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800 text-neutral-400">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-apple-red inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-apple-yellow inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-apple-green inline-block" />
              </div>
              <span className="text-[11px] ml-2 text-neutral-400">terminal.nucleo.sh // root</span>
            </div>
            <span className="text-[10px]">tty-master-01 • UTC-6</span>
          </div>

          <div className="h-72 overflow-y-auto space-y-1 pr-1 font-mono text-[11px] leading-relaxed">
            {commandHistory.map((line, idx) => (
              <div key={idx} className={line.startsWith("nucleo@root") ? "text-neutral-300" : line.startsWith("ERROR") ? "text-apple-red" : "text-apple-green"}>
                {line}
              </div>
            ))}
          </div>

          <form onSubmit={handleExecuteCommand} className="pt-3 border-t border-neutral-800 flex items-center gap-2">
            <span className="text-apple-green font-bold">nucleo@root:~$</span>
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="Escribe 'help', 'list-tenants', 'billing-status' o 'reset-pass'..."
              className="flex-1 bg-transparent text-white focus:outline-none placeholder-neutral-700"
            />
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: CREAR NUEVO PERFIL DE NEGOCIO                   */}
      {/* ======================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-xl bg-white dark:bg-[#18191f] text-neutral-900 dark:text-neutral-100 rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-5 my-8">
            
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-apple-green" />
                <h3 className="font-extrabold text-base">Crear Perfil de Negocio (SuperAdmin)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Nombre Comercial:</label>
                  <input
                    type="text"
                    required
                    value={newBizName}
                    onChange={(e) => setNewBizName(e.target.value)}
                    placeholder="Ej. Farmacia San Rafael"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-semibold focus:outline-none focus:ring-2 focus:ring-apple-blue"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1">Rubro / Vertical:</label>
                  <select
                    value={newBizVertical}
                    onChange={(e) => setNewBizVertical(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-semibold focus:outline-none focus:ring-2 focus:ring-apple-blue"
                  >
                    {VERTICAL_PRESETS.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1">RUC Fiscal:</label>
                  <input
                    type="text"
                    value={newBizTaxId}
                    onChange={(e) => setNewBizTaxId(e.target.value)}
                    placeholder="J031000000000"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1">Teléfono:</label>
                  <input
                    type="text"
                    value={newBizPhone}
                    onChange={(e) => setNewBizPhone(e.target.value)}
                    placeholder="+505 0000-0000"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1">Tarifa Mensual ($ USD):</label>
                  <input
                    type="number"
                    value={newBizPrice}
                    onChange={(e) => setNewBizPrice(parseFloat(e.target.value) || 0)}
                    placeholder="35.00"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-bold font-mono text-apple-green"
                  />
                </div>
              </div>

              {/* Credenciales de Acceso para el Dueño */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-3">
                <span className="font-bold text-[11px] text-apple-blue block uppercase">
                  Credenciales de Acceso del Dueño:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Nombre Dueño:</label>
                    <input
                      type="text"
                      value={newBizOwnerName}
                      onChange={(e) => setNewBizOwnerName(e.target.value)}
                      placeholder="Ej. Roberto Gómez"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Usuario de Ingreso:</label>
                    <input
                      type="text"
                      value={newBizOwnerUser}
                      onChange={(e) => setNewBizOwnerUser(e.target.value)}
                      placeholder="Ej. dueno_farmacia"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Contraseña Inicial:</label>
                    <input
                      type="text"
                      value={newBizOwnerPass}
                      onChange={(e) => setNewBizOwnerPass(e.target.value)}
                      placeholder="1234"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-xs font-mono font-bold text-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Módulos a Asignar */}
              <div>
                <label className="block text-[11px] font-semibold mb-1.5">
                  Módulos Habilitados para este Negocio:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AVAILABLE_MODULES.map((mod) => {
                    const isSelected = newBizModules.includes(mod.key);
                    return (
                      <button
                        key={mod.key}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setNewBizModules(newBizModules.filter((k) => k !== mod.key));
                          } else {
                            setNewBizModules([...newBizModules, mod.key]);
                          }
                        }}
                        className={`p-2 rounded-xl text-left font-semibold text-xs border transition-all ${
                          isSelected
                            ? "bg-apple-blue text-white border-apple-blue"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-transparent"
                        }`}
                      >
                        {mod.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notificación de Facturación Prorrateada Automática */}
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-300 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Cálculo Automático de Facturación (Zona Centroamérica UTC-6):
                </span>
                <p>
                  El perfil se creará con fecha de hoy ({formatCentralAmericaDate(getCentralAmericaNow())}). Su primer corte será el próximo <strong>día 10</strong> y el pago vence el <strong>día 05</strong>. El sistema prorrateará automáticamente la tarifa de los días exactos consumidos.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-apple-green hover:bg-emerald-600 text-black font-extrabold text-xs shadow-md transition-all"
                >
                  Confirmar y Crear Perfil
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold text-xs"
                >
                  Cancelar
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: EDITAR DATOS DEL NEGOCIO                        */}
      {/* ======================================================== */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-[#18191f] text-neutral-900 dark:text-neutral-100 rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="font-extrabold text-base">Editar Datos de Negocio</h3>
              <button
                type="button"
                onClick={() => setEditingTenant(null)}
                className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTenant} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold mb-1">Nombre Comercial:</label>
                <input
                  type="text"
                  value={editingTenant.name}
                  onChange={(e) => setEditingTenant({ ...editingTenant, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1">RUC:</label>
                  <input
                    type="text"
                    value={editingTenant.taxId || ""}
                    onChange={(e) => setEditingTenant({ ...editingTenant, taxId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Tarifa Mensual ($ USD):</label>
                  <input
                    type="number"
                    value={editingTenant.monthlyPlanPrice || 35.0}
                    onChange={(e) =>
                      setEditingTenant({ ...editingTenant, monthlyPlanPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-bold font-mono text-apple-green"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1">Dirección:</label>
                <input
                  type="text"
                  value={editingTenant.address || ""}
                  onChange={(e) => setEditingTenant({ ...editingTenant, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white font-bold text-xs"
                >
                  Guardar Cambios
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: CAMBIAR / RESTABLECER CONTRASEÑA                */}
      {/* ======================================================== */}
      {editingUserPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-[#18191f] text-neutral-900 dark:text-neutral-100 rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-apple-blue" />
                <h3 className="font-extrabold text-sm">Cambiar Contraseña</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUserPassword(null)}
                className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-neutral-500">
              Estableciendo nueva clave para el usuario: <strong>{editingUserPassword.username}</strong> ({editingUserPassword.fullName})
            </p>

            <form onSubmit={handleSavePasswordChange} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold mb-1">Nueva Contraseña:</label>
                <input
                  type="text"
                  required
                  value={newPasswordVal}
                  onChange={(e) => setNewPasswordVal(e.target.value)}
                  placeholder="Escribe la nueva contraseña..."
                  className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono font-bold text-xs"
                />
              </div>

              {passwordNotice && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                  {passwordNotice}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white font-bold text-xs"
                >
                  Guardar Contraseña
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUserPassword(null)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold"
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
