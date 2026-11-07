-- ==============================================================================
-- NÚCLEO ERP - MULTI-TENANT MODULAR SCHEMA
-- Compatible con Supabase PostgreSQL + Row Level Security (RLS)
-- ==============================================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TENANTS (Negocios / Organizaciones)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    business_type TEXT NOT NULL DEFAULT 'general', -- 'ferreteria', 'pulperia', 'agroservicio', 'restaurante', 'farmacia', etc.
    currency TEXT NOT NULL DEFAULT 'NIO', -- 'NIO' | 'USD'
    secondary_currency TEXT DEFAULT 'USD',
    exchange_rate NUMERIC(10, 4) DEFAULT 36.6200, -- Tipo de cambio Córdoba / Dólar
    tax_percentage NUMERIC(5, 2) DEFAULT 15.00, -- 15% IVA Nicaragua
    tax_id TEXT, -- RUC / Cédula
    phone TEXT,
    email TEXT,
    address TEXT,
    logo_url TEXT,
    subscription_plan TEXT NOT NULL DEFAULT 'starter', -- 'starter', 'pro', 'enterprise'
    subscription_status TEXT NOT NULL DEFAULT 'active', -- 'active', 'trial', 'past_due', 'suspended'
    monthly_price NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MÓDULOS ACTIVOS POR TENANT
CREATE TABLE IF NOT EXISTS public.tenant_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    module_key TEXT NOT NULL, -- 'pos', 'inventory', 'billing', 'crm', 'receivables', 'expenses', 'hr', 'production'
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    settings JSONB DEFAULT '{}'::jsonb,
    activated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, module_key)
);

-- 3. ROLES DINÁMICOS
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_owner_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PERMISOS GRANULARES DE ROLES
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_key TEXT NOT NULL, -- e.g. 'inventory.read', 'inventory.write', 'sales.create', 'sales.refund', 'invoices.cancel'
    UNIQUE(role_id, permission_key)
);

-- 5. PERFILES DE USUARIOS (Vinculados a auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    is_owner BOOLEAN DEFAULT FALSE,
    is_superadmin BOOLEAN DEFAULT FALSE, -- Para el control maestro tipo Terminal
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. UNIDADES DE MEDIDA (Adaptadas al mercado local)
CREATE TABLE IF NOT EXISTS public.units_of_measure (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    code TEXT NOT NULL, -- 'und', 'mtr', 'vara', 'lbr', 'qq', 'paq', 'gal', 'lt'
    name TEXT NOT NULL, -- 'Unidad', 'Metro', 'Vara', 'Libra', 'Quintal', 'Paquete'
    conversion_ratio NUMERIC(12, 4) DEFAULT 1.0000, -- Ratio respecto a unidad base
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CATEGORÍAS & MARCAS
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PRODUCTOS & SERVICIOS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    barcode TEXT,
    sku TEXT,
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES public.units_of_measure(id) ON DELETE SET NULL,
    cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    sale_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    min_stock NUMERIC(12, 2) DEFAULT 5.00,
    current_stock NUMERIC(12, 2) DEFAULT 0.00,
    track_batches BOOLEAN DEFAULT FALSE, -- Vital para farmacias y agroservicios (vencimientos)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. LOTES & VENCIMIENTOS
CREATE TABLE IF NOT EXISTS public.inventory_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    batch_number TEXT NOT NULL,
    expiration_date DATE NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    cost_price NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. KARDEX / MOVIMIENTOS DE STOCK
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL, -- 'sale', 'purchase', 'adjustment_in', 'adjustment_out', 'transfer'
    quantity NUMERIC(12, 2) NOT NULL,
    unit_cost NUMERIC(12, 2) NOT NULL,
    reference_id UUID, -- ID de venta, compra o ajuste
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. CAJAS REGISTRADORAS & ARQUEOS
CREATE TABLE IF NOT EXISTS public.cash_registers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Caja Principal',
    status TEXT NOT NULL DEFAULT 'open', -- 'open', 'closed'
    opened_by UUID REFERENCES public.profiles(id),
    opening_amount NUMERIC(12, 2) DEFAULT 0.00,
    expected_amount NUMERIC(12, 2) DEFAULT 0.00,
    actual_amount NUMERIC(12, 2) DEFAULT 0.00,
    difference NUMERIC(12, 2) DEFAULT 0.00,
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

-- 12. CLIENTES (B2B / B2C / Fiados)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    tax_id TEXT,
    allow_credit BOOLEAN DEFAULT FALSE,
    credit_limit NUMERIC(12, 2) DEFAULT 0.00,
    current_balance NUMERIC(12, 2) DEFAULT 0.00, -- Deuda acumulada
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. VENTAS / FACTURAS
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    cash_register_id UUID REFERENCES public.cash_registers(id) ON DELETE SET NULL,
    seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    payment_method TEXT NOT NULL DEFAULT 'cash', -- 'cash', 'credit' (fiado), 'card', 'transfer'
    currency TEXT NOT NULL DEFAULT 'NIO',
    exchange_rate NUMERIC(10, 4) DEFAULT 36.6200,
    subtotal NUMERIC(12, 2) NOT NULL,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    total NUMERIC(12, 2) NOT NULL,
    cost_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    profit NUMERIC(12, 2) GENERATED ALWAYS AS (total - cost_total) STORED,
    status TEXT NOT NULL DEFAULT 'completed', -- 'completed', 'cancelled'
    notes TEXT,
    offline_synced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. DETALLES DE VENTA (ITEMS)
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    product_name TEXT NOT NULL,
    unit_code TEXT DEFAULT 'und',
    quantity NUMERIC(12, 2) NOT NULL,
    unit_cost NUMERIC(12, 2) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL
);

-- 15. CUENTAS POR COBRAR (FIADOS / CRÉDITOS)
CREATE TABLE IF NOT EXISTS public.receivables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    total_amount NUMERIC(12, 2) NOT NULL,
    paid_amount NUMERIC(12, 2) DEFAULT 0.00,
    balance NUMERIC(12, 2) NOT NULL,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'partial', 'paid', 'overdue'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. ABONOS DE CRÉDITO
CREATE TABLE IF NOT EXISTS public.receivable_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    receivable_id UUID NOT NULL REFERENCES public.receivables(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    amount NUMERIC(12, 2) NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    cash_register_id UUID REFERENCES public.cash_registers(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. CONFIGURACIÓN DE TICKET / FACTURA
CREATE TABLE IF NOT EXISTS public.ticket_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    paper_format TEXT DEFAULT '80mm', -- '58mm', '80mm', 'letter'
    header_title TEXT,
    header_subtitle TEXT,
    footer_message TEXT DEFAULT '¡Gracias por su compra!',
    show_logo BOOLEAN DEFAULT TRUE,
    show_tax_details BOOLEAN DEFAULT TRUE,
    show_exchange_rate BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's tenant_id
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID AS $$
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Permisos básicos para RLS
CREATE POLICY "Users can view data in their tenant" ON public.products
    FOR ALL USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Users can view sales in their tenant" ON public.sales
    FOR ALL USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Users can view customers in their tenant" ON public.customers
    FOR ALL USING (tenant_id = public.get_current_tenant_id());
