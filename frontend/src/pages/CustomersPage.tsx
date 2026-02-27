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
  { key: 'name', label: 'Customer Name', type: 'text', required: true },
  { key: 'code', label: 'Customer Code', type: 'text', placeholder: 'CUST-001' },
  { key: 'contact_person', label: 'Contact Person', type: 'text' },
  { key: 'phone', label: 'Phone', type: 'text' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'gstin', label: 'GSTIN', type: 'text' },
  { key: 'billing_address', label: 'Billing Address', type: 'textarea' },
  { key: 'shipping_address', label: 'Shipping Address', type: 'textarea' },
  { key: 'credit_limit', label: 'Credit Limit (₹)', type: 'number', defaultValue: 0 },
  { key: 'payment_terms_days', label: 'Payment Terms (Days)', type: 'number', defaultValue: 0 },
  { key: 'is_active', label: 'Status', type: 'switch', defaultValue: true },
];

export default function CustomersPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<any>(null);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => { const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false }); if (error) throw error; return data; },
  });

  const saveMutation = useMutation({
    mutationFn: async (fd: Record<string, any>) => {
      const payload = {
        name: fd.name, code: fd.code || null, contact_person: fd.contact_person || null,
        phone: fd.phone || null, email: fd.email || null, gstin: fd.gstin || null,
        billing_address: fd.billing_address || null, shipping_address: fd.shipping_address || null,
        credit_limit: Number(fd.credit_limit || 0), payment_terms_days: Number(fd.payment_terms_days || 0),
        is_active: fd.is_active,
      };
      if (editing) { const { error } = await supabase.from('customers').update(payload).eq('id', editing.id); if (error) throw error; }
      else { const { error } = await supabase.from('customers').insert([payload]); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); setDialogOpen(false); setEditing(null); toast.success(editing ? 'Updated' : 'Created'); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('customers').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); setDeleting(null); toast.success('Deleted'); },
    onError: (e: any) => toast.error(e.message),
  });

  const columns = [
    { key: 'code', label: 'Code', render: (r: any) => <span className="font-mono-code text-sm">{r.code || '—'}</span> },
    { key: 'name', label: 'Customer Name' },
    { key: 'contact_person', label: 'Contact' },
    { key: 'phone', label: 'Phone' },
    { key: 'credit_limit', label: 'Credit Limit', render: (r: any) => `₹${Number(r.credit_limit || 0).toLocaleString()}` },
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
      <PageHeader title="Customers" subtitle="Manage your customers" onAdd={() => { setEditing(null); setDialogOpen(true); }} addLabel="Add Customer" />
      {isLoading ? <p className="text-muted-foreground">Loading...</p> : <DataTableShell data={customers} columns={columns} searchKey="name" searchPlaceholder="Search customers..." />}
      <CrudFormDialog open={dialogOpen} onClose={() => { setDialogOpen(false); setEditing(null); }} onSubmit={d => saveMutation.mutateAsync(d)} fields={fields} title={editing ? 'Edit Customer' : 'New Customer'} initialData={editing} loading={saveMutation.isPending} />
      <DeleteConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleteMutation.mutateAsync(deleting?.id)} loading={deleteMutation.isPending} />
    </div>
  );
}
