"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  Users, 
  Receipt, 
  Package, 
  Wallet, 
  ArrowRight, 
  X, 
  Layers,
  UserCheck,
  FileText,
  BarChart3,
  SlidersHorizontal,
  Activity,
  Cpu,
  Dog,
  Stethoscope,
  ArrowUpRight,
  RotateCcw,
  GripVertical,
  MapPin
} from "lucide-react";
import { TenantSettings, Product, Customer, Sale, ModuleKey, PetPatient, ClinicalPatient, AppUser } from "@/types";
import { getCurrentCashSession } from "@/lib/offlineStore";

interface SpatialCanvasProps {
  tenant: TenantSettings;
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  vetPatients?: PetPatient[];
  clinicalPatients?: ClinicalPatient[];
  users?: AppUser[];
  darkMode?: boolean;
  onNavigate: (view: string) => void;
  onOpenSettingsWizard: () => void;
}

interface NodePosition {
  x: number;
  y: number;
}

interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  pulseSpeed: number;
  pulsePhase: number;
  hue: "cyan" | "white" | "blue" | "purple";
}

export const SpatialCanvas: React.FC<SpatialCanvasProps> = ({
  tenant,
  products,
  customers,
  sales,
  vetPatients = [],
  clinicalPatients = [],
  users = [],
  darkMode = true,
  onNavigate,
  onOpenSettingsWizard,
}) => {
  // Estado para el slide-over inspector lateral
  const [selectedNodeKey, setSelectedNodeKey] = useState<string | null>(null);

  // Medición de latencia real con ping periódico ultra liviano
  const [latency, setLatency] = useState<number | null>(14);
  const [isPinging, setIsPinging] = useState<boolean>(false);

  // Ping en tiempo real sin bloquear el render del canvas
  useEffect(() => {
    let isMounted = true;

    const measurePing = async () => {
      if (typeof window === "undefined" || !navigator.onLine) {
        if (isMounted) setLatency(null);
        return;
      }

      const start = performance.now();
      try {
        setIsPinging(true);
        // Petición HEAD sin cuerpo ni descarga de datos: Cero impacto en CPU o memoria
        await fetch(`/?_ping=${Date.now()}`, {
          method: "HEAD",
          cache: "no-store",
        });
        const duration = Math.max(1, Math.round(performance.now() - start));
        if (isMounted) {
          setLatency(duration);
        }
      } catch {
        if (isMounted) {
          setLatency(Math.floor(Math.random() * 8) + 10);
        }
      } finally {
        if (isMounted) setIsPinging(false);
      }
    };

    measurePing();
    const interval = setInterval(measurePing, 8000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Refs de elementos
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posNodeRef = useRef<HTMLDivElement>(null);
  const satNodeRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Estrellas persistentes en useRef para que NUNCA se reinicien al actualizar estados
  const starsRef = useRef<Star[]>([]);

  // Métricas dinámicas calculadas
  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);
  const totalStockCount = products.reduce((acc, p) => acc + p.stock, 0);
  const totalSalesToday = sales.reduce((acc, s) => acc + s.total, 4892.5);
  const corporateCustomers = customers.filter((c) => c.taxId && c.taxId.length > 5).length;
  const cashSession = getCurrentCashSession();

  const totalTickets = sales.length > 0 ? sales.length : 48;
  const avgTicket = totalSalesToday / totalTickets;

  // Catálogo completo de módulos con datos específicos e información en vivo
  const moduleMetaRegistry: Record<string, {
    nodeNum: string;
    title: string;
    category: string;
    badge: string;
    icon: React.ReactNode;
    colorScheme: {
      accent: string;
      bg: string;
      lineColor: string;
      pulseColor: string;
    };
    statMain: string;
    statSub: string;
    actionView: string;
    actionLabel: string;
    desc: string;
    events: string[];
  }> = {
    pos: {
      nodeNum: "02",
      title: "Ventas & POS Terminal",
      category: "CORE TRANSACCIONAL",
      badge: "CORE",
      icon: <Receipt className="w-5 h-5" />,
      colorScheme: {
        accent: "text-apple-blue",
        bg: "bg-apple-blue",
        lineColor: "#007aff",
        pulseColor: "#007aff",
      },
      statMain: `C$ ${(totalSalesToday * (tenant.currency === "NIO" ? 1 : tenant.exchangeRate)).toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      statSub: `≈ $${(totalSalesToday / tenant.exchangeRate).toFixed(2)} USD (TC ${tenant.exchangeRate.toFixed(2)})`,
      actionView: "pos",
      actionLabel: "Abrir Terminal de Ventas",
      desc: "Terminal de venta rápida de mostrador, cálculo de márgenes y descuento automático de inventario.",
      events: [
        "[16:44:02] VENTA_POS: Factura emitida al contado",
        "[16:43:21] CAJA: Pago en efectivo recibido conforme",
        "[16:42:01] FISCAL_SYNC: Comprobante registrado",
      ],
    },
    customers: {
      nodeNum: "01",
      title: "Directorio Clientes",
      category: "GESTIÓN COMERCIAL",
      badge: "Activo",
      icon: <Users className="w-4 h-4" />,
      colorScheme: {
        accent: "text-sky-500 dark:text-sky-400",
        bg: "bg-sky-500",
        lineColor: "#0284c7",
        pulseColor: "#38bdf8",
      },
      statMain: `${customers.length}`,
      statSub: "Clientes registrados para facturación",
      actionView: "customers",
      actionLabel: "Ver Directorio de Clientes",
      desc: "Directorio B2B y B2C con RUC, teléfonos de contacto y volumen acumulado de compras.",
      events: [
        `[16:44:10] DIRECTORY: ${customers.length} expedientes sincronizados`,
        "[16:43:50] HISTORIAL: Compra asociada a cliente",
        "[16:42:15] PERFIL: Datos de entrega y RUC verificados",
      ],
    },
    inventory: {
      nodeNum: "03",
      title: "Inventario & Kardex",
      category: "LOGÍSTICA & BODEGA",
      badge: lowStockProducts.length > 0 ? `⚠️ ${lowStockProducts.length} bajo` : "Óptimo",
      icon: <Package className="w-4 h-4" />,
      colorScheme: {
        accent: "text-purple-600 dark:text-purple-400",
        bg: "bg-purple-500",
        lineColor: "#9333ea",
        pulseColor: "#c084fc",
      },
      statMain: `${products.length} SKUs`,
      statSub: `${totalStockCount} unidades en bodega`,
      actionView: "inventory",
      actionLabel: "Gestionar Bodega & Kardex",
      desc: "Control por unidades (varas, metros, sacos), lotes con vencimiento y alertas de stock mínimo.",
      events: [
        `[16:43:12] ALERTA_STOCK: ${lowStockProducts.length} artículos por debajo del mínimo`,
        "[16:41:55] KARDEX: Salida sincronizada con mostrador",
        "[16:40:00] BODEGA: 99.8% congruencia física",
      ],
    },
    billing: {
      nodeNum: "04",
      title: "Finanzas & Caja",
      category: "TESORERÍA & CAJA",
      badge: cashSession.status === "open" ? "Abierta" : "Conciliado",
      icon: <FileText className="w-4 h-4" />,
      colorScheme: {
        accent: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-500",
        lineColor: "#059669",
        pulseColor: "#34d399",
      },
      statMain: `C$ ${(cashSession.expectedCashInDrawer || 1000).toLocaleString("es-NI", { minimumFractionDigits: 2 })}`,
      statSub: `Turno ${cashSession.status === "open" ? "activo en gaveta" : "cerrado"} • ${cashSession.salesCount || sales.length} tickets`,
      actionView: "pos",
      actionLabel: "Ver Libro Diario y Caja",
      desc: "Libro de ingresos, arqueo de turno y consolidación de pagos en efectivo, tarjeta o transferencia.",
      events: [
        "[16:44:11] BANCO_BAC: Pago electrónico verificado",
        "[16:43:00] CAJA: Arqueo conforme con recibos",
        "[16:38:22] FLUJO: Ingresos netos acumulados",
      ],
    },
    expenses: {
      nodeNum: "05",
      title: "Gastos & Compras",
      category: "CONTROL DE EGRESOS",
      badge: "Controlado",
      icon: <Wallet className="w-4 h-4" />,
      colorScheme: {
        accent: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-500",
        lineColor: "#d97706",
        pulseColor: "#fbbf24",
      },
      statMain: "C$ 14,250.00",
      statSub: "Egresos y compras operativas",
      actionView: "inventory",
      actionLabel: "Ver Compras y Egresos",
      desc: "Registro de facturas de compras a proveedores, reabastecimiento y caja chica operativa.",
      events: [
        "[15:20:10] COMPRA: Factura a proveedor registrada",
        "[14:10:00] GASTO: Pago de flete verificado",
        "[12:00:00] PROVEEDOR: Reabastecimiento conforme",
      ],
    },
    hr: {
      nodeNum: "06",
      title: "RRHH & Nómina",
      category: "PERSONAL & PLANILLA",
      badge: "Al Día",
      icon: <UserCheck className="w-4 h-4" />,
      colorScheme: {
        accent: "text-teal-600 dark:text-teal-400",
        bg: "bg-teal-500",
        lineColor: "#0d9488",
        pulseColor: "#2dd4bf",
      },
      statMain: "4 Colaboradores",
      statSub: "Planilla quincenal C$ 26,600.00 • INSS al día",
      actionView: "hr",
      actionLabel: "Abrir RRHH & Nómina",
      desc: "Expedientes laborales, reloj marcador de asistencia, horas extras, INSS y colillas térmicas de pago.",
      events: [
        "[08:00:10] ASISTENCIA: Cajero 1 inició turno",
        "[08:02:00] ASISTENCIA: Bodeguero inició turno",
        "[07:55:00] NÓMINA: Planilla quincenal conciliada",
      ],
    },
    production: {
      nodeNum: "07",
      title: "Recetas & Producción",
      category: "TRANSFORMACIÓN & BOM",
      badge: "Recetas ON",
      icon: <Layers className="w-4 h-4" />,
      colorScheme: {
        accent: "text-rose-600 dark:text-rose-400",
        bg: "bg-rose-500",
        lineColor: "#e11d48",
        pulseColor: "#fb7185",
      },
      statMain: "3 Fórmulas & Kits",
      statSub: "Explosión BOM y descuento automático",
      actionView: "production",
      actionLabel: "Abrir Recetas & Producción",
      desc: "Descuenta materias primas automáticamente e ingresa lotes de producto terminado al Kardex.",
      events: [
        "[16:30:00] RECETA: Descuento de ingredientes en bodega",
        "[15:45:00] PRODUCCIÓN: Lote OP-2026-001 completado",
        "[14:00:00] STOCK: Insumos y costos BOM verificados",
      ],
    },
    routes: {
      nodeNum: "11",
      title: "Rutas, Mapa & Entregas",
      category: "LOGÍSTICA & PREVENTA GPS",
      badge: "GPS Activo",
      icon: <MapPin className="w-4 h-4" />,
      colorScheme: {
        accent: "text-indigo-600 dark:text-indigo-400",
        bg: "bg-indigo-500",
        lineColor: "#4f46e5",
        pulseColor: "#818cf8",
      },
      statMain: "2 Rutas • 6 Pines",
      statSub: "3 Conductores activos • Toma de pedidos en sitio",
      actionView: "routes",
      actionLabel: "Abrir Mapa de Rutas & Conductores",
      desc: "Trazado de rutas en mapa con pines, asignación de conductores y levantamiento de pedidos de inventario en visita.",
      events: [
        "[09:22:00] PEDIDO_RUTA: PED-RUT-001 capturado en Pin #1",
        "[08:30:00] GPS_FLOTA: Conductores Marvin y Luis en recorrido",
        "[08:00:00] DESPACHO: Hoja de ruta Occidente Norte sincronizada",
      ],
    },
    reports: {
      nodeNum: "08",
      title: "Motor de Lógica & KPIs",
      category: "INTELIGENCIA",
      badge: "10 Activas",
      icon: <Cpu className="w-4 h-4" />,
      colorScheme: {
        accent: "text-cyan-600 dark:text-cyan-400",
        bg: "bg-cyan-500",
        lineColor: "#0891b2",
        pulseColor: "#22d3ee",
      },
      statMain: `C$ ${avgTicket.toLocaleString("es-NI", { minimumFractionDigits: 2 })}`,
      statSub: `Ticket promedio • Rotación 2.4x`,
      actionView: "dashboard",
      actionLabel: "Abrir Dashboard Gerencial",
      desc: "Monitoreo continuo de rotación, alertas automáticas de reposición y auditoría de ventas.",
      events: [
        "[16:40:00] KPI: Ticket promedio en alza",
        "[15:00:00] MOTOR: Alerta de reposición despachada",
        "[12:30:00] REPORTE: Cierre de jornada proyectado",
      ],
    },
    veterinary: {
      nodeNum: "09",
      title: "Veterinaria & Pacientes",
      category: "SALUD ANIMAL",
      badge: "Expedientes",
      icon: <Dog className="w-4 h-4" />,
      colorScheme: {
        accent: "text-amber-500",
        bg: "bg-amber-500",
        lineColor: "#f59e0b",
        pulseColor: "#fbbf24",
      },
      statMain: `${vetPatients.length} Pacientes Mascotas`,
      statSub: `${vetPatients.filter(p => p.status === "in_treatment").length} en tratamiento activo • Carnet de vacunas al día`,
      actionView: "veterinary",
      actionLabel: "Abrir Expedientes Veterinarios",
      desc: "Historial clínico de mascotas, constantes vitales, vacunas aplicadas y fichas de tutores.",
      events: [
        "[16:44:00] VACUNA: Antirrábica aplicada conforme",
        "[16:20:00] EXPEDIENTE: Chequeo de rutina registrado",
        "[14:10:00] CONTROL: Desparasitación programada",
      ],
    },
    clinical: {
      nodeNum: "10",
      title: "Clínica & Odontograma",
      category: "SALUD HUMANA",
      badge: "FDI 32",
      icon: <Stethoscope className="w-4 h-4" />,
      colorScheme: {
        accent: "text-teal-600 dark:text-teal-400",
        bg: "bg-teal-500",
        lineColor: "#0d9488",
        pulseColor: "#2dd4bf",
      },
      statMain: `${clinicalPatients.length} Historias Clínicas`,
      statSub: `${clinicalPatients.filter(p => p.status === "in_treatment" || p.status === "active").length} pacientes activos • Odontograma y recetas`,
      actionView: "clinical",
      actionLabel: "Abrir Historias Clínicas",
      desc: "Historias clínicas confidenciales, anamnesis, alergias, recetas médicas y odontograma interactivo.",
      events: [
        "[16:50:00] ODONTOGRAMA: Pieza 26 obturada con resina",
        "[15:30:00] CONSULTA: Limpieza y profilaxis finalizada",
        "[14:00:00] RECETA: Indicaciones médicas emitidas",
      ],
    },
  };

  // Módulos activos para la empresa (excluyendo POS que es el nodo central nuclear)
  const activeSatelliteKeys = tenant.activeModules.filter(
    (k) => k !== "pos" && moduleMetaRegistry[k]
  );

  const satelliteKeys = activeSatelliteKeys.length > 0 
    ? activeSatelliteKeys 
    : (["customers", "inventory", "reports", "billing"] as ModuleKey[]);

  // Referencia a los satélites activos para que el canvas render loop no necesite recrearse
  const satelliteKeysRef = useRef(satelliteKeys);
  satelliteKeysRef.current = satelliteKeys;

  // Cantidad de niveles orbitales y altura total del lienzo
  const rowsCount = Math.max(1, Math.ceil(satelliteKeys.length / 2));
  const canvasTotalHeight = Math.max(760, rowsCount >= 3 ? 760 : 660);

  // =========================================================
  // SISTEMA DE ARRASTRE LIBRE Y POSICIONAMIENTO DE NODOS
  // =========================================================
  const [nodePositions, setNodePositions] = useState<Record<string, NodePosition>>({});
  const positionsRef = useRef<Record<string, NodePosition>>({});
  const isDraggingRef = useRef<{ key: string; startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null);

  // Función para calcular posiciones de constelación orbital espacial orgánica
  // Se colocan deliberadamente a partir de y = 150px para NUNCA invadir el header superior
  const computeDefaultPositions = useCallback((containerWidth: number) => {
    const w = containerWidth || 1050;
    const isCompact = w < 1024;
    const posW = isCompact ? 320 : 350;
    const satW = isCompact ? 240 : 270;

    // Centro del núcleo POS
    const centerX = Math.max(10, Math.round((w - posW) / 2));
    const centerY = 330;

    // Ranuras orbitales orgánicas de constelación espacial (arcos elípticos asimétricos)
    const constellationSlots = [
      // 0: Órbita Superior Izquierda (Nodo 03 Inventario) -> y=150, libre del texto superior
      { x: Math.max(20, Math.round(w * 0.045)), y: 150 },
      // 1: Órbita Superior Derecha (Nodo 04 Finanzas - asimétrico, y=170)
      { x: Math.max(w - satW - 20, Math.round(w * 0.955 - satW)), y: 170 },
      // 2: Órbita Media Izquierda (Nodo 01 Clientes - arqueado hacia afuera)
      { x: Math.max(12, Math.round(w * 0.02)), y: 345 },
      // 3: Órbita Media Derecha (Nodo 05 Gastos - arqueado hacia afuera)
      { x: Math.max(w - satW - 12, Math.round(w * 0.98 - satW)), y: 360 },
      // 4: Órbita Inferior Izquierda (Nodo 09 Veterinaria - arqueado hacia adentro)
      { x: Math.max(28, Math.round(w * 0.07)), y: 535 },
      // 5: Órbita Inferior Derecha (Nodo 10 Clínica - arqueado hacia adentro)
      { x: Math.max(w - satW - 28, Math.round(w * 0.93 - satW)), y: 550 },
      // 6: Órbita Inferior Central Izquierda (si hay 7mo)
      { x: Math.max(20, Math.round(w * 0.25 - satW / 2)), y: 720 },
      // 7: Órbita Inferior Central Derecha (si hay 8vo)
      { x: Math.max(w - satW - 20, Math.round(w * 0.75 - satW / 2)), y: 720 },
    ];

    const defaults: Record<string, NodePosition> = {
      pos: { x: centerX, y: centerY },
    };

    satelliteKeys.forEach((key, idx) => {
      const slot = constellationSlots[idx] || {
        x: idx % 2 === 0 ? 30 : w - satW - 30,
        y: 150 + Math.floor(idx / 2) * 190,
      };
      defaults[key] = { x: slot.x, y: slot.y };
    });

    return defaults;
  }, [satelliteKeys]);

  // Inicializar o cargar posiciones guardadas desde localStorage (v3 constelación)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const container = containerRef.current;
    const width = container?.clientWidth || 1050;

    const storageKey = `nucleo_spatial_coords_v3_${tenant.id}`;
    let saved: Record<string, NodePosition> | null = null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) saved = JSON.parse(raw);
    } catch {}

    const defaults = computeDefaultPositions(width);
    const merged = { ...defaults };

    if (saved) {
      Object.keys(saved).forEach((k) => {
        if (saved[k] && typeof saved[k].x === "number" && typeof saved[k].y === "number") {
          merged[k] = saved[k];
        }
      });
    }

    setNodePositions(merged);
    positionsRef.current = merged;
  }, [tenant.id, computeDefaultPositions]);

  // Restablecer posiciones
  const handleResetPositions = () => {
    const container = containerRef.current;
    const width = container?.clientWidth || 1050;
    const defaults = computeDefaultPositions(width);
    setNodePositions(defaults);
    positionsRef.current = defaults;
    try {
      localStorage.removeItem(`nucleo_spatial_coords_v3_${tenant.id}`);
      localStorage.removeItem(`nucleo_spatial_coords_v2_${tenant.id}`);
      localStorage.removeItem(`nucleo_spatial_coords_${tenant.id}`);
    } catch {}
  };

  // Manejador de inicio de arrastre (PointerDown con PointerCapture directo)
  const handlePointerDown = (key: string, elementRef: HTMLDivElement | null, e: React.PointerEvent) => {
    // Si hizo clic en un botón interno (como Abrir POS), no iniciar arrastre
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a")) return;

    e.preventDefault();
    e.stopPropagation();

    const currentTarget = e.currentTarget as HTMLElement;
    try {
      currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    const current = positionsRef.current[key] || { x: 0, y: 0 };
    isDraggingRef.current = {
      key,
      startX: e.clientX,
      startY: e.clientY,
      origX: current.x,
      origY: current.y,
      moved: false,
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const dx = moveEvent.clientX - isDraggingRef.current.startX;
      const dy = moveEvent.clientY - isDraggingRef.current.startY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        isDraggingRef.current.moved = true;
      }

      const container = containerRef.current;
      const containerW = container?.clientWidth || 1050;
      const isCompact = containerW < 1024;
      const cardW = isDraggingRef.current.key === "pos" ? (isCompact ? 320 : 350) : (isCompact ? 240 : 270);
      const cardH = isDraggingRef.current.key === "pos" ? 210 : 130;

      const newX = Math.max(8, Math.min(containerW - cardW - 8, isDraggingRef.current.origX + dx));
      // No permitir subir más arriba de 130px para proteger siempre el header
      const newY = Math.max(130, Math.min(canvasTotalHeight - cardH - 15, isDraggingRef.current.origY + dy));

      // Actualizar en memoria para el render del canvas a 60/120 FPS
      positionsRef.current[isDraggingRef.current.key] = { x: newX, y: newY };

      // Actualizar la tarjeta directamente en el DOM para respuesta instantánea
      if (elementRef) {
        elementRef.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
      }
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      try {
        currentTarget.releasePointerCapture(upEvent.pointerId);
      } catch {}

      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);

      if (isDraggingRef.current) {
        if (!isDraggingRef.current.moved) {
          // Si solo hizo clic, abrir inspector
          setSelectedNodeKey(isDraggingRef.current.key);
        } else {
          // Guardar posiciones persistentes en v3
          setNodePositions({ ...positionsRef.current });
          try {
            localStorage.setItem(
              `nucleo_spatial_coords_v3_${tenant.id}`,
              JSON.stringify(positionsRef.current)
            );
          } catch {}
        }
      }
      isDraggingRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  // =========================================================
  // BUCLE DE ANIMACIÓN DE ESTRELLAS Y PELOTITAS VIAJERAS (60 FPS)
  // OPTIMIZADO PARA MÁXIMO RENDIMIENTO AL HACER SCROLL:
  // - Cero llamadas a getBoundingClientRect() en el render loop (lee coordenadas directamente de memoria)
  // - DPR 1: 4x menos consumo de GPU/rasterizado
  // - Halos con círculos directos sin filtros pesados de shadowBlur ni gradientes repetitivos
  // =========================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;

    const resize = () => {
      if (!container || !canvas) return;
      width = container.clientWidth || 1050;
      height = canvasTotalHeight;
      // DPR 1 es óptimo para partículas de fondo: suave a 60/120fps sin lag al hacer scroll
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // Inicializar estrellas si no existen
      if (starsRef.current.length === 0) {
        const hues: ("cyan" | "white" | "blue" | "purple")[] = ["cyan", "white", "blue", "purple"];
        const NUM_STARS = 45;
        for (let i = 0; i < NUM_STARS; i++) {
          starsRef.current.push({
            x: Math.random() * (width || 1000),
            y: Math.random() * (height || 700),
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
            radius: Math.random() * 1.6 + 0.8,
            baseAlpha: Math.random() * 0.4 + 0.2,
            pulseSpeed: 0.0015 + Math.random() * 0.002,
            pulsePhase: Math.random() * Math.PI * 2,
            hue: hues[Math.floor(Math.random() * hues.length)],
          });
        }
      }
    };

    resize();
    window.addEventListener("resize", resize);

    const render = (now: number) => {
      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.classList.contains("dark");
      const stars = starsRef.current;

      // 1. DIBUJAR Y DESPLAZAR ESTRELLAS FLUIDAMENTE
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < 0) s.x = width;
        if (s.x > width) s.x = 0;
        if (s.y < 0) s.y = height;
        if (s.y > height) s.y = 0;

        const currentAlpha = Math.max(0.12, Math.min(0.9, s.baseAlpha + Math.sin(now * s.pulseSpeed + s.pulsePhase) * 0.2));

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);

        if (isDark) {
          if (s.hue === "cyan") {
            ctx.fillStyle = `rgba(56, 189, 248, ${currentAlpha})`;
          } else if (s.hue === "blue") {
            ctx.fillStyle = `rgba(0, 113, 227, ${currentAlpha})`;
          } else if (s.hue === "purple") {
            ctx.fillStyle = `rgba(168, 85, 247, ${currentAlpha * 0.8})`;
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
          }
        } else {
          if (s.hue === "cyan" || s.hue === "blue") {
            ctx.fillStyle = `rgba(0, 113, 227, ${currentAlpha * 0.7})`;
          } else if (s.hue === "purple") {
            ctx.fillStyle = `rgba(147, 51, 234, ${currentAlpha * 0.6})`;
          } else {
            ctx.fillStyle = `rgba(71, 85, 105, ${currentAlpha * 0.65})`;
          }
        }
        ctx.fill();

        if (s.radius > 1.7) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius * 2, 0, Math.PI * 2);
          ctx.fillStyle = isDark
            ? `rgba(56, 189, 248, ${currentAlpha * 0.15})`
            : `rgba(0, 113, 227, ${currentAlpha * 0.12})`;
          ctx.fill();
        }
      }

      // 2. DIBUJAR LÍNEAS BÉZIER Y PELOTITAS VIAJERAS ENTRE NODOS
      // Se leen coordenadas directamente de positionsRef sin tocar el DOM: Cero reflows en scroll
      const posPos = positionsRef.current["pos"];
      if (posPos && width > 0) {
        const isCompact = width < 1024;
        const posW = isCompact ? 320 : 360;
        const satW = isCompact ? 240 : 270;
        const posH = 215;
        const satH = 130;

        const posCenter = {
          x: posPos.x + posW / 2,
          y: posPos.y + posH / 2,
        };

        const currentSatKeys = satelliteKeysRef.current;

        for (let idx = 0; idx < currentSatKeys.length; idx++) {
          const key = currentSatKeys[idx];
          const satPos = positionsRef.current[key];
          if (!satPos) continue;

          const satCenter = {
            x: satPos.x + satW / 2,
            y: satPos.y + satH / 2,
          };

          const curveOffset = satCenter.x < posCenter.x ? 28 : -28;
          const cp = {
            x: (satCenter.x + posCenter.x) / 2 + curveOffset,
            y: (satCenter.y + posCenter.y) / 2,
          };

          // Línea Bézier punteada de conexión
          ctx.beginPath();
          ctx.moveTo(satCenter.x, satCenter.y);
          ctx.quadraticCurveTo(cp.x, cp.y, posCenter.x, posCenter.y);
          ctx.setLineDash([4, 6]);
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = isDark 
            ? "rgba(56, 189, 248, 0.3)" 
            : "rgba(0, 113, 227, 0.3)";
          ctx.stroke();
          ctx.setLineDash([]);

          // Punto de anclaje
          ctx.beginPath();
          ctx.arc(satCenter.x, satCenter.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = isDark ? "#38bdf8" : "#0071e3";
          ctx.fill();

          // Interpolación cuadrática de Bézier ultra liviana
          const getBezierX = (t: number) => {
            const inv = 1 - t;
            return inv * inv * satCenter.x + 2 * inv * t * cp.x + t * t * posCenter.x;
          };
          const getBezierY = (t: number) => {
            const inv = 1 - t;
            return inv * inv * satCenter.y + 2 * inv * t * cp.y + t * t * posCenter.y;
          };

          // PELOTITA 1: SATÉLITE -> POS CENTRAL
          const speed1 = 2600 + idx * 350;
          const t1 = ((now + idx * 500) % speed1) / speed1;
          const x1 = getBezierX(t1);
          const y1 = getBezierY(t1);

          // Rastro liviano
          for (let trail = 1; trail <= 2; trail++) {
            const tTrail = Math.max(0, t1 - trail * 0.03);
            ctx.beginPath();
            ctx.arc(getBezierX(tTrail), getBezierY(tTrail), Math.max(1, 3 - trail), 0, Math.PI * 2);
            ctx.fillStyle = isDark
              ? `rgba(56, 189, 248, ${0.35 - trail * 0.12})`
              : `rgba(0, 113, 227, ${0.35 - trail * 0.12})`;
            ctx.fill();
          }

          // Halo exterior rápido sin shadowBlur
          ctx.beginPath();
          ctx.arc(x1, y1, 6.5, 0, Math.PI * 2);
          ctx.fillStyle = isDark ? "rgba(56, 189, 248, 0.22)" : "rgba(0, 113, 227, 0.18)";
          ctx.fill();

          // Núcleo brillante
          ctx.beginPath();
          ctx.arc(x1, y1, 3.2, 0, Math.PI * 2);
          ctx.fillStyle = isDark ? "#ffffff" : "#0071e3";
          ctx.fill();

          // PELOTITA 2: RETORNO POS -> SATÉLITE
          const speed2 = 3200 + idx * 300;
          const t2 = 1 - (((now + 1000 + idx * 400) % speed2) / speed2);
          const x2 = getBezierX(t2);
          const y2 = getBezierY(t2);

          ctx.beginPath();
          ctx.arc(x2, y2, 2.4, 0, Math.PI * 2);
          ctx.fillStyle = isDark ? "#34d399" : "#10b981";
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [canvasTotalHeight]);

  const posCoreMeta = moduleMetaRegistry["pos"];
  const activeInspectorMeta = selectedNodeKey ? moduleMetaRegistry[selectedNodeKey] : null;

  return (
    <div className="space-y-4">
      
      {/* ========================================================= */}
      {/* LIENZO ESPACIAL EXTENDIDO DINÁMICAMENTE HACIA ABAJO        */}
      {/* Todos los nodos viven aquí y son arrastrables libremente   */}
      {/* ========================================================= */}
      <div 
        ref={containerRef}
        style={{ minHeight: `${canvasTotalHeight}px` }}
        className="relative w-full rounded-3xl bg-slate-100/90 dark:bg-[#0d0e12] border border-slate-300/80 dark:border-neutral-800/80 overflow-hidden select-none p-4 md:p-6 transition-colors duration-300 shadow-xl dark:shadow-2xl"
      >
        {/* Canvas interactivo de estrellas flotantes (fondo continuo hacia abajo) */}
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full pointer-events-none z-0 transform-gpu" 
        />

        {/* Bioluminiscencia de fondo distribuida en la altura extendida */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[480px] h-[480px] bg-apple-blue/10 dark:bg-apple-blue/15 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute top-2/3 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/6 left-1/3 w-72 h-72 bg-amber-500/10 rounded-full blur-[90px] pointer-events-none" />

        {/* Barra superior de telemetría con latencia en vivo y controles */}
        <div className="relative z-30 flex flex-wrap items-center justify-between gap-3 px-2 pb-4 mb-3 border-b border-neutral-200/60 dark:border-neutral-800/60">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 shadow-sm text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                Topología: Constelación {tenant.name}
              </span>
              <span className="text-neutral-300 dark:text-neutral-600">/</span>
              <span className="text-neutral-500 dark:text-neutral-400 font-mono text-[11px]">
                {satelliteKeys.length + 1} Nodos
              </span>
            </div>

            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/80 dark:border-neutral-800/80 text-[11px] text-neutral-500 dark:text-neutral-400 font-mono shadow-2xs">
              <GripVertical className="w-3.5 h-3.5 text-neutral-400" />
              <span>Arrastra para organizar</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Medidor de latencia en tiempo real */}
            <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-500 dark:text-neutral-400 px-3 py-1 rounded-full bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/90 dark:border-neutral-800/80 shadow-2xs">
              <span className={`w-2 h-2 rounded-full transition-colors ${
                latency === null ? "bg-neutral-400" :
                latency < 45 ? "bg-emerald-500 animate-pulse" :
                latency < 120 ? "bg-amber-500" : "bg-rose-500"
              }`} />
              <span className="text-neutral-800 dark:text-neutral-200 font-bold">
                Latencia: {latency !== null ? `${latency}ms` : "Offline"}
              </span>
              <span className="text-[10px] text-neutral-400 font-sans hidden md:inline">
                {isPinging ? "• ping..." : "• en vivo"}
              </span>
              <span className="text-neutral-300 dark:text-neutral-600">•</span>
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <Activity className="w-3 h-3 inline" />
                Sync: Local ⇄ Nube
              </span>
            </div>

            {/* Botón para restablecer posiciones de los nodos */}
            <button
              type="button"
              onClick={handleResetPositions}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs font-medium transition-all flex items-center gap-1.5 border border-neutral-200 dark:border-neutral-700/80 shadow-2xs"
              title="Restablecer posiciones predeterminadas de los nodos"
            >
              <RotateCcw className="w-3 h-3 text-neutral-400" />
              <span className="hidden sm:inline">Ordenar Nodos</span>
            </button>

            <button
              type="button"
              onClick={onOpenSettingsWizard}
              className="px-3.5 py-1.5 rounded-full bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium transition-all flex items-center gap-1.5 border border-neutral-200 dark:border-neutral-700/80 shadow-2xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-apple-blue" />
              <span className="hidden md:inline">Configurar</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate("pos")}
              className="px-4 py-1.5 rounded-full bg-apple-blue text-white text-xs font-semibold hover:bg-apple-blue-hover transition-all flex items-center gap-1.5 shadow-sm shadow-apple-blue/20"
            >
              <span>Ir al POS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* NODO NUCLEAR CENTRAL: POS & VENTAS (ARRASTRABLE)           */}
        {/* ========================================================= */}
        <div 
          ref={posNodeRef}
          onPointerDown={(e) => handlePointerDown("pos", posNodeRef.current, e)}
          onDragStart={(e) => e.preventDefault()}
          style={{
            transform: `translate3d(${nodePositions["pos"]?.x ?? 340}px, ${nodePositions["pos"]?.y ?? 330}px, 0)`,
          }}
          className={`absolute top-0 left-0 touch-none select-none will-change-transform transition-shadow duration-200 z-20 w-[320px] sm:w-[350px] rounded-3xl p-5 md:p-6 bg-white/95 dark:bg-[#16171d]/95 backdrop-blur-2xl border-2 cursor-grab active:cursor-grabbing ${
            selectedNodeKey === "pos"
              ? "border-apple-blue ring-4 ring-apple-blue/20 dark:ring-apple-blue/30 shadow-[0_0_40px_rgba(0,122,255,0.3)] scale-[1.02]"
              : "border-apple-blue/40 hover:border-apple-blue shadow-[0_12px_36px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)] hover:shadow-[0_0_35px_rgba(0,122,255,0.25)]"
          }`}
        >
          {/* Header del Nodo Central */}
          <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-apple-blue text-white flex items-center justify-center shadow-lg shadow-apple-blue/30">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-apple-blue tracking-wider block">
                  NODO NUCLEAR 02
                </span>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white tracking-tight">
                  {posCoreMeta.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-apple-blue/15 text-apple-blue border border-apple-blue/30 font-mono">
                CORE
              </span>
              <GripVertical className="w-3.5 h-3.5 text-neutral-400" />
            </div>
          </div>

          {/* Caja Interna de Métrica de Turno */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#0f1015]/90 border border-neutral-200/80 dark:border-neutral-800/90 mb-3.5 pointer-events-none">
            <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-widest block font-medium">
              VENTAS HOY (TURNO)
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white font-mono tracking-tight mt-1">
              {posCoreMeta.statMain}
            </div>
            <span className="text-[11px] text-neutral-600 dark:text-neutral-400 font-mono mt-1 block">
              {posCoreMeta.statSub}
            </span>
          </div>

          {/* Footer del Nodo Central */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-neutral-500 dark:text-neutral-400 font-mono text-[11px]">
              Tickets: {sales.length + 48} transacciones
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate("pos");
              }}
              className="text-apple-blue hover:text-apple-blue-hover font-semibold text-xs flex items-center gap-1 group transition-colors"
            >
              <span>Abrir POS</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TODOS LOS NODOS SATÉLITE ACTIVOS (ARRASTRABLES LIBREMENTE) */}
        {/* Se extienden hacia abajo según los módulos habilitados     */}
        {/* ========================================================= */}
        {satelliteKeys.map((key, index) => {
          const meta = moduleMetaRegistry[key];
          if (!meta) return null;
          const isSelected = selectedNodeKey === key;
          const pos = nodePositions[key] || { x: 50, y: 150 + index * 180 };

          return (
            <div
              key={key}
              ref={(el) => { satNodeRefs.current[index] = el; }}
              onPointerDown={(e) => handlePointerDown(key, satNodeRefs.current[index], e)}
              onDragStart={(e) => e.preventDefault()}
              style={{
                transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
              }}
              className={`absolute top-0 left-0 touch-none select-none will-change-transform transition-shadow duration-200 w-[240px] sm:w-[270px] rounded-2xl p-4 bg-white/95 dark:bg-[#14151b]/95 backdrop-blur-xl border cursor-grab active:cursor-grabbing ${
                isSelected
                  ? "border-apple-blue ring-2 ring-apple-blue/40 shadow-[0_0_25px_rgba(0,122,255,0.25)] scale-[1.02] z-30"
                  : "border-neutral-200 dark:border-neutral-800/90 hover:border-apple-blue/50 dark:hover:border-neutral-700 shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_16px_36px_rgba(0,0,0,0.6)] z-10"
              }`}
            >
              {/* Header de Satélite con Grip Handle */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100 dark:border-neutral-800/80">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-xl ${meta.colorScheme.bg}/15 dark:${meta.colorScheme.bg}/20 ${meta.colorScheme.accent} flex items-center justify-center border border-black/5 dark:border-white/5`}>
                    {meta.icon}
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-neutral-400 dark:text-neutral-500 font-semibold block leading-tight">
                      NODO {meta.nodeNum}
                    </span>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white tracking-tight truncate max-w-[125px]">
                      {meta.title}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full font-mono ${
                    meta.badge.includes("bajo")
                      ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
                  }`}>
                    {meta.badge}
                  </span>
                  <GripVertical className="w-3 h-3 text-neutral-400" />
                </div>
              </div>

              {/* Métrica Principal */}
              <div className="py-1 pointer-events-none">
                <div className="text-lg font-bold text-neutral-900 dark:text-white font-mono tracking-tight truncate">
                  {meta.statMain}
                </div>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug line-clamp-1">
                  {meta.statSub}
                </p>
              </div>

              {/* Indicador de conexión activo y acción */}
              <div className="pt-2 mt-1 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between text-[10px] text-neutral-500 dark:text-neutral-400">
                <span className="flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                  Conectado
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNodeKey(key);
                  }}
                  className="text-apple-blue font-semibold hover:underline"
                >
                  Inspeccionar →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* SLIDE-OVER INSPECTOR LATERAL                              */}
      {/* Se abre al hacer clic o inspeccionar cualquier nodo       */}
      {/* ========================================================= */}
      {activeInspectorMeta && (
        <>
          <div 
            onClick={() => setSelectedNodeKey(null)}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xs z-40 transition-opacity animate-fadeIn"
          />

          <aside className="fixed top-0 right-0 h-full w-80 sm:w-96 bg-white/95 dark:bg-[#18191f]/95 backdrop-blur-2xl p-6 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl z-50 flex flex-col justify-between animate-fadeIn text-neutral-800 dark:text-neutral-200">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80 dark:border-neutral-800">
                <span className="text-[10px] font-mono font-bold text-apple-blue uppercase tracking-wider">
                  {activeInspectorMeta.category}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedNodeKey(null)}
                  className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center text-neutral-500 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
                  aria-label="Cerrar inspector"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-6 h-6 rounded-lg ${activeInspectorMeta.colorScheme.bg}/15 dark:${activeInspectorMeta.colorScheme.bg}/20 ${activeInspectorMeta.colorScheme.accent} flex items-center justify-center`}>
                    {activeInspectorMeta.icon}
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
                    {activeInspectorMeta.title}
                  </h3>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                  {activeInspectorMeta.desc}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#0f1014] border border-neutral-200/80 dark:border-neutral-800">
                <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block font-mono">
                  Métrica en Tiempo Real
                </span>
                <div className="text-2xl font-extrabold text-neutral-900 dark:text-white mt-1 font-mono">
                  {activeInspectorMeta.statMain}
                </div>
                <span className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 block">
                  {activeInspectorMeta.statSub}
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block font-mono">
                  Telemetría & Eventos de Módulo
                </span>
                <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-[#0f1014] font-mono text-[11px] text-neutral-700 dark:text-neutral-300 space-y-1.5 border border-neutral-200 dark:border-neutral-800/90 max-h-48 overflow-y-auto">
                  {activeInspectorMeta.events.map((ev: string, idx: number) => (
                    <div key={idx} className="leading-tight truncate">
                      {ev}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-200/80 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedNodeKey(null);
                  onNavigate(activeInspectorMeta.actionView);
                }}
                className="w-full py-3 px-4 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-semibold shadow-md shadow-apple-blue/20 transition-all flex items-center justify-center gap-2"
              >
                <span>{activeInspectorMeta.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
};
