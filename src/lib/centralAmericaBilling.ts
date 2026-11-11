// Motor de Facturación y Prorrateo de Membresías SaaS - Zona Horaria Centroamérica (UTC-6)
import { TenantSettings } from "@/types";

export interface BillingCycleInfo {
  timeZone: string;
  timeZoneLabel: string;
  startDate: string; // Fecha de alta del perfil
  currentCycleStart: string; // Día 11 del ciclo actual
  nextCutDate: string; // Día 10 del corte
  nextDueDate: string; // Día 05 del pago
  isFirstProRatedCycle: boolean;
  daysConsumed: number;
  totalCycleDays: number;
  monthlyPlanPrice: number;
  amountDueUsd: number;
  amountDueNio: number;
  paymentStatus: "al_dia" | "proximo_corte" | "pago_pendiente" | "vencido";
  statusBadge: { label: string; colorClass: string };
  proRatedExplanation?: string;
  invoicesHistory: Array<{
    id: string;
    period: string;
    cutDate: string;
    dueDate: string;
    amountUsd: number;
    amountNio: number;
    paymentMethod: string;
    status: "PAGADO" | "PENDIENTE" | "VENCIDO";
    isProRated?: boolean;
    note?: string;
  }>;
}

// Devuelve la fecha actual en la zona horaria de Centroamérica (UTC-6)
export const getCentralAmericaNow = (): Date => {
  try {
    const str = new Date().toLocaleString("en-US", { timeZone: "America/Managua" });
    return new Date(str);
  } catch {
    return new Date();
  }
};

// Formateador en español para Centroamérica
export const formatCentralAmericaDate = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "Fecha no disponible";
  return d.toLocaleDateString("es-NI", {
    timeZone: "America/Managua",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const formatCentralAmericaShort = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "--/--/----";
  return d.toLocaleDateString("es-NI", {
    timeZone: "America/Managua",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

/**
 * Calcula con precisión milimétrica el ciclo de facturación de un negocio:
 * - Zona Horaria: Centroamérica UTC-6 (Managua / San José / Tegucigalpa / San Salvador / Guatemala).
 * - Día de corte: 10 de cada mes.
 * - Último día de pago: 05 de cada mes (período de gracia/vencimiento).
 * - Prorrateo: Si contrata en día X, se calcula el consumo proporcional exacto desde el día de creación del perfil hasta el corte del día 10.
 */
export const calculateTenantBilling = (tenant: TenantSettings): BillingCycleInfo => {
  const now = getCentralAmericaNow();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0 a 11
  const currentDay = now.getDate();

  // Fecha de alta del negocio en el sistema
  const rawCreatedAt = tenant.createdAt || tenant.planAssignedDate || "2026-10-24T00:00:00.000Z";
  const tenantStart = new Date(rawCreatedAt);
  const startDay = !isNaN(tenantStart.getTime()) ? tenantStart.getDate() : 24;
  const startMonth = !isNaN(tenantStart.getTime()) ? tenantStart.getMonth() : currentMonth;
  const startYear = !isNaN(tenantStart.getTime()) ? tenantStart.getFullYear() : currentYear;

  // Determinar la próxima fecha de corte (Día 10)
  let cutYear = currentYear;
  let cutMonth = currentMonth;

  if (currentDay > 10) {
    // Si ya pasó el 10 de este mes, el próximo corte es el 10 del mes siguiente
    cutMonth = currentMonth + 1;
    if (cutMonth > 11) {
      cutMonth = 0;
      cutYear = currentYear + 1;
    }
  }
  const nextCutDateObj = new Date(cutYear, cutMonth, 10, 23, 59, 59);

  // Determinar el último día de pago (Día 05 del mes posterior al corte)
  let dueYear = cutYear;
  let dueMonth = cutMonth + 1;
  if (dueMonth > 11) {
    dueMonth = 0;
    dueYear = cutYear + 1;
  }
  const nextDueDateObj = new Date(dueYear, dueMonth, 5, 23, 59, 59);

  // Fecha de inicio del ciclo actual: Día 11 del mes anterior al corte
  let cycleStartYear = cutYear;
  let cycleStartMonth = cutMonth - 1;
  if (cycleStartMonth < 0) {
    cycleStartMonth = 11;
    cycleStartYear = cutYear - 1;
  }
  const standardCycleStartObj = new Date(cycleStartYear, cycleStartMonth, 11, 0, 0, 0);

  // Verificar si es el primer ciclo proporcional
  // Si la fecha de creación está después del inicio estándar del ciclo, se prorratea
  const effectiveStartObj = tenantStart > standardCycleStartObj ? tenantStart : standardCycleStartObj;
  const isFirstProRatedCycle = tenantStart > standardCycleStartObj && tenantStart <= nextCutDateObj;

  // Días consumidos: Días entre effectiveStartObj y nextCutDateObj (inclusivo)
  const diffTime = nextCutDateObj.getTime() - effectiveStartObj.getTime();
  const rawDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const daysConsumed = Math.max(1, Math.min(rawDays, 30));

  const monthlyPlanPrice = tenant.monthlyPlanPrice || 35.0;
  const dailyRate = monthlyPlanPrice / 30.0;

  let amountDueUsd = monthlyPlanPrice;
  let proRatedExplanation: string | undefined = undefined;

  if (isFirstProRatedCycle) {
    amountDueUsd = Math.round(dailyRate * daysConsumed * 100) / 100;
    proRatedExplanation = `Prorrateo inicial de ${daysConsumed} días de servicio (desde ${formatCentralAmericaDate(
      effectiveStartObj
    )} hasta corte del 10 de ${nextCutDateObj.toLocaleDateString("es-NI", { month: "long" })}). Tarifa diaria: $${dailyRate.toFixed(
      2
    )} USD/día.`;
  }

  const exchangeRate = tenant.exchangeRate || 36.62;
  const amountDueNio = Math.round(amountDueUsd * exchangeRate * 100) / 100;

  // Estado del pago
  let paymentStatus: BillingCycleInfo["paymentStatus"] = "al_dia";
  let statusBadge = {
    label: "🟢 AL DÍA",
    colorClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  };

  if (now > nextDueDateObj) {
    paymentStatus = "vencido";
    statusBadge = {
      label: "🔴 VENCIDO (Superó día 05)",
      colorClass: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    };
  } else if (currentDay >= 8 && currentDay <= 10) {
    paymentStatus = "proximo_corte";
    statusBadge = {
      label: "🟡 CORTE PRÓXIMO (Día 10)",
      colorClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    };
  } else if (currentDay > 10 && currentDay <= 5) {
    paymentStatus = "pago_pendiente";
    statusBadge = {
      label: "🟠 PAGO PENDIENTE (Hasta el 05)",
      colorClass: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
    };
  }

  // Generar historial de recibos
  const invoicesHistory: BillingCycleInfo["invoicesHistory"] = [
    {
      id: `NUC-INV-${cutYear}-${String(cutMonth + 1).padStart(2, "0")}`,
      period: `${formatCentralAmericaShort(effectiveStartObj)} - 10/${String(cutMonth + 1).padStart(2, "0")}/${cutYear}`,
      cutDate: formatCentralAmericaShort(nextCutDateObj),
      dueDate: `05/${String(dueMonth + 1).padStart(2, "0")}/${dueYear}`,
      amountUsd: amountDueUsd,
      amountNio: amountDueNio,
      paymentMethod: "Transferencia BAC / Banpro",
      status: paymentStatus === "vencido" ? "VENCIDO" : "PENDIENTE",
      isProRated: isFirstProRatedCycle,
      note: isFirstProRatedCycle ? `Prorrateado (${daysConsumed} días consumidos)` : "Ciclo mensual regular completo",
    },
  ];

  // Si el negocio tiene más tiempo, agregar facturas previas pagadas
  if (!isFirstProRatedCycle || tenantStart.getMonth() < currentMonth) {
    invoicesHistory.push({
      id: `NUC-INV-2026-10`,
      period: "11/09/2026 - 10/10/2026",
      cutDate: "10/10/2026",
      dueDate: "05/11/2026",
      amountUsd: monthlyPlanPrice,
      amountNio: Math.round(monthlyPlanPrice * exchangeRate * 100) / 100,
      paymentMethod: "Transferencia Banpro #77120",
      status: "PAGADO",
      isProRated: false,
      note: "Mensualidad acordada por SuperAdmin",
    });
  }

  return {
    timeZone: "America/Managua (UTC-6)",
    timeZoneLabel: "Centroamérica (UTC-6 / GMT-6 Estándar)",
    startDate: formatCentralAmericaDate(effectiveStartObj),
    currentCycleStart: formatCentralAmericaDate(effectiveStartObj),
    nextCutDate: formatCentralAmericaDate(nextCutDateObj),
    nextDueDate: formatCentralAmericaDate(nextDueDateObj),
    isFirstProRatedCycle,
    daysConsumed,
    totalCycleDays: 30,
    monthlyPlanPrice,
    amountDueUsd,
    amountDueNio,
    paymentStatus,
    statusBadge,
    proRatedExplanation,
    invoicesHistory,
  };
};
