
-- Pick Lists (linked to sales orders)
CREATE TABLE public.pick_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pick_number TEXT NOT NULL,
  sales_order_id UUID REFERENCES public.sales_orders(id),
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled')),
  pick_date DATE DEFAULT CURRENT_DATE,
  assigned_to TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.pick_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read pick lists" ON public.pick_lists FOR SELECT USING (true);
CREATE POLICY "Auth users can manage pick lists" ON public.pick_lists FOR ALL USING (true) WITH CHECK (true);

-- Delivery Challans
CREATE TABLE public.delivery_challans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challan_number TEXT NOT NULL,
  sales_order_id UUID REFERENCES public.sales_orders(id),
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','dispatched','delivered','cancelled')),
  challan_date DATE DEFAULT CURRENT_DATE,
  vehicle_number TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.delivery_challans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read challans" ON public.delivery_challans FOR SELECT USING (true);
CREATE POLICY "Auth users can manage challans" ON public.delivery_challans FOR ALL USING (true) WITH CHECK (true);

-- Sales Returns
CREATE TABLE public.sales_returns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  return_number TEXT NOT NULL,
  sales_order_id UUID REFERENCES public.sales_orders(id),
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','received','cancelled')),
  return_date DATE DEFAULT CURRENT_DATE,
  reason TEXT,
  total_boxes NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.sales_returns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read sales returns" ON public.sales_returns FOR SELECT USING (true);
CREATE POLICY "Auth users can manage sales returns" ON public.sales_returns FOR ALL USING (true) WITH CHECK (true);

-- Purchase Returns
CREATE TABLE public.purchase_returns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  return_number TEXT NOT NULL,
  purchase_order_id UUID REFERENCES public.purchase_orders(id),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id),
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','dispatched','cancelled')),
  return_date DATE DEFAULT CURRENT_DATE,
  reason TEXT,
  total_boxes NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.purchase_returns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read purchase returns" ON public.purchase_returns FOR SELECT USING (true);
CREATE POLICY "Auth users can manage purchase returns" ON public.purchase_returns FOR ALL USING (true) WITH CHECK (true);

-- Payments Received (from customers)
CREATE TABLE public.payments_received (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_number TEXT NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  invoice_id UUID REFERENCES public.invoices(id),
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_date DATE DEFAULT CURRENT_DATE,
  payment_mode TEXT DEFAULT 'cash' CHECK (payment_mode IN ('cash','cheque','bank_transfer','upi','other')),
  reference_number TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.payments_received ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read payments received" ON public.payments_received FOR SELECT USING (true);
CREATE POLICY "Auth users can manage payments received" ON public.payments_received FOR ALL USING (true) WITH CHECK (true);

-- Payments Made (to vendors)
CREATE TABLE public.payments_made (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_number TEXT NOT NULL,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id),
  purchase_order_id UUID REFERENCES public.purchase_orders(id),
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_date DATE DEFAULT CURRENT_DATE,
  payment_mode TEXT DEFAULT 'bank_transfer' CHECK (payment_mode IN ('cash','cheque','bank_transfer','upi','other')),
  reference_number TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.payments_made ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read payments made" ON public.payments_made FOR SELECT USING (true);
CREATE POLICY "Auth users can manage payments made" ON public.payments_made FOR ALL USING (true) WITH CHECK (true);

-- Credit Notes (issued to customers)
CREATE TABLE public.credit_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  credit_note_number TEXT NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  invoice_id UUID REFERENCES public.invoices(id),
  sales_return_id UUID REFERENCES public.sales_returns(id),
  amount NUMERIC NOT NULL DEFAULT 0,
  issue_date DATE DEFAULT CURRENT_DATE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','issued','used','cancelled')),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read credit notes" ON public.credit_notes FOR SELECT USING (true);
CREATE POLICY "Auth users can manage credit notes" ON public.credit_notes FOR ALL USING (true) WITH CHECK (true);

-- Debit Notes (issued to vendors)
CREATE TABLE public.debit_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  debit_note_number TEXT NOT NULL,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id),
  purchase_return_id UUID REFERENCES public.purchase_returns(id),
  amount NUMERIC NOT NULL DEFAULT 0,
  issue_date DATE DEFAULT CURRENT_DATE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','issued','adjusted','cancelled')),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.debit_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read debit notes" ON public.debit_notes FOR SELECT USING (true);
CREATE POLICY "Auth users can manage debit notes" ON public.debit_notes FOR ALL USING (true) WITH CHECK (true);
