"use client";

import React, { useState, useRef } from "react";
import { 
  Receipt, 
  Search, 
  Barcode, 
  Plus, 
  Minus, 
  Check, 
  Printer, 
  CreditCard, 
  Banknote, 
  ArrowRightLeft, 
  X,
  FileCheck,
  Calendar,
  Layers,
  Sparkles,
  AlertTriangle,
  Clock
} from "lucide-react";
import { Product, Customer, CartItem, Sale, TenantSettings, Batch } from "@/types";
import { recordSaleLocally, getBatchExpirationStatus } from "@/lib/offlineStore";

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
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(customers[3] || customers[0]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "transfer">("cash");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [scanFeedback, setScanFeedback] = useState<{ message: string; type: "success" | "warning" } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const categories = ["Todos", ...Array.from(new Set(products.map((p) => p.category)))];

  // Helper sound for scanner feedback
  const playBeep = (freq = 880, duration = 0.08) => {
    try {
      if (typeof window !== "undefined" && (window.AudioContext || (window as any).webkitAudioContext)) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.value = 0.1;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      }
    } catch {
      // Audio fallback silent
    }
  };

  // Filter products by name, sku, barcode or lot
  const filteredProducts = products.filter((p) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      return selectedCategory === "Todos" || p.category === selectedCategory;
    }

    const matchesNameOrSku =
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query);

    const matchesBarcode = p.barcode && p.barcode.includes(query);

    const matchesBatch =
      p.hasBatches &&
      (p.batches?.some(b => 
        b.batchNumber.toLowerCase().includes(query) ||
        (b.barcode && b.barcode.includes(query))
      ) || (p.batchNumber && p.batchNumber.toLowerCase().includes(query)));

    const matchesCat = selectedCategory === "Todos" || p.category === selectedCategory;
    return (matchesNameOrSku || matchesBarcode || matchesBatch) && matchesCat;
  });

  // Pick the FEFO batch (First-Expired, First-Out)
  const getFefoBatch = (product: Product): Batch | undefined => {
    if (!product.hasBatches) return undefined;
    if (product.batches && product.batches.length > 0) {
      const sorted = [...product.batches]
        .filter((b) => b.stock > 0)
        .sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());
      return sorted[0] || product.batches[0];
    }
    if (product.batchNumber) {
      return {
        id: `batch-${product.id}`,
        batchNumber: product.batchNumber,
        expirationDate: product.expirationDate || "",
        stock: product.stock,
        barcode: product.barcode,
      };
    }
    return undefined;
  };

  // Add to cart with specific batch or FEFO batch
  const addToCart = (product: Product, specificBatch?: Batch) => {
    if (product.stock <= 0) {
      alert(`¡No hay stock disponible de ${product.name}!`);
      return;
    }

    const assignedBatch = specificBatch || getFefoBatch(product);

    // Expiry check warning
    if (assignedBatch?.expirationDate) {
      const expStatus = getBatchExpirationStatus(assignedBatch.expirationDate);
      if (expStatus.status === "expired") {
        const proceed = confirm(`⚠️ ATENCIÓN: El lote ${assignedBatch.batchNumber} de ${product.name} está VENCIDO (${expStatus.label}). ¿Deseas agregarlo de todas formas?`);
        if (!proceed) return;
      }
    }

    setCart((prev) => {
      // Find if same product and same batch is already in cart
      const existing = prev.find((item) => 
        item.product.id === product.id && 
        item.selectedBatch?.id === assignedBatch?.id
      );

      if (existing) {
        const availableStock = assignedBatch ? assignedBatch.stock : product.stock;
        if (existing.quantity >= availableStock) {
          alert(`Stock máximo alcanzado para este lote (${availableStock} ${product.unit})`);
          return prev;
        }
        return prev.map((item) =>
          item === existing
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
          selectedBatch: assignedBatch,
        },
      ];
    });

    playBeep(920, 0.08);
  };

  // Change batch for an item already in cart
  const updateCartBatch = (cartIndex: number, newBatchId: string) => {
    setCart((prev) => {
      const target = prev[cartIndex];
      if (!target || !target.product.batches) return prev;
      const foundBatch = target.product.batches.find((b) => b.id === newBatchId);
      if (!foundBatch) return prev;

      return prev.map((item, idx) => {
        if (idx === cartIndex) {
          return {
            ...item,
            selectedBatch: foundBatch,
            quantity: Math.min(item.quantity, foundBatch.stock || 1),
            subtotal: Math.min(item.quantity, foundBatch.stock || 1) * item.unitPrice,
          };
        }
        return item;
      });
    });
  };

  // Barcode scanner auto-enter trigger
  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      e.preventDefault();
      const code = searchQuery.trim();

      // 1. Check if matches a batch barcode directly
      for (const p of products) {
        if (p.hasBatches && p.batches) {
          const matchedBatch = p.batches.find((b) => b.barcode && b.barcode.toLowerCase() === code.toLowerCase());
          if (matchedBatch) {
            addToCart(p, matchedBatch);
            setScanFeedback({
              message: `✓ Escaneado: ${p.name} - Lote ${matchedBatch.batchNumber} (Vence: ${matchedBatch.expirationDate})`,
              type: "success",
            });
            setTimeout(() => setScanFeedback(null), 3500);
            setSearchQuery("");
            return;
          }
        }
      }

      // 2. Check if matches product main barcode or SKU
      const matchedProd = products.find(
        (p) => 
          (p.barcode && p.barcode.toLowerCase() === code.toLowerCase()) ||
          p.sku.toLowerCase() === code.toLowerCase()
      );

      if (matchedProd) {
        addToCart(matchedProd);
        setScanFeedback({
          message: `✓ Escaneado: ${matchedProd.name} (SKU: ${matchedProd.sku})`,
          type: "success",
        });
        setTimeout(() => setScanFeedback(null), 3500);
        setSearchQuery("");
        return;
      }

      // 3. Fallback: If only 1 product in filtered list, add it
      if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
        setScanFeedback({
          message: `✓ Escaneado: ${filteredProducts[0].name}`,
          type: "success",
        });
        setTimeout(() => setScanFeedback(null), 3500);
        setSearchQuery("");
        return;
      }

      playBeep(440, 0.15); // Low error tone
    }
  };

  const updateQuantity = (cartIndex: number, delta: number) => {
    setCart((prev) => {
      const target = prev[cartIndex];
      if (!target) return prev;
      const newQty = target.quantity + delta;
      if (newQty <= 0) {
        return prev.filter((_, idx) => idx !== cartIndex);
      }
      const maxStock = target.selectedBatch ? target.selectedBatch.stock : target.product.stock;
      if (newQty > maxStock) {
        alert(`Stock máximo alcanzado para este lote (${maxStock} ${target.product.unit})`);
        return prev;
      }
      return prev.map((item, idx) => 
        idx === cartIndex
          ? {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.unitPrice,
            }
          : item
      );
    });
  };

  const removeFromCart = (cartIndex: number) => {
    setCart((prev) => prev.filter((_, idx) => idx !== cartIndex));
  };

  // Totales
  const subtotal = cart.reduce((acc, it) => acc + it.subtotal, 0);
  const costTotal = cart.reduce((acc, it) => acc + it.product.costPrice * it.quantity, 0);
  const tax = subtotal * (tenant.taxPercentage / 100);
  const total = subtotal + tax;
  const netProfit = total - costTotal;

  const handleCheckout = () => {
    if (cart.length === 0) return;

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

    // Registrar localmente (descuenta lotes e inventario al instante)
    const { updatedProducts, updatedCustomers } = recordSaleLocally(saleRecord);

    playBeep(1200, 0.12);
    setLastSale(saleRecord);
    setShowReceiptModal(true);
    setCart([]);
    onSaleComplete(saleRecord, updatedProducts, updatedCustomers);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* Left Column: Product Search & Grid */}
      <div className="lg:col-span-7 space-y-4">
        
        {/* Scanner Feedback Notification */}
        {scanFeedback && (
          <div className="p-3 rounded-2xl bg-apple-green/10 border border-apple-green/30 text-apple-green text-xs font-semibold flex items-center justify-between shadow-sm animate-fadeIn">
            <div className="flex items-center gap-2">
              <Barcode className="w-4 h-4 stroke-[2.5]" />
              <span>{scanFeedback.message}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setScanFeedback(null)}
              className="text-apple-green hover:opacity-75"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Search & Filters */}
        <div className="p-4 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleBarcodeScan}
                placeholder="Escanear código de barras (producto o lote) o presione Enter..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 text-xs focus:outline-none focus:ring-2 focus:ring-apple-blue font-medium"
              />
            </div>
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-apple-blue/10 dark:bg-apple-blue/20 text-xs text-apple-blue font-mono font-semibold">
              <Barcode className="w-4 h-4" />
              <span className="hidden sm:inline">Lector Activo</span>
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
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-12 text-center text-neutral-400 text-xs">
              No se encontraron productos coincidentes.
            </div>
          ) : (
            filteredProducts.map((p) => {
              const isOutOfStock = p.stock <= 0;
              const isLowStock = p.stock <= p.minStock && !isOutOfStock;
              const fefoBatch = getFefoBatch(p);
              const expStatus = fefoBatch?.expirationDate ? getBatchExpirationStatus(fefoBatch.expirationDate) : null;

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

                    {/* Batch & Expiration Tag */}
                    {p.hasBatches && fefoBatch && (
                      <div className="mt-1.5 space-y-0.5">
                        <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-500">
                          <Layers className="w-2.5 h-2.5 text-apple-blue" />
                          <span>Lote: {fefoBatch.batchNumber}</span>
                        </div>
                        {expStatus && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold inline-block ${expStatus.badgeClass}`}>
                            {expStatus.label}
                          </span>
                        )}
                      </div>
                    )}

                    {p.barcode && !p.hasBatches && (
                      <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-mono mt-1">
                        <Barcode className="w-3 h-3 text-neutral-400" />
                        <span>{p.barcode}</span>
                      </div>
                    )}
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
            })
          )}
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
                Facturación & Caja (Contado)
              </h3>
            </div>
            <span className="text-xs font-mono text-neutral-500">
              {cart.length} {cart.length === 1 ? "artículo" : "artículos"}
            </span>
          </div>

          {/* Customer Selection */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 mb-1">
              Cliente para Factura
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
                  {c.name} {c.taxId ? `(${c.taxId})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Cart Item List */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-neutral-400 text-xs">
                El carrito está vacío. Haz clic en un producto o escanea su código de barras.
              </div>
            ) : (
              cart.map((item, cartIndex) => {
                const batchStatus = item.selectedBatch?.expirationDate 
                  ? getBatchExpirationStatus(item.selectedBatch.expirationDate)
                  : null;

                const availableBatches = (item.product.batches || []).filter((b) => b.stock > 0);

                return (
                  <div
                    key={`${item.product.id}-${item.selectedBatch?.id || "default"}`}
                    className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-neutral-900 dark:text-white truncate">
                          {item.product.name}
                        </h5>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-neutral-500 font-mono">
                            C$ {item.unitPrice.toFixed(2)} / {item.unit}
                          </span>
                          {item.selectedBatch?.barcode && (
                            <span className="text-[9px] font-mono text-neutral-400 flex items-center gap-0.5">
                              <Barcode className="w-2.5 h-2.5 text-apple-blue" />
                              {item.selectedBatch.barcode}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity stepper */}
                      <div className="flex items-center gap-1.5 bg-neutral-200/80 dark:bg-neutral-700 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(cartIndex, -1)}
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-white dark:hover:bg-neutral-600 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-mono font-bold text-neutral-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(cartIndex, 1)}
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
                          onClick={() => removeFromCart(cartIndex)}
                          className="text-apple-red hover:opacity-80 text-[10px]"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>

                    {/* Batch Selection / Status in Cart */}
                    {item.product.hasBatches && (
                      <div className="pt-1.5 border-t border-neutral-200/60 dark:border-neutral-700/60 flex flex-wrap items-center justify-between gap-1 text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3 h-3 text-apple-blue" />
                          <span className="font-medium text-neutral-500">Lote a descontar:</span>
                          
                          {availableBatches.length > 1 ? (
                            <select
                              value={item.selectedBatch?.id}
                              onChange={(e) => updateCartBatch(cartIndex, e.target.value)}
                              className="px-2 py-0.5 rounded bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 font-mono text-[10px] text-neutral-900 dark:text-white font-bold"
                            >
                              {availableBatches.map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.batchNumber} ({b.stock} und - Vence: {b.expirationDate})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                              {item.selectedBatch?.batchNumber || "L-01"}
                            </span>
                          )}
                        </div>

                        {batchStatus && (
                          <span className={`px-1.5 py-0.5 rounded font-bold ${batchStatus.badgeClass}`}>
                            {batchStatus.label}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 mb-1.5">
              Forma de Pago
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
              <button
                type="button"
                onClick={() => setPaymentMethod("transfer")}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                  paymentMethod === "transfer"
                    ? "bg-white dark:bg-neutral-700 text-apple-blue shadow-sm"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Transf.</span>
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
              <span>Ganancia / Margen Neto:</span>
              <span className="font-mono">+C$ {netProfit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-neutral-200/80 dark:border-neutral-800">
              <span className="text-sm font-bold text-neutral-900 dark:text-white">TOTAL A PAGAR:</span>
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
            <span>Cobrar & Emitir Factura</span>
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
                <span>Pago Procesado Exitosamente</span>
              </div>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Printable Thermal Paper Mock */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 font-mono text-xs border border-dashed border-neutral-300 dark:border-neutral-700 space-y-2">
              <div className="text-center pb-2 border-b border-dashed border-neutral-300 dark:border-neutral-700">
                <p className="font-bold text-sm uppercase">{tenant.name}</p>
                <p className="text-[10px] text-neutral-500">RUC: {tenant.taxId || "J031000049102"}</p>
                <p className="text-[10px] text-neutral-500">{tenant.city}, Nicaragua</p>
                <p className="text-[10px] text-neutral-500">FACTURA: {lastSale.invoiceNumber}</p>
                <p className="text-[9px] text-neutral-400">{new Date(lastSale.createdAt).toLocaleString("es-NI")}</p>
              </div>

              <div className="text-[11px] pb-2 border-b border-dashed border-neutral-300 dark:border-neutral-700">
                <p>Cliente: {lastSale.customer?.name || "Contado"}</p>
                <p>Forma de Pago: {lastSale.paymentMethod === "cash" ? "EFECTIVO" : lastSale.paymentMethod === "card" ? "TARJETA" : "TRANSFERENCIA BANCARIA"}</p>
                <p className="text-apple-green font-bold">ESTADO: PAGADO EN CAJA</p>
              </div>

              {/* Items with Batch details */}
              <div className="space-y-1.5 text-[11px]">
                {lastSale.items.map((it, idx) => (
                  <div key={idx} className="pb-1 border-b border-neutral-200/50 dark:border-neutral-800/50">
                    <div className="flex justify-between font-semibold">
                      <span className="truncate max-w-[170px]">{it.quantity}x {it.product.name}</span>
                      <span>C$ {it.subtotal.toFixed(2)}</span>
                    </div>
                    {it.selectedBatch && (
                      <div className="text-[9px] text-neutral-500 flex items-center justify-between mt-0.5">
                        <span>Lote: {it.selectedBatch.batchNumber}</span>
                        <span>Vence: {it.selectedBatch.expirationDate}</span>
                      </div>
                    )}
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

              {/* Barcode Mock on receipt */}
              <div className="text-center pt-3 text-[10px] text-neutral-500 border-t border-dashed border-neutral-300 dark:border-neutral-700">
                <div className="font-mono tracking-widest text-neutral-400 text-xs py-1">
                  ||||| | |||| |||| || ||||| | ||||
                </div>
                <p className="text-[9px] font-mono text-neutral-400">{lastSale.invoiceNumber}</p>
                <p className="mt-1">{tenant.ticketFooter}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-4 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Factura</span>
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
