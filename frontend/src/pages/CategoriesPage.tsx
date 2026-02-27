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

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<any>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('product_categories').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  const fields: FieldDef[] = [
    { key: 'name', label: 'Category Name', type: 'text', required: true, placeholder: 'Floor Tiles' },
    { key: 'parent_id', label: 'Parent Category', type: 'select', options: [{ value: '__none__', label: 'None' }, ...categories.map(c => ({ value: c.id, label: c.name }))] },
    { key: 'is_active', label: 'Status', type: 'switch', defaultValue: true },
  ];

  const saveMutation = useMutation({
    mutationFn: async (formData: Record<string, any>) => {
      const payload = { name: formData.name, parent_id: formData.parent_id === '__none__' ? null : formData.parent_id || null, is_active: formData.is_active };
      if (editing) {
        const { error } = await supabase.from('product_categories').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('product_categories').insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); setDialogOpen(false); setEditing(null); toast.success(editing ? 'Updated' : 'Created'); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('product_categories').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); setDeleting(null); toast.success('Deleted'); },
    onError: (e: any) => toast.error(e.message),
  });

  const columns = [
    { key: 'name', label: 'Category Name' },
    { key: 'parent_id', label: 'Parent', render: (r: any) => categories.find(c => c.id === r.parent_id)?.name || '—' },
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
      <PageHeader title="Categories" subtitle="Manage product categories" onAdd={() => { setEditing(null); setDialogOpen(true); }} addLabel="Add Category" />
      {isLoading ? <p className="text-muted-foreground">Loading...</p> : <DataTableShell data={categories} columns={columns} searchKey="name" searchPlaceholder="Search categories..." />}
      <CrudFormDialog open={dialogOpen} onClose={() => { setDialogOpen(false); setEditing(null); }} onSubmit={d => saveMutation.mutateAsync(d)} fields={fields} title={editing ? 'Edit Category' : 'New Category'} initialData={editing} loading={saveMutation.isPending} />
      <DeleteConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleteMutation.mutateAsync(deleting?.id)} loading={deleteMutation.isPending} />
    </div>
  );
}
