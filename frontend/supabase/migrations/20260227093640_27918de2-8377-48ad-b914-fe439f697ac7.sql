
-- Enum types
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'warehouse_manager', 'sales', 'accountant', 'user');
CREATE TYPE public.po_status AS ENUM ('draft', 'confirmed', 'partial', 'received', 'cancelled');
CREATE TYPE public.so_status AS ENUM ('draft', 'confirmed', 'pick_ready', 'dispatched', 'delivered', 'cancelled');
CREATE TYPE public.grn_status AS ENUM ('draft', 'verified', 'posted');
CREATE TYPE public.payment_status AS ENUM ('pending', 'partial', 'paid');
CREATE TYPE public.invoice_status AS ENUM ('draft', 'issued', 'cancelled');
CREATE TYPE public.alert_status AS ENUM ('open', 'acknowledged', 'resolved');
CREATE TYPE public.transfer_status AS ENUM ('draft', 'in_transit', 'received', 'cancelled');
CREATE TYPE public.adjustment_type AS ENUM ('add', 'deduct');
CREATE TYPE public.adjustment_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.transaction_type AS ENUM ('grn', 'sale', 'transfer_in', 'transfer_out', 'damage', 'adjustment', 'return', 'opening');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to check if user has any role (is authenticated and has profile)
CREATE OR REPLACE FUNCTION public.is_member()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
  )
$$;

-- Auto-create profile and assign default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Warehouses
CREATE TABLE public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TRIGGER warehouses_updated_at BEFORE UPDATE ON public.warehouses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Product Categories
CREATE TABLE public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.product_categories(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.product_categories(id),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  size_label TEXT NOT NULL DEFAULT '',
  pieces_per_box NUMERIC(6,2) NOT NULL DEFAULT 1,
  sqft_per_box NUMERIC(8,4) NOT NULL DEFAULT 0,
  hsn_code TEXT,
  gst_rate NUMERIC(5,2) NOT NULL DEFAULT 18.00,
  mrp NUMERIC(12,2),
  reorder_level_boxes INT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Vendors
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  gstin TEXT,
  payment_terms_days INT DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TRIGGER vendors_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Customers
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  billing_address TEXT,
  shipping_address TEXT,
  gstin TEXT,
  credit_limit NUMERIC(12,2) DEFAULT 0,
  payment_terms_days INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Purchase Orders
CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT NOT NULL UNIQUE,
  vendor_id UUID REFERENCES public.vendors(id) NOT NULL,
  warehouse_id UUID REFERENCES public.warehouses(id) NOT NULL,
  status po_status NOT NULL DEFAULT 'draft',
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_date DATE,
  total_amount NUMERIC(14,2) DEFAULT 0,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  grand_total NUMERIC(14,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TRIGGER po_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Purchase Order Items
CREATE TABLE public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  ordered_boxes NUMERIC(10,2) NOT NULL DEFAULT 0,
  received_boxes NUMERIC(10,2) DEFAULT 0,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_pct NUMERIC(5,2) DEFAULT 0,
  tax_pct NUMERIC(5,2) DEFAULT 18,
  line_total NUMERIC(14,2) DEFAULT 0
);

-- GRN (Goods Receipt Notes)
CREATE TABLE public.grn (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grn_number TEXT NOT NULL UNIQUE,
  purchase_order_id UUID REFERENCES public.purchase_orders(id),
  vendor_id UUID REFERENCES public.vendors(id) NOT NULL,
  warehouse_id UUID REFERENCES public.warehouses(id) NOT NULL,
  receipt_date DATE DEFAULT CURRENT_DATE,
  invoice_number TEXT,
  invoice_date DATE,
  vehicle_number TEXT,
  status grn_status NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- GRN Items
CREATE TABLE public.grn_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grn_id UUID REFERENCES public.grn(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  received_boxes NUMERIC(10,2) NOT NULL DEFAULT 0,
  received_pieces NUMERIC(10,2) DEFAULT 0,
  damaged_boxes NUMERIC(10,2) DEFAULT 0,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0
);

-- Sales Orders
CREATE TABLE public.sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  so_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id) NOT NULL,
  warehouse_id UUID REFERENCES public.warehouses(id) NOT NULL,
  status so_status NOT NULL DEFAULT 'draft',
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  delivery_address TEXT,
  sub_total NUMERIC(14,2) DEFAULT 0,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  grand_total NUMERIC(14,2) DEFAULT 0,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TRIGGER so_updated_at BEFORE UPDATE ON public.sales_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Sales Order Items
CREATE TABLE public.sales_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID REFERENCES public.sales_orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  ordered_boxes NUMERIC(10,2) NOT NULL DEFAULT 0,
  dispatched_boxes NUMERIC(10,2) DEFAULT 0,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_pct NUMERIC(5,2) DEFAULT 0,
  tax_pct NUMERIC(5,2) DEFAULT 18,
  line_total NUMERIC(14,2) DEFAULT 0
);

-- Stock Summary
CREATE TABLE public.stock_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID REFERENCES public.warehouses(id) NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  total_boxes NUMERIC(10,2) DEFAULT 0,
  total_pieces NUMERIC(10,2) DEFAULT 0,
  total_sqft NUMERIC(12,4) DEFAULT 0,
  avg_cost_per_box NUMERIC(12,4),
  last_receipt_date TIMESTAMPTZ,
  last_issue_date TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TRIGGER stock_summary_updated_at BEFORE UPDATE ON public.stock_summary FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Stock Ledger
CREATE TABLE public.stock_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID REFERENCES public.warehouses(id) NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  transaction_type transaction_type NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  boxes_in NUMERIC(10,2) DEFAULT 0,
  boxes_out NUMERIC(10,2) DEFAULT 0,
  pieces_in NUMERIC(10,2) DEFAULT 0,
  pieces_out NUMERIC(10,2) DEFAULT 0,
  balance_boxes NUMERIC(10,2) NOT NULL DEFAULT 0,
  balance_pieces NUMERIC(10,2) NOT NULL DEFAULT 0,
  sqft_in NUMERIC(12,4) DEFAULT 0,
  sqft_out NUMERIC(12,4) DEFAULT 0,
  transaction_date TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Stock Transfers
CREATE TABLE public.stock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_number TEXT NOT NULL UNIQUE,
  from_warehouse_id UUID REFERENCES public.warehouses(id) NOT NULL,
  to_warehouse_id UUID REFERENCES public.warehouses(id) NOT NULL,
  status transfer_status NOT NULL DEFAULT 'draft',
  transfer_date DATE DEFAULT CURRENT_DATE,
  received_date DATE,
  vehicle_number TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Stock Transfer Items
CREATE TABLE public.stock_transfer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID REFERENCES public.stock_transfers(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  transferred_boxes NUMERIC(10,2) NOT NULL DEFAULT 0,
  transferred_pieces NUMERIC(10,2) DEFAULT 0,
  received_boxes NUMERIC(10,2) DEFAULT 0,
  discrepancy_boxes NUMERIC(10,2) DEFAULT 0
);

-- Stock Adjustments
CREATE TABLE public.stock_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID REFERENCES public.warehouses(id) NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  adjustment_type adjustment_type NOT NULL,
  boxes NUMERIC(10,2) DEFAULT 0,
  pieces NUMERIC(10,2) DEFAULT 0,
  reason TEXT NOT NULL,
  status adjustment_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Damage Entries
CREATE TABLE public.damage_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID REFERENCES public.warehouses(id) NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  damage_date DATE DEFAULT CURRENT_DATE,
  damaged_boxes NUMERIC(10,2) DEFAULT 0,
  damaged_pieces NUMERIC(10,2) DEFAULT 0,
  damage_reason TEXT,
  estimated_loss NUMERIC(12,2),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

-- Low Stock Alerts
CREATE TABLE public.low_stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID REFERENCES public.warehouses(id) NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  current_stock_boxes NUMERIC(10,2) NOT NULL,
  reorder_level_boxes NUMERIC(10,2) NOT NULL,
  status alert_status NOT NULL DEFAULT 'open',
  alerted_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Invoices
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  sales_order_id UUID REFERENCES public.sales_orders(id),
  customer_id UUID REFERENCES public.customers(id) NOT NULL,
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  sub_total NUMERIC(14,2) DEFAULT 0,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  cgst_amount NUMERIC(12,2) DEFAULT 0,
  sgst_amount NUMERIC(12,2) DEFAULT 0,
  igst_amount NUMERIC(12,2) DEFAULT 0,
  grand_total NUMERIC(14,2) DEFAULT 0,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  status invoice_status NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Document Counters (for auto-numbering)
CREATE TABLE public.document_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_type TEXT NOT NULL UNIQUE,
  prefix TEXT NOT NULL,
  last_number INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TRIGGER doc_counters_updated_at BEFORE UPDATE ON public.document_counters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Seed initial document counters
INSERT INTO public.document_counters (doc_type, prefix, last_number) VALUES
  ('purchase_order', 'PO', 0),
  ('sales_order', 'SO', 0),
  ('grn', 'GRN', 0),
  ('invoice', 'INV', 0),
  ('transfer', 'ST', 0);

-- ========== RLS POLICIES ==========

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grn ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grn_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.damage_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.low_stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_counters ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- User roles: only admins can manage, users can read own
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- All business tables: authenticated users can CRUD (role-based filtering in app layer)
CREATE POLICY "Authenticated users can read warehouses" ON public.warehouses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage warehouses" ON public.warehouses FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read categories" ON public.product_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage categories" ON public.product_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage products" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read vendors" ON public.vendors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage vendors" ON public.vendors FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage customers" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read POs" ON public.purchase_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage POs" ON public.purchase_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read PO items" ON public.purchase_order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage PO items" ON public.purchase_order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read GRNs" ON public.grn FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage GRNs" ON public.grn FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read GRN items" ON public.grn_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage GRN items" ON public.grn_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read SOs" ON public.sales_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage SOs" ON public.sales_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read SO items" ON public.sales_order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage SO items" ON public.sales_order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read stock summary" ON public.stock_summary FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage stock summary" ON public.stock_summary FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read stock ledger" ON public.stock_ledger FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage stock ledger" ON public.stock_ledger FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read transfers" ON public.stock_transfers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage transfers" ON public.stock_transfers FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read transfer items" ON public.stock_transfer_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage transfer items" ON public.stock_transfer_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read adjustments" ON public.stock_adjustments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage adjustments" ON public.stock_adjustments FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read damage entries" ON public.damage_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage damage entries" ON public.damage_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read alerts" ON public.low_stock_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage alerts" ON public.low_stock_alerts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read invoices" ON public.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage invoices" ON public.invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read doc counters" ON public.document_counters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage doc counters" ON public.document_counters FOR ALL TO authenticated USING (true) WITH CHECK (true);
