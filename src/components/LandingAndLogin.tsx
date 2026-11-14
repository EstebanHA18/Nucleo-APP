"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Terminal as TerminalIcon, 
  Sparkles, 
  ArrowRight, 
  Lock, 
  User, 
  CheckCircle2, 
  Zap, 
  Layers, 
  Printer, 
  Activity, 
  Building2, 
  Smile, 
  Dog, 
  Clock, 
  Eye, 
  EyeOff,
  Wifi,
  WifiOff,
  TrendingUp,
  BarChart3,
  Check,
  Receipt,
  CreditCard,
  Package,
  Stethoscope,
  Wrench,
  Shield,
  FileText,
  X,
  Play,
  RotateCcw,
  Store,
  ChevronRight,
  Cpu,
  Smartphone
} from "lucide-react";
import { TenantSettings, AppUser } from "@/types";
import { getCentralAmericaNow } from "@/lib/centralAmericaBilling";

interface LandingAndLoginProps {
  tenants: TenantSettings[];
  users: AppUser[];
  onLoginSuccess: (user: AppUser, tenant: TenantSettings) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const LandingAndLogin: React.FC<LandingAndLoginProps> = ({
  tenants,
  users,
  onLoginSuccess,
  darkMode,
  setDarkMode,
}) => {
  // Estados de Login
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [selectedTenantId, setSelectedTenantId] = useState<string>(tenants[0]?.id || "");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [currentTimeStr, setCurrentTimeStr] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Estados del Showcase Interactivo del Producto
  const [activeTab, setActiveTab] = useState<"pos" | "spatial" | "inventory" | "clinical" | "vet">("pos");

  // Estados del Simulador de POS en vivo dentro de la Landing
  const [simCart, setSimCart] = useState<Array<{ name: string; price: number; qty: number; unit: string }>>([
    { name: "Varilla Corrugada 3/8\"", price: 135, qty: 6, unit: "vara" },
    { name: "Cemento Holcim 42.5kg", price: 345, qty: 2, unit: "saco" },
  ]);
  const [simTendered, setSimTendered] = useState<number>(1500);
  const [simInvoicePrinted, setSimInvoicePrinted] = useState(false);

  // Reloj en tiempo real para Centroamérica (UTC-6 estándar)
  useEffect(() => {
    const updateTime = () => {
      const now = getCentralAmericaNow();
      setCurrentTimeStr(
        now.toLocaleTimeString("es-NI", {
          timeZone: "America/Managua",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) + " (UTC-6)"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Cálculos de la simulación de POS
  const simSubtotal = simCart.reduce((acc, it) => acc + it.price * it.qty, 0);
  const simTax = Math.round(simSubtotal * 0.15 * 100) / 100;
  const simTotal = simSubtotal + simTax;
  const simChange = Math.max(0, simTendered - simTotal);

  const addSimItem = (name: string, price: number, unit: string) => {
    setSimInvoicePrinted(false);
    setSimCart((prev) => {
      const existing = prev.find((it) => it.name === name);
      if (existing) {
        return prev.map((it) => (it.name === name ? { ...it, qty: it.qty + 1 } : it));
      }
      return [...prev, { name, price, qty: 1, unit }];
    });
  };

  const removeSimItem = (name: string) => {
    setSimInvoicePrinted(false);
    setSimCart((prev) => prev.filter((it) => it.name !== name));
  };

  // Manejador de Login Principal
  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError(null);

    const userClean = usernameInput.trim().toLowerCase();
    const passClean = passwordInput.trim();

    if (!userClean || !passClean) {
      setLoginError("Por favor ingresa usuario y contraseña.");
      return;
    }

    // 1. Caso SuperAdmin
    if (userClean === "admin" && passClean === "admin123") {
      const superAdminUser: AppUser = {
        id: "usr-superadmin",
        fullName: "SuperAdministrador Núcleo",
        username: "admin",
        password: "admin123",
        pinCode: "admin123",
        role: "superadmin",
        roleLabel: "SuperAdmin // God Mode",
        allowedModules: ["pos", "inventory", "billing", "customers", "expenses", "veterinary", "clinical"],
        active: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      };
      const activeTenant = tenants.find((t) => t.id === selectedTenantId) || tenants[0];
      onLoginSuccess(superAdminUser, activeTenant);
      return;
    }

    // 2. Buscar en la lista de usuarios del sistema
    const matchedUser = users.find(
      (u) =>
        (u.username.toLowerCase() === userClean || u.email?.toLowerCase() === userClean) &&
        (u.password === passClean || u.pinCode === passClean)
    );

    if (matchedUser) {
      let targetTenant = tenants.find((t) => t.id === matchedUser.tenantId);
      if (!targetTenant) {
        targetTenant = tenants.find((t) => t.id === selectedTenantId) || tenants[0];
      }
      onLoginSuccess(matchedUser, targetTenant);
      return;
    }

    // 3. Revisar si coincide con el usuario configurado en algún tenant
    const matchedTenant = tenants.find(
      (t) =>
        (t.loginUsername?.toLowerCase() === userClean && t.loginPassword === passClean) ||
        (t.owner?.email?.toLowerCase() === userClean && (t.owner?.pinCode === passClean || passClean === "1234"))
    );

    if (matchedTenant) {
      const ownerUser: AppUser = {
        id: `usr-owner-${matchedTenant.id}`,
        fullName: matchedTenant.owner.fullName || "Dueño de Negocio",
        username: matchedTenant.loginUsername || userClean,
        password: passClean,
        pinCode: passClean,
        email: matchedTenant.owner.email,
        role: "owner",
        roleLabel: "Propietario / Dueño",
        allowedModules: matchedTenant.activeModules,
        active: true,
        createdAt: matchedTenant.createdAt || new Date().toISOString(),
        tenantId: matchedTenant.id,
      };
      onLoginSuccess(ownerUser, matchedTenant);
      return;
    }

    setLoginError("Credenciales incorrectas. Para administración utiliza: admin / admin123");
  };

  // Acceso Rápido 1-Click para Demos
  const quickLogin = (user: string, pass: string, tenantId?: string) => {
    setUsernameInput(user);
    setPasswordInput(pass);
    if (tenantId) setSelectedTenantId(tenantId);
    setLoginError(null);

    setTimeout(() => {
      if (user === "admin" && pass === "admin123") {
        const superAdminUser: AppUser = {
          id: "usr-superadmin",
          fullName: "SuperAdministrador Núcleo",
          username: "admin",
          password: "admin123",
          pinCode: "admin123",
          role: "superadmin",
          roleLabel: "SuperAdmin // God Mode",
          allowedModules: ["pos", "inventory", "billing", "customers", "expenses", "veterinary", "clinical"],
          active: true,
          createdAt: "2026-01-01T00:00:00.000Z",
        };
        const activeTenant = tenants.find((t) => t.id === (tenantId || selectedTenantId)) || tenants[0];
        onLoginSuccess(superAdminUser, activeTenant);
      } else {
        const targetTenant = tenants.find((t) => t.id === tenantId) || tenants[0];
        const matched = users.find((u) => u.username === user) || {
          id: `usr-${user}`,
          fullName: targetTenant.owner.fullName || "Propietario",
          username: user,
          password: pass,
          pinCode: pass,
          role: user === "caja1" ? "cashier" : user === "bodega1" ? "inventory_clerk" : "owner",
          roleLabel: user === "caja1" ? "Cajero" : user === "bodega1" ? "Encargado de Bodega" : "Propietario",
          allowedModules: targetTenant.activeModules,
          active: true,
          createdAt: targetTenant.createdAt || new Date().toISOString(),
          tenantId: targetTenant.id,
        };
        onLoginSuccess(matched as AppUser, targetTenant);
      }
    }, 120);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#08090c] text-neutral-900 dark:text-neutral-100 font-sans selection:bg-apple-blue selection:text-white transition-colors duration-300 relative overflow-x-hidden">
      
      {/* Luces y Gradientes Mesh de Fondo Atmosférico */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-blue-500/15 via-cyan-400/10 to-transparent blur-3xl rounded-full" />
        <div className="absolute top-[40%] -left-32 w-[500px] h-[500px] bg-emerald-500/10 blur-3xl rounded-full" />
        <div className="absolute top-[60%] -right-32 w-[600px] h-[600px] bg-indigo-500/10 blur-3xl rounded-full" />
        {/* Rejilla sutil de fondo */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.25] dark:opacity-[0.12]" />
      </div>

      {/* ======================================================== */}
      {/* 1. NAVBAR SUPERIOR ULTRA REFINADO                        */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-white/75 dark:bg-[#0c0d12]/75 border-b border-neutral-200/70 dark:border-neutral-800/80 px-4 md:px-8 py-3 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo y Badge de Suite */}
          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-apple-blue via-blue-600 to-cyan-400 text-white flex items-center justify-center font-extrabold text-base shadow-lg shadow-apple-blue/25 group-hover:scale-105 transition-transform">
                N
              </div>
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#0c0d12] rounded-full animate-pulse" />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-neutral-900 dark:text-white">
                  NÚCLEO <span className="text-apple-blue">ERP</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-apple-blue/10 dark:bg-apple-blue/20 text-apple-blue text-[10px] font-bold font-mono border border-apple-blue/20">
                  v3.5 SUITE
                </span>
              </div>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block font-mono">
                Sistema Operativo para Centroamérica
              </span>
            </div>
          </div>

          {/* Acciones de Navegación */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            
            {/* Indicador de Hora UTC-6 */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100/80 dark:bg-neutral-800/70 border border-neutral-200/80 dark:border-neutral-700/60 text-[11px] font-mono text-neutral-600 dark:text-neutral-300">
              <Clock className="w-3.5 h-3.5 text-apple-blue" />
              <span>{currentTimeStr || "Centroamérica UTC-6"}</span>
            </div>

            {/* Badge de Offline-First Ready */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold border border-emerald-500/20">
              <Wifi className="w-3.5 h-3.5" />
              <span>100% Offline-First</span>
            </div>

            {/* Toggle Dark Mode */}
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="w-9 h-9 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/70 dark:border-neutral-700/70 flex items-center justify-center text-sm hover:scale-105 transition-all text-neutral-700 dark:text-neutral-200"
              title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            {/* Botón CTA Acceso al Sistema */}
            <button
              type="button"
              onClick={() => {
                setShowLoginModal(true);
                setLoginError(null);
              }}
              className="px-4 py-2 rounded-2xl bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-bold shadow-lg shadow-apple-blue/25 hover:shadow-apple-blue/40 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Iniciar Sesión</span>
            </button>

          </div>

        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. HERO SECTION DE ALTO IMPACTO (VENTA DIRECTA)          */}
      {/* ======================================================== */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-12 md:pt-20 pb-12 text-center space-y-6">
        
        {/* Eyebrow Pill luminiscente */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-emerald-500/10 border border-apple-blue/30 text-neutral-900 dark:text-white text-xs font-semibold shadow-sm backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-apple-blue animate-spin" style={{ animationDuration: "8s" }} />
          <span>Diseñado para el ritmo real del comercio en Nicaragua y Centroamérica</span>
          <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-apple-blue" />
          <span className="hidden sm:inline-block text-neutral-500 dark:text-neutral-400 font-mono text-[11px]">C$ & USD</span>
        </div>

        {/* Titular Imponente con Gradiente */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-neutral-900 dark:text-white leading-[1.08] max-w-5xl mx-auto">
          El control total de tu negocio.{" "}
          <span className="bg-gradient-to-r from-apple-blue via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Ultra veloz. 100% Offline.
          </span>
        </h1>

        {/* Subtítulo Persuasivo y Directo */}
        <p className="text-base sm:text-lg lg:text-xl text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-3xl mx-auto font-normal">
          Facturación de mostrador en 3 segundos, inventario multi-unidad con lotes y vencimientos, odontograma dental interactivo y expedientes veterinarios.{" "}
          <strong className="text-neutral-900 dark:text-white font-semibold">
            Tus ventas nunca se detienen, incluso si se cae el internet o la luz.
          </strong>
        </p>

        {/* Botones de Acción Primarios */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById("interactive-demo");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-apple-blue to-blue-600 hover:from-blue-600 hover:to-apple-blue text-white text-sm font-bold shadow-xl shadow-apple-blue/30 hover:shadow-apple-blue/45 transition-all flex items-center justify-center gap-2 group cursor-pointer active:scale-95"
          >
            <span>Probar Demostración en Vivo</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            type="button"
            onClick={() => {
              setShowLoginModal(true);
            }}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/80 dark:bg-neutral-800/80 hover:bg-white dark:hover:bg-neutral-700/80 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 backdrop-blur-md"
          >
            <Lock className="w-4 h-4 text-apple-blue" />
            <span>Acceso con Claves Demo</span>
          </button>

        </div>

        {/* Métricas y Diferenciales Clave */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto pt-6 text-left">
          
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/70 dark:bg-[#111218]/70 border border-neutral-200/80 dark:border-neutral-800/80 backdrop-blur-md shadow-apple">
            <div className="flex items-center gap-2 text-apple-blue mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Velocidad</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white font-mono">&lt; 3 seg</div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400">Por ticket emitido en mostrador</div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/70 dark:bg-[#111218]/70 border border-neutral-200/80 dark:border-neutral-800/80 backdrop-blur-md shadow-apple">
            <div className="flex items-center gap-2 text-emerald-500 mb-1">
              <WifiOff className="w-4 h-4" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Cero Caídas</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white font-mono">100% Offline</div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400">Base local siempre activa</div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/70 dark:bg-[#111218]/70 border border-neutral-200/80 dark:border-neutral-800/80 backdrop-blur-md shadow-apple">
            <div className="flex items-center gap-2 text-cyan-500 mb-1">
              <Printer className="w-4 h-4" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Hardware</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white font-mono">Bluetooth</div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400">58mm y 80mm con logo</div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/70 dark:bg-[#111218]/70 border border-neutral-200/80 dark:border-neutral-800/80 backdrop-blur-md shadow-apple">
            <div className="flex items-center gap-2 text-amber-500 mb-1">
              <Building2 className="w-4 h-4" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Multi-Rubro</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white font-mono">+10 Módulos</div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400">Ferretería, Salud, Agro, Tienda</div>
          </div>

        </div>

      </section>

      {/* ======================================================== */}
      {/* 3. SHOWCASE INTERACTIVO EN VIVO (EL PRODUCTO SE VENDE SOLO) */}
      {/* ======================================================== */}
      <section id="interactive-demo" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-apple-blue/10 text-apple-blue text-xs font-semibold">
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Simulador Interactivo en Tiempo Real</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Experimenta Núcleo ERP ahora mismo
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Haz clic en los productos para agregarlos al carrito, introduce el billete y mira cómo se emite la factura instantáneamente.
          </p>
        </div>

        {/* Pestañas del Visor del Producto */}
        <div className="flex items-center justify-center overflow-x-auto no-scrollbar gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-[#121319] border border-neutral-200/80 dark:border-neutral-800 shadow-sm max-w-fit mx-auto">
          
          <button
            type="button"
            onClick={() => setActiveTab("pos")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "pos"
                ? "bg-apple-blue text-white shadow-md shadow-apple-blue/30"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>POS & Facturación</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("spatial")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "spatial"
                ? "bg-apple-blue text-white shadow-md shadow-apple-blue/30"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Constelación Espacial</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("inventory")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "inventory"
                ? "bg-apple-blue text-white shadow-md shadow-apple-blue/30"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Inventario Multi-Unidad</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("clinical")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "clinical"
                ? "bg-apple-blue text-white shadow-md shadow-apple-blue/30"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>Odontograma Dental</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("vet")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "vet"
                ? "bg-apple-blue text-white shadow-md shadow-apple-blue/30"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            <Dog className="w-3.5 h-3.5" />
            <span>Veterinaria</span>
          </button>

        </div>

        {/* Marco Tipo iPad / Pantalla de Cristal con el Módulo Activo */}
        <div className="rounded-3xl bg-white dark:bg-[#121318] border border-neutral-200/90 dark:border-neutral-800/90 shadow-2xl p-4 sm:p-7 transition-all">
          
          {/* TAB 1: SIMULADOR DE POS INTERACTIVO */}
          {activeTab === "pos" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fadeIn">
              
              {/* Catálogo Interactivo (Haz clic para agregar) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                      Mostrador de Ventas • Pulsa para añadir al ticket:
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-apple-blue font-semibold">TC: 36.62 C$/USD</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { name: "Varilla Corrugada 3/8\"", price: 135, unit: "vara", stock: "18 varas", cat: "Ferretería" },
                    { name: "Cemento Holcim 42.5kg", price: 345, unit: "saco", stock: "22 sacos", cat: "Materiales" },
                    { name: "Tubo PVC SDR-26 1/2\"", price: 125, unit: "tubo", stock: "45 tubos", cat: "Fontanería" },
                    { name: "Cable Eléctrico THHN #12", price: 28, unit: "metro", stock: "180 mtrs", cat: "Electricidad" },
                    { name: "Amoxicilina 500mg Caps", price: 85, unit: "caja", stock: "40 cajas", cat: "Farmacia" },
                    { name: "Limpieza Dental Profilaxis", price: 650, unit: "servicio", stock: "Disponible", cat: "Clínica" },
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => addSimItem(p.name, p.price, p.unit)}
                      className="p-3 rounded-2xl bg-neutral-50 dark:bg-[#181920] hover:bg-apple-blue/10 dark:hover:bg-apple-blue/15 border border-neutral-200/80 dark:border-neutral-800 text-left transition-all hover:scale-[1.02] cursor-pointer group space-y-1.5"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-apple-blue transition-colors">
                          {p.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-neutral-200/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono">
                          {p.unit}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-apple-blue font-mono">C$ {p.price.toFixed(2)}</span>
                        <span className="text-[10px] text-neutral-400">{p.stock}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Banner de denominaciones rápidas de efectivo */}
                <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 space-y-2">
                  <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block">
                    Billetes rápidos para pago (Centroamérica NIO):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[500, 1000, 1500, 2000].map((bill) => (
                      <button
                        key={bill}
                        type="button"
                        onClick={() => {
                          setSimTendered(bill);
                          setSimInvoicePrinted(false);
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                          simTendered === bill
                            ? "bg-apple-blue text-white border-apple-blue shadow-xs"
                            : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700 hover:border-apple-blue"
                        }`}
                      >
                        C$ {bill}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSimTendered(simTotal)}
                      className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                    >
                      Monto Exacto
                    </button>
                  </div>
                </div>

              </div>

              {/* Ticket en Vivo Simulado */}
              <div className="lg:col-span-5 p-5 rounded-3xl bg-neutral-50 dark:bg-[#16171f] border border-neutral-200/90 dark:border-neutral-800/90 font-mono text-xs space-y-3 shadow-inner">
                
                <div className="text-center pb-2 border-b border-dashed border-neutral-300 dark:border-neutral-700 space-y-0.5">
                  <p className="font-extrabold text-sm uppercase text-neutral-900 dark:text-white">FERRETERÍA EL TORNILLO DORADO</p>
                  <p className="text-[10px] text-neutral-500">RUC: J031000049102 • Chinandega, NI</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">FACTURA DE CONTADO #FAC-004812</p>
                </div>

                {/* Items del Carrito */}
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {simCart.map((it, i) => (
                    <div key={i} className="flex justify-between items-center text-[11px] pb-1 border-b border-neutral-200/50 dark:border-neutral-800/50">
                      <div>
                        <span className="font-semibold">{it.qty}x {it.name}</span>
                        <span className="text-[9px] text-neutral-400 block">({it.qty} {it.unit} @ C$ {it.price})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">C$ {(it.qty * it.price).toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => removeSimItem(it.name)}
                          className="text-red-400 hover:text-red-600 cursor-pointer text-xs"
                          title="Eliminar"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                  {simCart.length === 0 && (
                    <div className="py-6 text-center text-neutral-400 text-xs italic">
                      El carrito está vacío. Haz clic en un producto a la izquierda.
                    </div>
                  )}
                </div>

                {/* Desglose de Totales y Vuelto */}
                <div className="pt-2 border-t border-dashed border-neutral-300 dark:border-neutral-700 space-y-1 text-xs">
                  <div className="flex justify-between text-neutral-500">
                    <span>Subtotal:</span>
                    <span>C$ {simSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-500">
                    <span>IVA (15%):</span>
                    <span>C$ {simTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-neutral-900 dark:text-white pt-1 border-t border-neutral-200 dark:border-neutral-800">
                    <span>TOTAL FACTURA:</span>
                    <span className="text-apple-blue font-bold">C$ {simTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-neutral-400">
                    <span>Equiv. Dólares (USD):</span>
                    <span>$ {(simTotal / 36.62).toFixed(2)}</span>
                  </div>

                  <div className="pt-2 mt-1 border-t border-dashed border-neutral-300 dark:border-neutral-700 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Efectivo Pagado:</span>
                      <span className="font-bold">C$ {simTendered.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                      <span>VUELTO ENTREGADO:</span>
                      <span>C$ {simChange.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Botón de Emitir / Impresión Bluetooth */}
                <button
                  type="button"
                  onClick={() => setSimInvoicePrinted(true)}
                  disabled={simCart.length === 0}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{simInvoicePrinted ? "✓ ¡Ticket Impreso por Bluetooth!" : "Simular Cobro e Impresión Bluetooth"}</span>
                </button>

              </div>

            </div>
          )}

          {/* TAB 2: CONSTELACIÓN ESPACIAL INTERACTIVA */}
          {activeTab === "spatial" && (
            <div className="py-6 space-y-4 animate-fadeIn">
              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Red Espacial de Conectividad Modular
                </h3>
                <p className="text-xs text-neutral-500 max-w-xl mx-auto">
                  Toda tu empresa mapeada como una constelación viva: cada venta en caja sincroniza automáticamente el Kardex de inventario, actualiza la caja del turno y concilia con clientes.
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-neutral-900 dark:bg-black text-white relative overflow-hidden border border-neutral-800">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10 text-center">
                  
                  <div className="p-4 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 space-y-1">
                    <Package className="w-5 h-5 text-indigo-400 mx-auto" />
                    <div className="text-xs font-bold">Inventario & Kardex</div>
                    <div className="text-[11px] text-neutral-400 font-mono">312 unidades • 6 SKUs</div>
                    <span className="inline-block text-[10px] text-emerald-400">● Conectado en tiempo real</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-apple-blue/20 border border-apple-blue text-white space-y-1 shadow-lg shadow-apple-blue/20">
                    <Receipt className="w-6 h-6 text-apple-blue mx-auto" />
                    <div className="text-sm font-black">Ventas & POS Core</div>
                    <div className="text-xs font-mono font-bold text-cyan-300">C$ 5,433.00 (Turno)</div>
                    <span className="inline-block text-[10px] text-emerald-400">● 50 tickets procesados</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 space-y-1">
                    <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto" />
                    <div className="text-xs font-bold">Finanzas & Caja</div>
                    <div className="text-[11px] text-neutral-400 font-mono">C$ 148,920.00 acumulado</div>
                    <span className="inline-block text-[10px] text-emerald-400">● Conciliado al centavo</span>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INVENTARIO MULTI-UNIDAD */}
          {activeTab === "inventory" && (
            <div className="py-4 space-y-3 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Kardex Multi-Unidad & Trazabilidad de Lotes
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Vende varas de hierro, sacos de cemento, quintales de abono o metros de manguera con descuento milimétrico.
                  </p>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-apple-blue/10 text-apple-blue font-bold">
                  Stock Total: 312 unidades
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[10px] text-neutral-400 uppercase font-mono">
                      <th className="py-2">Producto</th>
                      <th className="py-2">Unidad</th>
                      <th className="py-2">Lote & Vencimiento</th>
                      <th className="py-2 text-right">Costo / Venta</th>
                      <th className="py-2 text-right">Margen Neto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    <tr>
                      <td className="py-2.5 font-bold">Varilla Corrugada 3/8" (9.5mm)</td>
                      <td className="py-2.5 text-neutral-500">Vara (6 metros)</td>
                      <td className="py-2.5 font-mono text-[11px]">LOTE-2026-01 <span className="text-emerald-500">● Vigente</span></td>
                      <td className="py-2.5 text-right font-mono">C$ 95.00 / C$ 135.00</td>
                      <td className="py-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">+C$ 40.00 (29.6%)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-bold">Fertilizante Urea Granulada 46%</td>
                      <td className="py-2.5 text-neutral-500">Saco (50 Kg)</td>
                      <td className="py-2.5 font-mono text-[11px]">LOT-UREA-2026 <span className="text-emerald-500">● Vigente (508d)</span></td>
                      <td className="py-2.5 text-right font-mono">C$ 750.00 / C$ 980.00</td>
                      <td className="py-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">+C$ 230.00 (23.5%)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-bold">Herbicida Glifosato 48% SL</td>
                      <td className="py-2.5 text-neutral-500">Litro (Envase)</td>
                      <td className="py-2.5 font-mono text-[11px] text-amber-500">LOT-AGRO-88 <span className="text-amber-500 font-bold">⚠️ Vence en 20 días</span></td>
                      <td className="py-2.5 text-right font-mono">C$ 190.00 / C$ 260.00</td>
                      <td className="py-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">+C$ 70.00 (26.9%)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ODONTOGRAMA DENTAL */}
          {activeTab === "clinical" && (
            <div className="py-4 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Odontograma FDI & Expediente Clínico Dental
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Registro de 32 piezas dentales, historial patológico y traspaso automático de procedimientos a caja.
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold">
                  Paciente: Carlos Mendoza (34 años)
                </span>
              </div>

              {/* Simulación visual de piezas dentales FDI */}
              <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-900 space-y-2">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">
                  Arcada Superior (Cuadrantes 1 y 2):
                </span>
                <div className="flex justify-center flex-wrap gap-1.5 font-mono text-[11px]">
                  {[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28].map((t) => (
                    <div
                      key={t}
                      className={`w-9 h-12 rounded-xl flex flex-col items-center justify-center border font-bold ${
                        t === 16 || t === 24
                          ? "bg-red-500/15 border-red-500 text-red-600 dark:text-red-400"
                          : t === 11 || t === 21
                          ? "bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400"
                          : "bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
                      }`}
                    >
                      <span className="text-[9px] text-neutral-400">#</span>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-4 text-[10px] font-semibold pt-1 text-neutral-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Caries / Por Tratar</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Restauración Realizada</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-neutral-300" /> Pieza Sana</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: VETERINARIA */}
          {activeTab === "vet" && (
            <div className="py-4 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Expediente Veterinario & Control de Vacunación
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Ficha médica de mascotas, carnet de desparasitación, citas de refuerzo y cobro de fármacos.
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                  Rocky (Golden Retriever • 29.5 Kg)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans">
                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-1">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase">Tutor / Dueño</span>
                  <div className="text-xs font-bold">Elena Castillo</div>
                  <div className="text-[11px] font-mono text-neutral-500">+505 8890-1234</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-1">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase">Vacuna Rabia</span>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">✓ Aplicada (Nobivac)</div>
                  <div className="text-[11px] text-neutral-500">Próximo refuerzo: Nov 2027</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-1">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase">Tratamiento Actual</span>
                  <div className="text-xs font-bold text-apple-blue">Desparasitación NexGard</div>
                  <div className="text-[11px] text-neutral-500">1 tableta masticable</div>
                </div>
              </div>
            </div>
          )}

        </div>

      </section>

      {/* ======================================================== */}
      {/* 4. BENTO GRID DE CARACTERÍSTICAS QUE VENDEN              */}
      {/* ======================================================== */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-apple-blue">
            Ventajas Competitivas
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Por qué los negocios eligen Núcleo ERP
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Diseñado específicamente para superar los problemas reales de conexión y facturación en nuestra región.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Card 1: 100% Offline-First */}
          <div className="p-7 rounded-3xl bg-white dark:bg-[#121319] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-3 relative overflow-hidden group hover:border-apple-blue/50 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <WifiOff className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              100% Offline-First Real
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              ¿Se cayó el internet en tu municipio? Con Núcleo sigues vendiendo, cobrando y emitiendo tickets sin retrasos. La base de datos local nunca se bloquea y se sincroniza cuando vuelve la señal.
            </p>
          </div>

          {/* Card 2: Impresión Bluetooth con Logo */}
          <div className="p-7 rounded-3xl bg-white dark:bg-[#121319] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-3 relative overflow-hidden group hover:border-apple-blue/50 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-apple-blue/10 text-apple-blue flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              Impresoras Térmicas Bluetooth
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Conecta impresoras de 58mm y 80mm desde tu teléfono, tablet o PC. Facturas térmicas con tu logo comercial nítido, RUC, código de barras y desglose de IVA oficial.
            </p>
          </div>

          {/* Card 3: Arqueo Z & Cuadre al Centavo */}
          <div className="p-7 rounded-3xl bg-white dark:bg-[#121319] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-3 relative overflow-hidden group hover:border-apple-blue/50 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              Caja Cuadrada al Centavo
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Arqueos de turno con denominaciones rápidas en Córdobas y Dólares. Conoce al instante si hay sobrante o faltante y calcula tu ganancia neta real basada en precio de compra vs venta.
            </p>
          </div>

        </div>

      </section>

      {/* ======================================================== */}
      {/* 5. SECCIÓN DE ACCESO RÁPIDO & DEMOS                      */}
      {/* ======================================================== */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12">
        
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-white via-neutral-50 to-neutral-100 dark:from-[#13141b] dark:via-[#111218] dark:to-[#0d0e13] border border-neutral-200/90 dark:border-neutral-800/90 shadow-2xl space-y-6 text-center">
          
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
              Entornos de Demostración con 1-Clic
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              Explora cualquiera de los perfiles comerciales preconfigurados sin necesidad de registrarte:
            </p>
          </div>

          {/* Tarjetas de Acceso 1-Clic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-left">
            
            <button
              type="button"
              onClick={() => quickLogin("admin", "admin123")}
              className="p-4 rounded-2xl bg-neutral-900 hover:bg-black text-white border border-neutral-800 transition-all hover:scale-[1.02] cursor-pointer shadow-md group space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-apple-green/20 text-apple-green font-bold">
                  ROOT GOD MODE
                </span>
                <span className="text-[11px] font-mono text-neutral-400">admin123</span>
              </div>
              <div className="font-bold text-xs flex items-center gap-1.5 text-white">
                <TerminalIcon className="w-4 h-4 text-apple-green" />
                <span>SuperAdmin Terminal</span>
              </div>
              <div className="text-[11px] text-neutral-400">
                Creación central de negocios, gestión de claves y switches de módulos.
              </div>
            </button>

            <button
              type="button"
              onClick={() => quickLogin("propietario", "1234", "tenant-ferreteria-1")}
              className="p-4 rounded-2xl bg-white dark:bg-[#181922] hover:bg-neutral-50 dark:hover:bg-[#1e1f2b] border border-neutral-200 dark:border-neutral-800 transition-all hover:scale-[1.02] cursor-pointer shadow-sm group space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-apple-blue/10 text-apple-blue font-bold">
                  DUEÑO COMERCIAL
                </span>
                <span className="text-[11px] font-mono text-neutral-400">1234</span>
              </div>
              <div className="font-bold text-xs flex items-center gap-1.5 text-neutral-900 dark:text-white">
                <Building2 className="w-4 h-4 text-apple-blue" />
                <span>Ferretería El Tornillo Dorado</span>
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Inventario por varas, sacos y metros, POS rápido y control de caja.
              </div>
            </button>

            <button
              type="button"
              onClick={() => quickLogin("clinica", "1234", "tenant-dental-2")}
              className="p-4 rounded-2xl bg-white dark:bg-[#181922] hover:bg-neutral-50 dark:hover:bg-[#1e1f2b] border border-neutral-200 dark:border-neutral-800 transition-all hover:scale-[1.02] cursor-pointer shadow-sm group space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold">
                  SALUD & DENTAL
                </span>
                <span className="text-[11px] font-mono text-neutral-400">1234</span>
              </div>
              <div className="font-bold text-xs flex items-center gap-1.5 text-neutral-900 dark:text-white">
                <Smile className="w-4 h-4 text-cyan-500" />
                <span>Clínica Dental Sonrisas</span>
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Odontograma interactivo FDI de 32 piezas y recetas médicas.
              </div>
            </button>

            <button
              type="button"
              onClick={() => quickLogin("veterinaria", "1234", "tenant-vet-3")}
              className="p-4 rounded-2xl bg-white dark:bg-[#181922] hover:bg-neutral-50 dark:hover:bg-[#1e1f2b] border border-neutral-200 dark:border-neutral-800 transition-all hover:scale-[1.02] cursor-pointer shadow-sm group space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                  VETERINARIA
                </span>
                <span className="text-[11px] font-mono text-neutral-400">1234</span>
              </div>
              <div className="font-bold text-xs flex items-center gap-1.5 text-neutral-900 dark:text-white">
                <Dog className="w-4 h-4 text-amber-500" />
                <span>Veterinaria San Francisco</span>
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Expedientes clínicos de mascotas y carnet de vacunas.
              </div>
            </button>

            <button
              type="button"
              onClick={() => quickLogin("caja1", "0000", "tenant-ferreteria-1")}
              className="p-4 rounded-2xl bg-white dark:bg-[#181922] hover:bg-neutral-50 dark:hover:bg-[#1e1f2b] border border-neutral-200 dark:border-neutral-800 transition-all hover:scale-[1.02] cursor-pointer shadow-sm group space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                  CAJERO DE TURNO
                </span>
                <span className="text-[11px] font-mono text-neutral-400">0000</span>
              </div>
              <div className="font-bold text-xs flex items-center gap-1.5 text-neutral-900 dark:text-white">
                <Receipt className="w-4 h-4 text-emerald-500" />
                <span>Cajero de Mostrador (Juan Carlos)</span>
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Acceso restringido únicamente a cobrar y arqueo de turno.
              </div>
            </button>

            <button
              type="button"
              onClick={() => quickLogin("bodega1", "1111", "tenant-ferreteria-1")}
              className="p-4 rounded-2xl bg-white dark:bg-[#181922] hover:bg-neutral-50 dark:hover:bg-[#1e1f2b] border border-neutral-200 dark:border-neutral-800 transition-all hover:scale-[1.02] cursor-pointer shadow-sm group space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold">
                  BODEGA & KARDEX
                </span>
                <span className="text-[11px] font-mono text-neutral-400">1111</span>
              </div>
              <div className="font-bold text-xs flex items-center gap-1.5 text-neutral-900 dark:text-white">
                <Package className="w-4 h-4 text-purple-500" />
                <span>Encargado de Bodega (Pedro)</span>
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Acceso exclusivo a recepción de compras y control de stock.
              </div>
            </button>

          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowLoginModal(true)}
              className="inline-flex items-center gap-2 text-xs font-bold text-apple-blue hover:underline cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>¿Tienes credenciales propias? Inicia sesión aquí</span>
            </button>
          </div>

        </div>

      </section>

      {/* ======================================================== */}
      {/* 6. MODAL DE LOGIN ULTRA ELEGANTE (GLASSMORPHISM)         */}
      {/* ======================================================== */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#14151c] text-neutral-900 dark:text-neutral-100 rounded-3xl p-6 sm:p-7 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-apple-blue/15 text-apple-blue flex items-center justify-center font-bold">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                    Acceso al Sistema
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Ingresa con tu usuario o clave de administrador
                  </p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              
              {/* Negocio */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Establecimiento / Negocio:
                </label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-semibold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.businessVertical})
                    </option>
                  ))}
                </select>
              </div>

              {/* Usuario */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Usuario o Correo:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="admin, propietario, clinica, caja1..."
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue"
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Contraseña o PIN:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white font-bold text-xs shadow-md shadow-apple-blue/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Ingresar al Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 text-[11px] text-neutral-500 space-y-1">
                <span className="font-bold block text-neutral-700 dark:text-neutral-300">
                  Credenciales de Demostración:
                </span>
                <p>• SuperAdmin: <strong>admin</strong> / <strong>admin123</strong></p>
                <p>• Dueños: <strong>propietario</strong>, <strong>clinica</strong> o <strong>veterinaria</strong> / <strong>1234</strong></p>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. FOOTER MINIMALISTA                                    */}
      {/* ======================================================== */}
      <footer className="relative z-10 w-full py-10 border-t border-neutral-200/80 dark:border-neutral-800/80 text-center text-xs text-neutral-500 dark:text-neutral-400 font-mono space-y-2">
        <div className="flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-neutral-800 dark:text-neutral-200">NÚCLEO ERP // Arquitectura Modular Empresarial</span>
        </div>
        <p className="text-[11px] text-neutral-400">
          Alta velocidad • Operación 100% Offline • Facturación Térmica Bluetooth • Centroamérica UTC-6
        </p>
      </footer>

    </div>
  );
};
