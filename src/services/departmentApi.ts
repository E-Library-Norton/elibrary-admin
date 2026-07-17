// src/services/departmentApi.ts
import { api } from './api';

export interface Department {
  id: string;
  code: string | null;
  name: string;
  nameKh: string | null;
  description: string | null;
}

export interface DepartmentResponse {
  success: boolean;
  data: Department;
  message?: string;
}

export interface DepartmentsResponse {
  success: boolean;
  data: Department[];
}

export interface CreateDepartmentPayload {
  name: string;
  nameKh?: string;
  code?: string;
  description?: string;
}

export interface UpdateDepartmentPayload {
  name?: string;
  nameKh?: string;
  code?: string;
  description?: string;
}

export const departmentApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({

    getDepartments: builder.query<DepartmentsResponse, void>({
      query: () => '/departments',
      providesTags: (result) =>
        result?.data
          ? [
            ...result.data.map(({ id }) => ({ type: 'Department' as const, id })),
            { type: 'Department', id: 'LIST' },
          ]
          : [{ type: 'Department', id: 'LIST' }],
    }),

    getDepartmentById: builder.query<DepartmentResponse, string>({
      query: (id) => `/departments/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Department', id }],
    }),

    createDepartment: builder.mutation<DepartmentResponse, CreateDepartmentPayload>({
      query: (data) => ({ url: '/departments', method: 'POST', body: data }),
      invalidatesTags: [{ type: 'Department', id: 'LIST' }],
    }),

    updateDepartment: builder.mutation<DepartmentResponse, { id: string; data: UpdateDepartmentPayload }>({
      query: ({ id, data }) => ({ url: `/departments/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Department', id },
        { type: 'Department', id: 'LIST' },
      ],
    }),

    deleteDepartment: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({ url: `/departments/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Department', id },
        { type: 'Department', id: 'LIST' },
      ],
    }),

  }),
});

export const {
  useGetDepartmentsQuery,
  useGetDepartmentByIdQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} = departmentApi;