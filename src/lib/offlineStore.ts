import { Product, Customer, Sale, TenantSettings, AppUser, Batch } from "@/types";
import { INITIAL_PRODUCTS, INITIAL_CUSTOMERS } from "./constants";

export function getBatchExpirationStatus(dateStr?: string): {
  status: "expired" | "expiring_soon" | "valid";
  daysRemaining: number;
  label: string;
  badgeClass: string;
} {
  if (!dateStr) {
    return {
      status: "valid",
      daysRemaining: 999,
      label: "Sin fecha",
      badgeClass: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
    };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(dateStr);
  const diffTime = expiry.getTime() - now.getTime();
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return {
      status: "expired",
      daysRemaining: days,
      label: `Vencido (${Math.abs(days)}d atrás)`,
      badgeClass: "bg-apple-red/10 text-apple-red border border-apple-red/30",
    };
  } else if (days <= 30) {
    return {
      status: "expiring_soon",
      daysRemaining: days,
      label: `Por vencer (${days}d)`,
      badgeClass: "bg-apple-orange/10 text-apple-orange border border-apple-orange/30 animate-pulse font-bold",
    };
  } else {
    return {
      status: "valid",
      daysRemaining: days,
      label: `Vigente (${days}d)`,
      badgeClass: "bg-apple-green/10 text-apple-green border border-apple-green/30",
    };
  }
}

const STORAGE_KEYS = {
  TENANT: "nucleo_tenant_settings",
  PRODUCTS: "nucleo_products",
  CUSTOMERS: "nucleo_customers",
  SALES: "nucleo_sales",
  USERS: "nucleo_users",
  CURRENT_USER: "nucleo_current_user",
  OFFLINE_QUEUE: "nucleo_offline_queue",
};

export const getStoredTenant = (): TenantSettings | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEYS.TENANT);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const saveStoredTenant = (tenant: TenantSettings) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.TENANT, JSON.stringify(tenant));
};

export const getStoredProducts = (): Product[] => {
  if (typeof window === "undefined") return INITIAL_PRODUCTS;
  const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
  let prods: Product[] = [];
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    prods = INITIAL_PRODUCTS;
  } else {
    try {
      prods = JSON.parse(raw);
    } catch {
      prods = INITIAL_PRODUCTS;
    }
  }

  // Normalizar y sincronizar lotes existentes si el producto tiene hasBatches
  let hasChanges = false;
  const normalized = prods.map((p) => {
    let updated = { ...p };
    // Asegurar que prod-5 o productos con hasBatches tengan su colección de lotes
    if (updated.hasBatches) {
      if (!updated.batches || updated.batches.length === 0) {
        updated.batches = [
          {
            id: `batch-${updated.id}-1`,
            batchNumber: updated.batchNumber || "L-2026-B12",
            expirationDate: updated.expirationDate || "2027-08-15",
            stock: updated.stock,
            barcode: updated.barcode || `${updated.sku}-B1`,
            createdAt: new Date().toISOString(),
          },
        ];
        hasChanges = true;
      } else {
        // Asegurar consistencia del stock total como la suma de sus lotes
        const totalBatchStock = updated.batches.reduce((sum, b) => sum + (Number(b.stock) || 0), 0);
        if (updated.stock !== totalBatchStock) {
          updated.stock = totalBatchStock;
          hasChanges = true;
        }
      }
    }
    return updated;
  });

  if (hasChanges && typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(normalized));
  }

  return normalized;
};

export const saveStoredProducts = (products: Product[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
};

export const getStoredCustomers = (): Customer[] => {
  if (typeof window === "undefined") return INITIAL_CUSTOMERS;
  const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
    return INITIAL_CUSTOMERS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_CUSTOMERS;
  }
};

export const saveStoredCustomers = (customers: Customer[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
};

export const getStoredSales = (): Sale[] => {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEYS.SALES);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const getStoredUsers = (tenant?: TenantSettings | null): AppUser[] => {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEYS.USERS);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }

  // Generar usuarios iniciales
  const ownerName = tenant?.owner?.fullName || "Dueño General";
  const initialUsers: AppUser[] = [
    {
      id: "usr-owner",
      fullName: ownerName,
      username: "admin",
      email: tenant?.owner?.email || "admin@nucleo.ni",
      pinCode: tenant?.owner?.pinCode || "1234",
      role: "owner",
      roleLabel: "Propietario / Dueño",
      allowedModules: tenant?.activeModules || ["pos", "inventory", "billing", "customers", "expenses"],
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "usr-cashier",
      fullName: "Juan Carlos Cajero",
      username: "caja1",
      phone: "+505 8812-4401",
      pinCode: "0000",
      role: "cashier",
      roleLabel: "Cajero de Mostrador",
      allowedModules: ["pos"],
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "usr-inventory",
      fullName: "Pedro Morales Bodega",
      username: "bodega1",
      phone: "+505 8731-9922",
      pinCode: "1111",
      role: "inventory_clerk",
      roleLabel: "Encargado de Inventario",
      allowedModules: ["inventory"],
      active: true,
      createdAt: new Date().toISOString(),
    },
  ];

  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUsers));
  return initialUsers;
};

export const saveStoredUsers = (users: AppUser[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const getCurrentUser = (users?: AppUser[]): AppUser => {
  if (typeof window === "undefined") {
    return {
      id: "usr-owner",
      fullName: "Propietario",
      username: "admin",
      pinCode: "1234",
      role: "owner",
      roleLabel: "Dueño",
      allowedModules: ["pos", "inventory", "billing", "customers"],
      active: true,
      createdAt: new Date().toISOString(),
    };
  }

  const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }

  const allUsers = users || getStoredUsers();
  const owner = allUsers.find((u) => u.role === "owner") || allUsers[0];
  if (owner) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(owner));
    return owner;
  }

  return {
    id: "usr-owner",
    fullName: "Propietario",
    username: "admin",
    pinCode: "1234",
    role: "owner",
    roleLabel: "Dueño",
    allowedModules: ["pos", "inventory", "billing", "customers"],
    active: true,
    createdAt: new Date().toISOString(),
  };
};

export const saveCurrentUser = (user: AppUser) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
};

export const updateProductBatches = (productId: string, batches: Batch[]): Product[] => {
  const products = getStoredProducts();
  const updated = products.map((prod) => {
    if (prod.id === productId) {
      const totalStock = batches.reduce((acc, b) => acc + (Number(b.stock) || 0), 0);
      const activeBatch = batches.find((b) => b.stock > 0) || batches[0];
      return {
        ...prod,
        hasBatches: true,
        batches,
        stock: totalStock,
        batchNumber: activeBatch?.batchNumber || prod.batchNumber,
        expirationDate: activeBatch?.expirationDate || prod.expirationDate,
      };
    }
    return prod;
  });
  saveStoredProducts(updated);
  return updated;
};

export const recordSaleLocally = (sale: Sale): { updatedProducts: Product[]; updatedCustomers: Customer[] } => {
  const sales = getStoredSales();
  sales.unshift(sale);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }

  // 1. Descontar inventario automáticamente con soporte de Lotes & FEFO
  const products = getStoredProducts();
  const updatedProducts = products.map((prod) => {
    // Buscar si este producto fue vendido en la orden
    const itemsInSale = sale.items.filter((it) => it.product.id === prod.id);
    if (itemsInSale.length === 0) return prod;

    const totalDeduct = itemsInSale.reduce((acc, it) => acc + it.quantity, 0);

    // Si maneja lotes
    if (prod.hasBatches && prod.batches && prod.batches.length > 0) {
      let updatedBatches = prod.batches.map((b) => ({ ...b }));

      // Para cada ítem en la venta (puede haber múltiples líneas o lotes específicos)
      itemsInSale.forEach((saleItem) => {
        let remaining = saleItem.quantity;

        if (saleItem.selectedBatch) {
          // Si el cajero seleccionó o escaneó un lote específico
          updatedBatches = updatedBatches.map((b) => {
            if (b.id === saleItem.selectedBatch?.id || b.batchNumber === saleItem.selectedBatch?.batchNumber) {
              const take = Math.min(b.stock, remaining);
              remaining -= take;
              return { ...b, stock: Math.max(0, b.stock - take) };
            }
            return b;
          });
        }

        // Si aún queda por descontar (o no se seleccionó lote específico), usar FEFO (First Expired First Out)
        if (remaining > 0) {
          // Ordenar índices por fecha de vencimiento ascendente
          const sortedIndices = updatedBatches
            .map((b, idx) => ({ idx, expiry: new Date(b.expirationDate).getTime(), stock: b.stock }))
            .sort((a, b) => a.expiry - b.expiry);

          for (const item of sortedIndices) {
            if (remaining <= 0) break;
            const currentBatchStock = updatedBatches[item.idx].stock;
            if (currentBatchStock > 0) {
              const take = Math.min(currentBatchStock, remaining);
              updatedBatches[item.idx].stock -= take;
              remaining -= take;
            }
          }
        }
      });

      const totalBatchStock = updatedBatches.reduce((acc, b) => acc + b.stock, 0);
      const nextActive = updatedBatches.find((b) => b.stock > 0) || updatedBatches[0];

      return {
        ...prod,
        stock: totalBatchStock,
        batches: updatedBatches,
        batchNumber: nextActive?.batchNumber || prod.batchNumber,
        expirationDate: nextActive?.expirationDate || prod.expirationDate,
      };
    }

    // Producto estándar sin lotes
    const newStock = Math.max(0, prod.stock - totalDeduct);
    return { ...prod, stock: newStock };
  });
  saveStoredProducts(updatedProducts);

  // 2. Actualizar historial de compra del cliente
  const customers = getStoredCustomers();
  let updatedCustomers = customers;
  if (sale.customer && sale.customer.id !== "cust-4") {
    updatedCustomers = customers.map((c) => {
      if (c.id === sale.customer?.id) {
        return {
          ...c,
          totalPurchases: (c.totalPurchases || 0) + sale.total,
          lastPurchaseDate: new Date().toISOString().split("T")[0],
        };
      }
      return c;
    });
    saveStoredCustomers(updatedCustomers);
  }

  return { updatedProducts, updatedCustomers };
};
