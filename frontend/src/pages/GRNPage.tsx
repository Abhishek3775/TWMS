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

export default function GRNPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<any>(null);

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors-active'],
    queryFn: async () => { const { data, error } = await supabase.from('vendors').select('id, name').eq('is_active', true).order('name'); if (error) throw error; return data; },
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses-active'],
    queryFn: async () => { const { data, error } = await supabase.from('warehouses').select('id, name').eq('is_active', true).order('name'); if (error) throw error; return data; },
  });

  const { data: grns = [], isLoading } = useQuery({
    queryKey: ['grns'],
    queryFn: async () => {
      const { data, error } = await supabase.from('grn').select('*, vendors(name), warehouses(name)').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const fields: FieldDef[] = [
    { key: 'grn_number', label: 'GRN Number', type: 'text', required: true, placeholder: 'GRN-2024-0001' },
    { key: 'vendor_id', label: 'Vendor', type: 'select', required: true, options: vendors.map(v => ({ value: v.id, label: v.name })) },
    { key: 'warehouse_id', label: 'Warehouse', type: 'select', required: true, options: warehouses.map(w => ({ value: w.id, label: w.name })) },
    { key: 'status', label: 'Status', type: 'select', options: [{ value: 'draft', label: 'Draft' }, { value: 'verified', label: 'Verified' }, { value: 'posted', label: 'Posted' }], defaultValue: 'draft' },
    { key: 'receipt_date', label: 'Receipt Date', type: 'date' },
    { key: 'invoice_number', label: 'Invoice Number', type: 'text' },
    { key: 'vehicle_number', label: 'Vehicle Number', type: 'text' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ];

  const saveMutation = useMutation({
    mutationFn: async (fd: Record<string, any>) => {
      const payload = {
        grn_number: fd.grn_number, vendor_id: fd.vendor_id, warehouse_id: fd.warehouse_id,
        status: fd.status as any, receipt_date: fd.receipt_date || null,
        invoice_number: fd.invoice_number || null, vehicle_number: fd.vehicle_number || null,
        notes: fd.notes || null, created_by: user?.id || null,
      };
      if (editing) { const { error } = await supabase.from('grn').update(payload).eq('id', editing.id); if (error) throw error; }
      else { const { error } = await supabase.from('grn').insert([payload]); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['grns'] }); setDialogOpen(false); setEditing(null); toast.success(editing ? 'Updated' : 'Created'); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('grn').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['grns'] }); setDeleting(null); toast.success('Deleted'); },
    onError: (e: any) => toast.error(e.message),
  });

  const columns = [
    { key: 'grn_number', label: 'GRN #', render: (r: any) => <span className="font-mono-code text-sm font-medium">{r.grn_number}</span> },
    { key: 'vendor', label: 'Vendor', render: (r: any) => (r as any).vendors?.name || '—' },
    { key: 'warehouse', label: 'Warehouse', render: (r: any) => (r as any).warehouses?.name || '—' },
    { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status} /> },
    { key: 'receipt_date', label: 'Date', render: (r: any) => r.receipt_date ? new Date(r.receipt_date).toLocaleDateString() : '—' },
    { key: 'invoice_number', label: 'Invoice #', render: (r: any) => r.invoice_number || '—' },
    { key: 'actions', label: 'Actions', render: (r: any) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(r); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleting(r)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="Goods Receipt Notes" subtitle="Manage goods receipt" onAdd={() => { setEditing(null); setDialogOpen(true); }} addLabel="New GRN" />
      {isLoading ? <p className="text-muted-foreground">Loading...</p> : <DataTableShell data={grns} columns={columns} searchKey="grn_number" searchPlaceholder="Search GRN#..." />}
      <CrudFormDialog open={dialogOpen} onClose={() => { setDialogOpen(false); setEditing(null); }} onSubmit={d => saveMutation.mutateAsync(d)} fields={fields} title={editing ? 'Edit GRN' : 'New GRN'} initialData={editing} loading={saveMutation.isPending} autoNumber={{ fieldKey: 'grn_number', docType: 'grn' }} />
      <DeleteConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleteMutation.mutateAsync(deleting?.id)} loading={deleteMutation.isPending} />
    </div>
  );
}
