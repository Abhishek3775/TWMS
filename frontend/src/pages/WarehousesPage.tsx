import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTableShell } from '@/components/shared/DataTableShell';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CrudFormDialog, FieldDef } from '@/components/shared/CrudFormDialog';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const fields: FieldDef[] = [
  { key: 'name', label: 'Warehouse Name', type: 'text', required: true },
  { key: 'code', label: 'Code', type: 'text', required: true, placeholder: 'WH-MAIN' },
  { key: 'address', label: 'Address', type: 'textarea' },
  { key: 'city', label: 'City', type: 'text' },
  { key: 'state', label: 'State', type: 'text' },
  { key: 'pincode', label: 'Pincode', type: 'text' },
  { key: 'is_active', label: 'Status', type: 'switch', defaultValue: true },
];

export default function WarehousesPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<any>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => { const { data, error } = await supabase.from('warehouses').select('*').order('name'); if (error) throw error; return data; },
  });

  const saveMutation = useMutation({
    mutationFn: async (fd: Record<string, any>) => {
      const payload = {
        name: fd.name, code: fd.code, address: fd.address || null,
        city: fd.city || null, state: fd.state || null, pincode: fd.pincode || null,
        is_active: fd.is_active,
      };
      if (editing) { const { error } = await supabase.from('warehouses').update(payload).eq('id', editing.id); if (error) throw error; }
      else { const { error } = await supabase.from('warehouses').insert([payload]); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouses'] }); setDialogOpen(false); setEditing(null); toast.success(editing ? 'Updated' : 'Created'); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('warehouses').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouses'] }); setDeleting(null); toast.success('Deleted'); },
    onError: (e: any) => toast.error(e.message),
  });

  const columns = [
    { key: 'code', label: 'Code', render: (r: any) => <span className="font-mono-code text-sm font-medium">{r.code}</span> },
    { key: 'name', label: 'Name' },
    { key: 'city', label: 'City', render: (r: any) => r.city || '—' },
    { key: 'state', label: 'State', render: (r: any) => r.state || '—' },
    { key: 'is_active', label: 'Status', render: (r: any) => <StatusBadge status={r.is_active ? 'active' : 'inactive'} /> },
    { key: 'actions', label: 'Actions', render: (r: any) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(r); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleting(r)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="Warehouses" subtitle="Manage warehouse locations" onAdd={() => { setEditing(null); setDialogOpen(true); }} addLabel="Add Warehouse" />
      {isLoading ? <p className="text-muted-foreground">Loading...</p> : <DataTableShell data={data} columns={columns} searchKey="name" searchPlaceholder="Search warehouses..." />}
      <CrudFormDialog open={dialogOpen} onClose={() => { setDialogOpen(false); setEditing(null); }} onSubmit={d => saveMutation.mutateAsync(d)} fields={fields} title={editing ? 'Edit Warehouse' : 'New Warehouse'} initialData={editing} loading={saveMutation.isPending} />
      <DeleteConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleteMutation.mutateAsync(deleting?.id)} loading={deleteMutation.isPending} />
    </div>
  );
}
