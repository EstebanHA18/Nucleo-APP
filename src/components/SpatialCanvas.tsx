"use client";

import React, { useState, useRef, useEffect } from "react";
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
  Stethoscope
} from "lucide-react";
import { TenantSettings, Product, Customer, Sale, ModuleKey } from "@/types";

interface SpatialCanvasProps {
  tenant: TenantSettings;
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  darkMode?: boolean;
  onNavigate: (view: string) => void;
  onOpenSettingsWizard: () => void;
}

export const SpatialCanvas: React.FC<SpatialCanvasProps> = ({
  tenant,
  products,
  customers,
  sales,
  darkMode = true,
  onNavigate,
  onOpenSettingsWizard,
}) => {
  // Por defecto cerrado (null), solo se abre al hacer clic en un módulo
  const [selectedNodeKey, setSelectedNodeKey] = useState<string | null>(null);

  // Refs para medir coordenadas reales de los nodos y animar en el canvas
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posNodeRef = useRef<HTMLDivElement>(null);
  const satNodeRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Métricas dinámicas calculadas
  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);
  const totalStockCount = products.reduce((acc, p) => acc + p.stock, 0);
  const totalSalesToday = sales.reduce((acc, s) => acc + s.total, 4892.5);
  const corporateCustomers = customers.filter((c) => c.taxId && c.taxId.length > 5).length;

  // Catálogo completo de módulos con datos específicos
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
      badge: "Conciliado",
      icon: <FileText className="w-4 h-4" />,
      colorScheme: {
        accent: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-500",
        lineColor: "#059669",
        pulseColor: "#34d399",
      },
      statMain: `$148,920.00`,
      statSub: "Flujo de caja y cuentas bancarias",
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
      title: "RRHH & Turnos",
      category: "PERSONAL",
      badge: "Al Día",
      icon: <UserCheck className="w-4 h-4" />,
      colorScheme: {
        accent: "text-teal-600 dark:text-teal-400",
        bg: "bg-teal-500",
        lineColor: "#0d9488",
        pulseColor: "#2dd4bf",
      },
      statMain: "8 Colaboradores",
      statSub: "Turnos de cajeros y bodegueros",
      actionView: "users",
      actionLabel: "Gestionar Personal",
      desc: "Asistencia de empleados, roles de acceso restringido y control de turnos.",
      events: [
        "[08:00:10] ASISTENCIA: Cajero 1 inició turno",
        "[08:02:00] ASISTENCIA: Bodeguero inició turno",
        "[07:55:00] TURNO: Caja aperturada conforme",
      ],
    },
    production: {
      nodeNum: "07",
      title: "Recetas & Producción",
      category: "TRANSFORMACIÓN",
      badge: "Recetas ON",
      icon: <Layers className="w-4 h-4" />,
      colorScheme: {
        accent: "text-rose-600 dark:text-rose-400",
        bg: "bg-rose-500",
        lineColor: "#e11d48",
        pulseColor: "#fb7185",
      },
      statMain: "24 Fórmulas",
      statSub: "Descuento automático de insumos",
      actionView: "inventory",
      actionLabel: "Ver Recetas e Insumos",
      desc: "Descuenta materias primas automáticamente con cada venta de producto terminado.",
      events: [
        "[16:30:00] RECETA: Descuento de ingredientes en bodega",
        "[15:45:00] PRODUCCIÓN: Lote preparado con éxito",
        "[14:00:00] STOCK: Insumos verificados",
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
      statMain: "100% Éxito",
      statSub: "Reórdenes y avisos automáticos",
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
      statMain: "3 Pacientes",
      statSub: "Carnet de vacunas y desparasitación",
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
      statMain: "3 Expedientes",
      statSub: "Odontograma y recetas médicas",
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

  // Si por alguna razón hay pocos satélites, aseguramos los representativos del rubro
  const satelliteKeys = activeSatelliteKeys.length > 0 
    ? activeSatelliteKeys 
    : (["customers", "inventory", "reports", "billing"] as ModuleKey[]);

  // Posiciones orbitales para el diseño espacial de constelación
  // Coordenadas Bézier SVG relativas a viewBox="0 0 1000 700":
  // Centro Nuclear POS: (500, 350)
  const orbitCoordinates = [
    { 
      posClass: "top-10 md:top-14 left-4 md:left-12", 
      animClass: "animate-float-slow", 
      x: 200, 
      y: 150,
      pathForward: "M 200 150 C 350 150, 360 350, 500 350",
      pathBackward: "M 500 350 C 360 350, 350 150, 200 150"
    },
    { 
      posClass: "top-10 md:top-14 right-4 md:right-12", 
      animClass: "animate-float-reverse", 
      x: 800, 
      y: 150,
      pathForward: "M 800 150 C 650 150, 640 350, 500 350",
      pathBackward: "M 500 350 C 640 350, 650 150, 800 150"
    },
    { 
      posClass: "bottom-10 md:bottom-14 left-4 md:left-12", 
      animClass: "animate-float-delayed", 
      x: 200, 
      y: 550,
      pathForward: "M 200 550 C 350 550, 360 350, 500 350",
      pathBackward: "M 500 350 C 360 350, 350 550, 200 550"
    },
    { 
      posClass: "bottom-10 md:bottom-14 right-4 md:right-12", 
      animClass: "animate-float-slow", 
      x: 800, 
      y: 550,
      pathForward: "M 800 550 C 650 550, 640 350, 500 350",
      pathBackward: "M 500 350 C 640 350, 650 550, 800 550"
    },
  ];

  // Bucle de animación para estrellas flotantes de fondo y pelotitas que viajan por los circuitos
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;

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

    const stars: Star[] = [];
    const NUM_STARS = 75;

    const resize = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const hues: ("cyan" | "white" | "blue" | "purple")[] = ["cyan", "white", "blue", "purple"];
    for (let i = 0; i < NUM_STARS; i++) {
      stars.push({
        x: Math.random() * (width || 800),
        y: Math.random() * (height || 600),
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.8 + 0.8,
        baseAlpha: Math.random() * 0.45 + 0.25,
        pulseSpeed: 0.0015 + Math.random() * 0.002,
        pulsePhase: Math.random() * Math.PI * 2,
        hue: hues[Math.floor(Math.random() * hues.length)],
      });
    }

    const render = (now: number) => {
      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.classList.contains("dark");

      // 1. DIBUJAR Y DESPLAZAR ESTRELLAS / PELOTITAS DE FONDO
      for (const s of stars) {
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < 0) s.x = width;
        if (s.x > width) s.x = 0;
        if (s.y < 0) s.y = height;
        if (s.y > height) s.y = 0;

        const currentAlpha = Math.max(0.12, Math.min(0.95, s.baseAlpha + Math.sin(now * s.pulseSpeed + s.pulsePhase) * 0.22));

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);

        if (isDark) {
          if (s.hue === "cyan") {
            ctx.fillStyle = `rgba(56, 189, 248, ${currentAlpha})`;
          } else if (s.hue === "blue") {
            ctx.fillStyle = `rgba(0, 113, 227, ${currentAlpha})`;
          } else if (s.hue === "purple") {
            ctx.fillStyle = `rgba(168, 85, 247, ${currentAlpha * 0.85})`;
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
          }
        } else {
          // Modo Normal (Light): visibles y elegantes en azul Apple y pizarra suave
          if (s.hue === "cyan" || s.hue === "blue") {
            ctx.fillStyle = `rgba(0, 113, 227, ${currentAlpha * 0.75})`;
          } else if (s.hue === "purple") {
            ctx.fillStyle = `rgba(147, 51, 234, ${currentAlpha * 0.65})`;
          } else {
            ctx.fillStyle = `rgba(71, 85, 105, ${currentAlpha * 0.7})`;
          }
        }
        ctx.fill();

        // Halo difuso para estrellas con mayor tamaño
        if (s.radius > 1.8) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius * 2.3, 0, Math.PI * 2);
          ctx.fillStyle = isDark
            ? `rgba(56, 189, 248, ${currentAlpha * 0.2})`
            : `rgba(0, 113, 227, ${currentAlpha * 0.15})`;
          ctx.fill();
        }
      }

      // 2. DIBUJAR LÍNEAS DE CIRCUITO Y PELOTITAS VIAJERAS ACTIVAS A LOS NODOS
      const containerRect = container.getBoundingClientRect();
      const posNode = posNodeRef.current;

      if (posNode && containerRect.width > 0) {
        const posRect = posNode.getBoundingClientRect();
        const posCenter = {
          x: posRect.left + posRect.width / 2 - containerRect.left,
          y: posRect.top + posRect.height / 2 - containerRect.top,
        };

        satelliteKeys.slice(0, 4).forEach((key, idx) => {
          const satNode = satNodeRefs.current[idx];
          if (!satNode) return;

          const satRect = satNode.getBoundingClientRect();
          const satCenter = {
            x: satRect.left + satRect.width / 2 - containerRect.left,
            y: satRect.top + satRect.height / 2 - containerRect.top,
          };

          const curveOffset = satCenter.x < posCenter.x ? 35 : -35;
          const cp = {
            x: (satCenter.x + posCenter.x) / 2 + curveOffset,
            y: (satCenter.y + posCenter.y) / 2,
          };

          // Línea Bézier punteada de conexión
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(satCenter.x, satCenter.y);
          ctx.quadraticCurveTo(cp.x, cp.y, posCenter.x, posCenter.y);
          ctx.setLineDash([4, 6]);
          ctx.lineWidth = 1.75;
          ctx.strokeStyle = isDark 
            ? "rgba(56, 189, 248, 0.35)" 
            : "rgba(0, 113, 227, 0.35)";
          ctx.stroke();
          ctx.restore();

          // Punto de anclaje
          ctx.beginPath();
          ctx.arc(satCenter.x, satCenter.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = isDark ? "#38bdf8" : "#0071e3";
          ctx.fill();

          const getBezierPoint = (t: number) => {
            const inv = 1 - t;
            return {
              x: inv * inv * satCenter.x + 2 * inv * t * cp.x + t * t * posCenter.x,
              y: inv * inv * satCenter.y + 2 * inv * t * cp.y + t * t * posCenter.y,
            };
          };

          // PELOTITA 1: VIAJA DEL SATÉLITE AL POS CENTRAL
          const speed1 = 2800 + idx * 400;
          const t1 = ((now + idx * 600) % speed1) / speed1;
          const pt1 = getBezierPoint(t1);

          // Cola de la pelotita
          for (let trail = 1; trail <= 3; trail++) {
            const tTrail = Math.max(0, t1 - trail * 0.025);
            const ptTrail = getBezierPoint(tTrail);
            ctx.beginPath();
            ctx.arc(ptTrail.x, ptTrail.y, Math.max(1, 3.5 - trail * 0.7), 0, Math.PI * 2);
            ctx.fillStyle = isDark
              ? `rgba(56, 189, 248, ${0.4 - trail * 0.1})`
              : `rgba(0, 113, 227, ${0.4 - trail * 0.1})`;
            ctx.fill();
          }

          // Halo difuso
          const grad = ctx.createRadialGradient(pt1.x, pt1.y, 1, pt1.x, pt1.y, 10);
          grad.addColorStop(0, isDark ? "rgba(56, 189, 248, 0.85)" : "rgba(0, 113, 227, 0.75)");
          grad.addColorStop(1, "rgba(56, 189, 248, 0)");
          ctx.beginPath();
          ctx.arc(pt1.x, pt1.y, 10, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();

          // Núcleo brillante
          ctx.beginPath();
          ctx.arc(pt1.x, pt1.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = isDark ? "#ffffff" : "#0071e3";
          ctx.shadowColor = isDark ? "#38bdf8" : "#0071e3";
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;

          // PELOTITA 2: DE RETORNO (POS -> SATÉLITE)
          const speed2 = 3300 + idx * 300;
          const t2 = 1 - (((now + 1200 + idx * 400) % speed2) / speed2);
          const pt2 = getBezierPoint(t2);

          ctx.beginPath();
          ctx.arc(pt2.x, pt2.y, 2.7, 0, Math.PI * 2);
          ctx.fillStyle = isDark ? "#34d399" : "#10b981";
          ctx.shadowColor = isDark ? "#34d399" : "#10b981";
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [satelliteKeys, darkMode]);

  const posCoreMeta = moduleMetaRegistry["pos"];
  const activeInspectorMeta = selectedNodeKey ? moduleMetaRegistry[selectedNodeKey] : null;

  return (
    <div 
      ref={containerRef}
      className="relative w-full min-h-[760px] md:h-[780px] rounded-3xl bg-slate-100/90 dark:bg-[#0d0e12] border border-slate-300/80 dark:border-neutral-800/80 overflow-hidden select-none p-4 md:p-6 transition-colors duration-300 shadow-xl dark:shadow-2xl"
    >
      {/* Canvas interactivo de estrellas flotantes y circuitos con pelotitas viajeras */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-none z-0" 
      />

      {/* Bioluminiscencia de fondo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-apple-blue/10 dark:bg-apple-blue/15 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Barra superior de telemetría tipo Apple UI (Light & Dark) */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 px-2 mb-2">
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 shadow-sm text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">
            Topología: Constelación {tenant.name}
          </span>
          <span className="text-neutral-300 dark:text-neutral-600">/</span>
          <span className="text-neutral-500 dark:text-neutral-400 font-mono">
            {satelliteKeys.length + 1} Módulos Activos
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-neutral-500 dark:text-neutral-400 px-3 py-1 rounded-full bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/90 dark:border-neutral-800/80 shadow-2xs">
            <span>Latencia: 12ms</span>
            <span className="text-neutral-300 dark:text-neutral-600">•</span>
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
              <Activity className="w-3 h-3 inline" />
              Sync: Local ⇄ Nube
            </span>
          </div>

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

      {/* LIENZO ESPACIAL CONSTELACIÓN: Posiciones orbitales flotantes */}
      <div className="relative z-10 w-full h-[660px] flex items-center justify-center">

        {/* ========================================================= */}
        {/* NODO NUCLEAR CENTRAL: POS & VENTAS (Flotando en el centro) */}
        {/* ========================================================= */}
        <div 
          ref={posNodeRef}
          onClick={() => setSelectedNodeKey("pos")}
          className={`cursor-pointer transition-all duration-300 z-10 w-[330px] sm:w-[380px] rounded-3xl p-5 md:p-6 bg-white/95 dark:bg-[#16171d]/90 backdrop-blur-2xl border-2 ${
            selectedNodeKey === "pos"
              ? "border-apple-blue ring-4 ring-apple-blue/20 dark:ring-apple-blue/30 shadow-[0_0_40px_rgba(0,122,255,0.3)] scale-105"
              : "border-apple-blue/40 hover:border-apple-blue shadow-[0_12px_36px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)] hover:shadow-[0_0_35px_rgba(0,122,255,0.25)] hover:scale-[1.02]"
          } animate-float-slow`}
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

            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-apple-blue/15 text-apple-blue border border-apple-blue/30 font-mono">
              CORE
            </span>
          </div>

          {/* Caja Interna de Métrica de Turno */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#0f1015]/90 border border-neutral-200/80 dark:border-neutral-800/90 mb-3.5">
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
        {/* NODOS SATÉLITE FLOTANTES EN ÓRBITA                         */}
        {/* ========================================================= */}
        {satelliteKeys.slice(0, 4).map((key, index) => {
          const meta = moduleMetaRegistry[key];
          if (!meta) return null;
          const isSelected = selectedNodeKey === key;
          const coord = orbitCoordinates[index];

          return (
            <div
              key={key}
              ref={(el) => { satNodeRefs.current[index] = el; }}
              onClick={() => setSelectedNodeKey(key)}
              className={`absolute ${coord.posClass} ${coord.animClass} cursor-pointer transition-all duration-300 w-[240px] sm:w-[270px] rounded-2xl p-4 bg-white/95 dark:bg-[#14151b]/85 backdrop-blur-xl border ${
                isSelected
                  ? "border-apple-blue ring-2 ring-apple-blue/40 shadow-[0_0_25px_rgba(0,122,255,0.25)] scale-105 z-30"
                  : "border-neutral-200 dark:border-neutral-800/90 hover:border-apple-blue/50 dark:hover:border-neutral-700 hover:scale-105 shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_16px_36px_rgba(0,0,0,0.6)] z-10"
              }`}
            >
              {/* Header de Satélite */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100 dark:border-neutral-800/80">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-xl ${meta.colorScheme.bg}/15 dark:${meta.colorScheme.bg}/20 ${meta.colorScheme.accent} flex items-center justify-center border border-black/5 dark:border-white/5`}>
                    {meta.icon}
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-neutral-400 dark:text-neutral-500 font-semibold block leading-tight">
                      NODO {meta.nodeNum}
                    </span>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white tracking-tight truncate max-w-[130px]">
                      {meta.title}
                    </h4>
                  </div>
                </div>

                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full font-mono ${
                  meta.badge.includes("bajo")
                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
                }`}>
                  {meta.badge}
                </span>
              </div>

              {/* Métrica Principal */}
              <div className="py-1">
                <div className="text-lg font-bold text-neutral-900 dark:text-white font-mono tracking-tight">
                  {meta.statMain}
                </div>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug line-clamp-1">
                  {meta.statSub}
                </p>
              </div>

              {/* Indicador de conexión activo */}
              <div className="pt-2 mt-1 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between text-[10px] text-neutral-500 dark:text-neutral-400">
                <span className="flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                  Conectado
                </span>
                <span className="text-apple-blue font-semibold hover:underline">
                  Inspeccionar →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* SLIDE-OVER INSPECTOR LATERAL (CERRADO POR DEFECTO)        */}
      {/* SOLO SE MUESTRA AL HACER CLIC EN UN MÓDULO                 */}
      {/* ========================================================= */}
      {activeInspectorMeta && (
        <>
          {/* Backdrop semi-transparente para cerrar al hacer clic afuera */}
          <div 
            onClick={() => setSelectedNodeKey(null)}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xs z-40 transition-opacity animate-fadeIn"
          />

          <aside className="fixed top-0 right-0 h-full w-80 sm:w-96 bg-white/95 dark:bg-[#18191f]/95 backdrop-blur-2xl p-6 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl z-50 flex flex-col justify-between animate-fadeIn text-neutral-800 dark:text-neutral-200">
            <div className="space-y-5">
              {/* Header del Inspector con botón X que cierra */}
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
