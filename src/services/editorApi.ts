// src/services/editorApi.ts
import { api } from './api';

export interface Editor {
  id:        string;
  name:      string;
  nameKh:    string | null;
  biography: string | null;
  website:   string | null;
}

export interface GetEditorsResponse {
  success: boolean;
  data: {
    editors:    Editor[];
    total:      number;
    page:       number;
    limit:      number;
    totalPages: number;
  };
}

export interface EditorResponse {
  success:  boolean;
  data:     Editor;
  message?: string;
}

export interface CreateEditorPayload {
  name:       string;
  nameKh?:    string;
  biography?: string;
  website?:   string;
}

export interface UpdateEditorPayload {
  name?:      string;
  nameKh?:    string;
  biography?: string;
  website?:   string;
}

export const editorApi = api.injectEndpoints({ overrideExisting: true,
  endpoints: (builder) => ({

    // GET /api/editors?page=1&limit=10&search=
    getEditors: builder.query<GetEditorsResponse, { page?: number; limit?: number; search?: string }>({
      query: ({ page = 1, limit = 10, search = '' } = {}) => ({
        url:    '/editors',
        params: { page, limit, search },
      }),
      providesTags: (result) =>
        result?.data.editors
          ? [
              ...result.data.editors.map(({ id }) => ({ type: 'Editor' as const, id })),
              { type: 'Editor', id: 'LIST' },
            ]
          : [{ type: 'Editor', id: 'LIST' }],
    }),

    // GET /api/editors/:id
    getEditorById: builder.query<EditorResponse, string>({
      query: (id) => `/editors/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Editor', id }],
    }),

    // POST /api/editors
    createEditor: builder.mutation<EditorResponse, CreateEditorPayload>({
      query: (data) => ({
        url:    '/editors',
        method: 'POST',
        body:   data,
      }),
      invalidatesTags: [{ type: 'Editor', id: 'LIST' }],
    }),

    // PUT /api/editors/:id
    updateEditor: builder.mutation<EditorResponse, { id: string; data: UpdateEditorPayload }>({
      query: ({ id, data }) => ({
        url:    `/editors/${id}`,
        method: 'PUT',
        body:   data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Editor', id },
        { type: 'Editor', id: 'LIST' },
      ],
    }),

    // DELETE /api/editors/:id
    deleteEditor: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url:    `/editors/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Editor', id },
        { type: 'Editor', id: 'LIST' },
      ],
    }),

  }),
});

export const {
  useGetEditorsQuery,
  useGetEditorByIdQuery,
  useCreateEditorMutation,
  useUpdateEditorMutation,
  useDeleteEditorMutation,
} = editorApi;
