"use client";

import React, { useState } from "react";
import {
  Users,
  UserCheck,
  UserPlus,
  Clock,
  Calendar,
  DollarSign,
  FileText,
  Printer,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Building2,
  Phone,
  CreditCard,
  Award,
  TrendingUp,
  Edit2,
  Trash2,
  X,
  Check,
  LogIn,
  LogOut,
  ShieldCheck,
  Wallet
} from "lucide-react";
import {
  TenantSettings,
  HREmployee,
  EmployeeDepartment,
  ContractType,
  PaymentFrequency,
  EmployeeStatus,
  AttendanceRecord,
  HRAdvanceOrLeave,
  PayrollRecord
} from "@/types";
import { saveStoredHREmployees } from "@/lib/offlineStore";
import { printThermalReceipt } from "@/lib/thermalPrintService";

interface HRManagerProps {
  tenant: TenantSettings;
  employees: HREmployee[];
  setEmployees: React.Dispatch<React.SetStateAction<HREmployee[]>>;
}

const DEPARTMENT_LABELS: Record<EmployeeDepartment, string> = {
  ventas_caja: "Ventas & Caja",
  bodega_logistica: "Bodega & Logística",
  administracion: "Administración & Finanzas",
  clinica_atencion: "Clínica & Atención",
  operaciones: "Operaciones & Despacho",
};

const STATUS_BADGES: Record<EmployeeStatus, { label: string; classes: string }> = {
  activo: {
    label: "ACTIVO",
    classes: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  vacaciones: {
    label: "VACACIONES",
    classes: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
  subsidio: {
    label: "SUBSIDIO / PERMISO",
    classes: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
  },
  inactivo: {
    label: "INACTIVO",
    classes: "bg-neutral-500/15 text-neutral-500 border-neutral-500/30",
  },
};

export const HRManager: React.FC<HRManagerProps> = ({
  tenant,
  employees,
  setEmployees,
}) => {
  const [activeTab, setActiveTab] = useState<"employees" | "attendance" | "payroll" | "movements">("employees");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("todos");
  const [selectedEmployee, setSelectedEmployee] = useState<HREmployee | null>(employees[0] || null);

  // Modal Nuevo / Editar Colaborador
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [empForm, setEmpForm] = useState({
    fullName: "",
    dni: "",
    inssNumber: "",
    position: "",
    department: "ventas_caja" as EmployeeDepartment,
    contractType: "indefinido" as ContractType,
    paymentFrequency: "quincenal" as PaymentFrequency,
    hireDate: new Date().toISOString().split("T")[0],
    baseMonthlySalary: "12000",
    phone: "",
    email: "",
    address: "",
    emergencyContact: "",
    bankName: "BAC Credomatic",
    bankAccount: "",
    vacationDaysAvailable: "15",
    status: "activo" as EmployeeStatus,
  });

  // Modal Nuevo Movimiento (Adelanto, Bono, Vacaciones, Permiso)
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movForm, setMovForm] = useState({
    employeeId: employees[0]?.id || "",
    type: "adelanto_salarial" as HRAdvanceOrLeave["type"],
    amount: "1000",
    days: "3",
    reason: "",
  });

  // Estado de Nómina / Colilla Imprimible
  const [payrollPeriodLabel, setPayrollPeriodLabel] = useState("2da Quincena Noviembre 2026");
  const [applyInss, setApplyInss] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState<{
    employee: HREmployee;
    record: PayrollRecord;
  } | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const showTempNotice = (msg: string) => {
    setNoticeMsg(msg);
    setTimeout(() => setNoticeMsg(null), 3500);
  };

  const updateAndPersistEmployees = (updated: HREmployee[]) => {
    setEmployees(updated);
    saveStoredHREmployees(updated);
    if (selectedEmployee) {
      const refreshed = updated.find((e) => e.id === selectedEmployee.id);
      if (refreshed) setSelectedEmployee(refreshed);
    }
  };

  // Métricas Globales de RRHH
  const activeEmployees = employees.filter((e) => e.status !== "inactivo");
  const totalMonthlyPayroll = activeEmployees.reduce((acc, e) => acc + e.baseMonthlySalary, 0);
  const totalBiweeklyPayroll = totalMonthlyPayroll / 2;
  const presentTodayCount = activeEmployees.filter((e) =>
    e.attendance.some((a) => a.date === todayStr && (a.status === "presente" || a.status === "tardanza"))
  ).length;
  const totalOvertimeHoursMonth = activeEmployees.reduce(
    (acc, e) => acc + e.attendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0),
    0
  );

  // Filtrado de empleados
  const filteredEmployees = employees.filter((e) => {
    const matchesDept = selectedDept === "todos" || e.department === selectedDept;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesDept;
    return (
      matchesDept &&
      (e.fullName.toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q) ||
        e.dni.toLowerCase().includes(q) ||
        e.position.toLowerCase().includes(q) ||
        (e.inssNumber && e.inssNumber.toLowerCase().includes(q)))
    );
  });

  // Cálculo de nómina quincenal para un colaborador
  const calculateEmployeePayroll = (emp: HREmployee): PayrollRecord => {
    const baseSalaryPeriod = emp.paymentFrequency === "quincenal"
      ? emp.baseMonthlySalary / 2
      : emp.paymentFrequency === "semanal"
      ? emp.baseMonthlySalary / 4
      : emp.baseMonthlySalary;

    // Tarifa por hora ordinaria (Salario mensual / 240 horas) y hora extra doble (2x)
    const hourlyRate = emp.baseMonthlySalary / 240;
    const overtimeHours = emp.attendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);
    const overtimePay = Math.round(overtimeHours * hourlyRate * 2 * 100) / 100;

    // Bonos y comisiones aprobados no aplicados
    const bonuses = emp.movements
      .filter((m) => m.type === "bono_comision" && m.status === "aprobado")
      .reduce((sum, m) => sum + (m.amount || 0), 0);

    // Adelantos salariales aprobados
    const advancesDeduction = emp.movements
      .filter((m) => m.type === "adelanto_salarial" && m.status === "aprobado")
      .reduce((sum, m) => sum + (m.amount || 0), 0);

    const grossPay = baseSalaryPeriod + overtimePay + bonuses;
    // INSS Laboral (7% en Nicaragua)
    const inssDeduction = applyInss ? Math.round(grossPay * 0.07 * 100) / 100 : 0;
    // Retención IR simplificada para salarios mayores a C$ 100,000 anuales (~C$ 4,166.67 quincenal libre)
    const taxablePeriod = grossPay - inssDeduction;
    const irDeduction = taxablePeriod > 7500 ? Math.round((taxablePeriod - 7500) * 0.15 * 100) / 100 : 0;

    const netPay = Math.max(0, Math.round((grossPay - inssDeduction - irDeduction - advancesDeduction) * 100) / 100);

    return {
      id: `pay-${emp.id}-${Date.now()}`,
      periodLabel: payrollPeriodLabel,
      paymentDate: todayStr,
      baseSalaryPeriod: Math.round(baseSalaryPeriod * 100) / 100,
      overtimeHours,
      overtimePay,
      bonuses,
      inssDeduction,
      irDeduction,
      advancesDeduction,
      netPay,
      paymentMethod: emp.bankAccount ? "transferencia" : "efectivo",
      status: "pagado",
    };
  };

  // Abrir modal para crear colaborador
  const handleOpenNewEmployee = () => {
    setEditingEmployeeId(null);
    setEmpForm({
      fullName: "",
      dni: "",
      inssNumber: "",
      position: "",
      department: "ventas_caja",
      contractType: "indefinido",
      paymentFrequency: "quincenal",
      hireDate: todayStr,
      baseMonthlySalary: "12000",
      phone: "+505 ",
      email: "",
      address: "",
      emergencyContact: "",
      bankName: "BAC Credomatic",
      bankAccount: "",
      vacationDaysAvailable: "15",
      status: "activo",
    });
    setShowEmployeeModal(true);
  };

  // Abrir modal para editar colaborador
  const handleOpenEditEmployee = (emp: HREmployee) => {
    setEditingEmployeeId(emp.id);
    setEmpForm({
      fullName: emp.fullName,
      dni: emp.dni,
      inssNumber: emp.inssNumber || "",
      position: emp.position,
      department: emp.department,
      contractType: emp.contractType,
      paymentFrequency: emp.paymentFrequency,
      hireDate: emp.hireDate,
      baseMonthlySalary: emp.baseMonthlySalary.toString(),
      phone: emp.phone,
      email: emp.email || "",
      address: emp.address || "",
      emergencyContact: emp.emergencyContact,
      bankName: emp.bankName || "BAC Credomatic",
      bankAccount: emp.bankAccount || "",
      vacationDaysAvailable: emp.vacationDaysAvailable.toString(),
      status: emp.status,
    });
    setShowEmployeeModal(true);
  };

  // Guardar Colaborador
  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const salaryNum = parseFloat(empForm.baseMonthlySalary) || 10000;
    const vacNum = parseFloat(empForm.vacationDaysAvailable) || 0;

    if (editingEmployeeId) {
      const updated = employees.map((emp) =>
        emp.id === editingEmployeeId
          ? {
              ...emp,
              fullName: empForm.fullName.trim(),
              dni: empForm.dni.trim(),
              inssNumber: empForm.inssNumber.trim(),
              position: empForm.position.trim(),
              department: empForm.department,
              contractType: empForm.contractType,
              paymentFrequency: empForm.paymentFrequency,
              hireDate: empForm.hireDate,
              baseMonthlySalary: salaryNum,
              phone: empForm.phone.trim(),
              email: empForm.email.trim(),
              address: empForm.address.trim(),
              emergencyContact: empForm.emergencyContact.trim(),
              bankName: empForm.bankName.trim(),
              bankAccount: empForm.bankAccount.trim(),
              vacationDaysAvailable: vacNum,
              status: empForm.status,
            }
          : emp
      );
      updateAndPersistEmployees(updated);
      showTempNotice("✓ Expediente del colaborador actualizado correctamente");
    } else {
      const nextNum = employees.length + 1;
      const newEmp: HREmployee = {
        id: `emp-${Date.now()}`,
        code: `EMP-00${nextNum}`,
        fullName: empForm.fullName.trim(),
        dni: empForm.dni.trim(),
        inssNumber: empForm.inssNumber.trim(),
        position: empForm.position.trim(),
        department: empForm.department,
        contractType: empForm.contractType,
        paymentFrequency: empForm.paymentFrequency,
        hireDate: empForm.hireDate,
        baseMonthlySalary: salaryNum,
        phone: empForm.phone.trim(),
        email: empForm.email.trim(),
        address: empForm.address.trim(),
        emergencyContact: empForm.emergencyContact.trim(),
        bankName: empForm.bankName.trim(),
        bankAccount: empForm.bankAccount.trim(),
        vacationDaysAvailable: vacNum,
        status: empForm.status,
        attendance: [
          {
            id: `att-${Date.now()}`,
            date: todayStr,
            checkIn: "08:00",
            status: "presente",
            overtimeHours: 0,
            notes: "Alta e ingreso inicial al sistema",
          },
        ],
        movements: [],
        payrollHistory: [],
      };
      const updated = [newEmp, ...employees];
      updateAndPersistEmployees(updated);
      setSelectedEmployee(newEmp);
      showTempNotice(`✓ Colaborador ${newEmp.fullName} registrado con código ${newEmp.code}`);
    }
    setShowEmployeeModal(false);
  };

  // Marcar Entrada / Salida / Horas Extras del día
  const handleQuickAttendance = (
    empId: string,
    action: "check_in" | "check_out" | "add_overtime" | "mark_late"
  ) => {
    const nowTime = new Date().toLocaleTimeString("es-NI", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const updated = employees.map((emp) => {
      if (emp.id !== empId) return emp;
      const todayRec = emp.attendance.find((a) => a.date === todayStr);

      if (todayRec) {
        const updatedAtt = emp.attendance.map((a) => {
          if (a.date !== todayStr) return a;
          if (action === "check_in") return { ...a, checkIn: nowTime, status: "presente" as const };
          if (action === "check_out") return { ...a, checkOut: nowTime };
          if (action === "add_overtime") return { ...a, overtimeHours: (a.overtimeHours || 0) + 1 };
          if (action === "mark_late") return { ...a, status: "tardanza" as const };
          return a;
        });
        return { ...emp, attendance: updatedAtt };
      } else {
        const newRec: AttendanceRecord = {
          id: `att-${Date.now()}`,
          date: todayStr,
          checkIn: nowTime,
          checkOut: action === "check_out" ? nowTime : undefined,
          status: action === "mark_late" ? "tardanza" : "presente",
          overtimeHours: action === "add_overtime" ? 1 : 0,
        };
        return { ...emp, attendance: [newRec, ...emp.attendance] };
      }
    });

    updateAndPersistEmployees(updated);
    showTempNotice("✓ Asistencia y reloj marcador actualizado");
  };

  // Guardar Movimiento (Adelanto, Bono, Vacaciones, Permiso)
  const handleSaveMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = movForm.employeeId || employees[0]?.id;
    if (!targetId) return;

    const amountVal = parseFloat(movForm.amount) || 0;
    const daysVal = parseFloat(movForm.days) || 1;

    const newMov: HRAdvanceOrLeave = {
      id: `mov-${Date.now()}`,
      type: movForm.type,
      date: todayStr,
      amount: movForm.type === "adelanto_salarial" || movForm.type === "bono_comision" ? amountVal : undefined,
      days: movForm.type === "vacaciones" || movForm.type === "permiso_medico" ? daysVal : undefined,
      reason: movForm.reason.trim() || "Autorizado por Administración",
      status: "aprobado",
    };

    const updated = employees.map((emp) => {
      if (emp.id !== targetId) return emp;
      const newVacDays =
        movForm.type === "vacaciones"
          ? Math.max(0, emp.vacationDaysAvailable - daysVal)
          : emp.vacationDaysAvailable;
      const newStatus: EmployeeStatus =
        movForm.type === "vacaciones"
          ? "vacaciones"
          : movForm.type === "permiso_medico"
          ? "subsidio"
          : emp.status;

      return {
        ...emp,
        vacationDaysAvailable: newVacDays,
        status: newStatus,
        movements: [newMov, ...emp.movements],
      };
    });

    updateAndPersistEmployees(updated);
    setShowMovementModal(false);
    setMovForm({ ...movForm, reason: "" });
    showTempNotice("✓ Movimiento de personal registrado y aplicado a planilla");
  };

  // Liquidar y Pagar Planilla Completa del Periodo
  const handleProcessFullPayroll = () => {
    const updated = employees.map((emp) => {
      if (emp.status === "inactivo") return emp;
      const slip = calculateEmployeePayroll(emp);
      // Marcar adelantos y bonos como aplicados
      const updatedMovements = emp.movements.map((m) =>
        m.status === "aprobado" && (m.type === "adelanto_salarial" || m.type === "bono_comision")
          ? { ...m, status: "aplicado" as const }
          : m
      );
      return {
        ...emp,
        movements: updatedMovements,
        payrollHistory: [slip, ...emp.payrollHistory],
      };
    });

    updateAndPersistEmployees(updated);
    showTempNotice(`✓ Planilla "${payrollPeriodLabel}" emitida y registrada con éxito`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* ======================================================== */}
      {/* ENCABEZADO DEL MÓDULO DE RECURSOS HUMANOS & NÓMINA       */}
      {/* ======================================================== */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30 flex items-center justify-center shadow-xs">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-neutral-900 dark:text-white tracking-tight">
                Recursos Humanos, Asistencia & Nómina
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 text-[10px] font-mono font-bold border border-teal-500/20">
                LEY LABORAL & INSS
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Control de expedientes laborales, reloj marcador de turnos, horas extras, deducciones INSS y colillas térmicas de pago.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {noticeMsg && (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/30 animate-fadeIn">
              {noticeMsg}
            </span>
          )}

          <button
            type="button"
            onClick={() => setShowMovementModal(true)}
            className="px-3.5 py-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5 text-amber-500" />
            <span>+ Adelanto / Permiso</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNewEmployee}
            className="px-4 py-2.5 rounded-2xl bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-bold shadow-md shadow-apple-blue/25 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Nuevo Colaborador</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TARJETAS KPI DE RECURSOS HUMANOS                         */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span className="font-semibold">Personal Activo</span>
            <Users className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-black text-neutral-900 dark:text-white font-mono">
            {activeEmployees.length} <span className="text-xs font-normal text-neutral-400">/ {employees.length} reg.</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            ● {presentTodayCount} presentes en turno hoy
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span className="font-semibold">Planilla Quincenal</span>
            <DollarSign className="w-4 h-4 text-apple-blue" />
          </div>
          <div className="text-2xl font-black text-apple-blue font-mono">
            C$ {totalBiweeklyPayroll.toLocaleString("es-NI", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-neutral-400 font-mono">
            ≈ $ {(totalBiweeklyPayroll / tenant.exchangeRate).toFixed(2)} USD (15 días)
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span className="font-semibold">Nómina Mensual Bruta</span>
            <Briefcase className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-neutral-900 dark:text-white font-mono">
            C$ {totalMonthlyPayroll.toLocaleString("es-NI", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-neutral-400 font-mono">
            + Aguinaldo prov.: C$ {(totalMonthlyPayroll / 12).toFixed(2)}/mes
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span className="font-semibold">Horas Extras & Turnos</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-500 font-mono">
            {totalOvertimeHoursMonth} hrs
          </div>
          <div className="text-[11px] text-neutral-400">
            Pago doble (200%) según Código Laboral
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* BARRA DE PESTAÑAS DEL MÓDULO                             */}
      {/* ======================================================== */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-neutral-200/80 dark:border-neutral-800">
        <button
          type="button"
          onClick={() => setActiveTab("employees")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "employees"
              ? "bg-teal-600 text-white shadow-md shadow-teal-600/25"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>1. Expedientes de Colaboradores ({employees.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("attendance")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "attendance"
              ? "bg-teal-600 text-white shadow-md shadow-teal-600/25"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>2. Reloj Marcador & Asistencia Diaria</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("payroll")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "payroll"
              ? "bg-teal-600 text-white shadow-md shadow-teal-600/25"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>3. Planilla de Nómina & Colillas de Pago</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("movements")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "movements"
              ? "bg-teal-600 text-white shadow-md shadow-teal-600/25"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>4. Vacaciones, Permisos & Adelantos</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* PESTAÑA 1: DIRECTORIO Y EXPEDIENTE LABORAL               */}
      {/* ======================================================== */}
      {activeTab === "employees" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Lista izquierda de colaboradores */}
          <div className="lg:col-span-5 p-5 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, cédula, INSS o cargo..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: "todos", label: "Todos" },
                { id: "ventas_caja", label: "Ventas & Caja" },
                { id: "bodega_logistica", label: "Bodega" },
                { id: "administracion", label: "Admin" },
                { id: "operaciones", label: "Operaciones" },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDept(d.id)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedDept === d.id
                      ? "bg-teal-600 text-white"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
              {filteredEmployees.map((emp) => {
                const isSelected = selectedEmployee?.id === emp.id;
                const badge = STATUS_BADGES[emp.status];
                return (
                  <div
                    key={emp.id}
                    onClick={() => setSelectedEmployee(emp)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-teal-500/10 border-teal-500/40 shadow-xs"
                        : "bg-neutral-50/70 dark:bg-neutral-900/50 border-neutral-200/70 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-neutral-200/80 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                            {emp.code}
                          </span>
                          <h3 className="text-xs font-bold text-neutral-900 dark:text-white">
                            {emp.fullName}
                          </h3>
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {emp.position}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${badge.classes}`}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-200/60 dark:border-neutral-800/80 text-[11px] font-mono">
                      <span className="text-neutral-500">Céd: {emp.dni}</span>
                      <span className="font-bold text-teal-600 dark:text-teal-400">
                        C$ {emp.baseMonthlySalary.toLocaleString("es-NI")}/mes
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ficha derecha de expediente completo */}
          <div className="lg:col-span-7">
            {selectedEmployee ? (() => {
              const liveSlip = calculateEmployeePayroll(selectedEmployee);
              const badge = STATUS_BADGES[selectedEmployee.status];
              // Cálculo de antigüedad en meses
              const hireDateObj = new Date(selectedEmployee.hireDate);
              const monthsWorked = Math.max(
                1,
                Math.round((Date.now() - hireDateObj.getTime()) / (1000 * 60 * 60 * 24 * 30.4))
              );
              const accruedThirteenthMonth = Math.round(((selectedEmployee.baseMonthlySalary / 12) * (monthsWorked % 12 || 1)) * 100) / 100;

              return (
                <div className="p-6 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-6">
                  
                  {/* Cabecera del Expediente */}
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-neutral-200/80 dark:border-neutral-800">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                        {selectedEmployee.fullName
                          .split(" ")
                          .slice(0, 2)
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-teal-600 dark:text-teal-400 font-bold">
                            {selectedEmployee.code}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.classes}`}>
                            {badge.label}
                          </span>
                        </div>
                        <h2 className="text-lg font-extrabold text-neutral-900 dark:text-white">
                          {selectedEmployee.fullName}
                        </h2>
                        <p className="text-xs text-neutral-500">
                          {selectedEmployee.position} • {DEPARTMENT_LABELS[selectedEmployee.department]}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditEmployee(selectedEmployee)}
                        className="px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar Ficha</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedSlip({ employee: selectedEmployee, record: liveSlip })}
                        className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Emitir Colilla</span>
                      </button>
                    </div>
                  </div>

                  {/* Grilla de Datos Legales, Bancarios y Salariales */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800">
                      <span className="text-[10px] text-neutral-400 uppercase font-mono block">Cédula de Identidad</span>
                      <span className="font-mono font-bold text-neutral-900 dark:text-white">{selectedEmployee.dni}</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800">
                      <span className="text-[10px] text-neutral-400 uppercase font-mono block">Nº Asegurado INSS</span>
                      <span className="font-mono font-bold text-neutral-900 dark:text-white">{selectedEmployee.inssNumber || "En trámite"}</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800">
                      <span className="text-[10px] text-neutral-400 uppercase font-mono block">Fecha de Ingreso</span>
                      <span className="font-mono font-bold text-neutral-900 dark:text-white">{selectedEmployee.hireDate} ({monthsWorked}m)</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800">
                      <span className="text-[10px] text-neutral-400 uppercase font-mono block">Salario Base Mensual</span>
                      <span className="font-mono font-extrabold text-teal-600 dark:text-teal-400">
                        C$ {selectedEmployee.baseMonthlySalary.toLocaleString("es-NI", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800">
                      <span className="text-[10px] text-neutral-400 uppercase font-mono block">Cuota Quincenal</span>
                      <span className="font-mono font-bold text-apple-blue">
                        C$ {(selectedEmployee.baseMonthlySalary / 2).toLocaleString("es-NI", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800">
                      <span className="text-[10px] text-neutral-400 uppercase font-mono block">Banco & Cuenta</span>
                      <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200 truncate block">
                        {selectedEmployee.bankName} {selectedEmployee.bankAccount ? `• ${selectedEmployee.bankAccount}` : ""}
                      </span>
                    </div>
                  </div>

                  {/* Prestaciones Sociales Acumuladas (Ley 185 Código del Trabajo) */}
                  <div className="p-4 rounded-2xl bg-teal-500/5 border border-teal-500/20 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-teal-700 dark:text-teal-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Prestaciones Sociales & Pasivo Laboral Acumulado</span>
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500">Art. 76 & 93 C.T.</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800">
                        <span className="text-[10px] text-neutral-400 block">VACACIONES DISPONIBLES</span>
                        <span className="font-extrabold text-sm text-neutral-900 dark:text-white">
                          {selectedEmployee.vacationDaysAvailable} días
                        </span>
                        <span className="text-[10px] text-emerald-500 block">
                          Equiv: C$ {((selectedEmployee.baseMonthlySalary / 30) * selectedEmployee.vacationDaysAvailable).toFixed(2)}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800">
                        <span className="text-[10px] text-neutral-400 block">AGUINALDO ACUMULADO</span>
                        <span className="font-extrabold text-sm text-apple-blue">
                          C$ {accruedThirteenthMonth.toLocaleString("es-NI", { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-neutral-400 block">Décimo Tercer Mes</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800">
                        <span className="text-[10px] text-neutral-400 block">CONTACTO EMERGENCIA</span>
                        <span className="font-sans font-semibold text-[11px] text-neutral-800 dark:text-neutral-200 block truncate">
                          {selectedEmployee.emergencyContact || selectedEmployee.phone}
                        </span>
                        <span className="text-[10px] text-neutral-400 block">Tel: {selectedEmployee.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Historial de Pagos de Nómina del Colaborador */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider font-mono">
                      Últimas Colillas de Pago Emitidas
                    </h4>
                    <div className="space-y-2">
                      {selectedEmployee.payrollHistory.map((pay) => (
                        <div
                          key={pay.id}
                          className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <span className="font-bold text-neutral-900 dark:text-white">{pay.periodLabel}</span>
                            <span className="text-[11px] text-neutral-500 block font-mono">
                              Fecha: {pay.paymentDate} • INSS: -C$ {pay.inssDeduction.toFixed(2)} • Extras: +C$ {pay.overtimePay.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                              C$ {pay.netPay.toLocaleString("es-NI", { minimumFractionDigits: 2 })}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedSlip({ employee: selectedEmployee, record: pay })}
                              className="px-2.5 py-1 rounded-xl bg-neutral-200/80 dark:bg-neutral-800 hover:bg-apple-blue hover:text-white text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              Ver Recibo
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              );
            })() : null}
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 2: RELOJ MARCADOR Y ASISTENCIA DIARIA            */}
      {/* ======================================================== */}
      {activeTab === "attendance" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-200/80 dark:border-neutral-800">
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Control de Asistencia Diaria & Reloj Marcador ({todayStr})
              </h3>
              <p className="text-xs text-neutral-500">
                Registra con 1 clic la hora de entrada, salida de turno y horas extras laboradas.
              </p>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold border border-emerald-500/20">
              ● Sincronizado Horario Centroamérica (UTC-6)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[10px] font-mono text-neutral-400 uppercase">
                  <th className="py-3 px-2">Colaborador</th>
                  <th className="py-3 px-2">Departamento</th>
                  <th className="py-3 px-2">Entrada Hoy</th>
                  <th className="py-3 px-2">Salida Hoy</th>
                  <th className="py-3 px-2">Horas Extras</th>
                  <th className="py-3 px-2">Estado</th>
                  <th className="py-3 px-2 text-right">Acciones Rápidas (1-Clic)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                {employees.map((emp) => {
                  const todayAtt = emp.attendance.find((a) => a.date === todayStr);
                  return (
                    <tr key={emp.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40">
                      <td className="py-3.5 px-2">
                        <span className="font-bold text-neutral-900 dark:text-white block">{emp.fullName}</span>
                        <span className="text-[10px] font-mono text-neutral-400">{emp.code} • {emp.position}</span>
                      </td>
                      <td className="py-3.5 px-2 text-neutral-500">
                        {DEPARTMENT_LABELS[emp.department]}
                      </td>
                      <td className="py-3.5 px-2 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {todayAtt?.checkIn || "--:--"}
                      </td>
                      <td className="py-3.5 px-2 font-mono font-bold text-apple-blue">
                        {todayAtt?.checkOut || "--:--"}
                      </td>
                      <td className="py-3.5 px-2 font-mono font-bold text-amber-500">
                        +{todayAtt?.overtimeHours || 0} hrs
                      </td>
                      <td className="py-3.5 px-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          todayAtt?.status === "presente"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : todayAtt?.status === "tardanza"
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            : "bg-neutral-200 dark:bg-neutral-800 text-neutral-500"
                        }`}>
                          {todayAtt?.status ? todayAtt.status.toUpperCase() : "SIN MARCAR"}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuickAttendance(emp.id, "check_in")}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-white font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1"
                            title="Marcar hora de entrada actual"
                          >
                            <LogIn className="w-3 h-3" />
                            <span>Entrada</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleQuickAttendance(emp.id, "check_out")}
                            className="px-2.5 py-1.5 rounded-xl bg-apple-blue/15 hover:bg-apple-blue text-apple-blue hover:text-white font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1"
                            title="Marcar hora de salida actual"
                          >
                            <LogOut className="w-3 h-3" />
                            <span>Salida</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleQuickAttendance(emp.id, "add_overtime")}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-600 dark:text-amber-400 hover:text-white font-bold text-[11px] transition-all cursor-pointer"
                            title="Sumar 1 hora extra laborada"
                          >
                            +1h Extra
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 3: PLANILLA DE NÓMINA Y COLILLAS DE PAGO         */}
      {/* ======================================================== */}
      {activeTab === "payroll" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-200/80 dark:border-neutral-800">
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Generador de Planilla Quincenal / Mensual
              </h3>
              <p className="text-xs text-neutral-500">
                Cálculo automático de salario base, horas extras al 200%, bonos, deducción de INSS laboral (7%) y adelantos.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <input
                type="text"
                value={payrollPeriodLabel}
                onChange={(e) => setPayrollPeriodLabel(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold"
              />

              <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <input
                  type="checkbox"
                  checked={applyInss}
                  onChange={(e) => setApplyInss(e.target.checked)}
                  className="rounded text-teal-600"
                />
                <span>Retener INSS (7%)</span>
              </label>

              <button
                type="button"
                onClick={handleProcessFullPayroll}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Liquidar & Pagar Planilla</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[10px] font-mono text-neutral-400 uppercase">
                  <th className="py-3 px-2">Colaborador</th>
                  <th className="py-3 px-2 text-right">Salario Periodo</th>
                  <th className="py-3 px-2 text-right">(+) H. Extras</th>
                  <th className="py-3 px-2 text-right">(+) Bonos</th>
                  <th className="py-3 px-2 text-right">(-) INSS 7%</th>
                  <th className="py-3 px-2 text-right">(-) Adelantos/IR</th>
                  <th className="py-3 px-2 text-right">Neto a Pagar</th>
                  <th className="py-3 px-2 text-right">Colilla</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80 font-mono">
                {activeEmployees.map((emp) => {
                  const slip = calculateEmployeePayroll(emp);
                  return (
                    <tr key={emp.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40">
                      <td className="py-3.5 px-2 font-sans">
                        <span className="font-bold text-neutral-900 dark:text-white block">{emp.fullName}</span>
                        <span className="text-[10px] text-neutral-400 font-mono">{emp.code} • {emp.paymentFrequency.toUpperCase()}</span>
                      </td>
                      <td className="py-3.5 px-2 text-right font-semibold">
                        C$ {slip.baseSalaryPeriod.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-2 text-right text-emerald-600 dark:text-emerald-400">
                        +C$ {slip.overtimePay.toFixed(2)} ({slip.overtimeHours}h)
                      </td>
                      <td className="py-3.5 px-2 text-right text-emerald-600 dark:text-emerald-400">
                        +C$ {slip.bonuses.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-2 text-right text-rose-500">
                        -C$ {slip.inssDeduction.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-2 text-right text-amber-500">
                        -C$ {(slip.advancesDeduction + slip.irDeduction).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-2 text-right font-extrabold text-sm text-apple-blue">
                        C$ {slip.netPay.toLocaleString("es-NI", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-2 text-right font-sans">
                        <button
                          type="button"
                          onClick={() => setSelectedSlip({ employee: emp, record: slip })}
                          className="px-3 py-1.5 rounded-xl bg-apple-blue/10 hover:bg-apple-blue text-apple-blue hover:text-white font-bold text-[11px] transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Colilla</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 4: VACACIONES, PERMISOS Y ADELANTOS SALARIALES   */}
      {/* ======================================================== */}
      {activeTab === "movements" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80 dark:border-neutral-800">
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Historial de Adelantos de Sueldo, Bonos y Vacaciones
              </h3>
              <p className="text-xs text-neutral-500">
                Los adelantos y bonos aprobados se descuentan o suman automáticamente en el siguiente cierre de planilla.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowMovementModal(true)}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Movimiento</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {employees.flatMap((emp) =>
              emp.movements.map((m) => ({ emp, m }))
            ).map(({ emp, m }) => (
              <div
                key={m.id}
                className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-900 dark:text-white">{emp.fullName}</span>
                    <span className="px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-800 text-[10px] font-mono">
                      {m.type.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                  <p className="text-neutral-500">{m.reason} • Fecha: {m.date}</p>
                </div>

                <div className="flex items-center gap-3 font-mono">
                  {m.amount !== undefined && (
                    <span className={`font-extrabold text-sm ${
                      m.type === "bono_comision" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"
                    }`}>
                      {m.type === "bono_comision" ? "+" : "-"}C$ {m.amount.toFixed(2)}
                    </span>
                  )}
                  {m.days !== undefined && (
                    <span className="font-extrabold text-sm text-sky-500">
                      {m.days} días
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                    {m.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: CREAR / EDITAR EXPEDIENTE DE COLABORADOR        */}
      {/* ======================================================== */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-[#1c1c1e] text-neutral-900 dark:text-neutral-100 rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-teal-500" />
                <span>{editingEmployeeId ? "Editar Expediente Laboral" : "Registrar Nuevo Colaborador"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowEmployeeModal(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Nombre Completo:</label>
                  <input
                    type="text"
                    required
                    value={empForm.fullName}
                    onChange={(e) => setEmpForm({ ...empForm, fullName: e.target.value })}
                    placeholder="Ej. Luis Fernando Rocha"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Cargo / Puesto:</label>
                  <input
                    type="text"
                    required
                    value={empForm.position}
                    onChange={(e) => setEmpForm({ ...empForm, position: e.target.value })}
                    placeholder="Ej. Cajero / Asesor de Ventas"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Cédula de Identidad:</label>
                  <input
                    type="text"
                    required
                    value={empForm.dni}
                    onChange={(e) => setEmpForm({ ...empForm, dni: e.target.value })}
                    placeholder="081-000000-0000X"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Nº Asegurado INSS:</label>
                  <input
                    type="text"
                    value={empForm.inssNumber}
                    onChange={(e) => setEmpForm({ ...empForm, inssNumber: e.target.value })}
                    placeholder="2491840-2"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Teléfono:</label>
                  <input
                    type="text"
                    required
                    value={empForm.phone}
                    onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Departamento:</label>
                  <select
                    value={empForm.department}
                    onChange={(e) => setEmpForm({ ...empForm, department: e.target.value as EmployeeDepartment })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                  >
                    <option value="ventas_caja">Ventas & Caja</option>
                    <option value="bodega_logistica">Bodega & Logística</option>
                    <option value="administracion">Administración</option>
                    <option value="clinica_atencion">Clínica & Atención</option>
                    <option value="operaciones">Operaciones</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Salario Base Mensual (C$):</label>
                  <input
                    type="number"
                    required
                    value={empForm.baseMonthlySalary}
                    onChange={(e) => setEmpForm({ ...empForm, baseMonthlySalary: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono font-bold text-teal-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Frecuencia de Pago:</label>
                  <select
                    value={empForm.paymentFrequency}
                    onChange={(e) => setEmpForm({ ...empForm, paymentFrequency: e.target.value as PaymentFrequency })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                  >
                    <option value="quincenal">Quincenal (Cada 15 días)</option>
                    <option value="mensual">Mensual</option>
                    <option value="semanal">Semanal (Planilla)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Fecha de Ingreso:</label>
                  <input
                    type="date"
                    value={empForm.hireDate}
                    onChange={(e) => setEmpForm({ ...empForm, hireDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Banco / Medio de Pago:</label>
                  <input
                    type="text"
                    value={empForm.bankName}
                    onChange={(e) => setEmpForm({ ...empForm, bankName: e.target.value })}
                    placeholder="BAC / Banpro / Efectivo"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Estado Laboral:</label>
                  <select
                    value={empForm.status}
                    onChange={(e) => setEmpForm({ ...empForm, status: e.target.value as EmployeeStatus })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                  >
                    <option value="activo">Activo</option>
                    <option value="vacaciones">En Vacaciones</option>
                    <option value="subsidio">Subsidio / Permiso</option>
                    <option value="inactivo">Inactivo / Baja</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Contacto de Emergencia:</label>
                <input
                  type="text"
                  value={empForm.emergencyContact}
                  onChange={(e) => setEmpForm({ ...empForm, emergencyContact: e.target.value })}
                  placeholder="Nombre, parentesco y teléfono"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs cursor-pointer"
                >
                  Guardar Expediente
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmployeeModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-semibold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: REGISTRAR ADELANTO, BONO O VACACIONES           */}
      {/* ======================================================== */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#1c1c1e] text-neutral-900 dark:text-neutral-100 rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-bold">Registrar Movimiento de Personal</h3>
              <button
                type="button"
                onClick={() => setShowMovementModal(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMovement} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Colaborador:</label>
                <select
                  value={movForm.employeeId}
                  onChange={(e) => setMovForm({ ...movForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-semibold"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} ({e.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Tipo de Movimiento:</label>
                <select
                  value={movForm.type}
                  onChange={(e) => setMovForm({ ...movForm, type: e.target.value as HRAdvanceOrLeave["type"] })}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-semibold"
                >
                  <option value="adelanto_salarial">Adelanto Salarial / Vale de Caja (-)</option>
                  <option value="bono_comision">Bono o Comisión por Ventas (+)</option>
                  <option value="vacaciones">Solicitud de Vacaciones (Días)</option>
                  <option value="permiso_medico">Permiso Médico / Subsidio</option>
                </select>
              </div>

              {(movForm.type === "adelanto_salarial" || movForm.type === "bono_comision") ? (
                <div>
                  <label className="block font-semibold mb-1">Monto en Córdobas (C$):</label>
                  <input
                    type="number"
                    required
                    value={movForm.amount}
                    onChange={(e) => setMovForm({ ...movForm, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono font-bold"
                  />
                </div>
              ) : (
                <div>
                  <label className="block font-semibold mb-1">Cantidad de Días:</label>
                  <input
                    type="number"
                    required
                    value={movForm.days}
                    onChange={(e) => setMovForm({ ...movForm, days: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1">Motivo / Justificación:</label>
                <input
                  type="text"
                  required
                  value={movForm.reason}
                  onChange={(e) => setMovForm({ ...movForm, reason: e.target.value })}
                  placeholder="Ej. Adelanto quincenal autorizado..."
                  className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs cursor-pointer"
                >
                  Confirmar y Aplicar
                </button>
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-semibold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: COLILLA / COMPROBANTE DE PAGO DE NÓMINA         */}
      {/* ======================================================== */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-[#1c1c1e] text-neutral-900 dark:text-neutral-100 rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 no-print">
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-xs">
                <FileText className="w-4 h-4" />
                <span>Colilla Oficial de Pago de Nómina</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSlip(null)}
                className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Comprobante Imprimible en Térmica 80mm / 58mm */}
            <div
              id="thermal-receipt-printable-payroll"
              className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 font-mono text-xs border border-dashed border-neutral-300 dark:border-neutral-700 space-y-2 printable-thermal-ticket"
            >
              <div className="text-center pb-2 border-b border-dashed border-neutral-300 dark:border-neutral-700 space-y-0.5">
                <p className="font-extrabold text-sm uppercase">{tenant.name}</p>
                <p className="text-[10px] text-neutral-500">RUC: {tenant.taxId || "J031000049102"}</p>
                <p className="text-[10px] font-bold mt-1">COMPROBANTE DE PAGO DE NÓMINA</p>
                <p className="text-[10px] text-neutral-500">{selectedSlip.record.periodLabel}</p>
              </div>

              <div className="text-[11px] pb-2 border-b border-dashed border-neutral-300 dark:border-neutral-700 space-y-0.5">
                <p className="font-bold">COLABORADOR: {selectedSlip.employee.fullName}</p>
                <p className="text-[10px]">CÓDIGO: {selectedSlip.employee.code} • CÉD: {selectedSlip.employee.dni}</p>
                <p className="text-[10px]">CARGO: {selectedSlip.employee.position}</p>
                <p className="text-[10px]">INSS Nº: {selectedSlip.employee.inssNumber || "N/A"}</p>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Salario Base Periodo:</span>
                  <span>C$ {selectedSlip.record.baseSalaryPeriod.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>(+) Horas Extras ({selectedSlip.record.overtimeHours}h):</span>
                  <span>C$ {selectedSlip.record.overtimePay.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>(+) Bonos / Comisiones:</span>
                  <span>C$ {selectedSlip.record.bonuses.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-rose-600 dark:text-rose-400">
                  <span>(-) INSS Laboral (7%):</span>
                  <span>-C$ {selectedSlip.record.inssDeduction.toFixed(2)}</span>
                </div>
                {selectedSlip.record.irDeduction > 0 && (
                  <div className="flex justify-between text-rose-600 dark:text-rose-400">
                    <span>(-) Retención IR:</span>
                    <span>-C$ {selectedSlip.record.irDeduction.toFixed(2)}</span>
                  </div>
                )}
                {selectedSlip.record.advancesDeduction > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>(-) Adelantos de Sueldo:</span>
                    <span>-C$ {selectedSlip.record.advancesDeduction.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-sm pt-1.5 border-t border-dashed border-neutral-300 dark:border-neutral-700 text-apple-blue">
                  <span>NETO PAGADO:</span>
                  <span>C$ {selectedSlip.record.netPay.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-neutral-500">
                  <span>Equiv. USD (TC {tenant.exchangeRate}):</span>
                  <span>$ {(selectedSlip.record.netPay / tenant.exchangeRate).toFixed(2)} USD</span>
                </div>
              </div>

              <div className="pt-6 text-center space-y-1 border-t border-dashed border-neutral-300 dark:border-neutral-700">
                <div className="border-b border-neutral-400 w-44 mx-auto pt-4" />
                <p className="text-[10px] font-bold">FIRMA RECIBIDO CONFORME</p>
                <p className="text-[9px] text-neutral-400">{selectedSlip.employee.fullName}</p>
              </div>
            </div>

            <div className="flex gap-2 no-print">
              <button
                type="button"
                onClick={() =>
                  printThermalReceipt(
                    "thermal-receipt-printable-payroll",
                    tenant.ticketFormat,
                    `Colilla_${selectedSlip.employee.code}`
                  )
                }
                className="flex-1 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Colilla Térmica / PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedSlip(null)}
                className="py-2.5 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
