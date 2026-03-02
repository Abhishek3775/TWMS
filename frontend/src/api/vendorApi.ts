import axiosInstance from './axios';
import { ApiResponse, ApiPaginatedResponse, PaginationParams } from '../types/api.types';
import { Vendor, CreateVendorDto, UpdateVendorDto } from '../types/vendor.types';

/**
 * Vendor API Service
 * Endpoints: GET | POST | PUT | DELETE  /vendors
 * Note: buildCrudRouter provides GET all + GET by ID.
 *       POST/PUT/DELETE are extended here assuming they follow the same pattern.
 */
export const vendorApi = {
  /**
   * Fetch paginated list of vendors.
   * @param params - { page, limit, search, sortBy, sortOrder }
   */
  getAll: async (params?: PaginationParams): Promise<ApiPaginatedResponse<Vendor>> => {
    const res = await axiosInstance.get<ApiPaginatedResponse<Vendor>>('/vendors', { params });
    return res.data;
  },

  /**
   * Fetch a single vendor by ID.
   */
  getById: async (id: string): Promise<ApiResponse<Vendor>> => {
    const res = await axiosInstance.get<ApiResponse<Vendor>>(`/vendors/${id}`);
    return res.data;
  },

  /**
   * Create a new vendor.
   */
  create: async (data: CreateVendorDto): Promise<ApiResponse<Vendor>> => {
    const res = await axiosInstance.post<ApiResponse<Vendor>>('/vendors', data);
    return res.data;
  },

  /**
   * Update an existing vendor.
   */
  update: async (id: string, data: UpdateVendorDto): Promise<ApiResponse<Vendor>> => {
    const res = await axiosInstance.put<ApiResponse<Vendor>>(`/vendors/${id}`, data);
    return res.data;
  },

  /**
   * Soft-delete / deactivate a vendor.
   */
  delete: async (id: string): Promise<ApiResponse<null>> => {
    const res = await axiosInstance.delete<ApiResponse<null>>(`/vendors/${id}`);
    return res.data;
  },
};
