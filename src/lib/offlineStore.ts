import { 
  Product, 
  Customer, 
  Sale, 
  TenantSettings, 
  AppUser, 
  Batch, 
  CashRegisterSession,
  PetPatient,
  ClinicalPatient,
  HREmployee,
  SupportTicket,
  ProductionRecipe,
  ProductionOrder,
  RouteDriver,
  DeliveryRoute,
  RouteCustomerOrder
} from "@/types";
import { 
  INITIAL_PRODUCTS, 
  INITIAL_CUSTOMERS, 
  INITIAL_VET_PATIENTS, 
  INITIAL_CLINICAL_PATIENTS,
  INITIAL_HR_EMPLOYEES,
  INITIAL_RECIPES,
  INITIAL_PRODUCTION_ORDERS,
  INITIAL_ROUTE_DRIVERS,
  INITIAL_DELIVERY_ROUTES,
  INITIAL_ROUTE_ORDERS
} from "./constants";
import {
  syncTenantsToSupabase,
  syncUsersToSupabase,
  syncProductsToSupabase,
  syncCustomersToSupabase,
  syncSalesToSupabase,
  syncCashSessionToSupabase,
  syncVetPatientsToSupabase,
  syncClinicalPatientsToSupabase,
  syncHREmployeesToSupabase,
  syncRecipesToSupabase,
  syncProductionOrdersToSupabase,
  syncRouteDriversToSupabase,
  syncDeliveryRoutesToSupabase,
  syncRouteOrdersToSupabase,
  syncSupportTicketsToSupabase,
  isSupabaseConfigured,
} from "./supabase";

// ============================================================================
// CONTROL DE ACCESO ESTRICTO POR ROL (EMPLEADOS VS PROPIETARIOS VS SUPERADMIN)
// ============================================================================

export function canUserAccessView(
  user: AppUser | null | undefined,
  tenant: TenantSettings | null | undefined,
  viewKey: string
): boolean {
  if (!user || !tenant) return false;

  // 1. SuperAdmin tiene acceso a God Mode (terminal) y a todos los módulos del negocio activo
  if (user.role === "superadmin") {
    return true;
  }

  // 2. La terminal SuperAdmin (God Mode) es EXCLUSIVA de nosotros (superadmin)
  if (viewKey === "terminal") {
    return false;
  }

  // 3. El Propietario / Dueño tiene acceso a las herramientas de dirección de su negocio
  if (user.role === "owner") {
    if (["spatial", "dashboard", "users", "settings", "wizard"].includes(viewKey)) {
      return true;
    }
    return tenant.activeModules.includes(viewKey as any);
  }

  // 4. EMPLEADOS (cashier, inventory_clerk, driver, supervisor, custom):
  // NUNCA tienen acceso a herramientas exclusivas del propietario:
  if (["spatial", "dashboard", "users", "settings", "wizard", "terminal"].includes(viewKey)) {
    return false;
  }

  // Para perfiles predefinidos estrictos:
  if (user.role === "cashier") {
    return viewKey === "pos";
  }
  if (user.role === "inventory_clerk") {
    return viewKey === "inventory";
  }
  if (user.role === "driver") {
    return viewKey === "routes";
  }

  // Para supervisor o rol personalizado, verificar que esté tanto en sus módulos asignados como en los del negocio
  return (
    Array.isArray(user.allowedModules) &&
    user.allowedModules.includes(viewKey as any) &&
    tenant.activeModules.includes(viewKey as any)
  );
}

export function getDefaultViewForUser(
  user: AppUser | null | undefined,
  tenant?: TenantSettings | null
): string {
  if (!user) return "pos";
  if (user.role === "superadmin") return "terminal";
  if (user.role === "owner") return "spatial";
  if (user.role === "cashier") return "pos";
  if (user.role === "inventory_clerk") return "inventory";
  if (user.role === "driver") return "routes";

  if (Array.isArray(user.allowedModules) && user.allowedModules.length > 0) {
    const firstAllowed = user.allowedModules.find((m) =>
      tenant ? tenant.activeModules.includes(m) : true
    );
    if (firstAllowed) return firstAllowed;
    return user.allowedModules[0];
  }
  return "pos";
}

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
    activeModules: ["pos", "inventory", "billing", "customers", "expenses", "veterinary", "clinical", "hr", "production", "routes"],
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
  HR_EMPLOYEES: "nucleo_hr_employees",
  SUPPORT_TICKETS: "nucleo_support_tickets",
  PRODUCTION_RECIPES: "nucleo_production_recipes",
  PRODUCTION_ORDERS: "nucleo_production_orders",
  ROUTE_DRIVERS: "nucleo_route_drivers",
  DELIVERY_ROUTES: "nucleo_delivery_routes",
  ROUTE_ORDERS: "nucleo_route_orders",
};

// Obtener el ID del tenant actualmente activo para aislar los datos por negocio (Multi-Tenant)
function getActiveTenantId(explicitTenantId?: string): string {
  if (explicitTenantId) return explicitTenantId;
  if (typeof window === "undefined") return INITIAL_TENANTS[0].id;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TENANT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.id) return parsed.id;
    }
  } catch {
    // fallback
  }
  return INITIAL_TENANTS[0].id;
}

function getTenantScopedKey(baseKey: string, tenantId?: string): string {
  const tid = getActiveTenantId(tenantId);
  // Para el primer tenant por defecto mantenemos retrocompatibilidad leyendo de baseKey si no existe aún la clave scoped
  return `${baseKey}__${tid}`;
}

function readTenantScopedStorage<T>(baseKey: string, defaultData: T, tenantId?: string): T {
  if (typeof window === "undefined") return defaultData;
  const tid = getActiveTenantId(tenantId);
  const scopedKey = getTenantScopedKey(baseKey, tid);
  const rawScoped = localStorage.getItem(scopedKey);
  if (rawScoped) {
    try {
      return JSON.parse(rawScoped);
    } catch {
      return defaultData;
    }
  }
  // Si es el tenant principal y tiene datos previos en la llave global, migrarlos automáticamente a su llave multi-tenant
  if (tid === "tenant-ferreteria-1") {
    const rawLegacy = localStorage.getItem(baseKey);
    if (rawLegacy) {
      try {
        const parsed = JSON.parse(rawLegacy);
        localStorage.setItem(scopedKey, rawLegacy);
        return parsed;
      } catch {
        // ignore
      }
    }
  }
  localStorage.setItem(scopedKey, JSON.stringify(defaultData));
  return defaultData;
}

function writeTenantScopedStorage<T>(baseKey: string, data: T, tenantId?: string): string {
  const tid = getActiveTenantId(tenantId);
  if (typeof window === "undefined") return tid;
  const scopedKey = getTenantScopedKey(baseKey, tid);
  const serialized = JSON.stringify(data);
  localStorage.setItem(scopedKey, serialized);
  if (tid === "tenant-ferreteria-1") {
    localStorage.setItem(baseKey, serialized);
  }
  return tid;
}

export const getStoredRouteDrivers = (tenantId?: string): RouteDriver[] => {
  return readTenantScopedStorage(STORAGE_KEYS.ROUTE_DRIVERS, INITIAL_ROUTE_DRIVERS, tenantId);
};

export const saveStoredRouteDrivers = (drivers: RouteDriver[], tenantId?: string) => {
  const tid = writeTenantScopedStorage(STORAGE_KEYS.ROUTE_DRIVERS, drivers, tenantId);
  syncRouteDriversToSupabase(tid, drivers);
};

export const getStoredDeliveryRoutes = (tenantId?: string): DeliveryRoute[] => {
  return readTenantScopedStorage(STORAGE_KEYS.DELIVERY_ROUTES, INITIAL_DELIVERY_ROUTES, tenantId);
};

export const saveStoredDeliveryRoutes = (routes: DeliveryRoute[], tenantId?: string) => {
  const tid = writeTenantScopedStorage(STORAGE_KEYS.DELIVERY_ROUTES, routes, tenantId);
  syncDeliveryRoutesToSupabase(tid, routes);
};

export const getStoredRouteOrders = (tenantId?: string): RouteCustomerOrder[] => {
  return readTenantScopedStorage(STORAGE_KEYS.ROUTE_ORDERS, INITIAL_ROUTE_ORDERS, tenantId);
};

export const saveStoredRouteOrders = (orders: RouteCustomerOrder[], tenantId?: string) => {
  const tid = writeTenantScopedStorage(STORAGE_KEYS.ROUTE_ORDERS, orders, tenantId);
  syncRouteOrdersToSupabase(tid, orders);
};

export const getStoredRecipes = (tenantId?: string): ProductionRecipe[] => {
  return readTenantScopedStorage(STORAGE_KEYS.PRODUCTION_RECIPES, INITIAL_RECIPES, tenantId);
};

export const saveStoredRecipes = (recipes: ProductionRecipe[], tenantId?: string) => {
  const tid = writeTenantScopedStorage(STORAGE_KEYS.PRODUCTION_RECIPES, recipes, tenantId);
  syncRecipesToSupabase(tid, recipes);
};

export const getStoredProductionOrders = (tenantId?: string): ProductionOrder[] => {
  return readTenantScopedStorage(STORAGE_KEYS.PRODUCTION_ORDERS, INITIAL_PRODUCTION_ORDERS, tenantId);
};

export const saveStoredProductionOrders = (orders: ProductionOrder[], tenantId?: string) => {
  const tid = writeTenantScopedStorage(STORAGE_KEYS.PRODUCTION_ORDERS, orders, tenantId);
  syncProductionOrdersToSupabase(tid, orders);
};

export const getStoredHREmployees = (tenantId?: string): HREmployee[] => {
  return readTenantScopedStorage(STORAGE_KEYS.HR_EMPLOYEES, INITIAL_HR_EMPLOYEES, tenantId);
};

export const saveStoredHREmployees = (employees: HREmployee[], tenantId?: string) => {
  const tid = writeTenantScopedStorage(STORAGE_KEYS.HR_EMPLOYEES, employees, tenantId);
  syncHREmployeesToSupabase(tid, employees);
};

export const INITIAL_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: "tkt-initial-1",
    ticketCode: "TKT-1001",
    tenantId: "tenant-ferreteria-1",
    tenantName: "Ferretería El Tornillo Dorado",
    createdByUserId: "usr-owner",
    createdByName: "Don Carlos Mendoza",
    type: "module_request",
    requestedModules: ["hr"],
    subject: "Solicitud de activación del módulo RRHH & Nómina",
    description: "Estimado administrador, deseamos habilitar el panel de Recursos Humanos y Nómina para gestionar la planilla quincenal de nuestros 8 colaboradores en ferretería.",
    priority: "media",
    status: "open",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    unreadByAdmin: true,
    unreadByClient: false,
    messages: [
      {
        id: "msg-init-1",
        senderRole: "client",
        senderName: "Don Carlos Mendoza",
        text: "Estimado administrador, deseamos habilitar el panel de Recursos Humanos y Nómina para gestionar la planilla quincenal de nuestros 8 colaboradores en ferretería.",
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
    ],
  },
];

export const getStoredSupportTickets = (): SupportTicket[] => {
  if (typeof window === "undefined") return INITIAL_SUPPORT_TICKETS;
  const raw = localStorage.getItem(STORAGE_KEYS.SUPPORT_TICKETS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(INITIAL_SUPPORT_TICKETS));
    return INITIAL_SUPPORT_TICKETS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_SUPPORT_TICKETS;
  }
};

export const saveStoredSupportTickets = (tickets: SupportTicket[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(tickets));
  syncSupportTicketsToSupabase(tickets);
};

export const getStoredVetPatients = (tenantId?: string): PetPatient[] => {
  return readTenantScopedStorage(STORAGE_KEYS.VET_PATIENTS, INITIAL_VET_PATIENTS, tenantId);
};

export const saveStoredVetPatients = (patients: PetPatient[], tenantId?: string) => {
  const tid = writeTenantScopedStorage(STORAGE_KEYS.VET_PATIENTS, patients, tenantId);
  syncVetPatientsToSupabase(tid, patients);
};

export const getStoredClinicalPatients = (tenantId?: string): ClinicalPatient[] => {
  return readTenantScopedStorage(STORAGE_KEYS.CLINICAL_PATIENTS, INITIAL_CLINICAL_PATIENTS, tenantId);
};

export const saveStoredClinicalPatients = (patients: ClinicalPatient[], tenantId?: string) => {
  const tid = writeTenantScopedStorage(STORAGE_KEYS.CLINICAL_PATIENTS, patients, tenantId);
  syncClinicalPatientsToSupabase(tid, patients);
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
      let updated = false;
      const synced = parsed.map((t: TenantSettings) => {
        if (t.id === "tenant-ferreteria-1" && Array.isArray(t.activeModules)) {
          let newMods = [...t.activeModules];
          if (!newMods.includes("hr")) {
            newMods.push("hr" as const);
            updated = true;
          }
          if (!newMods.includes("production")) {
            newMods.push("production" as const);
            updated = true;
          }
          if (!newMods.includes("routes")) {
            newMods.push("routes" as const);
            updated = true;
          }
          if (updated) {
            return { ...t, activeModules: newMods };
          }
        }
        return t;
      });
      if (updated) {
        localStorage.setItem(STORAGE_KEYS.TENANTS_LIST, JSON.stringify(synced));
      }
      return synced;
    }
    return INITIAL_TENANTS;
  } catch {
    return INITIAL_TENANTS;
  }
};

export const saveStoredTenantsList = (tenants: TenantSettings[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.TENANTS_LIST, JSON.stringify(tenants));
  syncTenantsToSupabase(tenants);
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
    if (parsed && parsed.id === "tenant-ferreteria-1" && Array.isArray(parsed.activeModules)) {
      let changed = false;
      for (const m of ["veterinary", "clinical", "hr", "production", "routes"] as const) {
        if (!parsed.activeModules.includes(m)) {
          parsed.activeModules.push(m);
          changed = true;
        }
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

  // Actualizar también en la lista de tenants y sincronizar con Supabase
  const list = getStoredTenantsList();
  const index = list.findIndex((t) => t.id === tenant.id);
  if (index >= 0) {
    list[index] = tenant;
  } else {
    list.push(tenant);
  }
  saveStoredTenantsList(list);
};

export const getStoredProducts = (tenantId?: string): Product[] => {
  if (typeof window === "undefined") return INITIAL_PRODUCTS;
  const tid = getActiveTenantId(tenantId);
  const prods = readTenantScopedStorage<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS, tid);

  // Normalizar y sincronizar lotes existentes si el producto tiene hasBatches
  let hasChanges = false;
  const normalized = prods.map((p) => {
    const updated = { ...p };
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
        const totalBatchStock = updated.batches.reduce((sum, b) => sum + (Number(b.stock) || 0), 0);
        if (updated.stock !== totalBatchStock) {
          updated.stock = totalBatchStock;
          hasChanges = true;
        }
      }
    }
    return updated;
  });

  if (hasChanges) {
    writeTenantScopedStorage(STORAGE_KEYS.PRODUCTS, normalized, tid);
  }

  return normalized;
};

export const saveStoredProducts = (products: Product[], tenantId?: string) => {
  const tid = writeTenantScopedStorage(STORAGE_KEYS.PRODUCTS, products, tenantId);
  syncProductsToSupabase(tid, products);
};

export const getStoredCustomers = (tenantId?: string): Customer[] => {
  return readTenantScopedStorage(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS, tenantId);
};

export const saveStoredCustomers = (customers: Customer[], tenantId?: string) => {
  const tid = writeTenantScopedStorage(STORAGE_KEYS.CUSTOMERS, customers, tenantId);
  syncCustomersToSupabase(tid, customers);
};

export const getStoredSales = (tenantId?: string): Sale[] => {
  return readTenantScopedStorage<Sale[]>(STORAGE_KEYS.SALES, [], tenantId);
};

export const saveStoredSales = (sales: Sale[], tenantId?: string) => {
  const tid = writeTenantScopedStorage(STORAGE_KEYS.SALES, sales, tenantId);
  syncSalesToSupabase(tid, sales);
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

  let modified = false;

  // Garantizar siempre la existencia del SuperAdmin con usuario 'admin' y contraseña 'admin123'
  let superadmin = userList.find((u) => u.username === "admin" && u.role === "superadmin");
  if (!superadmin) {
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
      allowedModules: ["pos", "inventory", "billing", "customers", "expenses", "veterinary", "clinical", "hr", "production", "routes"],
      active: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    userList.unshift(superadmin);
    modified = true;
  }

  const targetTid = tenant?.id || "tenant-ferreteria-1";

  // Garantizar usuario dueño/propietario del negocio activo
  const ownerForTenant = userList.find(
    (u) => u.role === "owner" && (!u.tenantId || u.tenantId === targetTid)
  );
  if (!ownerForTenant) {
    const ownerName = tenant?.owner?.fullName || "Don Carlos Mendoza";
    const ownerUsername = tenant?.loginUsername || (targetTid === "tenant-ferreteria-1" ? "propietario" : `owner_${targetTid}`);
    userList.push({
      id: targetTid === "tenant-ferreteria-1" ? "usr-owner" : `usr-owner-${targetTid}`,
      fullName: ownerName,
      username: ownerUsername,
      password: tenant?.loginPassword || "1234",
      pinCode: tenant?.loginPassword || "1234",
      email: tenant?.owner?.email || `${ownerUsername}@nucleo.ni`,
      role: "owner",
      roleLabel: "Propietario / Dueño",
      allowedModules: tenant?.activeModules || ["pos", "inventory", "billing", "customers", "expenses", "veterinary", "clinical"],
      active: true,
      createdAt: new Date().toISOString(),
      tenantId: targetTid,
    });
    modified = true;
  }

  // Garantizar cajero (SOLO acceso a POS) y bodeguero (SOLO acceso a Inventario)
  const existingCashier = userList.find((u) => u.username === "caja1");
  if (!existingCashier) {
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
      tenantId: "tenant-ferreteria-1",
    });
    modified = true;
  } else if (existingCashier.allowedModules.length !== 1 || existingCashier.allowedModules[0] !== "pos") {
    existingCashier.allowedModules = ["pos"];
    modified = true;
  }

  const existingClerk = userList.find((u) => u.username === "bodega1");
  if (!existingClerk) {
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
      tenantId: "tenant-ferreteria-1",
    });
    modified = true;
  } else if (existingClerk.allowedModules.length !== 1 || existingClerk.allowedModules[0] !== "inventory") {
    existingClerk.allowedModules = ["inventory"];
    modified = true;
  }

  if (modified || !raw) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(userList));
  }
  return userList;
};

export const saveStoredUsers = (users: AppUser[], tenantId?: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  syncUsersToSupabase(users, getActiveTenantId(tenantId));
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

export const updateProductBatches = (productId: string, batches: Batch[], tenantId?: string): Product[] => {
  const products = getStoredProducts(tenantId);
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
  saveStoredProducts(updated, tenantId);
  return updated;
};

export const recordSaleLocally = (
  sale: Sale,
  tenantId?: string
): { updatedProducts: Product[]; updatedCustomers: Customer[]; updatedSales: Sale[] } => {
  const tid = getActiveTenantId(tenantId || sale.tenantId);
  const enrichedSale: Sale = {
    ...sale,
    tenantId: tid,
    status: sale.status || "completed",
    reprintCount: sale.reprintCount || 0,
    isOfflineSynced: isSupabaseConfigured(),
  };

  const sales = getStoredSales(tid);
  const updatedSales = [enrichedSale, ...sales];
  saveStoredSales(updatedSales, tid);

  // 1. Descontar inventario automáticamente con soporte de Lotes & FEFO
  const products = getStoredProducts(tid);
  const updatedProducts = products.map((prod) => {
    const itemsInSale = enrichedSale.items.filter((it) => it.product.id === prod.id);
    if (itemsInSale.length === 0) return prod;

    const totalDeduct = itemsInSale.reduce((acc, it) => acc + it.quantity, 0);

    if (prod.hasBatches && prod.batches && prod.batches.length > 0) {
      let updatedBatches = prod.batches.map((b) => ({ ...b }));

      itemsInSale.forEach((saleItem) => {
        let remaining = saleItem.quantity;

        if (saleItem.selectedBatch) {
          updatedBatches = updatedBatches.map((b) => {
            if (b.id === saleItem.selectedBatch?.id || b.batchNumber === saleItem.selectedBatch?.batchNumber) {
              const take = Math.min(b.stock, remaining);
              remaining -= take;
              return { ...b, stock: Math.max(0, b.stock - take) };
            }
            return b;
          });
        }

        if (remaining > 0) {
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

    const newStock = Math.max(0, prod.stock - totalDeduct);
    return { ...prod, stock: newStock };
  });
  saveStoredProducts(updatedProducts, tid);

  // 2. Actualizar historial de compra del cliente
  const customers = getStoredCustomers(tid);
  let updatedCustomers = customers;
  if (enrichedSale.customer && enrichedSale.customer.id !== "cust-4") {
    updatedCustomers = customers.map((c) => {
      if (c.id === enrichedSale.customer?.id) {
        return {
          ...c,
          totalPurchases: (c.totalPurchases || 0) + enrichedSale.total,
          lastPurchaseDate: new Date().toISOString().split("T")[0],
        };
      }
      return c;
    });
    saveStoredCustomers(updatedCustomers, tid);
  }

  // 3. Registrar venta en la sesión de caja activa y sincronizar sesión con Supabase
  try {
    const session = getCurrentCashSession(tid);
    if (session.status === "open") {
      const isCash = enrichedSale.paymentMethod === "cash";
      const isCard = enrichedSale.paymentMethod === "card";
      const isTransfer = enrichedSale.paymentMethod === "transfer";

      const updatedSession: CashRegisterSession = {
        ...session,
        cashSalesTotal: session.cashSalesTotal + (isCash ? enrichedSale.total : 0),
        cardSalesTotal: session.cardSalesTotal + (isCard ? enrichedSale.total : 0),
        transferSalesTotal: session.transferSalesTotal + (isTransfer ? enrichedSale.total : 0),
        totalSales: session.totalSales + enrichedSale.total,
        totalProfit: session.totalProfit + enrichedSale.profit,
        salesCount: session.salesCount + 1,
        expectedCashInDrawer: session.openingAmount + session.cashSalesTotal + (isCash ? enrichedSale.total : 0),
      };
      saveCurrentCashSession(updatedSession, tid);
    }
  } catch (err) {
    console.error("Error updating cash session with sale:", err);
  }

  return { updatedProducts, updatedCustomers, updatedSales };
};

// ==========================================
// GESTIÓN DE SESIÓN DE CAJA (ARQUEO Y TURNOS)
// ==========================================

export const getCurrentCashSession = (tenantId?: string): CashRegisterSession => {
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

  const tid = getActiveTenantId(tenantId);
  const scopedKey = getTenantScopedKey(STORAGE_KEYS.CASH_SESSION, tid);
  const raw = localStorage.getItem(scopedKey) || (tid === "tenant-ferreteria-1" ? localStorage.getItem(STORAGE_KEYS.CASH_SESSION) : null);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }

  const defaultSession: CashRegisterSession = {
    id: `session-${tid}-${Date.now()}`,
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
  writeTenantScopedStorage(STORAGE_KEYS.CASH_SESSION, defaultSession, tid);
  return defaultSession;
};

export const saveCurrentCashSession = (session: CashRegisterSession, tenantId?: string) => {
  const tid = writeTenantScopedStorage(STORAGE_KEYS.CASH_SESSION, session, tenantId);
  syncCashSessionToSupabase(tid, session);
};

export const openCashSession = (openingAmount: number, cashierName: string, tenantId?: string): CashRegisterSession => {
  const tid = getActiveTenantId(tenantId);
  const newSession: CashRegisterSession = {
    id: `session-${tid}-${Date.now()}`,
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
  saveCurrentCashSession(newSession, tid);
  return newSession;
};

export const closeCashSession = (
  actualCashInDrawer: number,
  closedBy: string,
  notes?: string,
  tenantId?: string
): CashRegisterSession => {
  const tid = getActiveTenantId(tenantId);
  const current = getCurrentCashSession(tid);
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

  saveCurrentCashSession(closedSession, tid);

  if (typeof window !== "undefined") {
    try {
      const history = readTenantScopedStorage<CashRegisterSession[]>(STORAGE_KEYS.CASH_SESSION_HISTORY, [], tid);
      history.unshift(closedSession);
      writeTenantScopedStorage(STORAGE_KEYS.CASH_SESSION_HISTORY, history, tid);
    } catch (e) {
      console.error("Error saving cash session history", e);
    }
  }

  return closedSession;
};

// ============================================================================
// SINCRONIZACIÓN COMPLETA DE TODOS LOS MÓDULOS Y NEGOCIOS HACIA SUPABASE
// ============================================================================

export async function pushAllLocalDataToSupabase(explicitTenantId?: string): Promise<{
  success: boolean;
  syncedTables: number;
  message: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      syncedTables: 0,
      message: "Núcleo Cloud está operando en modo local Offline-First.",
    };
  }

  const tenants = getStoredTenantsList();
  const activeTenant = getStoredTenant() || tenants[0];
  const tid = explicitTenantId || activeTenant?.id || "tenant-ferreteria-1";
  const users = getStoredUsers(activeTenant);
  const tickets = getStoredSupportTickets();

  const results: boolean[] = [];

  // 1. Tablas globales multi-tenant
  results.push(await syncTenantsToSupabase(tenants));
  results.push(await syncUsersToSupabase(users, tid));
  results.push(await syncSupportTicketsToSupabase(tickets));

  // 2. Tablas por cada tenant registrado
  for (const t of tenants) {
    const tId = t.id;
    const [
      pOk,
      cOk,
      sOk,
      csOk,
      vOk,
      clOk,
      hrOk,
      recOk,
      poOk,
      drvOk,
      rtOk,
      roOk,
    ] = await Promise.all([
      syncProductsToSupabase(tId, getStoredProducts(tId)),
      syncCustomersToSupabase(tId, getStoredCustomers(tId)),
      syncSalesToSupabase(tId, getStoredSales(tId)),
      syncCashSessionToSupabase(tId, getCurrentCashSession(tId)),
      syncVetPatientsToSupabase(tId, getStoredVetPatients(tId)),
      syncClinicalPatientsToSupabase(tId, getStoredClinicalPatients(tId)),
      syncHREmployeesToSupabase(tId, getStoredHREmployees(tId)),
      syncRecipesToSupabase(tId, getStoredRecipes(tId)),
      syncProductionOrdersToSupabase(tId, getStoredProductionOrders(tId)),
      syncRouteDriversToSupabase(tId, getStoredRouteDrivers(tId)),
      syncDeliveryRoutesToSupabase(tId, getStoredDeliveryRoutes(tId)),
      syncRouteOrdersToSupabase(tId, getStoredRouteOrders(tId)),
    ]);

    if (tId === tid) {
      results.push(pOk, cOk, sOk, csOk, vOk, clOk, hrOk, recOk, poOk, drvOk, rtOk, roOk);
    }
  }

  const okCount = results.filter(Boolean).length;
  return {
    success: okCount > 0,
    syncedTables: okCount,
    message:
      okCount > 0
        ? `Sincronización completada con éxito (${okCount} colecciones sincronizadas en Núcleo Cloud).`
        : "No se pudieron sincronizar las colecciones en Núcleo Cloud.",
  };
}
