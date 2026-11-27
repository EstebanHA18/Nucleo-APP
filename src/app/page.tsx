"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { HRManager } from "@/components/HRManager";
import { ProductionManager } from "@/components/ProductionManager";
import { RoutesManager } from "@/components/RoutesManager";
import { LandingAndLogin } from "@/components/LandingAndLogin";
import {
  TenantSettings,
  Product,
  Customer,
  Sale,
  AppUser,
  PetPatient,
  ClinicalPatient,
  PendingBill,
  SupportTicket,
  HREmployee,
  ProductionRecipe,
  ProductionOrder,
  RouteDriver,
  DeliveryRoute,
  RouteCustomerOrder,
} from "@/types";
import { 
  getStoredTenant, 
  saveStoredTenant, 
  getStoredTenantsList,
  saveStoredTenantsList,
  getStoredProducts,
  saveStoredProducts,
  getStoredCustomers,
  saveStoredCustomers,
  getStoredSales,
  saveStoredSales,
  getStoredUsers,
  saveStoredUsers,
  getCurrentUser,
  saveCurrentUser,
  getStoredVetPatients,
  getStoredClinicalPatients,
  saveStoredVetPatients,
  saveStoredClinicalPatients,
  getStoredSupportTickets,
  saveStoredSupportTickets,
  getStoredHREmployees,
  saveStoredHREmployees,
  getStoredRecipes,
  saveStoredRecipes,
  getStoredProductionOrders,
  saveStoredProductionOrders,
  getStoredRouteDrivers,
  saveStoredRouteDrivers,
  getStoredDeliveryRoutes,
  saveStoredDeliveryRoutes,
  getStoredRouteOrders,
  saveStoredRouteOrders,
  saveCurrentCashSession,
  canUserAccessView,
  getDefaultViewForUser,
  pushAllLocalDataToSupabase,
} from "@/lib/offlineStore";
import { fetchTenantSnapshotFromSupabase, isSupabaseConfigured } from "@/lib/supabase";

export default function Home() {
  const [tenant, setTenant] = useState<TenantSettings | null>(null);
  const [tenants, setTenants] = useState<TenantSettings[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [activeView, setActiveView] = useState<string>("spatial");
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // App data states (Multi-tenant local + Supabase Cloud synced)
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [impersonatingOwner, setImpersonatingOwner] = useState<AppUser | null>(null);
  const [vetPatients, setVetPatients] = useState<PetPatient[]>([]);
  const [clinicalPatients, setClinicalPatients] = useState<ClinicalPatient[]>([]);
  const [hrEmployees, setHrEmployees] = useState<HREmployee[]>([]);
  const [recipes, setRecipes] = useState<ProductionRecipe[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [routeDrivers, setRouteDrivers] = useState<RouteDriver[]>([]);
  const [deliveryRoutes, setDeliveryRoutes] = useState<DeliveryRoute[]>([]);
  const [routeOrders, setRouteOrders] = useState<RouteCustomerOrder[]>([]);
  const [pendingBill, setPendingBill] = useState<PendingBill | null>(null);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);

  // Cargar todos los datos correspondientes a un tenant específico (Local + Hidratación Supabase)
  const loadDataForTenant = useCallback(async (targetTenant: TenantSettings) => {
    const tid = targetTenant.id;
    setProducts(getStoredProducts(tid));
    setCustomers(getStoredCustomers(tid));
    setSales(getStoredSales(tid));
    setVetPatients(getStoredVetPatients(tid));
    setClinicalPatients(getStoredClinicalPatients(tid));
    setHrEmployees(getStoredHREmployees(tid));
    setRecipes(getStoredRecipes(tid));
    setProductionOrders(getStoredProductionOrders(tid));
    setRouteDrivers(getStoredRouteDrivers(tid));
    setDeliveryRoutes(getStoredDeliveryRoutes(tid));
    setRouteOrders(getStoredRouteOrders(tid));
    setSupportTickets(getStoredSupportTickets());

    const loadedUsers = getStoredUsers(targetTenant);
    setUsers(loadedUsers);

    // Si Supabase está configurado, sincronizar/hidratar desde la nube
    if (isSupabaseConfigured()) {
      const cloud = await fetchTenantSnapshotFromSupabase(tid);
      if (cloud) {
        if (cloud.tenants && cloud.tenants.length > 0) {
          setTenants(cloud.tenants);
          saveStoredTenantsList(cloud.tenants);
        }
        if (cloud.users && cloud.users.length > 0) {
          setUsers(cloud.users);
          saveStoredUsers(cloud.users, tid);
        }
        if (cloud.products && cloud.products.length > 0) {
          setProducts(cloud.products);
          saveStoredProducts(cloud.products, tid);
        }
        if (cloud.customers && cloud.customers.length > 0) {
          setCustomers(cloud.customers);
          saveStoredCustomers(cloud.customers, tid);
        }
        if (cloud.sales && cloud.sales.length > 0) {
          setSales(cloud.sales);
          saveStoredSales(cloud.sales, tid);
        }
        if (cloud.cashSession) {
          saveCurrentCashSession(cloud.cashSession, tid);
        }
        if (cloud.vetPatients && cloud.vetPatients.length > 0) {
          setVetPatients(cloud.vetPatients);
          saveStoredVetPatients(cloud.vetPatients, tid);
        }
        if (cloud.clinicalPatients && cloud.clinicalPatients.length > 0) {
          setClinicalPatients(cloud.clinicalPatients);
          saveStoredClinicalPatients(cloud.clinicalPatients, tid);
        }
        if (cloud.hrEmployees && cloud.hrEmployees.length > 0) {
          setHrEmployees(cloud.hrEmployees);
          saveStoredHREmployees(cloud.hrEmployees, tid);
        }
        if (cloud.recipes && cloud.recipes.length > 0) {
          setRecipes(cloud.recipes);
          saveStoredRecipes(cloud.recipes, tid);
        }
        if (cloud.productionOrders && cloud.productionOrders.length > 0) {
          setProductionOrders(cloud.productionOrders);
          saveStoredProductionOrders(cloud.productionOrders, tid);
        }
        if (cloud.routeDrivers && cloud.routeDrivers.length > 0) {
          setRouteDrivers(cloud.routeDrivers);
          saveStoredRouteDrivers(cloud.routeDrivers, tid);
        }
        if (cloud.deliveryRoutes && cloud.deliveryRoutes.length > 0) {
          setDeliveryRoutes(cloud.deliveryRoutes);
          saveStoredDeliveryRoutes(cloud.deliveryRoutes, tid);
        }
        if (cloud.routeOrders && cloud.routeOrders.length > 0) {
          setRouteOrders(cloud.routeOrders);
          saveStoredRouteOrders(cloud.routeOrders, tid);
        }
        if (cloud.supportTickets && cloud.supportTickets.length > 0) {
          setSupportTickets(cloud.supportTickets);
          saveStoredSupportTickets(cloud.supportTickets);
        }
        // Si la base de datos en Supabase está recién creada (sin productos aún para este tenant), subir semilla inicial
        if (!cloud.products || cloud.products.length === 0) {
          pushAllLocalDataToSupabase(tid);
        }
      }
    }
  }, []);

  // Initialize
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => {
        setIsOnline(true);
        if (isSupabaseConfigured()) {
          pushAllLocalDataToSupabase();
        }
      };
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      const storedTenants = getStoredTenantsList();
      setTenants(storedTenants);

      const storedTenant = getStoredTenant() || storedTenants[0];
      setTenant(storedTenant);

      loadDataForTenant(storedTenant);

      const loadedUsers = getStoredUsers(storedTenant);
      const activeUser = getCurrentUser(loadedUsers);
      setCurrentUser(activeUser);

      if (activeUser) {
        setActiveView(getDefaultViewForUser(activeUser, storedTenant));
      }

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, [loadDataForTenant]);

  // Guardia reactivo: Si activeView no está permitido para el currentUser, redirigir de inmediato a su vista autorizada
  useEffect(() => {
    if (currentUser && tenant) {
      if (!canUserAccessView(currentUser, tenant, activeView)) {
        setActiveView(getDefaultViewForUser(currentUser, tenant));
      }
    }
  }, [currentUser, tenant, activeView]);

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
        try { localStorage.setItem("nucleo_theme", "dark"); } catch {}
      } else {
        root.classList.remove("dark");
        try { localStorage.setItem("nucleo_theme", "light"); } catch {}
      }
    }
  }, [darkMode]);

  const handleWizardComplete = (completedTenant: TenantSettings) => {
    setTenant(completedTenant);
    saveStoredTenant(completedTenant);
    setShowWizard(false);
    
    const updatedUsers = getStoredUsers(completedTenant);
    setUsers(updatedUsers);
    const owner = updatedUsers.find((u) => u.role === "owner" && (!u.tenantId || u.tenantId === completedTenant.id)) || updatedUsers[0];
    setCurrentUser(owner);
    saveCurrentUser(owner);
    setImpersonatingOwner(null);

    setActiveView("spatial");
  };

  const handleSaleComplete = (
    sale: Sale,
    updatedProducts: Product[],
    updatedCustomers: Customer[]
  ) => {
    setSales((prev) => {
      const exists = prev.some((s) => s.id === sale.id);
      return exists ? prev : [sale, ...prev];
    });
    setProducts(updatedProducts);
    setCustomers(updatedCustomers);

    // Si la venta correspondió al cobro de una consulta médica, veterinaria o pedido en ruta, marcarla como cobrada
    if (pendingBill) {
      if (pendingBill.source === "veterinary") {
        setVetPatients((prev) => {
          const updated = prev.map((pat) => {
            if (pat.id === pendingBill.patientId) {
              return {
                ...pat,
                consultations: pat.consultations.map((c) =>
                  c.id === pendingBill.id ? { ...c, paymentStatus: "paid" as const } : c
                ),
              };
            }
            return pat;
          });
          saveStoredVetPatients(updated, tenant?.id);
          return updated;
        });
      } else if (pendingBill.source === "clinical") {
        setClinicalPatients((prev) => {
          const updated = prev.map((pat) => {
            if (pat.id === pendingBill.patientId) {
              return {
                ...pat,
                consultations: pat.consultations.map((c) =>
                  c.id === pendingBill.id ? { ...c, paymentStatus: "paid" as const } : c
                ),
              };
            }
            return pat;
          });
          saveStoredClinicalPatients(updated, tenant?.id);
          return updated;
        });
      } else if (pendingBill.source === "routes") {
        setRouteOrders((prev) => {
          const updated = prev.map((ord) =>
            ord.id === pendingBill.id ? { ...ord, status: "entregado_facturado" as const } : ord
          );
          saveStoredRouteOrders(updated, tenant?.id);
          return updated;
        });
      }
      setPendingBill(null);
    }
  };

  const handleUpdateTenantSettings = (updated: TenantSettings) => {
    setTenant(updated);
    saveStoredTenant(updated);
    setTenants(getStoredTenantsList());
  };

  // Cambio de usuario iniciado por el Propietario (modo simulación de empleado)
  const handleSwitchUser = (targetUser: AppUser) => {
    if (currentUser && (currentUser.role === "owner" || currentUser.role === "superadmin") && targetUser.role !== "owner" && targetUser.role !== "superadmin") {
      setImpersonatingOwner(currentUser);
    } else if (targetUser.role === "owner" || targetUser.role === "superadmin") {
      setImpersonatingOwner(null);
    }
    setCurrentUser(targetUser);
    saveCurrentUser(targetUser);
    setActiveView(getDefaultViewForUser(targetUser, tenant));
  };

  const handleReturnToOwner = () => {
    if (impersonatingOwner) {
      setCurrentUser(impersonatingOwner);
      saveCurrentUser(impersonatingOwner);
      setActiveView(getDefaultViewForUser(impersonatingOwner, tenant));
      setImpersonatingOwner(null);
    }
  };

  const handleLoginSuccess = (user: AppUser, selectedTenant: TenantSettings) => {
    setImpersonatingOwner(null);
    if (selectedTenant) {
      setTenant(selectedTenant);
      saveStoredTenant(selectedTenant);
      loadDataForTenant(selectedTenant);
    }
    setCurrentUser(user);
    saveCurrentUser(user);
    setActiveView(getDefaultViewForUser(user, selectedTenant || tenant));
  };

  const handleLogout = () => {
    setImpersonatingOwner(null);
    setCurrentUser(null);
    saveCurrentUser(null);
  };

  const handleNavigateGuarded = (targetView: string) => {
    if (canUserAccessView(currentUser, tenant, targetView)) {
      setActiveView(targetView);
    }
  };

  // Si no hay usuario autenticado, mostrar Landing Page con Login integrado
  if (!currentUser || !tenant) {
    return (
      <LandingAndLogin
        tenants={tenants}
        users={users}
        onLoginSuccess={handleLoginSuccess}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    );
  }

  const isEmployeeSession = currentUser.role !== "owner" && currentUser.role !== "superadmin";

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#0d0e11] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Apple-style Setup Wizard (Solo accesible para Dueño o SuperAdmin) */}
      {showWizard && !isEmployeeSession && (
        <AppleWizard onComplete={handleWizardComplete} />
      )}

      {/* Main App Layout */}
      <>
        {/* Top Bar */}
        <Header
          tenant={tenant}
          activeView={activeView}
          setActiveView={handleNavigateGuarded}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          isOnline={isOnline}
          currentUser={currentUser}
          users={users}
          onSwitchUser={handleSwitchUser}
          onOpenCommandPalette={() => setShowCommandPalette(true)}
          onOpenSettingsWizard={() => !isEmployeeSession && setShowWizard(true)}
          onLogout={handleLogout}
          unreadGodModeTickets={supportTickets.filter((t) => t.unreadByAdmin || t.status === "open").length}
          isImpersonating={Boolean(impersonatingOwner)}
          onReturnToOwner={handleReturnToOwner}
        />

        {/* Banner de Modo Empleado Restringido (Sin escalamiento a dueño si inició sesión como empleado) */}
        {isEmployeeSession && (
          <div className="fixed top-14 inset-x-0 z-30 bg-apple-blue text-white px-4 py-1.5 text-xs text-center font-medium shadow-sm flex items-center justify-center gap-3">
            <span>
              Panel Operativo de <strong>{currentUser.roleLabel}</strong> ({currentUser.fullName}) • Acceso exclusivo a{" "}
              <strong>
                {currentUser.role === "cashier"
                  ? "Terminal POS, Caja & Facturas"
                  : currentUser.role === "inventory_clerk"
                  ? "Inventario & Kardex de Bodega"
                  : currentUser.role === "driver"
                  ? "Rutas de Reparto & Mapa GPS"
                  : currentUser.allowedModules.join(", ").toUpperCase()}
              </strong>
            </span>
            {impersonatingOwner && (
              <button
                type="button"
                onClick={handleReturnToOwner}
                className="px-2.5 py-0.5 rounded-full bg-white text-apple-blue font-bold text-[11px] hover:bg-neutral-100 transition-colors shadow-2xs cursor-pointer"
              >
                Salir de Simulación (Volver a Dueño)
              </button>
            )}
          </div>
        )}

        {/* Main Content Area (Estrictamente protegido por canUserAccessView) */}
        <main className={`flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 pb-28 ${isEmployeeSession ? "pt-24" : "pt-20"}`}>
          
          {/* 1. Red Espacial (Exclusivo Dueño / SuperAdmin) */}
          {activeView === "spatial" && canUserAccessView(currentUser, tenant, "spatial") && (
            <SpatialCanvas
              tenant={tenant}
              products={products}
              customers={customers}
              sales={sales}
              vetPatients={vetPatients}
              clinicalPatients={clinicalPatients}
              users={users}
              darkMode={darkMode}
              onNavigate={handleNavigateGuarded}
              onOpenSettingsWizard={() => handleNavigateGuarded("settings")}
            />
          )}

          {/* 2. Drag & Drop Dashboard (Exclusivo Dueño / SuperAdmin) */}
          {activeView === "dashboard" && canUserAccessView(currentUser, tenant, "dashboard") && (
            <DashboardBuilder
              tenant={tenant}
              products={products}
              customers={customers}
              sales={sales}
              vetPatients={vetPatients}
              clinicalPatients={clinicalPatients}
              users={users}
              onNavigate={handleNavigateGuarded}
            />
          )}

          {/* 3. POS Terminal + Visualizador de Facturas (Solo para roles con permiso 'pos') */}
          {activeView === "pos" && canUserAccessView(currentUser, tenant, "pos") && (
            <POSTerminal
              tenant={tenant}
              products={products}
              customers={customers}
              sales={sales}
              onUpdateSales={(updatedSales) => {
                setSales(updatedSales);
                saveStoredSales(updatedSales, tenant.id);
              }}
              currentUser={currentUser}
              onSaleComplete={handleSaleComplete}
              pendingBill={pendingBill}
              onClearPendingBill={() => setPendingBill(null)}
            />
          )}

          {/* 4. Inventario & Kardex (Solo para roles con permiso 'inventory') */}
          {activeView === "inventory" && canUserAccessView(currentUser, tenant, "inventory") && (
            <InventoryManager
              tenant={tenant}
              products={products}
              setProducts={setProducts}
            />
          )}

          {/* 5. Directorio de Clientes (Solo para roles con permiso 'customers') */}
          {activeView === "customers" && canUserAccessView(currentUser, tenant, "customers") && (
            <CustomersManager
              tenant={tenant}
              customers={customers}
              setCustomers={setCustomers}
            />
          )}

          {/* 6. Apartado del Dueño: Usuarios & Roles (Exclusivo Dueño / SuperAdmin) */}
          {activeView === "users" && canUserAccessView(currentUser, tenant, "users") && (
            <UsersManager
              tenant={tenant}
              users={users}
              setUsers={setUsers}
              currentUser={currentUser}
              onSwitchUser={handleSwitchUser}
            />
          )}

          {/* 7. SuperAdmin Terminal (EXCLUSIVO SuperAdmin // God Mode) */}
          {activeView === "terminal" && canUserAccessView(currentUser, tenant, "terminal") && (
            <SuperAdminTerminal
              currentTenant={tenant}
              allTenants={tenants}
              onUpdateTenantSettings={handleUpdateTenantSettings}
              onSaveAllTenants={(updatedList) => {
                setTenants(updatedList);
                saveStoredTenantsList(updatedList);
                const match = updatedList.find((t) => t.id === tenant.id);
                if (match) {
                  setTenant(match);
                  saveStoredTenant(match);
                }
              }}
              onSwitchTenant={(selectedTenant) => {
                setTenant(selectedTenant);
                saveStoredTenant(selectedTenant);
                loadDataForTenant(selectedTenant);
              }}
              allUsers={users}
              onSaveAllUsers={(updatedUsers) => {
                setUsers(updatedUsers);
                saveStoredUsers(updatedUsers, tenant.id);
              }}
              supportTickets={supportTickets}
              onSaveSupportTickets={(updatedTickets) => {
                setSupportTickets(updatedTickets);
                saveStoredSupportTickets(updatedTickets);
              }}
            />
          )}

          {/* 8. Ajustes & Configuración del Sistema (Exclusivo Dueño / SuperAdmin) */}
          {activeView === "settings" && canUserAccessView(currentUser, tenant, "settings") && (
            <SettingsManager
              tenant={tenant}
              onUpdateTenant={handleUpdateTenantSettings}
              onNavigate={handleNavigateGuarded}
              currentUser={currentUser}
              supportTickets={supportTickets}
              onSaveSupportTickets={(updatedTickets) => {
                setSupportTickets(updatedTickets);
                saveStoredSupportTickets(updatedTickets);
              }}
            />
          )}

          {/* 9. Módulo Veterinario */}
          {activeView === "veterinary" && canUserAccessView(currentUser, tenant, "veterinary") && (
            <VeterinaryManager
              tenant={tenant}
              patients={vetPatients}
              setPatients={setVetPatients}
              products={products}
              onBillConsultation={(bill) => {
                setPendingBill(bill);
                if (canUserAccessView(currentUser, tenant, "pos")) {
                  setActiveView("pos");
                }
              }}
              onNavigateToPOS={() => handleNavigateGuarded("pos")}
            />
          )}

          {/* 10. Módulo Clínico & Dental */}
          {activeView === "clinical" && canUserAccessView(currentUser, tenant, "clinical") && (
            <ClinicalDentalManager
              tenant={tenant}
              patients={clinicalPatients}
              setPatients={setClinicalPatients}
              products={products}
              onBillConsultation={(bill) => {
                setPendingBill(bill);
                if (canUserAccessView(currentUser, tenant, "pos")) {
                  setActiveView("pos");
                }
              }}
              onNavigateToPOS={() => handleNavigateGuarded("pos")}
            />
          )}

          {/* 11. Módulo de Recursos Humanos, Asistencia & Nómina */}
          {activeView === "hr" && canUserAccessView(currentUser, tenant, "hr") && (
            <HRManager
              tenant={tenant}
              employees={hrEmployees}
              setEmployees={setHrEmployees}
            />
          )}

          {/* 12. Módulo de Recetas, Fórmulas & Producción */}
          {activeView === "production" && canUserAccessView(currentUser, tenant, "production") && (
            <ProductionManager
              tenant={tenant}
              recipes={recipes}
              setRecipes={setRecipes}
              orders={productionOrders}
              setOrders={setProductionOrders}
              products={products}
              setProducts={setProducts}
            />
          )}

          {/* 13. Módulo de Rutas, Conductores, Mapa & Pedidos */}
          {activeView === "routes" && canUserAccessView(currentUser, tenant, "routes") && (
            <RoutesManager
              tenant={tenant}
              drivers={routeDrivers}
              setDrivers={setRouteDrivers}
              routes={deliveryRoutes}
              setRoutes={setDeliveryRoutes}
              routeOrders={routeOrders}
              setRouteOrders={setRouteOrders}
              products={products}
              onSendOrderToPOS={(bill) => {
                setPendingBill(bill);
                if (canUserAccessView(currentUser, tenant, "pos")) {
                  setActiveView("pos");
                }
              }}
            />
          )}
        </main>

        {/* Floating Navigation Dock */}
        <NavigationDock
          tenant={tenant}
          activeView={activeView}
          setActiveView={handleNavigateGuarded}
          currentUser={currentUser}
          onOpenSettingsWizard={() => !isEmployeeSession && setShowWizard(true)}
          onReturnToOwner={handleReturnToOwner}
          isImpersonating={Boolean(impersonatingOwner)}
          onLogout={handleLogout}
        />

        {/* Command Palette (⌘K) - Filtrado estrictamente por permisos del usuario */}
        <CommandPalette
          isOpen={showCommandPalette}
          onClose={() => setShowCommandPalette(false)}
          onNavigate={handleNavigateGuarded}
          products={products}
          onOpenSettingsWizard={() => !isEmployeeSession && setShowWizard(true)}
          currentUser={currentUser}
          tenant={tenant}
        />

        {/* Footer Bar */}
        <footer className="w-full py-4 text-center border-t border-neutral-200/80 dark:border-neutral-800/80 text-[11px] text-neutral-400 font-mono">
          <span>NÚCLEO ERP // v3.5.0 Multi-Tenant</span>
          <span className="mx-2">•</span>
          <span>Empresa: {tenant.name}</span>
          <span className="mx-2">•</span>
          <span>Usuario: {currentUser.fullName} ({currentUser.roleLabel})</span>
          <span className="mx-2">•</span>
          <span>
            {isOnline
              ? isSupabaseConfigured()
                ? "Sincronizado con Supabase Cloud"
                : "Modo Local Offline-First Activo"
              : "Modo Offline Activo"}
          </span>
        </footer>
      </>
    </div>
  );
}
