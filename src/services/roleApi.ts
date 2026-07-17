// src/services/roleApi.ts
import { api } from './api';

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  Permissions: Permission[];
}

export interface RoleResponse {
  success: boolean;
  data: Role;
  message?: string;
}

export interface RolesResponse {
  success: boolean;
  data: Role[];
}

export interface CreateRolePayload {
  name: string;
  description?: string;
  permissionIds?: string[];
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
}

export const roleApi = api.injectEndpoints({overrideExisting: true,
  endpoints: (builder) => ({

    // GET /api/roles
    getRoles: builder.query<RolesResponse, void>({
      query: () => '/roles',
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Role' as const, id })),
              { type: 'Role', id: 'LIST' },
            ]
          : [{ type: 'Role', id: 'LIST' }],
    }),

    // GET /api/roles/:id
    getRoleById: builder.query<RoleResponse, string>({
      query: (id) => `/roles/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Role', id }],
    }),

    // POST /api/roles
    createRole: builder.mutation<RoleResponse, CreateRolePayload>({
      query: (data) => ({
        url:    '/roles',
        method: 'POST',
        body:   data,
      }),
      invalidatesTags: [{ type: 'Role', id: 'LIST' }],
    }),

    // PUT /api/roles/:id
    updateRole: builder.mutation<RoleResponse, { id: string; data: UpdateRolePayload }>({
      query: ({ id, data }) => ({
        url:    `/roles/${id}`,
        method: 'PUT',
        body:   data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Role', id },
        { type: 'Role', id: 'LIST' },
      ],
    }),

    // DELETE /api/roles/:id
    deleteRole: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url:    `/roles/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Role', id },
        { type: 'Role', id: 'LIST' },
      ],
    }),

    // PUT /api/roles/:id/permissions
    syncRolePermissions: builder.mutation<{ success: boolean }, { id: string; permissionIds: string[] }>({
      query: ({ id, permissionIds }) => ({
        url:    `/roles/${id}/permissions`,
        method: 'PUT',
        body:   { permissionIds },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Role', id }],
    }),

    // POST /api/roles/:id/permissions — assign single permission
    assignPermissionToRole: builder.mutation<{ success: boolean }, { roleId: string; permissionId: string }>({
      query: ({ roleId, permissionId }) => ({
        url:    `/roles/${roleId}/permissions`,
        method: 'POST',
        body:   { permission_id: permissionId },
      }),
      invalidatesTags: (_result, _error, { roleId }) => [{ type: 'Role', id: roleId }],
    }),

    // DELETE /api/roles/:id/permissions/:permissionId
    removePermissionFromRole: builder.mutation<{ success: boolean }, { roleId: string; permissionId: string }>({
      query: ({ roleId, permissionId }) => ({
        url:    `/roles/${roleId}/permissions/${permissionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { roleId }) => [{ type: 'Role', id: roleId }],
    }),

  }),
});

export const {
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useSyncRolePermissionsMutation,
  useAssignPermissionToRoleMutation,
  useRemovePermissionFromRoleMutation,
} = roleApi;