
-- Fix all RLS policies: drop restrictive ones and recreate as permissive
-- This affects all tables that have the pattern "Permissive: No"

-- warehouses
DROP POLICY IF EXISTS "Authenticated users can read warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Authenticated users can manage warehouses" ON public.warehouses;
CREATE POLICY "Members can read warehouses" ON public.warehouses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can manage warehouses" ON public.warehouses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- customers
DROP POLICY IF EXISTS "Authenticated users can read customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can manage customers" ON public.customers;
CREATE POLICY "Members can read customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can manage customers" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- vendors
DROP POLICY IF EXISTS "Authenticated users can read vendors" ON public.vendors;
DROP POLICY IF EXISTS "Authenticated users can manage vendors" ON public.vendors;
CREATE POLICY "Members can read vendors" ON public.vendors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can manage vendors" ON public.vendors FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- products
DROP POLICY IF EXISTS "Authenticated users can read products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;
CREATE POLICY "Members can read products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can manage products" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- product_categories
DROP POLICY IF EXISTS "Authenticated users can read categories" ON public.product_categories;
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON public.product_categories;
CREATE POLICY "Members can read categories" ON public.product_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can manage categories" ON public.product_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- purchase_orders
DROP POLICY IF EXISTS "Authenticated users can read POs" ON public.purchase_orders;
DROP POLICY IF EXISTS "Authenticated users can manage POs" ON public.purchase_orders;
CREATE POLICY "Members can read POs" ON public.purchase_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can manage POs" ON public.purchase_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- purchase_order_items
DROP POLICY IF EXISTS "Authenticated users can read PO items" ON public.purchase_order_items;
DROP POLICY IF EXISTS "Authenticated users can manage PO items" ON public.purchase_order_items;
CREATE POLICY "Members can read PO items" ON public.purchase_order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can manage PO items" ON public.purchase_order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- sales_orders
DROP POLICY IF EXISTS "Authenticated users can read SOs" ON public.sales_orders;
DROP POLICY IF EXISTS "Authenticated users can manage SOs" ON public.sales_orders;
CREATE POLICY "Members can read SOs" ON public.sales_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can manage SOs" ON public.sales_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- sales_order_items
DROP POLICY IF EXISTS "Authenticated users can read SO items" ON public.sales_order_items;
DROP POLICY IF EXISTS "Authenticated users can manage SO items" ON public.sales_order_items;
CREATE POLICY "Members can read SO items" ON public.sales_order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can manage SO items" ON public.sales_order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- grn
DROP POLICY IF EXISTS "Authenticated users can read GRNs" ON public.grn;
DROP POLICY IF EXISTS "Authenticated users can manage GRNs" ON public.grn;
CREATE POLICY "Members can read GRNs" ON public.grn FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can manage GRNs" ON public.grn FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- grn_items
DROP POLICY IF EXISTS "Authenticated users can read GRN items" ON public.grn_items;
DROP POLICY IF EXISTS "Authenticated users can manage GRN items" ON public.grn_items;
CREATE POLICY "Members can read GRN items" ON public.grn_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can manage GRN items" ON public.grn_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- invoices
DROP POLICY IF EXISTS "Authenticated users can read invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can manage invoices" ON public.invoices;
CREATE POLICY "Members can read invoices" ON public.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can manage invoices" ON public.invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- stock_summary
DROP POLICY IF EXISTS "Authenticated users can read stock summary" ON public.stock_summary;
DROP POLICY IF EXISTS "Authenticated users can manage stock summary" ON public.stock_summary;
CREATE POLICY "Members can read stock summary" ON public.stock_summary FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can manage stock summary" ON public.stock_summary FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- stock_ledger
DROP POLICY IF EXISTS "Authenticated users can read stock ledger" ON public.stock_ledger;
DROP POLICY IF EXISTS "Authenticated users can manage stock ledger" ON public.stock_ledger;
CREATE POLICY "Members can read stock ledger" ON public.stock_ledger FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can manage stock ledger" ON public.stock_ledger FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- stock_transfers
DROP POLICY IF EXISTS "Authenticated users can read transfers" ON public.stock_transfers;
DROP POLICY IF EXISTS "Authenticated users can manage transfers" ON public.stock_transfers;
CREATE POLICY "Members can read transfers" ON public.stock_transfers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can manage transfers" ON public.stock_transfers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- stock_transfer_items
DROP POLICY IF EXISTS "Authenticated users can read transfer items" ON public.stock_transfer_items;
DROP POLICY IF EXISTS "Authenticated users can manage transfer items" ON public.stock_transfer_items;
CREATE POLICY "Members can read transfer items" ON public.stock_transfer_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can manage transfer items" ON public.stock_transfer_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- stock_adjustments
DROP POLICY IF EXISTS "Authenticated users can read adjustments" ON public.stock_adjustments;
DROP POLICY IF EXISTS "Authenticated users can manage adjustments" ON public.stock_adjustments;
CREATE POLICY "Members can read adjustments" ON public.stock_adjustments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can manage adjustments" ON public.stock_adjustments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- damage_entries
DROP POLICY IF EXISTS "Authenticated users can read damage entries" ON public.damage_entries;
DROP POLICY IF EXISTS "Authenticated users can manage damage entries" ON public.damage_entries;
CREATE POLICY "Members can read damage entries" ON public.damage_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can manage damage entries" ON public.damage_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- low_stock_alerts
DROP POLICY IF EXISTS "Authenticated users can read alerts" ON public.low_stock_alerts;
DROP POLICY IF EXISTS "Authenticated users can manage alerts" ON public.low_stock_alerts;
CREATE POLICY "Members can read alerts" ON public.low_stock_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can manage alerts" ON public.low_stock_alerts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- document_counters
DROP POLICY IF EXISTS "Authenticated users can read doc counters" ON public.document_counters;
DROP POLICY IF EXISTS "Authenticated users can manage doc counters" ON public.document_counters;
CREATE POLICY "Members can read doc counters" ON public.document_counters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can manage doc counters" ON public.document_counters FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- profiles (fix: keep existing but make permissive + add insert policy)
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "System can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- user_roles (fix)
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- New tables (pick_lists, delivery_challans, etc.)
DROP POLICY IF EXISTS "Auth users can read pick lists" ON public.pick_lists;
DROP POLICY IF EXISTS "Auth users can manage pick lists" ON public.pick_lists;
CREATE POLICY "Members can read pick lists" ON public.pick_lists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can manage pick lists" ON public.pick_lists FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Auth users can read challans" ON public.delivery_challans;
DROP POLICY IF EXISTS "Auth users can manage challans" ON public.delivery_challans;
CREATE POLICY "Members can read challans" ON public.delivery_challans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can manage challans" ON public.delivery_challans FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Auth users can read sales returns" ON public.sales_returns;
DROP POLICY IF EXISTS "Auth users can manage sales returns" ON public.sales_returns;
CREATE POLICY "Members can read sales returns" ON public.sales_returns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can manage sales returns" ON public.sales_returns FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Auth users can read purchase returns" ON public.purchase_returns;
DROP POLICY IF EXISTS "Auth users can manage purchase returns" ON public.purchase_returns;
CREATE POLICY "Members can read purchase returns" ON public.purchase_returns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can manage purchase returns" ON public.purchase_returns FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Auth users can read payments received" ON public.payments_received;
DROP POLICY IF EXISTS "Auth users can manage payments received" ON public.payments_received;
CREATE POLICY "Members can read payments received" ON public.payments_received FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can manage payments received" ON public.payments_received FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Auth users can read payments made" ON public.payments_made;
DROP POLICY IF EXISTS "Auth users can manage payments made" ON public.payments_made;
CREATE POLICY "Members can read payments made" ON public.payments_made FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can manage payments made" ON public.payments_made FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Auth users can read credit notes" ON public.credit_notes;
DROP POLICY IF EXISTS "Auth users can manage credit notes" ON public.credit_notes;
CREATE POLICY "Members can read credit notes" ON public.credit_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can manage credit notes" ON public.credit_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Auth users can read debit notes" ON public.debit_notes;
DROP POLICY IF EXISTS "Auth users can manage debit notes" ON public.debit_notes;
CREATE POLICY "Members can read debit notes" ON public.debit_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can manage debit notes" ON public.debit_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);
