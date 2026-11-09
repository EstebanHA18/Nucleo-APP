import { Product, Customer, Sale, TenantSettings, AppUser } from "@/types";
import { INITIAL_PRODUCTS, INITIAL_CUSTOMERS } from "./constants";

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

  return { updatedProducts, updatedCustomers };
};
