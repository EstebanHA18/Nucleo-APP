import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  TenantSettings,
  AppUser,
  Product,
  Customer,
  Sale,
  CashRegisterSession,
  PetPatient,
  ClinicalPatient,
  HREmployee,
  ProductionRecipe,
  ProductionOrder,
  RouteDriver,
  DeliveryRoute,
  RouteCustomerOrder,
  SupportTicket,
} from "@/types";

const DEFAULT_NUCLEO_SUPABASE_URL = "https://dpqwetqzqtzhccehogjy.supabase.co";
const SUPABASE_URL_STORAGE_KEY = "nucleo_supabase_custom_url";
const SUPABASE_KEY_STORAGE_KEY = "nucleo_supabase_custom_anon_key";
const SUPABASE_LAST_SYNC_KEY = "nucleo_supabase_last_sync";

let cachedClient: SupabaseClient | null = null;
let cachedKeySignature = "";

export function getSupabaseCredentials(): { url: string; anonKey: string; isConfigured: boolean; source: "env" | "custom" | "none" } {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_NUCLEO_SUPABASE_URL;
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (
    envUrl &&
    envKey &&
    envUrl !== "https://your-project.supabase.co" &&
    envKey !== "your-anon-key"
  ) {
    return { url: envUrl.trim(), anonKey: envKey.trim(), isConfigured: true, source: "env" };
  }

  if (typeof window !== "undefined") {
    try {
      const customUrl = localStorage.getItem(SUPABASE_URL_STORAGE_KEY) || DEFAULT_NUCLEO_SUPABASE_URL;
      const customKey = localStorage.getItem(SUPABASE_KEY_STORAGE_KEY) || "";
      if (
        customUrl.startsWith("https://") &&
        customUrl.includes(".supabase.co") &&
        customKey.length > 20
      ) {
        return { url: customUrl.trim(), anonKey: customKey.trim(), isConfigured: true, source: "custom" };
      }
    } catch {
      // ignore storage errors
    }
  }

  return {
    url: DEFAULT_NUCLEO_SUPABASE_URL,
    anonKey: "your-anon-key",
    isConfigured: false,
    source: "none",
  };
}

export function saveCustomSupabaseCredentials(url: string, anonKey: string) {
  if (typeof window === "undefined") return;
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();
  if (!cleanUrl || !cleanKey) {
    localStorage.removeItem(SUPABASE_URL_STORAGE_KEY);
    localStorage.removeItem(SUPABASE_KEY_STORAGE_KEY);
  } else {
    localStorage.setItem(SUPABASE_URL_STORAGE_KEY, cleanUrl);
    localStorage.setItem(SUPABASE_KEY_STORAGE_KEY, cleanKey);
  }
  cachedClient = null;
  cachedKeySignature = "";
}

export function getSupabaseClient(): SupabaseClient {
  const creds = getSupabaseCredentials();
  const signature = `${creds.url}::${creds.anonKey}`;
  if (!cachedClient || cachedKeySignature !== signature) {
    cachedClient = createClient(creds.url, creds.anonKey, {
      auth: { persistSession: false },
    });
    cachedKeySignature = signature;
  }
  return cachedClient;
}

export const supabase = getSupabaseClient();

export const isSupabaseConfigured = (): boolean => {
  return getSupabaseCredentials().isConfigured;
};

export function getLastSupabaseSyncTime(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SUPABASE_LAST_SYNC_KEY);
}

function markSupabaseSynced() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SUPABASE_LAST_SYNC_KEY, new Date().toISOString());
  } catch {
    // ignore
  }
}

// ============================================================================
// FUNCIONES DE PERSISTENCIA MULTI-TENANT EN SUPABASE (UPSERT NO BLOQUEANTE)
// ============================================================================

export async function syncTenantsToSupabase(tenants: TenantSettings[]): Promise<boolean> {
  if (!isSupabaseConfigured() || tenants.length === 0) return false;
  try {
    const client = getSupabaseClient();
    const rows = tenants.map((t) => ({
      id: t.id,
      name: t.name,
      legal_name: t.legalName || t.name,
      tax_id: t.taxId || "",
      phone: t.phone || "",
      email: t.email || t.owner?.email || "",
      address: t.address || "",
      city: t.city || "Chinandega",
      owner: t.owner || {},
      business_vertical: t.businessVertical || "ferreteria",
      currency: t.currency || "NIO",
      secondary_currency: t.secondaryCurrency || "USD",
      exchange_rate: Number(t.exchangeRate) || 36.62,
      tax_percentage: Number(t.taxPercentage) || 15.0,
      active_modules: t.activeModules || ["pos", "inventory"],
      ticket_format: t.ticketFormat || "80mm",
      ticket_header: t.ticketHeader || t.name,
      ticket_footer: t.ticketFooter || "",
      invoice_slogan: t.invoiceSlogan || "",
      show_tax_breakdown: t.showTaxBreakdown !== false,
      show_usd_equivalence: t.showUsdEquivalence !== false,
      show_barcode_on_ticket: t.showBarcodeOnTicket !== false,
      logo_url: t.logoUrl || null,
      show_logo_on_ticket: t.showLogoOnTicket !== false,
      logo_size: t.logoSize || "md",
      bluetooth_printer_name: t.bluetoothPrinterName || null,
      auto_print_bluetooth: Boolean(t.autoPrintBluetooth),
      is_setup_completed: t.isSetupCompleted !== false,
      monthly_plan_price: Number(t.monthlyPlanPrice) || 35.0,
      plan_name: t.planName || "Pro",
      billing_cycle: t.billingCycle || "monthly",
      next_payment_date: t.nextPaymentDate || null,
      payment_status: t.paymentStatus || "active",
      admin_assigned_by: t.adminAssignedBy || null,
      plan_assigned_date: t.planAssignedDate || null,
      billing_cut_day: t.billingCutDay || 10,
      billing_due_day: t.billingDueDay || 5,
      login_username: t.loginUsername || null,
      login_password: t.loginPassword || null,
      raw_data: t,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await client.from("nucleo_tenants").upsert(rows, { onConflict: "id" });
    if (error) {
      console.warn("[Supabase] Error syncing tenants:", error.message);
      return false;
    }
    markSupabaseSynced();
    return true;
  } catch (e) {
    console.warn("[Supabase] Exception syncing tenants:", e);
    return false;
  }
}

export async function syncUsersToSupabase(users: AppUser[], defaultTenantId?: string): Promise<boolean> {
  if (!isSupabaseConfigured() || users.length === 0) return false;
  try {
    const client = getSupabaseClient();
    const rows = users.map((u) => ({
      id: u.id,
      tenant_id: u.tenantId || defaultTenantId || null,
      full_name: u.fullName,
      username: u.username,
      phone: u.phone || null,
      email: u.email || null,
      pin_code: u.pinCode || "0000",
      password: u.password || u.pinCode || "0000",
      role: u.role,
      role_label: u.roleLabel,
      allowed_modules: u.allowedModules || ["pos"],
      active: u.active !== false,
      raw_data: u,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await client.from("nucleo_users").upsert(rows, { onConflict: "id" });
    if (error) {
      console.warn("[Supabase] Error syncing users:", error.message);
      return false;
    }
    markSupabaseSynced();
    return true;
  } catch (e) {
    console.warn("[Supabase] Exception syncing users:", e);
    return false;
  }
}

export async function syncProductsToSupabase(tenantId: string, products: Product[]): Promise<boolean> {
  if (!isSupabaseConfigured() || !tenantId || products.length === 0) return false;
  try {
    const client = getSupabaseClient();
    const rows = products.map((p) => ({
      id: p.id,
      tenant_id: tenantId,
      sku: p.sku,
      barcode: p.barcode || null,
      name: p.name,
      category: p.category || "General",
      unit: p.unit || "Unidad",
      cost_price: Number(p.costPrice) || 0,
      sale_price: Number(p.salePrice) || 0,
      stock: Number(p.stock) || 0,
      min_stock: Number(p.minStock) || 0,
      has_batches: Boolean(p.hasBatches),
      batches: p.batches || [],
      batch_number: p.batchNumber || null,
      expiration_date: p.expirationDate || null,
      raw_data: p,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await client.from("nucleo_products").upsert(rows, { onConflict: "tenant_id,id" });
    if (error) {
      console.warn("[Supabase] Error syncing products:", error.message);
      return false;
    }
    markSupabaseSynced();
    return true;
  } catch (e) {
    console.warn("[Supabase] Exception syncing products:", e);
    return false;
  }
}

export async function syncCustomersToSupabase(tenantId: string, customers: Customer[]): Promise<boolean> {
  if (!isSupabaseConfigured() || !tenantId || customers.length === 0) return false;
  try {
    const client = getSupabaseClient();
    const rows = customers.map((c) => ({
      id: c.id,
      tenant_id: tenantId,
      name: c.name,
      business_name: c.businessName || null,
      phone: c.phone || "",
      email: c.email || null,
      tax_id: c.taxId || null,
      address: c.address || null,
      city: c.city || "Chinandega",
      total_purchases: Number(c.totalPurchases) || 0,
      last_purchase_date: c.lastPurchaseDate || null,
      raw_data: c,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await client.from("nucleo_customers").upsert(rows, { onConflict: "tenant_id,id" });
    if (error) {
      console.warn("[Supabase] Error syncing customers:", error.message);
      return false;
    }
    markSupabaseSynced();
    return true;
  } catch (e) {
    console.warn("[Supabase] Exception syncing customers:", e);
    return false;
  }
}

export async function syncSalesToSupabase(tenantId: string, sales: Sale[]): Promise<boolean> {
  if (!isSupabaseConfigured() || !tenantId || sales.length === 0) return false;
  try {
    const client = getSupabaseClient();
    const rows = sales.map((s) => ({
      id: s.id,
      tenant_id: tenantId,
      invoice_number: s.invoiceNumber,
      customer_id: s.customer?.id || null,
      customer_name: s.customerName || s.customer?.name || "Cliente de Contado",
      customer_tax_id: s.customerTaxId || s.customer?.taxId || null,
      payment_method: s.paymentMethod || "cash",
      payment_reference: s.paymentReference || null,
      amount_paid: Number(s.amountPaid) || 0,
      change_given: Number(s.changeGiven) || 0,
      items: s.items || [],
      subtotal: Number(s.subtotal) || 0,
      tax: Number(s.tax) || 0,
      total: Number(s.total) || 0,
      cost_total: Number(s.costTotal) || 0,
      profit: Number(s.profit) || 0,
      currency: s.currency || "NIO",
      exchange_rate: Number(s.exchangeRate) || 36.62,
      cashier_name: s.cashierName || null,
      seller_name: s.sellerName || null,
      cash_session_id: s.cashSessionId || null,
      status: s.status || "completed",
      reprint_count: Number(s.reprintCount) || 0,
      raw_data: { ...s, tenantId, isOfflineSynced: true },
      created_at: s.createdAt || new Date().toISOString(),
    }));
    const { error } = await client.from("nucleo_sales").upsert(rows, { onConflict: "tenant_id,id" });
    if (error) {
      console.warn("[Supabase] Error syncing sales:", error.message);
      return false;
    }
    markSupabaseSynced();
    return true;
  } catch (e) {
    console.warn("[Supabase] Exception syncing sales:", e);
    return false;
  }
}

export async function syncCashSessionToSupabase(tenantId: string, session: CashRegisterSession): Promise<boolean> {
  if (!isSupabaseConfigured() || !tenantId || !session) return false;
  try {
    const client = getSupabaseClient();
    const row = {
      id: session.id,
      tenant_id: tenantId,
      status: session.status,
      opened_by: session.openedBy,
      opened_at: session.openedAt || new Date().toISOString(),
      opening_amount: Number(session.openingAmount) || 0,
      closed_by: session.closedBy || null,
      closed_at: session.closedAt || null,
      cash_sales_total: Number(session.cashSalesTotal) || 0,
      card_sales_total: Number(session.cardSalesTotal) || 0,
      transfer_sales_total: Number(session.transferSalesTotal) || 0,
      total_sales: Number(session.totalSales) || 0,
      total_profit: Number(session.totalProfit) || 0,
      sales_count: Number(session.salesCount) || 0,
      expected_cash_in_drawer: Number(session.expectedCashInDrawer) || 0,
      actual_cash_in_drawer: session.actualCashInDrawer !== undefined ? Number(session.actualCashInDrawer) : null,
      difference: session.difference !== undefined ? Number(session.difference) : null,
      notes: session.notes || null,
      raw_data: session,
      updated_at: new Date().toISOString(),
    };
    const { error } = await client.from("nucleo_cash_sessions").upsert([row], { onConflict: "tenant_id,id" });
    if (error) {
      console.warn("[Supabase] Error syncing cash session:", error.message);
      return false;
    }
    markSupabaseSynced();
    return true;
  } catch (e) {
    console.warn("[Supabase] Exception syncing cash session:", e);
    return false;
  }
}

export async function syncVetPatientsToSupabase(tenantId: string, patients: PetPatient[]): Promise<boolean> {
  if (!isSupabaseConfigured() || !tenantId || patients.length === 0) return false;
  try {
    const client = getSupabaseClient();
    const rows = patients.map((p) => ({
      id: p.id,
      tenant_id: tenantId,
      name: p.name,
      species: p.species,
      breed: p.breed || "",
      owner_name: p.ownerName,
      owner_phone: p.ownerPhone || "",
      status: p.status || "active",
      consultations: p.consultations || [],
      vaccines: p.vaccines || [],
      dewormings: p.dewormings || [],
      raw_data: p,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await client.from("nucleo_vet_patients").upsert(rows, { onConflict: "tenant_id,id" });
    if (error) {
      console.warn("[Supabase] Error syncing vet patients:", error.message);
      return false;
    }
    markSupabaseSynced();
    return true;
  } catch (e) {
    console.warn("[Supabase] Exception syncing vet patients:", e);
    return false;
  }
}

export async function syncClinicalPatientsToSupabase(tenantId: string, patients: ClinicalPatient[]): Promise<boolean> {
  if (!isSupabaseConfigured() || !tenantId || patients.length === 0) return false;
  try {
    const client = getSupabaseClient();
    const rows = patients.map((p) => ({
      id: p.id,
      tenant_id: tenantId,
      full_name: p.fullName,
      dni: p.dni || "",
      phone: p.phone || "",
      status: p.status || "active",
      odontogram: p.odontogram || [],
      consultations: p.consultations || [],
      raw_data: p,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await client.from("nucleo_clinical_patients").upsert(rows, { onConflict: "tenant_id,id" });
    if (error) {
      console.warn("[Supabase] Error syncing clinical patients:", error.message);
      return false;
    }
    markSupabaseSynced();
    return true;
  } catch (e) {
    console.warn("[Supabase] Exception syncing clinical patients:", e);
    return false;
  }
}

export async function syncHREmployeesToSupabase(tenantId: string, employees: HREmployee[]): Promise<boolean> {
  if (!isSupabaseConfigured() || !tenantId || employees.length === 0) return false;
  try {
    const client = getSupabaseClient();
    const rows = employees.map((e) => ({
      id: e.id,
      tenant_id: tenantId,
      code: e.code,
      full_name: e.fullName,
      dni: e.dni || "",
      inss_number: e.inssNumber || null,
      position: e.position || "",
      department: e.department || "operaciones",
      base_monthly_salary: Number(e.baseMonthlySalary) || 0,
      status: e.status || "activo",
      attendance: e.attendance || [],
      movements: e.movements || [],
      payroll_history: e.payrollHistory || [],
      raw_data: e,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await client.from("nucleo_hr_employees").upsert(rows, { onConflict: "tenant_id,id" });
    if (error) {
      console.warn("[Supabase] Error syncing HR employees:", error.message);
      return false;
    }
    markSupabaseSynced();
    return true;
  } catch (e) {
    console.warn("[Supabase] Exception syncing HR employees:", e);
    return false;
  }
}

export async function syncRecipesToSupabase(tenantId: string, recipes: ProductionRecipe[]): Promise<boolean> {
  if (!isSupabaseConfigured() || !tenantId || recipes.length === 0) return false;
  try {
    const client = getSupabaseClient();
    const rows = recipes.map((r) => ({
      id: r.id,
      tenant_id: tenantId,
      code: r.code,
      name: r.name,
      category: r.category,
      output_product_name: r.outputProductName,
      total_recipe_cost: Number(r.totalRecipeCost) || 0,
      suggested_sale_price: Number(r.suggestedSalePrice) || 0,
      ingredients: r.ingredients || [],
      active: r.active !== false,
      raw_data: r,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await client.from("nucleo_production_recipes").upsert(rows, { onConflict: "tenant_id,id" });
    if (error) {
      console.warn("[Supabase] Error syncing recipes:", error.message);
      return false;
    }
    markSupabaseSynced();
    return true;
  } catch (e) {
    console.warn("[Supabase] Exception syncing recipes:", e);
    return false;
  }
}

export async function syncProductionOrdersToSupabase(tenantId: string, orders: ProductionOrder[]): Promise<boolean> {
  if (!isSupabaseConfigured() || !tenantId || orders.length === 0) return false;
  try {
    const client = getSupabaseClient();
    const rows = orders.map((o) => ({
      id: o.id,
      tenant_id: tenantId,
      order_number: o.orderNumber,
      recipe_id: o.recipeId,
      recipe_name: o.recipeName,
      batches_to_produce: Number(o.batchesToProduce) || 1,
      total_output_quantity: Number(o.totalOutputQuantity) || 1,
      total_estimated_cost: Number(o.totalEstimatedCost) || 0,
      status: o.status || "planificada",
      raw_data: o,
      started_at: o.startedAt || new Date().toISOString(),
      completed_at: o.completedAt || null,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await client.from("nucleo_production_orders").upsert(rows, { onConflict: "tenant_id,id" });
    if (error) {
      console.warn("[Supabase] Error syncing production orders:", error.message);
      return false;
    }
    markSupabaseSynced();
    return true;
  } catch (e) {
    console.warn("[Supabase] Exception syncing production orders:", e);
    return false;
  }
}

export async function syncRouteDriversToSupabase(tenantId: string, drivers: RouteDriver[]): Promise<boolean> {
  if (!isSupabaseConfigured() || !tenantId || drivers.length === 0) return false;
  try {
    const client = getSupabaseClient();
    const rows = drivers.map((d) => ({
      id: d.id,
      tenant_id: tenantId,
      code: d.code,
      full_name: d.fullName,
      phone: d.phone || "",
      vehicle_type: d.vehicleType,
      vehicle_plate: d.vehiclePlate,
      status: d.status || "disponible",
      raw_data: d,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await client.from("nucleo_route_drivers").upsert(rows, { onConflict: "tenant_id,id" });
    if (error) {
      console.warn("[Supabase] Error syncing route drivers:", error.message);
      return false;
    }
    markSupabaseSynced();
    return true;
  } catch (e) {
    console.warn("[Supabase] Exception syncing route drivers:", e);
    return false;
  }
}

export async function syncDeliveryRoutesToSupabase(tenantId: string, routes: DeliveryRoute[]): Promise<boolean> {
  if (!isSupabaseConfigured() || !tenantId || routes.length === 0) return false;
  try {
    const client = getSupabaseClient();
    const rows = routes.map((r) => ({
      id: r.id,
      tenant_id: tenantId,
      code: r.code,
      name: r.name,
      status: r.status || "activa",
      assigned_driver_ids: r.assignedDriverIds || [],
      pins: r.pins || [],
      raw_data: r,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await client.from("nucleo_delivery_routes").upsert(rows, { onConflict: "tenant_id,id" });
    if (error) {
      console.warn("[Supabase] Error syncing delivery routes:", error.message);
      return false;
    }
    markSupabaseSynced();
    return true;
  } catch (e) {
    console.warn("[Supabase] Exception syncing delivery routes:", e);
    return false;
  }
}

export async function syncRouteOrdersToSupabase(tenantId: string, orders: RouteCustomerOrder[]): Promise<boolean> {
  if (!isSupabaseConfigured() || !tenantId || orders.length === 0) return false;
  try {
    const client = getSupabaseClient();
    const rows = orders.map((o) => ({
      id: o.id,
      tenant_id: tenantId,
      order_number: o.orderNumber,
      route_id: o.routeId,
      pin_id: o.pinId || null,
      place_name: o.placeName,
      driver_id: o.driverId || null,
      driver_name: o.driverName || null,
      total: Number(o.total) || 0,
      status: o.status || "pendiente_despacho",
      items: o.items || [],
      raw_data: o,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await client.from("nucleo_route_orders").upsert(rows, { onConflict: "tenant_id,id" });
    if (error) {
      console.warn("[Supabase] Error syncing route orders:", error.message);
      return false;
    }
    markSupabaseSynced();
    return true;
  } catch (e) {
    console.warn("[Supabase] Exception syncing route orders:", e);
    return false;
  }
}

export async function syncSupportTicketsToSupabase(tickets: SupportTicket[]): Promise<boolean> {
  if (!isSupabaseConfigured() || tickets.length === 0) return false;
  try {
    const client = getSupabaseClient();
    const rows = tickets.map((t) => ({
      id: t.id,
      ticket_code: t.ticketCode,
      tenant_id: t.tenantId,
      tenant_name: t.tenantName,
      type: t.type,
      subject: t.subject,
      priority: t.priority,
      status: t.status,
      unread_by_admin: Boolean(t.unreadByAdmin),
      unread_by_client: Boolean(t.unreadByClient),
      messages: t.messages || [],
      raw_data: t,
      updated_at: t.updatedAt || new Date().toISOString(),
    }));
    const { error } = await client.from("nucleo_support_tickets").upsert(rows, { onConflict: "id" });
    if (error) {
      console.warn("[Supabase] Error syncing support tickets:", error.message);
      return false;
    }
    markSupabaseSynced();
    return true;
  } catch (e) {
    console.warn("[Supabase] Exception syncing support tickets:", e);
    return false;
  }
}

// ============================================================================
// DESCARGA / HIDRATACIÓN MULTI-TENANT DESDE SUPABASE AL INICIAR O CAMBIAR TENANT
// ============================================================================

export interface TenantCloudSnapshot {
  tenants?: TenantSettings[];
  users?: AppUser[];
  products?: Product[];
  customers?: Customer[];
  sales?: Sale[];
  cashSession?: CashRegisterSession | null;
  vetPatients?: PetPatient[];
  clinicalPatients?: ClinicalPatient[];
  hrEmployees?: HREmployee[];
  recipes?: ProductionRecipe[];
  productionOrders?: ProductionOrder[];
  routeDrivers?: RouteDriver[];
  deliveryRoutes?: DeliveryRoute[];
  routeOrders?: RouteCustomerOrder[];
  supportTickets?: SupportTicket[];
}

export async function fetchTenantSnapshotFromSupabase(tenantId: string): Promise<TenantCloudSnapshot | null> {
  if (!isSupabaseConfigured() || !tenantId) return null;
  try {
    const client = getSupabaseClient();

    const [
      tenantsRes,
      usersRes,
      productsRes,
      customersRes,
      salesRes,
      cashRes,
      vetRes,
      clinicalRes,
      hrRes,
      recipesRes,
      ordersRes,
      driversRes,
      routesRes,
      routeOrdersRes,
      ticketsRes,
    ] = await Promise.all([
      client.from("nucleo_tenants").select("raw_data"),
      client.from("nucleo_users").select("raw_data"),
      client.from("nucleo_products").select("raw_data").eq("tenant_id", tenantId),
      client.from("nucleo_customers").select("raw_data").eq("tenant_id", tenantId),
      client.from("nucleo_sales").select("raw_data").eq("tenant_id", tenantId).order("created_at", { ascending: false }),
      client.from("nucleo_cash_sessions").select("raw_data").eq("tenant_id", tenantId).order("opened_at", { ascending: false }).limit(1),
      client.from("nucleo_vet_patients").select("raw_data").eq("tenant_id", tenantId),
      client.from("nucleo_clinical_patients").select("raw_data").eq("tenant_id", tenantId),
      client.from("nucleo_hr_employees").select("raw_data").eq("tenant_id", tenantId),
      client.from("nucleo_production_recipes").select("raw_data").eq("tenant_id", tenantId),
      client.from("nucleo_production_orders").select("raw_data").eq("tenant_id", tenantId),
      client.from("nucleo_route_drivers").select("raw_data").eq("tenant_id", tenantId),
      client.from("nucleo_delivery_routes").select("raw_data").eq("tenant_id", tenantId),
      client.from("nucleo_route_orders").select("raw_data").eq("tenant_id", tenantId),
      client.from("nucleo_support_tickets").select("raw_data"),
    ]);

    // Si hay un error de tabla no creada aún, devolver null silenciosamente para usar local fallback
    if (tenantsRes.error) {
      return null;
    }

    const extract = <T>(rows: any[] | null | undefined): T[] | undefined => {
      if (!rows || rows.length === 0) return undefined;
      return rows.map((r) => r.raw_data as T).filter(Boolean);
    };

    markSupabaseSynced();

    return {
      tenants: extract<TenantSettings>(tenantsRes.data),
      users: extract<AppUser>(usersRes.data),
      products: extract<Product>(productsRes.data),
      customers: extract<Customer>(customersRes.data),
      sales: extract<Sale>(salesRes.data),
      cashSession: cashRes.data && cashRes.data[0]?.raw_data ? (cashRes.data[0].raw_data as CashRegisterSession) : undefined,
      vetPatients: extract<PetPatient>(vetRes.data),
      clinicalPatients: extract<ClinicalPatient>(clinicalRes.data),
      hrEmployees: extract<HREmployee>(hrRes.data),
      recipes: extract<ProductionRecipe>(recipesRes.data),
      productionOrders: extract<ProductionOrder>(ordersRes.data),
      routeDrivers: extract<RouteDriver>(driversRes.data),
      deliveryRoutes: extract<DeliveryRoute>(routesRes.data),
      routeOrders: extract<RouteCustomerOrder>(routeOrdersRes.data),
      supportTickets: extract<SupportTicket>(ticketsRes.data),
    };
  } catch (e) {
    console.warn("[Supabase] Could not fetch snapshot from cloud:", e);
    return null;
  }
}

export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message: "Credenciales de Supabase no configuradas. Ingresa tu Project URL y Anon Key.",
    };
  }
  try {
    const client = getSupabaseClient();
    const { error } = await client.from("nucleo_tenants").select("id").limit(1);
    if (error) {
      return {
        ok: false,
        message: `Conectado al servidor Supabase, pero falta ejecutar el script SQL de tablas (${error.message}).`,
      };
    }
    markSupabaseSynced();
    return {
      ok: true,
      message: "¡Conexión exitosa! Las tablas Multi-Tenant de Supabase están activas y listas.",
    };
  } catch (e: any) {
    return {
      ok: false,
      message: `Error de red al conectar con Supabase: ${e?.message || "Verifica la URL y Anon Key"}`,
    };
  }
}
