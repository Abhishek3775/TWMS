import axiosInstance from './axios';
import { ApiPaginatedResponse, ApiResponse } from '../types/api.types';
import { Product, CreateProductDto, UpdateProductDto } from '../types/product.types';

export const productApi = {
    /**
     * Fetch a list of products with optional pagination and sorting params
     * e.g. params = { page: 1, limit: 10, search: 'Tile' }
     */
    getAll: async (params?: Record<string, string | number>) => {
        const response = await axiosInstance.get<ApiPaginatedResponse<Product>>('/products', { params });
        return response.data;
    },

    /**
     * Fetch a single product by ID
     */
    getById: async (id: string) => {
        const response = await axiosInstance.get<ApiResponse<Product>>(`/products/${id}`);
        return response.data;
    },

    /**
     * Create a new product
     */
    create: async (data: CreateProductDto) => {
        const response = await axiosInstance.post<ApiResponse<Product>>('/products', data);
        return response.data;
    },

    /**
     * Update an existing product
     */
    update: async (id: string, data: UpdateProductDto) => {
        const response = await axiosInstance.put<ApiResponse<Product>>(`/products/${id}`, data);
        return response.data;
    },

    /**
     * Delete a product
     */
    delete: async (id: string) => {
        const response = await axiosInstance.delete<ApiResponse<null>>(`/products/${id}`);
        return response.data;
    }
};
