"use client";

import React, { useState } from "react";
import { 
  Stethoscope, 
  Smile, 
  Search, 
  Plus, 
  User, 
  Phone, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Receipt, 
  ChevronRight, 
  Activity, 
  ShieldAlert, 
  FileText, 
  Calendar, 
  Clock, 
  DollarSign,
  HeartPulse,
  Sparkles,
  Edit3,
  Thermometer
} from "lucide-react";
import { 
  ClinicalPatient, 
  ClinicalConsultation, 
  OdontogramTooth, 
  ToothCondition, 
  BloodGroup, 
  TenantSettings 
} from "@/types";
import { saveStoredClinicalPatients } from "@/lib/offlineStore";

interface ClinicalDentalManagerProps {
  tenant: TenantSettings;
  patients: ClinicalPatient[];
  setPatients: React.Dispatch<React.SetStateAction<ClinicalPatient[]>>;
  onNavigateToPOS?: () => void;
}

export const ClinicalDentalManager: React.FC<ClinicalDentalManagerProps> = ({
  tenant,
  patients,
  setPatients,
  onNavigateToPOS,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activePatient, setActivePatient] = useState<ClinicalPatient | null>(patients[0] || null);
  const [activeTab, setActiveTab] = useState<"odontogram" | "consultations" | "history" | "personal">("odontogram");

  // Modales
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [showNewConsultationModal, setShowNewConsultationModal] = useState(false);
  const [selectedToothToEdit, setSelectedToothToEdit] = useState<OdontogramTooth | null>(null);

  // Formulario nuevo paciente
  const [newPatientData, setNewPatientData] = useState({
    fullName: "",
    dni: "",
    birthDate: "1990-01-01",
    age: 36,
    gender: "masculino" as const,
    bloodType: "O+" as BloodGroup,
    phone: "",
    email: "",
    address: "",
    occupation: "",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelation: "Familiar",
    insuranceName: "",
    allergies: "",
    pathologies: "",
    currentMedication: "",
  });

  // Formulario nueva consulta
  const [newConsultationData, setNewConsultationData] = useState({
    specialty: "odontologia" as const,
    reason: "",
    bloodPressure: "120/80",
    heartRate: 75,
    temperature: 36.6,
    symptoms: "",
    diagnosis: "",
    procedureDone: "",
    treatment: "",
    prescription: "",
    doctorName: "Dra. Patricia Somarriba",
    cost: 500,
  });

  // Filtrado de pacientes
  const filteredPatients = patients.filter((patient) => {
    return (
      patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.dni.includes(searchTerm) ||
      patient.phone.includes(searchTerm)
    );
  });

  // Guardar nuevo paciente
  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientData.fullName.trim() || !newPatientData.dni.trim()) return;

    // Generar odontograma base
    const toothNumbers = [
      18, 17, 16, 15, 14, 13, 12, 11,
      21, 22, 23, 24, 25, 26, 27, 28,
      48, 47, 46, 45, 44, 43, 42, 41,
      31, 32, 33, 34, 35, 36, 37, 38,
    ];

    const newOdonto: OdontogramTooth[] = toothNumbers.map((num) => ({
      toothNumber: num,
      name: `Pieza ${num}`,
      condition: "sano",
    }));

    const allergiesArr = newPatientData.allergies
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    const pathologiesArr = newPatientData.pathologies
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const newPatient: ClinicalPatient = {
      id: `clin-${Date.now()}`,
      fullName: newPatientData.fullName.trim(),
      dni: newPatientData.dni.trim(),
      birthDate: newPatientData.birthDate,
      age: Number(newPatientData.age) || 30,
      gender: newPatientData.gender,
      bloodType: newPatientData.bloodType,
      phone: newPatientData.phone.trim(),
      email: newPatientData.email.trim() || undefined,
      address: newPatientData.address.trim() || undefined,
      occupation: newPatientData.occupation.trim() || undefined,
      emergencyContact: {
        name: newPatientData.emergencyName.trim() || "No especificado",
        phone: newPatientData.emergencyPhone.trim() || "",
        relation: newPatientData.emergencyRelation.trim() || "Contacto",
      },
      insuranceName: newPatientData.insuranceName.trim() || undefined,
      allergies: allergiesArr,
      pathologies: pathologiesArr,
      currentMedication: newPatientData.currentMedication.trim() || undefined,
      createdAt: new Date().toISOString().split("T")[0],
      lastVisitDate: new Date().toISOString().split("T")[0],
      status: "active",
      odontogram: newOdonto,
      consultations: [],
    };

    const updated = [newPatient, ...patients];
    setPatients(updated);
    saveStoredClinicalPatients(updated);
    setActivePatient(newPatient);
    setShowNewPatientModal(false);
  };

  // Guardar estado del diente en el odontograma
  const handleUpdateTooth = (updatedTooth: OdontogramTooth) => {
    if (!activePatient) return;

    const updatedOdonto = activePatient.odontogram.map((t) =>
      t.toothNumber === updatedTooth.toothNumber ? updatedTooth : t
    );

    const updatedPatient: ClinicalPatient = {
      ...activePatient,
      odontogram: updatedOdonto,
    };

    const updatedAll = patients.map((p) =>
      p.id === activePatient.id ? updatedPatient : p
    );
    setPatients(updatedAll);
    saveStoredClinicalPatients(updatedAll);
    setActivePatient(updatedPatient);
    setSelectedToothToEdit(null);
  };

  // Registrar nueva consulta clínica
  const handleAddConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient || !newConsultationData.reason.trim()) return;

    const newConsult: ClinicalConsultation = {
      id: `clin-cons-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      specialty: newConsultationData.specialty,
      reason: newConsultationData.reason.trim(),
      vitals: {
        bloodPressure: newConsultationData.bloodPressure.trim(),
        heartRate: Number(newConsultationData.heartRate) || 75,
        temperature: Number(newConsultationData.temperature) || 36.6,
      },
      symptoms: newConsultationData.symptoms.trim(),
      diagnosis: newConsultationData.diagnosis.trim(),
      procedureDone: newConsultationData.procedureDone.trim() || undefined,
      treatment: newConsultationData.treatment.trim(),
      prescription: newConsultationData.prescription.trim() || undefined,
      doctorName: newConsultationData.doctorName.trim(),
      cost: Number(newConsultationData.cost) || 0,
    };

    const updatedPatient: ClinicalPatient = {
      ...activePatient,
      lastVisitDate: new Date().toISOString().split("T")[0],
      consultations: [newConsult, ...activePatient.consultations],
    };

    const updatedAll = patients.map((p) =>
      p.id === activePatient.id ? updatedPatient : p
    );
    setPatients(updatedAll);
    saveStoredClinicalPatients(updatedAll);
    setActivePatient(updatedPatient);
    setShowNewConsultationModal(false);
  };

  // Ayudante de color y estado dental
  const getToothVisualInfo = (condition: ToothCondition) => {
    switch (condition) {
      case "caries":
        return {
          bg: "bg-apple-red/20 text-apple-red border-apple-red",
          pill: "bg-apple-red/10 text-apple-red",
          label: "Caries",
          dot: "#ef4444",
        };
      case "obturado":
        return {
          bg: "bg-apple-blue/20 text-apple-blue border-apple-blue",
          pill: "bg-apple-blue/10 text-apple-blue",
          label: "Obturado / Resina",
          dot: "#007aff",
        };
      case "endodoncia":
        return {
          bg: "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500",
          pill: "bg-purple-500/10 text-purple-600",
          label: "Endodoncia",
          dot: "#a855f7",
        };
      case "ausente":
        return {
          bg: "bg-neutral-300 dark:bg-neutral-800 text-neutral-400 border-neutral-400 line-through opacity-60",
          pill: "bg-neutral-200 dark:bg-neutral-800 text-neutral-400",
          label: "Ausente / Extraído",
          dot: "#9ca3af",
        };
      case "corona":
        return {
          bg: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500",
          pill: "bg-amber-500/10 text-amber-600",
          label: "Corona / Prótesis",
          dot: "#f59e0b",
        };
      case "implante":
        return {
          bg: "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500",
          pill: "bg-cyan-500/10 text-cyan-600",
          label: "Implante",
          dot: "#06b6d4",
        };
      case "extraccion_indicada":
        return {
          bg: "bg-apple-orange/20 text-apple-orange border-apple-orange",
          pill: "bg-apple-orange/10 text-apple-orange",
          label: "Extracción Indicada",
          dot: "#f97316",
        };
      default:
        return {
          bg: "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700",
          pill: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          label: "Sano",
          dot: "#10b981",
        };
    }
  };

  // Cuadrantes dentales
  const q1 = activePatient?.odontogram.filter((t) => t.toothNumber >= 11 && t.toothNumber <= 18).reverse() || [];
  const q2 = activePatient?.odontogram.filter((t) => t.toothNumber >= 21 && t.toothNumber <= 28) || [];
  const q4 = activePatient?.odontogram.filter((t) => t.toothNumber >= 41 && t.toothNumber <= 48).reverse() || [];
  const q3 = activePatient?.odontogram.filter((t) => t.toothNumber >= 31 && t.toothNumber <= 38) || [];

  // Presupuesto pendiente en odontograma
  const pendingDentalBudget = activePatient?.odontogram.reduce(
    (acc, t) => acc + (t.estimatedCost || 0),
    0
  ) || 0;

  return (
    <div className="space-y-6">
      
      {/* 1. Cabecera Principal */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-inner">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Clínica & Odontología // Historias Clínicas
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[10px] font-mono font-semibold border border-teal-500/20">
                CLINICAL SUITE
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Expedientes médicos confidenciales, antecedentes patológicos, recetas y odontograma gráfico interactivo.
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-4 px-4 py-2 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700/60 text-xs font-mono">
            <div>
              <span className="text-[10px] text-neutral-400 uppercase block">Pacientes</span>
              <span className="font-bold text-neutral-800 dark:text-neutral-200">{patients.length}</span>
            </div>
            <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700" />
            <div>
              <span className="text-[10px] text-neutral-400 uppercase block">Consultas Realizadas</span>
              <span className="font-bold text-apple-blue">
                {patients.reduce((acc, p) => acc + p.consultations.length, 0)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowNewPatientModal(true)}
            className="px-4 py-2.5 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-all shadow-md shadow-teal-600/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Paciente</span>
          </button>
        </div>
      </div>

      {/* 2. Layout Dividido: Directorio & Expediente */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Columna Izquierda: Directorio de Pacientes */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-3">
            
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre, cédula o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/70 border border-transparent focus:border-teal-500 text-xs text-neutral-800 dark:text-white placeholder-neutral-400 focus:outline-none transition-all font-mono"
              />
            </div>

            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
              {filteredPatients.length === 0 ? (
                <div className="text-center py-10 text-neutral-400 text-xs">
                  No se encontraron pacientes.
                </div>
              ) : (
                filteredPatients.map((pat) => {
                  const isSelected = activePatient?.id === pat.id;
                  const hasAllergies = pat.allergies.length > 0;

                  return (
                    <div
                      key={pat.id}
                      onClick={() => setActivePatient(pat)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-teal-500/10 border-teal-500 ring-1 ring-teal-500/30 shadow-sm"
                          : "bg-neutral-50/60 dark:bg-neutral-900/40 border-neutral-200/70 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 font-bold text-sm flex items-center justify-center">
                          {pat.fullName[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-neutral-900 dark:text-white">
                              {pat.fullName}
                            </span>
                            {hasAllergies && (
                              <span className="w-2 h-2 rounded-full bg-apple-red animate-pulse" title="Tiene alergias" />
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-500 font-mono">
                            DNI: {pat.dni} • {pat.age}a • {pat.bloodType}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5" />
                            <span>{pat.phone}</span>
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>

        {/* Columna Derecha: Expediente Clínico Completo */}
        <div className="lg:col-span-8">
          {activePatient ? (
            <div className="p-6 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-6">
              
              {/* Tarjeta de Identidad & Alerta Médica */}
              <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-teal-600/30">
                      {activePatient.fullName[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                          {activePatient.fullName}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[10px] font-mono font-bold">
                          GRUPO: {activePatient.bloodType}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-500 font-mono mt-0.5">
                        Cédula: {activePatient.dni} • {activePatient.age} años • Género: {activePatient.gender}
                      </div>
                    </div>
                  </div>

                  {onNavigateToPOS && (
                    <button
                      type="button"
                      onClick={onNavigateToPOS}
                      className="px-3.5 py-1.5 rounded-full bg-apple-green hover:bg-apple-green/90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Cobrar Consulta en POS</span>
                    </button>
                  )}
                </div>

                {/* Banner de Alergias & Antecedentes de Alto Riesgo */}
                {activePatient.allergies.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-apple-red/10 border border-apple-red/30 flex items-center gap-2 text-xs text-apple-red font-semibold">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>ALERTA MÉDICA: Alérgico a {activePatient.allergies.join(", ")}</span>
                  </div>
                )}
              </div>

              {/* Tabs de Navegación del Expediente */}
              <div className="border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-6 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab("odontogram")}
                  className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === "odontogram"
                      ? "border-teal-500 text-teal-600 dark:text-teal-400 font-bold"
                      : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
                  }`}
                >
                  <Smile className="w-4 h-4" />
                  <span>Odontograma Interactivo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("consultations")}
                  className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === "consultations"
                      ? "border-teal-500 text-teal-600 dark:text-teal-400 font-bold"
                      : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  <span>Consultas & Tratamientos ({activePatient.consultations.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("history")}
                  className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === "history"
                      ? "border-teal-500 text-teal-600 dark:text-teal-400 font-bold"
                      : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Anamnesis & Antecedentes</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("personal")}
                  className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === "personal"
                      ? "border-teal-500 text-teal-600 dark:text-teal-400 font-bold"
                      : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Ficha & Contacto</span>
                </button>
              </div>

              {/* ======================================================== */}
              {/* TAB 1: ODONTOGRAMA INTERACTIVO                           */}
              {/* ======================================================== */}
              {activeTab === "odontogram" && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
                        Odontograma Anatómico Internacional (FDI 32 Piezas)
                      </h4>
                      <p className="text-[11px] text-neutral-500">
                        Haz clic en cualquier diente para inspeccionar o cambiar su condición clínica.
                      </p>
                    </div>

                    {pendingDentalBudget > 0 && (
                      <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 text-xs font-mono font-bold flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Presupuesto Estimado: C$ {pendingDentalBudget.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  {/* Leyenda de Odontología */}
                  <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/80 dark:border-neutral-800 flex flex-wrap items-center gap-4 text-[11px] font-mono">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Sano
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-apple-red" /> Caries
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-apple-blue" /> Obturado (Resina)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Endodoncia
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Corona / Prótesis
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Implante
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-neutral-400" /> Ausente
                    </span>
                  </div>

                  {/* Cuadrantes Odontológicos Visuales */}
                  <div className="p-6 rounded-3xl bg-neutral-100/60 dark:bg-[#15161b] border border-neutral-200/80 dark:border-neutral-800 space-y-6">
                    
                    {/* Arcada Superior */}
                    <div>
                      <div className="text-center text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-2">
                        ▲ Arcada Superior (Maxilar)
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        
                        {/* Cuadrante 1: 18 - 11 */}
                        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                          {q1.map((tooth) => {
                            const visual = getToothVisualInfo(tooth.condition);
                            return (
                              <button
                                key={tooth.toothNumber}
                                type="button"
                                onClick={() => setSelectedToothToEdit(tooth)}
                                title={`${tooth.name} - ${visual.label}`}
                                className={`w-8 h-10 sm:w-10 sm:h-12 rounded-xl border flex flex-col items-center justify-between p-1 transition-all hover:scale-105 ${visual.bg}`}
                              >
                                <span className="text-[10px] font-mono font-bold">{tooth.toothNumber}</span>
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: visual.dot }} />
                              </button>
                            );
                          })}
                        </div>

                        {/* Cuadrante 2: 21 - 28 */}
                        <div className="flex items-center justify-start gap-1.5 sm:gap-2">
                          {q2.map((tooth) => {
                            const visual = getToothVisualInfo(tooth.condition);
                            return (
                              <button
                                key={tooth.toothNumber}
                                type="button"
                                onClick={() => setSelectedToothToEdit(tooth)}
                                title={`${tooth.name} - ${visual.label}`}
                                className={`w-8 h-10 sm:w-10 sm:h-12 rounded-xl border flex flex-col items-center justify-between p-1 transition-all hover:scale-105 ${visual.bg}`}
                              >
                                <span className="text-[10px] font-mono font-bold">{tooth.toothNumber}</span>
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: visual.dot }} />
                              </button>
                            );
                          })}
                        </div>

                      </div>
                    </div>

                    <div className="h-px bg-neutral-300 dark:bg-neutral-800 w-full" />

                    {/* Arcada Inferior */}
                    <div>
                      <div className="grid grid-cols-2 gap-4">
                        
                        {/* Cuadrante 4: 48 - 41 */}
                        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                          {q4.map((tooth) => {
                            const visual = getToothVisualInfo(tooth.condition);
                            return (
                              <button
                                key={tooth.toothNumber}
                                type="button"
                                onClick={() => setSelectedToothToEdit(tooth)}
                                title={`${tooth.name} - ${visual.label}`}
                                className={`w-8 h-10 sm:w-10 sm:h-12 rounded-xl border flex flex-col items-center justify-between p-1 transition-all hover:scale-105 ${visual.bg}`}
                              >
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: visual.dot }} />
                                <span className="text-[10px] font-mono font-bold">{tooth.toothNumber}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Cuadrante 3: 31 - 38 */}
                        <div className="flex items-center justify-start gap-1.5 sm:gap-2">
                          {q3.map((tooth) => {
                            const visual = getToothVisualInfo(tooth.condition);
                            return (
                              <button
                                key={tooth.toothNumber}
                                type="button"
                                onClick={() => setSelectedToothToEdit(tooth)}
                                title={`${tooth.name} - ${visual.label}`}
                                className={`w-8 h-10 sm:w-10 sm:h-12 rounded-xl border flex flex-col items-center justify-between p-1 transition-all hover:scale-105 ${visual.bg}`}
                              >
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: visual.dot }} />
                                <span className="text-[10px] font-mono font-bold">{tooth.toothNumber}</span>
                              </button>
                            );
                          })}
                        </div>

                      </div>
                      <div className="text-center text-[10px] font-mono text-neutral-400 uppercase tracking-widest mt-2">
                        ▼ Arcada Inferior (Mandíbula)
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 2: CONSULTAS & EVOLUCIONES CLÍNICAS                  */}
              {/* ======================================================== */}
              {activeTab === "consultations" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider font-mono">
                      Consultas Médicas & Tratamientos Realizados
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowNewConsultationModal(true)}
                      className="px-3 py-1.5 rounded-full bg-teal-600/10 text-teal-600 dark:text-teal-400 hover:bg-teal-600 hover:text-white text-xs font-semibold transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nueva Consulta</span>
                    </button>
                  </div>

                  {activePatient.consultations.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl text-xs text-neutral-400">
                      No hay consultas médicas registradas para este paciente.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activePatient.consultations.map((cons) => (
                        <div
                          key={cons.id}
                          className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/80 dark:border-neutral-800 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white">
                                {cons.date}
                              </span>
                              <span className="text-neutral-300 dark:text-neutral-700">•</span>
                              <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold capitalize">
                                {cons.specialty}
                              </span>
                              <span className="text-neutral-300 dark:text-neutral-700">•</span>
                              <span className="text-xs text-neutral-600 dark:text-neutral-400">
                                {cons.doctorName}
                              </span>
                            </div>
                            <span className="text-xs font-mono font-bold text-apple-green">
                              C$ {cons.cost.toFixed(2)}
                            </span>
                          </div>

                          <div className="text-xs">
                            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                              Motivo:{" "}
                            </span>
                            <span className="text-neutral-600 dark:text-neutral-400">
                              {cons.reason}
                            </span>
                          </div>

                          {cons.vitals && (
                            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-neutral-500 bg-white dark:bg-neutral-800 p-2 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60">
                              {cons.vitals.bloodPressure && <span>P/A: {cons.vitals.bloodPressure} mmHg</span>}
                              {cons.vitals.heartRate && <span>• FC: {cons.vitals.heartRate} lpm</span>}
                              {cons.vitals.temperature && <span>• Temp: {cons.vitals.temperature}°C</span>}
                            </div>
                          )}

                          <div className="text-xs space-y-1">
                            <div>
                              <span className="font-semibold text-teal-600 dark:text-teal-400">
                                Diagnóstico:{" "}
                              </span>
                              <span className="text-neutral-700 dark:text-neutral-300">
                                {cons.diagnosis}
                              </span>
                            </div>
                            {cons.procedureDone && (
                              <div>
                                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                                  Procedimiento:{" "}
                                </span>
                                <span className="text-neutral-600 dark:text-neutral-400">
                                  {cons.procedureDone}
                                </span>
                              </div>
                            )}
                            <div>
                              <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                                Plan de Tratamiento:{" "}
                              </span>
                              <span className="text-neutral-600 dark:text-neutral-400">
                                {cons.treatment}
                              </span>
                            </div>
                            {cons.prescription && (
                              <div className="p-2.5 rounded-xl bg-teal-500/5 border border-teal-500/20 text-neutral-800 dark:text-neutral-200 text-xs">
                                <span className="font-bold text-teal-600 dark:text-teal-400 block mb-0.5">
                                  💊 Receta Médica / Indicaciones:
                                </span>
                                {cons.prescription}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 3: ANAMNESIS & ANTECEDENTES                          */}
              {/* ======================================================== */}
              {activeTab === "history" && (
                <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/80 dark:border-neutral-800 space-y-4 text-xs">
                  <div className="font-bold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
                    Antecedentes Patológicos & Factores de Riesgo
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-neutral-400 block text-[10px] font-mono uppercase">Alergias Conocidas</span>
                      {activePatient.allergies.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {activePatient.allergies.map((alg, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-apple-red/10 text-apple-red font-bold text-xs border border-apple-red/20">
                              {alg}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-neutral-500 font-mono">Sin alergias declaradas</span>
                      )}
                    </div>

                    <div>
                      <span className="text-neutral-400 block text-[10px] font-mono uppercase">Enfermedades Crónicas</span>
                      {activePatient.pathologies.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {activePatient.pathologies.map((pat, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-bold text-xs border border-amber-500/20">
                              {pat}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-neutral-500 font-mono">Sin patologías de base</span>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <span className="text-neutral-400 block text-[10px] font-mono uppercase">Medicación Habitual</span>
                      <span className="text-neutral-700 dark:text-neutral-300 font-mono mt-0.5 block">
                        {activePatient.currentMedication || "Ningún medicamento crónico"}
                      </span>
                    </div>

                    <div className="md:col-span-2">
                      <span className="text-neutral-400 block text-[10px] font-mono uppercase">Antecedentes Quirúrgicos</span>
                      <span className="text-neutral-700 dark:text-neutral-300 mt-0.5 block">
                        {activePatient.surgicalHistory || "Sin antecedentes quirúrgicos relevantes"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 4: FICHA PERSONAL & CONTACTO                         */}
              {/* ======================================================== */}
              {activeTab === "personal" && (
                <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/80 dark:border-neutral-800 space-y-4 text-xs">
                  <div className="font-bold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
                    Datos del Paciente y Contacto de Emergencia
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-neutral-400 block text-[10px] font-mono uppercase">Teléfono Móvil</span>
                      <a href={`tel:${activePatient.phone}`} className="font-bold text-teal-600 flex items-center gap-1 hover:underline">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{activePatient.phone}</span>
                      </a>
                    </div>

                    <div>
                      <span className="text-neutral-400 block text-[10px] font-mono uppercase">Correo Electrónico</span>
                      <span className="font-mono text-neutral-700 dark:text-neutral-300">
                        {activePatient.email || "No registrado"}
                      </span>
                    </div>

                    <div>
                      <span className="text-neutral-400 block text-[10px] font-mono uppercase">Ocupación</span>
                      <span className="text-neutral-700 dark:text-neutral-300">
                        {activePatient.occupation || "No especificada"}
                      </span>
                    </div>

                    <div>
                      <span className="text-neutral-400 block text-[10px] font-mono uppercase">Seguro Médico / Póliza</span>
                      <span className="font-mono text-neutral-700 dark:text-neutral-300">
                        {activePatient.insuranceName || "Particular (Sin seguro)"}
                      </span>
                    </div>

                    <div className="md:col-span-2">
                      <span className="text-neutral-400 block text-[10px] font-mono uppercase">Dirección Domiciliar</span>
                      <span className="text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>{activePatient.address || "No especificada"}</span>
                      </span>
                    </div>

                    <div className="md:col-span-2 p-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                      <span className="text-neutral-400 block text-[10px] font-mono uppercase">Contacto de Emergencia</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-bold text-neutral-800 dark:text-neutral-200">
                          {activePatient.emergencyContact.name} ({activePatient.emergencyContact.relation})
                        </span>
                        <a href={`tel:${activePatient.emergencyContact.phone}`} className="text-teal-600 font-mono font-semibold hover:underline">
                          {activePatient.emergencyContact.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200 dark:border-neutral-800 text-neutral-400 text-xs">
              Selecciona un paciente del directorio izquierdo para visualizar su expediente clínico.
            </div>
          )}
        </div>

      </div>

      {/* ======================================================== */}
      {/* MODAL: EDITAR CONDICIÓN DE DIENTE EN ODONTOGRAMA         */}
      {/* ======================================================== */}
      {selectedToothToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                  Editar {selectedToothToEdit.name} (#{selectedToothToEdit.toothNumber})
                </h3>
                <span className="text-[11px] text-neutral-400 font-mono">
                  Paciente: {activePatient?.fullName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedToothToEdit(null)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Estado / Condición</label>
                <select
                  value={selectedToothToEdit.condition}
                  onChange={(e) =>
                    setSelectedToothToEdit({
                      ...selectedToothToEdit,
                      condition: e.target.value as ToothCondition,
                    })
                  }
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-medium focus:outline-none"
                >
                  <option value="sano">🟢 Sano</option>
                  <option value="caries">🔴 Caries activa</option>
                  <option value="obturado">🔵 Obturado / Resina compuesta</option>
                  <option value="endodoncia">🟣 Endodoncia / Conductos</option>
                  <option value="corona">🟡 Corona / Prótesis fija</option>
                  <option value="implante">🔷 Implante dental</option>
                  <option value="extraccion_indicada">🟠 Extracción indicada</option>
                  <option value="ausente">⚪ Ausente / Diente perdido</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Notas Clínicas del Diente</label>
                <textarea
                  rows={2}
                  placeholder="Ej. Caries en superficie oclusal, requiere calza..."
                  value={selectedToothToEdit.notes || ""}
                  onChange={(e) =>
                    setSelectedToothToEdit({
                      ...selectedToothToEdit,
                      notes: e.target.value,
                    })
                  }
                  className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Costo Estimado de Tratamiento (C$)</label>
                <input
                  type="number"
                  value={selectedToothToEdit.estimatedCost || 0}
                  onChange={(e) =>
                    setSelectedToothToEdit({
                      ...selectedToothToEdit,
                      estimatedCost: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono font-bold text-apple-green"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setSelectedToothToEdit(null)}
                  className="px-4 py-2 rounded-full text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateTooth(selectedToothToEdit)}
                  className="px-5 py-2 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-md shadow-teal-600/20"
                >
                  Guardar Pieza
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: REGISTRAR NUEVO PACIENTE                           */}
      {/* ======================================================== */}
      {showNewPatientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                  Registrar Nuevo Paciente
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewPatientModal(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Roberto Carlos Pérez"
                    value={newPatientData.fullName}
                    onChange={(e) => setNewPatientData({ ...newPatientData, fullName: e.target.value })}
                    className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Cédula / Identificación</label>
                  <input
                    type="text"
                    required
                    placeholder="081-120590-0001A"
                    value={newPatientData.dni}
                    onChange={(e) => setNewPatientData({ ...newPatientData, dni: e.target.value })}
                    className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Teléfono Móvil</label>
                  <input
                    type="text"
                    required
                    placeholder="+505 8888-0000"
                    value={newPatientData.phone}
                    onChange={(e) => setNewPatientData({ ...newPatientData, phone: e.target.value })}
                    className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Edad</label>
                  <input
                    type="number"
                    value={newPatientData.age}
                    onChange={(e) => setNewPatientData({ ...newPatientData, age: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Tipo de Sangre</label>
                  <select
                    value={newPatientData.bloodType}
                    onChange={(e) => setNewPatientData({ ...newPatientData, bloodType: e.target.value as BloodGroup })}
                    className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Alergias a Medicamentos (Separar por comas)</label>
                  <input
                    type="text"
                    placeholder="Ej. Penicilina, Sulfas, Látex..."
                    value={newPatientData.allergies}
                    onChange={(e) => setNewPatientData({ ...newPatientData, allergies: e.target.value })}
                    className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-red/40 text-apple-red focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Enfermedades de Base / Patologías</label>
                  <input
                    type="text"
                    placeholder="Ej. Hipertensión, Diabetes Tipo 2..."
                    value={newPatientData.pathologies}
                    onChange={(e) => setNewPatientData({ ...newPatientData, pathologies: e.target.value })}
                    className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowNewPatientModal(false)}
                  className="px-4 py-2 rounded-full text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-md shadow-teal-600/20"
                >
                  Guardar Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: REGISTRAR CONSULTA MÉDICA / DENTAL                */}
      {/* ======================================================== */}
      {showNewConsultationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                  Nueva Consulta para {activePatient?.fullName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewConsultationModal(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddConsultation} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Especialidad</label>
                  <select
                    value={newConsultationData.specialty}
                    onChange={(e) => setNewConsultationData({ ...newConsultationData, specialty: e.target.value as any })}
                    className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                  >
                    <option value="odontologia">Odontología / Dental</option>
                    <option value="medicina_general">Medicina General</option>
                    <option value="pediatria">Pediatría</option>
                    <option value="control">Control de Rutina</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Presión Arterial</label>
                  <input
                    type="text"
                    placeholder="120/80"
                    value={newConsultationData.bloodPressure}
                    onChange={(e) => setNewConsultationData({ ...newConsultationData, bloodPressure: e.target.value })}
                    className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Motivo de Consulta</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Dolor dental agudo, revisión periódica..."
                  value={newConsultationData.reason}
                  onChange={(e) => setNewConsultationData({ ...newConsultationData, reason: e.target.value })}
                  className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                />
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Diagnóstico Clínico</label>
                <input
                  type="text"
                  required
                  placeholder="Diagnóstico médico / dental"
                  value={newConsultationData.diagnosis}
                  onChange={(e) => setNewConsultationData({ ...newConsultationData, diagnosis: e.target.value })}
                  className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                />
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Procedimiento Realizado</label>
                <textarea
                  rows={2}
                  placeholder="Detalles del procedimiento efectuado..."
                  value={newConsultationData.procedureDone}
                  onChange={(e) => setNewConsultationData({ ...newConsultationData, procedureDone: e.target.value })}
                  className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                />
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Plan de Tratamiento</label>
                <textarea
                  rows={2}
                  placeholder="Indicaciones terapéuticas y próximas fases..."
                  value={newConsultationData.treatment}
                  onChange={(e) => setNewConsultationData({ ...newConsultationData, treatment: e.target.value })}
                  className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                />
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Receta de Medicamentos</label>
                <textarea
                  rows={2}
                  placeholder="Fármaco, dosis, vía de administración y duración..."
                  value={newConsultationData.prescription}
                  onChange={(e) => setNewConsultationData({ ...newConsultationData, prescription: e.target.value })}
                  className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Médico / Odontólogo</label>
                  <input
                    type="text"
                    value={newConsultationData.doctorName}
                    onChange={(e) => setNewConsultationData({ ...newConsultationData, doctorName: e.target.value })}
                    className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Costo de Consulta (C$)</label>
                  <input
                    type="number"
                    value={newConsultationData.cost}
                    onChange={(e) => setNewConsultationData({ ...newConsultationData, cost: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono font-bold text-apple-green"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowNewConsultationModal(false)}
                  className="px-4 py-2 rounded-full text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-md shadow-teal-600/20"
                >
                  Registrar Consulta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
