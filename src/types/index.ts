// Tipos principales para Núcleo ERP Modular

export type BusinessVertical = 
  | 'ferreteria'
  | 'comercio'
  | 'agroservicio'
  | 'restaurante'
  | 'distribuidora'
  | 'farmacia'
  | 'clinica'
  | 'veterinaria'
  | 'dental'
  | 'taller'
  | 'constructora'
  | 'bodega'
  | 'personalizado';

export type ModuleKey = 
  | 'pos'
  | 'inventory'
  | 'billing'
  | 'customers'   // Directorio de clientes & CRM
  | 'expenses'    // Gastos y compras
  | 'hr'          // RRHH & Nómina
  | 'production'  // Producción & Recetas
  | 'reports'
  | 'veterinary'  // Módulo Veterinario: Pacientes, vacunas y expedientes
  | 'clinical';   // Módulo Clínico & Dental: Pacientes, odontograma e historias clínicas

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

export type UserRole = 'superadmin' | 'owner' | 'cashier' | 'inventory_clerk' | 'supervisor' | 'custom';

export interface AppUser {
  id: string;
  fullName: string;
  username: string;
  phone?: string;
  email?: string;
  pinCode: string;
  password?: string;
  role: UserRole;
  roleLabel: string;
  allowedModules: ModuleKey[];
  active: boolean;
  createdAt: string;
  tenantId?: string;
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
  invoiceSlogan?: string;
  showTaxBreakdown?: boolean;
  showUsdEquivalence?: boolean;
  showBarcodeOnTicket?: boolean;
  logoUrl?: string;
  showLogoOnTicket?: boolean;
  logoSize?: 'sm' | 'md' | 'lg';
  bluetoothPrinterName?: string;
  autoPrintBluetooth?: boolean;
  isSetupCompleted: boolean;
  monthlyPlanPrice: number;
  planName: 'Starter' | 'Pro' | 'Enterprise';
  billingCycle?: 'monthly' | 'annual';
  nextPaymentDate?: string;
  paymentStatus?: 'active' | 'past_due' | 'trial';
  adminAssignedBy?: string;
  planAssignedDate?: string;
  createdAt?: string;
  billingCutDay?: number; // Día 10 de corte
  billingDueDay?: number; // Día 5 de vencimiento de pago
  proRatedFirstMonthAmount?: number;
  proRatedDays?: number;
  loginUsername?: string;
  loginPassword?: string;
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'stat' | 'chart' | 'table' | 'alert';
  size: 'small' | 'medium' | 'large';
  visible: boolean;
  order: number;
}

// ==========================================
// MODELOS PARA MÓDULO VETERINARIO
// ==========================================

export type PetSpecies = 'canino' | 'felino' | 'equino' | 'bovino' | 'ave' | 'exotico' | 'otro';
export type PetGender = 'macho' | 'hembra';
export type PetReproductiveStatus = 'entero' | 'castrado' | 'esterilizada';

export interface VeterinaryVaccine {
  id: string;
  name: string;
  applicationDate: string;
  nextDueDate: string;
  batchNumber?: string;
  veterinarian: string;
  status: 'applied' | 'pending' | 'overdue';
}

export interface VeterinaryDeworming {
  id: string;
  productName: string;
  type: 'internal' | 'external' | 'both';
  applicationDate: string;
  nextDueDate: string;
  dose: string;
  status: 'applied' | 'pending' | 'overdue';
}

export interface ConsultationMedicineItem {
  productId: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface PendingBill {
  id: string; // Consultation ID
  source: 'veterinary' | 'clinical';
  patientId: string;
  patientName: string;
  ownerName?: string;
  customerTaxId?: string;
  customerPhone?: string;
  concept: string;
  consultationFee: number;
  items: ConsultationMedicineItem[];
  total: number;
}

export interface VeterinaryConsultation {
  id: string;
  date: string;
  reason: string;
  anamnesis: string;
  vitals: {
    weightKg: number;
    temperatureC: number;
    heartRateBpm: number;
    respiratoryRateRpm?: number;
    bodyCondition?: '1_muy_delgado' | '2_delgado' | '3_ideal' | '4_sobrepeso' | '5_obeso';
  };
  diagnosis: string;
  treatment: string;
  prescription?: string;
  veterinarianName: string;
  consultationFee: number;
  medicinesUsed?: ConsultationMedicineItem[];
  cost: number;
  paymentStatus?: 'pending' | 'paid';
  notes?: string;
}

export interface PetPatient {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string;
  sex: PetGender;
  ageYears: number;
  ageMonths: number;
  birthDate?: string;
  weightKg: number;
  color: string;
  microchip?: string;
  allergies?: string;
  reproductiveStatus: PetReproductiveStatus;
  photoUrl?: string;
  ownerName: string;
  ownerPhone: string;
  ownerDni?: string;
  ownerEmail?: string;
  ownerAddress?: string;
  createdAt: string;
  lastVisitDate?: string;
  status: 'active' | 'in_treatment' | 'discharged';
  consultations: VeterinaryConsultation[];
  vaccines: VeterinaryVaccine[];
  dewormings: VeterinaryDeworming[];
}

// ==========================================
// MODELOS PARA MÓDULO CLÍNICO & ODONTOLÓGICO
// ==========================================

export type BloodGroup = 'O+' | 'O-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-';

export type ToothCondition = 
  | 'sano'
  | 'caries'
  | 'obturado'
  | 'endodoncia'
  | 'ausente'
  | 'corona'
  | 'implante'
  | 'extraccion_indicada';

export interface OdontogramTooth {
  toothNumber: number; // Numeración internacional FDI (11 a 48)
  name: string;
  condition: ToothCondition;
  notes?: string;
  estimatedCost?: number;
}

export interface ClinicalConsultation {
  id: string;
  date: string;
  specialty: 'odontologia' | 'medicina_general' | 'pediatria' | 'control';
  reason: string;
  vitals?: {
    bloodPressure?: string; // Ej: "120/80"
    heartRate?: number;     // bpm
    temperature?: number;   // °C
    oxygenSat?: number;     // %
    weightKg?: number;
  };
  symptoms?: string;
  diagnosis: string;
  procedureDone?: string;
  treatment: string;
  prescription?: string;
  doctorName: string;
  consultationFee: number;
  medicinesUsed?: ConsultationMedicineItem[];
  cost: number;
  paymentStatus?: 'pending' | 'paid';
  nextAppointmentDate?: string;
  teethInvolved?: number[];
}

export interface ClinicalPatient {
  id: string;
  fullName: string;
  dni: string;
  birthDate: string;
  age: number;
  gender: 'masculino' | 'femenino' | 'otro';
  bloodType: BloodGroup;
  phone: string;
  email?: string;
  address?: string;
  occupation?: string;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  insuranceName?: string;
  allergies: string[];
  pathologies: string[];
  currentMedication?: string;
  surgicalHistory?: string;
  notes?: string;
  createdAt: string;
  lastVisitDate?: string;
  status: 'active' | 'in_treatment' | 'discharged';
  odontogram: OdontogramTooth[];
  consultations: ClinicalConsultation[];
}

// ==========================================
// MODELOS PARA MÓDULO DE RECURSOS HUMANOS & NÓMINA
// ==========================================

export type EmployeeDepartment = 
  | 'ventas_caja'
  | 'bodega_logistica'
  | 'administracion'
  | 'clinica_atencion'
  | 'operaciones';

export type ContractType = 'indefinido' | 'determinado' | 'servicios_profesionales' | 'pasantia';
export type PaymentFrequency = 'quincenal' | 'mensual' | 'semanal';
export type EmployeeStatus = 'activo' | 'vacaciones' | 'subsidio' | 'inactivo';

export interface AttendanceRecord {
  id: string;
  date: string; // "YYYY-MM-DD"
  checkIn: string; // "08:00"
  checkOut?: string; // "17:00"
  status: 'presente' | 'tardanza' | 'permiso' | 'ausente';
  overtimeHours: number;
  notes?: string;
}

export interface HRAdvanceOrLeave {
  id: string;
  type: 'adelanto_salarial' | 'vacaciones' | 'permiso_medico' | 'bono_comision';
  date: string;
  amount?: number; // En C$ para adelantos o bonos
  days?: number;   // Para vacaciones o permisos
  reason: string;
  status: 'aprobado' | 'pendiente' | 'aplicado';
}

export interface PayrollRecord {
  id: string;
  periodLabel: string; // Ej: "1ra Quincena Noviembre 2026"
  paymentDate: string;
  baseSalaryPeriod: number;
  overtimeHours: number;
  overtimePay: number;
  bonuses: number;
  inssDeduction: number;      // 7% INSS Laboral
  irDeduction: number;        // Retención IR si aplica
  advancesDeduction: number;  // Adelantos de sueldo descontados
  netPay: number;
  paymentMethod: 'efectivo' | 'transferencia' | 'cheque';
  status: 'pagado' | 'pendiente';
}

export interface HREmployee {
  id: string;
  code: string; // Ej: "EMP-001"
  fullName: string;
  dni: string; // Cédula de identidad
  inssNumber?: string;
  position: string;
  department: EmployeeDepartment;
  contractType: ContractType;
  paymentFrequency: PaymentFrequency;
  hireDate: string; // "YYYY-MM-DD"
  baseMonthlySalary: number; // En moneda local (C$)
  phone: string;
  email?: string;
  address?: string;
  emergencyContact: string;
  bankAccount?: string;
  bankName?: string;
  vacationDaysAvailable: number;
  status: EmployeeStatus;
  attendance: AttendanceRecord[];
  movements: HRAdvanceOrLeave[];
  payrollHistory: PayrollRecord[];
}

// ==========================================
// MODELOS PARA HELPDESK & COMUNICACIÓN (CLIENTE <-> GOD MODE)
// ==========================================

export type TicketRequestType = 
  | 'module_request'
  | 'bug_report'
  | 'billing_query'
  | 'system_support';

export type TicketPriority = 'baja' | 'media' | 'alta' | 'urgente';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface TicketMessage {
  id: string;
  senderRole: 'client' | 'superadmin';
  senderName: string;
  text: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketCode: string; // Ej: "TKT-1042"
  tenantId: string;
  tenantName: string;
  createdByUserId: string;
  createdByName: string;
  type: TicketRequestType;
  requestedModules?: ModuleKey[];
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
  unreadByAdmin?: boolean;
  unreadByClient?: boolean;
}
