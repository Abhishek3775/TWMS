import axiosInstance from './axios';
import { ApiResponse, ApiPaginatedResponse, PaginationParams } from '../types/api.types';
import { Customer, CreateCustomerDto, UpdateCustomerDto } from '../types/customer.types';

/**
 * Customer API Service
 * Base: /customers
 */
export const customerApi = {
  getAll: async (params?: PaginationParams): Promise<ApiPaginatedResponse<Customer>> => {
    const res = await axiosInstance.get<ApiPaginatedResponse<Customer>>('/customers', { params });
    return res.data;
  },

  getById: async (id: string): Promise<ApiResponse<Customer>> => {
    const res = await axiosInstance.get<ApiResponse<Customer>>(`/customers/${id}`);
    return res.data;
  },

  create: async (data: CreateCustomerDto): Promise<ApiResponse<Customer>> => {
    const res = await axiosInstance.post<ApiResponse<Customer>>('/customers', data);
    return res.data;
  },

  update: async (id: string, data: UpdateCustomerDto): Promise<ApiResponse<Customer>> => {
    const res = await axiosInstance.put<ApiResponse<Customer>>(`/customers/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const res = await axiosInstance.delete<ApiResponse<null>>(`/customers/${id}`);
    return res.data;
  },
};
