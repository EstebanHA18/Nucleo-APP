"use client";

import React, { useState } from "react";
import { 
  Users, 
  Search, 
  Plus, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  FileText, 
  X, 
  UserPlus,
  ArrowDownRight,
  Printer
} from "lucide-react";
import { Customer, TenantSettings } from "@/types";
import { saveStoredCustomers } from "@/lib/offlineStore";

interface ReceivablesManagerProps {
  tenant: TenantSettings;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
}

export const ReceivablesManager: React.FC<ReceivablesManagerProps> = ({
  tenant,
  customers,
  setCustomers,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(500);
  const [paymentNote, setPaymentNote] = useState<string>("Abono a cuenta de materiales");
  const [lastPaymentReceipt, setLastPaymentReceipt] = useState<any>(null);

  // New Customer form
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newTaxId, setNewTaxId] = useState("");
  const [newCreditLimit, setNewCreditLimit] = useState<number>(10000);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const totalDebt = customers.reduce((acc, c) => acc + c.currentBalance, 0);
  const totalLimit = customers.reduce((acc, c) => acc + c.creditLimit, 0);

  const handleOpenPayment = (customer: Customer) => {
    setSelectedCustomer(customer);
    setPaymentAmount(Math.min(customer.currentBalance, 1000));
    setShowPaymentModal(true);
  };

  const handleApplyPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || paymentAmount <= 0) return;

    const updated = customers.map((c) => {
      if (c.id === selectedCustomer.id) {
        const newBalance = Math.max(0, c.currentBalance - paymentAmount);
        return { ...c, currentBalance: newBalance };
      }
      return c;
    });

    setCustomers(updated);
    saveStoredCustomers(updated);

    setLastPaymentReceipt({
      receiptNumber: "REC-" + Math.floor(1000 + Math.random() * 9000),
      customerName: selectedCustomer.name,
      amount: paymentAmount,
      remainingBalance: Math.max(0, selectedCustomer.currentBalance - paymentAmount),
      date: new Date().toLocaleString("es-NI"),
      note: paymentNote,
    });

    setShowPaymentModal(false);
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newCust: Customer = {
      id: "cust-" + Date.now(),
      name: newName.trim(),
      phone: newPhone.trim(),
      taxId: newTaxId.trim() || undefined,
      allowCredit: true,
      creditLimit: Number(newCreditLimit),
      currentBalance: 0,
    };

    const updated = [...customers, newCust];
    setCustomers(updated);
    saveStoredCustomers(updated);
    setShowAddCustomerModal(false);

    setNewName("");
    setNewPhone("");
    setNewTaxId("");
  };

  return (
    <div className="space-y-6">
      
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple">
          <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Cartera de Fiados (Por Cobrar)
          </span>
          <div className="text-2xl font-extrabold text-apple-red tracking-tight font-mono mt-1">
            C$ {totalDebt.toLocaleString("es-NI", { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-neutral-500 mt-0.5 block">
            Saldo deudor activo en la calle
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple">
          <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Línea de Crédito Autorizada
          </span>
          <div className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight font-mono mt-1">
            C$ {totalLimit.toLocaleString("es-NI", { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-neutral-500 mt-0.5 block">
            Cupo total disponible para clientes
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
              Clientes con Crédito
            </span>
            <div className="text-2xl font-extrabold text-apple-blue tracking-tight mt-1">
              {customers.filter((c) => c.allowCredit).length}
            </div>
            <span className="text-[11px] text-neutral-500">Cuentas con historial</span>
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

      {/* Debtors List Table */}
      <div className="rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple overflow-hidden">
        <div className="p-4 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between gap-3">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cliente por nombre o teléfono..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700 text-xs focus:outline-none"
            />
          </div>
          <span className="text-xs text-neutral-400 font-mono">
            {customers.length} Cuentas Registradas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-900/60 text-neutral-400 font-semibold border-b border-neutral-200/80 dark:border-neutral-800">
              <tr>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Contacto & RUC</th>
                <th className="py-3 px-4">Límite de Crédito</th>
                <th className="py-3 px-4">Saldo Actual (Deuda)</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Cobranza / Abono</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60 font-medium text-neutral-800 dark:text-neutral-200">
              {filtered.map((c) => {
                const isOverdue = c.currentBalance > c.creditLimit && c.creditLimit > 0;
                return (
                  <tr key={c.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-neutral-900 dark:text-white block">
                        {c.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-500">
                      <div>{c.phone || "Sin teléfono"}</div>
                      <div className="text-[10px] text-neutral-400">{c.taxId || "Sin RUC"}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {c.allowCredit ? `C$ ${c.creditLimit.toLocaleString()}` : "Sin Crédito"}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold">
                      <span className={c.currentBalance > 0 ? "text-apple-red" : "text-apple-green"}>
                        C$ {c.currentBalance.toLocaleString("es-NI", { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {c.currentBalance === 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-apple-green/10 text-apple-green text-[10px] font-semibold">
                          Al Día
                        </span>
                      ) : isOverdue ? (
                        <span className="px-2 py-0.5 rounded-full bg-apple-red/10 text-apple-red text-[10px] font-semibold">
                          Excedido
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-apple-orange/10 text-apple-orange text-[10px] font-semibold">
                          Saldo Pendiente
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {c.currentBalance > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleOpenPayment(c)}
                          className="px-3 py-1.5 rounded-xl bg-apple-green hover:bg-emerald-600 text-white font-semibold text-[11px] shadow-sm transition-all"
                        >
                          Registrar Abono
                        </button>
                      ) : (
                        <span className="text-neutral-400 text-[11px]">Sin deuda</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment / Abono Modal */}
      {showPaymentModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-[#1c1c1e] text-neutral-900 dark:text-neutral-100 rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Registrar Abono de Fiado
              </h3>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 text-xs">
              <span className="text-neutral-500 block">Cliente:</span>
              <strong className="text-neutral-900 dark:text-white block text-sm">{selectedCustomer.name}</strong>
              <div className="flex justify-between mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                <span className="text-neutral-500">Saldo actual adeudado:</span>
                <span className="font-mono font-bold text-apple-red">C$ {selectedCustomer.currentBalance.toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handleApplyPayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                  Monto a Abonar (C$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={selectedCustomer.currentBalance}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono text-base font-bold text-apple-green focus:outline-none focus:ring-2 focus:ring-apple-green"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                  Concepto / Nota
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-apple-green hover:bg-emerald-600 text-white font-semibold shadow-sm"
                >
                  Confirmar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal for Abono */}
      {lastPaymentReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-xs bg-white dark:bg-[#1c1c1e] text-neutral-900 dark:text-neutral-100 rounded-3xl p-5 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="text-center font-mono text-xs border-b border-dashed border-neutral-300 dark:border-neutral-700 pb-2">
              <p className="font-bold uppercase tracking-wider">{tenant.name}</p>
              <p className="text-[10px] text-neutral-400">RECIBO OFICIAL DE ABONO</p>
              <p className="text-[10px] text-neutral-400">{lastPaymentReceipt.receiptNumber}</p>
              <p className="text-[9px] text-neutral-400">{lastPaymentReceipt.date}</p>
            </div>

            <div className="font-mono text-xs space-y-1.5">
              <div className="flex justify-between">
                <span>Cliente:</span>
                <span className="font-semibold">{lastPaymentReceipt.customerName}</span>
              </div>
              <div className="flex justify-between text-apple-green font-bold text-sm">
                <span>MONTO ABONADO:</span>
                <span>C$ {lastPaymentReceipt.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Saldo Restante:</span>
                <span className="font-bold">C$ {lastPaymentReceipt.remainingBalance.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-xl bg-apple-blue text-white text-xs font-semibold flex items-center justify-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir</span>
              </button>
              <button
                type="button"
                onClick={() => setLastPaymentReceipt(null)}
                className="py-2 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-[#1c1c1e] text-neutral-900 dark:text-neutral-100 rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Registrar Cliente con Crédito
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
                  Nombre Completo o Empresa
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej. Taller Santa Lucía"
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+505 8899-0011"
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                  Límite de Crédito Autorizado (C$)
                </label>
                <input
                  type="number"
                  value={newCreditLimit}
                  onChange={(e) => setNewCreditLimit(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
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
                  Crear Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
