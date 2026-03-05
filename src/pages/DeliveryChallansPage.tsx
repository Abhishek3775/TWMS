import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deliveryChallansApi,
  pickListsApi,
  type DeliveryChallan,
  type PickList,
} from '@/api/salesApi';
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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Truck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';

export default function DeliveryChallansPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [pickListId, setPickListId] = useState('');
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().slice(0, 10));
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<DeliveryChallan | null>(null);
  const applySearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const listParams = {
    page,
    limit: 25,
    search: search.trim() || undefined,
    status: statusFilter || undefined,
    sortBy: 'created_at',
    sortOrder: 'DESC' as const,
  };

  const { data: listData, isLoading } = useQuery({
    queryKey: ['delivery-challans', listParams],
    queryFn: () => deliveryChallansApi.getAll(listParams),
  });
  const challans: DeliveryChallan[] = listData?.data ?? [];
  const meta = listData?.meta ?? null;

  const { data: completedPicks } = useQuery({
    queryKey: ['pick-lists-completed'],
    queryFn: () => pickListsApi.getAll({ status: 'completed', limit: 100 }),
  });
  const pickOptions: PickList[] = completedPicks?.data ?? [];

  const { data: detailData } = useQuery({
    queryKey: ['delivery-challans', detailId],
    queryFn: () => deliveryChallansApi.getById(detailId!),
    enabled: !!detailId,
  });
  const detail: DeliveryChallan | null = detailData?.data ?? null;

  const createMutation = useMutation({
    mutationFn: () =>
      deliveryChallansApi.createFromPickList({
        pick_list_id: pickListId,
        dispatch_date: dispatchDate,
        vehicle_number: vehicleNumber || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['delivery-challans'] });
      setCreateOpen(false);
      setPickListId('');
      toast.success('Delivery challan created');
    },
    onError: (e: { response?: { data?: { error?: { message?: string } } } }) =>
      toast.error(e?.response?.data?.error?.message ?? 'Create failed'),
  });

  const dispatchMutation = useMutation({
    mutationFn: (id: string) => deliveryChallansApi.dispatch(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['delivery-challans'] });
      if (detailId) qc.invalidateQueries({ queryKey: ['delivery-challans', detailId] });
      toast.success('Challan dispatched; stock updated');
    },
    onError: (e: { response?: { data?: { error?: { message?: string } } } }) =>
      toast.error(e?.response?.data?.error?.message ?? 'Dispatch failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deliveryChallansApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['delivery-challans'] });
      if (detailId) qc.invalidateQueries({ queryKey: ['delivery-challans', detailId] });
      setDeleting(null);
      toast.success('Challan deleted');
    },
    onError: (e: { response?: { data?: { error?: { message?: string } } } }) =>
      toast.error(e?.response?.data?.error?.message ?? 'Delete failed'),
  });

  const columns = [
    { key: 'dc_number', label: 'DC #', render: (r: DeliveryChallan) => <span className="font-mono text-sm font-medium">{r.dc_number}</span> },
    { key: 'so_number', label: 'SO #', render: (r: DeliveryChallan) => r.so_number ?? '—' },
    { key: 'customer_name', label: 'Customer', render: (r: DeliveryChallan) => r.customer_name ?? '—' },
    { key: 'status', label: 'Status', render: (r: DeliveryChallan) => <StatusBadge status={r.status} /> },
    { key: 'dispatch_date', label: 'Date', render: (r: DeliveryChallan) => (r.dispatch_date ? new Date(r.dispatch_date).toLocaleDateString() : '—') },
    { key: 'vehicle_number', label: 'Vehicle', render: (r: DeliveryChallan) => r.vehicle_number ?? '—' },
    {
      key: 'actions',
      label: 'Actions',
      render: (r: DeliveryChallan) => (
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={() => setDetailId(r.id)}>View</Button>
          {r.status === 'draft' && (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={() => dispatchMutation.mutate(r.id)}
                disabled={dispatchMutation.isPending}
              >
                <Truck className="h-4 w-4 mr-1" /> Dispatch
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
        title="Delivery Challans"
        subtitle="Create from completed pick lists; dispatch updates stock"
        onAdd={() => setCreateOpen(true)}
        addLabel="New Challan"
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-9 rounded-md border px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="dispatched">Dispatched</option>
          <option value="delivered">Delivered</option>
          <option value="returned">Returned</option>
        </select>
      </div>
      <DataTableShell<DeliveryChallan>
        data={challans}
        columns={columns}
        searchPlaceholder="Search DC #, SO # or customer..."
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
            <DialogTitle>Create delivery challan from pick list</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Completed pick list</Label>
              <Select value={pickListId} onValueChange={setPickListId}>
                <SelectTrigger><SelectValue placeholder="Select pick list" /></SelectTrigger>
                <SelectContent>
                  {pickOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.pick_number} — {p.so_number}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dispatch date</Label>
              <Input type="date" value={dispatchDate} onChange={(e) => setDispatchDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Vehicle number (optional)</Label>
              <Input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} placeholder="Vehicle number" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!pickListId || createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {detail && (
        <Dialog open={!!detailId} onOpenChange={(open) => !open && setDetailId(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{detail.dc_number} — {detail.so_number}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Customer: {detail.customer_name} · Status: {detail.status} · Date: {detail.dispatch_date ? new Date(detail.dispatch_date).toLocaleDateString() : '—'}
            </p>
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left font-medium">Product</th>
                    <th className="px-4 py-2 text-right font-medium">Boxes</th>
                    <th className="px-4 py-2 text-right font-medium">Unit price</th>
                  </tr>
                </thead>
                <tbody>
                  {(detail.items ?? []).map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="px-4 py-2">{item.product_code} — {item.product_name}</td>
                      <td className="px-4 py-2 text-right">{Number(item.dispatched_boxes)}</td>
                      <td className="px-4 py-2 text-right">₹{Number(item.unit_price).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <DeleteConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutateAsync(deleting.id)}
        loading={deleteMutation.isPending}
        title="Delete delivery challan"
        description="Only draft challans can be deleted. Are you sure?"
      />
    </div>
  );
}
