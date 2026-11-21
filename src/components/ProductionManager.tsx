"use client";

import React, { useState } from "react";
import {
  Layers,
  FlaskConical,
  Package,
  Play,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Printer,
  Edit2,
  Trash2,
  X,
  Check,
  ArrowRight,
  Wrench,
  Sparkles,
  FileText,
  Box,
  Scale,
  Percent
} from "lucide-react";
import {
  TenantSettings,
  Product,
  ProductionRecipe,
  RecipeCategory,
  RecipeIngredient,
  ProductionOrder,
  ProductionOrderStatus
} from "@/types";
import {
  saveStoredRecipes,
  saveStoredProductionOrders,
  saveStoredProducts
} from "@/lib/offlineStore";

interface ProductionManagerProps {
  tenant: TenantSettings;
  recipes: ProductionRecipe[];
  setRecipes: React.Dispatch<React.SetStateAction<ProductionRecipe[]>>;
  orders: ProductionOrder[];
  setOrders: React.Dispatch<React.SetStateAction<ProductionOrder[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const CATEGORY_LABELS: Record<RecipeCategory, string> = {
  kits_ferreteria: "Kits & Ensambles de Ferretería",
  construccion_mezclas: "Combos & Mezclas de Construcción",
  formulaciones_quimicas: "Fórmulas & Paquetes Agrícolas / Químicos",
  gastronomia_alimentos: "Recetas de Cocina & Gastronomía",
  paquetes_comerciales: "Combos & Promociones Comerciales",
};

const ORDER_STATUS_BADGES: Record<ProductionOrderStatus, { label: string; classes: string }> = {
  planificada: {
    label: "PLANIFICADA",
    classes: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
  en_proceso: {
    label: "EN PROCESO",
    classes: "bg-apple-blue/15 text-apple-blue border-apple-blue/30",
  },
  completada: {
    label: "COMPLETADA ✓",
    classes: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  cancelada: {
    label: "CANCELADA",
    classes: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  },
};

export const ProductionManager: React.FC<ProductionManagerProps> = ({
  tenant,
  recipes,
  setRecipes,
  orders,
  setOrders,
  products,
  setProducts,
}) => {
  const [activeTab, setActiveTab] = useState<"recipes" | "orders" | "simulator">("recipes");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("todas");
  const [selectedRecipe, setSelectedRecipe] = useState<ProductionRecipe | null>(recipes[0] || null);
  const [notice, setNotice] = useState<string | null>(null);

  // Modal Crear / Editar Receta (BOM)
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [recForm, setRecForm] = useState({
    name: "",
    category: "kits_ferreteria" as RecipeCategory,
    outputProductName: "",
    outputSku: "",
    outputUnit: "Kit",
    yieldQuantity: 1,
    laborCostPerBatch: 30,
    indirectCostPerBatch: 15,
    suggestedSalePrice: 500,
    autoDeductOnPosSale: true,
    prepTimeMinutes: 15,
    instructions: "",
  });
  const [formIngredients, setFormIngredients] = useState<RecipeIngredient[]>([]);
  const [selectedIngProductId, setSelectedIngProductId] = useState<string>(products[0]?.id || "");
  const [selectedIngQty, setSelectedIngQty] = useState<number>(1);
  const [selectedIngWaste, setSelectedIngWaste] = useState<number>(0);

  // Modal Nueva Orden de Producción
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderRecipeId, setOrderRecipeId] = useState<string>(recipes[0]?.id || "");
  const [orderBatches, setOrderBatches] = useState<number>(1);
  const [orderResponsible, setOrderResponsible] = useState<string>("Pedro Morales Bodega");
  const [orderNotes, setOrderNotes] = useState<string>("");
  const [executeImmediately, setExecuteImmediately] = useState<boolean>(true);

  // Simulador de Lote
  const [simRecipeId, setSimRecipeId] = useState<string>(recipes[0]?.id || "");
  const [simBatches, setSimBatches] = useState<number>(5);

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  // Filtrado de recetas
  const filteredRecipes = recipes.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.outputProductName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === "todas" || r.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Abrir modal para nueva receta
  const handleOpenNewRecipe = () => {
    setEditingRecipeId(null);
    setRecForm({
      name: "",
      category: "kits_ferreteria",
      outputProductName: "",
      outputSku: `PRD-${Math.floor(100 + Math.random() * 900)}`,
      outputUnit: "Kit",
      yieldQuantity: 1,
      laborCostPerBatch: 35,
      indirectCostPerBatch: 15,
      suggestedSalePrice: 650,
      autoDeductOnPosSale: true,
      prepTimeMinutes: 15,
      instructions: "",
    });
    setFormIngredients([]);
    setShowRecipeModal(true);
  };

  // Abrir modal para editar receta existente
  const handleOpenEditRecipe = (rec: ProductionRecipe) => {
    setEditingRecipeId(rec.id);
    setRecForm({
      name: rec.name,
      category: rec.category,
      outputProductName: rec.outputProductName,
      outputSku: rec.outputSku,
      outputUnit: rec.outputUnit,
      yieldQuantity: rec.yieldQuantity,
      laborCostPerBatch: rec.laborCostPerBatch,
      indirectCostPerBatch: rec.indirectCostPerBatch,
      suggestedSalePrice: rec.suggestedSalePrice,
      autoDeductOnPosSale: rec.autoDeductOnPosSale,
      prepTimeMinutes: rec.prepTimeMinutes,
      instructions: rec.instructions || "",
    });
    setFormIngredients(rec.ingredients);
    setShowRecipeModal(true);
  };

  // Agregar ingrediente / materia prima a la fórmula
  const handleAddIngredientToForm = () => {
    const prod = products.find((p) => p.id === selectedIngProductId);
    if (!prod || selectedIngQty <= 0) return;

    const effectiveQty = selectedIngQty * (1 + (selectedIngWaste || 0) / 100);
    const subCost = Number((effectiveQty * prod.costPrice).toFixed(2));

    const existingIdx = formIngredients.findIndex((i) => i.productId === prod.id);
    if (existingIdx >= 0) {
      const updated = [...formIngredients];
      const newQty = updated[existingIdx].quantityRequired + selectedIngQty;
      const newEff = newQty * (1 + (selectedIngWaste || 0) / 100);
      updated[existingIdx] = {
        ...updated[existingIdx],
        quantityRequired: newQty,
        subtotalCost: Number((newEff * prod.costPrice).toFixed(2)),
      };
      setFormIngredients(updated);
    } else {
      const newIng: RecipeIngredient = {
        id: `ing-${Date.now().toString(36)}`,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        unit: prod.unit,
        quantityRequired: selectedIngQty,
        unitCost: prod.costPrice,
        subtotalCost: subCost,
        wastePercentage: selectedIngWaste || 0,
      };
      setFormIngredients([...formIngredients, newIng]);
    }
    setSelectedIngQty(1);
    setSelectedIngWaste(0);
  };

  const handleRemoveIngredientFromForm = (ingId: string) => {
    setFormIngredients(formIngredients.filter((i) => i.id !== ingId));
  };

  // Guardar Receta
  const handleSaveRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recForm.name.trim() || formIngredients.length === 0) {
      alert("Por favor asigna un nombre a la receta y agrega al menos un ingrediente o materia prima.");
      return;
    }

    const ingredientsCost = formIngredients.reduce((acc, i) => acc + i.subtotalCost, 0);
    const totalBatchCost = ingredientsCost + Number(recForm.laborCostPerBatch) + Number(recForm.indirectCostPerBatch);
    const yieldQty = Math.max(1, Number(recForm.yieldQuantity));
    const unitCost = Number((totalBatchCost / yieldQty).toFixed(2));
    const salePrice = Math.max(unitCost, Number(recForm.suggestedSalePrice));
    const marginPercent = salePrice > 0 ? Number((((salePrice - unitCost) / salePrice) * 100).toFixed(2)) : 0;

    if (editingRecipeId) {
      const updatedList = recipes.map((r) => {
        if (r.id === editingRecipeId) {
          const updatedRec: ProductionRecipe = {
            ...r,
            name: recForm.name.trim(),
            category: recForm.category,
            outputProductName: recForm.outputProductName.trim() || recForm.name.trim(),
            outputSku: recForm.outputSku.trim() || r.outputSku,
            outputUnit: recForm.outputUnit.trim() || "Unidad",
            yieldQuantity: yieldQty,
            ingredients: formIngredients,
            laborCostPerBatch: Number(recForm.laborCostPerBatch),
            indirectCostPerBatch: Number(recForm.indirectCostPerBatch),
            totalRecipeCost: totalBatchCost,
            unitProductionCost: unitCost,
            suggestedSalePrice: salePrice,
            estimatedMarginPercent: marginPercent,
            autoDeductOnPosSale: recForm.autoDeductOnPosSale,
            prepTimeMinutes: Number(recForm.prepTimeMinutes) || 15,
            instructions: recForm.instructions.trim(),
          };
          setSelectedRecipe(updatedRec);
          return updatedRec;
        }
        return r;
      });
      setRecipes(updatedList);
      saveStoredRecipes(updatedList);
      showToast(`¡Fórmula "${recForm.name}" actualizada correctamente!`);
    } else {
      const nextNum = recipes.length + 1;
      const newRec: ProductionRecipe = {
        id: `rec-${Date.now().toString(36)}`,
        code: `REC-00${nextNum}`,
        name: recForm.name.trim(),
        category: recForm.category,
        outputProductName: recForm.outputProductName.trim() || recForm.name.trim(),
        outputSku: recForm.outputSku.trim() || `PRD-00${nextNum}`,
        outputUnit: recForm.outputUnit.trim() || "Kit",
        yieldQuantity: yieldQty,
        ingredients: formIngredients,
        laborCostPerBatch: Number(recForm.laborCostPerBatch),
        indirectCostPerBatch: Number(recForm.indirectCostPerBatch),
        totalRecipeCost: totalBatchCost,
        unitProductionCost: unitCost,
        suggestedSalePrice: salePrice,
        estimatedMarginPercent: marginPercent,
        autoDeductOnPosSale: recForm.autoDeductOnPosSale,
        prepTimeMinutes: Number(recForm.prepTimeMinutes) || 15,
        instructions: recForm.instructions.trim(),
        active: true,
        createdAt: new Date().toISOString().split("T")[0],
      };

      const updatedList = [newRec, ...recipes];
      setRecipes(updatedList);
      saveStoredRecipes(updatedList);
      setSelectedRecipe(newRec);
      showToast(`¡Nueva receta "${newRec.code} - ${newRec.name}" creada con éxito!`);
    }

    setShowRecipeModal(false);
  };

  // Ejecutar y Completar una Orden de Producción (Descuenta Materia Prima + Suma Producto Terminado en Inventario)
  const executeInventoryTransformation = (recipe: ProductionRecipe, batches: number): Product[] => {
    let updatedProds = products.map((p) => {
      const ing = recipe.ingredients.find((i) => i.productId === p.id);
      if (!ing) return p;

      const totalRequired = ing.quantityRequired * batches;
      const newStock = Math.max(0, Number((p.stock - totalRequired).toFixed(2)));
      return {
        ...p,
        stock: newStock,
      };
    });

    // Verificar si el producto terminado ya existe por SKU o nombre, si no, crearlo en el Inventario
    const outputQty = recipe.yieldQuantity * batches;
    const existingOutputIdx = updatedProds.findIndex(
      (p) => p.sku.toLowerCase() === recipe.outputSku.toLowerCase() || p.name.toLowerCase() === recipe.outputProductName.toLowerCase()
    );

    if (existingOutputIdx >= 0) {
      updatedProds[existingOutputIdx] = {
        ...updatedProds[existingOutputIdx],
        stock: updatedProds[existingOutputIdx].stock + outputQty,
        costPrice: recipe.unitProductionCost,
        salePrice: recipe.suggestedSalePrice,
      };
    } else {
      const newFinishedProduct: Product = {
        id: `prod-out-${Date.now().toString(36)}`,
        sku: recipe.outputSku,
        barcode: `74399${Math.floor(100000 + Math.random() * 900000)}`,
        name: recipe.outputProductName,
        category: "Producción & Kits",
        unit: recipe.outputUnit,
        costPrice: recipe.unitProductionCost,
        salePrice: recipe.suggestedSalePrice,
        stock: outputQty,
        minStock: 5,
      };
      updatedProds = [newFinishedProduct, ...updatedProds];
    }

    setProducts(updatedProds);
    saveStoredProducts(updatedProds);
    return updatedProds;
  };

  // Crear nueva Orden de Producción
  const handleCreateProductionOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const targetRec = recipes.find((r) => r.id === orderRecipeId);
    if (!targetRec || orderBatches <= 0) return;

    const nowIso = new Date().toISOString();
    const nextOrderNum = orders.length + 1;
    const totalOut = targetRec.yieldQuantity * orderBatches;
    const totalCost = Number((targetRec.totalRecipeCost * orderBatches).toFixed(2));

    if (executeImmediately) {
      executeInventoryTransformation(targetRec, orderBatches);
    }

    const newOrder: ProductionOrder = {
      id: `ord-${Date.now().toString(36)}`,
      orderNumber: `OP-2026-00${nextOrderNum}`,
      recipeId: targetRec.id,
      recipeCode: targetRec.code,
      recipeName: targetRec.name,
      batchesToProduce: orderBatches,
      totalOutputQuantity: totalOut,
      outputUnit: targetRec.outputUnit,
      totalEstimatedCost: totalCost,
      unitCostResult: targetRec.unitProductionCost,
      responsibleName: orderResponsible.trim() || "Encargado de Producción",
      status: executeImmediately ? "completada" : "en_proceso",
      deductedFromInventory: executeImmediately,
      addedOutputToInventory: executeImmediately,
      batchCodeGenerated: `LOT-PRD-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}`,
      startedAt: nowIso,
      completedAt: executeImmediately ? nowIso : undefined,
      notes: orderNotes.trim() || "Orden generada desde panel de Recetas & Producción.",
    };

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    saveStoredProductionOrders(updatedOrders);
    setShowOrderModal(false);
    setActiveTab("orders");

    if (executeImmediately) {
      showToast(
        `¡Orden ${newOrder.orderNumber} completada! Se descontaron los insumos y se ingresaron +${totalOut} ${targetRec.outputUnit}(s) de "${targetRec.outputProductName}" al Inventario.`
      );
    } else {
      showToast(`¡Orden ${newOrder.orderNumber} puesta en proceso!`);
    }
  };

  // Completar una orden que estaba en proceso
  const handleCompleteExistingOrder = (ord: ProductionOrder) => {
    if (ord.status === "completada") return;
    const targetRec = recipes.find((r) => r.id === ord.recipeId);
    if (targetRec && !ord.deductedFromInventory) {
      executeInventoryTransformation(targetRec, ord.batchesToProduce);
    }

    const nowIso = new Date().toISOString();
    const updated = orders.map((o) =>
      o.id === ord.id
        ? {
            ...o,
            status: "completada" as const,
            deductedFromInventory: true,
            addedOutputToInventory: true,
            completedAt: nowIso,
          }
        : o
    );
    setOrders(updated);
    saveStoredProductionOrders(updated);
    showToast(
      `¡Orden ${ord.orderNumber} finalizada! Inventario de materias primas descontado y +${ord.totalOutputQuantity} ${ord.outputUnit}(s) sumados a bodega.`
    );
  };

  // Imprimir Ficha Técnica de Receta / Orden de Producción
  const handlePrintRecipeSheet = (rec: ProductionRecipe) => {
    const win = window.open("", "_blank", "width=420,height=640");
    if (!win) return;
    const ingredientsHtml = rec.ingredients
      .map(
        (ing) => `
        <tr>
          <td style="padding:4px 0;">${ing.quantityRequired} ${ing.unit} - ${ing.productName}</td>
          <td style="text-align:right;font-weight:bold;">C$ ${ing.subtotalCost.toFixed(2)}</td>
        </tr>`
      )
      .join("");

    win.document.write(`
      <html>
        <head>
          <title>Ficha Técnica ${rec.code}</title>
          <style>
            body { font-family: monospace; font-size: 12px; padding: 16px; max-width: 340px; margin: 0 auto; color: #111; }
            h2, h3 { margin: 4px 0; text-align: center; }
            .line { border-top: 1px dashed #333; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
          </style>
        </head>
        <body>
          <h2>${tenant.name}</h2>
          <h3>FICHA TÉCNICA DE PRODUCCIÓN (${rec.code})</h3>
          <div class="line"></div>
          <p><strong>FÓRMULA:</strong> ${rec.name}</p>
          <p><strong>PRODUCTO RESULTANTE:</strong> ${rec.outputProductName} (${rec.outputSku})</p>
          <p><strong>RENDIMIENTO BASE:</strong> ${rec.yieldQuantity} ${rec.outputUnit}(s)</p>
          <div class="line"></div>
          <p><strong>INSUMOS / MATERIA PRIMA REQUERIDA:</strong></p>
          <table>${ingredientsHtml}</table>
          <div class="line"></div>
          <p>Mano de Obra Lote: C$ ${rec.laborCostPerBatch.toFixed(2)}</p>
          <p>Costos Indirectos: C$ ${rec.indirectCostPerBatch.toFixed(2)}</p>
          <p style="font-size:13px;"><strong>COSTO UNITARIO: C$ ${rec.unitProductionCost.toFixed(2)}</strong></p>
          <p><strong>PRECIO VENTA SUGERIDO: C$ ${rec.suggestedSalePrice.toFixed(2)} (${rec.estimatedMarginPercent}% Margen)</strong></p>
          <div class="line"></div>
          <p><strong>INSTRUCCIONES:</strong> ${rec.instructions || "Estándar de calidad Núcleo ERP."}</p>
          <script>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  // Métricas superiores
  const activeRecipesCount = recipes.filter((r) => r.active).length;
  const completedOrdersCount = orders.filter((o) => o.status === "completada").length;
  const inProgressOrdersCount = orders.filter((o) => o.status === "en_proceso").length;
  const avgMargin =
    recipes.length > 0
      ? (recipes.reduce((acc, r) => acc + r.estimatedMarginPercent, 0) / recipes.length).toFixed(1)
      : "0.0";

  // Cálculos dinámicos del formulario modal
  const currentModalIngredientsCost = formIngredients.reduce((acc, i) => acc + i.subtotalCost, 0);
  const currentModalTotalCost =
    currentModalIngredientsCost + Number(recForm.laborCostPerBatch || 0) + Number(recForm.indirectCostPerBatch || 0);
  const currentModalUnitCost = currentModalTotalCost / Math.max(1, Number(recForm.yieldQuantity || 1));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Principal del Módulo de Recetas & Producción */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-sm">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-neutral-900 dark:text-white tracking-tight">
                Recetas, Fórmulas & Órdenes de Producción
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] font-mono font-bold">
                BOM & TRANSFORMACIÓN
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Explosionado de materiales (BOM), costeo exacto de insumos, armado de kits/combos y descuento automático de materia prima en bodega.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setOrderRecipeId(selectedRecipe?.id || recipes[0]?.id || "");
              setOrderBatches(1);
              setShowOrderModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Ejecutar Orden de Producción</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNewRecipe}
            className="px-4 py-2 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nueva Receta / Fórmula</span>
          </button>
        </div>
      </div>

      {/* Notificación interactiva */}
      {notice && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* KPIs de Producción */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
            <span>RECETAS / KITS ACTIVOS</span>
            <FlaskConical className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-neutral-900 dark:text-white font-mono">
            {activeRecipesCount} <span className="text-xs font-normal text-neutral-400">Fórmulas</span>
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block">
            ● Descuento automático habilitado
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
            <span>ÓRDENES COMPLETADAS</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {completedOrdersCount} <span className="text-xs font-normal text-neutral-400">Lotes</span>
          </div>
          <span className="text-[11px] text-neutral-500 block">
            {inProgressOrdersCount} orden(es) en ensamblaje
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
            <span>MARGEN PROMEDIO RECETA</span>
            <TrendingUp className="w-4 h-4 text-apple-blue" />
          </div>
          <div className="text-2xl font-black text-apple-blue font-mono">
            {avgMargin}%
          </div>
          <span className="text-[11px] text-neutral-500 block">
            Rentabilidad sobre costo de insumos
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
            <span>INSUMOS EN BODEGA</span>
            <Package className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-neutral-900 dark:text-white font-mono">
            {products.length} <span className="text-xs font-normal text-neutral-400">SKUs</span>
          </div>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold block">
            Sincronizados con Kardex Central
          </span>
        </div>
      </div>

      {/* Pestañas de Navegación del Módulo */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-neutral-200/80 dark:border-neutral-800">
        <button
          type="button"
          onClick={() => setActiveTab("recipes")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "recipes"
              ? "bg-rose-600 text-white shadow-sm"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Catálogo de Recetas, Fórmulas & Kits ({recipes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "orders"
              ? "bg-rose-600 text-white shadow-sm"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <Play className="w-4 h-4" />
          <span>Órdenes de Producción & Transformación ({orders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("simulator")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "simulator"
              ? "bg-rose-600 text-white shadow-sm"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Simulador de Explosión de Materiales (BOM)</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* PESTAÑA 1: CATÁLOGO DE RECETAS Y EXPLOSIÓN DE INSUMOS    */}
      {/* ======================================================== */}
      {activeTab === "recipes" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda: Lista de Recetas */}
          <div className="lg:col-span-5 space-y-3">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar receta, código o kit..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold focus:outline-none"
              >
                <option value="todas">Todas las Categorías de Recetas</option>
                {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2.5">
              {filteredRecipes.map((rec) => {
                const isSelected = selectedRecipe?.id === rec.id;
                return (
                  <div
                    key={rec.id}
                    onClick={() => setSelectedRecipe(rec)}
                    className={`p-4 rounded-3xl border cursor-pointer transition-all space-y-2.5 ${
                      isSelected
                        ? "bg-white dark:bg-[#1c1c1e] border-rose-500 ring-2 ring-rose-500/20 shadow-md"
                        : "bg-white/85 dark:bg-[#1c1c1e]/80 border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 font-mono font-bold text-[10px]">
                        {rec.code}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        Margen: {rec.estimatedMarginPercent}%
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xs font-extrabold text-neutral-900 dark:text-white leading-snug">
                        {rec.name}
                      </h3>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Produce: <strong>{rec.yieldQuantity} {rec.outputUnit}</strong> • ({rec.ingredients.length} insumos)
                      </p>
                    </div>

                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-neutral-400 block">Costo Unitario:</span>
                        <span className="font-bold text-neutral-800 dark:text-neutral-200">
                          C$ {rec.unitProductionCost.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-neutral-400 block">Precio Venta:</span>
                        <span className="font-extrabold text-rose-600 dark:text-rose-400">
                          C$ {rec.suggestedSalePrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Columna Derecha: Ficha de Explosión de Materiales (BOM) de la Receta */}
          <div className="lg:col-span-7">
            {selectedRecipe ? (
              <div className="p-6 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-neutral-200/80 dark:border-neutral-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-mono font-bold text-xs">
                        {selectedRecipe.code}
                      </span>
                      <span className="text-xs text-neutral-400 font-medium">
                        {CATEGORY_LABELS[selectedRecipe.category]}
                      </span>
                    </div>
                    <h2 className="text-base font-extrabold text-neutral-900 dark:text-white mt-1">
                      {selectedRecipe.name}
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Producto Terminado: <strong>{selectedRecipe.outputProductName}</strong> (SKU:{" "}
                      <span className="font-mono">{selectedRecipe.outputSku}</span>)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePrintRecipeSheet(selectedRecipe)}
                      className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Ficha Técnica</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditRecipe(selectedRecipe)}
                      className="px-3 py-1.5 rounded-xl bg-apple-blue/15 text-apple-blue hover:bg-apple-blue/25 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar Fórmula</span>
                    </button>
                  </div>
                </div>

                {/* Resumen de Costeo de la Receta */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60">
                    <span className="text-[10px] text-neutral-400 block uppercase">Rendimiento Base</span>
                    <span className="text-sm font-extrabold text-neutral-900 dark:text-white">
                      {selectedRecipe.yieldQuantity} {selectedRecipe.outputUnit}(s)
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60">
                    <span className="text-[10px] text-neutral-400 block uppercase">Costo Unitario</span>
                    <span className="text-sm font-extrabold text-neutral-900 dark:text-white">
                      C$ {selectedRecipe.unitProductionCost.toFixed(2)}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60">
                    <span className="text-[10px] text-neutral-400 block uppercase">Precio Sugerido</span>
                    <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400">
                      C$ {selectedRecipe.suggestedSalePrice.toFixed(2)}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block uppercase font-bold">
                      Utilidad Neta
                    </span>
                    <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                      C$ {(selectedRecipe.suggestedSalePrice - selectedRecipe.unitProductionCost).toFixed(2)} ({selectedRecipe.estimatedMarginPercent}%)
                    </span>
                  </div>
                </div>

                {/* Tabla de Ingredientes / Materias Primas (Bill of Materials) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500 font-mono">
                      Lista de Materiales e Insumos Requeridos (BOM)
                    </h3>
                    <span className="text-[11px] text-neutral-400">
                      Verificación de stock en tiempo real
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-neutral-200/80 dark:border-neutral-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-50 dark:bg-neutral-800/80 text-neutral-400 font-mono text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3">Insumo / Materia Prima</th>
                          <th className="py-2.5 px-3">Cant. Requerida</th>
                          <th className="py-2.5 px-3">Stock Bodega</th>
                          <th className="py-2.5 px-3">Costo Unit.</th>
                          <th className="py-2.5 px-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/70">
                        {selectedRecipe.ingredients.map((ing) => {
                          const invProd = products.find((p) => p.id === ing.productId);
                          const currentStock = invProd ? invProd.stock : 0;
                          const hasEnough = currentStock >= ing.quantityRequired;

                          return (
                            <tr key={ing.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                              <td className="py-2.5 px-3">
                                <span className="font-bold text-neutral-900 dark:text-white block">
                                  {ing.productName}
                                </span>
                                <span className="text-[10px] font-mono text-neutral-400">
                                  SKU: {ing.sku} {ing.wastePercentage ? `• Merma: ${ing.wastePercentage}%` : ""}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-neutral-800 dark:text-neutral-200">
                                {ing.quantityRequired} {ing.unit}
                              </td>
                              <td className="py-2.5 px-3 font-mono">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    hasEnough
                                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                      : "bg-red-500/15 text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {currentStock} {ing.unit} {hasEnough ? "✓" : "⚠️ Bajo"}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-neutral-500">
                                C$ {ing.unitCost.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-right text-neutral-900 dark:text-white">
                                C$ {ing.subtotalCost.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Desglose de Costos Directos e Indirectos */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/70 dark:border-neutral-700/60 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-neutral-500 block">
                      Mano de Obra Operativa: <strong>C$ {selectedRecipe.laborCostPerBatch.toFixed(2)}</strong> • Costos Indirectos / Empaque:{" "}
                      <strong>C$ {selectedRecipe.indirectCostPerBatch.toFixed(2)}</strong>
                    </span>
                    <span className="text-[11px] text-neutral-400 block">
                      Tiempo estimado de preparación: <strong>{selectedRecipe.prepTimeMinutes} minutos</strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setOrderRecipeId(selectedRecipe.id);
                      setOrderBatches(1);
                      setShowOrderModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Producir Lote de esta Receta</span>
                  </button>
                </div>

                {selectedRecipe.instructions && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                    <span className="font-bold block mb-0.5">📋 Instrucciones de Estandarización y Ensamblaje:</span>
                    <p className="text-[11px] leading-relaxed">{selectedRecipe.instructions}</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 2: ÓRDENES DE PRODUCCIÓN Y TRANSFORMACIÓN        */}
      {/* ======================================================== */}
      {activeTab === "orders" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-200/80 dark:border-neutral-800">
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">
                Bitácora de Órdenes de Producción & Transformación de Inventario
              </h3>
              <p className="text-xs text-neutral-400">
                Cada orden completada descuenta automáticamente las materias primas de bodega e ingresa las unidades terminadas al Kardex.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowOrderModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Orden de Producción</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 font-mono">
                <tr>
                  <th className="py-2.5 px-3">Nº Orden</th>
                  <th className="py-2.5 px-3">Receta / Fórmula</th>
                  <th className="py-2.5 px-3">Lotes</th>
                  <th className="py-2.5 px-3">Producción Resultante</th>
                  <th className="py-2.5 px-3">Costo Total</th>
                  <th className="py-2.5 px-3">Responsable</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {orders.map((ord) => {
                  const badge = ORDER_STATUS_BADGES[ord.status];
                  return (
                    <tr key={ord.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                      <td className="py-3 px-3 font-mono font-bold text-rose-600 dark:text-rose-400">
                        {ord.orderNumber}
                        {ord.batchCodeGenerated && (
                          <span className="block text-[9px] text-neutral-400">{ord.batchCodeGenerated}</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-neutral-900 dark:text-white block">{ord.recipeName}</span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          Código: {ord.recipeCode} • {new Date(ord.startedAt).toLocaleDateString("es-NI")}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">{ord.batchesToProduce}x</td>
                      <td className="py-3 px-3 font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                        +{ord.totalOutputQuantity} {ord.outputUnit}(s)
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">
                        C$ {ord.totalEstimatedCost.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-neutral-600 dark:text-neutral-300">{ord.responsibleName}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badge.classes}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {ord.status !== "completada" ? (
                          <button
                            type="button"
                            onClick={() => handleCompleteExistingOrder(ord)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer"
                          >
                            Completar & Ingresar Stock
                          </button>
                        ) : (
                          <span className="text-[11px] font-mono text-neutral-400">Kardex Sincronizado ✓</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 3: SIMULADOR DE EXPLOSIÓN DE MATERIALES (BOM)    */}
      {/* ======================================================== */}
      {activeTab === "simulator" && (() => {
        const simRec = recipes.find((r) => r.id === simRecipeId) || recipes[0];
        if (!simRec) return null;

        const totalUnitsOut = simRec.yieldQuantity * simBatches;
        const totalProductionCost = simRec.totalRecipeCost * simBatches;
        const totalExpectedRevenue = totalUnitsOut * simRec.suggestedSalePrice;
        const totalExpectedProfit = totalExpectedRevenue - totalProductionCost;

        return (
          <div className="p-6 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-200/80 dark:border-neutral-800">
              <div>
                <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">
                  Simulador de Explosión de Insumos yDisponibilidad de Bodega
                </h3>
                <p className="text-xs text-neutral-400">
                  Calcula exactamente cuánta materia prima necesitas para producir múltiples lotes y verifica si tienes stock suficiente antes de iniciar.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold mb-1">Selecciona la Receta o Kit a Simular:</label>
                <select
                  value={simRec.id}
                  onChange={(e) => setSimRecipeId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-bold"
                >
                  {recipes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.code} — {r.name} (Produce {r.yieldQuantity} {r.outputUnit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1">Cantidad de Lotes a Producir:</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={simBatches}
                  onChange={(e) => setSimBatches(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono font-extrabold text-rose-600 dark:text-rose-400"
                />
              </div>
            </div>

            {/* Tarjetas de proyección del lote simulado */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
                <span className="text-[10px] text-neutral-400 block">PRODUCCIÓN TOTAL PROYECTADA</span>
                <span className="text-lg font-black text-neutral-900 dark:text-white">
                  {totalUnitsOut} {simRec.outputUnit}(s)
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
                <span className="text-[10px] text-neutral-400 block">INVERSIÓN TOTAL EN INSUMOS + M.O.</span>
                <span className="text-lg font-black text-rose-600 dark:text-rose-400">
                  C$ {totalProductionCost.toLocaleString("es-NI", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                  GANANCIA BRUTA ESTIMADA AL VENDER
                </span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  +C$ {totalExpectedProfit.toLocaleString("es-NI", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Tabla de verificación de insumos para la cantidad de lotes simulados */}
            <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 dark:bg-neutral-800 text-neutral-400 font-mono">
                  <tr>
                    <th className="py-2.5 px-3">Materia Prima</th>
                    <th className="py-2.5 px-3">Requerido para {simBatches} Lote(s)</th>
                    <th className="py-2.5 px-3">Disponible en Bodega</th>
                    <th className="py-2.5 px-3">Estado de Abastecimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                  {simRec.ingredients.map((ing) => {
                    const needed = ing.quantityRequired * simBatches;
                    const prod = products.find((p) => p.id === ing.productId);
                    const available = prod ? prod.stock : 0;
                    const diff = available - needed;

                    return (
                      <tr key={ing.id}>
                        <td className="py-2.5 px-3 font-bold">{ing.productName}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-rose-600 dark:text-rose-400">
                          {needed} {ing.unit}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold">
                          {available} {ing.unit}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {diff >= 0 ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                              ✓ Stock Suficiente (Sobran {diff} {ing.unit})
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-[10px] font-bold">
                              ⚠️ Faltan {Math.abs(diff)} {ing.unit} para completar
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* ======================================================== */}
      {/* MODAL 1: CREAR / EDITAR RECETA O FÓRMULA DE PRODUCCIÓN   */}
      {/* ======================================================== */}
      {showRecipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-[#18191f] text-neutral-900 dark:text-neutral-100 rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-rose-500" />
                <h3 className="font-extrabold text-sm">
                  {editingRecipeId ? "Editar Receta / Fórmula de Producción" : "Crear Nueva Receta / Fórmula (BOM)"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRecipeModal(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRecipe} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold mb-1">Nombre de la Receta / Fórmula:</label>
                  <input
                    type="text"
                    required
                    value={recForm.name}
                    onChange={(e) =>
                      setRecForm({
                        ...recForm,
                        name: e.target.value,
                        outputProductName: recForm.outputProductName || e.target.value,
                      })
                    }
                    placeholder="Ej. Kit Fontanería Completo / Combo Construcción..."
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1">Categoría:</label>
                  <select
                    value={recForm.category}
                    onChange={(e) => setRecForm({ ...recForm, category: e.target.value as RecipeCategory })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-semibold"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold mb-1">Producto Terminado Resultante:</label>
                  <input
                    type="text"
                    required
                    value={recForm.outputProductName}
                    onChange={(e) => setRecForm({ ...recForm, outputProductName: e.target.value })}
                    placeholder="Nombre del producto que entrará a stock"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">SKU Resultante:</label>
                  <input
                    type="text"
                    value={recForm.outputSku}
                    onChange={(e) => setRecForm({ ...recForm, outputSku: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Rendimiento & Unidad:</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      min={1}
                      value={recForm.yieldQuantity}
                      onChange={(e) => setRecForm({ ...recForm, yieldQuantity: parseInt(e.target.value) || 1 })}
                      className="w-16 px-2 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono font-bold text-center"
                    />
                    <input
                      type="text"
                      value={recForm.outputUnit}
                      onChange={(e) => setRecForm({ ...recForm, outputUnit: e.target.value })}
                      placeholder="Kit"
                      className="w-full px-2 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                    />
                  </div>
                </div>
              </div>

              {/* Constructor de Ingredientes / Materias Primas */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-3">
                <span className="text-[11px] font-extrabold uppercase text-rose-600 dark:text-rose-400 block font-mono">
                  Agregar Materias Primas / Insumos del Inventario:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                  <div className="sm:col-span-6">
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Insumo de Bodega:</label>
                    <select
                      value={selectedIngProductId}
                      onChange={(e) => setSelectedIngProductId(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-semibold"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.unit} • Costo: C$ {p.costPrice})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Cantidad:</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={selectedIngQty}
                      onChange={(e) => setSelectedIngQty(parseFloat(e.target.value) || 1)}
                      className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-neutral-400 mb-0.5">% Merma:</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={selectedIngWaste}
                      onChange={(e) => setSelectedIngWaste(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddIngredientToForm}
                      className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
                    >
                      + Insumo
                    </button>
                  </div>
                </div>

                {/* Lista de ingredientes agregados */}
                {formIngredients.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    {formIngredients.map((ing) => (
                      <div
                        key={ing.id}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/70 dark:border-neutral-700 text-xs"
                      >
                        <div>
                          <span className="font-bold">{ing.productName}</span>
                          <span className="text-neutral-400 font-mono ml-2">
                            {ing.quantityRequired} {ing.unit} × C$ {ing.unitCost.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold">C$ {ing.subtotalCost.toFixed(2)}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveIngredientFromForm(ing.id)}
                            className="text-red-500 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Costos operativos y precio de venta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Mano de Obra por Lote (C$):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={recForm.laborCostPerBatch}
                    onChange={(e) => setRecForm({ ...recForm, laborCostPerBatch: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1">Costos Indirectos / Empaque (C$):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={recForm.indirectCostPerBatch}
                    onChange={(e) => setRecForm({ ...recForm, indirectCostPerBatch: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1">Precio Venta Sugerido (C$):</label>
                  <input
                    type="number"
                    step="1"
                    value={recForm.suggestedSalePrice}
                    onChange={(e) => setRecForm({ ...recForm, suggestedSalePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono font-extrabold text-rose-600 dark:text-rose-400"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs font-mono">
                <span>Costo Unitario Calculado: <strong>C$ {currentModalUnitCost.toFixed(2)}</strong></span>
                <span>
                  Margen Proyectado:{" "}
                  <strong>
                    {recForm.suggestedSalePrice > 0
                      ? (((recForm.suggestedSalePrice - currentModalUnitCost) / recForm.suggestedSalePrice) * 100).toFixed(1)
                      : "0"}
                    %
                  </strong>
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  {editingRecipeId ? "Guardar Cambios en Fórmula" : "Guardar Receta / Fórmula"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRecipeModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: EJECUTAR NUEVA ORDEN DE PRODUCCIÓN              */}
      {/* ======================================================== */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-[#18191f] text-neutral-900 dark:text-neutral-100 rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-500 fill-current" />
                <h3 className="font-extrabold text-sm">Ejecutar Orden de Producción y Transformación</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProductionOrder} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold mb-1">Receta / Fórmula a Producir:</label>
                <select
                  value={orderRecipeId}
                  onChange={(e) => setOrderRecipeId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-bold"
                >
                  {recipes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.code} — {r.name} (Costo Lote: C$ {r.totalRecipeCost.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Cantidad de Lotes:</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={orderBatches}
                    onChange={(e) => setOrderBatches(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Responsable de Producción:</label>
                  <input
                    type="text"
                    value={orderResponsible}
                    onChange={(e) => setOrderResponsible(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-semibold"
                  />
                </div>
              </div>

              <div
                onClick={() => setExecuteImmediately(!executeImmediately)}
                className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 cursor-pointer flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300 block">
                    Descontar insumos e ingresar producto terminado al instante
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    Actualiza automáticamente el Kardex de Inventario al confirmar
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={executeImmediately}
                  onChange={() => {}}
                  className="w-4 h-4 accent-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1">Notas u Observaciones del Lote:</label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Ej. Lote preparado para exhibición de mostrador..."
                  className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Confirmar Orden de Producción
                </button>
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
