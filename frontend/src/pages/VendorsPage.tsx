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
  { key: 'name', label: 'Vendor Name', type: 'text', required: true },
  { key: 'code', label: 'Vendor Code', type: 'text', placeholder: 'VND-001' },
  { key: 'contact_person', label: 'Contact Person', type: 'text' },
  { key: 'phone', label: 'Phone', type: 'text' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'gstin', label: 'GSTIN', type: 'text', placeholder: '22AAAAA0000A1Z5' },
  { key: 'address', label: 'Address', type: 'textarea' },
  { key: 'payment_terms_days', label: 'Payment Terms (Days)', type: 'number', defaultValue: 30 },
  { key: 'is_active', label: 'Status', type: 'switch', defaultValue: true },
];

export default function VendorsPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<any>(null);

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => { const { data, error } = await supabase.from('vendors').select('*').order('created_at', { ascending: false }); if (error) throw error; return data; },
  });

  const saveMutation = useMutation({
    mutationFn: async (fd: Record<string, any>) => {
      const payload = {
        name: fd.name, code: fd.code || null, contact_person: fd.contact_person || null,
        phone: fd.phone || null, email: fd.email || null, gstin: fd.gstin || null,
        address: fd.address || null, payment_terms_days: Number(fd.payment_terms_days || 30),
        is_active: fd.is_active,
      };
      if (editing) { const { error } = await supabase.from('vendors').update(payload).eq('id', editing.id); if (error) throw error; }
      else { const { error } = await supabase.from('vendors').insert([payload]); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendors'] }); setDialogOpen(false); setEditing(null); toast.success(editing ? 'Updated' : 'Created'); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('vendors').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendors'] }); setDeleting(null); toast.success('Deleted'); },
    onError: (e: any) => toast.error(e.message),
  });

  const columns = [
    { key: 'code', label: 'Code', render: (r: any) => <span className="font-mono-code text-sm">{r.code || '—'}</span> },
    { key: 'name', label: 'Vendor Name' },
    { key: 'contact_person', label: 'Contact' },
    { key: 'phone', label: 'Phone' },
    { key: 'gstin', label: 'GSTIN', render: (r: any) => r.gstin || '—' },
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
      <PageHeader title="Vendors" subtitle="Manage your tile suppliers" onAdd={() => { setEditing(null); setDialogOpen(true); }} addLabel="Add Vendor" />
      {isLoading ? <p className="text-muted-foreground">Loading...</p> : <DataTableShell data={vendors} columns={columns} searchKey="name" searchPlaceholder="Search vendors..." />}
      <CrudFormDialog open={dialogOpen} onClose={() => { setDialogOpen(false); setEditing(null); }} onSubmit={d => saveMutation.mutateAsync(d)} fields={fields} title={editing ? 'Edit Vendor' : 'New Vendor'} initialData={editing} loading={saveMutation.isPending} />
      <DeleteConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleteMutation.mutateAsync(deleting?.id)} loading={deleteMutation.isPending} />
    </div>
  );
}
