import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceApi } from '@/api/salesApi';
import { salesOrdersApi } from '@/api/salesApi';
import type { Invoice } from '@/types/invoice.types';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTableShell } from '@/components/shared/DataTableShell';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';

export default function InvoicesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [salesOrderId, setSalesOrderId] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Invoice | null>(null);
  const applySearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const listParams = {
    page,
    limit: 25,
    search: search.trim() || undefined,
    status: statusFilter || undefined,
    paymentStatus: paymentFilter || undefined,
    sortBy: 'invoice_date',
    sortOrder: 'DESC' as const,
  };

  const { data: listData, isLoading } = useQuery({
    queryKey: ['invoices', listParams],
    queryFn: () => invoiceApi.getAll(listParams),
  });
  const invoices: Invoice[] = listData?.data ?? [];
  const meta = listData?.meta ?? null;

  const { data: soList } = useQuery({
    queryKey: ['sales-orders-for-invoice'],
    queryFn: () => salesOrdersApi.getAll({ limit: 100 }),
  });
  const orderOptions = (soList?.data ?? []).filter(
    (so) => so.status === 'pick_ready' || so.status === 'dispatched'
  );

  const { data: detailRes } = useQuery({
    queryKey: ['invoices', detailId],
    queryFn: () => invoiceApi.getById(detailId!),
    enabled: !!detailId,
  });
  const detail = detailRes?.data ?? null;

  const createMutation = useMutation({
    mutationFn: () => invoiceApi.createFromSO({ salesOrderId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      setCreateOpen(false);
      setSalesOrderId('');
      toast.success('Invoice created from sales order');
    },
    onError: (e: { response?: { data?: { error?: { message?: string } } } }) =>
      toast.error(e?.response?.data?.error?.message ?? 'Create failed'),
  });

  const issueMutation = useMutation({
    mutationFn: (id: string) => invoiceApi.issueInvoice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      if (detailId) qc.invalidateQueries({ queryKey: ['invoices', detailId] });
      toast.success('Invoice issued');
    },
    onError: (e: { response?: { data?: { error?: { message?: string } } } }) =>
      toast.error(e?.response?.data?.error?.message ?? 'Issue failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => invoiceApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      if (detailId) qc.invalidateQueries({ queryKey: ['invoices', detailId] });
      setDeleting(null);
      toast.success('Invoice deleted');
    },
    onError: (e: { response?: { data?: { error?: { message?: string } } } }) =>
      toast.error(e?.response?.data?.error?.message ?? 'Delete failed'),
  });

  const columns = [
    { key: 'invoice_number', label: 'Invoice #', render: (r: Invoice) => <span className="font-mono text-sm font-medium">{r.invoice_number}</span> },
    { key: 'customer_name', label: 'Customer', render: (r: Invoice) => (r as any).customer_name ?? '—' },
    { key: 'invoice_date', label: 'Date', render: (r: Invoice) => (r.invoice_date ? new Date(r.invoice_date).toLocaleDateString() : '—') },
    { key: 'grand_total', label: 'Total', render: (r: Invoice) => `₹${Number((r as any).grand_total ?? 0).toLocaleString()}` },
    { key: 'status', label: 'Status', render: (r: Invoice) => <StatusBadge status={r.status} /> },
    { key: 'payment_status', label: 'Payment', render: (r: Invoice) => <StatusBadge status={(r as any).payment_status ?? 'pending'} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (r: Invoice) => (
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={() => setDetailId(r.id)}>View</Button>
          {r.status === 'draft' && (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={() => issueMutation.mutate(r.id)}
                disabled={issueMutation.isPending}
              >
                <FileCheck className="h-4 w-4 mr-1" /> Issue
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleting(r)} title="Delete">
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Generate from confirmed sales orders; issue to finalise"
        onAdd={() => setCreateOpen(true)}
        addLabel="New Invoice"
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-9 rounded-md border px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="issued">Issued</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
          className="h-9 rounded-md border px-3 text-sm"
        >
          <option value="">All payment</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </select>
      </div>
      <DataTableShell<Invoice>
        data={invoices}
        columns={columns}
        searchPlaceholder="Search invoice # or customer..."
        serverSide
        searchValue={searchInput}
        onSearchChange={(v) => { setSearchInput(v); applySearch(v); }}
        paginationMeta={meta ?? undefined}
        onPageChange={setPage}
        isLoading={isLoading}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create invoice from sales order</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Confirmed / Pick ready / Dispatched sales order</Label>
            <Select value={salesOrderId} onValueChange={setSalesOrderId}>
              <SelectTrigger><SelectValue placeholder="Select order" /></SelectTrigger>
              <SelectContent>
                {orderOptions.map((so) => (
                  <SelectItem key={so.id} value={so.id}>{so.so_number} — {so.customer_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!salesOrderId || createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {detail && (
        <Dialog open={!!detailId} onOpenChange={(open) => !open && setDetailId(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{(detail as any).invoice_number}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Customer: {(detail as any).customer_name} · Status: {detail.status} · Total: ₹{Number((detail as any).grand_total ?? 0).toLocaleString()}
            </p>
            {(detail as any).items?.length > 0 && (
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-2 text-left font-medium">Product</th>
                      <th className="px-4 py-2 text-right font-medium">Qty</th>
                      <th className="px-4 py-2 text-right font-medium">Line total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {((detail as any).items ?? []).map((item: any) => (
                      <tr key={item.id} className="border-b">
                        <td className="px-4 py-2">{item.product_code} — {item.product_name}</td>
                        <td className="px-4 py-2 text-right">{item.quantity_boxes}</td>
                        <td className="px-4 py-2 text-right">₹{Number(item.line_total ?? 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      <DeleteConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutateAsync(deleting.id)}
        loading={deleteMutation.isPending}
        title="Delete invoice"
        description="Only draft invoices can be deleted. Are you sure?"
      />
    </div>
  );
}
