import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTableShell } from '@/components/shared/DataTableShell';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CrudFormDialog, FieldDef, AutoNumberConfig } from '@/components/shared/CrudFormDialog';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function StockTransfersPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<any>(null);

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses-active'],
    queryFn: async () => { const { data, error } = await supabase.from('warehouses').select('id, name').eq('is_active', true).order('name'); if (error) throw error; return data; },
  });

  const { data = [], isLoading } = useQuery({
    queryKey: ['stock_transfers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('stock_transfers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const fields: FieldDef[] = [
    { key: 'transfer_number', label: 'Transfer #', type: 'text', required: true, placeholder: 'ST-2024-0001' },
    { key: 'from_warehouse_id', label: 'From Warehouse', type: 'select', required: true, options: warehouses.map(w => ({ value: w.id, label: w.name })) },
    { key: 'to_warehouse_id', label: 'To Warehouse', type: 'select', required: true, options: warehouses.map(w => ({ value: w.id, label: w.name })) },
    { key: 'status', label: 'Status', type: 'select', options: [{ value: 'draft', label: 'Draft' }, { value: 'in_transit', label: 'In Transit' }, { value: 'received', label: 'Received' }, { value: 'cancelled', label: 'Cancelled' }], defaultValue: 'draft' },
    { key: 'transfer_date', label: 'Transfer Date', type: 'date' },
    { key: 'vehicle_number', label: 'Vehicle Number', type: 'text' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ];

  const saveMutation = useMutation({
    mutationFn: async (fd: Record<string, any>) => {
      const payload = {
        transfer_number: fd.transfer_number, from_warehouse_id: fd.from_warehouse_id,
        to_warehouse_id: fd.to_warehouse_id, status: fd.status as any,
        transfer_date: fd.transfer_date || null, vehicle_number: fd.vehicle_number || null,
        notes: fd.notes || null, created_by: user?.id || null,
      };
      if (editing) { const { error } = await supabase.from('stock_transfers').update(payload).eq('id', editing.id); if (error) throw error; }
      else { const { error } = await supabase.from('stock_transfers').insert([payload]); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stock_transfers'] }); setDialogOpen(false); setEditing(null); toast.success(editing ? 'Updated' : 'Created'); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('stock_transfers').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stock_transfers'] }); setDeleting(null); toast.success('Deleted'); },
    onError: (e: any) => toast.error(e.message),
  });

  const fromWh = (id: string) => warehouses.find(w => w.id === id)?.name || '—';

  const columns = [
    { key: 'transfer_number', label: 'Transfer #', render: (r: any) => <span className="font-mono-code text-sm font-medium">{r.transfer_number}</span> },
    { key: 'from', label: 'From', render: (r: any) => fromWh(r.from_warehouse_id) },
    { key: 'to', label: 'To', render: (r: any) => fromWh(r.to_warehouse_id) },
    { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status} /> },
    { key: 'transfer_date', label: 'Date', render: (r: any) => r.transfer_date ? new Date(r.transfer_date).toLocaleDateString() : '—' },
    { key: 'actions', label: 'Actions', render: (r: any) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(r); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleting(r)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="Stock Transfers" subtitle="Transfer stock between warehouses" onAdd={() => { setEditing(null); setDialogOpen(true); }} addLabel="New Transfer" />
      {isLoading ? <p className="text-muted-foreground">Loading...</p> : <DataTableShell data={data} columns={columns} searchKey="transfer_number" searchPlaceholder="Search transfers..." />}
      <CrudFormDialog open={dialogOpen} onClose={() => { setDialogOpen(false); setEditing(null); }} onSubmit={d => saveMutation.mutateAsync(d)} fields={fields} title={editing ? 'Edit Transfer' : 'New Transfer'} initialData={editing} loading={saveMutation.isPending} autoNumber={{ fieldKey: 'transfer_number', docType: 'transfer' }} />
      <DeleteConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleteMutation.mutateAsync(deleting?.id)} loading={deleteMutation.isPending} />
    </div>
  );
}
