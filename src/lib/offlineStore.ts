import { Product, Customer, Sale, TenantSettings } from "@/types";
import { INITIAL_PRODUCTS, INITIAL_CUSTOMERS } from "./constants";

const STORAGE_KEYS = {
  TENANT: "nucleo_tenant_settings",
  PRODUCTS: "nucleo_products",
  CUSTOMERS: "nucleo_customers",
  SALES: "nucleo_sales",
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
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_PRODUCTS;
  }
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

export const recordSaleLocally = (sale: Sale): { updatedProducts: Product[]; updatedCustomers: Customer[] } => {
  const sales = getStoredSales();
  sales.unshift(sale);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }

  // 1. Descontar inventario automáticamente
  const products = getStoredProducts();
  const updatedProducts = products.map((prod) => {
    const itemInSale = sale.items.find((it) => it.product.id === prod.id);
    if (itemInSale) {
      const newStock = Math.max(0, prod.stock - itemInSale.quantity);
      return { ...prod, stock: newStock };
    }
    return prod;
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

  // 3. Cola offline
  if (typeof window !== "undefined" && !navigator.onLine) {
    const queueRaw = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE) || "[]";
    try {
      const queue = JSON.parse(queueRaw);
      queue.push(sale);
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    } catch {
      // Ignorar
    }
  }

  return { updatedProducts, updatedCustomers };
};
