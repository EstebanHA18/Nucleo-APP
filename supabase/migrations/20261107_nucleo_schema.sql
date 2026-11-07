-- ==============================================================================
-- NÚCLEO ERP - MULTI-TENANT MODULAR SCHEMA
-- Compatible con Supabase PostgreSQL + Row Level Security (RLS)
-- Modelo 100% Contado / Tarjeta / Transferencia (Sin fiados)
-- ==============================================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TENANTS (Negocios / Organizaciones)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    legal_name TEXT,
    slug TEXT UNIQUE NOT NULL,
    business_type TEXT NOT NULL DEFAULT 'ferreteria',
    currency TEXT NOT NULL DEFAULT 'NIO', -- 'NIO' | 'USD'
    secondary_currency TEXT DEFAULT 'USD',
    exchange_rate NUMERIC(10, 4) DEFAULT 36.6200,
    tax_percentage NUMERIC(5, 2) DEFAULT 15.00,
    tax_id TEXT, -- RUC
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT DEFAULT 'Chinandega',
    logo_url TEXT,
    subscription_plan TEXT NOT NULL DEFAULT 'pro',
    subscription_status TEXT NOT NULL DEFAULT 'active',
    monthly_price NUMERIC(10, 2) DEFAULT 29.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MÓDULOS ACTIVOS POR TENANT
CREATE TABLE IF NOT EXISTS public.tenant_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    module_key TEXT NOT NULL, -- 'pos', 'inventory', 'billing', 'customers', 'expenses', 'hr', 'production'
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
    permission_key TEXT NOT NULL,
    UNIQUE(role_id, permission_key)
);

-- 5. PERFILES DE USUARIOS (Vinculados a auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    pin_code TEXT,
    avatar_url TEXT,
    is_owner BOOLEAN DEFAULT FALSE,
    is_superadmin BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. UNIDADES DE MEDIDA
CREATE TABLE IF NOT EXISTS public.units_of_measure (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    code TEXT NOT NULL, -- 'und', 'mtr', 'vara', 'lbr', 'qq', 'paq', 'gal', 'lt'
    name TEXT NOT NULL,
    conversion_ratio NUMERIC(12, 4) DEFAULT 1.0000,
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
    track_batches BOOLEAN DEFAULT FALSE,
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
    reference_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. CAJAS REGISTRADORAS
CREATE TABLE IF NOT EXISTS public.cash_registers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Caja Principal',
    status TEXT NOT NULL DEFAULT 'open',
    opened_by UUID REFERENCES public.profiles(id),
    opening_amount NUMERIC(12, 2) DEFAULT 0.00,
    sales_amount NUMERIC(12, 2) DEFAULT 0.00,
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

-- 12. DIRECTORIO DE CLIENTES (Facturación Comercial y Fiscal)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    business_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT DEFAULT 'Chinandega',
    tax_id TEXT, -- RUC / Cédula
    total_purchases NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. VENTAS / FACTURAS (100% Contado / Tarjeta / Transferencia)
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    cash_register_id UUID REFERENCES public.cash_registers(id) ON DELETE SET NULL,
    seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    payment_method TEXT NOT NULL DEFAULT 'cash', -- 'cash', 'card', 'transfer'
    currency TEXT NOT NULL DEFAULT 'NIO',
    exchange_rate NUMERIC(10, 4) DEFAULT 36.6200,
    subtotal NUMERIC(12, 2) NOT NULL,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    total NUMERIC(12, 2) NOT NULL,
    cost_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    profit NUMERIC(12, 2) GENERATED ALWAYS AS (total - cost_total) STORED,
    status TEXT NOT NULL DEFAULT 'completed',
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

-- 15. CONFIGURACIÓN DE TICKET / FACTURA
CREATE TABLE IF NOT EXISTS public.ticket_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    paper_format TEXT DEFAULT '80mm', -- '58mm', '80mm', 'letter'
    header_title TEXT,
    header_subtitle TEXT,
    footer_message TEXT DEFAULT '¡Gracias por su compra! Venta al contado.',
    show_logo BOOLEAN DEFAULT TRUE,
    show_tax_details BOOLEAN DEFAULT TRUE,
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

CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID AS $$
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE POLICY "Users can view data in their tenant" ON public.products
    FOR ALL USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Users can view sales in their tenant" ON public.sales
    FOR ALL USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Users can view customers in their tenant" ON public.customers
    FOR ALL USING (tenant_id = public.get_current_tenant_id());
