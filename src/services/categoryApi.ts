// src/services/categoryApi.ts
import { api } from './api';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Category {
  id:          string;
  name:        string;
  nameKh:      string | null;
  description: string | null;
}

// ── Response shapes (matching roleApi / userApi pattern) ──────────────────────

export interface CategoryResponse {
  success:  boolean;
  data:     Category;
  message?: string;
}

export interface CategoriesResponse {
  success: boolean;
  data:    Category[];
}

// ── Payloads ───────────────────────────────────────────────────────────────────

export interface CreateCategoryPayload {
  name:         string;
  nameKh?:      string;
  description?: string;
}

export interface UpdateCategoryPayload {
  name?:        string;
  nameKh?:      string;
  description?: string;
}

// ─────────────────────────────────────────────────────────────────────────────

export const categoryApi = api.injectEndpoints({overrideExisting: true,
  endpoints: (builder) => ({

    // GET /api/categories
    getCategories: builder.query<CategoriesResponse, void>({
      query: () => '/categories',
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Category' as const, id })),
              { type: 'Category', id: 'LIST' },
            ]
          : [{ type: 'Category', id: 'LIST' }],
    }),

    // GET /api/categories/:id
    getCategoryById: builder.query<CategoryResponse, string>({
      query: (id) => `/categories/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Category', id }],
    }),

    // POST /api/categories
    createCategory: builder.mutation<CategoryResponse, CreateCategoryPayload>({
      query: (data) => ({
        url:    '/categories',
        method: 'POST',
        body:   data,
      }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }],
    }),

    // PUT /api/categories/:id
    updateCategory: builder.mutation<CategoryResponse, { id: string; data: UpdateCategoryPayload }>({
      query: ({ id, data }) => ({
        url:    `/categories/${id}`,
        method: 'PUT',
        body:   data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Category', id },
        { type: 'Category', id: 'LIST' },
      ],
    }),

    // DELETE /api/categories/:id
    deleteCategory: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url:    `/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Category', id },
        { type: 'Category', id: 'LIST' },
      ],
    }),

  }),
});

export const {
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoryApi;