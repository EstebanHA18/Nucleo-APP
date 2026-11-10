import { 
  BusinessVertical, 
  ModuleConfig, 
  Product, 
  Customer,
  PetPatient,
  ClinicalPatient,
  OdontogramTooth 
} from "@/types";

export const AVAILABLE_MODULES: ModuleConfig[] = [
  {
    key: "pos",
    name: "Terminal POS & Facturación",
    description: "Ventas rápidas de mostrador, tickets térmicos, arqueo de caja y lector de código.",
    icon: "Receipt",
    isCore: true,
    defaultFor: ["ferreteria", "comercio", "agroservicio", "restaurante", "farmacia", "taller", "distribuidora", "veterinaria", "clinica", "dental"],
  },
  {
    key: "inventory",
    name: "Inventario Multi-Unidad",
    description: "Control de stock por unidades, varas, metros, quintales, lotes y vencimientos.",
    icon: "Package",
    isCore: true,
    defaultFor: ["ferreteria", "comercio", "agroservicio", "restaurante", "farmacia", "bodega", "constructora", "distribuidora", "veterinaria", "clinica", "dental"],
  },
  {
    key: "billing",
    name: "Reportes & Finanzas",
    description: "Libro de ventas, arqueos, ingresos diarios y márgenes de rentabilidad.",
    icon: "FileText",
    isCore: true,
    defaultFor: ["ferreteria", "comercio", "agroservicio", "restaurante", "farmacia", "clinica", "veterinaria", "dental", "taller", "constructora"],
  },
  {
    key: "customers",
    name: "Directorio de Clientes",
    description: "Expediente de clientes, historial de compras, RUC, datos fiscales y contacto directo.",
    icon: "Users",
    isCore: false,
    defaultFor: ["ferreteria", "comercio", "agroservicio", "distribuidora", "taller", "constructora", "veterinaria", "clinica", "dental"],
  },
  {
    key: "veterinary",
    name: "Veterinaria & Pacientes",
    description: "Expediente clínico de mascotas, carnet de vacunación, desparasitaciones y tutores.",
    icon: "Dog",
    isCore: false,
    defaultFor: ["veterinaria"],
  },
  {
    key: "clinical",
    name: "Clínica & Odontograma",
    description: "Historias clínicas, antecedentes patológicos, recetas y odontograma dental interactivo.",
    icon: "Stethoscope",
    isCore: false,
    defaultFor: ["clinica", "dental"],
  },
  {
    key: "expenses",
    name: "Gastos & Compras",
    description: "Control de egresos diarios, compras a proveedores y caja operativa.",
    icon: "Wallet",
    isCore: false,
    defaultFor: ["ferreteria", "comercio", "restaurante", "constructora", "clinica", "veterinaria", "dental"],
  },
  {
    key: "hr",
    name: "RRHH & Nómina",
    description: "Asistencia de personal, horas trabajadas y cálculo salarial.",
    icon: "UserCheck",
    isCore: false,
    defaultFor: ["constructora", "restaurante", "distribuidora", "clinica", "veterinaria"],
  },
  {
    key: "production",
    name: "Recetas & Producción",
    description: "Descuento automático de materia prima o ingredientes al vender.",
    icon: "Layers",
    isCore: false,
    defaultFor: ["restaurante", "constructora"],
  },
];

export interface VerticalPreset {
  id: BusinessVertical;
  name: string;
  tagline: string;
  iconName: string;
  badge: string;
  description: string;
  highlightFeature: string;
  defaultModules: string[];
  suggestedUnits: string[];
}

export const VERTICAL_PRESETS: VerticalPreset[] = [
  {
    id: "ferreteria",
    name: "Ferretería y Materiales",
    tagline: "Unidades, varas, metros y sacos",
    iconName: "Wrench",
    badge: "Popular en Occidente",
    description: "Ventas por varas de hierro, metros de cable, tubos PVC y sacos de cemento.",
    highlightFeature: "Conversión de varas a metros y control estricto de mínimos en bodega.",
    defaultModules: ["pos", "inventory", "billing", "customers", "expenses"],
    suggestedUnits: ["Unidad (und)", "Vara (vara)", "Metro (mtr)", "Saco (saco)", "Paquete (paq)"],
  },
  {
    id: "comercio",
    name: "Comercio General / Tienda",
    tagline: "Ventas rápidas de mostrador",
    iconName: "Store",
    badge: "Minisúper & Miscelánea",
    description: "Manejo veloz de ventas en efectivo, tarjeta o transferencia con ticket instantáneo.",
    highlightFeature: "Arqueo de caja rápido al final de cada turno.",
    defaultModules: ["pos", "inventory", "billing", "customers"],
    suggestedUnits: ["Unidad (und)", "Libra (lbr)", "Docena (doc)", "Paquete (paq)"],
  },
  {
    id: "agroservicio",
    name: "Agroservicio & Químicos",
    tagline: "Lotes, vencimientos y agroinsumos",
    iconName: "Wheat",
    badge: "Lotes & Caducidad",
    description: "Trazabilidad de fertilizantes, insecticidas, semillas y lotes con fecha de vencimiento.",
    highlightFeature: "Alertas visuales de productos próximos a vencer.",
    defaultModules: ["pos", "inventory", "billing", "customers", "expenses"],
    suggestedUnits: ["Litro (lt)", "Galón (gal)", "Quintal (qq)", "Saco (saco)", "Unidad (und)"],
  },
  {
    id: "restaurante",
    name: "Restaurante & Gastronomía",
    tagline: "Menú, recetas e insumos",
    iconName: "Utensils",
    badge: "Recetas automáticas",
    description: "Comandas rápidas, mesas, delivery y descuento automático de insumos según la receta.",
    highlightFeature: "Venta de platillo descuenta ingredientes de cocina.",
    defaultModules: ["pos", "inventory", "billing", "production", "expenses"],
    suggestedUnits: ["Porción", "Platillo", "Botella", "Unidad"],
  },
  {
    id: "farmacia",
    name: "Farmacia & Salud",
    tagline: "Lotes farmacéuticos y caducidad",
    iconName: "Pill",
    badge: "Control Sanitario",
    description: "Búsqueda por principio activo, control por lote y bloqueo de fármacos vencidos.",
    highlightFeature: "Alerta de expiración en tiempo real en la pantalla del POS.",
    defaultModules: ["pos", "inventory", "billing", "customers"],
    suggestedUnits: ["Caja", "Blíster", "Tableta", "Frasco", "Unidad"],
  },
  {
    id: "distribuidora",
    name: "Distribuidora & Rutas",
    tagline: "Despacho masivo y liquidación",
    iconName: "Truck",
    badge: "Mayorista",
    description: "Carga de camión, despacho de pedidos y liquidación al contado o transferencia.",
    highlightFeature: "Flujo Camión ➔ Carga ➔ Facturación ➔ Liquidación de turno.",
    defaultModules: ["pos", "inventory", "billing", "customers", "hr", "expenses"],
    suggestedUnits: ["Caja", "Fardo", "Docena", "Quintal", "Unidad"],
  },
  {
    id: "taller",
    name: "Taller Mecánico & Servicios",
    tagline: "Órdenes de servicio y repuestos",
    iconName: "Cog",
    badge: "Servicios + Partes",
    description: "Factura combinada: Repuestos instalados de bodega + Mano de obra técnica.",
    highlightFeature: "Detalle de vehículo y cliente en el comprobante.",
    defaultModules: ["pos", "inventory", "billing", "customers", "expenses"],
    suggestedUnits: ["Hora Servicio", "Pieza", "Juego", "Unidad"],
  },
  {
    id: "constructora",
    name: "Constructora & Proyectos",
    tagline: "Materiales por obra y personal",
    iconName: "Building2",
    badge: "Control de Obras",
    description: "Asignación de materiales y mano de obra con costeo en vivo.",
    highlightFeature: "Seguimiento de salidas de bodega por proyecto.",
    defaultModules: ["inventory", "billing", "expenses", "hr", "customers"],
    suggestedUnits: ["Metro cúbico (m³)", "Vara (vara)", "Metro (m)", "Quintal (qq)"],
  },
  {
    id: "veterinaria",
    name: "Veterinaria & Mascotas",
    tagline: "Pacientes, vacunas y expedientes clínicos",
    iconName: "Dog",
    badge: "Clínica Veterinaria",
    description: "Control integral de mascotas, historial clínico, carnet digital de vacunas, desparasitaciones y tutores.",
    highlightFeature: "Expediente clínico veterinario con carnet de vacunas y desparasitación con alertas de vencimiento.",
    defaultModules: ["veterinary", "pos", "inventory", "billing", "customers"],
    suggestedUnits: ["Consulta", "Dosis", "Procedimiento", "Cirugía", "Unidad"],
  },
  {
    id: "clinica",
    name: "Clínica Médica & Consultorios",
    tagline: "Historias clínicas, anamnesis y recetas",
    iconName: "Stethoscope",
    badge: "Salud & Especialidades",
    description: "Expedientes de pacientes, signos vitales, alergias, antecedentes patológicos y recetas médicas.",
    highlightFeature: "Ficha médica confidencial con recetas y control de signos vitales.",
    defaultModules: ["clinical", "pos", "inventory", "billing", "customers"],
    suggestedUnits: ["Consulta", "Sesión", "Tratamiento", "Estudio", "Servicio"],
  },
  {
    id: "dental",
    name: "Clínica Dental & Odontología",
    tagline: "Odontograma interactivo y piezas dentales",
    iconName: "Smile",
    badge: "Odontología Digital",
    description: "Odontograma gráfico interactivo (FDI), historial de procedimientos dentales y presupuestos por pieza.",
    highlightFeature: "Odontograma interactivo con estados (sano, caries, obturación, endodoncia, ausente, implante).",
    defaultModules: ["clinical", "pos", "inventory", "billing", "customers"],
    suggestedUnits: ["Pieza", "Limpieza", "Calza / Resina", "Endodoncia", "Corona", "Procedimiento"],
  },
  {
    id: "personalizado",
    name: "Personalizado / A Medida",
    tagline: "Tú eliges cada módulo",
    iconName: "Sparkles",
    badge: "Modular Libre",
    description: "Configura el ERP seleccionando exactamente las herramientas de tu negocio.",
    highlightFeature: "Total adaptabilidad a cualquier modelo comercial.",
    defaultModules: ["pos", "inventory", "billing", "customers"],
    suggestedUnits: ["Unidad (und)", "Servicio"],
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    sku: "VAR-038",
    barcode: "743200192801",
    name: "Varilla Corrugada Grado 40 3/8\" (9.5mm)",
    category: "Hierro y Acero",
    unit: "Vara",
    costPrice: 95.0,
    salePrice: 135.0,
    stock: 18,
    minStock: 25,
  },
  {
    id: "prod-2",
    sku: "CEM-HOL-42",
    barcode: "743200192802",
    name: "Cemento Holcim Fuerte 42.5 Kg",
    category: "Materiales Básicos",
    unit: "Saco",
    costPrice: 285.0,
    salePrice: 345.0,
    stock: 22,
    minStock: 30,
  },
  {
    id: "prod-3",
    sku: "TUB-PVC-12",
    barcode: "743200192803",
    name: "Tubo PVC SDR-26 1/2\" x 6 metros",
    category: "Fontanería",
    unit: "Tubo 6m",
    costPrice: 85.0,
    salePrice: 125.0,
    stock: 45,
    minStock: 20,
  },
  {
    id: "prod-4",
    sku: "CAB-THHN-12",
    barcode: "743200192804",
    name: "Cable Eléctrico THHN #12 Condumex",
    category: "Electricidad",
    unit: "Metro",
    costPrice: 18.0,
    salePrice: 28.0,
    stock: 180,
    minStock: 50,
  },
  {
    id: "prod-5",
    sku: "HER-GLI-1L",
    barcode: "743200192805",
    name: "Herbicida Glifosato 48% SL 1 Litro",
    category: "Agroquímicos",
    unit: "Litro",
    costPrice: 190.0,
    salePrice: 260.0,
    stock: 14,
    minStock: 10,
    hasBatches: true,
    batchNumber: "L-2026-B12",
    expirationDate: "2027-08-15",
    batches: [
      {
        id: "batch-gli-1",
        batchNumber: "L-2026-B12",
        expirationDate: "2027-08-15",
        stock: 10,
        barcode: "743200192805",
        createdAt: "2026-08-10",
      },
      {
        id: "batch-gli-2",
        batchNumber: "L-2025-A08",
        expirationDate: "2026-11-28", // Próximo a vencer (alerta naranja)
        stock: 4,
        barcode: "743200192899",
        createdAt: "2025-11-20",
      },
    ],
  },
  {
    id: "prod-6",
    sku: "FER-UREA-50",
    barcode: "743200192806",
    name: "Fertilizante Urea Granulada 46% 50 Kg",
    category: "Agroquímicos",
    unit: "Saco",
    costPrice: 820.0,
    salePrice: 980.0,
    stock: 35,
    minStock: 15,
    hasBatches: true,
    batchNumber: "LOT-UREA-2026",
    expirationDate: "2028-03-30",
    batches: [
      {
        id: "batch-urea-1",
        batchNumber: "LOT-UREA-2026",
        expirationDate: "2028-03-30",
        stock: 35,
        barcode: "743200192806",
        createdAt: "2026-09-01",
      },
    ],
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "cust-1",
    name: "Ing. Carlos Martínez",
    businessName: "Constructora Martínez & Hnos S.A.",
    phone: "+505 8892-1049",
    email: "carlos@constructoramartinez.com",
    taxId: "J0310000192841",
    address: "Km 132 Carretera Panamericana",
    city: "Chinandega",
    totalPurchases: 45800.0,
    lastPurchaseDate: "2026-11-05",
  },
  {
    id: "cust-2",
    name: "Roberto Fonseca",
    businessName: "Taller Hermanos Fonseca",
    phone: "+505 8412-9901",
    email: "tallerfonseca@gmail.com",
    taxId: "081-120984-0002A",
    address: "De los semáforos del Calvario 2c al Norte",
    city: "León",
    totalPurchases: 18400.0,
    lastPurchaseDate: "2026-11-04",
  },
  {
    id: "cust-3",
    name: "Manuel Gómez",
    businessName: "Finca El Progreso",
    phone: "+505 8765-4321",
    email: "manuel.gomez@agro.ni",
    taxId: "081-050472-0001B",
    address: "Comarca El Hato, Sector 3",
    city: "El Viejo",
    totalPurchases: 12200.0,
    lastPurchaseDate: "2026-11-02",
  },
  {
    id: "cust-4",
    name: "Cliente de Contado",
    phone: "",
    totalPurchases: 8900.0,
  },
];

// Generador de Odontograma de 32 piezas dentales en notación internacional FDI
export const generateDefaultOdontogram = (): OdontogramTooth[] => {
  // Cuadrante 1: Superior Derecho (18 a 11)
  // Cuadrante 2: Superior Izquierdo (21 a 28)
  // Cuadrante 4: Inferior Derecho (48 a 41)
  // Cuadrante 3: Inferior Izquierdo (31 a 38)
  const toothNames: Record<number, string> = {
    18: "Tercer Molar Sup. Der.",
    17: "Segundo Molar Sup. Der.",
    16: "Primer Molar Sup. Der.",
    15: "Segundo Premolar Sup. Der.",
    14: "Primer Premolar Sup. Der.",
    13: "Canino Sup. Der.",
    12: "Incisivo Lateral Sup. Der.",
    11: "Incisivo Central Sup. Der.",

    21: "Incisivo Central Sup. Izq.",
    22: "Incisivo Lateral Sup. Izq.",
    23: "Canino Sup. Izq.",
    24: "Primer Premolar Sup. Izq.",
    25: "Segundo Premolar Sup. Izq.",
    26: "Primer Molar Sup. Izq.",
    27: "Segundo Molar Sup. Izq.",
    28: "Tercer Molar Sup. Izq.",

    48: "Tercer Molar Inf. Der.",
    47: "Segundo Molar Inf. Der.",
    46: "Primer Molar Inf. Der.",
    45: "Segundo Premolar Inf. Der.",
    44: "Primer Premolar Inf. Der.",
    43: "Canino Inf. Der.",
    42: "Incisivo Lateral Inf. Der.",
    41: "Incisivo Central Inf. Der.",

    31: "Incisivo Central Inf. Izq.",
    32: "Incisivo Lateral Inf. Izq.",
    33: "Canino Inf. Izq.",
    34: "Primer Premolar Inf. Izq.",
    35: "Segundo Premolar Inf. Izq.",
    36: "Primer Molar Inf. Izq.",
    37: "Segundo Molar Inf. Izq.",
    38: "Tercer Molar Inf. Izq.",
  };

  const allNumbers = [
    18, 17, 16, 15, 14, 13, 12, 11,
    21, 22, 23, 24, 25, 26, 27, 28,
    48, 47, 46, 45, 44, 43, 42, 41,
    31, 32, 33, 34, 35, 36, 37, 38,
  ];

  return allNumbers.map((num) => ({
    toothNumber: num,
    name: toothNames[num] || `Pieza ${num}`,
    condition: "sano",
  }));
};

// Datos iniciales de demostración para Veterinaria
export const INITIAL_VET_PATIENTS: PetPatient[] = [
  {
    id: "vet-1",
    name: "Toby",
    species: "canino",
    breed: "Golden Retriever",
    sex: "macho",
    ageYears: 3,
    ageMonths: 4,
    birthDate: "2023-07-15",
    weightKg: 29.5,
    color: "Dorado Claro",
    microchip: "MC-981098234-NI",
    allergies: "Hipersensibilidad a picadura de pulga",
    reproductiveStatus: "castrado",
    ownerName: "María Elena Valdivia",
    ownerPhone: "+505 8891-2233",
    ownerDni: "081-120588-0004L",
    ownerEmail: "elena.valdivia@gmail.com",
    ownerAddress: "Barrio San Antonio, Casa #42, Chinandega",
    createdAt: "2024-02-10",
    lastVisitDate: "2026-11-04",
    status: "active",
    vaccines: [
      {
        id: "vac-1",
        name: "Antirrábica Rabisin",
        applicationDate: "2026-05-10",
        nextDueDate: "2027-05-10",
        batchNumber: "RAB-88219",
        veterinarian: "Dra. Lucía Mendoza",
        status: "applied",
      },
      {
        id: "vac-2",
        name: "Quíntuple Canina (DHPP+L)",
        applicationDate: "2026-06-15",
        nextDueDate: "2027-06-15",
        batchNumber: "DHPP-4410",
        veterinarian: "Dra. Lucía Mendoza",
        status: "applied",
      },
      {
        id: "vac-3",
        name: "Bronchicine (Tos de las Perreras)",
        applicationDate: "2025-11-20",
        nextDueDate: "2026-11-20",
        batchNumber: "BRON-119",
        veterinarian: "Dr. Carlos Pineda",
        status: "pending",
      },
    ],
    dewormings: [
      {
        id: "dew-1",
        productName: "Simparica Trio 20-40kg",
        type: "both",
        applicationDate: "2026-10-15",
        nextDueDate: "2026-11-15",
        dose: "1 Tableta masticable",
        status: "applied",
      },
    ],
    consultations: [
      {
        id: "cons-1",
        date: "2026-11-04",
        reason: "Chequeo semestral de rutina y limpieza de oídos",
        anamnesis: "Tutor refiere que el perro se rasca moderadamente la oreja derecha desde hace 3 días. Come y bebe con normalidad.",
        vitals: {
          weightKg: 29.5,
          temperatureC: 38.6,
          heartRateBpm: 92,
          respiratoryRateRpm: 24,
          bodyCondition: "3_ideal",
        },
        diagnosis: "Otitis ceruminosa externa leve en oído derecho.",
        treatment: "Limpieza ótica con Epi-Otic y gotas óticas Otovet 4 gotas c/12h por 7 días.",
        prescription: "Otovet Gotas 15ml (1 frasco) • Limpiador Epi-Otic 120ml",
        veterinarianName: "Dra. Lucía Mendoza",
        cost: 450.0,
        notes: "Control programado en 10 días para evaluar evolución ótica.",
      },
    ],
  },
  {
    id: "vet-2",
    name: "Luna",
    species: "felino",
    breed: "Siamés Tradicional",
    sex: "hembra",
    ageYears: 2,
    ageMonths: 1,
    birthDate: "2024-10-01",
    weightKg: 4.1,
    color: "Seal Point (Cuerpo crema, puntas chocolate)",
    allergies: "Ninguna conocida",
    reproductiveStatus: "esterilizada",
    ownerName: "Alejandro Morales",
    ownerPhone: "+505 8455-6677",
    ownerDni: "081-190392-0001M",
    ownerEmail: "amorales@negocios.com",
    ownerAddress: "Colonial Los Robles, Calle Principal #18",
    createdAt: "2025-01-15",
    lastVisitDate: "2026-10-28",
    status: "active",
    vaccines: [
      {
        id: "vac-4",
        name: "Triple Felina (FVRCP)",
        applicationDate: "2026-03-12",
        nextDueDate: "2027-03-12",
        batchNumber: "FEL-9002",
        veterinarian: "Dra. Lucía Mendoza",
        status: "applied",
      },
      {
        id: "vac-5",
        name: "Antirrábica Felina",
        applicationDate: "2026-03-12",
        nextDueDate: "2027-03-12",
        batchNumber: "RAB-7721",
        veterinarian: "Dra. Lucía Mendoza",
        status: "applied",
      },
    ],
    dewormings: [
      {
        id: "dew-2",
        productName: "Revolution Plus Gatos 2.5 - 5kg",
        type: "both",
        applicationDate: "2026-10-01",
        nextDueDate: "2026-11-01",
        dose: "1 Pipeta tópica",
        status: "overdue",
      },
    ],
    consultations: [
      {
        id: "cons-2",
        date: "2026-10-28",
        reason: "Vacunación preventiva y pesaje de control",
        anamnesis: "Paciente en excelente estado general, alimentación con pienso Pro Plan Gato Esterilizado.",
        vitals: {
          weightKg: 4.1,
          temperatureC: 38.3,
          heartRateBpm: 140,
          respiratoryRateRpm: 28,
          bodyCondition: "3_ideal",
        },
        diagnosis: "Paciente felino sano para plan profiláctico.",
        treatment: "Se aplica pipeta desparasitante y suplemento de malta para bolas de pelo.",
        prescription: "Pasta de malta Catlax 50g • Alimento Pro Plan Esterilizado 3Kg",
        veterinarianName: "Dra. Lucía Mendoza",
        cost: 380.0,
      },
    ],
  },
  {
    id: "vet-3",
    name: "Rocky",
    species: "canino",
    breed: "Pastor Alemán",
    sex: "macho",
    ageYears: 5,
    ageMonths: 2,
    birthDate: "2021-09-10",
    weightKg: 34.8,
    color: "Negro y Fuego",
    microchip: "MC-981098442-NI",
    reproductiveStatus: "entero",
    ownerName: "Ing. Carlos Alberto Ruiz",
    ownerPhone: "+505 8765-1122",
    ownerDni: "081-050478-0002A",
    ownerAddress: "Finca Las Delicias, Km 130",
    createdAt: "2023-04-12",
    lastVisitDate: "2026-11-02",
    status: "in_treatment",
    vaccines: [
      {
        id: "vac-6",
        name: "Antirrábica",
        applicationDate: "2026-04-10",
        nextDueDate: "2027-04-10",
        veterinarian: "Dr. Carlos Pineda",
        status: "applied",
      },
    ],
    dewormings: [
      {
        id: "dew-3",
        productName: "Bravecto 20-40kg",
        type: "external",
        applicationDate: "2026-09-01",
        nextDueDate: "2026-12-01",
        dose: "1 Tableta masticable (3 meses)",
        status: "applied",
      },
    ],
    consultations: [
      {
        id: "cons-3",
        date: "2026-11-02",
        reason: "Claudicación intermitente en miembro posterior derecho",
        anamnesis: "Presenta dificultad para levantarse por las mañanas tras ejercicio moderado en la finca.",
        vitals: {
          weightKg: 34.8,
          temperatureC: 38.5,
          heartRateBpm: 96,
          bodyCondition: "4_sobrepeso",
        },
        diagnosis: "Sospecha de displasia coxofemoral leve con artrosis incipiente.",
        treatment: "Antiinflamatorio Rimadyl 100mg por 5 días y condroprotector Condrovet Force HA diario.",
        prescription: "Rimadyl 100mg (10 tabs) • Condrovet Force HA 120 comprimidos",
        veterinarianName: "Dr. Carlos Pineda",
        cost: 650.0,
        notes: "Se aconseja plan de reducción de peso a 32kg para aliviar articulaciones.",
      },
    ],
  },
];

// Datos iniciales de demostración para Clínica Médica & Odontología
export const INITIAL_CLINICAL_PATIENTS: ClinicalPatient[] = [
  {
    id: "clin-1",
    fullName: "Dr. Manuel Antonio Ríos",
    dni: "081-140582-0003K",
    birthDate: "1982-05-14",
    age: 44,
    gender: "masculino",
    bloodType: "O+",
    phone: "+505 8820-1199",
    email: "dr.marios@salud.ni",
    address: "Reparto San Carlos, Módulo B-4, Chinandega",
    occupation: "Docente Universitario",
    emergencyContact: {
      name: "Carmen Ríos (Esposa)",
      phone: "+505 8820-1198",
      relation: "Cónyuge",
    },
    insuranceName: "Seguro Militar / Banpro Salud",
    allergies: ["Penicilina", "Amoxicilina"],
    pathologies: ["Hipertensión arterial leve"],
    currentMedication: "Losartán 50mg (1 tableta cada mañana)",
    surgicalHistory: "Apendicectomía laparoscópica en 2018",
    createdAt: "2024-03-12",
    lastVisitDate: "2026-11-06",
    status: "in_treatment",
    odontogram: (() => {
      const teeth = generateDefaultOdontogram();
      // Modificar algunas piezas para mostrar el odontograma con datos reales
      const t16 = teeth.find((t) => t.toothNumber === 16);
      if (t16) {
        t16.condition = "obturado";
        t16.notes = "Resina compuesta fotocurada 3M";
      }
      const t26 = teeth.find((t) => t.toothNumber === 26);
      if (t26) {
        t26.condition = "caries";
        t26.notes = "Caries oclusal profunda sin compromiso pulpar";
        t26.estimatedCost = 850.0;
      }
      const t46 = teeth.find((t) => t.toothNumber === 46);
      if (t46) {
        t46.condition = "endodoncia";
        t46.notes = "Tratamiento de conductos radiculares finalizado";
      }
      const t47 = teeth.find((t) => t.toothNumber === 47);
      if (t47) {
        t47.condition = "corona";
        t47.notes = "Corona de zirconio colocada en 2025";
      }
      return teeth;
    })(),
    consultations: [
      {
        id: "clin-cons-1",
        date: "2026-11-06",
        specialty: "odontologia",
        reason: "Sensibilidad dental al frío en molar superior izquierdo",
        vitals: {
          bloodPressure: "125/82",
          heartRate: 74,
          temperature: 36.6,
          oxygenSat: 98,
        },
        symptoms: "Dolor transitorio con bebidas frías en cuadrante 2.",
        diagnosis: "Caries dentinaria activa en pieza 26 (Primer molar sup. izq.)",
        procedureDone: "Limpieza cavitaria y colocación de base de ionómero de vidrio provisorio.",
        treatment: "Obturación definitiva con resina estética programada para próxima cita.",
        prescription: "Ibuprofeno 400mg si hay dolor post-operatorio (1 tab c/8h por 2 días). Enjuague con clorhexidina 0.12%.",
        doctorName: "Dra. Patricia Somarriba (Cirujana Dentista)",
        cost: 650.0,
        nextAppointmentDate: "2026-11-14",
        teethInvolved: [26],
      },
      {
        id: "clin-cons-0",
        date: "2026-08-15",
        specialty: "odontologia",
        reason: "Profilaxis y destartraje ultrasónico semestral",
        diagnosis: "Gingivitis marginal inducida por biopelícula",
        treatment: "Profilaxis completa, pulido coronario con pasta abrasiva y flúor tópico.",
        doctorName: "Dra. Patricia Somarriba",
        cost: 500.0,
      },
    ],
  },
  {
    id: "clin-2",
    fullName: "Lic. Sofía Montenegro",
    dni: "081-220895-0001B",
    birthDate: "1995-08-22",
    age: 31,
    gender: "femenino",
    bloodType: "A+",
    phone: "+505 8433-2211",
    email: "sofia.montenegro@studio.ni",
    address: "Condominio Santa Fe, Casa #12",
    occupation: "Arquitecta de Interiores",
    emergencyContact: {
      name: "Mauricio Montenegro (Padre)",
      phone: "+505 8433-2200",
      relation: "Padre",
    },
    allergies: [],
    pathologies: [],
    createdAt: "2025-06-20",
    lastVisitDate: "2026-10-30",
    status: "active",
    odontogram: (() => {
      const teeth = generateDefaultOdontogram();
      // Terceros molares ausentes
      [18, 28, 38, 48].forEach((num) => {
        const t = teeth.find((item) => item.toothNumber === num);
        if (t) {
          t.condition = "ausente";
          t.notes = "Exodoncia preventiva de cordales";
        }
      });
      return teeth;
    })(),
    consultations: [
      {
        id: "clin-cons-2",
        date: "2026-10-30",
        specialty: "odontologia",
        reason: "Consulta estética para blanqueamiento dental en consultorio",
        diagnosis: "Pigmentación extrínseca leve en esmalte",
        treatment: "Sesión 1 de blanqueamiento con peróxido de hidrógeno al 35% con luz LED.",
        prescription: "Pasta desensibilizante Sensodyne Repair & Protect por 14 días.",
        doctorName: "Dr. Roberto Alvarado",
        cost: 1800.0,
        nextAppointmentDate: "2026-11-20",
      },
    ],
  },
  {
    id: "clin-3",
    fullName: "Don Joaquín Centeno",
    dni: "081-030266-0002F",
    birthDate: "1966-02-03",
    age: 60,
    gender: "masculino",
    bloodType: "B+",
    phone: "+505 8911-3344",
    address: "Comarca Las Tejas, Finca Los Almendros",
    occupation: "Agricultor",
    emergencyContact: {
      name: "Teresa Centeno",
      phone: "+505 8911-3345",
      relation: "Hija",
    },
    allergies: ["Sulfamidas"],
    pathologies: ["Diabetes Mellitus Tipo 2"],
    currentMedication: "Metformina 850mg (1 tableta con la cena)",
    createdAt: "2024-11-18",
    lastVisitDate: "2026-10-14",
    status: "active",
    odontogram: (() => {
      const teeth = generateDefaultOdontogram();
      const t36 = teeth.find((t) => t.toothNumber === 36);
      if (t36) {
        t36.condition = "ausente";
        t36.notes = "Pérdida por caries hace 5 años";
      }
      const t37 = teeth.find((t) => t.toothNumber === 37);
      if (t37) {
        t37.condition = "extraccion_indicada";
        t37.notes = "Resto radicular no rehabilitable";
        t37.estimatedCost = 500.0;
      }
      const t46 = teeth.find((t) => t.toothNumber === 46);
      if (t46) {
        t46.condition = "implante";
        t46.notes = "Implante oseointegrado Straumann con corona";
      }
      return teeth;
    })(),
    consultations: [
      {
        id: "clin-cons-3",
        date: "2026-10-14",
        specialty: "odontologia",
        reason: "Evaluación para rehabilitación sobre implantes cuadrante 3",
        vitals: {
          bloodPressure: "130/85",
          heartRate: 70,
          temperature: 36.5,
        },
        diagnosis: "Edentulismo parcial inferior. Resto radicular en pieza 37.",
        treatment: "Se solicita ortopantomografía digital para evaluar reborde óseo.",
        doctorName: "Dr. Roberto Alvarado",
        cost: 400.0,
      },
    ],
  },
];
