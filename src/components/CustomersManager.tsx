"use client";

import React, { useState } from "react";
import { 
  Users, 
  Search, 
  Plus, 
  ShoppingBag, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  X, 
  UserPlus,
  Building2,
  CheckCircle2
} from "lucide-react";
import { Customer, TenantSettings } from "@/types";
import { saveStoredCustomers } from "@/lib/offlineStore";

interface CustomersManagerProps {
  tenant: TenantSettings;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
}

export const CustomersManager: React.FC<CustomersManagerProps> = ({
  tenant,
  customers,
  setCustomers,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // New Customer form
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [taxId, setTaxId] = useState("");
  const [city, setCity] = useState("Chinandega");
  const [address, setAddress] = useState("");

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.businessName && c.businessName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.phone.includes(searchQuery) ||
      (c.taxId && c.taxId.includes(searchQuery))
  );

  const totalAccumulatedSales = customers.reduce((acc, c) => acc + (c.totalPurchases || 0), 0);
  const corporateCustomers = customers.filter((c) => c.taxId && c.taxId.length > 5).length;

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCust: Customer = {
      id: "cust-" + Date.now(),
      name: name.trim(),
      businessName: businessName.trim() || undefined,
      phone: phone.trim(),
      email: email.trim() || undefined,
      taxId: taxId.trim() || undefined,
      city: city.trim(),
      address: address.trim() || undefined,
      totalPurchases: 0,
      lastPurchaseDate: new Date().toISOString().split("T")[0],
    };

    const updated = [...customers, newCust];
    setCustomers(updated);
    saveStoredCustomers(updated);
    setShowAddCustomerModal(false);

    setName("");
    setBusinessName("");
    setPhone("");
    setEmail("");
    setTaxId("");
    setAddress("");
  };

  return (
    <div className="space-y-6">
      
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple">
          <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Directorio de Clientes
          </span>
          <div className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight mt-1">
            {customers.length} Registrados
          </div>
          <span className="text-[11px] text-neutral-500 mt-0.5 block">
            Cartera de compradores activos
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple">
          <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Clientes con RUC / Corporativos
          </span>
          <div className="text-2xl font-extrabold text-apple-blue tracking-tight font-mono mt-1">
            {corporateCustomers} Empresas
          </div>
          <span className="text-[11px] text-neutral-500 mt-0.5 block">
            Facturas fiscales registradas
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
              Volumen Histórico Comprado
            </span>
            <div className="text-2xl font-extrabold text-apple-green tracking-tight font-mono mt-1">
              C$ {totalAccumulatedSales.toLocaleString("es-NI", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-neutral-500">100% cobrado al contado</span>
          </div>
          <button
            type="button"
            onClick={() => setShowAddCustomerModal(true)}
            className="p-3 rounded-2xl bg-apple-blue/10 text-apple-blue hover:bg-apple-blue hover:text-white transition-all shadow-sm"
          >
            <UserPlus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Customers List Table */}
      <div className="rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple overflow-hidden">
        <div className="p-4 border-b border-neutral-200/80 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, RUC, empresa o teléfono..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700 text-xs focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowAddCustomerModal(true)}
            className="px-4 py-2 rounded-2xl bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Cliente</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-900/60 text-neutral-400 font-semibold border-b border-neutral-200/80 dark:border-neutral-800">
              <tr>
                <th className="py-3 px-4">Cliente / Contacto</th>
                <th className="py-3 px-4">Razón Social & RUC</th>
                <th className="py-3 px-4">Teléfono / WhatsApp</th>
                <th className="py-3 px-4">Ubicación</th>
                <th className="py-3 px-4">Compras Acumuladas</th>
                <th className="py-3 px-4 text-right">Última Compra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60 font-medium text-neutral-800 dark:text-neutral-200">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-neutral-900 dark:text-white block">
                      {c.name}
                    </span>
                    {c.email && (
                      <span className="text-[10px] text-neutral-400 block font-mono">
                        {c.email}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200 block">
                      {c.businessName || "Persona Natural"}
                    </span>
                    <span className="font-mono text-[11px] text-neutral-400">
                      {c.taxId || "Sin RUC"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-600 dark:text-neutral-300">
                    {c.phone || "—"}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-neutral-700 dark:text-neutral-300 block">
                      {c.city || "Nicaragua"}
                    </span>
                    {c.address && (
                      <span className="text-[10px] text-neutral-400 truncate max-w-[180px] block">
                        {c.address}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-apple-blue">
                    C$ {(c.totalPurchases || 0).toLocaleString("es-NI", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-neutral-500 text-[11px]">
                    {c.lastPurchaseDate || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#1c1c1e] text-neutral-900 dark:text-neutral-100 rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Registrar Cliente en Directorio
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(false)}
                className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                  Nombre de Contacto / Representante
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Ing. Carlos Martínez"
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                    Empresa / Razón Social (Opcional)
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Constructora Martínez S.A."
                    className="w-full px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                    RUC / Cédula
                  </label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="J0310000192841"
                    className="w-full px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+505 8899-0011"
                    className="w-full px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                    Ciudad / Municipio
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Chinandega"
                    className="w-full px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                  Correo Electrónico (Para envío de facturas)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="carlos@empresa.com"
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                  Dirección de Entrega / Despacho
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Km 132 Carretera Panamericana"
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white font-semibold shadow-sm"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
