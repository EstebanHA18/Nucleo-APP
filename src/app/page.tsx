"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { NavigationDock } from "@/components/NavigationDock";
import { AppleWizard } from "@/components/AppleWizard";
import { SpatialCanvas } from "@/components/SpatialCanvas";
import { POSTerminal } from "@/components/POSTerminal";
import { InventoryManager } from "@/components/InventoryManager";
import { ReceivablesManager } from "@/components/ReceivablesManager";
import { SuperAdminTerminal } from "@/components/SuperAdminTerminal";
import { DashboardBuilder } from "@/components/DashboardBuilder";
import { CommandPalette } from "@/components/CommandPalette";
import { TenantSettings, Product, Customer, Sale } from "@/types";
import { 
  getStoredTenant, 
  saveStoredTenant, 
  getStoredProducts, 
  getStoredCustomers, 
  getStoredSales 
} from "@/lib/offlineStore";

export default function Home() {
  const [tenant, setTenant] = useState<TenantSettings | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [activeView, setActiveView] = useState<string>("spatial");
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // App data states
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  // Initialize
  useEffect(() => {
    // Check dark mode
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      // Load tenant
      const stored = getStoredTenant();
      if (!stored || !stored.isSetupCompleted) {
        setShowWizard(true);
      } else {
        setTenant(stored);
      }

      setProducts(getStoredProducts());
      setCustomers(getStoredCustomers());
      setSales(getStoredSales());

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  // Sync dark mode class
  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (darkMode) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, [darkMode]);

  const handleWizardComplete = (completedTenant: TenantSettings) => {
    setTenant(completedTenant);
    setShowWizard(false);
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

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#0d0e11] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Apple-style Setup Wizard (triggered on 1st login or manually) */}
      {showWizard && (
        <AppleWizard onComplete={handleWizardComplete} />
      )}

      {/* Main App Layout (available once tenant is loaded) */}
      {tenant && (
        <>
          {/* Top Bar */}
          <Header
            tenant={tenant}
            activeView={activeView}
            setActiveView={setActiveView}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            isOnline={isOnline}
            onOpenCommandPalette={() => setShowCommandPalette(true)}
            onOpenSettingsWizard={() => setShowWizard(true)}
          />

          {/* Main Content Area */}
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 pt-20 pb-28">
            {activeView === "spatial" && (
              <SpatialCanvas
                tenant={tenant}
                products={products}
                onNavigate={(v) => setActiveView(v)}
              />
            )}

            {activeView === "dashboard" && (
              <DashboardBuilder
                tenant={tenant}
                products={products}
                customers={customers}
                sales={sales}
                onNavigate={(v) => setActiveView(v)}
              />
            )}

            {activeView === "pos" && (
              <POSTerminal
                tenant={tenant}
                products={products}
                customers={customers}
                onSaleComplete={handleSaleComplete}
              />
            )}

            {activeView === "inventory" && (
              <InventoryManager
                tenant={tenant}
                products={products}
                setProducts={setProducts}
              />
            )}

            {activeView === "receivables" && (
              <ReceivablesManager
                tenant={tenant}
                customers={customers}
                setCustomers={setCustomers}
              />
            )}

            {activeView === "terminal" && (
              <SuperAdminTerminal
                currentTenant={tenant}
                onUpdateTenantSettings={handleUpdateTenantSettings}
              />
            )}
          </main>

          {/* Floating Navigation Dock */}
          <NavigationDock
            tenant={tenant}
            activeView={activeView}
            setActiveView={setActiveView}
            onOpenSettingsWizard={() => setShowWizard(true)}
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
            <span>Tenant: {tenant.name}</span>
            <span className="mx-2">•</span>
            <span>{isOnline ? "Supabase Cloud Conectado" : "Modo Offline Activo"}</span>
          </footer>
        </>
      )}

    </div>
  );
}
