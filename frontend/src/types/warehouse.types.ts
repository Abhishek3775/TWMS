// ─── Warehouse Types ──────────────────────────────────────────────────────────

export interface Warehouse {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateWarehouseDto {
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
}

export interface UpdateWarehouseDto extends Partial<CreateWarehouseDto> {
  is_active?: boolean;
}

// ─── Rack Types ───────────────────────────────────────────────────────────────

export interface Rack {
  id: string;
  tenant_id: string;
  warehouse_id: string;
  name: string;
  code?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRackDto {
  warehouse_id: string;
  name: string;
  code?: string;
}

export interface UpdateRackDto extends Partial<CreateRackDto> {
  is_active?: boolean;
}

// ─── Category Types ───────────────────────────────────────────────────────────

export interface Category {
  id: string;
  tenant_id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {
  is_active?: boolean;
}

// ─── Shade Types ──────────────────────────────────────────────────────────────

export interface Shade {
  id: string;
  tenant_id: string;
  product_id: string;
  shade_code: string;
  shade_name?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Batch Types ──────────────────────────────────────────────────────────────

export interface Batch {
  id: string;
  tenant_id: string;
  product_id: string;
  shade_id?: string | null;
  batch_number: string;
  manufacture_date?: string | null;
  expiry_date?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
