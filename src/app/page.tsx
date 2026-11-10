"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { NavigationDock } from "@/components/NavigationDock";
import { AppleWizard } from "@/components/AppleWizard";
import { SpatialCanvas } from "@/components/SpatialCanvas";
import { POSTerminal } from "@/components/POSTerminal";
import { InventoryManager } from "@/components/InventoryManager";
import { CustomersManager } from "@/components/CustomersManager";
import { UsersManager } from "@/components/UsersManager";
import { SuperAdminTerminal } from "@/components/SuperAdminTerminal";
import { SettingsManager } from "@/components/SettingsManager";
import { DashboardBuilder } from "@/components/DashboardBuilder";
import { CommandPalette } from "@/components/CommandPalette";
import { VeterinaryManager } from "@/components/VeterinaryManager";
import { ClinicalDentalManager } from "@/components/ClinicalDentalManager";
import { TenantSettings, Product, Customer, Sale, AppUser, PetPatient, ClinicalPatient } from "@/types";
import { 
  getStoredTenant, 
  saveStoredTenant, 
  getStoredProducts, 
  getStoredCustomers, 
  getStoredSales,
  getStoredUsers,
  saveStoredUsers,
  getCurrentUser,
  saveCurrentUser,
  getStoredVetPatients,
  getStoredClinicalPatients
} from "@/lib/offlineStore";

export default function Home() {
  const [tenant, setTenant] = useState<TenantSettings | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [activeView, setActiveView] = useState<string>("spatial");
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // App data states (Local offline first)
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [vetPatients, setVetPatients] = useState<PetPatient[]>([]);
  const [clinicalPatients, setClinicalPatients] = useState<ClinicalPatient[]>([]);

  // Initialize
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      // Load tenant
      const storedTenant = getStoredTenant();
      if (!storedTenant || !storedTenant.isSetupCompleted) {
        setShowWizard(true);
      } else {
        setTenant(storedTenant);
      }

      setProducts(getStoredProducts());
      setCustomers(getStoredCustomers());
      setSales(getStoredSales());
      setVetPatients(getStoredVetPatients());
      setClinicalPatients(getStoredClinicalPatients());

      const loadedUsers = getStoredUsers(storedTenant);
      setUsers(loadedUsers);

      const activeUser = getCurrentUser(loadedUsers);
      setCurrentUser(activeUser);

      // Si el usuario actual no es dueño, llevarlo a su vista permitida
      if (activeUser.role === "cashier") {
        setActiveView("pos");
      } else if (activeUser.role === "inventory_clerk") {
        setActiveView("inventory");
      }

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  // Sync dark mode class and storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark");
      setDarkMode(isDark);
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (darkMode) {
        root.classList.add("dark");
        try { localStorage.setItem("nucleo_theme", "dark"); } catch (e) {}
      } else {
        root.classList.remove("dark");
        try { localStorage.setItem("nucleo_theme", "light"); } catch (e) {}
      }
    }
  }, [darkMode]);

  const handleWizardComplete = (completedTenant: TenantSettings) => {
    setTenant(completedTenant);
    setShowWizard(false);
    
    // Actualizar usuarios con el nuevo nombre del dueño
    const updatedUsers = getStoredUsers(completedTenant);
    setUsers(updatedUsers);
    const owner = updatedUsers.find((u) => u.role === "owner") || updatedUsers[0];
    setCurrentUser(owner);
    saveCurrentUser(owner);

    setActiveView("spatial");
  };

  const handleSaleComplete = (
    sale: Sale,
    updatedProducts: Product[],
    updatedCustomers: Customer[]
  ) => {
    setSales((prev) => [sale, ...prev]);
    setProducts(updatedProducts);
    setCustomers(updatedCustomers);
  };

  const handleUpdateTenantSettings = (updated: TenantSettings) => {
    setTenant(updated);
    saveStoredTenant(updated);
  };

  const handleSwitchUser = (user: AppUser) => {
    setCurrentUser(user);
    saveCurrentUser(user);

    // Redirigir según el rol del usuario
    if (user.role === "cashier") {
      setActiveView("pos");
    } else if (user.role === "inventory_clerk") {
      setActiveView("inventory");
    } else if (user.role === "owner") {
      setActiveView("spatial");
    } else {
      if (user.allowedModules.length > 0) {
        setActiveView(user.allowedModules[0]);
      }
    }
  };

  const handleReturnToOwner = () => {
    const owner = users.find((u) => u.role === "owner") || users[0];
    if (owner) {
      handleSwitchUser(owner);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#0d0e11] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Apple-style Setup Wizard (triggered on 1st login or manually) */}
      {showWizard && (
        <AppleWizard onComplete={handleWizardComplete} />
      )}

      {/* Main App Layout */}
      {tenant && currentUser && (
        <>
          {/* Top Bar */}
          <Header
            tenant={tenant}
            activeView={activeView}
            setActiveView={setActiveView}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            isOnline={isOnline}
            currentUser={currentUser}
            users={users}
            onSwitchUser={handleSwitchUser}
            onOpenCommandPalette={() => setShowCommandPalette(true)}
            onOpenSettingsWizard={() => setShowWizard(true)}
          />

          {/* Banner de Modo Empleado restringido si no es dueño */}
          {currentUser.role !== "owner" && (
            <div className="fixed top-14 inset-x-0 z-30 bg-apple-blue text-white px-4 py-1.5 text-xs text-center font-medium shadow-sm flex items-center justify-center gap-3">
              <span>
                Sesión de <strong>{currentUser.roleLabel}</strong>: Acceso restringido a <strong>{currentUser.role === "cashier" ? "Caja & Ventas POS" : "Inventario"}</strong>
              </span>
              <button
                type="button"
                onClick={handleReturnToOwner}
                className="px-2.5 py-0.5 rounded-full bg-white text-apple-blue font-bold text-[11px] hover:bg-neutral-100 transition-colors shadow-2xs"
              >
                Volver a Cuenta de Dueño
              </button>
            </div>
          )}

          {/* Main Content Area */}
          <main className={`flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 pb-28 ${currentUser.role !== "owner" ? "pt-24" : "pt-20"}`}>
            
            {/* 1. Red Espacial (Cada cuadro muestra dinámicamente un módulo activo del rubro) */}
            {activeView === "spatial" && currentUser.role === "owner" && (
              <SpatialCanvas
                tenant={tenant}
                products={products}
                customers={customers}
                sales={sales}
                darkMode={darkMode}
                onNavigate={(v) => setActiveView(v)}
                onOpenSettingsWizard={() => setActiveView("settings")}
              />
            )}

            {/* 2. Drag & Drop Dashboard */}
            {activeView === "dashboard" && (
              <DashboardBuilder
                tenant={tenant}
                products={products}
                customers={customers}
                sales={sales}
                onNavigate={(v) => setActiveView(v)}
              />
            )}

            {/* 3. POS Terminal (Accesible para Dueño y Cajero) */}
            {activeView === "pos" && (
              <POSTerminal
                tenant={tenant}
                products={products}
                customers={customers}
                onSaleComplete={handleSaleComplete}
              />
            )}

            {/* 4. Inventario & Kardex (Accesible para Dueño y Bodeguero) */}
            {activeView === "inventory" && (
              <InventoryManager
                tenant={tenant}
                products={products}
                setProducts={setProducts}
              />
            )}

            {/* 5. Directorio de Clientes */}
            {activeView === "customers" && (
              <CustomersManager
                tenant={tenant}
                customers={customers}
                setCustomers={setCustomers}
              />
            )}

            {/* 6. Apartado del Dueño: Usuarios & Roles (Caja e Inventario) */}
            {activeView === "users" && currentUser.role === "owner" && (
              <UsersManager
                tenant={tenant}
                users={users}
                setUsers={setUsers}
                currentUser={currentUser}
                onSwitchUser={handleSwitchUser}
              />
            )}

            {/* 7. SuperAdmin Terminal (God Mode) */}
            {activeView === "terminal" && currentUser.role === "owner" && (
              <SuperAdminTerminal
                currentTenant={tenant}
                onUpdateTenantSettings={handleUpdateTenantSettings}
              />
            )}

            {/* 8. Ajustes & Configuración del Sistema (Facturas, Plan y Paneles) */}
            {activeView === "settings" && currentUser.role === "owner" && (
              <SettingsManager
                tenant={tenant}
                onUpdateTenant={handleUpdateTenantSettings}
                onNavigate={(v) => setActiveView(v)}
              />
            )}

            {/* 9. Módulo Veterinario (Expedientes de Mascotas y Vacunas) */}
            {activeView === "veterinary" && (
              <VeterinaryManager
                tenant={tenant}
                patients={vetPatients}
                setPatients={setVetPatients}
                onNavigateToPOS={() => setActiveView("pos")}
              />
            )}

            {/* 10. Módulo Clínico & Dental (Historias Médicas y Odontograma) */}
            {activeView === "clinical" && (
              <ClinicalDentalManager
                tenant={tenant}
                patients={clinicalPatients}
                setPatients={setClinicalPatients}
                onNavigateToPOS={() => setActiveView("pos")}
              />
            )}
          </main>

          {/* Floating Navigation Dock */}
          <NavigationDock
            tenant={tenant}
            activeView={activeView}
            setActiveView={setActiveView}
            currentUser={currentUser}
            onOpenSettingsWizard={() => setShowWizard(true)}
            onReturnToOwner={handleReturnToOwner}
          />

          {/* Command Palette (⌘K) */}
          <CommandPalette
            isOpen={showCommandPalette}
            onClose={() => setShowCommandPalette(false)}
            onNavigate={(v) => setActiveView(v)}
            products={products}
            onOpenSettingsWizard={() => setShowWizard(true)}
          />

          {/* Footer Bar */}
          <footer className="w-full py-4 text-center border-t border-neutral-200/80 dark:border-neutral-800/80 text-[11px] text-neutral-400 font-mono">
            <span>NÚCLEO ERP // v3.4.1</span>
            <span className="mx-2">•</span>
            <span>Empresa: {tenant.name}</span>
            <span className="mx-2">•</span>
            <span>Usuario: {currentUser.fullName} ({currentUser.roleLabel})</span>
            <span className="mx-2">•</span>
            <span>{isOnline ? "Modo Local Listo (Supabase opcional)" : "Modo Offline Activo"}</span>
          </footer>
        </>
      )}

    </div>
  );
}
