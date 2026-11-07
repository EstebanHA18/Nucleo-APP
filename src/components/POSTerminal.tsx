"use client";

import React, { useState } from "react";
import { 
  Receipt, 
  Search, 
  Barcode, 
  Plus, 
  Minus, 
  Trash2, 
  Check, 
  Printer, 
  CreditCard, 
  Banknote, 
  Clock, 
  UserPlus, 
  AlertCircle,
  TrendingUp,
  X,
  FileCheck
} from "lucide-react";
import { Product, Customer, CartItem, Sale, TenantSettings } from "@/types";
import { recordSaleLocally } from "@/lib/offlineStore";

interface POSTerminalProps {
  tenant: TenantSettings;
  products: Product[];
  customers: Customer[];
  onSaleComplete: (sale: Sale, updatedProducts: Product[], updatedCustomers: Customer[]) => void;
}

export const POSTerminal: React.FC<POSTerminalProps> = ({
  tenant,
  products,
  customers,
  onSaleComplete,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(customers[3] || customers[0]); // Default Contado
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "credit" | "card" | "transfer">("cash");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  const categories = ["Todos", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));
    const matchesCat = selectedCategory === "Todos" || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(`¡No hay stock disponible de ${product.name}!`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Stock máximo alcanzado (${product.stock} ${product.unit})`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unitPrice,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          unit: product.unit,
          unitPrice: product.salePrice,
          subtotal: product.salePrice,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) {
              alert(`Stock máximo alcanzado (${item.product.stock} ${item.product.unit})`);
              return item;
            }
            return {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  // Totales
  const subtotal = cart.reduce((acc, it) => acc + it.subtotal, 0);
  const costTotal = cart.reduce((acc, it) => acc + it.product.costPrice * it.quantity, 0);
  const tax = subtotal * (tenant.taxPercentage / 100);
  const total = subtotal + tax;
  const netProfit = total - costTotal;

  const handleCheckout = () => {
    if (cart.length === 0) return;

    // Validación de crédito / fiado
    if (paymentMethod === "credit") {
      if (!selectedCustomer.allowCredit) {
        alert(`El cliente ${selectedCustomer.name} no tiene crédito autorizado.`);
        return;
      }
      if (selectedCustomer.currentBalance + total > selectedCustomer.creditLimit) {
        alert(
          `¡Límite de crédito excedido!\nLímite: C$ ${selectedCustomer.creditLimit}\nSaldo actual: C$ ${selectedCustomer.currentBalance}\nEsta venta: C$ ${total}`
        );
        return;
      }
    }

    const saleRecord: Sale = {
      id: "sale-" + Date.now(),
      invoiceNumber: "FAC-" + Math.floor(100000 + Math.random() * 900000),
      customer: selectedCustomer,
      paymentMethod,
      items: [...cart],
      subtotal,
      tax,
      total,
      costTotal,
      profit: netProfit,
      currency: tenant.currency,
      exchangeRate: tenant.exchangeRate,
      createdAt: new Date().toISOString(),
    };

    // Registrar localmente (descuenta inventario y actualiza saldo de crédito si aplica)
    const { updatedProducts, updatedCustomers } = recordSaleLocally(saleRecord);

    setLastSale(saleRecord);
    setShowReceiptModal(true);
    setCart([]);
    onSaleComplete(saleRecord, updatedProducts, updatedCustomers);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* Left Column: Product Search & Grid */}
      <div className="lg:col-span-7 space-y-4">
        
        {/* Search & Filters */}
        <div className="p-4 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Escanear código de barras o buscar producto..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 text-xs focus:outline-none focus:ring-2 focus:ring-apple-blue"
              />
            </div>
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-500 font-mono">
              <Barcode className="w-4 h-4 text-apple-blue" />
              <span className="hidden sm:inline">Escáner Listo</span>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-apple-blue text-white shadow-sm"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredProducts.map((p) => {
            const isOutOfStock = p.stock <= 0;
            const isLowStock = p.stock <= p.minStock && !isOutOfStock;
            return (
              <div
                key={p.id}
                onClick={() => !isOutOfStock && addToCart(p)}
                className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                  isOutOfStock
                    ? "bg-neutral-100/60 dark:bg-neutral-900/40 border-neutral-200/60 dark:border-neutral-800/60 opacity-50 cursor-not-allowed"
                    : "bg-white dark:bg-[#1c1c1e] hover:bg-neutral-50 dark:hover:bg-neutral-800/80 border-neutral-200/80 dark:border-neutral-800/80 shadow-apple hover:shadow-apple-hover hover:-translate-y-0.5 cursor-pointer"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-neutral-400">
                      {p.sku}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      isOutOfStock
                        ? "bg-apple-red/10 text-apple-red"
                        : isLowStock
                        ? "bg-apple-orange/10 text-apple-orange"
                        : "bg-apple-green/10 text-apple-green"
                    }`}>
                      {p.stock} {p.unit}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white line-clamp-2 leading-snug">
                    {p.name}
                  </h4>
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">
                    {p.category}
                  </span>
                </div>

                <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
                  <div className="font-mono text-xs font-bold text-apple-blue">
                    C$ {p.salePrice.toFixed(2)}
                  </div>
                  <div className="w-6 h-6 rounded-lg bg-apple-blue/10 dark:bg-apple-blue/20 text-apple-blue flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Checkout Cart & Billing Panel */}
      <div className="lg:col-span-5 space-y-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-4">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-apple-blue" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Ticket de Venta
              </h3>
            </div>
            <span className="text-xs font-mono text-neutral-500">
              {cart.length} {cart.length === 1 ? "artículo" : "artículos"}
            </span>
          </div>

          {/* Customer Selection */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 mb-1">
              Cliente de la Factura
            </label>
            <select
              value={selectedCustomer.id}
              onChange={(e) => {
                const found = customers.find((c) => c.id === e.target.value);
                if (found) setSelectedCustomer(found);
              }}
              className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-apple-blue"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.allowCredit ? `(Crédito: C$ ${c.creditLimit})` : "(Solo Contado)"}
                </option>
              ))}
            </select>
          </div>

          {/* Cart Item List */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-neutral-400 text-xs">
                El carrito está vacío. Haz clic en un producto para agregarlo.
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-neutral-900 dark:text-white truncate">
                      {item.product.name}
                    </h5>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      C$ {item.unitPrice.toFixed(2)} / {item.unit}
                    </span>
                  </div>

                  {/* Quantity stepper */}
                  <div className="flex items-center gap-1.5 bg-neutral-200/80 dark:bg-neutral-700 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-5 h-5 flex items-center justify-center rounded hover:bg-white dark:hover:bg-neutral-600 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-mono font-bold text-neutral-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-5 h-5 flex items-center justify-center rounded hover:bg-white dark:hover:bg-neutral-600 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-neutral-900 dark:text-white block">
                      C$ {item.subtotal.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-apple-red hover:opacity-80 text-[10px]"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 mb-1.5">
              Método de Pago
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                  paymentMethod === "cash"
                    ? "bg-white dark:bg-neutral-700 text-apple-blue shadow-sm"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>Efectivo</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("credit")}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                  paymentMethod === "credit"
                    ? "bg-white dark:bg-neutral-700 text-apple-blue shadow-sm"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Fiado</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                  paymentMethod === "card"
                    ? "bg-white dark:bg-neutral-700 text-apple-blue shadow-sm"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Tarjeta</span>
              </button>
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="pt-3 border-t border-neutral-200/80 dark:border-neutral-800 space-y-1.5 text-xs">
            <div className="flex justify-between text-neutral-500">
              <span>Subtotal:</span>
              <span className="font-mono">C$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>IVA ({tenant.taxPercentage}%):</span>
              <span className="font-mono">C$ {tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-apple-green font-semibold">
              <span>Margen / Ganancia estimada:</span>
              <span className="font-mono">+C$ {netProfit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-neutral-200/80 dark:border-neutral-800">
              <span className="text-sm font-bold text-neutral-900 dark:text-white">TOTAL:</span>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-apple-blue font-mono">
                  C$ {total.toFixed(2)}
                </span>
                <span className="text-[11px] text-neutral-400 block font-mono">
                  ≈ $ {(total / tenant.exchangeRate).toFixed(2)} USD
                </span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={handleCheckout}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-xs tracking-wide transition-all shadow-md flex items-center justify-center gap-2 ${
              cart.length === 0
                ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"
                : "bg-apple-blue hover:bg-apple-blue-hover text-white shadow-apple-blue/30 cursor-pointer"
            }`}
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Emitir Factura & Descontar Stock</span>
          </button>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {showReceiptModal && lastSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-[#1c1c1e] text-neutral-900 dark:text-neutral-100 rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-apple-green font-semibold text-xs">
                <FileCheck className="w-4 h-4" />
                <span>Venta Registrada Exitosamente</span>
              </div>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Printable Thermal Paper Mock */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 font-mono text-xs border border-dashed border-neutral-300 dark:border-neutral-700 space-y-2">
              <div className="text-center pb-2 border-b border-dashed border-neutral-300 dark:border-neutral-700">
                <p className="font-bold text-sm uppercase">{tenant.name}</p>
                <p className="text-[10px] text-neutral-500">RUC: {tenant.taxId || "J031000049102"}</p>
                <p className="text-[10px] text-neutral-500">TICKET: {lastSale.invoiceNumber}</p>
                <p className="text-[9px] text-neutral-400">{new Date(lastSale.createdAt).toLocaleString("es-NI")}</p>
              </div>

              <div className="text-[11px] pb-2 border-b border-dashed border-neutral-300 dark:border-neutral-700">
                <p>Cliente: {lastSale.customer?.name || "Contado"}</p>
                <p>Pago: {lastSale.paymentMethod === "credit" ? "CRÉDITO (FIADO)" : "CONTADO"}</p>
              </div>

              <div className="space-y-1 text-[11px]">
                {lastSale.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="truncate max-w-[170px]">{it.quantity}x {it.product.name}</span>
                    <span>C$ {it.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-dashed border-neutral-300 dark:border-neutral-700 space-y-1 font-bold">
                <div className="flex justify-between">
                  <span>TOTAL PAGADO:</span>
                  <span className="text-apple-blue">C$ {lastSale.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-neutral-500 font-normal">
                  <span>Equiv. Dólares:</span>
                  <span>$ {(lastSale.total / lastSale.exchangeRate).toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center pt-3 text-[10px] text-neutral-500">
                {tenant.ticketFooter}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Ticket</span>
              </button>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="py-2.5 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
