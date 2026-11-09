"use client";

import React, { useState } from "react";
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  KeyRound, 
  Receipt, 
  Package, 
  Check, 
  Trash2, 
  LogIn, 
  X, 
  Phone, 
  Mail,
  UserCheck,
  AlertCircle
} from "lucide-react";
import { AppUser, TenantSettings, UserRole, ModuleKey } from "@/types";
import { saveStoredUsers, saveCurrentUser } from "@/lib/offlineStore";
import { AVAILABLE_MODULES } from "@/lib/constants";

interface UsersManagerProps {
  tenant: TenantSettings;
  users: AppUser[];
  setUsers: React.Dispatch<React.SetStateAction<AppUser[]>>;
  currentUser: AppUser;
  onSwitchUser: (user: AppUser) => void;
}

export const UsersManager: React.FC<UsersManagerProps> = ({
  tenant,
  users,
  setUsers,
  currentUser,
  onSwitchUser,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form fields
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [pinCode, setPinCode] = useState("0000");
  const [role, setRole] = useState<UserRole>("cashier");
  const [selectedModules, setSelectedModules] = useState<ModuleKey[]>(["pos"]);

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === "cashier") {
      setSelectedModules(["pos"]);
    } else if (newRole === "inventory_clerk") {
      setSelectedModules(["inventory"]);
    } else if (newRole === "supervisor") {
      setSelectedModules(["pos", "inventory", "customers"]);
    } else if (newRole === "owner") {
      setSelectedModules(tenant.activeModules);
    }
  };

  const toggleModuleSelection = (key: ModuleKey) => {
    if (selectedModules.includes(key)) {
      setSelectedModules(selectedModules.filter((m) => m !== key));
    } else {
      setSelectedModules([...selectedModules, key]);
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !pinCode.trim()) return;

    let roleLabel = "Cajero de Mostrador";
    if (role === "inventory_clerk") roleLabel = "Encargado de Inventario";
    if (role === "supervisor") roleLabel = "Supervisor de Turno";
    if (role === "owner") roleLabel = "Propietario / Dueño";
    if (role === "custom") roleLabel = "Personalizado";

    const newUser: AppUser = {
      id: "usr-" + Date.now(),
      fullName: fullName.trim(),
      username: username.trim() || fullName.toLowerCase().replace(/\s+/g, ""),
      phone: phone.trim() || undefined,
      pinCode: pinCode.trim(),
      role,
      roleLabel,
      allowedModules: selectedModules.length > 0 ? selectedModules : ["pos"],
      active: true,
      createdAt: new Date().toISOString(),
    };

    const updated = [...users, newUser];
    setUsers(updated);
    saveStoredUsers(updated);
    setShowAddModal(false);

    // Reset
    setFullName("");
    setUsername("");
    setPhone("");
    setPinCode("0000");
    setRole("cashier");
    setSelectedModules(["pos"]);
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === "usr-owner" || users.length <= 1) {
      alert("No se puede eliminar al propietario principal del negocio.");
      return;
    }
    if (confirm("¿Estás seguro de eliminar este acceso de usuario?")) {
      const updated = users.filter((u) => u.id !== userId);
      setUsers(updated);
      saveStoredUsers(updated);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-apple-blue/10 text-apple-blue flex items-center justify-center font-bold text-sm">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white">
                Control de Usuarios & Accesos por Rol
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-apple-green/10 text-apple-green text-[10px] font-semibold">
                Gestión del Dueño
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Crea perfiles exclusivos para tus <strong>Cajeros</strong> (solo ven POS) y <strong>Bodegueros</strong> (solo ven Inventario).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-semibold shadow-md shadow-apple-blue/25 transition-all flex items-center gap-1.5"
        >
          <UserPlus className="w-4 h-4" />
          <span>Crear Nuevo Usuario</span>
        </button>
      </div>

      {/* Role explanation cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Cajero */}
        <div className="p-4 rounded-2xl bg-apple-blue/5 dark:bg-apple-blue/10 border border-apple-blue/20">
          <div className="flex items-center gap-2 mb-1.5 text-apple-blue">
            <Receipt className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wide">Perfil: Cajero</h4>
          </div>
          <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Solo tiene acceso al <strong>Terminal POS</strong> y Caja. No puede ver el inventario total ni clientes ni configuración del dueño.
          </p>
        </div>

        {/* Bodeguero */}
        <div className="p-4 rounded-2xl bg-apple-purple/5 dark:bg-apple-purple/10 border border-apple-purple/20">
          <div className="flex items-center gap-2 mb-1.5 text-apple-purple">
            <Package className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wide">Perfil: Bodeguero</h4>
          </div>
          <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Solo tiene acceso a <strong>Inventario & Kardex</strong> (ajustes de stock, lotes y entradas). No puede ver ventas ni caja.
          </p>
        </div>

        {/* Dueño */}
        <div className="p-4 rounded-2xl bg-apple-green/5 dark:bg-apple-green/10 border border-apple-green/20">
          <div className="flex items-center gap-2 mb-1.5 text-apple-green">
            <ShieldCheck className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wide">Perfil: Propietario</h4>
          </div>
          <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Acceso absoluto a todos los módulos activos del negocio, métricas de ganancias y creación de nuevos usuarios.
          </p>
        </div>

      </div>

      {/* Users Table */}
      <div className="rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple overflow-hidden">
        <div className="p-4 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
            Usuarios del Sistema ({users.length})
          </h3>
          <span className="text-[11px] text-neutral-400 font-mono">
            Sesión actual: <strong>{currentUser.fullName} ({currentUser.roleLabel})</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-900/60 text-neutral-400 font-semibold border-b border-neutral-200/80 dark:border-neutral-800">
              <tr>
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Rol Asignado</th>
                <th className="py-3 px-4">PIN de Acceso</th>
                <th className="py-3 px-4">Paneles Permitidos</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Simular / Entrar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60 font-medium text-neutral-800 dark:text-neutral-200">
              {users.map((u) => {
                const isCurrent = currentUser.id === u.id;
                return (
                  <tr key={u.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          u.role === "owner" 
                            ? "bg-apple-green/10 text-apple-green" 
                            : u.role === "cashier"
                            ? "bg-apple-blue/10 text-apple-blue"
                            : "bg-apple-purple/10 text-apple-purple"
                        }`}>
                          {u.fullName.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-neutral-900 dark:text-white block">
                            {u.fullName} {isCurrent && <span className="text-apple-blue text-[10px] font-normal">(Sesión Actual)</span>}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            Usuario: @{u.username}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        u.role === "owner"
                          ? "bg-apple-green/10 text-apple-green"
                          : u.role === "cashier"
                          ? "bg-apple-blue/10 text-apple-blue"
                          : "bg-apple-purple/10 text-apple-purple"
                      }`}>
                        {u.roleLabel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                        •••• ({u.pinCode})
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {u.allowedModules.map((m) => (
                          <span
                            key={m}
                            className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[9px] font-mono uppercase text-neutral-600 dark:text-neutral-400"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-apple-green/10 text-apple-green text-[10px] font-semibold">
                        Activo
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSwitchUser(u)}
                          className={`px-3 py-1 rounded-xl text-[11px] font-semibold transition-all flex items-center gap-1 ${
                            isCurrent
                              ? "bg-neutral-200 dark:bg-neutral-700 text-neutral-500 cursor-default"
                              : "bg-apple-blue hover:bg-apple-blue-hover text-white shadow-sm"
                          }`}
                        >
                          <LogIn className="w-3 h-3" />
                          <span>{isCurrent ? "En uso" : "Entrar como"}</span>
                        </button>

                        {u.role !== "owner" && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1 rounded-lg text-neutral-400 hover:text-apple-red transition-colors"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Crear Usuario */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-[#1c1c1e] text-neutral-900 dark:text-neutral-100 rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-apple-blue" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Crear Nuevo Acceso de Usuario
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                    Nombre del Empleado
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. Juan Cajero"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs focus:ring-2 focus:ring-apple-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                    Usuario / Login
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="caja1"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                    Rol en la Empresa
                  </label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-semibold"
                  >
                    <option value="cashier">Cajero (Solo Terminal POS & Caja)</option>
                    <option value="inventory_clerk">Bodeguero (Solo Inventario & Kardex)</option>
                    <option value="supervisor">Supervisor (POS + Inventario + Clientes)</option>
                    <option value="owner">Propietario / Dueño (Acceso Total)</option>
                    <option value="custom">Personalizado (Elegir módulos)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                    PIN Rápido (4 dígitos)
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="0000"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-mono tracking-widest text-center"
                  />
                </div>
              </div>

              {/* Selector de módulos permitidos */}
              <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80 space-y-2">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                  Paneles a los que este usuario tendrá acceso:
                </span>

                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_MODULES.map((mod) => {
                    const isChecked = selectedModules.includes(mod.key);
                    return (
                      <div
                        key={mod.key}
                        onClick={() => toggleModuleSelection(mod.key)}
                        className={`p-2 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                          isChecked
                            ? "bg-apple-blue/10 border-apple-blue text-apple-blue font-semibold"
                            : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500"
                        }`}
                      >
                        <span className="truncate">{mod.name}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white font-semibold shadow-sm"
                >
                  Guardar y Activar Usuario
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
