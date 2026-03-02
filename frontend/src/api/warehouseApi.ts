import axiosInstance from './axios';
import { ApiResponse, ApiPaginatedResponse, PaginationParams } from '../types/api.types';
import {
  Warehouse, CreateWarehouseDto, UpdateWarehouseDto,
  Rack, CreateRackDto, UpdateRackDto,
  Category, CreateCategoryDto, UpdateCategoryDto,
  Shade, Batch,
} from '../types/warehouse.types';

// ─── Warehouse API ────────────────────────────────────────────────────────────
export const warehouseApi = {
  getAll: async (params?: PaginationParams): Promise<ApiPaginatedResponse<Warehouse>> => {
    const res = await axiosInstance.get<ApiPaginatedResponse<Warehouse>>('/warehouses', { params });
    return res.data;
  },
  getById: async (id: string): Promise<ApiResponse<Warehouse>> => {
    const res = await axiosInstance.get<ApiResponse<Warehouse>>(`/warehouses/${id}`);
    return res.data;
  },
  create: async (data: CreateWarehouseDto): Promise<ApiResponse<Warehouse>> => {
    const res = await axiosInstance.post<ApiResponse<Warehouse>>('/warehouses', data);
    return res.data;
  },
  update: async (id: string, data: UpdateWarehouseDto): Promise<ApiResponse<Warehouse>> => {
    const res = await axiosInstance.put<ApiResponse<Warehouse>>(`/warehouses/${id}`, data);
    return res.data;
  },
  delete: async (id: string): Promise<ApiResponse<null>> => {
    const res = await axiosInstance.delete<ApiResponse<null>>(`/warehouses/${id}`);
    return res.data;
  },
};

// ─── Rack API ─────────────────────────────────────────────────────────────────
export const rackApi = {
  getAll: async (params?: PaginationParams): Promise<ApiPaginatedResponse<Rack>> => {
    const res = await axiosInstance.get<ApiPaginatedResponse<Rack>>('/racks', { params });
    return res.data;
  },
  getById: async (id: string): Promise<ApiResponse<Rack>> => {
    const res = await axiosInstance.get<ApiResponse<Rack>>(`/racks/${id}`);
    return res.data;
  },
  create: async (data: CreateRackDto): Promise<ApiResponse<Rack>> => {
    const res = await axiosInstance.post<ApiResponse<Rack>>('/racks', data);
    return res.data;
  },
  update: async (id: string, data: UpdateRackDto): Promise<ApiResponse<Rack>> => {
    const res = await axiosInstance.put<ApiResponse<Rack>>(`/racks/${id}`, data);
    return res.data;
  },
  delete: async (id: string): Promise<ApiResponse<null>> => {
    const res = await axiosInstance.delete<ApiResponse<null>>(`/racks/${id}`);
    return res.data;
  },
};

// ─── Category API ─────────────────────────────────────────────────────────────
export const categoryApi = {
  getAll: async (params?: PaginationParams): Promise<ApiPaginatedResponse<Category>> => {
    const res = await axiosInstance.get<ApiPaginatedResponse<Category>>('/categories', { params });
    return res.data;
  },
  getById: async (id: string): Promise<ApiResponse<Category>> => {
    const res = await axiosInstance.get<ApiResponse<Category>>(`/categories/${id}`);
    return res.data;
  },
  create: async (data: CreateCategoryDto): Promise<ApiResponse<Category>> => {
    const res = await axiosInstance.post<ApiResponse<Category>>('/categories', data);
    return res.data;
  },
  update: async (id: string, data: UpdateCategoryDto): Promise<ApiResponse<Category>> => {
    const res = await axiosInstance.put<ApiResponse<Category>>(`/categories/${id}`, data);
    return res.data;
  },
  delete: async (id: string): Promise<ApiResponse<null>> => {
    const res = await axiosInstance.delete<ApiResponse<null>>(`/categories/${id}`);
    return res.data;
  },
};

// ─── Shade API ────────────────────────────────────────────────────────────────
export const shadeApi = {
  getAll: async (params?: PaginationParams): Promise<ApiPaginatedResponse<Shade>> => {
    const res = await axiosInstance.get<ApiPaginatedResponse<Shade>>('/shades', { params });
    return res.data;
  },
  getById: async (id: string): Promise<ApiResponse<Shade>> => {
    const res = await axiosInstance.get<ApiResponse<Shade>>(`/shades/${id}`);
    return res.data;
  },
};

// ─── Batch API ────────────────────────────────────────────────────────────────
export const batchApi = {
  getAll: async (params?: PaginationParams): Promise<ApiPaginatedResponse<Batch>> => {
    const res = await axiosInstance.get<ApiPaginatedResponse<Batch>>('/batches', { params });
    return res.data;
  },
  getById: async (id: string): Promise<ApiResponse<Batch>> => {
    const res = await axiosInstance.get<ApiResponse<Batch>>(`/batches/${id}`);
    return res.data;
  },
};
