import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTableShell } from '@/components/shared/DataTableShell';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { OrderFormDialog } from '@/components/shared/OrderFormDialog';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { FieldDef } from '@/components/shared/CrudFormDialog';
import type { LineItem } from '@/components/shared/LineItemsEditor';

export default function PurchaseOrdersPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [editingItems, setEditingItems] = useState<LineItem[]>([]);
  const [deleting, setDeleting] = useState<any>(null);

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => { const { data, error } = await supabase.from('vendors').select('id, name').eq('is_active', true).order('name'); if (error) throw error; return data; },
  });
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => { const { data, error } = await supabase.from('warehouses').select('id, name').eq('is_active', true).order('name'); if (error) throw error; return data; },
  });
  const { data: products = [] } = useQuery({
    queryKey: ['products-active'],
    queryFn: async () => { const { data, error } = await supabase.from('products').select('id, code, name, mrp, gst_rate').eq('is_active', true).order('code'); if (error) throw error; return data; },
  });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['purchase_orders'],
    queryFn: async () => {
      const { data, error } = await supabase.from('purchase_orders').select('*, vendors(name), warehouses(name)').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const headerFields: FieldDef[] = [
    { key: 'po_number', label: 'PO Number', type: 'text', required: true },
    { key: 'vendor_id', label: 'Vendor', type: 'select', required: true, options: vendors.map(v => ({ value: v.id, label: v.name })) },
    { key: 'warehouse_id', label: 'Warehouse', type: 'select', required: true, options: warehouses.map(w => ({ value: w.id, label: w.name })) },
    { key: 'status', label: 'Status', type: 'select', options: [{ value: 'draft', label: 'Draft' }, { value: 'confirmed', label: 'Confirmed' }, { value: 'partial', label: 'Partial' }, { value: 'received', label: 'Received' }, { value: 'cancelled', label: 'Cancelled' }], defaultValue: 'draft' },
    { key: 'order_date', label: 'Order Date', type: 'date', required: true },
    { key: 'expected_date', label: 'Expected Date', type: 'date' },
  ];

  const handleEdit = async (row: any) => {
    setEditing(row);
    // Load existing line items
    const { data } = await supabase.from('purchase_order_items').select('*').eq('purchase_order_id', row.id);
    setEditingItems((data ?? []).map(d => ({
      id: d.id,
      product_id: d.product_id,
      ordered_boxes: Number(d.ordered_boxes),
      unit_price: Number(d.unit_price),
      discount_pct: Number(d.discount_pct ?? 0),
      tax_pct: Number(d.tax_pct ?? 18),
      line_total: Number(d.line_total ?? 0),
    })));
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async ({ header, items }: { header: Record<string, any>; items: LineItem[] }) => {
      const payload = {
        po_number: header.po_number, vendor_id: header.vendor_id, warehouse_id: header.warehouse_id,
        status: header.status as any, order_date: header.order_date, expected_date: header.expected_date || null,
        total_amount: Number(header.total_amount || 0), tax_amount: Number(header.tax_amount || 0),
        grand_total: Number(header.grand_total || 0), notes: header.notes || null, created_by: user?.id || null,
      };

      let orderId: string;
      if (editing) {
        orderId = editing.id;
        const { error } = await supabase.from('purchase_orders').update(payload).eq('id', orderId);
        if (error) throw error;
        // Delete old items and re-insert
        await supabase.from('purchase_order_items').delete().eq('purchase_order_id', orderId);
      } else {
        const { data, error } = await supabase.from('purchase_orders').insert([payload]).select('id').single();
        if (error) throw error;
        orderId = data.id;
      }

      // Insert line items
      const itemPayloads = items.map(i => ({
        purchase_order_id: orderId,
        product_id: i.product_id,
        ordered_boxes: i.ordered_boxes,
        unit_price: i.unit_price,
        discount_pct: i.discount_pct,
        tax_pct: i.tax_pct,
        line_total: i.line_total,
      }));
      if (itemPayloads.length > 0) {
        const { error } = await supabase.from('purchase_order_items').insert(itemPayloads);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase_orders'] }); setDialogOpen(false); setEditing(null); setEditingItems([]); toast.success(editing ? 'Updated' : 'Created'); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('purchase_order_items').delete().eq('purchase_order_id', id);
      const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase_orders'] }); setDeleting(null); toast.success('Deleted'); },
    onError: (e: any) => toast.error(e.message),
  });

  const columns = [
    { key: 'po_number', label: 'PO #', render: (r: any) => <span className="font-mono-code text-sm font-medium">{r.po_number}</span> },
    { key: 'vendor', label: 'Vendor', render: (r: any) => (r as any).vendors?.name || '—' },
    { key: 'warehouse', label: 'Warehouse', render: (r: any) => (r as any).warehouses?.name || '—' },
    { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status} /> },
    { key: 'order_date', label: 'Date', render: (r: any) => r.order_date ? new Date(r.order_date).toLocaleDateString() : '—' },
    { key: 'grand_total', label: 'Total', render: (r: any) => `₹${Number(r.grand_total || 0).toLocaleString()}` },
    { key: 'actions', label: 'Actions', render: (r: any) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(r)}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleting(r)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="Purchase Orders" subtitle="Manage purchase orders" onAdd={() => { setEditing(null); setEditingItems([]); setDialogOpen(true); }} addLabel="New PO" />
      {isLoading ? <p className="text-muted-foreground">Loading...</p> : <DataTableShell data={orders} columns={columns} searchKey="po_number" searchPlaceholder="Search PO#..." />}
      <OrderFormDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null); setEditingItems([]); }}
        onSubmit={(header, items) => saveMutation.mutateAsync({ header, items })}
        headerFields={headerFields}
        title={editing ? 'Edit Purchase Order' : 'New Purchase Order'}
        initialData={editing}
        initialItems={editingItems}
        loading={saveMutation.isPending}
        autoNumber={{ fieldKey: 'po_number', docType: 'purchase_order' }}
        products={products}
      />
      <DeleteConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleteMutation.mutateAsync(deleting?.id)} loading={deleteMutation.isPending} />
    </div>
  );
}
