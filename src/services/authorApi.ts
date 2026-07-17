// src/services/authorApi.ts
import { api } from './api';

export interface Author {
  id:        string;
  name:      string;
  nameKh:    string | null;
  biography: string | null;
  website:   string | null;
}

export interface GetAuthorsResponse {
  success: boolean;
  data: {
    authors:    Author[];
    total:      number;
    page:       number;
    limit:      number;
    totalPages: number;
  };
}

export interface AuthorResponse {
  success:  boolean;
  data:     Author;
  message?: string;
}

export interface CreateAuthorPayload {
  name:       string;
  nameKh?:    string;
  biography?: string;
  website?:   string;
}

export interface UpdateAuthorPayload {
  name?:      string;
  nameKh?:    string;
  biography?: string;
  website?:   string;
}

export const authorApi = api.injectEndpoints({overrideExisting: true,
  endpoints: (builder) => ({

    // GET /api/authors?page=1&limit=10&search=
    getAuthors: builder.query<GetAuthorsResponse, { page?: number; limit?: number; search?: string }>({
      query: ({ page = 1, limit = 10, search = '' } = {}) => ({
        url:    '/authors',
        params: { page, limit, search },
      }),
      providesTags: (result) =>
        result?.data.authors
          ? [
              ...result.data.authors.map(({ id }) => ({ type: 'Author' as const, id })),
              { type: 'Author', id: 'LIST' },
            ]
          : [{ type: 'Author', id: 'LIST' }],
    }),

    // GET /api/authors/:id
    getAuthorById: builder.query<AuthorResponse, string>({
      query: (id) => `/authors/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Author', id }],
    }),

    // POST /api/authors
    createAuthor: builder.mutation<AuthorResponse, CreateAuthorPayload>({
      query: (data) => ({
        url:    '/authors',
        method: 'POST',
        body:   data,
      }),
      invalidatesTags: [{ type: 'Author', id: 'LIST' }],
    }),

    // PUT /api/authors/:id
    updateAuthor: builder.mutation<AuthorResponse, { id: string; data: UpdateAuthorPayload }>({
      query: ({ id, data }) => ({
        url:    `/authors/${id}`,
        method: 'PUT',
        body:   data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Author', id },
        { type: 'Author', id: 'LIST' },
      ],
    }),

    // DELETE /api/authors/:id
    deleteAuthor: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url:    `/authors/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Author', id },
        { type: 'Author', id: 'LIST' },
      ],
    }),

  }),
});

export const {
  useGetAuthorsQuery,
  useGetAuthorByIdQuery,
  useCreateAuthorMutation,
  useUpdateAuthorMutation,
  useDeleteAuthorMutation,
} = authorApi;