import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';
import { fetchNextDocNumber } from '@/hooks/useNextDocNumber';

export interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'textarea' | 'select' | 'switch' | 'date';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  defaultValue?: any;
}

export interface AutoNumberConfig {
  fieldKey: string;
  docType: string;
}

interface CrudFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  fields: FieldDef[];
  title: string;
  initialData?: Record<string, any> | null;
  loading?: boolean;
  autoNumber?: AutoNumberConfig;
}

export function CrudFormDialog({ open, onClose, onSubmit, fields, title, initialData, loading, autoNumber }: CrudFormDialogProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (open) {
      const defaults: Record<string, any> = {};
      fields.forEach(f => {
        if (f.type === 'select' && !f.required) {
          defaults[f.key] = initialData?.[f.key] || f.defaultValue || 'none';
        } else {
          defaults[f.key] = initialData?.[f.key] ?? f.defaultValue ?? (f.type === 'switch' ? true : f.type === 'number' ? '' : '');
        }
      });
      setFormData(defaults);

      // Auto-generate doc number for new records
      if (!initialData && autoNumber) {
        fetchNextDocNumber(autoNumber.docType)
          .then(num => setFormData(prev => ({ ...prev, [autoNumber.fieldKey]: num })))
          .catch(() => {/* keep placeholder */});
      }
    }
  }, [open, initialData, fields, autoNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: Record<string, any> = {};
    for (const key in formData) {
      submitData[key] = formData[key] === 'none' ? '' : formData[key];
    }
    await onSubmit(submitData);
  };

  const setValue = (key: string, value: any) => setFormData(prev => ({ ...prev, [key]: value }));

  const isAutoNumberField = (key: string) => !initialData && autoNumber?.fieldKey === key;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {fields.map(f => (
            <div key={f.key} className="space-y-1.5">
              <Label htmlFor={f.key}>{f.label}</Label>
              {f.type === 'textarea' ? (
                <Textarea id={f.key} value={formData[f.key] || ''} onChange={e => setValue(f.key, e.target.value)} placeholder={f.placeholder} required={f.required} />
              ) : f.type === 'select' ? (
              <Select value={formData[f.key] || 'none'} onValueChange={v => setValue(f.key, v)}>
                  <SelectTrigger><SelectValue placeholder={f.placeholder || 'Select...'} /></SelectTrigger>
                  <SelectContent>
                    {!f.required && <SelectItem value="none">— None —</SelectItem>}
                    {f.options?.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : f.type === 'switch' ? (
                <div className="flex items-center gap-2">
                  <Switch id={f.key} checked={!!formData[f.key]} onCheckedChange={v => setValue(f.key, v)} />
                  <span className="text-sm text-muted-foreground">{formData[f.key] ? 'Active' : 'Inactive'}</span>
                </div>
              ) : (
                <Input
                  id={f.key}
                  type={f.type}
                  value={formData[f.key] ?? ''}
                  onChange={e => setValue(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  required={f.required}
                  step={f.type === 'number' ? 'any' : undefined}
                  readOnly={isAutoNumberField(f.key)}
                  className={isAutoNumberField(f.key) ? 'bg-muted font-mono' : ''}
                />
              )}
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : initialData ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
