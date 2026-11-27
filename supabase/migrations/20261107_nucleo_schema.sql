-- ==============================================================================
-- NÚCLEO ERP v3.5 - COMPLETE MULTI-TENANT SUPABASE POSTGRESQL SCHEMA
-- Soporta todos los módulos: POS, Facturación, Caja/Arqueos Z, Inventario, Lotes,
-- Clientes, Usuarios/Roles, Clínica Dental (Odontograma FDI), Veterinaria,
-- RRHH & Nómina, Producción & Recetas (BOM), Rutas GPS & Conductores, y Helpdesk.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. TABLA MAESTRA DE NEGOCIOS (MULTI-TENANT) & CONFIGURACIONES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.nucleo_tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    legal_name TEXT,
    tax_id TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT DEFAULT 'Chinandega',
    owner JSONB NOT NULL DEFAULT '{}'::jsonb,
    business_vertical TEXT NOT NULL DEFAULT 'ferreteria',
    currency TEXT NOT NULL DEFAULT 'NIO',
    secondary_currency TEXT NOT NULL DEFAULT 'USD',
    exchange_rate NUMERIC(12, 4) NOT NULL DEFAULT 36.6200,
    tax_percentage NUMERIC(6, 2) NOT NULL DEFAULT 15.00,
    active_modules TEXT[] NOT NULL DEFAULT ARRAY['pos', 'inventory', 'billing', 'customers'],
    ticket_format TEXT NOT NULL DEFAULT '80mm',
    ticket_header TEXT,
    ticket_footer TEXT,
    invoice_slogan TEXT,
    show_tax_breakdown BOOLEAN DEFAULT TRUE,
    show_usd_equivalence BOOLEAN DEFAULT TRUE,
    show_barcode_on_ticket BOOLEAN DEFAULT TRUE,
    logo_url TEXT,
    show_logo_on_ticket BOOLEAN DEFAULT TRUE,
    logo_size TEXT DEFAULT 'md',
    bluetooth_printer_name TEXT,
    auto_print_bluetooth BOOLEAN DEFAULT FALSE,
    is_setup_completed BOOLEAN DEFAULT TRUE,
    monthly_plan_price NUMERIC(10, 2) DEFAULT 35.00,
    plan_name TEXT DEFAULT 'Pro',
    billing_cycle TEXT DEFAULT 'monthly',
    next_payment_date TEXT,
    payment_status TEXT DEFAULT 'active',
    admin_assigned_by TEXT,
    plan_assigned_date TEXT,
    billing_cut_day INTEGER DEFAULT 10,
    billing_due_day INTEGER DEFAULT 5,
    login_username TEXT,
    login_password TEXT,
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 2. USUARIOS Y ROLES POR NEGOCIO (CONTROL DE ACCESO GRANULAR)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.nucleo_users (
    id TEXT PRIMARY KEY,
    tenant_id TEXT REFERENCES public.nucleo_tenants(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    username TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    pin_code TEXT NOT NULL,
    password TEXT,
    role TEXT NOT NULL DEFAULT 'cashier', -- 'superadmin', 'owner', 'cashier', 'inventory_clerk', 'driver', 'supervisor', 'custom'
    role_label TEXT NOT NULL DEFAULT 'Cajero',
    allowed_modules TEXT[] NOT NULL DEFAULT ARRAY['pos'],
    active BOOLEAN NOT NULL DEFAULT TRUE,
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nucleo_users_tenant ON public.nucleo_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_nucleo_users_username ON public.nucleo_users(username);

-- ==============================================================================
-- 3. INVENTARIO, PRODUCTOS Y LOTES (MULTI-UNIDAD & FEFO)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.nucleo_products (
    id TEXT NOT NULL,
    tenant_id TEXT NOT NULL REFERENCES public.nucleo_tenants(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    barcode TEXT,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    unit TEXT NOT NULL DEFAULT 'Unidad',
    cost_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    sale_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    stock NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    min_stock NUMERIC(14, 2) NOT NULL DEFAULT 5.00,
    has_batches BOOLEAN NOT NULL DEFAULT FALSE,
    batches JSONB NOT NULL DEFAULT '[]'::jsonb,
    batch_number TEXT,
    expiration_date TEXT,
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (tenant_id, id)
);

CREATE INDEX IF NOT EXISTS idx_nucleo_products_tenant ON public.nucleo_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_nucleo_products_sku ON public.nucleo_products(tenant_id, sku);
CREATE INDEX IF NOT EXISTS idx_nucleo_products_barcode ON public.nucleo_products(tenant_id, barcode);

-- ==============================================================================
-- 4. DIRECTORIO DE CLIENTES POR NEGOCIO
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.nucleo_customers (
    id TEXT NOT NULL,
    tenant_id TEXT NOT NULL REFERENCES public.nucleo_tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    business_name TEXT,
    phone TEXT,
    email TEXT,
    tax_id TEXT,
    address TEXT,
    city TEXT DEFAULT 'Chinandega',
    total_purchases NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    last_purchase_date TEXT,
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (tenant_id, id)
);

CREATE INDEX IF NOT EXISTS idx_nucleo_customers_tenant ON public.nucleo_customers(tenant_id);

-- ==============================================================================
-- 5. SESIONES DE CAJA Y ARQUEOS DE TURNO (CORTE Z)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.nucleo_cash_sessions (
    id TEXT NOT NULL,
    tenant_id TEXT NOT NULL REFERENCES public.nucleo_tenants(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'open', -- 'open' | 'closed'
    opened_by TEXT NOT NULL,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    opening_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    closed_by TEXT,
    closed_at TIMESTAMPTZ,
    cash_sales_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    card_sales_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    transfer_sales_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_sales NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_profit NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    sales_count INTEGER NOT NULL DEFAULT 0,
    expected_cash_in_drawer NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    actual_cash_in_drawer NUMERIC(14, 2),
    difference NUMERIC(14, 2),
    notes TEXT,
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (tenant_id, id)
);

CREATE INDEX IF NOT EXISTS idx_nucleo_cash_sessions_tenant ON public.nucleo_cash_sessions(tenant_id, opened_at DESC);

-- ==============================================================================
-- 6. FACTURAS EMITIDAS EN CAJA (VENTAS POS & VISUALIZADOR DE FACTURAS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.nucleo_sales (
    id TEXT NOT NULL,
    tenant_id TEXT NOT NULL REFERENCES public.nucleo_tenants(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    customer_id TEXT,
    customer_name TEXT NOT NULL DEFAULT 'Cliente de Contado',
    customer_tax_id TEXT,
    payment_method TEXT NOT NULL DEFAULT 'cash', -- 'cash' | 'card' | 'transfer'
    payment_reference TEXT,
    amount_paid NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    change_given NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tax NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    cost_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    profit NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'NIO',
    exchange_rate NUMERIC(12, 4) NOT NULL DEFAULT 36.6200,
    cashier_name TEXT,
    seller_name TEXT,
    cash_session_id TEXT,
    status TEXT NOT NULL DEFAULT 'completed', -- 'completed' | 'voided'
    reprint_count INTEGER NOT NULL DEFAULT 0,
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, id)
);

CREATE INDEX IF NOT EXISTS idx_nucleo_sales_tenant_date ON public.nucleo_sales(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nucleo_sales_invoice ON public.nucleo_sales(tenant_id, invoice_number);

-- ==============================================================================
-- 7. MÓDULO VETERINARIO (PACIENTES, CONSULTAS, VACUNAS, DESPARASITACIÓN)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.nucleo_vet_patients (
    id TEXT NOT NULL,
    tenant_id TEXT NOT NULL REFERENCES public.nucleo_tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    species TEXT NOT NULL,
    breed TEXT,
    owner_name TEXT NOT NULL,
    owner_phone TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    consultations JSONB NOT NULL DEFAULT '[]'::jsonb,
    vaccines JSONB NOT NULL DEFAULT '[]'::jsonb,
    dewormings JSONB NOT NULL DEFAULT '[]'::jsonb,
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (tenant_id, id)
);

CREATE INDEX IF NOT EXISTS idx_nucleo_vet_patients_tenant ON public.nucleo_vet_patients(tenant_id);

-- ==============================================================================
-- 8. MÓDULO CLÍNICO Y DENTAL (PACIENTES, ODONTOGRAMA FDI 32 PIEZAS, CONSULTAS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.nucleo_clinical_patients (
    id TEXT NOT NULL,
    tenant_id TEXT NOT NULL REFERENCES public.nucleo_tenants(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    dni TEXT,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    odontogram JSONB NOT NULL DEFAULT '[]'::jsonb,
    consultations JSONB NOT NULL DEFAULT '[]'::jsonb,
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (tenant_id, id)
);

CREATE INDEX IF NOT EXISTS idx_nucleo_clinical_patients_tenant ON public.nucleo_clinical_patients(tenant_id);

-- ==============================================================================
-- 9. MÓDULO RECURSOS HUMANOS, ASISTENCIA Y PLANILLA DE NÓMINA
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.nucleo_hr_employees (
    id TEXT NOT NULL,
    tenant_id TEXT NOT NULL REFERENCES public.nucleo_tenants(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    full_name TEXT NOT NULL,
    dni TEXT,
    inss_number TEXT,
    position TEXT,
    department TEXT,
    base_monthly_salary NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'activo',
    attendance JSONB NOT NULL DEFAULT '[]'::jsonb,
    movements JSONB NOT NULL DEFAULT '[]'::jsonb,
    payroll_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (tenant_id, id)
);

CREATE INDEX IF NOT EXISTS idx_nucleo_hr_employees_tenant ON public.nucleo_hr_employees(tenant_id);

-- ==============================================================================
-- 10. MÓDULO PRODUCCIÓN, FÓRMULAS Y RECETAS (BOM)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.nucleo_production_recipes (
    id TEXT NOT NULL,
    tenant_id TEXT NOT NULL REFERENCES public.nucleo_tenants(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    output_product_name TEXT NOT NULL,
    total_recipe_cost NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    suggested_sale_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS public.nucleo_production_orders (
    id TEXT NOT NULL,
    tenant_id TEXT NOT NULL REFERENCES public.nucleo_tenants(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    recipe_id TEXT NOT NULL,
    recipe_name TEXT NOT NULL,
    batches_to_produce NUMERIC(12, 2) NOT NULL DEFAULT 1,
    total_output_quantity NUMERIC(14, 2) NOT NULL DEFAULT 1,
    total_estimated_cost NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'planificada',
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (tenant_id, id)
);

CREATE INDEX IF NOT EXISTS idx_nucleo_recipes_tenant ON public.nucleo_production_recipes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_nucleo_prod_orders_tenant ON public.nucleo_production_orders(tenant_id);

-- ==============================================================================
-- 11. MÓDULO RUTAS DE REPARTO GPS, CONDUCTORES Y PEDIDOS EN RUTA
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.nucleo_route_drivers (
    id TEXT NOT NULL,
    tenant_id TEXT NOT NULL REFERENCES public.nucleo_tenants(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    vehicle_type TEXT,
    vehicle_plate TEXT,
    status TEXT NOT NULL DEFAULT 'disponible',
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS public.nucleo_delivery_routes (
    id TEXT NOT NULL,
    tenant_id TEXT NOT NULL REFERENCES public.nucleo_tenants(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'activa',
    assigned_driver_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    pins JSONB NOT NULL DEFAULT '[]'::jsonb,
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS public.nucleo_route_orders (
    id TEXT NOT NULL,
    tenant_id TEXT NOT NULL REFERENCES public.nucleo_tenants(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    route_id TEXT NOT NULL,
    pin_id TEXT,
    place_name TEXT NOT NULL,
    driver_id TEXT,
    driver_name TEXT,
    total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'pendiente_despacho',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (tenant_id, id)
);

CREATE INDEX IF NOT EXISTS idx_nucleo_drivers_tenant ON public.nucleo_route_drivers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_nucleo_routes_tenant ON public.nucleo_delivery_routes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_nucleo_route_orders_tenant ON public.nucleo_route_orders(tenant_id);

-- ==============================================================================
-- 12. HELPDESK & SOPORTE TÉCNICO (NEGOCIOS <-> SUPERADMIN GOD MODE)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.nucleo_support_tickets (
    id TEXT PRIMARY KEY,
    ticket_code TEXT NOT NULL,
    tenant_id TEXT NOT NULL REFERENCES public.nucleo_tenants(id) ON DELETE CASCADE,
    tenant_name TEXT NOT NULL,
    type TEXT NOT NULL,
    subject TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'media',
    status TEXT NOT NULL DEFAULT 'open',
    unread_by_admin BOOLEAN DEFAULT TRUE,
    unread_by_client BOOLEAN DEFAULT FALSE,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nucleo_tickets_tenant ON public.nucleo_support_tickets(tenant_id);

-- ==============================================================================
-- 13. ROW LEVEL SECURITY (RLS) MULTI-TENANT POLICIES
-- Permite lectura/escritura autenticada o mediante API Key del cliente con
-- aislamiento por tenant_id en cada consulta de la aplicación.
-- ==============================================================================
ALTER TABLE public.nucleo_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nucleo_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nucleo_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nucleo_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nucleo_cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nucleo_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nucleo_vet_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nucleo_clinical_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nucleo_hr_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nucleo_production_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nucleo_production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nucleo_route_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nucleo_delivery_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nucleo_route_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nucleo_support_tickets ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'nucleo_tenants',
        'nucleo_users',
        'nucleo_products',
        'nucleo_customers',
        'nucleo_cash_sessions',
        'nucleo_sales',
        'nucleo_vet_patients',
        'nucleo_clinical_patients',
        'nucleo_hr_employees',
        'nucleo_production_recipes',
        'nucleo_production_orders',
        'nucleo_route_drivers',
        'nucleo_delivery_routes',
        'nucleo_route_orders',
        'nucleo_support_tickets'
    ]
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "allow_app_access_%I" ON public.%I;', tbl, tbl);
        EXECUTE format(
            'CREATE POLICY "allow_app_access_%I" ON public.%I FOR ALL USING (true) WITH CHECK (true);',
            tbl, tbl
        );
    END LOOP;
END $$;
