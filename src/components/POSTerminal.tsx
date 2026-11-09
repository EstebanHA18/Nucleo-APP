"use client";

import React, { useState, useRef, useEffect } from "react";
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
  Layers, 
  Lock, 
  Unlock, 
  Calculator, 
  DollarSign, 
  Coins, 
  UserCheck, 
  AlertCircle,
  FileText
} from "lucide-react";
import { Product, Customer, CartItem, Sale, TenantSettings, Batch, CashRegisterSession } from "@/types";
import { 
  recordSaleLocally, 
  getBatchExpirationStatus, 
  getCurrentCashSession, 
  openCashSession, 
  closeCashSession,
  getCurrentUser
} from "@/lib/offlineStore";

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
  const currentUser = getCurrentUser();

  // Estados de catálogo y carrito
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Estados del cliente para la factura (Permite Nombre y RUC personalizado)
  const defaultCustomer = customers[3] || customers[0] || {
    id: "cust-cash",
    name: "Cliente de Contado",
    phone: "Sin teléfono",
    totalPurchases: 0,
  };
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(defaultCustomer.id);
  const [invoiceCustomerName, setInvoiceCustomerName] = useState<string>(defaultCustomer.name);
  const [invoiceCustomerTaxId, setInvoiceCustomerTaxId] = useState<string>(defaultCustomer.taxId || "");
  const [showCustomClientInputs, setShowCustomClientInputs] = useState<boolean>(false);

  // Estados de Pago, Denominaciones y Vuelto
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "transfer">("cash");
  const [cashTendered, setCashTendered] = useState<string>(""); // Con cuánto paga
  const [paymentReference, setPaymentReference] = useState<string>(""); // Voucher / Transfer

  // Estados de la Sesión de Caja (Arqueo / Turnos)
  const [cashSession, setCashSession] = useState<CashRegisterSession>(() => getCurrentCashSession());
  const [showOpenCashModal, setShowOpenCashModal] = useState<boolean>(false);
  const [showCloseCashModal, setShowCloseCashModal] = useState<boolean>(false);
  const [openingFundInput, setOpeningFundInput] = useState<string>("1000");
  const [countedCashInput, setCountedCashInput] = useState<string>("");
  const [closeNotesInput, setCloseNotesInput] = useState<string>("");
  const [lastClosedSessionReceipt, setLastClosedSessionReceipt] = useState<CashRegisterSession | null>(null);

  // Modales de Venta / Feedback
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [scanFeedback, setScanFeedback] = useState<{ message: string; type: "success" | "warning" } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const categories = ["Todos", ...Array.from(new Set(products.map((p) => p.category)))];

  // Helper de audio para escáner
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
      // Audio fallback silencioso
    }
  };

  // Sincronizar sesión al montar
  useEffect(() => {
    setCashSession(getCurrentCashSession());
  }, []);

  // Filtrar productos
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

  // Selección de lote FEFO
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

  // Agregar al carrito
  const addToCart = (product: Product, specificBatch?: Batch) => {
    if (cashSession.status === "closed") {
      alert("⚠️ La caja está cerrada. Debes aperturar turno de caja antes de facturar.");
      setShowOpenCashModal(true);
      return;
    }

    if (product.stock <= 0) {
      alert(`¡No hay stock disponible de ${product.name}!`);
      return;
    }

    const assignedBatch = specificBatch || getFefoBatch(product);

    if (assignedBatch?.expirationDate) {
      const expStatus = getBatchExpirationStatus(assignedBatch.expirationDate);
      if (expStatus.status === "expired") {
        const proceed = confirm(`⚠️ ATENCIÓN: El lote ${assignedBatch.batchNumber} de ${product.name} está VENCIDO (${expStatus.label}). ¿Deseas agregarlo de todas formas?`);
        if (!proceed) return;
      }
    }

    setCart((prev) => {
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

  // Escaneo por código de barra con Enter
  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      e.preventDefault();
      const code = searchQuery.trim();

      for (const p of products) {
        if (p.hasBatches && p.batches) {
          const matchedBatch = p.batches.find((b) => b.barcode && b.barcode.toLowerCase() === code.toLowerCase());
          if (matchedBatch) {
            addToCart(p, matchedBatch);
            setScanFeedback({
              message: `✓ Escaneado: ${p.name} - Lote ${matchedBatch.batchNumber}`,
              type: "success",
            });
            setTimeout(() => setScanFeedback(null), 3500);
            setSearchQuery("");
            return;
          }
        }
      }

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

      playBeep(440, 0.15);
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

  // Cálculo de Totales y Ganancias según costo vs venta
  const subtotal = cart.reduce((acc, it) => acc + it.subtotal, 0);
  const costTotal = cart.reduce((acc, it) => acc + (it.product.costPrice || 0) * it.quantity, 0);
  const tax = subtotal * (tenant.taxPercentage / 100);
  const total = subtotal + tax;
  const netProfit = total - costTotal;
  const marginPercentage = total > 0 ? (netProfit / total) * 100 : 0;

  // Cálculo de Vuelto / Monto pagado
  const numericTendered = paymentMethod === "cash" 
    ? (parseFloat(cashTendered) || 0)
    : total; // Para tarjeta y transferencia se asume pago exacto
  
  const changeDue = Math.max(0, numericTendered - total);
  const isPaymentSufficient = numericTendered >= total;
  const missingAmount = Math.max(0, total - numericTendered);

  // Botones de denominaciones rápidas
  const handleQuickCash = (amount: number) => {
    setCashTendered(amount.toString());
  };

  const handleAddBill = (bill: number) => {
    const current = parseFloat(cashTendered) || 0;
    setCashTendered((current + bill).toString());
  };

  // Manejo de Apertura de Caja
  const handleConfirmOpenCash = (e: React.FormEvent) => {
    e.preventDefault();
    const fund = parseFloat(openingFundInput) || 0;
    const newSession = openCashSession(fund, currentUser.fullName);
    setCashSession(newSession);
    setShowOpenCashModal(false);
    playBeep(1100, 0.15);
  };

  // Manejo de Cierre de Caja (Arqueo)
  const handleConfirmCloseCash = (e: React.FormEvent) => {
    e.preventDefault();
    const counted = parseFloat(countedCashInput) || 0;
    const closed = closeCashSession(counted, currentUser.fullName, closeNotesInput);
    setCashSession(closed);
    setShowCloseCashModal(false);
    setLastClosedSessionReceipt(closed);
    playBeep(880, 0.2);
  };

  // Finalizar Cobro y Emisión de Factura
  const handleCheckout = () => {
    if (cart.length === 0) return;

    if (cashSession.status === "closed") {
      alert("⚠️ La caja está cerrada. Debes abrir el turno de caja antes de cobrar.");
      setShowOpenCashModal(true);
      return;
    }

    if (paymentMethod === "cash" && !isPaymentSufficient) {
      alert(`⚠️ El efectivo recibido (C$ ${numericTendered.toFixed(2)}) es menor al total de la factura (C$ ${total.toFixed(2)}).`);
      return;
    }

    // Identificar el cliente
    const matchedCustomer = customers.find((c) => c.id === selectedCustomerId) || defaultCustomer;
    const finalCustomer: Customer = {
      ...matchedCustomer,
      name: invoiceCustomerName.trim() || matchedCustomer.name,
      taxId: invoiceCustomerTaxId.trim() || matchedCustomer.taxId,
    };

    const saleRecord: Sale = {
      id: "sale-" + Date.now(),
      invoiceNumber: "FAC-" + Math.floor(100000 + Math.random() * 900000),
      customer: finalCustomer,
      customerName: finalCustomer.name,
      customerTaxId: finalCustomer.taxId,
      paymentMethod,
      amountPaid: numericTendered,
      changeGiven: changeDue,
      items: [...cart],
      subtotal,
      tax,
      total,
      costTotal,
      profit: netProfit,
      currency: tenant.currency,
      exchangeRate: tenant.exchangeRate,
      createdAt: new Date().toISOString(),
      cashierName: currentUser.fullName,
    };

    // 1. Descontar inventario automáticamente y registrar la venta
    const { updatedProducts, updatedCustomers } = recordSaleLocally(saleRecord);

    // 2. Refrescar sesión de caja activa
    setCashSession(getCurrentCashSession());

    playBeep(1200, 0.12);
    setLastSale(saleRecord);
    setShowReceiptModal(true);
    setCart([]);
    setCashTendered("");
    onSaleComplete(saleRecord, updatedProducts, updatedCustomers);
  };

  return (
    <div className="space-y-4">
      
      {/* ======================================================== */}
      {/* BARRA SUPERIOR DE ESTADO DE CAJA & ARQUEO DE TURNO       */}
      {/* ======================================================== */}
      <div className="p-3.5 px-5 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple flex flex-wrap items-center justify-between gap-3 transition-colors">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-2xl flex items-center justify-center ${
            cashSession.status === "open"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
              : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
          }`}>
            {cashSession.status === "open" ? (
              <Unlock className="w-4 h-4" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono ${
                cashSession.status === "open"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
              }`}>
                {cashSession.status === "open" ? "Caja Abierta" : "Caja Cerrada"}
              </span>
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Atendido por: {cashSession.openedBy || currentUser.fullName}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-500 dark:text-neutral-400 mt-0.5">
              <span>Fondo Apertura: C$ {cashSession.openingAmount.toFixed(2)}</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                Efectivo en Gaveta: C$ {cashSession.expectedCashInDrawer.toFixed(2)}
              </span>
              <span>•</span>
              <span>Ventas Hoy: {cashSession.salesCount} tickets</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {cashSession.status === "open" ? (
            <button
              type="button"
              onClick={() => {
                setCountedCashInput(cashSession.expectedCashInDrawer.toString());
                setShowCloseCashModal(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-all border border-neutral-200 dark:border-neutral-700"
            >
              <Calculator className="w-3.5 h-3.5 text-apple-blue" />
              <span>Cerrar Caja / Arqueo</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowOpenCashModal(true)}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Aperturar Caja</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerta si la caja está cerrada */}
      {cashSession.status === "closed" && (
        <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-amber-800 dark:text-amber-300 animate-fadeIn">
          <div className="flex items-center gap-2.5 text-xs font-medium">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <span>
              La caja está actualmente <strong>cerrada</strong>. Para emitir comprobantes y cobrar a clientes, debes aperturar el turno con el fondo inicial de cambio.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowOpenCashModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shrink-0 transition-colors shadow-2xs"
          >
            Abrir Caja Ahora
          </button>
        </div>
      )}

      {/* Layout Principal: Izquierda Catálogo de Productos / Derecha Carrito & Facturación */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ======================================================== */}
        {/* COLUMNA IZQUIERDA: BÚSQUEDA Y GRID DE PRODUCTOS          */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Feedback de escáner */}
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

          {/* Barra de Búsqueda y Filtros de Categoría */}
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

            {/* Categorías */}
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

          {/* Cuadrícula de Tarjetas de Producto */}
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

                      {/* Lotes & Vencimiento */}
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
                      <div>
                        <div className="font-mono text-xs font-bold text-apple-blue">
                          C$ {p.salePrice.toFixed(2)}
                        </div>
                        <span className="text-[9px] text-neutral-400 font-mono">
                          Costo: C$ {p.costPrice.toFixed(2)}
                        </span>
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

        {/* ======================================================== */}
        {/* COLUMNA DERECHA: FACTURACIÓN, CLIENTE, COBRO Y VUELTO    */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-4">
            
            {/* Encabezado del Carrito */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-apple-blue" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Facturación & Caja
                </h3>
              </div>
              <span className="text-xs font-mono text-neutral-500">
                {cart.length} {cart.length === 1 ? "artículo" : "artículos"}
              </span>
            </div>

            {/* Datos del Cliente: Nombre & RUC personalizable */}
            <div className="space-y-2 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700/60">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-apple-blue" />
                  <span>Cliente para Factura</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowCustomClientInputs(!showCustomClientInputs)}
                  className="text-[10px] text-apple-blue hover:underline font-semibold"
                >
                  {showCustomClientInputs ? "Ocultar RUC / Nombre" : "+ Editar RUC / Nombre"}
                </button>
              </div>

              {/* Selector de Cliente Rápido */}
              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedCustomerId(id);
                  const found = customers.find((c) => c.id === id);
                  if (found) {
                    setInvoiceCustomerName(found.name);
                    setInvoiceCustomerTaxId(found.taxId || "");
                  }
                }}
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-apple-blue"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.taxId ? `(RUC: ${c.taxId})` : ""}
                  </option>
                ))}
              </select>

              {/* Inputs específicos de Nombre y RUC */}
              {showCustomClientInputs && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 animate-fadeIn">
                  <div>
                    <label className="block text-[10px] font-mono text-neutral-500 mb-0.5">
                      Nombre / Razón Social:
                    </label>
                    <input
                      type="text"
                      value={invoiceCustomerName}
                      onChange={(e) => setInvoiceCustomerName(e.target.value)}
                      placeholder="Nombre del cliente"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-apple-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-neutral-500 mb-0.5">
                      RUC / Cédula / DNI:
                    </label>
                    <input
                      type="text"
                      value={invoiceCustomerTaxId}
                      onChange={(e) => setInvoiceCustomerTaxId(e.target.value)}
                      placeholder="Ej. J031000049102"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-apple-blue font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Lista de Ítems en Carrito */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-6 text-neutral-400 text-xs">
                  El carrito está vacío. Selecciona productos para iniciar la factura.
                </div>
              ) : (
                cart.map((item, cartIndex) => {
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
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono">
                              +C$ {((item.unitPrice - item.product.costPrice) * item.quantity).toFixed(2)} ganancia
                            </span>
                          </div>
                        </div>

                        {/* Stepper de Cantidad */}
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

                      {/* Lote asignado */}
                      {item.product.hasBatches && (
                        <div className="pt-1.5 border-t border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <Layers className="w-3 h-3 text-apple-blue" />
                            <span className="font-medium text-neutral-500">Lote:</span>
                            {availableBatches.length > 1 ? (
                              <select
                                value={item.selectedBatch?.id}
                                onChange={(e) => updateCartBatch(cartIndex, e.target.value)}
                                className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 font-mono text-[10px] font-bold"
                              >
                                {availableBatches.map((b) => (
                                  <option key={b.id} value={b.id}>
                                    {b.batchNumber} (Stock: {b.stock})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                                {item.selectedBatch?.batchNumber || "L-01"}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Selector de Método de Pago */}
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

            {/* ======================================================== */}
            {/* SECCIÓN DE EFECTIVO: MONTO PAGADO, DENOMINACIONES & VUELTO*/}
            {/* ======================================================== */}
            {paymentMethod === "cash" && total > 0 && (
              <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-emerald-500" />
                    <span>¿Con cuánto pagan? (Efectivo Recibido)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleQuickCash(total)}
                    className="px-2 py-0.5 rounded-md bg-apple-blue/10 text-apple-blue font-bold text-[10px] hover:bg-apple-blue/20 transition-colors"
                  >
                    Monto Exacto
                  </button>
                </div>

                {/* Input de Efectivo */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-neutral-400 text-sm">
                    C$
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    placeholder={total.toFixed(2)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 text-sm font-mono font-bold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue"
                  />
                </div>

                {/* Botones de Denominaciones Rápidas en Billetes */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                    Billetes Rápidos Córdobas (NIO):
                  </span>
                  <div className="grid grid-cols-6 gap-1">
                    {[20, 50, 100, 200, 500, 1000].map((bill) => (
                      <button
                        key={bill}
                        type="button"
                        onClick={() => handleQuickCash(bill)}
                        className="py-1 px-1.5 rounded-lg bg-white dark:bg-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-600 border border-neutral-200 dark:border-neutral-600 text-[10px] font-mono font-bold text-neutral-800 dark:text-neutral-200 transition-all shadow-2xs text-center"
                      >
                        +{bill}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-mono text-neutral-400">
                      Billetes Dólares (USD):
                    </span>
                    <div className="flex gap-1">
                      {[5, 10, 20, 50, 100].map((usd) => {
                        const nioVal = Math.round(usd * tenant.exchangeRate);
                        return (
                          <button
                            key={usd}
                            type="button"
                            onClick={() => handleQuickCash(nioVal)}
                            className="py-0.5 px-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold"
                            title={`$${usd} USD ≈ C$ ${nioVal}`}
                          >
                            ${usd}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Box de Vuelto Calculado */}
                {numericTendered > 0 && (
                  <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    isPaymentSufficient
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
                  }`}>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider block font-semibold">
                        {isPaymentSufficient ? "Vuelto / Cambio a entregar:" : "Monto Insuficiente:"}
                      </span>
                      <div className="text-xl font-extrabold font-mono tracking-tight">
                        {isPaymentSufficient
                          ? `C$ ${changeDue.toFixed(2)}`
                          : `Faltan C$ ${missingAmount.toFixed(2)}`}
                      </div>
                    </div>
                    {isPaymentSufficient && (
                      <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                        ≈ ${(changeDue / tenant.exchangeRate).toFixed(2)} USD
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Si es Tarjeta o Transferencia, campo de referencia opcional */}
            {paymentMethod !== "cash" && total > 0 && (
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 animate-fadeIn">
                <label className="block text-[10px] font-mono text-neutral-500 mb-1">
                  Número de Voucher / Referencia Bancaria (Opcional):
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Ej. #098124 - BAC Credomatic"
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 text-xs font-mono"
                />
              </div>
            )}

            {/* Desglose de Totales y Ganancia */}
            <div className="pt-3 border-t border-neutral-200/80 dark:border-neutral-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-neutral-500">
                <span>Subtotal:</span>
                <span className="font-mono">C$ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>IVA ({tenant.taxPercentage}%):</span>
                <span className="font-mono">C$ {tax.toFixed(2)}</span>
              </div>
              
              {/* Cálculo de Ganancia Real */}
              <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-semibold p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="flex items-center gap-1">
                  <span>Ganancia / Margen Neto:</span>
                  <span className="text-[10px] font-mono text-emerald-500 font-normal">
                    ({marginPercentage.toFixed(1)}%)
                  </span>
                </span>
                <span className="font-mono font-bold">+C$ {netProfit.toFixed(2)}</span>
              </div>

              {/* Total a pagar */}
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

            {/* Botón de Cobro y Emisión de Factura */}
            <button
              type="button"
              disabled={cart.length === 0 || (paymentMethod === "cash" && !isPaymentSufficient) || cashSession.status === "closed"}
              onClick={handleCheckout}
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs tracking-wide transition-all shadow-md flex items-center justify-center gap-2 ${
                cart.length === 0 || (paymentMethod === "cash" && !isPaymentSufficient) || cashSession.status === "closed"
                  ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"
                  : "bg-apple-blue hover:bg-apple-blue-hover text-white shadow-apple-blue/30 cursor-pointer"
              }`}
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>
                {paymentMethod === "cash" && isPaymentSufficient && changeDue > 0
                  ? `Cobrar C$ ${total.toFixed(2)} (Dar Vuelto C$ ${changeDue.toFixed(2)})`
                  : "Cobrar & Emitir Factura"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: APERTURA DE CAJA (FONDO INICIAL DE TURNO)       */}
      {/* ======================================================== */}
      {showOpenCashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#1c1c1e] text-neutral-900 dark:text-neutral-100 rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <Unlock className="w-4 h-4" />
                <span>Apertura de Turno de Caja</span>
              </div>
              <button
                type="button"
                onClick={() => setShowOpenCashModal(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmOpenCash} className="space-y-4 text-xs">
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Ingresa el monto de efectivo inicial con el que comienzas el turno para dar cambio a los clientes.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Cajero Responsable:
                </label>
                <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-apple-blue" />
                  <span>{currentUser.fullName} ({currentUser.roleLabel})</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Fondo Inicial de Caja (Córdobas C$):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-neutral-400">
                    C$
                  </span>
                  <input
                    type="number"
                    step="any"
                    required
                    value={openingFundInput}
                    onChange={(e) => setOpeningFundInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 text-sm font-mono font-bold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Confirmar y Abrir Turno</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowOpenCashModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold hover:bg-neutral-200"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: CIERRE DE CAJA (ARQUEO Y CUADRE DE EFECTIVO)    */}
      {/* ======================================================== */}
      {showCloseCashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-[#1c1c1e] text-neutral-900 dark:text-neutral-100 rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-apple-blue font-bold text-sm">
                <Calculator className="w-4 h-4" />
                <span>Cierre de Caja & Arqueo de Turno</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCloseCashModal(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCloseCash} className="space-y-4 text-xs">
              {/* Resumen del Turno */}
              <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 space-y-2 font-mono">
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Fondo Inicial de Apertura:</span>
                  <span>C$ {cashSession.openingAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>(+) Ventas en Efectivo:</span>
                  <span>C$ {cashSession.cashSalesTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>(+) Ventas en Tarjeta:</span>
                  <span>C$ {cashSession.cardSalesTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>(+) Ventas en Transferencia:</span>
                  <span>C$ {cashSession.transferSalesTotal.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 flex justify-between font-bold text-neutral-900 dark:text-white">
                  <span>Total Ventas Facturadas ({cashSession.salesCount} tickets):</span>
                  <span>C$ {cashSession.totalSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Ganancia Neta Generada en Turno:</span>
                  <span>+C$ {cashSession.totalProfit.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-dashed border-neutral-300 dark:border-neutral-700 flex justify-between text-sm font-extrabold text-apple-blue">
                  <span>EFECTIVO ESPERADO EN GAVETA:</span>
                  <span>C$ {cashSession.expectedCashInDrawer.toFixed(2)}</span>
                </div>
              </div>

              {/* Efectivo Físico Contado */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Efectivo Físico Contado en Gaveta (Arqueo):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-neutral-400">
                    C$
                  </span>
                  <input
                    type="number"
                    step="any"
                    required
                    value={countedCashInput}
                    onChange={(e) => setCountedCashInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 text-sm font-mono font-bold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue"
                  />
                </div>

                {/* Cálculo de diferencia */}
                {countedCashInput !== "" && (
                  <div className="mt-2 p-2.5 rounded-xl text-xs font-mono font-bold flex items-center justify-between border" style={{
                    backgroundColor: (parseFloat(countedCashInput) || 0) === cashSession.expectedCashInDrawer
                      ? "rgba(16, 185, 129, 0.1)"
                      : (parseFloat(countedCashInput) || 0) > cashSession.expectedCashInDrawer
                      ? "rgba(59, 130, 246, 0.1)"
                      : "rgba(239, 68, 68, 0.1)",
                    borderColor: (parseFloat(countedCashInput) || 0) === cashSession.expectedCashInDrawer
                      ? "rgba(16, 185, 129, 0.3)"
                      : (parseFloat(countedCashInput) || 0) > cashSession.expectedCashInDrawer
                      ? "rgba(59, 130, 246, 0.3)"
                      : "rgba(239, 68, 68, 0.3)",
                    color: (parseFloat(countedCashInput) || 0) === cashSession.expectedCashInDrawer
                      ? "#10b981"
                      : (parseFloat(countedCashInput) || 0) > cashSession.expectedCashInDrawer
                      ? "#3b82f6"
                      : "#ef4444"
                  }}>
                    <span>
                      {(parseFloat(countedCashInput) || 0) === cashSession.expectedCashInDrawer
                        ? "✓ Cuadre Exacto de Caja"
                        : (parseFloat(countedCashInput) || 0) > cashSession.expectedCashInDrawer
                        ? "⚠️ Sobrante en Gaveta"
                        : "❌ Faltante en Gaveta"}
                    </span>
                    <span>
                      {(parseFloat(countedCashInput) || 0) - cashSession.expectedCashInDrawer >= 0 ? "+" : ""}
                      C$ {((parseFloat(countedCashInput) || 0) - cashSession.expectedCashInDrawer).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Observaciones / Notas del Arqueo (Opcional):
                </label>
                <textarea
                  value={closeNotesInput}
                  onChange={(e) => setCloseNotesInput(e.target.value)}
                  placeholder="Ej. Cierre de turno sin novedades, entregado a relevo..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs focus:outline-none focus:ring-1 focus:ring-apple-blue"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Confirmar Cierre & Generar Comprobante</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCloseCashModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold hover:bg-neutral-200"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: FACTURA / TICKET TÉRMICO CON VUELTO & PAGO       */}
      {/* ======================================================== */}
      {showReceiptModal && lastSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-[#1c1c1e] text-neutral-900 dark:text-neutral-100 rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                <FileCheck className="w-4 h-4" />
                <span>Factura Emitida con Éxito</span>
              </div>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Simulación de Ticket Térmico Imprimible */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 font-mono text-xs border border-dashed border-neutral-300 dark:border-neutral-700 space-y-2">
              <div className="text-center pb-2 border-b border-dashed border-neutral-300 dark:border-neutral-700">
                <p className="font-bold text-sm uppercase">{tenant.name}</p>
                <p className="text-[10px] text-neutral-500">RUC: {tenant.taxId || "J031000049102"}</p>
                <p className="text-[10px] text-neutral-500">{tenant.city}, Nicaragua</p>
                <p className="text-[10px] text-neutral-500 font-bold mt-1">FACTURA #{lastSale.invoiceNumber}</p>
                <p className="text-[9px] text-neutral-400">{new Date(lastSale.createdAt).toLocaleString("es-NI")}</p>
              </div>

              {/* Datos del Cliente en la Factura */}
              <div className="text-[11px] pb-2 border-b border-dashed border-neutral-300 dark:border-neutral-700 space-y-0.5">
                <p className="font-bold">
                  CLIENTE: {lastSale.customerName || lastSale.customer?.name || "Cliente de Contado"}
                </p>
                {lastSale.customerTaxId && (
                  <p className="text-[10px] text-neutral-600 dark:text-neutral-400">
                    RUC / CÉDULA: {lastSale.customerTaxId}
                  </p>
                )}
                <p className="text-[10px] text-neutral-500">
                  CAJERO: {lastSale.cashierName || currentUser.fullName}
                </p>
              </div>

              {/* Detalle de Artículos y Lotes */}
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

              {/* Totales, Pago y Vuelto */}
              <div className="pt-2 border-t border-dashed border-neutral-300 dark:border-neutral-700 space-y-1">
                <div className="flex justify-between text-neutral-500 text-[10px]">
                  <span>Subtotal:</span>
                  <span>C$ {lastSale.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-500 text-[10px]">
                  <span>IVA ({tenant.taxPercentage}%):</span>
                  <span>C$ {lastSale.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-1 border-t border-neutral-200 dark:border-neutral-800">
                  <span>TOTAL FACTURA:</span>
                  <span className="text-apple-blue">C$ {lastSale.total.toFixed(2)}</span>
                </div>

                {/* MÉTODO DE PAGO, CON CUÁNTO SE PAGÓ Y VUELTO */}
                <div className="pt-2 mt-1 border-t border-dashed border-neutral-300 dark:border-neutral-700 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Forma de Pago:</span>
                    <span className="font-bold uppercase">
                      {lastSale.paymentMethod === "cash" 
                        ? "EFECTIVO" 
                        : lastSale.paymentMethod === "card" 
                        ? "TARJETA" 
                        : "TRANSFERENCIA"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Monto Recibido:</span>
                    <span className="font-mono font-bold">C$ {lastSale.amountPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>VUELTO ENTREGADO:</span>
                    <span className="font-mono">C$ {lastSale.changeGiven.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Pie de Ticket */}
              <div className="text-center pt-2 text-[9px] text-neutral-500 border-t border-dashed border-neutral-300 dark:border-neutral-700">
                <div className="font-mono tracking-widest text-neutral-400 text-xs py-1">
                  ||||| | |||| |||| || ||||| | ||||
                </div>
                <p className="font-mono">{lastSale.invoiceNumber}</p>
                <p className="mt-1">{tenant.ticketFooter}</p>
                <p className="text-[8px] text-neutral-400 mt-0.5">¡Gracias por su compra!</p>
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

      {/* ======================================================== */}
      {/* MODAL 4: COMPROBANTE DE CORTE DE CAJA / ARQUEO (Z)       */}
      {/* ======================================================== */}
      {lastClosedSessionReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-[#1c1c1e] text-neutral-900 dark:text-neutral-100 rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-apple-blue font-bold text-xs">
                <FileText className="w-4 h-4" />
                <span>Comprobante de Cierre de Caja (Z)</span>
              </div>
              <button
                type="button"
                onClick={() => setLastClosedSessionReceipt(null)}
                className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 font-mono text-xs border border-dashed border-neutral-300 dark:border-neutral-700 space-y-2">
              <div className="text-center pb-2 border-b border-dashed border-neutral-300 dark:border-neutral-700">
                <p className="font-bold text-sm uppercase">{tenant.name}</p>
                <p className="text-[10px] text-neutral-500">CORTE DE CAJA / ARQUEO DE TURNO</p>
                <p className="text-[9px] text-neutral-400">{new Date(lastClosedSessionReceipt.closedAt || "").toLocaleString("es-NI")}</p>
              </div>

              <div className="text-[11px] space-y-1 pb-2 border-b border-dashed border-neutral-300 dark:border-neutral-700">
                <p>Cajero: {lastClosedSessionReceipt.closedBy}</p>
                <p>Apertura: {new Date(lastClosedSessionReceipt.openedAt).toLocaleTimeString("es-NI")}</p>
                <p>Cierre: {new Date(lastClosedSessionReceipt.closedAt || "").toLocaleTimeString("es-NI")}</p>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Fondo Inicial:</span>
                  <span>C$ {lastClosedSessionReceipt.openingAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>(+) Ventas Efectivo:</span>
                  <span>C$ {lastClosedSessionReceipt.cashSalesTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>(+) Ventas Tarjeta:</span>
                  <span>C$ {lastClosedSessionReceipt.cardSalesTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>(+) Ventas Transf:</span>
                  <span>C$ {lastClosedSessionReceipt.transferSalesTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-neutral-200 dark:border-neutral-700">
                  <span>Total Facturado ({lastClosedSessionReceipt.salesCount} tks):</span>
                  <span>C$ {lastClosedSessionReceipt.totalSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Ganancia Neta Turno:</span>
                  <span>+C$ {lastClosedSessionReceipt.totalProfit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-dashed border-neutral-300 dark:border-neutral-700">
                  <span>Efectivo Esperado:</span>
                  <span>C$ {lastClosedSessionReceipt.expectedCashInDrawer.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Efectivo Contado:</span>
                  <span>C$ {(lastClosedSessionReceipt.actualCashInDrawer || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-extrabold pt-1 border-t" style={{
                  color: (lastClosedSessionReceipt.difference || 0) >= 0 ? "#10b981" : "#ef4444"
                }}>
                  <span>DIFERENCIA (ARQUEO):</span>
                  <span>
                    {(lastClosedSessionReceipt.difference || 0) >= 0 ? "+" : ""}
                    C$ {(lastClosedSessionReceipt.difference || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {lastClosedSessionReceipt.notes && (
                <div className="pt-2 text-[10px] text-neutral-500 border-t border-dashed border-neutral-300 dark:border-neutral-700">
                  <span>Notas: {lastClosedSessionReceipt.notes}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-4 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Corte</span>
              </button>
              <button
                type="button"
                onClick={() => setLastClosedSessionReceipt(null)}
                className="py-2.5 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-200"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
