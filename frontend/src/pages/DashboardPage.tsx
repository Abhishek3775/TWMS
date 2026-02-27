import {
  IndianRupee, ShoppingCart, Package, AlertTriangle, TrendingUp,
  ArrowUpRight, Loader2
} from 'lucide-react';
import { KPICard } from '@/components/shared/KPICard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useDashboardKPIs, useRecentSalesOrders, useLowStockAlerts, useStockByCategory } from '@/hooks/useDashboardData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';

const CHART_COLORS = [
  'hsl(217, 91%, 53%)',
  'hsl(160, 84%, 30%)',
  'hsl(38, 92%, 50%)',
  'hsl(213, 52%, 25%)',
  'hsl(280, 60%, 50%)',
];

function formatCurrency(val: number) {
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
  return `₹${val.toLocaleString()}`;
}

export default function DashboardPage() {
  const { data: kpis, isLoading: kpiLoading } = useDashboardKPIs();
  const { data: recentSO } = useRecentSalesOrders();
  const { data: lowStock } = useLowStockAlerts();
  const { data: stockCats } = useStockByCategory();

  const stockCatData = stockCats ?? [];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Active Products"
          value={kpiLoading ? '…' : String(kpis?.totalProducts ?? 0)}
          icon={<Package className="h-5 w-5" />}
          variant="primary"
        />
        <KPICard
          title="Active POs"
          value={kpiLoading ? '…' : String(kpis?.activePOs ?? 0)}
          icon={<ShoppingCart className="h-5 w-5" />}
          variant="warning"
        />
        <KPICard
          title="Low Stock Items"
          value={kpiLoading ? '…' : String(kpis?.lowStockItems ?? 0)}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="danger"
        />
        <KPICard
          title="Sales Revenue"
          value={kpiLoading ? '…' : formatCurrency(kpis?.monthRevenue ?? 0)}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="success"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Stock by Category (Pie) */}
        <div className="bg-card rounded-lg border p-4 shadow-sm">
          <h3 className="font-display font-semibold text-foreground mb-4">Stock by Category</h3>
          {stockCatData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={stockCatData.filter(d => d.boxes > 0)}
                    dataKey="boxes"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {stockCatData.filter(d => d.boxes > 0).map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(214, 32%, 91%)', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {stockCatData.map((item, i) => (
                  <div key={item.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-muted-foreground">{item.category}</span>
                    </div>
                    <span className="font-medium text-foreground">{item.boxes} boxes</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No stock data yet</p>
          )}
        </div>

        {/* Recent Sales Orders */}
        <div className="lg:col-span-2 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-display font-semibold text-foreground">Recent Sales Orders</h3>
            <Link to="/sales/orders" className="text-xs text-secondary hover:underline flex items-center gap-0.5">
              View All <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground uppercase bg-muted/30">
                  <th className="text-left px-4 py-2.5 font-medium">Order</th>
                  <th className="text-left px-4 py-2.5 font-medium">Customer</th>
                  <th className="text-left px-4 py-2.5 font-medium">Status</th>
                  <th className="text-right px-4 py-2.5 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {(recentSO ?? []).length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-muted-foreground py-6 text-sm">No sales orders yet</td></tr>
                ) : (
                  (recentSO ?? []).map(so => (
                    <tr key={so.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5 font-mono-code text-xs font-medium text-foreground">{so.so_number}</td>
                      <td className="px-4 py-2.5 text-foreground">{(so.customers as any)?.name ?? '—'}</td>
                      <td className="px-4 py-2.5"><StatusBadge status={so.status} /></td>
                      <td className="px-4 py-2.5 text-right font-medium text-foreground">₹{Number(so.grand_total).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border shadow-sm">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Low Stock
            </h3>
            <Link to="/alerts" className="text-xs text-secondary hover:underline">View All</Link>
          </div>
          <div className="p-2 space-y-1">
            {(lowStock ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No alerts</p>
            ) : (
              (lowStock ?? []).map(alert => (
                <div key={alert.id} className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="text-xs font-medium text-foreground">{(alert.products as any)?.code ?? '—'}</p>
                    <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">{(alert.products as any)?.name ?? ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono-code font-bold text-destructive">{alert.current_stock_boxes}</p>
                    <p className="text-[10px] text-muted-foreground">/ {alert.reorder_level_boxes}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
