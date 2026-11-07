"use client";

import React, { useState } from "react";
import { 
  Package, 
  Search, 
  Plus, 
  AlertTriangle, 
  Calendar, 
  ArrowUpDown, 
  Check, 
  Layers, 
  X,
  History,
  TrendingDown
} from "lucide-react";
import { Product, TenantSettings } from "@/types";
import { saveStoredProducts } from "@/lib/offlineStore";

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
  const [showAddModal, setShowAddModal] = useState(false);

  // New product form
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("Materiales Básicos");
  const [unit, setUnit] = useState("Vara");
  const [costPrice, setCostPrice] = useState<number>(100);
  const [salePrice, setSalePrice] = useState<number>(140);
  const [stock, setStock] = useState<number>(50);
  const [minStock, setMinStock] = useState<number>(10);
  const [hasBatches, setHasBatches] = useState(false);
  const [batchNumber, setBatchNumber] = useState("");
  const [expirationDate, setExpirationDate] = useState("");

  const categories = ["Todos", ...Array.from(new Set(products.map((p) => p.category)))];

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === "Todos" || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProd: Product = {
      id: "prod-" + Date.now(),
      sku: sku.trim() || "SKU-" + Math.floor(1000 + Math.random() * 9000),
      name: name.trim(),
      category,
      unit,
      costPrice: Number(costPrice),
      salePrice: Number(salePrice),
      stock: Number(stock),
      minStock: Number(minStock),
      hasBatches,
      batchNumber: hasBatches ? batchNumber : undefined,
      expirationDate: hasBatches ? expirationDate : undefined,
    };

    const updated = [newProd, ...products];
    setProducts(updated);
    saveStoredProducts(updated);
    setShowAddModal(false);

    // Reset
    setName("");
    setSku("");
  };

  const handleQuickAddStock = (productId: string, amount: number) => {
    const updated = products.map((p) => {
      if (p.id === productId) {
        return { ...p, stock: p.stock + amount };
      }
      return p;
    });
    setProducts(updated);
    saveStoredProducts(updated);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Action Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por SKU, código o nombre de producto..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 text-xs focus:outline-none focus:ring-2 focus:ring-apple-blue"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 text-xs font-medium text-neutral-700 dark:text-neutral-300 focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-2xl bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-900/60 text-neutral-400 font-semibold border-b border-neutral-200/80 dark:border-neutral-800">
              <tr>
                <th className="py-3 px-4">SKU / Código</th>
                <th className="py-3 px-4">Producto & Categoría</th>
                <th className="py-3 px-4">Unidad de Medida</th>
                <th className="py-3 px-4">Precio Venta</th>
                <th className="py-3 px-4">Costo</th>
                <th className="py-3 px-4">Stock en Bodega</th>
                <th className="py-3 px-4">Lote / Caducidad</th>
                <th className="py-3 px-4 text-right">Acción Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60 font-medium text-neutral-800 dark:text-neutral-200">
              {filtered.map((p) => {
                const isLow = p.stock <= p.minStock;
                return (
                  <tr key={p.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-500">
                      {p.sku}
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
                        <div>
                          <span className="text-neutral-700 dark:text-neutral-300 block font-semibold">{p.batchNumber}</span>
                          <span className="text-apple-orange text-[10px]">Vence: {p.expirationDate}</span>
                        </div>
                      ) : (
                        <span className="text-neutral-400">Estándar</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleQuickAddStock(p.id, 10)}
                          className="px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-apple-blue hover:text-white text-[10px] font-semibold transition-all"
                          title="Entrada rápida +10 unidades"
                        >
                          +10 Stock
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-[#1c1c1e] text-neutral-900 dark:text-neutral-100 rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
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
                className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                  Nombre del Producto o Material
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Varilla Corrugada 1/2 pulgada"
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-apple-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                    SKU / Código Único
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="VAR-12"
                    className="w-full px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                    Unidad de Medida
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                  >
                    <option value="Vara">Vara (Hierro/Madera)</option>
                    <option value="Metro">Metro (Cable/Tubería)</option>
                    <option value="Saco">Saco (Cemento/Cal)</option>
                    <option value="Quintal">Quintal (Granos/Fertilizante)</option>
                    <option value="Libra">Libra</option>
                    <option value="Litro">Litro / Galón</option>
                    <option value="Paquete">Paquete / Caja</option>
                    <option value="Unidad">Unidad estándar</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
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
                    Precio Venta (C$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={salePrice}
                    onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
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
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                  />
                </div>
              </div>

              {/* Batches toggle */}
              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-neutral-900 dark:text-white block">
                      Rastrear Lotes & Vencimiento
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      Requerido en Agroquímicos, Medicamentos y Alimentos
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasBatches}
                    onChange={(e) => setHasBatches(e.target.checked)}
                    className="rounded text-apple-blue focus:ring-apple-blue w-4 h-4"
                  />
                </div>

                {hasBatches && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                    <input
                      type="text"
                      placeholder="Número de Lote (ej. L-2026-X)"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-700 text-xs border border-neutral-200 dark:border-neutral-600"
                    />
                    <input
                      type="date"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-700 text-xs border border-neutral-200 dark:border-neutral-600"
                    />
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
    </div>
  );
};
