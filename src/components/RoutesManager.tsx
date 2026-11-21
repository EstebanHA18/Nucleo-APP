"use client";

import React, { useState, useRef } from "react";
import {
  MapPin,
  Navigation,
  Truck,
  UserCheck,
  UserPlus,
  Plus,
  Search,
  ShoppingCart,
  Package,
  CheckCircle2,
  Clock,
  Phone,
  FileText,
  Trash2,
  Edit2,
  X,
  Check,
  Compass,
  Route as RouteIcon,
  Send,
  Receipt,
  Printer,
  Eye,
  Building2,
  Sparkles,
  Crosshair,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move
} from "lucide-react";
import {
  TenantSettings,
  Product,
  RouteDriver,
  DriverVehicleType,
  DriverStatus,
  DeliveryRoute,
  RouteMapPin,
  RoutePinStatus,
  RouteCustomerOrder,
  RouteOrderItem,
  PendingBill
} from "@/types";
import {
  saveStoredRouteDrivers,
  saveStoredDeliveryRoutes,
  saveStoredRouteOrders
} from "@/lib/offlineStore";

interface RoutesManagerProps {
  tenant: TenantSettings;
  drivers: RouteDriver[];
  setDrivers: React.Dispatch<React.SetStateAction<RouteDriver[]>>;
  routes: DeliveryRoute[];
  setRoutes: React.Dispatch<React.SetStateAction<DeliveryRoute[]>>;
  routeOrders: RouteCustomerOrder[];
  setRouteOrders: React.Dispatch<React.SetStateAction<RouteCustomerOrder[]>>;
  products: Product[];
  onSendOrderToPOS?: (bill: PendingBill) => void;
}

const VEHICLE_LABELS: Record<DriverVehicleType, string> = {
  camion: "Camión de Carga",
  camioneta: "Camioneta Pickup 4x4",
  panel: "Panel / Microbús de Reparto",
  motocicleta: "Motocicleta Mensajería",
  furgon: "Furgón Pesado",
};

const DRIVER_STATUS_BADGES: Record<DriverStatus, { label: string; classes: string }> = {
  en_ruta: {
    label: "EN RUTA ACTIVA",
    classes: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  disponible: {
    label: "DISPONIBLE EN PLANTEL",
    classes: "bg-apple-blue/15 text-apple-blue border-apple-blue/30",
  },
  fuera_de_turno: {
    label: "FUERA DE TURNO",
    classes: "bg-neutral-500/15 text-neutral-500 border-neutral-500/30",
  },
};

const PIN_STATUS_META: Record<RoutePinStatus, { label: string; colorHex: string; badgeClass: string }> = {
  pendiente: {
    label: "Pendiente de Visita",
    colorHex: "#f59e0b",
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
  visitado_con_pedido: {
    label: "Visitado • Pedido Levantado",
    colorHex: "#007aff",
    badgeClass: "bg-apple-blue/15 text-apple-blue border-apple-blue/30",
  },
  entregado: {
    label: "Entregado & Facturado ✓",
    colorHex: "#10b981",
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  sin_pedido: {
    label: "Visitado (Sin Pedido)",
    colorHex: "#6b7280",
    badgeClass: "bg-neutral-500/15 text-neutral-400 border-neutral-500/30",
  },
};

export const RoutesManager: React.FC<RoutesManagerProps> = ({
  tenant,
  drivers,
  setDrivers,
  routes,
  setRoutes,
  routeOrders,
  setRouteOrders,
  products,
  onSendOrderToPOS,
}) => {
  const [activeTab, setActiveTab] = useState<"map_routes" | "driver_view" | "drivers" | "orders">("map_routes");
  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes[0]?.id || "");
  const [selectedPinId, setSelectedPinId] = useState<string | null>(routes[0]?.pins[0]?.id || null);
  const [activeDriverId, setActiveDriverId] = useState<string>(drivers[0]?.id || "");
  const [isPlacingPinMode, setIsPlacingPinMode] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Estados de Zoom (Acercar / Alejar) y Desplazamiento (Pan) del Mapa para llegar a otras zonas
  const [mapZoom, setMapZoom] = useState<number>(1); // 0.45x (alejado regional) hasta 3.0x (acercado)
  const [mapPan, setMapPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanningMap, setIsPanningMap] = useState<boolean>(false);
  const panStartRef = useRef<{ clientX: number; clientY: number; panX: number; panY: number; moved: boolean } | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapLayerRef = useRef<HTMLDivElement>(null);

  // Modal Crear Nuevo Pin al hacer clic en el mapa o botón
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingPinCoords, setPendingPinCoords] = useState<{ mapX: number; mapY: number; lat: number; lng: number }>({
    mapX: 50,
    mapY: 50,
    lat: 12.629,
    lng: -87.131,
  });
  const [pinForm, setPinForm] = useState({
    placeName: "",
    contactName: "",
    contactPhone: "",
    address: "",
    cityZone: "Chinandega Centro",
    notes: "",
  });

  // Modal Crear / Editar Ruta
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [routeForm, setRouteForm] = useState({
    name: "",
    zoneDescription: "",
    assignedDriverIds: [] as string[],
    scheduledDate: new Date().toISOString().split("T")[0],
    estimatedDistanceKm: 35,
  });

  // Modal Crear / Editar Conductor
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [driverForm, setDriverForm] = useState({
    fullName: "",
    phone: "",
    dni: "",
    licenseNumber: "",
    vehicleType: "camion" as DriverVehicleType,
    vehiclePlate: "",
    vehicleModel: "",
    pinCode: "2026",
    status: "disponible" as DriverStatus,
    colorTag: "#007aff",
  });

  // Modal Levantar Pedido en Sitio (Conductor visita un Pin y selecciona productos del Inventario)
  const [showTakeOrderModal, setShowTakeOrderModal] = useState(false);
  const [orderPinTarget, setOrderPinTarget] = useState<RouteMapPin | null>(null);
  const [orderItems, setOrderItems] = useState<RouteOrderItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [orderPaymentCondition, setOrderPaymentCondition] = useState<"contado_efectivo" | "transferencia" | "contra_entrega">("contra_entrega");
  const [orderNotes, setOrderNotes] = useState("");

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4200);
  };

  const currentRoute = routes.find((r) => r.id === selectedRouteId) || routes[0] || null;
  const currentPin = currentRoute?.pins.find((p) => p.id === selectedPinId) || currentRoute?.pins[0] || null;
  const activeDriver = drivers.find((d) => d.id === activeDriverId) || drivers[0] || null;

  // Rutas asignadas al conductor activo
  const driverAssignedRoutes = routes.filter((r) =>
    activeDriver ? r.assignedDriverIds.includes(activeDriver.id) : true
  );

  // =========================================================
  // CONTROLES DE ZOOM, DESPLAZAMIENTO (PAN) Y SALTOS A ZONAS
  // =========================================================
  const handleZoomIn = () => {
    setMapZoom((z) => Math.min(3.0, Number((z + 0.25).toFixed(2))));
  };

  const handleZoomOut = () => {
    setMapZoom((z) => Math.max(0.45, Number((z - 0.25).toFixed(2))));
  };

  const handleResetMapView = () => {
    setMapZoom(1);
    setMapPan({ x: 0, y: 0 });
  };

  const handleFlyToZone = (preset: "occidente" | "norte" | "sur_leon" | "regional") => {
    if (preset === "occidente") {
      setMapZoom(1.1);
      setMapPan({ x: 20, y: 10 });
    } else if (preset === "norte") {
      setMapZoom(1.3);
      setMapPan({ x: 140, y: 120 });
    } else if (preset === "sur_leon") {
      setMapZoom(1.2);
      setMapPan({ x: -160, y: -95 });
    } else if (preset === "regional") {
      setMapZoom(0.55);
      setMapPan({ x: 0, y: 0 });
    }
  };

  const handleMapWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setMapZoom((z) => Math.max(0.45, Math.min(3.0, Number((z + delta).toFixed(2)))));
  };

  const handleMapMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    panStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      panX: mapPan.x,
      panY: mapPan.y,
      moved: false,
    };
    setIsPanningMap(true);
  };

  const handleMapMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!panStartRef.current) return;
    const dx = e.clientX - panStartRef.current.clientX;
    const dy = e.clientY - panStartRef.current.clientY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      panStartRef.current.moved = true;
    }
    if (panStartRef.current.moved) {
      setMapPan({
        x: Math.max(-750, Math.min(750, panStartRef.current.panX + dx)),
        y: Math.max(-550, Math.min(550, panStartRef.current.panY + dy)),
      });
    }
  };

  const handleMapMouseUp = () => {
    setIsPanningMap(false);
    setTimeout(() => {
      panStartRef.current = null;
    }, 30);
  };

  // =========================================================
  // MANEJO DE CLIC EN EL MAPA PARA COLOCAR PIN DE UBICACIÓN
  // =========================================================
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (panStartRef.current?.moved) return;
    if (!isPlacingPinMode || !mapLayerRef.current || !currentRoute) return;

    const layerRect = mapLayerRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - layerRect.left) / layerRect.width) * 100;
    const clickY = ((e.clientY - layerRect.top) / layerRect.height) * 100;

    // Permitir colocar pines incluso en zonas extendidas al alejar el mapa (-45% a 145%)
    const clampedX = Math.max(-45, Math.min(145, Math.round(clickX)));
    const clampedY = Math.max(-45, Math.min(145, Math.round(clickY)));

    // Convertir porcentaje del mapa a coordenadas GPS aproximadas de Occidente / Pacífico (Nicaragua)
    const lat = Number((12.72 - (clampedY / 100) * 0.32).toFixed(4));
    const lng = Number((-87.25 + (clampedX / 100) * 0.42).toFixed(4));

    let suggestedZone = "Chinandega Centro";
    if (clampedY < 20) suggestedZone = "El Viejo / Somotillo (Norte)";
    else if (clampedX < 25 && clampedY > 55) suggestedZone = "Puerto Corinto";
    else if (clampedX > 85 || clampedY > 85) suggestedZone = "León / Nagarote / Managua";
    else if (clampedX > 60) suggestedZone = "Chichigalpa / Posoltega";

    setPendingPinCoords({ mapX: clampedX, mapY: clampedY, lat, lng });
    setPinForm({
      placeName: "",
      contactName: "",
      contactPhone: "+505 ",
      address: "",
      cityZone: suggestedZone,
      notes: "",
    });
    setIsPlacingPinMode(false);
    setShowPinModal(true);
  };

  // Guardar nuevo Pin en la ruta seleccionada
  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoute || !pinForm.placeName.trim()) return;

    const nextSeq = currentRoute.pins.length + 1;
    const newPin: RouteMapPin = {
      id: `pin-${Date.now().toString(36)}`,
      sequenceOrder: nextSeq,
      placeName: pinForm.placeName.trim(),
      contactName: pinForm.contactName.trim() || "Encargado de Compras",
      contactPhone: pinForm.contactPhone.trim() || "+505 0000-0000",
      address: pinForm.address.trim() || "Ubicación georreferenciada en ruta",
      cityZone: pinForm.cityZone.trim() || "Zona Central",
      lat: pendingPinCoords.lat,
      lng: pendingPinCoords.lng,
      mapX: pendingPinCoords.mapX,
      mapY: pendingPinCoords.mapY,
      notes: pinForm.notes.trim(),
      status: "pendiente",
    };

    const updatedRoutes = routes.map((r) => {
      if (r.id === currentRoute.id) {
        return { ...r, pins: [...r.pins, newPin] };
      }
      return r;
    });

    setRoutes(updatedRoutes);
    saveStoredDeliveryRoutes(updatedRoutes);
    setSelectedPinId(newPin.id);
    setShowPinModal(false);
    showToast(`¡Pin #${nextSeq} "${newPin.placeName}" colocado en el mapa de ${currentRoute.code}!`);
  };

  // Eliminar un Pin de la ruta
  const handleDeletePin = (pinId: string) => {
    if (!currentRoute) return;
    const updatedRoutes = routes.map((r) => {
      if (r.id === currentRoute.id) {
        const filtered = r.pins
          .filter((p) => p.id !== pinId)
          .map((p, idx) => ({ ...p, sequenceOrder: idx + 1 }));
        return { ...r, pins: filtered };
      }
      return r;
    });
    setRoutes(updatedRoutes);
    saveStoredDeliveryRoutes(updatedRoutes);
    setSelectedPinId(null);
    showToast("Pin eliminado del mapa de la ruta.");
  };

  // =========================================================
  // CREAR / EDITAR RUTA Y ASIGNAR 1 O MÁS CONDUCTORES
  // =========================================================
  const handleOpenNewRouteModal = () => {
    setEditingRouteId(null);
    setRouteForm({
      name: "",
      zoneDescription: "",
      assignedDriverIds: drivers.length > 0 ? [drivers[0].id] : [],
      scheduledDate: new Date().toISOString().split("T")[0],
      estimatedDistanceKm: 35,
    });
    setShowRouteModal(true);
  };

  const handleOpenEditRouteModal = (route: DeliveryRoute) => {
    setEditingRouteId(route.id);
    setRouteForm({
      name: route.name,
      zoneDescription: route.zoneDescription,
      assignedDriverIds: route.assignedDriverIds,
      scheduledDate: route.scheduledDate,
      estimatedDistanceKm: route.estimatedDistanceKm,
    });
    setShowRouteModal(true);
  };

  const handleToggleDriverInRouteForm = (driverId: string) => {
    if (routeForm.assignedDriverIds.includes(driverId)) {
      setRouteForm({
        ...routeForm,
        assignedDriverIds: routeForm.assignedDriverIds.filter((id) => id !== driverId),
      });
    } else {
      setRouteForm({
        ...routeForm,
        assignedDriverIds: [...routeForm.assignedDriverIds, driverId],
      });
    }
  };

  const handleSaveRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeForm.name.trim()) return;

    if (editingRouteId) {
      const updated = routes.map((r) =>
        r.id === editingRouteId
          ? {
              ...r,
              name: routeForm.name.trim(),
              zoneDescription: routeForm.zoneDescription.trim(),
              assignedDriverIds: routeForm.assignedDriverIds,
              scheduledDate: routeForm.scheduledDate,
              estimatedDistanceKm: Number(routeForm.estimatedDistanceKm) || 25,
            }
          : r
      );
      setRoutes(updated);
      saveStoredDeliveryRoutes(updated);
      showToast(`¡Ruta "${routeForm.name}" actualizada con ${routeForm.assignedDriverIds.length} conductor(es)!`);
    } else {
      const nextNum = routes.length + 1;
      const newRoute: DeliveryRoute = {
        id: `route-${Date.now().toString(36)}`,
        code: `RUT-00${nextNum}`,
        name: routeForm.name.trim(),
        zoneDescription: routeForm.zoneDescription.trim() || "Cobertura comercial y entregas programadas",
        assignedDriverIds: routeForm.assignedDriverIds,
        pins: [],
        status: "activa",
        scheduledDate: routeForm.scheduledDate,
        estimatedDistanceKm: Number(routeForm.estimatedDistanceKm) || 25,
        createdAt: new Date().toISOString().split("T")[0],
      };
      const updated = [...routes, newRoute];
      setRoutes(updated);
      saveStoredDeliveryRoutes(updated);
      setSelectedRouteId(newRoute.id);
      showToast(`¡Nueva ruta "${newRoute.code} - ${newRoute.name}" creada! Haz clic en "Colocar Pin en Mapa" para trazar paradas.`);
    }

    setShowRouteModal(false);
  };

  // =========================================================
  // CREAR / EDITAR PERFIL DE CONDUCTOR
  // =========================================================
  const handleOpenNewDriverModal = () => {
    setEditingDriverId(null);
    setDriverForm({
      fullName: "",
      phone: "+505 ",
      dni: "",
      licenseNumber: "NIC-C1-",
      vehicleType: "camion",
      vehiclePlate: "CH-",
      vehicleModel: "",
      pinCode: "2026",
      status: "disponible",
      colorTag: "#007aff",
    });
    setShowDriverModal(true);
  };

  const handleOpenEditDriverModal = (drv: RouteDriver) => {
    setEditingDriverId(drv.id);
    setDriverForm({
      fullName: drv.fullName,
      phone: drv.phone,
      dni: drv.dni,
      licenseNumber: drv.licenseNumber,
      vehicleType: drv.vehicleType,
      vehiclePlate: drv.vehiclePlate,
      vehicleModel: drv.vehicleModel,
      pinCode: drv.pinCode,
      status: drv.status,
      colorTag: drv.colorTag,
    });
    setShowDriverModal(true);
  };

  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverForm.fullName.trim()) return;

    if (editingDriverId) {
      const updated = drivers.map((d) =>
        d.id === editingDriverId
          ? {
              ...d,
              ...driverForm,
              fullName: driverForm.fullName.trim(),
            }
          : d
      );
      setDrivers(updated);
      saveStoredRouteDrivers(updated);
      showToast(`Perfil del conductor "${driverForm.fullName}" actualizado.`);
    } else {
      const nextNum = drivers.length + 1;
      const newDrv: RouteDriver = {
        id: `drv-${Date.now().toString(36)}`,
        code: `DRV-0${nextNum}`,
        fullName: driverForm.fullName.trim(),
        phone: driverForm.phone.trim(),
        dni: driverForm.dni.trim() || "081-000000-0000A",
        licenseNumber: driverForm.licenseNumber.trim() || "NIC-C1-0000",
        vehicleType: driverForm.vehicleType,
        vehiclePlate: driverForm.vehiclePlate.trim() || "CH-00000",
        vehicleModel: driverForm.vehicleModel.trim() || "Unidad de Reparto",
        pinCode: driverForm.pinCode.trim() || "1234",
        status: driverForm.status,
        colorTag: driverForm.colorTag,
        createdAt: new Date().toISOString().split("T")[0],
      };
      const updated = [...drivers, newDrv];
      setDrivers(updated);
      saveStoredRouteDrivers(updated);
      setActiveDriverId(newDrv.id);
      showToast(`¡Perfil de conductor "${newDrv.fullName}" (${newDrv.code}) creado con éxito!`);
    }
    setShowDriverModal(false);
  };

  // =========================================================
  // LEVANTAR PEDIDO DESDE INVENTARIO AL VISITAR UN PIN (CONDUCTOR)
  // =========================================================
  const handleOpenTakeOrderForPin = (pin: RouteMapPin) => {
    setOrderPinTarget(pin);
    setOrderItems([]);
    setProductSearch("");
    setOrderPaymentCondition("contra_entrega");
    setOrderNotes(pin.notes || "");
    setShowTakeOrderModal(true);
  };

  const handleAddProductToRouteOrder = (prod: Product) => {
    const existingIdx = orderItems.findIndex((item) => item.productId === prod.id);
    if (existingIdx >= 0) {
      const updated = [...orderItems];
      const newQty = updated[existingIdx].quantity + 1;
      updated[existingIdx] = {
        ...updated[existingIdx],
        quantity: newQty,
        subtotal: Number((newQty * prod.salePrice).toFixed(2)),
      };
      setOrderItems(updated);
    } else {
      setOrderItems([
        ...orderItems,
        {
          productId: prod.id,
          sku: prod.sku,
          name: prod.name,
          unit: prod.unit,
          quantity: 1,
          unitPrice: prod.salePrice,
          subtotal: prod.salePrice,
        },
      ]);
    }
  };

  const handleUpdateOrderItemQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setOrderItems(orderItems.filter((i) => i.productId !== productId));
      return;
    }
    setOrderItems(
      orderItems.map((i) =>
        i.productId === productId
          ? { ...i, quantity: qty, subtotal: Number((qty * i.unitPrice).toFixed(2)) }
          : i
      )
    );
  };

  const handleConfirmRouteOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderPinTarget || !currentRoute || orderItems.length === 0) {
      alert("Selecciona al menos un producto del inventario para levantar el pedido del cliente.");
      return;
    }

    const subtotal = orderItems.reduce((acc, i) => acc + i.subtotal, 0);
    const tax = Number((subtotal * ((tenant.taxPercentage || 15) / 100)).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));
    const nowIso = new Date().toISOString();
    const nextOrderNum = routeOrders.length + 1;

    const assignedDrv =
      activeDriver ||
      drivers.find((d) => currentRoute.assignedDriverIds.includes(d.id)) ||
      drivers[0];

    const newOrder: RouteCustomerOrder = {
      id: `rord-${Date.now().toString(36)}`,
      orderNumber: `PED-RUT-00${nextOrderNum}`,
      routeId: currentRoute.id,
      routeCode: currentRoute.code,
      routeName: currentRoute.name,
      pinId: orderPinTarget.id,
      placeName: orderPinTarget.placeName,
      contactName: orderPinTarget.contactName,
      contactPhone: orderPinTarget.contactPhone,
      address: orderPinTarget.address,
      driverId: assignedDrv?.id || "drv-1",
      driverName: assignedDrv?.fullName || "Conductor de Ruta",
      vehiclePlate: assignedDrv?.vehiclePlate || "CH-0000",
      items: orderItems,
      subtotal,
      tax,
      total,
      paymentCondition: orderPaymentCondition,
      status: "pendiente_despacho",
      createdAt: nowIso,
      notes: orderNotes.trim(),
    };

    // Actualizar estado del Pin en el mapa a "visitado_con_pedido"
    const updatedRoutes = routes.map((r) => {
      if (r.id === currentRoute.id) {
        return {
          ...r,
          pins: r.pins.map((p) =>
            p.id === orderPinTarget.id
              ? {
                  ...p,
                  status: "visitado_con_pedido" as const,
                  visitedAt: nowIso,
                  visitedByDriverName: assignedDrv?.fullName || "Conductor",
                }
              : p
          ),
        };
      }
      return r;
    });

    const updatedOrders = [newOrder, ...routeOrders];
    setRouteOrders(updatedOrders);
    saveStoredRouteOrders(updatedOrders);
    setRoutes(updatedRoutes);
    saveStoredDeliveryRoutes(updatedRoutes);

    setShowTakeOrderModal(false);
    showToast(
      `¡Pedido ${newOrder.orderNumber} por C$ ${total.toLocaleString("es-NI", { minimumFractionDigits: 2 })} registrado desde el Pin "${orderPinTarget.placeName}"!`
    );
  };

  // Facturar / Enviar Pedido de Ruta directamente a Caja POS
  const handleBillRouteOrderInPOS = (ord: RouteCustomerOrder) => {
    // Marcar pedido como entregado_facturado y pin como entregado
    const updatedOrders = routeOrders.map((o) =>
      o.id === ord.id ? { ...o, status: "entregado_facturado" as const } : o
    );
    setRouteOrders(updatedOrders);
    saveStoredRouteOrders(updatedOrders);

    const updatedRoutes = routes.map((r) => {
      if (r.id === ord.routeId) {
        return {
          ...r,
          pins: r.pins.map((p) => (p.id === ord.pinId ? { ...p, status: "entregado" as const } : p)),
        };
      }
      return r;
    });
    setRoutes(updatedRoutes);
    saveStoredDeliveryRoutes(updatedRoutes);

    if (onSendOrderToPOS) {
      onSendOrderToPOS({
        id: ord.id,
        source: "routes",
        patientId: ord.pinId,
        patientName: ord.placeName,
        ownerName: ord.contactName,
        customerPhone: ord.contactPhone,
        concept: `Pedido de Ruta ${ord.orderNumber} (${ord.routeCode} • Conductor: ${ord.driverName})`,
        consultationFee: 0,
        items: ord.items.map((it) => ({
          productId: it.productId,
          name: it.name,
          unit: it.unit,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          subtotal: it.subtotal,
        })),
        total: ord.subtotal,
      });
    } else {
      showToast(`Pedido ${ord.orderNumber} marcado como Entregado y Facturado.`);
    }
  };

  // Métricas generales
  const totalPinsCount = routes.reduce((acc, r) => acc + r.pins.length, 0);
  const visitedPinsCount = routes.reduce(
    (acc, r) => acc + r.pins.filter((p) => p.status !== "pendiente").length,
    0
  );
  const totalOrdersValue = routeOrders.reduce((acc, o) => acc + o.total, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Principal del Módulo de Rutas, Conductores y Mapa */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-neutral-900 dark:text-white tracking-tight">
                Rutas de Entrega, Mapa GPS, Conductores & Preventa
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-[10px] font-mono font-bold">
                MAPA INTERACTIVO & PEDIDOS
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Traza rutas en el mapa con pines de ubicación, asigna 1 o más conductores y toma pedidos del inventario en cada punto de visita.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleOpenNewDriverModal}
            className="px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-indigo-500" />
            <span>Crear Conductor</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNewRouteModal}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Crear Nueva Ruta</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* KPIs del Sistema de Rutas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
            <span>RUTAS TRAZADAS</span>
            <Compass className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-neutral-900 dark:text-white font-mono">
            {routes.length} <span className="text-xs font-normal text-neutral-400">Zonas</span>
          </div>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold block">
            ● {totalPinsCount} pines georreferenciados
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
            <span>FLOTA DE CONDUCTORES</span>
            <Truck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {drivers.length} <span className="text-xs font-normal text-neutral-400">Perfiles</span>
          </div>
          <span className="text-[11px] text-neutral-500 block">
            {drivers.filter((d) => d.status === "en_ruta").length} unidades en recorrido activo
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
            <span>PINES VISITADOS HOY</span>
            <MapPin className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-neutral-900 dark:text-white font-mono">
            {visitedPinsCount} / {totalPinsCount}
          </div>
          <span className="text-[11px] text-neutral-500 block">
            Puntos de entrega y preventa
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
            <span>PEDIDOS CAPTURADOS EN RUTA</span>
            <ShoppingCart className="w-4 h-4 text-apple-blue" />
          </div>
          <div className="text-2xl font-black text-apple-blue font-mono">
            C$ {totalOrdersValue.toLocaleString("es-NI", { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block">
            {routeOrders.length} pedido(s) recibidos de clientes
          </span>
        </div>
      </div>

      {/* Pestañas del Módulo de Rutas */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-neutral-200/80 dark:border-neutral-800">
        <button
          type="button"
          onClick={() => setActiveTab("map_routes")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "map_routes"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Mapa Interactivo & Pines de Ruta</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("driver_view")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "driver_view"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>Portal del Conductor (Mi Ruta & Levantar Pedido)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("drivers")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "drivers"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Perfiles de Conductores ({drivers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "orders"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Bandeja de Pedidos de Ruta ({routeOrders.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* PESTAÑA 1: MAPA INTERACTIVO, TRAZADO DE PINES Y RUTAS     */}
      {/* ======================================================== */}
      {activeTab === "map_routes" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda: Selector de Ruta, Conductores Asignados y Lista de Pines */}
          <div className="lg:col-span-4 space-y-4">
            {/* Selector de Ruta */}
            <div className="p-4 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase text-neutral-400">
                  Ruta Activa en Mapa:
                </span>
                {currentRoute && (
                  <button
                    type="button"
                    onClick={() => handleOpenEditRouteModal(currentRoute)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Editar Ruta / Conductores</span>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {routes.map((rt) => {
                  const isSel = currentRoute?.id === rt.id;
                  const assignedDriversObjs = drivers.filter((d) => rt.assignedDriverIds.includes(d.id));

                  return (
                    <div
                      key={rt.id}
                      onClick={() => {
                        setSelectedRouteId(rt.id);
                        setSelectedPinId(rt.pins[0]?.id || null);
                      }}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                        isSel
                          ? "bg-indigo-600/10 border-indigo-500 ring-2 ring-indigo-500/20"
                          : "bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200/70 dark:border-neutral-700/70 hover:border-neutral-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-mono font-bold text-[10px]">
                          {rt.code}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">
                          {rt.pins.length} pines • {rt.estimatedDistanceKm} km
                        </span>
                      </div>
                      <h3 className="text-xs font-extrabold text-neutral-900 dark:text-white leading-snug">
                        {rt.name}
                      </h3>

                      {/* Conductores asignados a esta ruta (1 o más) */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {assignedDriversObjs.length > 0 ? (
                          assignedDriversObjs.map((drv) => (
                            <span
                              key={drv.id}
                              className="px-2 py-0.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[10px] font-semibold flex items-center gap-1"
                            >
                              <Truck className="w-2.5 h-2.5 text-indigo-500" />
                              {drv.fullName.split(" ").slice(0, 2).join(" ")} ({drv.vehiclePlate})
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-amber-500">Sin conductores asignados</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lista de Paradas / Pines de la Ruta */}
            {currentRoute && (
              <div className="p-4 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-neutral-900 dark:text-white">
                    Paradas / Pines en {currentRoute.code} ({currentRoute.pins.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPlacingPinMode(true)}
                    className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Nuevo Pin</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {currentRoute.pins.map((pin) => {
                    const isPinSel = currentPin?.id === pin.id;
                    const meta = PIN_STATUS_META[pin.status];
                    return (
                      <div
                        key={pin.id}
                        onClick={() => setSelectedPinId(pin.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all space-y-1.5 ${
                          isPinSel
                            ? "bg-white dark:bg-neutral-800 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm"
                            : "bg-neutral-50/70 dark:bg-neutral-800/40 border-neutral-200/70 dark:border-neutral-700/60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-5 h-5 rounded-full text-white text-[10px] font-mono font-bold flex items-center justify-center shrink-0"
                              style={{ backgroundColor: meta.colorHex }}
                            >
                              {pin.sequenceOrder}
                            </span>
                            <h4 className="text-xs font-bold text-neutral-900 dark:text-white line-clamp-1">
                              {pin.placeName}
                            </h4>
                          </div>
                        </div>

                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 pl-7 line-clamp-1">
                          {pin.address} ({pin.cityZone})
                        </p>

                        <div className="pl-7 flex items-center justify-between pt-1">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${meta.badgeClass}`}>
                            {meta.label}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenTakeOrderForPin(pin);
                            }}
                            className="text-[11px] font-bold text-apple-blue hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            <span>Levantar Pedido</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Columna Derecha: Lienzo Cartográfico GPS con Pines Interactivos + Ficha del Lugar */}
          <div className="lg:col-span-8 space-y-4">
            <div className="p-4 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-3">
              {/* Barra de herramientas del Mapa y Saltos Rápidos a Otras Zonas */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-extrabold text-neutral-900 dark:text-white">
                    Cartografía GPS Interactiva — {currentRoute?.name || "Selecciona una Ruta"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Botones de navegación rápida por Zonas */}
                  <div className="hidden sm:flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl text-[10px] font-mono font-bold">
                    <button
                      type="button"
                      onClick={() => handleFlyToZone("norte")}
                      className="px-2 py-1 rounded-lg hover:bg-white dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 cursor-pointer transition-colors"
                      title="Enfocar Zona Norte (El Viejo / Somotillo)"
                    >
                      Norte
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFlyToZone("occidente")}
                      className="px-2 py-1 rounded-lg hover:bg-white dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 cursor-pointer transition-colors"
                      title="Enfocar Chinandega Centro & Corinto"
                    >
                      Centro
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFlyToZone("sur_leon")}
                      className="px-2 py-1 rounded-lg hover:bg-white dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 cursor-pointer transition-colors"
                      title="Enfocar Corredor Sur (León / Nagarote / Managua)"
                    >
                      Sur / León
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFlyToZone("regional")}
                      className="px-2 py-1 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/25 cursor-pointer transition-colors"
                      title="Alejar mapa para ver todas las zonas regionales"
                    >
                      Vista Regional (0.5x)
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPlacingPinMode(!isPlacingPinMode)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isPlacingPinMode
                        ? "bg-amber-500 text-black shadow-md animate-pulse"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
                    }`}
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>
                      {isPlacingPinMode
                        ? "Haz clic en cualquier punto del mapa para fijar el Pin..."
                        : "+ Colocar Pin en el Mapa"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Lienzo de Mapa Cartográfico Vectorial con Zoom (Acercar/Alejar) y Pan (Arrastrar a otras zonas) */}
              <div
                ref={mapContainerRef}
                onWheel={handleMapWheel}
                onMouseDown={handleMapMouseDown}
                onMouseMove={handleMapMouseMove}
                onMouseUp={handleMapMouseUp}
                onMouseLeave={handleMapMouseUp}
                onClick={handleMapClick}
                className={`relative w-full h-[460px] rounded-2xl overflow-hidden border select-none transition-colors ${
                  isPlacingPinMode
                    ? "cursor-crosshair border-amber-500 ring-4 ring-amber-500/20"
                    : isPanningMap
                    ? "cursor-grabbing border-indigo-500/50"
                    : "cursor-grab border-neutral-200 dark:border-neutral-800"
                } bg-[#e9eef5] dark:bg-[#111622]`}
              >
                {/* Controles Flotantes de Zoom (+ / - / Reset) e Indicador de Escala */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="absolute top-3 right-3 z-30 flex flex-col gap-1.5 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md p-1.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-lg"
                >
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-indigo-600 hover:text-white text-neutral-700 dark:text-neutral-200 flex items-center justify-center transition-colors cursor-pointer"
                    title="Acercar Mapa (Zoom In)"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  <div className="text-[10px] font-mono font-extrabold text-center py-0.5 text-indigo-600 dark:text-indigo-400">
                    {Math.round(mapZoom * 100)}%
                  </div>

                  <button
                    type="button"
                    onClick={handleZoomOut}
                    className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-indigo-600 hover:text-white text-neutral-700 dark:text-neutral-200 flex items-center justify-center transition-colors cursor-pointer"
                    title="Alejar Mapa para ver otras zonas (Zoom Out)"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>

                  <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-0.5" />

                  <button
                    type="button"
                    onClick={handleResetMapView}
                    className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 flex items-center justify-center transition-colors cursor-pointer"
                    title="Centrar y Restablecer Zoom (100%)"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Indicador superior izquierdo de interacción de arrastre */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-3 left-3 z-30 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800 text-[10px] font-mono text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5 shadow-sm pointer-events-none"
                >
                  <Move className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Arrastra el mapa o usa la rueda del mouse para explorar otras zonas</span>
                </div>

                {/* Capa Transformable del Mapa (Soporta Zoom In/Out y Pan libre hacia zonas exteriores) */}
                <div
                  ref={mapLayerRef}
                  style={{
                    transform: `translate(${mapPan.x}px, ${mapPan.y}px) scale(${mapZoom})`,
                    transformOrigin: "center center",
                  }}
                  className="absolute inset-0 w-full h-full transition-transform duration-75 ease-out"
                >
                  {/* Fondo Cartográfico Expandido SVG (-500 a 1500 en X, -250 a 750 en Y) para cubrir zonas alejadas */}
                  <svg
                    className="absolute -inset-[50%] w-[200%] h-[200%]"
                    preserveAspectRatio="none"
                    viewBox="-500 -250 2000 1000"
                  >
                    <defs>
                      <pattern id="map-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                        <path
                          d="M 50 0 L 0 0 0 50"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="0.7"
                          className="text-slate-300/60 dark:text-slate-800/80"
                        />
                      </pattern>
                    </defs>

                    <rect x="-500" y="-250" width="2000" height="1000" fill="url(#map-grid)" />

                    {/* Zonas Regionales Extendidas (Visibles al alejar o arrastrar el mapa) */}
                    {/* Zona Frontera Norte / Somotillo / Guasaule */}
                    <rect x="280" y="-190" width="340" height="170" rx="26" className="fill-teal-500/5 dark:fill-teal-500/10" />
                    {/* Zona Costera Noroeste / Jiquilillo / Potosí */}
                    <rect x="-380" y="-120" width="320" height="220" rx="26" className="fill-sky-500/5 dark:fill-sky-500/10" />
                    {/* Bloques Urbanos Centrales */}
                    <rect x="60" y="50" width="220" height="140" rx="18" className="fill-emerald-500/5 dark:fill-emerald-500/10" />
                    <rect x="350" y="160" width="280" height="190" rx="22" className="fill-indigo-500/5 dark:fill-indigo-500/15" />
                    <rect x="670" y="210" width="260" height="220" rx="22" className="fill-amber-500/5 dark:fill-amber-500/10" />
                    {/* Zona Extendida Este / Sur: Telica, Quezalguaque, La Paz Centro, Nagarote y Managua */}
                    <rect x="980" y="150" width="420" height="280" rx="28" className="fill-purple-500/5 dark:fill-purple-500/10" />
                    <rect x="750" y="470" width="520" height="220" rx="28" className="fill-rose-500/5 dark:fill-rose-500/10" />

                    {/* Litoral Pacífico Extendido */}
                    <path
                      d="M -500,240 Q -180,310 0,340 Q 140,360 220,430 T 680,750 L -500,750 Z"
                      className="fill-sky-400/20 dark:fill-sky-500/15"
                    />

                    {/* Carretera Panamericana / NIC-12 Extendida desde Frontera Norte hasta Managua */}
                    <path
                      d="M -380,-40 Q -120,40 40,90 Q 260,120 460,240 T 940,390 L 1450,620"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      className="text-white/80 dark:text-slate-800/90"
                    />
                    <path
                      d="M -380,-40 Q -120,40 40,90 Q 260,120 460,240 T 940,390 L 1450,620"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="10 8"
                      className="text-amber-500/60"
                    />

                    {/* Carretera Norte Somotillo -> El Viejo -> Chinandega -> Corinto */}
                    <path
                      d="M 450,-210 Q 320,-80 280,40 Q 340,210 200,380"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="9"
                      className="text-white/75 dark:text-slate-800/85"
                    />

                    {/* Corredor Este Extendido (Chinandega -> Chichigalpa -> Telica -> Malpaisillo -> Estelí/Norte) */}
                    <path
                      d="M 450,240 Q 630,220 750,300 T 960,260 L 1420,180"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-white/70 dark:text-slate-800/80"
                    />

                    {/* Etiquetas Cartográficas de Zonas Centrales y Zonas Extendidas */}
                    <text x="-290" y="-20" className="fill-slate-400 dark:fill-slate-500 text-[13px] font-mono font-bold">
                      PENÍNSULA COSIGÜINA / POTOSÍ
                    </text>
                    <text x="340" y="-110" className="fill-teal-600/70 dark:fill-teal-400/70 text-[14px] font-mono font-bold">
                      SOMOTILLO / FRONTERA NORTE
                    </text>
                    <text x="150" y="95" className="fill-slate-400 dark:fill-slate-500 text-[13px] font-mono font-bold">
                      EL VIEJO (ZONA NORTE)
                    </text>
                    <text x="415" y="195" className="fill-slate-400 dark:fill-slate-500 text-[14px] font-mono font-bold">
                      CHINANDEGA CENTRO
                    </text>
                    <text x="90" y="425" className="fill-sky-600/70 dark:fill-sky-400/70 text-[13px] font-mono font-bold">
                      PUERTO CORINTO
                    </text>
                    <text x="690" y="255" className="fill-slate-400 dark:fill-slate-500 text-[13px] font-mono font-bold">
                      CHICHIGALPA / POSOLTEGA
                    </text>
                    <text x="820" y="440" className="fill-slate-400 dark:fill-slate-500 text-[13px] font-mono font-bold">
                      CORREDOR LEÓN
                    </text>
                    <text x="1060" y="240" className="fill-purple-500/70 dark:fill-purple-400/70 text-[14px] font-mono font-bold">
                      TELICA / MALPAISILLO (ESTE)
                    </text>
                    <text x="920" y="575" className="fill-rose-500/70 dark:fill-rose-400/70 text-[14px] font-mono font-bold">
                      LA PAZ CENTRO / NAGAROTE / MANAGUA
                    </text>
                  </svg>

                  {/* Polilínea SVG que conecta en orden secuencial los Pines de la Ruta Activa */}
                  {currentRoute && currentRoute.pins.length > 1 && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                      <polyline
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="3.5"
                        strokeDasharray="8 6"
                        points={currentRoute.pins.map((p) => `${p.mapX}%,${p.mapY}%`).join(" ")}
                      />
                    </svg>
                  )}

                  {/* Pines Interactivos sobre el Mapa (Mantienen nitidez al escalar) */}
                  {currentRoute?.pins.map((pin) => {
                    const isSelected = currentPin?.id === pin.id;
                    const meta = PIN_STATUS_META[pin.status];

                    return (
                      <div
                        key={pin.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPinId(pin.id);
                        }}
                        style={{
                          left: `${pin.mapX}%`,
                          top: `${pin.mapY}%`,
                          transform: `translate(-50%, -50%) scale(${1 / Math.pow(mapZoom, 0.45)})`,
                        }}
                        className="absolute z-20 group cursor-pointer"
                      >
                        {/* Efecto radar si está seleccionado */}
                        {isSelected && (
                          <span
                            className="absolute -inset-3 rounded-full animate-ping opacity-35"
                            style={{ backgroundColor: meta.colorHex }}
                          />
                        )}

                        {/* Marcador Pin con número de parada */}
                        <div
                          className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-xs font-extrabold text-white shadow-lg transition-transform ${
                            isSelected ? "scale-115 ring-4 ring-white dark:ring-neutral-900" : "hover:scale-105"
                          }`}
                          style={{ backgroundColor: meta.colorHex }}
                        >
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>#{pin.sequenceOrder}</span>
                        </div>

                        {/* Etiqueta flotante con el nombre del cliente / punto */}
                        <div
                          className={`mt-1 px-2.5 py-1 rounded-xl text-[10px] font-bold whitespace-nowrap shadow-md border transition-all ${
                            isSelected
                              ? "bg-neutral-900 text-white border-indigo-400"
                              : "bg-white/95 dark:bg-neutral-900/90 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700"
                          }`}
                        >
                          {pin.placeName}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Leyenda inferior del mapa */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-2xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800 text-[10px] font-mono"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Pendiente
                    </span>
                    <span className="flex items-center gap-1 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-apple-blue inline-block" /> Con Pedido Levantado
                    </span>
                    <span className="flex items-center gap-1 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Entregado ✓
                    </span>
                  </div>
                  <span className="text-neutral-500">
                    Zoom: {Math.round(mapZoom * 100)}% • Aleja o arrastra el mapa para crear pines en otras zonas
                  </span>
                </div>
              </div>

              {/* Tarjeta de Información Detallada del Pin Seleccionado */}
              {currentPin ? (
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-mono font-bold text-[10px]">
                        PARADA #{currentPin.sequenceOrder}
                      </span>
                      <h4 className="text-sm font-extrabold text-neutral-900 dark:text-white">
                        {currentPin.placeName}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          PIN_STATUS_META[currentPin.status].badgeClass
                        }`}
                      >
                        {PIN_STATUS_META[currentPin.status].label}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-600 dark:text-neutral-300">
                      📍 <strong>Dirección:</strong> {currentPin.address} ({currentPin.cityZone}) •{" "}
                      <span className="font-mono text-[11px] text-neutral-400">
                        GPS: {currentPin.lat}, {currentPin.lng}
                      </span>
                    </p>

                    <p className="text-xs text-neutral-500">
                      👤 <strong>Contacto:</strong> {currentPin.contactName} • 📞 <strong>Tel:</strong>{" "}
                      <span className="font-mono">{currentPin.contactPhone}</span>
                    </p>

                    {currentPin.notes && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 italic">
                        Nota de visita: &ldquo;{currentPin.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenTakeOrderForPin(currentPin)}
                      className="px-4 py-2.5 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-extrabold shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Seleccionar Inventario & Crear Pedido</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeletePin(currentPin.id)}
                      className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 cursor-pointer"
                      title="Eliminar Pin de la Ruta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 2: PORTAL DEL CONDUCTOR (MI RUTA Y TOMA PEDIDOS) */}
      {/* ======================================================== */}
      {activeTab === "driver_view" && (
        <div className="space-y-5">
          {/* Selector de Perfil de Conductor Activo */}
          <div className="p-5 rounded-3xl bg-neutral-900 text-white border border-neutral-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                  Modo Cabina de Conductor // Preventa & Entregas en Campo
                </span>
                <h3 className="text-sm font-extrabold">
                  Visualizando Rutas y Pines Asignados al Conductor:
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {drivers.map((drv) => {
                const isAct = activeDriver?.id === drv.id;
                return (
                  <button
                    key={drv.id}
                    type="button"
                    onClick={() => setActiveDriverId(drv.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      isAct
                        ? "bg-emerald-500 text-black shadow-md"
                        : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>
                      {drv.fullName} ({drv.vehiclePlate})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {activeDriver && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Credencial del Conductor y Rutas Asignadas */}
              <div className="lg:col-span-4 space-y-4">
                <div className="p-5 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-xs">
                      {activeDriver.code}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${DRIVER_STATUS_BADGES[activeDriver.status].classes}`}>
                      {DRIVER_STATUS_BADGES[activeDriver.status].label}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-extrabold text-neutral-900 dark:text-white">
                      {activeDriver.fullName}
                    </h4>
                    <p className="text-xs text-neutral-500">
                      {VEHICLE_LABELS[activeDriver.vehicleType]} • <strong>{activeDriver.vehicleModel}</strong>
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 text-xs font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Placa Unidad:</span>
                      <span className="font-bold text-neutral-900 dark:text-white">{activeDriver.vehiclePlate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Licencia:</span>
                      <span className="font-bold">{activeDriver.licenseNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Teléfono:</span>
                      <span className="font-bold">{activeDriver.phone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hoja de Ruta y Pines que debe visitar el Conductor */}
              <div className="lg:col-span-8 space-y-4">
                {driverAssignedRoutes.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 text-center space-y-2">
                    <Navigation className="w-8 h-8 text-neutral-400 mx-auto" />
                    <h4 className="text-sm font-bold">Este conductor aún no tiene rutas asignadas</h4>
                    <p className="text-xs text-neutral-400">
                      Ve a la pestaña &ldquo;Mapa Interactivo & Pines de Ruta&rdquo; y edita una ruta para asignarle este conductor.
                    </p>
                  </div>
                ) : (
                  driverAssignedRoutes.map((rt) => (
                    <div
                      key={rt.id}
                      className="p-5 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-200/80 dark:border-neutral-800">
                        <div>
                          <span className="text-[11px] font-mono font-bold text-indigo-500">
                            {rt.code} • {rt.scheduledDate} • ({rt.estimatedDistanceKm} km)
                          </span>
                          <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">
                            {rt.name}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRouteId(rt.id);
                            setActiveTab("map_routes");
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-xs font-bold cursor-pointer"
                        >
                          Ver en Mapa GPS
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {rt.pins.map((pin) => {
                          const meta = PIN_STATUS_META[pin.status];
                          return (
                            <div
                              key={pin.id}
                              className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/70 dark:border-neutral-700/60 flex flex-wrap items-center justify-between gap-3"
                            >
                              <div className="flex items-start gap-3">
                                <span
                                  className="w-7 h-7 rounded-full text-white font-mono text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5"
                                  style={{ backgroundColor: meta.colorHex }}
                                >
                                  #{pin.sequenceOrder}
                                </span>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-xs font-extrabold text-neutral-900 dark:text-white">
                                      {pin.placeName}
                                    </h4>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${meta.badgeClass}`}>
                                      {meta.label}
                                    </span>
                                  </div>
                                  <p className="text-xs text-neutral-500">
                                    📍 {pin.address} ({pin.cityZone})
                                  </p>
                                  <p className="text-[11px] text-neutral-400">
                                    Contacto: <strong>{pin.contactName}</strong> ({pin.contactPhone})
                                  </p>
                                  {pin.notes && (
                                    <p className="text-[11px] text-amber-600 dark:text-amber-400">
                                      📋 {pin.notes}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRouteId(rt.id);
                                  handleOpenTakeOrderForPin(pin);
                                }}
                                className="px-4 py-2 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                <span>Seleccionar de Inventario / Crear Pedido</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 3: PERFILES DE CONDUCTORES Y UNIDADES DE REPARTO */}
      {/* ======================================================== */}
      {activeTab === "drivers" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {drivers.map((drv) => {
              const badge = DRIVER_STATUS_BADGES[drv.status];
              const driverRoutes = routes.filter((r) => r.assignedDriverIds.includes(drv.id));

              return (
                <div
                  key={drv.id}
                  className="p-5 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-2xl text-white font-mono font-extrabold text-sm flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: drv.colorTag }}
                      >
                        {drv.fullName.charAt(0)}
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-neutral-400 font-bold">{drv.code}</span>
                        <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">
                          {drv.fullName}
                        </h3>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${badge.classes}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Unidad:</span>
                      <span className="font-bold text-neutral-900 dark:text-white">{drv.vehicleModel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Placa:</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{drv.vehiclePlate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Licencia:</span>
                      <span>{drv.licenseNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Teléfono:</span>
                      <span>{drv.phone}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold block">
                      Rutas Asignadas ({driverRoutes.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {driverRoutes.map((r) => (
                        <span
                          key={r.id}
                          className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold"
                        >
                          {r.code} — {r.name.split("(")[0]}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDriverId(drv.id);
                        setActiveTab("driver_view");
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                    >
                      Abrir Vista Conductor
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditDriverModal(drv)}
                      className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-600 dark:text-neutral-300 cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 4: BANDEJA DE PEDIDOS LEVANTADOS EN RUTA         */}
      {/* ======================================================== */}
      {activeTab === "orders" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-neutral-200/80 dark:border-neutral-800 shadow-apple space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-200/80 dark:border-neutral-800">
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">
                Pedidos Levantados por Conductores en Ruta
              </h3>
              <p className="text-xs text-neutral-400">
                Cada vez que un conductor visita un Pin y selecciona productos del inventario para el cliente, el pedido cae automáticamente aquí para su despacho o facturación en POS.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {routeOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/70 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md bg-apple-blue text-white font-mono font-bold text-xs">
                      {ord.orderNumber}
                    </span>
                    <span className="text-xs font-extrabold text-neutral-900 dark:text-white">
                      {ord.placeName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-[10px] font-mono font-bold">
                      {ord.routeCode}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        ord.status === "entregado_facturado"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {ord.status === "entregado_facturado" ? "ENTREGADO & FACTURADO ✓" : "PENDIENTE DE DESPACHO / FACTURA"}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-500">
                    📍 {ord.address} • Contacto: <strong>{ord.contactName}</strong> ({ord.contactPhone})
                  </p>

                  <p className="text-[11px] font-mono text-neutral-400">
                    🚚 Conductor: <strong>{ord.driverName}</strong> (Placa {ord.vehiclePlate}) • Fecha:{" "}
                    {new Date(ord.createdAt).toLocaleString("es-NI")}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {ord.items.map((it, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[11px] font-semibold"
                      >
                        <strong>
                          {it.quantity} {it.unit}
                        </strong>{" "}
                        × {it.name} (C$ {it.subtotal.toFixed(2)})
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right space-y-2">
                  <div>
                    <span className="text-[10px] font-mono text-neutral-400 block">TOTAL PEDIDO (IVA INC.)</span>
                    <span className="text-lg font-black text-apple-blue font-mono">
                      C$ {ord.total.toLocaleString("es-NI", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {ord.status !== "entregado_facturado" && (
                    <button
                      type="button"
                      onClick={() => handleBillRouteOrderInPOS(ord)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Cargar a Caja POS & Facturar</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: COLOCAR NUEVO PIN DE UBICACIÓN EN EL MAPA       */}
      {/* ======================================================== */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-[#18191f] text-neutral-900 dark:text-neutral-100 rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-500" />
                <div>
                  <h3 className="font-extrabold text-sm">Nuevo Pin de Ubicación en {currentRoute?.code}</h3>
                  <span className="text-[10px] font-mono text-neutral-400">
                    Coordenadas GPS fijadas: {pendingPinCoords.lat}, {pendingPinCoords.lng}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewPin} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold mb-1">
                  Nombre del Establecimiento / Cliente / Obra:
                </label>
                <input
                  type="text"
                  required
                  value={pinForm.placeName}
                  onChange={(e) => setPinForm({ ...pinForm, placeName: e.target.value })}
                  placeholder="Ej. Ferretería San Miguel / Proyecto Residencial..."
                  className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Persona de Contacto:</label>
                  <input
                    type="text"
                    value={pinForm.contactName}
                    onChange={(e) => setPinForm({ ...pinForm, contactName: e.target.value })}
                    placeholder="Ej. Don Manuel"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Teléfono / WhatsApp:</label>
                  <input
                    type="text"
                    value={pinForm.contactPhone}
                    onChange={(e) => setPinForm({ ...pinForm, contactPhone: e.target.value })}
                    placeholder="+505 8888-0000"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold mb-1">Dirección Exacta / Referencia:</label>
                  <input
                    type="text"
                    required
                    value={pinForm.address}
                    onChange={(e) => setPinForm({ ...pinForm, address: e.target.value })}
                    placeholder="Ej. Parque Central 2c al Sur..."
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Municipio / Zona:</label>
                  <input
                    type="text"
                    value={pinForm.cityZone}
                    onChange={(e) => setPinForm({ ...pinForm, cityZone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1">Instrucciones para el Conductor:</label>
                <input
                  type="text"
                  value={pinForm.notes}
                  onChange={(e) => setPinForm({ ...pinForm, notes: e.target.value })}
                  placeholder="Ej. Preguntar por bodega trasera y mostrar catálogo..."
                  className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Guardar Pin en el Mapa
                </button>
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: CREAR / EDITAR RUTA Y SELECCIONAR CONDUCTORES   */}
      {/* ======================================================== */}
      {showRouteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-[#18191f] text-neutral-900 dark:text-neutral-100 rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-500" />
                <h3 className="font-extrabold text-sm">
                  {editingRouteId ? "Editar Ruta y Conductores Asignados" : "Crear Nueva Ruta de Entrega"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRouteModal(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRoute} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold mb-1">Nombre de la Ruta:</label>
                <input
                  type="text"
                  required
                  value={routeForm.name}
                  onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
                  placeholder="Ej. Ruta Occidente Comercial (Chinandega - León)"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1">Descripción de Cobertura:</label>
                <input
                  type="text"
                  value={routeForm.zoneDescription}
                  onChange={(e) => setRouteForm({ ...routeForm, zoneDescription: e.target.value })}
                  placeholder="Ej. Ferreterías mayoristas y proyectos de construcción"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                />
              </div>

              {/* Selección de 1 o más Conductores */}
              <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-2">
                <label className="block text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400">
                  Selecciona 1 o más Conductores para esta Ruta:
                </label>
                <div className="space-y-1.5">
                  {drivers.map((drv) => {
                    const isChecked = routeForm.assignedDriverIds.includes(drv.id);
                    return (
                      <div
                        key={drv.id}
                        onClick={() => handleToggleDriverInRouteForm(drv.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                          isChecked
                            ? "bg-indigo-600/15 border-indigo-500 text-indigo-600 dark:text-indigo-300 font-bold"
                            : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4" />
                          <div>
                            <span className="block">{drv.fullName}</span>
                            <span className="text-[10px] font-mono text-neutral-400">
                              {drv.vehicleModel} • Placa: {drv.vehiclePlate}
                            </span>
                          </div>
                        </div>
                        <span className="font-mono text-xs">{isChecked ? "✓ Asignado" : "+ Asignar"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Fecha Programada:</label>
                  <input
                    type="date"
                    value={routeForm.scheduledDate}
                    onChange={(e) => setRouteForm({ ...routeForm, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Distancia Estimada (Km):</label>
                  <input
                    type="number"
                    value={routeForm.estimatedDistanceKm}
                    onChange={(e) => setRouteForm({ ...routeForm, estimatedDistanceKm: parseFloat(e.target.value) || 10 })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  {editingRouteId ? "Guardar Cambios de Ruta" : "Crear Ruta"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRouteModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: CREAR / EDITAR PERFIL DE CONDUCTOR              */}
      {/* ======================================================== */}
      {showDriverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-[#18191f] text-neutral-900 dark:text-neutral-100 rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-500" />
                <h3 className="font-extrabold text-sm">
                  {editingDriverId ? "Editar Perfil de Conductor" : "Crear Perfil de Conductor de Ruta"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDriverModal(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDriver} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Nombre Completo del Conductor:</label>
                  <input
                    type="text"
                    required
                    value={driverForm.fullName}
                    onChange={(e) => setDriverForm({ ...driverForm, fullName: e.target.value })}
                    placeholder="Ej. Carlos Alberto Pineda"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Teléfono Móvil:</label>
                  <input
                    type="text"
                    value={driverForm.phone}
                    onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                    placeholder="+505 8888-1111"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Cédula de Identidad:</label>
                  <input
                    type="text"
                    value={driverForm.dni}
                    onChange={(e) => setDriverForm({ ...driverForm, dni: e.target.value })}
                    placeholder="081-000000-0000A"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Nº Licencia de Conducir:</label>
                  <input
                    type="text"
                    value={driverForm.licenseNumber}
                    onChange={(e) => setDriverForm({ ...driverForm, licenseNumber: e.target.value })}
                    placeholder="NIC-C1-492018"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Tipo de Vehículo:</label>
                  <select
                    value={driverForm.vehicleType}
                    onChange={(e) => setDriverForm({ ...driverForm, vehicleType: e.target.value as DriverVehicleType })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-semibold"
                  >
                    {Object.entries(VEHICLE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Placa del Vehículo:</label>
                  <input
                    type="text"
                    value={driverForm.vehiclePlate}
                    onChange={(e) => setDriverForm({ ...driverForm, vehiclePlate: e.target.value })}
                    placeholder="CH-24910"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Modelo / Capacidad:</label>
                  <input
                    type="text"
                    value={driverForm.vehicleModel}
                    onChange={(e) => setDriverForm({ ...driverForm, vehicleModel: e.target.value })}
                    placeholder="Isuzu NPR 4 Ton"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Guardar Perfil de Conductor
                </button>
                <button
                  type="button"
                  onClick={() => setShowDriverModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: SELECCIONAR DE INVENTARIO Y CREAR PEDIDO EN PIN */}
      {/* ======================================================== */}
      {showTakeOrderModal && orderPinTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-3xl bg-white dark:bg-[#18191f] text-neutral-900 dark:text-neutral-100 rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-apple-blue text-white font-mono font-bold text-[10px]">
                    PIN #{orderPinTarget.sequenceOrder}
                  </span>
                  <h3 className="font-extrabold text-sm">
                    Levantar Pedido en Sitio — {orderPinTarget.placeName}
                  </h3>
                </div>
                <p className="text-[11px] text-neutral-400">
                  📍 {orderPinTarget.address} • Cliente: {orderPinTarget.contactName} ({orderPinTarget.contactPhone})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTakeOrderModal(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
              {/* Catálogo de Inventario Disponible para el Conductor */}
              <div className="md:col-span-7 space-y-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Buscar producto en inventario por nombre o SKU..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs"
                  />
                </div>

                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                  {products
                    .filter(
                      (p) =>
                        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                        p.sku.toLowerCase().includes(productSearch.toLowerCase())
                    )
                    .map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => handleAddProductToRouteOrder(prod)}
                        className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 hover:bg-apple-blue/10 border border-neutral-200/70 dark:border-neutral-700 cursor-pointer flex items-center justify-between transition-all"
                      >
                        <div>
                          <span className="font-bold text-neutral-900 dark:text-white block">
                            {prod.name}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400">
                            SKU: {prod.sku} • Stock: <strong>{prod.stock} {prod.unit}</strong>
                          </span>
                        </div>
                        <div className="text-right font-mono">
                          <span className="font-extrabold text-apple-blue block">
                            C$ {prod.salePrice.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans font-bold">
                            + Agregar
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Resumen del Pedido del Cliente Visitado */}
              <div className="md:col-span-5 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <span className="text-[11px] font-mono font-bold uppercase text-apple-blue block">
                    Productos Solicitados por el Cliente ({orderItems.length}):
                  </span>

                  {orderItems.length === 0 ? (
                    <p className="text-xs text-neutral-400 py-8 text-center">
                      Haz clic en los productos del inventario a la izquierda para armar el pedido del cliente.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-[210px] overflow-y-auto pr-1">
                      {orderItems.map((item) => (
                        <div
                          key={item.productId}
                          className="p-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/70 dark:border-neutral-700 space-y-1"
                        >
                          <div className="flex justify-between font-bold">
                            <span className="line-clamp-1">{item.name}</span>
                            <span className="font-mono">C$ {item.subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-neutral-400 font-mono">
                              C$ {item.unitPrice} / {item.unit}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateOrderItemQty(item.productId, item.quantity - 1)}
                                className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-700 font-bold cursor-pointer"
                              >
                                -
                              </button>
                              <span className="font-mono font-bold px-1">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateOrderItemQty(item.productId, item.quantity + 1)}
                                className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-700 font-bold cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <form onSubmit={handleConfirmRouteOrder} className="space-y-2.5 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Condición de Pago:</label>
                    <select
                      value={orderPaymentCondition}
                      onChange={(e) => setOrderPaymentCondition(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold"
                    >
                      <option value="contra_entrega">Pago Contra Entrega</option>
                      <option value="contado_efectivo">Contado en Efectivo al Conductor</option>
                      <option value="transferencia">Transferencia Bancaria</option>
                    </select>
                  </div>

                  <div className="flex justify-between text-sm font-extrabold font-mono pt-1">
                    <span>TOTAL + IVA:</span>
                    <span className="text-apple-blue">
                      C${" "}
                      {(
                        orderItems.reduce((a, b) => a + b.subtotal, 0) *
                        (1 + (tenant.taxPercentage || 15) / 100)
                      ).toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirmar y Enviar Pedido</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
