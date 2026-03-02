// ─── Customer Types ───────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  gstin?: string | null;
  pan?: string | null;
  credit_limit?: number | null;
  payment_terms_days?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerDto {
  name: string;
  code: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
  pan?: string;
  credit_limit?: number;
  payment_terms_days?: number;
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {
  is_active?: boolean;
}
