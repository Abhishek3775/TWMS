import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from '@/api/productApi';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTableShell } from '@/components/shared/DataTableShell';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CrudFormDialog, FieldDef } from '@/components/shared/CrudFormDialog';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const fields: FieldDef[] = [
  { key: 'name', label: 'Product Name', type: 'text', required: true, placeholder: 'Vitrified Floor Tile 600x600' },
  { key: 'code', label: 'Product Code', type: 'text', required: true, placeholder: 'VTF-001' },
  { key: 'size_label', label: 'Size Label', type: 'text', required: true, placeholder: '600x600mm' },
  { key: 'size_length_mm', label: 'Length (mm)', type: 'number', required: true, defaultValue: 600 },
  { key: 'size_width_mm', label: 'Width (mm)', type: 'number', required: true, defaultValue: 600 },
  { key: 'pieces_per_box', label: 'Pieces/Box', type: 'number', required: true, defaultValue: 4 },
  { key: 'sqft_per_box', label: 'Sqft/Box', type: 'number', required: true, defaultValue: 15.5 },
  { key: 'hsn_code', label: 'HSN Code', type: 'text', placeholder: '69072100' },
  { key: 'gst_rate', label: 'GST Rate (%)', type: 'number', required: true, defaultValue: 18 },
  { key: 'mrp', label: 'MRP (₹)', type: 'number', placeholder: '850' },
  { key: 'reorder_level_boxes', label: 'Reorder Level (Boxes)', type: 'number', defaultValue: 0 },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'is_active', label: 'Status', type: 'switch', defaultValue: true },
];

export default function ProductsPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<any>(null);

  const { data: paged, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.getAll({ page: 1, limit: 100 }),
  });
  const products = (paged as any)?.data ?? [];

  const saveMutation = useMutation({
    mutationFn: async (formData: Record<string, any>) => {
      const payload = {
        name: formData.name,
        code: formData.code,
        sizeLabel: formData.size_label,
        sizeLengthMm: Number(formData.size_length_mm),   // required by backend
        sizeWidthMm: Number(formData.size_width_mm),     // required by backend
        piecesPerBox: Number(formData.pieces_per_box),
        sqftPerBox: Number(formData.sqft_per_box),
        gstRate: Number(formData.gst_rate),
        mrp: formData.mrp ? Number(formData.mrp) : null,
        reorderLevelBoxes: Number(formData.reorder_level_boxes || 0),
        hsnCode: formData.hsn_code || null,
        description: formData.description || null,
        isActive: formData.is_active,
      };
      return editing
        ? productApi.update(editing.id, payload as any)
        : productApi.create(payload as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      setDialogOpen(false);
      setEditing(null);
      toast.success(editing ? 'Product updated' : 'Product created');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      setDeleting(null);
      toast.success('Product deleted');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const columns = [
    { key: 'code', label: 'Code', render: (r: any) => <span className="font-mono-code text-sm font-medium">{r.code}</span> },
    { key: 'name', label: 'Name' },
    { key: 'size_label', label: 'Size' },
    { key: 'pieces_per_box', label: 'Pcs/Box' },
    { key: 'sqft_per_box', label: 'Sqft/Box' },
    { key: 'mrp', label: 'MRP', render: (r: any) => r.mrp ? `₹${Number(r.mrp).toLocaleString()}` : '—' },
    { key: 'gst_rate', label: 'GST%', render: (r: any) => `${r.gst_rate}%` },
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
      <PageHeader title="Products" subtitle="Manage your tile products catalog" onAdd={() => { setEditing(null); setDialogOpen(true); }} addLabel="Add Product" />
      {isLoading ? <p className="text-muted-foreground">Loading...</p> : <DataTableShell data={products} columns={columns} searchKey="name" searchPlaceholder="Search products..." />}
      <CrudFormDialog open={dialogOpen} onClose={() => { setDialogOpen(false); setEditing(null); }} onSubmit={d => saveMutation.mutateAsync(d)} fields={fields} title={editing ? 'Edit Product' : 'New Product'} initialData={editing} loading={saveMutation.isPending} />
      <DeleteConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleteMutation.mutateAsync(deleting?.id)} loading={deleteMutation.isPending} />
    </div>
  );
}
