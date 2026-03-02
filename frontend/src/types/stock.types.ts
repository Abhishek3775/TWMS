// ─── Report Types ─────────────────────────────────────────────────────────────

export interface DashboardReport {
  totalRevenue: number;
  revenueChangePercent: number;
  totalOrders: number;
  ordersChangePercent: number;
  activeCustomers: number;
  lowStockCount: number;
  pendingGRNs: number;
  pendingInvoices: number;
  recentSalesOrders: Array<{
    id: string;
    so_number: string;
    customer_name: string;
    grand_total: number;
    status: string;
    order_date: string;
  }>;
  recentActivities: Array<{
    id: string;
    action: string;
    table_name: string;
    created_at: string;
    user_name?: string;
  }>;
}

export interface GSTReportRow {
  invoice_number: string;
  invoice_date: string;
  customer_name: string;
  customer_gstin?: string;
  place_of_supply?: string;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  grand_total: number;
}

export interface RevenueReportRow {
  period: string;              // e.g. '2025-01', 'Jan 2025'
  revenue: number;
  orders: number;
  avg_order_value: number;
}

export interface AgingReportRow {
  customer_id: string;
  customer_name: string;
  current: number;             // 0–30 days
  days_30_60: number;
  days_60_90: number;
  over_90: number;
  total_outstanding: number;
}

export interface StockValuationRow {
  product_id: string;
  product_code: string;
  product_name: string;
  warehouse_name: string;
  total_boxes: number;
  avg_cost: number;
  total_value: number;
}

// ─── Stock Types ──────────────────────────────────────────────────────────────

export interface StockSummary {
  id: string;
  tenant_id: string;
  product_id: string;
  product_name: string;
  code: string;
  size_label: string;
  reorder_level_boxes: number;
  warehouse_id: string;
  warehouse_name: string;
  rack_id?: string | null;
  rack_name?: string | null;
  shade_id?: string | null;
  batch_id?: string | null;
  total_boxes: number;
  total_pieces: number;
  total_sqft: number;
  updated_at: string;
}

export type StockTransactionType =
  | 'GRN'
  | 'SALES_DISPATCH'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'RETURN_IN'
  | 'DAMAGE';

export interface StockLedgerEntry {
  id: string;
  tenant_id: string;
  product_id: string;
  product_name: string;
  product_code: string;
  warehouse_id: string;
  warehouse_name: string;
  shade_id?: string | null;
  batch_id?: string | null;
  transaction_type: StockTransactionType;
  reference_id?: string | null;
  reference_number?: string | null;
  qty_boxes_in: number;
  qty_boxes_out: number;
  balance_boxes: number;
  transaction_date: string;
  notes?: string | null;
  created_at: string;
}

export interface StockLedgerParams {
  productId?: string;
  warehouseId?: string;
  type?: StockTransactionType;
  from?: string;              // ISO date
  to?: string;                // ISO date
  page?: number;
  limit?: number;
}

export interface StockSummaryParams {
  warehouseId?: string;
  productId?: string;
  lowStock?: boolean;
}
