// ─── Vendor Types ─────────────────────────────────────────────────────────────

export interface Vendor {
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
  payment_terms_days?: number | null;
  credit_limit?: number | null;
  bank_account_number?: string | null;
  bank_ifsc?: string | null;
  bank_name?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateVendorDto {
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
  payment_terms_days?: number;
  credit_limit?: number;
  bank_account_number?: string;
  bank_ifsc?: string;
  bank_name?: string;
}

export interface UpdateVendorDto extends Partial<CreateVendorDto> {
  is_active?: boolean;
}
