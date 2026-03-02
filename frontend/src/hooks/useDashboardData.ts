import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axios';

export function useDashboardKPIs() {
  return useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: async () => {
      const res = await axiosInstance.get('/reports/dashboard');
      return res.data.data; // { todaySales, pendingOrders, lowStockItems, monthRevenue, unpaidInvoices }
    },
    staleTime: 60_000, // Cache for 60 seconds
  });
}

export function useRecentSalesOrders() {
  return useQuery({
    queryKey: ['dashboard-recent-sales'],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get('/sales-orders', { params: { limit: 5 } });
        return res.data?.data || [];
      } catch (err) {
        return [];
      }
    },
  });
}

export function useLowStockAlerts() {
  return useQuery({
    queryKey: ['dashboard-low-stock'],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get('/alerts', { params: { limit: 5 } });
        return res.data?.data || [];
      } catch (err) {
        return [];
      }
    },
  });
}

export function useStockByCategory() {
  return useQuery({
    queryKey: ['dashboard-stock-category'],
    queryFn: async () => {
      // Mock data for charts
      return [
        { category: 'Ceramic', boxes: 450 },
        { category: 'Vitified', boxes: 820 },
        { category: 'Porcelain', boxes: 300 },
      ];
    },
  });
}
