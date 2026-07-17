// src/services/permissionApi.ts
import { api } from './api';

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface PermissionsResponse {
  success: boolean;
  data: Permission[];
}

export interface PermissionResponse {
  success: boolean;
  data: Permission;
  message?: string;
}

export interface CreatePermissionPayload {
  name: string;
  description?: string;
}

export interface UpdatePermissionPayload {
  name?: string;
  description?: string;
}

export const permissionApi = api.injectEndpoints({overrideExisting: true,
  endpoints: (builder) => ({

    // GET /api/permissions
    getPermissions: builder.query<PermissionsResponse, void>({
      query: () => '/permissions',
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Permission' as const, id })),
              { type: 'Permission', id: 'LIST' },
            ]
          : [{ type: 'Permission', id: 'LIST' }],
    }),

    // GET /api/permissions/:id
    getPermissionById: builder.query<PermissionResponse, string>({
      query: (id) => `/permissions/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Permission', id }],
    }),

    // POST /api/permissions
    createPermission: builder.mutation<PermissionResponse, CreatePermissionPayload>({
      query: (data) => ({
        url:    '/permissions',
        method: 'POST',
        body:   data,
      }),
      invalidatesTags: [{ type: 'Permission', id: 'LIST' }],
    }),

    // PUT /api/permissions/:id
    updatePermission: builder.mutation<PermissionResponse, { id: string; data: UpdatePermissionPayload }>({
      query: ({ id, data }) => ({
        url:    `/permissions/${id}`,
        method: 'PUT',
        body:   data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Permission', id },
        { type: 'Permission', id: 'LIST' },
      ],
    }),

    // DELETE /api/permissions/:id
    deletePermission: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url:    `/permissions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Permission', id },
        { type: 'Permission', id: 'LIST' },
      ],
    }),

  }),
});

export const {
  useGetPermissionsQuery,
  useGetPermissionByIdQuery,
  useCreatePermissionMutation,
  useUpdatePermissionMutation,
  useDeletePermissionMutation,
} = permissionApi;