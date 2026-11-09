"use client";

import React, { useState } from "react";
import { 
  Package, 
  Search, 
  Plus, 
  AlertTriangle, 
  Calendar, 
  Check, 
  Layers, 
  X, 
  Barcode, 
  Clock, 
  Boxes,
  Trash2
} from "lucide-react";
import { Product, TenantSettings, Batch } from "@/types";
import { saveStoredProducts, updateProductBatches, getBatchExpirationStatus } from "@/lib/offlineStore";

interface InventoryManagerProps {
  tenant: TenantSettings;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  tenant,
  products,
  setProducts,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState<"all" | "batches" | "expiring" | "low_stock">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProductForBatches, setSelectedProductForBatches] = useState<Product | null>(null);
  const [copiedBarcode, setCopiedBarcode] = useState<string | null>(null);

  // New product form state
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [category, setCategory] = useState("Materiales Básicos");
  const [unit, setUnit] = useState("Vara");
  const [costPrice, setCostPrice] = useState<number>(100);
  const [salePrice, setSalePrice] = useState<number>(140);
  const [stock, setStock] = useState<number>(50);
  const [minStock, setMinStock] = useState<number>(10);
  const [hasBatches, setHasBatches] = useState(false);
  const [batchNumber, setBatchNumber] = useState("");
  const [batchBarcode, setBatchBarcode] = useState("");
  const [expirationDate, setExpirationDate] = useState("");

  // New batch inside management modal
  const [newBatchNumber, setNewBatchNumber] = useState("");
  const [newBatchExpiration, setNewBatchExpiration] = useState("");
  const [newBatchStock, setNewBatchStock] = useState<number>(10);
  const [newBatchBarcode, setNewBatchBarcode] = useState("");

  const categories = ["Todos", ...Array.from(new Set(products.map((p) => p.category)))];

  // Helper to generate realistic barcodes
  const generateRandomBarcode = () => {
    return "7432" + Math.floor(10000000 + Math.random() * 90000000).toString();
  };

  const copyToClipboard = (code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedBarcode(code);
    setTimeout(() => setCopiedBarcode(null), 2000);
  };

  // Metrics
  const totalProducts = products.length;
  const totalStockUnits = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;
  
  // Calculate batches expiring or expired
  let expiringBatchesCount = 0;
  let totalBatchesTracked = 0;
  products.forEach((p) => {
    if (p.hasBatches) {
      const batchesList = p.batches || (p.batchNumber ? [{
        id: "b-" + p.id,
        batchNumber: p.batchNumber,
        expirationDate: p.expirationDate || "",
        stock: p.stock,
      }] : []);
      totalBatchesTracked += batchesList.length;
      batchesList.forEach((b) => {
        if (b.expirationDate) {
          const { status } = getBatchExpirationStatus(b.expirationDate);
          if (status === "expired" || status === "expiring_soon") {
            expiringBatchesCount++;
          }
        }
      });
    }
  });

  // Filter products
  const filtered = products.filter((p) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query) ||
      (p.barcode && p.barcode.includes(query)) ||
      (p.hasBatches && p.batches?.some(b => 
        b.batchNumber.toLowerCase().includes(query) || 
        (b.barcode && b.barcode.includes(query))
      )) ||
      (p.batchNumber && p.batchNumber.toLowerCase().includes(query));

    const matchesCat = selectedCategory === "Todos" || p.category === selectedCategory;

    let matchesStatus = true;
    if (statusFilter === "batches") {
      matchesStatus = !!p.hasBatches;
    } else if (statusFilter === "expiring") {
      if (!p.hasBatches) matchesStatus = false;
      else {
        matchesStatus = (p.batches || []).some((b) => {
          const { status } = getBatchExpirationStatus(b.expirationDate);
          return status === "expired" || status === "expiring_soon";
        }) || (p.expirationDate ? getBatchExpirationStatus(p.expirationDate).status !== "valid" : false);
      }
    } else if (statusFilter === "low_stock") {
      matchesStatus = p.stock <= p.minStock;
    }

    return matchesSearch && matchesCat && matchesStatus;
  });

  // Create new product
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const generatedSku = sku.trim() || "SKU-" + Math.floor(1000 + Math.random() * 9000);
    const finalBarcode = barcode.trim() || generateRandomBarcode();

    let initialBatches: Batch[] | undefined = undefined;
    if (hasBatches) {
      initialBatches = [
        {
          id: "batch-" + Date.now(),
          batchNumber: batchNumber.trim() || "LOT-" + new Date().getFullYear() + "-01",
          expirationDate: expirationDate || new Date(Date.now() + 365*24*60*60*1000).toISOString().split("T")[0],
          stock: Number(stock),
          barcode: batchBarcode.trim() || finalBarcode,
          createdAt: new Date().toISOString(),
        },
      ];
    }

    const newProd: Product = {
      id: "prod-" + Date.now(),
      sku: generatedSku,
      barcode: finalBarcode,
      name: name.trim(),
      category,
      unit,
      costPrice: Number(costPrice),
      salePrice: Number(salePrice),
      stock: Number(stock),
      minStock: Number(minStock),
      hasBatches,
      batches: initialBatches,
      batchNumber: hasBatches ? (batchNumber || "LOT-01") : undefined,
      expirationDate: hasBatches ? expirationDate : undefined,
    };

    const updated = [newProd, ...products];
    setProducts(updated);
    saveStoredProducts(updated);
    setShowAddModal(false);

    // Reset
    setName("");
    setSku("");
    setBarcode("");
    setHasBatches(false);
    setBatchNumber("");
    setBatchBarcode("");
    setExpirationDate("");
  };

  const handleQuickAddStock = (productId: string, amount: number) => {
    const updated = products.map((p) => {
      if (p.id === productId) {
        if (p.hasBatches && p.batches && p.batches.length > 0) {
          // Si tiene lotes, añadimos al último lote o primer lote activo
          const updatedBatches = p.batches.map((b, idx) => {
            if (idx === 0) {
              return { ...b, stock: b.stock + amount };
            }
            return b;
          });
          return {
            ...p,
            stock: p.stock + amount,
            batches: updatedBatches,
          };
        }
        return { ...p, stock: p.stock + amount };
      }
      return p;
    });
    setProducts(updated);
    saveStoredProducts(updated);
  };

  // Add new batch to an existing product
  const handleAddNewBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForBatches || !newBatchNumber.trim()) return;

    const newBatch: Batch = {
      id: "batch-" + Date.now(),
      batchNumber: newBatchNumber.trim(),
      expirationDate: newBatchExpiration || new Date(Date.now() + 180*24*60*60*1000).toISOString().split("T")[0],
      stock: Number(newBatchStock) || 0,
      barcode: newBatchBarcode.trim() || selectedProductForBatches.barcode || generateRandomBarcode(),
      createdAt: new Date().toISOString(),
    };

    const currentBatches = selectedProductForBatches.batches || [];
    const updatedBatches = [...currentBatches, newBatch];
    const updatedProducts = updateProductBatches(selectedProductForBatches.id, updatedBatches);
    
    setProducts(updatedProducts);
    const updatedCurrent = updatedProducts.find((p) => p.id === selectedProductForBatches.id) || null;
    setSelectedProductForBatches(updatedCurrent);

    // Reset batch form
    setNewBatchNumber("");
    setNewBatchExpiration("");
    setNewBatchStock(10);
    setNewBatchBarcode("");
  };

  // Adjust stock of a specific batch
  const handleAdjustBatchStock = (batchId: string, delta: number) => {
    if (!selectedProductForBatches) return;
    const currentBatches = selectedProductForBatches.batches || [];
    const updatedBatches = currentBatches.map((b) => {
      if (b.id === batchId) {
        const newStock = Math.max(0, b.stock + delta);
        return { ...b, stock: newStock };
      }
      return b;
    });

    const updatedProducts = updateProductBatches(selectedProductForBatches.id, updatedBatches);
    setProducts(updatedProducts);
    const updatedCurrent = updatedProducts.find((p) => p.id === selectedProductForBatches.id) || null;
    setSelectedProductForBatches(updatedCurrent);
  };

  // Remove a batch
  const handleRemoveBatch = (batchId: string) => {
    if (!selectedProductForBatches) return;
    const currentBatches = selectedProductForBatches.batches || [];
    const updatedBatches = currentBatches.filter((b) => b.id !== batchId);
    const updatedProducts = updateProductBatches(selectedProductForBatches.id, updatedBatches);
    
    setProducts(updatedProducts);
    const updatedCurrent = updatedProducts.find((p) => p.id === selectedProductForBatches.id) || null;
    setSelectedProductForBatches(updatedCurrent);
  };

  return (
    <div className="space-y-6">
      
      {/* Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-neutral-400 block">Artículos en Catálogo</span>
            <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">{totalProducts}</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-apple-blue/10 flex items-center justify-center text-apple-blue">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-neutral-400 block">Stock Total en Bodega</span>
            <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">{totalStockUnits}</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-apple-purple/10 flex items-center justify-center text-apple-purple">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter(statusFilter === "low_stock" ? "all" : "low_stock")}
          className={`p-4 rounded-3xl border shadow-apple flex items-center justify-between cursor-pointer transition-all ${
            statusFilter === "low_stock" 
              ? "bg-apple-red/10 border-apple-red/40" 
              : "bg-white dark:bg-[#1c1c1e] border-neutral-200/80 dark:border-neutral-800 hover:border-apple-red/30"
          }`}
        >
          <div>
            <span className="text-[11px] font-medium text-neutral-400 block">Stock Bajo / Mínimos</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-2xl font-bold font-mono ${lowStockCount > 0 ? "text-apple-red" : "text-neutral-900 dark:text-white"}`}>
                {lowStockCount}
              </span>
              {lowStockCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-apple-red/20 text-apple-red font-bold">
                  Reabastecer
                </span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-apple-red/10 flex items-center justify-center text-apple-red">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter(statusFilter === "expiring" ? "all" : "expiring")}
          className={`p-4 rounded-3xl border shadow-apple flex items-center justify-between cursor-pointer transition-all ${
            statusFilter === "expiring" 
              ? "bg-apple-orange/10 border-apple-orange/40" 
              : "bg-white dark:bg-[#1c1c1e] border-neutral-200/80 dark:border-neutral-800 hover:border-apple-orange/30"
          }`}
        >
          <div>
            <span className="text-[11px] font-medium text-neutral-400 block">Lotes & Caducidad</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">{totalBatchesTracked}</span>
              {expiringBatchesCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-apple-orange/20 text-apple-orange font-bold flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />
                  {expiringBatchesCount} Alerta
                </span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-apple-orange/10 flex items-center justify-center text-apple-orange">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Top Action & Search Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[280px] max-w-lg">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por SKU, código de barras, nombre o número de lote..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 text-xs focus:outline-none focus:ring-2 focus:ring-apple-blue"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Category filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3.5 py-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 text-xs font-medium text-neutral-700 dark:text-neutral-300 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nuevo Producto</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-medium text-neutral-400 mr-1">Filtros:</span>
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1 rounded-full font-semibold transition-all ${
              statusFilter === "all"
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            Todos ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("batches")}
            className={`px-3 py-1 rounded-full font-semibold flex items-center gap-1 transition-all ${
              statusFilter === "batches"
                ? "bg-apple-blue text-white shadow-sm"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Con Lotes ({products.filter(p => p.hasBatches).length})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("expiring")}
            className={`px-3 py-1 rounded-full font-semibold flex items-center gap-1 transition-all ${
              statusFilter === "expiring"
                ? "bg-apple-orange text-white shadow-sm"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Alertas de Caducidad ({expiringBatchesCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("low_stock")}
            className={`px-3 py-1 rounded-full font-semibold flex items-center gap-1 transition-all ${
              statusFilter === "low_stock"
                ? "bg-apple-red text-white shadow-sm"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Stock Bajo ({lowStockCount})</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-900/60 text-neutral-400 font-semibold border-b border-neutral-200/80 dark:border-neutral-800">
              <tr>
                <th className="py-3.5 px-4">SKU & Código de Barras</th>
                <th className="py-3.5 px-4">Producto & Categoría</th>
                <th className="py-3.5 px-4">Unidad</th>
                <th className="py-3.5 px-4">Precio Venta</th>
                <th className="py-3.5 px-4">Costo</th>
                <th className="py-3.5 px-4">Stock en Bodega</th>
                <th className="py-3.5 px-4">Lotes & Caducidad</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60 font-medium text-neutral-800 dark:text-neutral-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400 text-xs">
                    No se encontraron productos con los criterios de búsqueda seleccionados.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isLow = p.stock <= p.minStock;
                  const batchesList = p.batches || (p.batchNumber ? [{
                    id: `b-${p.id}`,
                    batchNumber: p.batchNumber,
                    expirationDate: p.expirationDate || "",
                    stock: p.stock,
                    barcode: p.barcode,
                  }] : []);

                  // Earliest expiring batch
                  const earliestBatch = batchesList.length > 0 
                    ? [...batchesList].sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime())[0]
                    : null;
                  
                  const expiryInfo = earliestBatch?.expirationDate 
                    ? getBatchExpirationStatus(earliestBatch.expirationDate)
                    : null;

                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] font-bold text-neutral-600 dark:text-neutral-300 block">
                          {p.sku}
                        </span>
                        {p.barcode && (
                          <div 
                            onClick={() => copyToClipboard(p.barcode!)}
                            title="Haz clic para copiar código de barras"
                            className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-apple-blue font-mono text-[10px] cursor-pointer transition-colors"
                          >
                            <Barcode className="w-3 h-3 text-apple-blue" />
                            <span>{p.barcode}</span>
                            {copiedBarcode === p.barcode && (
                              <Check className="w-2.5 h-2.5 text-apple-green ml-0.5" />
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-neutral-900 dark:text-white block">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[10px] font-mono font-semibold text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                          {p.unit}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-apple-blue">
                        C$ {p.salePrice.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-neutral-500">
                        C$ {p.costPrice.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold ${isLow ? "text-apple-red" : "text-neutral-900 dark:text-white"}`}>
                            {p.stock} {p.unit}
                          </span>
                          {isLow && (
                            <span className="px-1.5 py-0.5 rounded-md bg-apple-red/10 text-apple-red text-[10px] font-semibold flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              <span>Bajo</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {p.hasBatches ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-neutral-900 dark:text-white">
                                {earliestBatch ? earliestBatch.batchNumber : p.batchNumber}
                              </span>
                              {batchesList.length > 1 && (
                                <span className="px-1.5 py-0.2 rounded-full bg-apple-blue/10 text-apple-blue text-[9px] font-bold">
                                  +{batchesList.length - 1} más
                                </span>
                              )}
                            </div>
                            {expiryInfo && (
                              <div className="flex items-center gap-1">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${expiryInfo.badgeClass}`}>
                                  {expiryInfo.label}
                                </span>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedProductForBatches(p)}
                              className="text-[10px] text-apple-blue hover:underline flex items-center gap-0.5 mt-0.5 font-sans"
                            >
                              <Layers className="w-2.5 h-2.5" />
                              <span>Gestionar Lotes ({batchesList.length})</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-400">Estándar</span>
                            <button
                              type="button"
                              onClick={() => {
                                const activated = {
                                  ...p,
                                  hasBatches: true,
                                  batches: [
                                    {
                                      id: "batch-" + Date.now(),
                                      batchNumber: "LOT-" + new Date().getFullYear() + "-01",
                                      expirationDate: new Date(Date.now() + 365*24*60*60*1000).toISOString().split("T")[0],
                                      stock: p.stock,
                                      barcode: p.barcode,
                                      createdAt: new Date().toISOString(),
                                    }
                                  ]
                                };
                                const updated = products.map(prod => prod.id === p.id ? activated : prod);
                                setProducts(updated);
                                saveStoredProducts(updated);
                                setSelectedProductForBatches(activated);
                              }}
                              className="text-[10px] text-neutral-400 hover:text-apple-blue underline"
                            >
                              + Activar
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {p.hasBatches ? (
                            <button
                              type="button"
                              onClick={() => setSelectedProductForBatches(p)}
                              className="px-2.5 py-1 rounded-xl bg-apple-blue/10 hover:bg-apple-blue hover:text-white text-apple-blue text-[11px] font-semibold transition-all flex items-center gap-1"
                              title="Gestionar remesas, lotes y códigos de barras"
                            >
                              <Layers className="w-3 h-3" />
                              <span>Lotes</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleQuickAddStock(p.id, 10)}
                              className="px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-apple-blue hover:text-white text-[11px] font-semibold transition-all"
                              title="Entrada rápida +10 unidades"
                            >
                              +10 Stock
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-xl bg-white dark:bg-[#1c1c1e] text-neutral-900 dark:text-neutral-100 rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-apple-blue" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Registrar Nuevo Artículo en Inventario
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                  Nombre del Producto o Insumo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Herbicida Glifosato 48% SL 1 Litro"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-apple-blue font-medium"
                />
              </div>

              {/* SKU & Barcode Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-neutral-500">
                      SKU / Código Interno
                    </label>
                    <button
                      type="button"
                      onClick={() => setSku("SKU-" + Math.floor(1000 + Math.random() * 9000))}
                      className="text-[10px] text-apple-blue hover:underline"
                    >
                      Autogenerar
                    </button>
                  </div>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="VAR-12"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono text-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-neutral-500 flex items-center gap-1">
                      <Barcode className="w-3 h-3 text-apple-blue" />
                      <span>Código de Barras (EAN / UPC)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setBarcode(generateRandomBarcode())}
                      className="text-[10px] text-apple-blue hover:underline"
                    >
                      Generar EAN
                    </button>
                  </div>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="743200192801"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                    Categoría
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                  >
                    <option value="Materiales Básicos">Materiales Básicos</option>
                    <option value="Hierro y Acero">Hierro y Acero</option>
                    <option value="Fontanería">Fontanería</option>
                    <option value="Electricidad">Electricidad</option>
                    <option value="Agroquímicos">Agroquímicos</option>
                    <option value="Herramientas">Herramientas</option>
                    <option value="Pinturas">Pinturas</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                    Unidad de Medida
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                  >
                    <option value="Vara">Vara (Hierro/Madera)</option>
                    <option value="Metro">Metro (Cable/Tubería)</option>
                    <option value="Saco">Saco (Cemento/Cal/Fertilizante)</option>
                    <option value="Quintal">Quintal (Granos)</option>
                    <option value="Libra">Libra</option>
                    <option value="Litro">Litro / Galón</option>
                    <option value="Paquete">Paquete / Caja</option>
                    <option value="Unidad">Unidad estándar</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                    Costo (C$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={costPrice}
                    onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                    Venta (C$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={salePrice}
                    onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono font-bold text-apple-blue"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                    Stock Inicial
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                    Mínimo
                  </label>
                  <input
                    type="number"
                    value={minStock}
                    onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                  />
                </div>
              </div>

              {/* Batches toggle */}
              <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-neutral-900 dark:text-white block">
                      Rastrear Lotes & Vencimiento
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      Ideal para Agroquímicos, Medicamentos, Cemento y Alimentos
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasBatches}
                    onChange={(e) => setHasBatches(e.target.checked)}
                    className="rounded text-apple-blue focus:ring-apple-blue w-4 h-4 cursor-pointer"
                  />
                </div>

                {hasBatches && (
                  <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-neutral-500 mb-1">
                          Número de Lote Inicial
                        </label>
                        <input
                          type="text"
                          placeholder="ej. L-2026-B12"
                          value={batchNumber}
                          onChange={(e) => setBatchNumber(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-700 text-xs border border-neutral-200 dark:border-neutral-600 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-500 mb-1">
                          Fecha de Caducidad / Vencimiento
                        </label>
                        <input
                          type="date"
                          value={expirationDate}
                          onChange={(e) => setExpirationDate(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-700 text-xs border border-neutral-200 dark:border-neutral-600"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-neutral-500 flex items-center gap-1">
                          <Barcode className="w-3 h-3 text-apple-blue" />
                          <span>Código de Barras específico para este Lote</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setBatchBarcode(generateRandomBarcode())}
                          className="text-[9px] text-apple-blue hover:underline"
                        >
                          Generar código único de lote
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Dejar en blanco para usar el código de barras principal"
                        value={batchBarcode}
                        onChange={(e) => setBatchBarcode(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-700 text-xs border border-neutral-200 dark:border-neutral-600 font-mono"
                      />
                      <span className="text-[10px] text-neutral-400 mt-1 block">
                        Al escanear este código en caja, se descontará automáticamente de este lote específico.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-2">
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
                  Guardar en Bodega
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch & Barcode Management Modal for a selected product */}
      {selectedProductForBatches && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-[#1c1c1e] text-neutral-900 dark:text-neutral-100 rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-5 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-apple-blue" />
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                    Gestión Integral de Lotes & Códigos de Barras
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="font-bold text-sm text-neutral-800 dark:text-neutral-200">
                    {selectedProductForBatches.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 font-mono text-[10px] text-neutral-500">
                    SKU: {selectedProductForBatches.sku}
                  </span>
                  {selectedProductForBatches.barcode && (
                    <span className="px-2 py-0.5 rounded-full bg-apple-blue/10 font-mono text-[10px] text-apple-blue flex items-center gap-1">
                      <Barcode className="w-3 h-3" />
                      {selectedProductForBatches.barcode}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductForBatches(null)}
                className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Total Stock Summary */}
            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-700/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-neutral-400 block">Stock Total Disponible</span>
                <span className="text-xl font-extrabold font-mono text-apple-blue">
                  {selectedProductForBatches.stock} {selectedProductForBatches.unit}
                </span>
              </div>
              <div className="text-right text-[11px] text-neutral-500">
                <span>Lotes activos: </span>
                <span className="font-bold font-mono text-neutral-900 dark:text-white">
                  {selectedProductForBatches.batches?.length || 0}
                </span>
              </div>
            </div>

            {/* Existing Batches List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-apple-orange" />
                <span>Lotes en Bodega (Ordenados por FEFO - Primeros a Vencer)</span>
              </h4>

              {(!selectedProductForBatches.batches || selectedProductForBatches.batches.length === 0) ? (
                <div className="p-6 rounded-2xl bg-neutral-100/50 dark:bg-neutral-800/30 text-center text-neutral-400 text-xs">
                  No hay lotes registrados para este producto aún. Añade el primer lote abajo.
                </div>
              ) : (
                <div className="space-y-2">
                  {[...selectedProductForBatches.batches]
                    .sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime())
                    .map((batch) => {
                      const expStatus = getBatchExpirationStatus(batch.expirationDate);
                      return (
                        <div
                          key={batch.id}
                          className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/80 flex flex-wrap items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm font-mono text-neutral-900 dark:text-white">
                                {batch.batchNumber}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${expStatus.badgeClass}`}>
                                {expStatus.label}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-3 text-neutral-500 font-mono text-[11px]">
                              <span>Vence: <strong className="text-neutral-700 dark:text-neutral-300">{batch.expirationDate}</strong></span>
                              
                              {batch.barcode && (
                                <div 
                                  onClick={() => copyToClipboard(batch.barcode!)}
                                  title="Copiar código de barras de este lote"
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:border-apple-blue cursor-pointer"
                                >
                                  <Barcode className="w-3 h-3 text-apple-blue" />
                                  <span>{batch.barcode}</span>
                                  {copiedBarcode === batch.barcode && (
                                    <Check className="w-2.5 h-2.5 text-apple-green ml-0.5" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Batch Stock Stepper */}
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-[10px] text-neutral-400 block">Stock en este lote</span>
                              <span className="font-mono font-bold text-sm text-neutral-900 dark:text-white">
                                {batch.stock} {selectedProductForBatches.unit}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 bg-neutral-200/60 dark:bg-neutral-700/80 rounded-xl p-1">
                              <button
                                type="button"
                                onClick={() => handleAdjustBatchStock(batch.id, -1)}
                                className="w-6 h-6 rounded-lg bg-white dark:bg-neutral-800 hover:bg-neutral-100 flex items-center justify-center font-bold text-neutral-700 dark:text-neutral-300"
                                title="Restar 1 unidad del lote"
                              >
                                -
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustBatchStock(batch.id, 1)}
                                className="w-6 h-6 rounded-lg bg-white dark:bg-neutral-800 hover:bg-neutral-100 flex items-center justify-center font-bold text-neutral-700 dark:text-neutral-300"
                                title="Sumar 1 unidad al lote"
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustBatchStock(batch.id, 10)}
                                className="px-1.5 py-0.5 rounded-lg bg-apple-blue/10 text-apple-blue font-bold text-[10px] hover:bg-apple-blue hover:text-white transition-colors"
                                title="Sumar 10 unidades al lote"
                              >
                                +10
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveBatch(batch.id)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-apple-red hover:bg-apple-red/10 transition-colors"
                              title="Eliminar lote"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Form to Add New Batch */}
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <h4 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-apple-blue" />
                <span>Ingresar Nueva Remesa / Lote a Bodega</span>
              </h4>

              <form onSubmit={handleAddNewBatch} className="space-y-3 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-700/80 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                      Número de Lote *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ej. LOT-2027-01"
                      value={newBatchNumber}
                      onChange={(e) => setNewBatchNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                      Fecha de Caducidad *
                    </label>
                    <input
                      type="date"
                      required
                      value={newBatchExpiration}
                      onChange={(e) => setNewBatchExpiration(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                      Cantidad a Ingresar ({selectedProductForBatches.unit}) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newBatchStock}
                      onChange={(e) => setNewBatchStock(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 font-mono text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-neutral-500 flex items-center gap-1">
                      <Barcode className="w-3 h-3 text-apple-blue" />
                      <span>Código de Barras exclusivo para este Lote</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewBatchBarcode(generateRandomBarcode())}
                      className="text-[10px] text-apple-blue hover:underline"
                    >
                      Generar nuevo código
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Escanear o generar código para asociar a este lote"
                    value={newBatchBarcode}
                    onChange={(e) => setNewBatchBarcode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 font-mono text-xs"
                  />
                  <span className="text-[10px] text-neutral-400 mt-1 block">
                    Al escanear este código en la caja (POS), se identificará y descontará este lote exacto con su fecha de vencimiento.
                  </span>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Guardar Lote en Bodega</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedProductForBatches(null)}
                className="px-5 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold text-xs"
              >
                Cerrar Ventana
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
