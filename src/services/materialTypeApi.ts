// src/services/materialTypeApi.ts
import { api } from './api';

export interface MaterialType {
  id:          string;
  name:        string;
  nameKh:      string | null;
  description: string | null;
}

export interface MaterialTypeResponse {
  success:  boolean;
  data:     MaterialType;
  message?: string;
}

export interface MaterialTypesResponse {
  success: boolean;
  data:    MaterialType[];
}

export interface CreateMaterialTypePayload {
  name:         string;
  nameKh?:      string;
  description?: string;
}

export interface UpdateMaterialTypePayload {
  name?:        string;
  nameKh?:      string;
  description?: string;
}

export const materialTypeApi = api.injectEndpoints({overrideExisting: true,
  endpoints: (builder) => ({

    // GET /api/material-types
    getMaterialTypes: builder.query<MaterialTypesResponse, void>({
      query: () => '/material-types',
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'MaterialType' as const, id })),
              { type: 'MaterialType', id: 'LIST' },
            ]
          : [{ type: 'MaterialType', id: 'LIST' }],
    }),

    // GET /api/material-types/:id
    getMaterialTypeById: builder.query<MaterialTypeResponse, string>({
      query: (id) => `/material-types/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'MaterialType', id }],
    }),

    // POST /api/material-types
    createMaterialType: builder.mutation<MaterialTypeResponse, CreateMaterialTypePayload>({
      query: (data) => ({
        url:    '/material-types',
        method: 'POST',
        body:   data,
      }),
      invalidatesTags: [{ type: 'MaterialType', id: 'LIST' }],
    }),

    // PUT /api/material-types/:id
    updateMaterialType: builder.mutation<MaterialTypeResponse, { id: string; data: UpdateMaterialTypePayload }>({
      query: ({ id, data }) => ({
        url:    `/material-types/${id}`,
        method: 'PUT',
        body:   data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'MaterialType', id },
        { type: 'MaterialType', id: 'LIST' },
      ],
    }),

    // DELETE /api/material-types/:id
    deleteMaterialType: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url:    `/material-types/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'MaterialType', id },
        { type: 'MaterialType', id: 'LIST' },
      ],
    }),

  }),
});

export const {
  useGetMaterialTypesQuery,
  useGetMaterialTypeByIdQuery,
  useCreateMaterialTypeMutation,
  useUpdateMaterialTypeMutation,
  useDeleteMaterialTypeMutation,
} = materialTypeApi;