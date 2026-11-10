"use client";

import React, { useState } from "react";
import { 
  Dog, 
  Cat, 
  HeartPulse, 
  Syringe, 
  Calendar, 
  Search, 
  Plus, 
  Phone, 
  User, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  FileText, 
  Thermometer, 
  Receipt, 
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Activity,
  Edit3
} from "lucide-react";
import { 
  PetPatient, 
  VeterinaryConsultation, 
  VeterinaryVaccine, 
  VeterinaryDeworming, 
  TenantSettings, 
  PetSpecies, 
  PetGender, 
  PetReproductiveStatus 
} from "@/types";
import { saveStoredVetPatients } from "@/lib/offlineStore";

interface VeterinaryManagerProps {
  tenant: TenantSettings;
  patients: PetPatient[];
  setPatients: React.Dispatch<React.SetStateAction<PetPatient[]>>;
  onNavigateToPOS?: () => void;
}

export const VeterinaryManager: React.FC<VeterinaryManagerProps> = ({
  tenant,
  patients,
  setPatients,
  onNavigateToPOS,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState<string>("all");
  const [activePatient, setActivePatient] = useState<PetPatient | null>(patients[0] || null);
  const [activeTab, setActiveTab] = useState<"consultations" | "vaccines" | "deworming" | "owner">("consultations");

  // Modales
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [showNewConsultationModal, setShowNewConsultationModal] = useState(false);
  const [showNewVaccineModal, setShowNewVaccineModal] = useState(false);
  const [showNewDewormingModal, setShowNewDewormingModal] = useState(false);

  // Estados de formularios
  const [newPatientData, setNewPatientData] = useState({
    name: "",
    species: "canino" as PetSpecies,
    breed: "",
    sex: "macho" as PetGender,
    ageYears: 1,
    ageMonths: 0,
    weightKg: 5,
    color: "",
    microchip: "",
    allergies: "",
    reproductiveStatus: "entero" as PetReproductiveStatus,
    ownerName: "",
    ownerPhone: "",
    ownerDni: "",
    ownerEmail: "",
    ownerAddress: "",
  });

  const [newConsultationData, setNewConsultationData] = useState({
    reason: "",
    anamnesis: "",
    weightKg: activePatient?.weightKg || 5,
    temperatureC: 38.5,
    heartRateBpm: 90,
    respiratoryRateRpm: 22,
    bodyCondition: "3_ideal" as const,
    diagnosis: "",
    treatment: "",
    prescription: "",
    veterinarianName: "Dra. Lucía Mendoza",
    cost: 450,
    notes: "",
  });

  const [newVaccineData, setNewVaccineData] = useState({
    name: "Antirrábica",
    applicationDate: new Date().toISOString().split("T")[0],
    nextDueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    batchNumber: "VAC-" + Math.floor(1000 + Math.random() * 9000),
    veterinarian: "Dra. Lucía Mendoza",
  });

  const [newDewormingData, setNewDewormingData] = useState({
    productName: "Simparica Trio",
    type: "both" as const,
    applicationDate: new Date().toISOString().split("T")[0],
    nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    dose: "1 Tableta masticable",
  });

  // Filtrado de pacientes
  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.ownerPhone.includes(searchTerm);

    const matchesSpecies =
      selectedSpecies === "all" || patient.species === selectedSpecies;

    return matchesSearch && matchesSpecies;
  });

  // Métricas
  const totalConsultations = patients.reduce(
    (acc, p) => acc + p.consultations.length,
    0
  );
  const pendingVaccines = patients.reduce(
    (acc, p) =>
      acc +
      p.vaccines.filter((v) => v.status === "pending" || v.status === "overdue")
        .length,
    0
  );

  // Guardar nuevo paciente
  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientData.name.trim() || !newPatientData.ownerName.trim()) return;

    const newPet: PetPatient = {
      id: `vet-${Date.now()}`,
      name: newPatientData.name.trim(),
      species: newPatientData.species,
      breed: newPatientData.breed.trim() || "Mestizo",
      sex: newPatientData.sex,
      ageYears: Number(newPatientData.ageYears) || 0,
      ageMonths: Number(newPatientData.ageMonths) || 0,
      weightKg: Number(newPatientData.weightKg) || 1,
      color: newPatientData.color.trim() || "No especificado",
      microchip: newPatientData.microchip.trim() || undefined,
      allergies: newPatientData.allergies.trim() || undefined,
      reproductiveStatus: newPatientData.reproductiveStatus,
      ownerName: newPatientData.ownerName.trim(),
      ownerPhone: newPatientData.ownerPhone.trim(),
      ownerDni: newPatientData.ownerDni.trim() || undefined,
      ownerEmail: newPatientData.ownerEmail.trim() || undefined,
      ownerAddress: newPatientData.ownerAddress.trim() || undefined,
      createdAt: new Date().toISOString().split("T")[0],
      lastVisitDate: new Date().toISOString().split("T")[0],
      status: "active",
      consultations: [],
      vaccines: [],
      dewormings: [],
    };

    const updated = [newPet, ...patients];
    setPatients(updated);
    saveStoredVetPatients(updated);
    setActivePatient(newPet);
    setShowNewPatientModal(false);
  };

  // Guardar nueva consulta
  const handleAddConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient || !newConsultationData.reason.trim()) return;

    const newConsult: VeterinaryConsultation = {
      id: `cons-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      reason: newConsultationData.reason.trim(),
      anamnesis: newConsultationData.anamnesis.trim(),
      vitals: {
        weightKg: Number(newConsultationData.weightKg) || activePatient.weightKg,
        temperatureC: Number(newConsultationData.temperatureC) || 38.5,
        heartRateBpm: Number(newConsultationData.heartRateBpm) || 90,
        respiratoryRateRpm: Number(newConsultationData.respiratoryRateRpm) || 20,
        bodyCondition: newConsultationData.bodyCondition,
      },
      diagnosis: newConsultationData.diagnosis.trim(),
      treatment: newConsultationData.treatment.trim(),
      prescription: newConsultationData.prescription.trim() || undefined,
      veterinarianName: newConsultationData.veterinarianName.trim(),
      cost: Number(newConsultationData.cost) || 0,
      notes: newConsultationData.notes.trim() || undefined,
    };

    const updatedPatient: PetPatient = {
      ...activePatient,
      weightKg: Number(newConsultationData.weightKg) || activePatient.weightKg,
      lastVisitDate: new Date().toISOString().split("T")[0],
      consultations: [newConsult, ...activePatient.consultations],
    };

    const updatedAll = patients.map((p) =>
      p.id === activePatient.id ? updatedPatient : p
    );
    setPatients(updatedAll);
    saveStoredVetPatients(updatedAll);
    setActivePatient(updatedPatient);
    setShowNewConsultationModal(false);
  };

  // Guardar nueva vacuna
  const handleAddVaccine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient || !newVaccineData.name.trim()) return;

    const newVac: VeterinaryVaccine = {
      id: `vac-${Date.now()}`,
      name: newVaccineData.name.trim(),
      applicationDate: newVaccineData.applicationDate,
      nextDueDate: newVaccineData.nextDueDate,
      batchNumber: newVaccineData.batchNumber.trim(),
      veterinarian: newVaccineData.veterinarian.trim(),
      status: "applied",
    };

    const updatedPatient: PetPatient = {
      ...activePatient,
      vaccines: [newVac, ...activePatient.vaccines],
    };

    const updatedAll = patients.map((p) =>
      p.id === activePatient.id ? updatedPatient : p
    );
    setPatients(updatedAll);
    saveStoredVetPatients(updatedAll);
    setActivePatient(updatedPatient);
    setShowNewVaccineModal(false);
  };

  // Guardar nueva desparasitación
  const handleAddDeworming = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient || !newDewormingData.productName.trim()) return;

    const newDew: VeterinaryDeworming = {
      id: `dew-${Date.now()}`,
      productName: newDewormingData.productName.trim(),
      type: newDewormingData.type,
      applicationDate: newDewormingData.applicationDate,
      nextDueDate: newDewormingData.nextDueDate,
      dose: newDewormingData.dose.trim(),
      status: "applied",
    };

    const updatedPatient: PetPatient = {
      ...activePatient,
      dewormings: [newDew, ...activePatient.dewormings],
    };

    const updatedAll = patients.map((p) =>
      p.id === activePatient.id ? updatedPatient : p
    );
    setPatients(updatedAll);
    saveStoredVetPatients(updatedAll);
    setActivePatient(updatedPatient);
    setShowNewDewormingModal(false);
  };

  const getSpeciesIcon = (species: PetSpecies) => {
    switch (species) {
      case "canino":
        return <Dog className="w-4 h-4 text-amber-500" />;
      case "felino":
        return <Cat className="w-4 h-4 text-purple-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Stats Bar */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-apple-blue/10 dark:bg-apple-blue/20 text-apple-blue flex items-center justify-center shadow-inner">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Módulo Veterinario // Expedientes Clínicos
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-apple-green/10 text-apple-green text-[10px] font-mono font-semibold border border-apple-green/20">
                PET HEALTH CLOUD
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Control integral de pacientes, historial de consultas, carnet digital de vacunación y tutores.
            </p>
          </div>
        </div>

        {/* Quick Actions & KPIs */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-4 px-4 py-2 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700/60 text-xs font-mono">
            <div>
              <span className="text-[10px] text-neutral-400 uppercase block">Pacientes</span>
              <span className="font-bold text-neutral-800 dark:text-neutral-200">{patients.length}</span>
            </div>
            <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700" />
            <div>
              <span className="text-[10px] text-neutral-400 uppercase block">Consultas</span>
              <span className="font-bold text-apple-blue">{totalConsultations}</span>
            </div>
            <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700" />
            <div>
              <span className="text-[10px] text-neutral-400 uppercase block">Vacunas Pend.</span>
              <span className={`font-bold ${pendingVaccines > 0 ? "text-apple-orange" : "text-apple-green"}`}>
                {pendingVaccines}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowNewPatientModal(true)}
            className="px-4 py-2.5 rounded-full bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-semibold transition-all shadow-md shadow-apple-blue/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Paciente</span>
          </button>
        </div>
      </div>

      {/* 2. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Columna Izquierda: Directorio de Pacientes */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-3">
            
            {/* Buscador */}
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar mascota, tutor o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/70 border border-transparent focus:border-apple-blue text-xs text-neutral-800 dark:text-white placeholder-neutral-400 focus:outline-none transition-all font-mono"
              />
            </div>

            {/* Filtros de Especie */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { id: "all", label: "Todos" },
                { id: "canino", label: "Caninos 🐕" },
                { id: "felino", label: "Felinos 🐈" },
                { id: "exotico", label: "Exóticos 🦜" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedSpecies(item.id)}
                  className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-all ${
                    selectedSpecies === item.id
                      ? "bg-apple-blue text-white shadow-sm"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Lista de Pacientes */}
            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
              {filteredPatients.length === 0 ? (
                <div className="text-center py-12 text-neutral-400 text-xs">
                  No se encontraron mascotas registradas.
                </div>
              ) : (
                filteredPatients.map((pet) => {
                  const isSelected = activePatient?.id === pet.id;
                  return (
                    <div
                      key={pet.id}
                      onClick={() => setActivePatient(pet)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-apple-blue/5 border-apple-blue ring-1 ring-apple-blue/30 dark:bg-apple-blue/10 shadow-sm"
                          : "bg-neutral-50/60 dark:bg-neutral-900/40 border-neutral-200/70 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center font-bold text-sm shadow-2xs">
                          {getSpeciesIcon(pet.species)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-neutral-900 dark:text-white">
                              {pet.name}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-200/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 capitalize">
                              {pet.species}
                            </span>
                          </div>
                          <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                            {pet.breed} • {pet.weightKg} kg • {pet.ageYears}a {pet.ageMonths}m
                          </div>
                          <div className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5 font-mono">
                            <User className="w-2.5 h-2.5" />
                            <span>{pet.ownerName}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-apple-blue/10 text-apple-blue font-semibold">
                          {pet.consultations.length} Visitas
                        </span>
                        <ChevronRight className="w-4 h-4 text-neutral-400" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>

        {/* Columna Derecha: Expediente Clínico Completo */}
        <div className="lg:col-span-7">
          {activePatient ? (
            <div className="p-6 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-6">
              
              {/* Tarjeta de Identidad del Paciente */}
              <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-apple-blue text-white flex items-center justify-center font-bold text-xl shadow-md shadow-apple-blue/30">
                    {activePatient.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                        {activePatient.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold">
                        {activePatient.status === "active" ? "AL DÍA" : "EN TRATAMIENTO"}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500 font-mono mt-0.5">
                      {activePatient.breed} ({activePatient.sex}) • {activePatient.weightKg} Kg • {activePatient.ageYears} años
                    </div>
                    {activePatient.allergies && (
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-apple-red font-medium">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Alergias: {activePatient.allergies}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones directas */}
                <div className="flex items-center gap-2">
                  {onNavigateToPOS && (
                    <button
                      type="button"
                      onClick={onNavigateToPOS}
                      className="px-3.5 py-1.5 rounded-full bg-apple-green hover:bg-apple-green/90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Cobrar en POS</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Tabs de Expediente */}
              <div className="border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-6 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab("consultations")}
                  className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === "consultations"
                      ? "border-apple-blue text-apple-blue font-bold"
                      : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  <span>Consultas & Evolución ({activePatient.consultations.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("vaccines")}
                  className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === "vaccines"
                      ? "border-apple-blue text-apple-blue font-bold"
                      : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
                  }`}
                >
                  <Syringe className="w-4 h-4" />
                  <span>Carnet de Vacunación ({activePatient.vaccines.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("deworming")}
                  className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === "deworming"
                      ? "border-apple-blue text-apple-blue font-bold"
                      : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Desparasitaciones ({activePatient.dewormings.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("owner")}
                  className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === "owner"
                      ? "border-apple-blue text-apple-blue font-bold"
                      : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Tutor / Dueño</span>
                </button>
              </div>

              {/* Contenido de Tab: 1. Consultas */}
              {activeTab === "consultations" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider font-mono">
                      Historial Clínico de Visitas
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowNewConsultationModal(true)}
                      className="px-3 py-1.5 rounded-full bg-apple-blue/10 text-apple-blue hover:bg-apple-blue hover:text-white text-xs font-semibold transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nueva Consulta</span>
                    </button>
                  </div>

                  {activePatient.consultations.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl text-xs text-neutral-400">
                      No hay consultas previas registradas para este paciente.
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
                              <span className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">
                                {cons.veterinarianName}
                              </span>
                            </div>
                            <span className="text-xs font-mono font-bold text-apple-green">
                              C$ {cons.cost.toFixed(2)}
                            </span>
                          </div>

                          {/* Motivo & Diagnóstico */}
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
                              <span className="flex items-center gap-1">
                                <Thermometer className="w-3 h-3 text-apple-red" />
                                {cons.vitals.temperatureC}°C
                              </span>
                              <span>•</span>
                              <span>{cons.vitals.weightKg} kg</span>
                              <span>•</span>
                              <span>FC: {cons.vitals.heartRateBpm} lpm</span>
                            </div>
                          )}

                          <div className="text-xs space-y-1">
                            <div>
                              <span className="font-semibold text-apple-blue">
                                Diagnóstico:{" "}
                              </span>
                              <span className="text-neutral-700 dark:text-neutral-300">
                                {cons.diagnosis}
                              </span>
                            </div>
                            <div>
                              <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                                Tratamiento:{" "}
                              </span>
                              <span className="text-neutral-600 dark:text-neutral-400">
                                {cons.treatment}
                              </span>
                            </div>
                            {cons.prescription && (
                              <div className="p-2.5 rounded-xl bg-apple-blue/5 border border-apple-blue/20 text-neutral-800 dark:text-neutral-200 text-xs">
                                <span className="font-bold text-apple-blue block mb-0.5">
                                  💊 Receta & Fármacos:
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

              {/* Contenido de Tab: 2. Vacunación */}
              {activeTab === "vaccines" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider font-mono">
                      Carnet Digital de Inmunización
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowNewVaccineModal(true)}
                      className="px-3 py-1.5 rounded-full bg-apple-blue/10 text-apple-blue hover:bg-apple-blue hover:text-white text-xs font-semibold transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Registrar Vacuna</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {activePatient.vaccines.map((vac) => (
                      <div
                        key={vac.id}
                        className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-apple-blue/10 text-apple-blue flex items-center justify-center">
                            <Syringe className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-neutral-900 dark:text-white">
                              {vac.name}
                            </div>
                            <div className="text-[11px] text-neutral-500 font-mono">
                              Aplicada: {vac.applicationDate} • Lote: {vac.batchNumber || "S/L"}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold block">
                            Próxima: {vac.nextDueDate}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">
                            {vac.veterinarian}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contenido de Tab: 3. Desparasitación */}
              {activeTab === "deworming" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider font-mono">
                      Control Antiparasitario
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowNewDewormingModal(true)}
                      className="px-3 py-1.5 rounded-full bg-apple-blue/10 text-apple-blue hover:bg-apple-blue hover:text-white text-xs font-semibold transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Registrar Dosis</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {activePatient.dewormings.map((dew) => (
                      <div
                        key={dew.id}
                        className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-neutral-900 dark:text-white">
                              {dew.productName}
                            </div>
                            <div className="text-[11px] text-neutral-500 font-mono">
                              Dosis: {dew.dose} • Tipo: {dew.type}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-apple-blue/10 text-apple-blue font-semibold">
                            Refuerzo: {dew.nextDueDate}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contenido de Tab: 4. Tutor / Dueño */}
              {activeTab === "owner" && (
                <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/80 dark:border-neutral-800 space-y-4 text-xs">
                  <div className="font-bold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
                    Información de Contacto y Responsable
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-neutral-400 block text-[10px] font-mono uppercase">Nombre del Tutor</span>
                      <span className="font-bold text-sm text-neutral-800 dark:text-neutral-200">
                        {activePatient.ownerName}
                      </span>
                    </div>

                    <div>
                      <span className="text-neutral-400 block text-[10px] font-mono uppercase">Teléfono Móvil</span>
                      <a
                        href={`tel:${activePatient.ownerPhone}`}
                        className="font-bold text-sm text-apple-blue flex items-center gap-1.5 hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{activePatient.ownerPhone}</span>
                      </a>
                    </div>

                    <div>
                      <span className="text-neutral-400 block text-[10px] font-mono uppercase">Cédula / Identificación</span>
                      <span className="font-mono text-neutral-700 dark:text-neutral-300">
                        {activePatient.ownerDni || "No registrada"}
                      </span>
                    </div>

                    <div>
                      <span className="text-neutral-400 block text-[10px] font-mono uppercase">Correo Electrónico</span>
                      <span className="font-mono text-neutral-700 dark:text-neutral-300">
                        {activePatient.ownerEmail || "No registrado"}
                      </span>
                    </div>

                    <div className="md:col-span-2">
                      <span className="text-neutral-400 block text-[10px] font-mono uppercase">Dirección Domiciliar</span>
                      <span className="text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>{activePatient.ownerAddress || "No especificada"}</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200 dark:border-neutral-800 text-neutral-400 text-xs">
              Selecciona una mascota del panel izquierdo para visualizar su expediente clínico.
            </div>
          )}
        </div>

      </div>

      {/* ======================================================== */}
      {/* MODAL: REGISTRAR NUEVO PACIENTE                           */}
      {/* ======================================================== */}
      {showNewPatientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Dog className="w-5 h-5 text-apple-blue" />
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                  Registrar Nueva Mascota
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
              <div className="font-bold text-apple-blue uppercase tracking-wider font-mono text-[10px]">
                1. Datos de la Mascota
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Toby"
                    value={newPatientData.name}
                    onChange={(e) => setNewPatientData({ ...newPatientData, name: e.target.value })}
                    className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:border-apple-blue"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Especie</label>
                  <select
                    value={newPatientData.species}
                    onChange={(e) => setNewPatientData({ ...newPatientData, species: e.target.value as PetSpecies })}
                    className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:border-apple-blue"
                  >
                    <option value="canino">Canino (Perro)</option>
                    <option value="felino">Felino (Gato)</option>
                    <option value="exotico">Exótico / Ave / Roedor</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Raza</label>
                  <input
                    type="text"
                    placeholder="Ej. Golden Retriever"
                    value={newPatientData.breed}
                    onChange={(e) => setNewPatientData({ ...newPatientData, breed: e.target.value })}
                    className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:border-apple-blue"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Sexo</label>
                  <select
                    value={newPatientData.sex}
                    onChange={(e) => setNewPatientData({ ...newPatientData, sex: e.target.value as PetGender })}
                    className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:border-apple-blue"
                  >
                    <option value="macho">Macho</option>
                    <option value="hembra">Hembra</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Peso Actual (Kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newPatientData.weightKg}
                    onChange={(e) => setNewPatientData({ ...newPatientData, weightKg: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:border-apple-blue font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Edad (Años)</label>
                  <input
                    type="number"
                    value={newPatientData.ageYears}
                    onChange={(e) => setNewPatientData({ ...newPatientData, ageYears: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:border-apple-blue font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Alergias o Condiciones Especiales</label>
                  <input
                    type="text"
                    placeholder="Ej. Alérgico a penicilina, picadura de pulga..."
                    value={newPatientData.allergies}
                    onChange={(e) => setNewPatientData({ ...newPatientData, allergies: e.target.value })}
                    className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:border-apple-blue"
                  />
                </div>
              </div>

              <div className="font-bold text-apple-blue uppercase tracking-wider font-mono text-[10px] pt-2">
                2. Datos del Tutor / Responsable
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre del dueño"
                    value={newPatientData.ownerName}
                    onChange={(e) => setNewPatientData({ ...newPatientData, ownerName: e.target.value })}
                    className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:border-apple-blue"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Teléfono</label>
                  <input
                    type="text"
                    required
                    placeholder="+505 8888-0000"
                    value={newPatientData.ownerPhone}
                    onChange={(e) => setNewPatientData({ ...newPatientData, ownerPhone: e.target.value })}
                    className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:border-apple-blue font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Dirección</label>
                  <input
                    type="text"
                    placeholder="Dirección del tutor"
                    value={newPatientData.ownerAddress}
                    onChange={(e) => setNewPatientData({ ...newPatientData, ownerAddress: e.target.value })}
                    className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:border-apple-blue"
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
                  className="px-5 py-2 rounded-full bg-apple-blue text-white font-semibold shadow-md shadow-apple-blue/20"
                >
                  Guardar Mascota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: NUEVA CONSULTA / EVOLUCIÓN                        */}
      {/* ======================================================== */}
      {showNewConsultationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-apple-blue" />
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                  Registrar Consulta para {activePatient?.name}
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
              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Motivo de Consulta</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Chequeo de rutina, vómitos, claudicación..."
                  value={newConsultationData.reason}
                  onChange={(e) => setNewConsultationData({ ...newConsultationData, reason: e.target.value })}
                  className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:border-apple-blue"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Peso (Kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newConsultationData.weightKg}
                    onChange={(e) => setNewConsultationData({ ...newConsultationData, weightKg: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newConsultationData.temperatureC}
                    onChange={(e) => setNewConsultationData({ ...newConsultationData, temperatureC: parseFloat(e.target.value) || 38.5 })}
                    className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">FC (LPM)</label>
                  <input
                    type="number"
                    value={newConsultationData.heartRateBpm}
                    onChange={(e) => setNewConsultationData({ ...newConsultationData, heartRateBpm: parseInt(e.target.value) || 90 })}
                    className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Diagnóstico Clínico</label>
                <input
                  type="text"
                  required
                  placeholder="Diagnóstico veterinario"
                  value={newConsultationData.diagnosis}
                  onChange={(e) => setNewConsultationData({ ...newConsultationData, diagnosis: e.target.value })}
                  className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:border-apple-blue"
                />
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Tratamiento Realizado</label>
                <textarea
                  rows={2}
                  placeholder="Procedimiento realizado en consultorio..."
                  value={newConsultationData.treatment}
                  onChange={(e) => setNewConsultationData({ ...newConsultationData, treatment: e.target.value })}
                  className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:border-apple-blue"
                />
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Receta de Medicamentos / Fármacos</label>
                <textarea
                  rows={2}
                  placeholder="Medicamento, dosis, frecuencia y días..."
                  value={newConsultationData.prescription}
                  onChange={(e) => setNewConsultationData({ ...newConsultationData, prescription: e.target.value })}
                  className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:border-apple-blue font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Veterinario Tratante</label>
                  <input
                    type="text"
                    value={newConsultationData.veterinarianName}
                    onChange={(e) => setNewConsultationData({ ...newConsultationData, veterinarianName: e.target.value })}
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
                  className="px-5 py-2 rounded-full bg-apple-blue text-white font-semibold shadow-md shadow-apple-blue/20"
                >
                  Registrar Consulta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: REGISTRAR VACUNA                                  */}
      {/* ======================================================== */}
      {showNewVaccineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Syringe className="w-5 h-5 text-apple-blue" />
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                  Registrar Vacuna para {activePatient?.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewVaccineModal(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVaccine} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Nombre de Vacuna</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Antirrábica, Séxtuple, Triple Felina..."
                  value={newVaccineData.name}
                  onChange={(e) => setNewVaccineData({ ...newVaccineData, name: e.target.value })}
                  className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Fecha de Aplicación</label>
                  <input
                    type="date"
                    required
                    value={newVaccineData.applicationDate}
                    onChange={(e) => setNewVaccineData({ ...newVaccineData, applicationDate: e.target.value })}
                    className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Próxima Dosis / Refuerzo</label>
                  <input
                    type="date"
                    required
                    value={newVaccineData.nextDueDate}
                    onChange={(e) => setNewVaccineData({ ...newVaccineData, nextDueDate: e.target.value })}
                    className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Lote del Biológico</label>
                <input
                  type="text"
                  value={newVaccineData.batchNumber}
                  onChange={(e) => setNewVaccineData({ ...newVaccineData, batchNumber: e.target.value })}
                  className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowNewVaccineModal(false)}
                  className="px-4 py-2 rounded-full text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-apple-blue text-white font-semibold shadow-md shadow-apple-blue/20"
                >
                  Guardar Vacuna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: REGISTRAR DESPARASITACIÓN                         */}
      {/* ======================================================== */}
      {showNewDewormingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                  Registrar Desparasitación
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewDewormingModal(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDeworming} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Producto / Fármaco</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Simparica, NexGard, Bravecto..."
                  value={newDewormingData.productName}
                  onChange={(e) => setNewDewormingData({ ...newDewormingData, productName: e.target.value })}
                  className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                />
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Tipo</label>
                <select
                  value={newDewormingData.type}
                  onChange={(e) => setNewDewormingData({ ...newDewormingData, type: e.target.value as any })}
                  className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                >
                  <option value="both">Interna & Externa (Completa)</option>
                  <option value="internal">Solo Interna (Parásitos intestinales)</option>
                  <option value="external">Solo Externa (Pulgas y garrapatas)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={newDewormingData.applicationDate}
                    onChange={(e) => setNewDewormingData({ ...newDewormingData, applicationDate: e.target.value })}
                    className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Próxima Dosis</label>
                  <input
                    type="date"
                    required
                    value={newDewormingData.nextDueDate}
                    onChange={(e) => setNewDewormingData({ ...newDewormingData, nextDueDate: e.target.value })}
                    className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Dosis / Presentación</label>
                <input
                  type="text"
                  placeholder="Ej. 1 tableta masticable, 1 pipeta"
                  value={newDewormingData.dose}
                  onChange={(e) => setNewDewormingData({ ...newDewormingData, dose: e.target.value })}
                  className="w-full p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowNewDewormingModal(false)}
                  className="px-4 py-2 rounded-full text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-apple-blue text-white font-semibold shadow-md shadow-apple-blue/20"
                >
                  Guardar Dosis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
