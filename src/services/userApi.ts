// services/userApi.ts
import { api } from './api';

export interface Role {
  id: string;
  name: string;
  description: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  studentId: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  avatar?: string | null;
  Roles: Role[];
}

export interface GetUsersResponse {
  success: boolean;
  data: {
    users: User[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface UserResponse {
  success: boolean;
  data: User;
  message: string;
}

export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  studentId?: string;
  firstName?: string;
  lastName?: string;
  roleIds?: string[];
}

export interface UpdateUserPayload {
  username?: string;
  email?: string;
  studentId?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  roleIds?: string[];
}

export const userApi = api.injectEndpoints({overrideExisting: true,
  endpoints: (builder) => ({

    // GET /users?page=1&limit=20&search=
    getUsers: builder.query<GetUsersResponse, { page?: number; limit?: number; search?: string; isActive?: boolean }>({
      query: ({ page = 1, limit = 20, search = '', isActive } = {}) => ({
        url: '/users',
        params: { page, limit, search, ...(isActive !== undefined && { isActive }) },
      }),
      providesTags: (result) =>
        result?.data.users
          ? [
              ...result.data.users.map(({ id }) => ({ type: 'User' as const, id })),
              { type: 'User', id: 'LIST' },
            ]
          : [{ type: 'User', id: 'LIST' }],
    }),

    // GET /users/:id
    getUserById: builder.query<UserResponse, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'User', id }],
    }),

    // POST /users
    createUser: builder.mutation<UserResponse, CreateUserPayload>({
      query: (data) => ({
        url: '/users',
        method: 'POST',
        body: data,
      }),
      // invalidate LIST so the new user row appears
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    // PATCH /users/:id
    updateUser: builder.mutation<UserResponse, { id: string; data: UpdateUserPayload }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: () => [], 
    }),

    // DELETE /users/:id
    deleteUser: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
      ],
    }),

    // PATCH /users/:id/roles — sends ALL roleIds in one shot
    assignRole: builder.mutation<{ success: boolean }, { userId: string; roleIds: string[] }>({
      query: ({ userId, roleIds }) => ({
        url: `/users/${userId}/roles`,
        method: 'PATCH',
        body: { roleIds },
      }),
      invalidatesTags: () => [],
    }),

    // DELETE /users/:id/roles/:roleId
    removeRole: builder.mutation<{ success: boolean }, { userId: string; roleId: string }>({
      query: ({ userId, roleId }) => ({
        url: `/users/${userId}/roles/${roleId}`,
        method: 'DELETE',
      }),
      invalidatesTags: () => [], 
    }),

    // POST /users/:id/avatar — multipart upload, admin only
    uploadUserAvatar: builder.mutation<{ success: boolean; data: { avatar: string } }, { id: string; file: File }>({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append('avatar', file);
        return {
          url: `/users/${id}/avatar`,
          method: 'POST',
          body: formData,
          formData: true,
        };
      },
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
      ],
    }),

  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useAssignRoleMutation,
  useRemoveRoleMutation,
  useUploadUserAvatarMutation,
} = userApi;
