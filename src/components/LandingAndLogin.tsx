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
  Calendar, 
  Building2, 
  Smile, 
  Dog, 
  Clock, 
  HelpCircle,
  Eye,
  EyeOff
} from "lucide-react";
import { TenantSettings, AppUser } from "@/types";
import { getCentralAmericaNow, formatCentralAmericaDate } from "@/lib/centralAmericaBilling";

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
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [selectedTenantId, setSelectedTenantId] = useState<string>(tenants[0]?.id || "");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [currentTimeStr, setCurrentTimeStr] = useState("");

  // Reloj en tiempo real para Centroamérica (UTC-6)
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

  // Manejador de Login
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

    // 2. Buscar en la lista de usuarios
    const matchedUser = users.find(
      (u) =>
        (u.username.toLowerCase() === userClean || u.email?.toLowerCase() === userClean) &&
        (u.password === passClean || u.pinCode === passClean)
    );

    if (matchedUser) {
      // Determinar a qué tenant pertenece
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

    setLoginError("Credenciales incorrectas. Para administración utiliza usuario: admin / contraseña: admin123");
  };

  // Acceso Rápido 1-Click para Demos
  const quickLogin = (user: string, pass: string, tenantId?: string) => {
    setUsernameInput(user);
    setPasswordInput(pass);
    if (tenantId) setSelectedTenantId(tenantId);
    setLoginError(null);

    // Auto submit
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
    }, 150);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#090a0d] text-neutral-900 dark:text-neutral-100 font-sans selection:bg-apple-blue selection:text-white transition-colors duration-300">
      
      {/* Barra de Navegación Superior */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/70 dark:bg-[#0c0d11]/70 border-b border-neutral-200/60 dark:border-neutral-800/60 px-6 py-3.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-linear-to-tr from-apple-blue to-cyan-400 text-white flex items-center justify-center font-bold text-base shadow-md shadow-apple-blue/20">
              N
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-neutral-900 dark:text-white">
                NÚCLEO <span className="text-apple-blue">ERP</span>
              </span>
              <span className="text-[10px] text-neutral-400 block font-mono">v3.5 Modular Suite</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Reloj Centroamérica UTC-6 */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/60 text-[11px] font-mono text-neutral-600 dark:text-neutral-300">
              <Clock className="w-3.5 h-3.5 text-apple-blue" />
              <span>{currentTimeStr || "Centroamérica UTC-6"}</span>
            </div>

            {/* Toggle Dark Mode */}
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            <a
              href="#login-section"
              className="px-4 py-2 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Acceso al Sistema</span>
            </a>
          </div>
        </div>
      </header>

      {/* Contenido Principal: Hero + Bento Grid + Login Box */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-12 lg:py-16 space-y-16">
        
        {/* HERO SECTION */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-apple-blue/10 border border-apple-blue/30 text-apple-blue text-xs font-semibold animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Facturación Precisa Centroamérica: Corte cada 10 • Pago al 5</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-neutral-900 dark:text-white leading-[1.1]">
            El Sistema Operativo Modular para tu <span className="bg-linear-to-r from-apple-blue to-teal-400 bg-clip-text text-transparent">Negocio</span>
          </h1>

          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-2xl mx-auto">
            Terminal POS ultra veloz, inventario multi-unidad con lotes y vencimientos, expedientes veterinarios y odontograma interactivo. 100% Offline-first diseñado con elegancia y precisión contable.
          </p>
        </div>

        {/* SECCIÓN DOBLE: LOGIN MODERNO + PILARES CLAVE */}
        <div id="login-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUMNA IZQUIERDA: ACCESO / LOGIN ULTRA ELEGANTE */}
          <div className="lg:col-span-5 space-y-5">
            <div className="p-7 rounded-3xl bg-white dark:bg-[#15161b] border border-neutral-200/80 dark:border-neutral-800 shadow-2xl space-y-5">
              
              <div className="pb-4 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
                    Iniciar Sesión
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Ingresa con tu cuenta de negocio o administrador
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-apple-blue flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
              </div>

              {/* Formulario de Login */}
              <form onSubmit={handleLogin} className="space-y-4">
                
                {/* Selector de Negocio / Sucursal */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Seleccionar Negocio / Establecimiento:
                  </label>
                  <select
                    value={selectedTenantId}
                    onChange={(e) => setSelectedTenantId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue"
                  >
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.businessVertical})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Campo Usuario */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Usuario o Correo:
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="admin, propietario, clinica..."
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue"
                    />
                  </div>
                </div>

                {/* Campo Contraseña */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Contraseña / Clave de Acceso:
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Mensaje de error si falla */}
                {loginError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 font-medium">
                    {loginError}
                  </div>
                )}

                {/* Botón Principal de Acceso */}
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-bold shadow-md shadow-apple-blue/20 flex items-center justify-center gap-2 transition-all"
                >
                  <span>Ingresar al Panel</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* SECCIÓN DE ACCESOS RÁPIDOS 1-CLICK */}
              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800/80 space-y-2.5">
                <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
                  Accesos Rápidos Demo (1-Click):
                </span>

                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => quickLogin("admin", "admin123")}
                    className="w-full p-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-mono font-semibold flex items-center justify-between border border-neutral-800 transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <TerminalIcon className="w-4 h-4 text-apple-green" />
                      <span>👑 SuperAdmin Terminal (God Mode)</span>
                    </div>
                    <span className="text-[10px] text-apple-green">admin / admin123</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => quickLogin("propietario", "1234", "tenant-ferreteria-1")}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/70 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold flex items-center justify-between transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-apple-blue" />
                      <span>Ferretería El Tornillo Dorado (Dueño)</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">propietario / 1234</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => quickLogin("clinica", "1234", "tenant-dental-2")}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/70 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold flex items-center justify-between transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Smile className="w-4 h-4 text-cyan-500" />
                      <span>Clínica Dental Sonrisas (Odontograma)</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">clinica / 1234</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => quickLogin("veterinaria", "1234", "tenant-vet-3")}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/70 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold flex items-center justify-between transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Dog className="w-4 h-4 text-amber-500" />
                      <span>Veterinaria San Francisco (Mascotas)</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">veterinaria / 1234</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* COLUMNA DERECHA: BENTO GRID CON LAS CAPACIDADES ULTRA MODERNAS */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Tarjeta Destacada 1: Facturación con Corte el 10 y Pago el 5 */}
            <div className="p-6 rounded-3xl bg-linear-to-br from-white to-neutral-50 dark:from-[#15161b] dark:to-[#0f1013] border border-neutral-200/80 dark:border-neutral-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-apple-blue font-bold text-xs">
                  <Calendar className="w-4 h-4" />
                  <span>FACTURADOR SAAS PRECISO // CENTROAMÉRICA UTC-6</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold">
                  Día 10 Corte • Día 5 Pago
                </span>
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                Facturación Proporcional y Ciclos de Cobro Exactos
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                El sistema calcula con rigor milimétrico la fecha de alta de cada cliente. Si contratas a mitad de mes, tu primer cobro se prorratea automáticamente por los días exactos consumidos hasta el día 10.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-2 text-center font-mono">
                <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80">
                  <span className="text-[10px] text-neutral-400 block">DÍA DE CORTE</span>
                  <span className="text-sm font-bold text-apple-blue">Cada 10 de Mes</span>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80">
                  <span className="text-[10px] text-neutral-400 block">ÚLTIMO DÍA PAGO</span>
                  <span className="text-sm font-bold text-emerald-500">Cada 05 de Mes</span>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80">
                  <span className="text-[10px] text-neutral-400 block">PRORRATEO</span>
                  <span className="text-sm font-bold text-neutral-800 dark:text-white">Días Reales</span>
                </div>
              </div>
            </div>

            {/* Grid 2 Columnas de Módulos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* POS & Bluetooth */}
              <div className="p-5 rounded-3xl bg-white dark:bg-[#15161b] border border-neutral-200/80 dark:border-neutral-800 shadow-md space-y-2">
                <div className="w-8 h-8 rounded-xl bg-apple-blue/15 text-apple-blue flex items-center justify-center font-bold">
                  <Printer className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                  Ticket con Logo & Bluetooth ESC/POS
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Impresión térmica en 80mm y 58mm portátil. Carga tu logotipo comercial y conéctate directamente por Bluetooth.
                </p>
              </div>

              {/* Odontograma & Clínicas */}
              <div className="p-5 rounded-3xl bg-white dark:bg-[#15161b] border border-neutral-200/80 dark:border-neutral-800 shadow-md space-y-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-500 flex items-center justify-center font-bold">
                  <Smile className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                  Odontograma FDI & Expedientes
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Mapa interactivo de 32 piezas dentales, recetas médicas y cobro de insumos de bodega en la terminal de caja.
                </p>
              </div>

              {/* Veterinaria & Vacunas */}
              <div className="p-5 rounded-3xl bg-white dark:bg-[#15161b] border border-neutral-200/80 dark:border-neutral-800 shadow-md space-y-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold">
                  <Dog className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                  Veterinaria & Fármacos de Bodega
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Historial clínico de mascotas, carnet de vacunas y desparasitación con alertas, y despacho automático a caja.
                </p>
              </div>

              {/* SuperAdmin God Mode */}
              <div className="p-5 rounded-3xl bg-white dark:bg-[#15161b] border border-neutral-200/80 dark:border-neutral-800 shadow-md space-y-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center font-bold">
                  <TerminalIcon className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                  SuperAdmin Central // God Mode
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Creación centralizada de negocios, asignación de tarifas pactadas en USD y administración completa de contraseñas.
                </p>
              </div>

            </div>

          </div>

        </div>

      </main>

      {/* Footer Minimalista */}
      <footer className="w-full py-8 border-t border-neutral-200/80 dark:border-neutral-800/80 text-center text-xs text-neutral-400 font-mono space-y-1">
        <p>NÚCLEO ERP // Arquitectura Modular Empresarial para Centroamérica</p>
        <p className="text-[10px] text-neutral-500">
          Desarrollado para alta velocidad, modo offline y sincronización fiscal en Nicaragua y la región.
        </p>
      </footer>

    </div>
  );
};
