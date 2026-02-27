import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDashboardKPIs() {
  return useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: async () => {
      const [productsRes, activePOsRes, lowStockRes, salesTotalRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('purchase_orders').select('id', { count: 'exact', head: true }).in('status', ['draft', 'confirmed', 'partial']),
        supabase.from('low_stock_alerts').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('sales_orders').select('grand_total').in('status', ['confirmed', 'pick_ready', 'dispatched', 'delivered']),
      ]);

      const monthRevenue = (salesTotalRes.data ?? []).reduce((sum, so) => sum + (Number(so.grand_total) || 0), 0);

      return {
        totalProducts: productsRes.count ?? 0,
        activePOs: activePOsRes.count ?? 0,
        lowStockItems: lowStockRes.count ?? 0,
        monthRevenue,
      };
    },
  });
}

export function useRecentSalesOrders() {
  return useQuery({
    queryKey: ['dashboard-recent-sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_orders')
        .select('id, so_number, status, grand_total, order_date, payment_status, customer_id, customers(name)')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useLowStockAlerts() {
  return useQuery({
    queryKey: ['dashboard-low-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('low_stock_alerts')
        .select('id, current_stock_boxes, reorder_level_boxes, status, product_id, products(code, name), warehouse_id, warehouses(name)')
        .eq('status', 'open')
        .order('alerted_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useStockByCategory() {
  return useQuery({
    queryKey: ['dashboard-stock-category'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_summary')
        .select('total_boxes, product_id, products(category_id, product_categories(name))');
      if (error) throw error;

      const categoryMap: Record<string, number> = {};
      for (const row of data ?? []) {
        const catName = (row.products as any)?.product_categories?.name ?? 'Uncategorized';
        categoryMap[catName] = (categoryMap[catName] || 0) + (Number(row.total_boxes) || 0);
      }

      return Object.entries(categoryMap).map(([category, boxes]) => ({ category, boxes }));
    },
  });
}
