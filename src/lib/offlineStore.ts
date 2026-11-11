import { 
  Product, 
  Customer, 
  Sale, 
  TenantSettings, 
  AppUser, 
  Batch, 
  CashRegisterSession,
  PetPatient,
  ClinicalPatient 
} from "@/types";
import { 
  INITIAL_PRODUCTS, 
  INITIAL_CUSTOMERS, 
  INITIAL_VET_PATIENTS, 
  INITIAL_CLINICAL_PATIENTS 
} from "./constants";

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

export const INITIAL_TENANTS: TenantSettings[] = [
  {
    id: "tenant-ferreteria-1",
    name: "Ferretería El Tornillo Dorado",
    legalName: "Distribuidora Ferretera del Occidente S.A.",
    taxId: "J031000049102",
    phone: "+505 2341-2090",
    email: "ventas@tornillodorado.com",
    address: "Costado Norte del Parque Central, 1c al Este",
    city: "Chinandega",
    owner: {
      fullName: "Don Carlos Mendoza",
      email: "carlos@tornillodorado.com",
      phone: "+505 8892-1049",
      role: "owner",
      pinCode: "1234",
    },
    businessVertical: "ferreteria",
    currency: "NIO",
    secondaryCurrency: "USD",
    exchangeRate: 36.62,
    taxPercentage: 15.0,
    activeModules: ["pos", "inventory", "billing", "customers", "expenses", "veterinary", "clinical"],
    ticketFormat: "80mm",
    ticketHeader: "Ferretería El Tornillo Dorado",
    ticketFooter: "¡Gracias por su compra! Revise su mercadería al salir.",
    invoiceSlogan: "Calidad, Servicio y Garantía para tu Negocio",
    showTaxBreakdown: true,
    showUsdEquivalence: true,
    showBarcodeOnTicket: true,
    showLogoOnTicket: true,
    logoSize: "md",
    autoPrintBluetooth: false,
    isSetupCompleted: true,
    monthlyPlanPrice: 29.0,
    planName: "Pro",
    billingCycle: "monthly",
    paymentStatus: "active",
    adminAssignedBy: "SuperAdmin Central // God Mode",
    createdAt: "2026-10-24T00:00:00.000Z",
    planAssignedDate: "2026-10-24",
    billingCutDay: 10,
    billingDueDay: 5,
    loginUsername: "propietario",
    loginPassword: "1234",
  },
  {
    id: "tenant-dental-2",
    name: "Clínica Dental & Odontología Sonrisas",
    legalName: "Clínica Dental Sonrisas & Especialidades S.A.",
    taxId: "J031000099881",
    phone: "+505 2270-1122",
    email: "contacto@sonrisasdental.ni",
    address: "Plaza España, Módulo 4-B",
    city: "Managua",
    owner: {
      fullName: "Dra. Patricia Somarriba",
      email: "patricia@sonrisasdental.ni",
      phone: "+505 8433-2211",
      role: "owner",
      pinCode: "1234",
    },
    businessVertical: "dental",
    currency: "NIO",
    secondaryCurrency: "USD",
    exchangeRate: 36.62,
    taxPercentage: 15.0,
    activeModules: ["clinical", "pos", "inventory", "billing", "customers"],
    ticketFormat: "80mm",
    ticketHeader: "Clínica Dental Sonrisas",
    ticketFooter: "¡Cuidamos de tu sonrisa y salud bucal!",
    invoiceSlogan: "Odontología Digital y Especializada",
    showTaxBreakdown: true,
    showUsdEquivalence: true,
    showBarcodeOnTicket: true,
    showLogoOnTicket: true,
    logoSize: "md",
    autoPrintBluetooth: false,
    isSetupCompleted: true,
    monthlyPlanPrice: 39.0,
    planName: "Enterprise",
    billingCycle: "monthly",
    paymentStatus: "active",
    adminAssignedBy: "SuperAdmin Central // God Mode",
    createdAt: "2026-10-15T00:00:00.000Z",
    planAssignedDate: "2026-10-15",
    billingCutDay: 10,
    billingDueDay: 5,
    loginUsername: "clinica",
    loginPassword: "1234",
  },
  {
    id: "tenant-vet-3",
    name: "Veterinaria & Pet Care San Francisco",
    legalName: "Servicios Veterinarios San Francisco S.A.",
    taxId: "J031000077665",
    phone: "+505 2311-5500",
    email: "citas@vetsanfrancisco.ni",
    address: "De la Iglesia La Merced 1c al Sur",
    city: "León",
    owner: {
      fullName: "Dra. Lucía Mendoza",
      email: "lucia@vetsanfrancisco.ni",
      phone: "+505 8455-6677",
      role: "owner",
      pinCode: "1234",
    },
    businessVertical: "veterinaria",
    currency: "NIO",
    secondaryCurrency: "USD",
    exchangeRate: 36.62,
    taxPercentage: 15.0,
    activeModules: ["veterinary", "pos", "inventory", "billing", "customers"],
    ticketFormat: "80mm",
    ticketHeader: "Veterinaria San Francisco",
    ticketFooter: "¡El mejor cuidado médico para tu mejor amigo!",
    invoiceSlogan: "Medicina Veterinaria y Cirugía Especializada",
    showTaxBreakdown: true,
    showUsdEquivalence: true,
    showBarcodeOnTicket: true,
    showLogoOnTicket: true,
    logoSize: "md",
    autoPrintBluetooth: false,
    isSetupCompleted: true,
    monthlyPlanPrice: 35.0,
    planName: "Pro",
    billingCycle: "monthly",
    paymentStatus: "active",
    adminAssignedBy: "SuperAdmin Central // God Mode",
    createdAt: "2026-11-01T00:00:00.000Z",
    planAssignedDate: "2026-11-01",
    billingCutDay: 10,
    billingDueDay: 5,
    loginUsername: "veterinaria",
    loginPassword: "1234",
  },
];

const STORAGE_KEYS = {
  TENANT: "nucleo_tenant_settings",
  TENANTS_LIST: "nucleo_tenants_list",
  PRODUCTS: "nucleo_products",
  CUSTOMERS: "nucleo_customers",
  SALES: "nucleo_sales",
  USERS: "nucleo_users",
  CURRENT_USER: "nucleo_current_user",
  OFFLINE_QUEUE: "nucleo_offline_queue",
  CASH_SESSION: "nucleo_cash_session",
  CASH_SESSION_HISTORY: "nucleo_cash_session_history",
  VET_PATIENTS: "nucleo_vet_patients",
  CLINICAL_PATIENTS: "nucleo_clinical_patients",
};

export const getStoredVetPatients = (): PetPatient[] => {
  if (typeof window === "undefined") return INITIAL_VET_PATIENTS;
  const raw = localStorage.getItem(STORAGE_KEYS.VET_PATIENTS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.VET_PATIENTS, JSON.stringify(INITIAL_VET_PATIENTS));
    return INITIAL_VET_PATIENTS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_VET_PATIENTS;
  }
};

export const saveStoredVetPatients = (patients: PetPatient[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.VET_PATIENTS, JSON.stringify(patients));
};

export const getStoredClinicalPatients = (): ClinicalPatient[] => {
  if (typeof window === "undefined") return INITIAL_CLINICAL_PATIENTS;
  const raw = localStorage.getItem(STORAGE_KEYS.CLINICAL_PATIENTS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.CLINICAL_PATIENTS, JSON.stringify(INITIAL_CLINICAL_PATIENTS));
    return INITIAL_CLINICAL_PATIENTS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_CLINICAL_PATIENTS;
  }
};

export const saveStoredClinicalPatients = (patients: ClinicalPatient[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.CLINICAL_PATIENTS, JSON.stringify(patients));
};

export const getStoredTenantsList = (): TenantSettings[] => {
  if (typeof window === "undefined") return INITIAL_TENANTS;
  const raw = localStorage.getItem(STORAGE_KEYS.TENANTS_LIST);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.TENANTS_LIST, JSON.stringify(INITIAL_TENANTS));
    return INITIAL_TENANTS;
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_TENANTS;
  } catch {
    return INITIAL_TENANTS;
  }
};

export const saveStoredTenantsList = (tenants: TenantSettings[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.TENANTS_LIST, JSON.stringify(tenants));
};

export const getStoredTenant = (): TenantSettings | null => {
  if (typeof window === "undefined") return INITIAL_TENANTS[0];
  const raw = localStorage.getItem(STORAGE_KEYS.TENANT);
  if (!raw) {
    const list = getStoredTenantsList();
    const defaultTenant = list[0] || INITIAL_TENANTS[0];
    localStorage.setItem(STORAGE_KEYS.TENANT, JSON.stringify(defaultTenant));
    return defaultTenant;
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.activeModules)) {
      let changed = false;
      if (!parsed.activeModules.includes("veterinary")) {
        parsed.activeModules.push("veterinary");
        changed = true;
      }
      if (!parsed.activeModules.includes("clinical")) {
        parsed.activeModules.push("clinical");
        changed = true;
      }
      if (changed) {
        localStorage.setItem(STORAGE_KEYS.TENANT, JSON.stringify(parsed));
      }
    }
    return parsed;
  } catch {
    return INITIAL_TENANTS[0];
  }
};

export const saveStoredTenant = (tenant: TenantSettings) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.TENANT, JSON.stringify(tenant));

  // Actualizar también en la lista de tenants
  const list = getStoredTenantsList();
  const index = list.findIndex((t) => t.id === tenant.id);
  if (index >= 0) {
    list[index] = tenant;
  } else {
    list.push(tenant);
  }
  saveStoredTenantsList(list);
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
      // Auto-fusionar nuevos insumos y fármacos si no existen aún en localStorage
      const existingIds = new Set(prods.map((p) => p.id));
      const missing = INITIAL_PRODUCTS.filter((p) => !existingIds.has(p.id));
      if (missing.length > 0) {
        prods = [...prods, ...missing];
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(prods));
      }
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
  let userList: AppUser[] = [];
  if (raw) {
    try {
      userList = JSON.parse(raw);
    } catch {
      userList = [];
    }
  }

  // Garantizar siempre la existencia del SuperAdmin con usuario 'admin' y contraseña 'admin123'
  let superadmin = userList.find((u) => u.username === "admin" && u.role === "superadmin");
  if (!superadmin) {
    // Si existía un 'admin' con rol owner, renombrar su username a 'propietario'
    const existingAdminOwner = userList.find((u) => u.username === "admin" && u.role === "owner");
    if (existingAdminOwner) {
      existingAdminOwner.username = "propietario";
      existingAdminOwner.password = existingAdminOwner.pinCode || "1234";
    }

    superadmin = {
      id: "usr-superadmin",
      fullName: "SuperAdministrador Núcleo",
      username: "admin",
      password: "admin123",
      pinCode: "admin123",
      email: "admin@nucleo.ni",
      role: "superadmin",
      roleLabel: "SuperAdmin // God Mode",
      allowedModules: ["pos", "inventory", "billing", "customers", "expenses", "veterinary", "clinical"],
      active: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    userList.unshift(superadmin);
  }

  // Garantizar usuario dueño/propietario del negocio
  let owner = userList.find((u) => u.role === "owner");
  if (!owner) {
    const ownerName = tenant?.owner?.fullName || "Don Carlos Mendoza";
    owner = {
      id: "usr-owner",
      fullName: ownerName,
      username: tenant?.loginUsername || "propietario",
      password: tenant?.loginPassword || "1234",
      pinCode: tenant?.loginPassword || "1234",
      email: tenant?.owner?.email || "propietario@tornillodorado.com",
      role: "owner",
      roleLabel: "Propietario / Dueño",
      allowedModules: tenant?.activeModules || ["pos", "inventory", "billing", "customers", "expenses", "veterinary", "clinical"],
      active: true,
      createdAt: new Date().toISOString(),
      tenantId: tenant?.id,
    };
    userList.push(owner);
  }

  // Garantizar cajero y bodeguero
  if (!userList.some((u) => u.username === "caja1")) {
    userList.push({
      id: "usr-cashier",
      fullName: "Juan Carlos Cajero",
      username: "caja1",
      password: "0000",
      phone: "+505 8812-4401",
      pinCode: "0000",
      role: "cashier",
      roleLabel: "Cajero de Mostrador",
      allowedModules: ["pos"],
      active: true,
      createdAt: new Date().toISOString(),
      tenantId: tenant?.id,
    });
  }

  if (!userList.some((u) => u.username === "bodega1")) {
    userList.push({
      id: "usr-inventory",
      fullName: "Pedro Morales Bodega",
      username: "bodega1",
      password: "1111",
      phone: "+505 8731-9922",
      pinCode: "1111",
      role: "inventory_clerk",
      roleLabel: "Encargado de Inventario",
      allowedModules: ["inventory"],
      active: true,
      createdAt: new Date().toISOString(),
      tenantId: tenant?.id,
    });
  }

  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(userList));
  return userList;
};

export const saveStoredUsers = (users: AppUser[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const getCurrentUser = (users?: AppUser[]): AppUser | null => {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }

  return null;
};

export const saveCurrentUser = (user: AppUser | null) => {
  if (typeof window === "undefined") return;
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  } else {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }
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

  // 3. Registrar venta en la sesión de caja activa
  try {
    const session = getCurrentCashSession();
    if (session.status === "open") {
      const isCash = sale.paymentMethod === "cash";
      const isCard = sale.paymentMethod === "card";
      const isTransfer = sale.paymentMethod === "transfer";

      const updatedSession: CashRegisterSession = {
        ...session,
        cashSalesTotal: session.cashSalesTotal + (isCash ? sale.total : 0),
        cardSalesTotal: session.cardSalesTotal + (isCard ? sale.total : 0),
        transferSalesTotal: session.transferSalesTotal + (isTransfer ? sale.total : 0),
        totalSales: session.totalSales + sale.total,
        totalProfit: session.totalProfit + sale.profit,
        salesCount: session.salesCount + 1,
        expectedCashInDrawer: session.openingAmount + session.cashSalesTotal + (isCash ? sale.total : 0),
      };
      saveCurrentCashSession(updatedSession);
    }
  } catch (err) {
    console.error("Error updating cash session with sale:", err);
  }

  return { updatedProducts, updatedCustomers };
};

// ==========================================
// GESTIÓN DE SESIÓN DE CAJA (ARQUEO Y TURNOS)
// ==========================================

export const getCurrentCashSession = (): CashRegisterSession => {
  if (typeof window === "undefined") {
    return {
      id: "session-default",
      status: "closed",
      openedBy: "Cajero",
      openedAt: new Date().toISOString(),
      openingAmount: 0,
      cashSalesTotal: 0,
      cardSalesTotal: 0,
      transferSalesTotal: 0,
      totalSales: 0,
      totalProfit: 0,
      salesCount: 0,
      expectedCashInDrawer: 0,
    };
  }

  const raw = localStorage.getItem(STORAGE_KEYS.CASH_SESSION);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }

  // Sesión inicial abierta por defecto con C$ 1,000 para no bloquear al usuario si no la ha cerrado
  const defaultSession: CashRegisterSession = {
    id: "session-" + Date.now(),
    status: "open",
    openedBy: "Juan Carlos Cajero",
    openedAt: new Date().toISOString(),
    openingAmount: 1000.0,
    cashSalesTotal: 0,
    cardSalesTotal: 0,
    transferSalesTotal: 0,
    totalSales: 0,
    totalProfit: 0,
    salesCount: 0,
    expectedCashInDrawer: 1000.0,
  };
  localStorage.setItem(STORAGE_KEYS.CASH_SESSION, JSON.stringify(defaultSession));
  return defaultSession;
};

export const saveCurrentCashSession = (session: CashRegisterSession) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.CASH_SESSION, JSON.stringify(session));
};

export const openCashSession = (openingAmount: number, cashierName: string): CashRegisterSession => {
  const newSession: CashRegisterSession = {
    id: "session-" + Date.now(),
    status: "open",
    openedBy: cashierName || "Cajero",
    openedAt: new Date().toISOString(),
    openingAmount: Math.max(0, openingAmount),
    cashSalesTotal: 0,
    cardSalesTotal: 0,
    transferSalesTotal: 0,
    totalSales: 0,
    totalProfit: 0,
    salesCount: 0,
    expectedCashInDrawer: Math.max(0, openingAmount),
  };
  saveCurrentCashSession(newSession);
  return newSession;
};

export const closeCashSession = (
  actualCashInDrawer: number,
  closedBy: string,
  notes?: string
): CashRegisterSession => {
  const current = getCurrentCashSession();
  const diff = actualCashInDrawer - current.expectedCashInDrawer;

  const closedSession: CashRegisterSession = {
    ...current,
    status: "closed",
    closedBy,
    closedAt: new Date().toISOString(),
    actualCashInDrawer,
    difference: diff,
    notes: notes || "",
  };

  saveCurrentCashSession(closedSession);

  // Guardar en histórico de cierres
  if (typeof window !== "undefined") {
    try {
      const historyRaw = localStorage.getItem(STORAGE_KEYS.CASH_SESSION_HISTORY);
      const history: CashRegisterSession[] = historyRaw ? JSON.parse(historyRaw) : [];
      history.unshift(closedSession);
      localStorage.setItem(STORAGE_KEYS.CASH_SESSION_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error("Error saving cash session history", e);
    }
  }

  return closedSession;
};
