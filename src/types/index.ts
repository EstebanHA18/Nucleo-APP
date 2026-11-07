// Tipos principales para Núcleo ERP Modular

export type BusinessVertical = 
  | 'ferreteria'
  | 'comercio' // Pulperías, minisúper, tiendas
  | 'agroservicio'
  | 'restaurante'
  | 'distribuidora'
  | 'farmacia'
  | 'clinica'
  | 'taller'
  | 'constructora'
  | 'bodega'
  | 'financiera'
  | 'chatarrera'
  | 'ganaderia'
  | 'personalizado';

export type ModuleKey = 
  | 'pos'
  | 'inventory'
  | 'billing'
  | 'crm'
  | 'receivables' // Cuentas por cobrar / Fiados
  | 'payables'    // Cuentas por pagar
  | 'hr'          // RRHH & Nómina
  | 'expenses'    // Gastos y caja chica
  | 'production'  // Producción & Recetas
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
  code: string; // 'und', 'mtr', 'vara', 'lbr', 'qq', 'paq', 'gal', 'lt'
  name: string;
  ratio: number;
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
  batchNumber?: string;
  expirationDate?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  taxId?: string; // RUC / Cédula
  allowCredit: boolean;
  creditLimit: number;
  currentBalance: number; // Saldo deudor
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customer?: Customer;
  paymentMethod: 'cash' | 'credit' | 'card' | 'transfer';
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  costTotal: number;
  profit: number;
  currency: 'NIO' | 'USD';
  exchangeRate: number;
  createdAt: string;
  isOfflineSynced?: boolean;
}

export interface Receivable {
  id: string;
  saleId: string;
  invoiceNumber: string;
  customer: Customer;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  dueDate: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  createdAt: string;
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

export interface TenantSettings {
  id: string;
  name: string;
  businessVertical: BusinessVertical;
  currency: 'NIO' | 'USD';
  secondaryCurrency: 'USD' | 'NIO';
  exchangeRate: number;
  taxPercentage: number;
  taxId?: string;
  phone?: string;
  address?: string;
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
