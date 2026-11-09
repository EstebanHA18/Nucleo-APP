// Tipos principales para Núcleo ERP Modular

export type BusinessVertical = 
  | 'ferreteria'
  | 'comercio'
  | 'agroservicio'
  | 'restaurante'
  | 'distribuidora'
  | 'farmacia'
  | 'clinica'
  | 'taller'
  | 'constructora'
  | 'bodega'
  | 'personalizado';

export type ModuleKey = 
  | 'pos'
  | 'inventory'
  | 'billing'
  | 'customers'  // Directorio de clientes & CRM
  | 'expenses'   // Gastos y compras
  | 'hr'         // RRHH & Nómina
  | 'production' // Producción & Recetas
  | 'reports';

export interface ModuleConfig {
  key: ModuleKey;
  name: string;
  description: string;
  icon: string;
  isCore: boolean;
  defaultFor: BusinessVertical[];
}

export interface UnitOfMeasure {
  id: string;
  code: string;
  name: string;
  ratio: number;
}

export interface Batch {
  id: string;
  batchNumber: string;
  expirationDate: string; // "YYYY-MM-DD"
  stock: number;
  barcode?: string;
  costPrice?: number;
  createdAt?: string;
  notes?: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  hasBatches?: boolean;
  batches?: Batch[];
  batchNumber?: string;
  expirationDate?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
  selectedBatch?: Batch;
}

export interface Customer {
  id: string;
  name: string;
  businessName?: string;
  phone: string;
  email?: string;
  taxId?: string;
  address?: string;
  city?: string;
  totalPurchases: number;
  lastPurchaseDate?: string;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customer?: Customer;
  customerName?: string;
  customerTaxId?: string;
  paymentMethod: 'cash' | 'card' | 'transfer';
  amountPaid: number;      // Con cuánto pagó el cliente
  changeGiven: number;     // Vuelto entregado
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  costTotal: number;
  profit: number;
  currency: 'NIO' | 'USD';
  exchangeRate: number;
  createdAt: string;
  cashierName?: string;
  sellerName?: string;
  isOfflineSynced?: boolean;
}

export interface CashRegisterSession {
  id: string;
  status: 'open' | 'closed';
  openedBy: string;
  openedAt: string;
  openingAmount: number;
  closedBy?: string;
  closedAt?: string;
  cashSalesTotal: number;
  cardSalesTotal: number;
  transferSalesTotal: number;
  totalSales: number;
  totalProfit: number;
  salesCount: number;
  expectedCashInDrawer: number;
  actualCashInDrawer?: number;
  difference?: number; // Sobrante (+) o Faltante (-)
  notes?: string;
}

export interface CashRegister {
  id: string;
  name: string;
  isOpen: boolean;
  openedBy: string;
  openingAmount: number;
  salesCashAmount: number;
  closingAmount?: number;
  openedAt: string;
}

export interface OwnerProfile {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  pinCode?: string;
}

export type UserRole = 'owner' | 'cashier' | 'inventory_clerk' | 'supervisor' | 'custom';

export interface AppUser {
  id: string;
  fullName: string;
  username: string;
  phone?: string;
  email?: string;
  pinCode: string;
  role: UserRole;
  roleLabel: string;
  allowedModules: ModuleKey[];
  active: boolean;
  createdAt: string;
}

export interface TenantSettings {
  id: string;
  name: string;
  legalName?: string;
  taxId?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  owner: OwnerProfile;
  businessVertical: BusinessVertical;
  currency: 'NIO' | 'USD';
  secondaryCurrency: 'USD' | 'NIO';
  exchangeRate: number;
  taxPercentage: number;
  activeModules: ModuleKey[];
  ticketFormat: '58mm' | '80mm' | 'letter';
  ticketHeader: string;
  ticketFooter: string;
  isSetupCompleted: boolean;
  monthlyPlanPrice: number;
  planName: 'Starter' | 'Pro' | 'Enterprise';
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'stat' | 'chart' | 'table' | 'alert';
  size: 'small' | 'medium' | 'large';
  visible: boolean;
  order: number;
}
