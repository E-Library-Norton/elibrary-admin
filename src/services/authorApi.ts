// src/services/authorApi.ts
import { api } from "./api";

export interface Author {
  id: string;
  name: string;
  nameKh: string | null;
  biography: string | null;
  website: string | null;
  totalBooks: number;
}

export interface AuthorBook {
  id: string;
  title: string;
  titleKh: string | null;
  coverUrl: string | null;
  publicationYear: number | null;
  views: number;
  downloads: number;
  isPrimaryAuthor: boolean;
}

export interface AuthorDetails extends Author {
  books: AuthorBook[];
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetAuthorsResponse {
  success: boolean;
  data: {
    authors: Author[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuthorResponse {
  success: boolean;
  data: AuthorDetails;
  message?: string;
}

export interface AuthorMutationResponse {
  success: boolean;
  data: Omit<Author, "totalBooks">;
  message?: string;
}

export interface CreateAuthorPayload {
  name: string;
  nameKh?: string;
  biography?: string;
  website?: string;
}

export interface UpdateAuthorPayload {
  name?: string;
  nameKh?: string;
  biography?: string;
  website?: string;
}

export const authorApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // GET /api/authors?page=1&limit=10&search=
    getAuthors: builder.query<
      GetAuthorsResponse,
      { page?: number; limit?: number; search?: string }
    >({
      query: ({ page = 1, limit = 10, search = "" } = {}) => ({
        url: "/authors",
        params: { page, limit, search },
      }),
      providesTags: (result) =>
        result?.data.authors
          ? [
              ...result.data.authors.map(({ id }) => ({
                type: "Author" as const,
                id,
              })),
              { type: "Author", id: "LIST" },
            ]
          : [{ type: "Author", id: "LIST" }],
    }),

    // GET /api/authors/:id
    getAuthorById: builder.query<
      AuthorResponse,
      { id: string; page?: number; limit?: number }
    >({
      query: ({ id, page = 1, limit = 12 }) => ({
        url: `/authors/${id}`,
        params: { page, limit },
      }),
      providesTags: (_result, _error, { id }) => [{ type: "Author", id }],
    }),

    // POST /api/authors
    createAuthor: builder.mutation<AuthorMutationResponse, CreateAuthorPayload>(
      {
        query: (data) => ({
          url: "/authors",
          method: "POST",
          body: data,
        }),
        invalidatesTags: [{ type: "Author", id: "LIST" }],
      },
    ),

    // PUT /api/authors/:id
    updateAuthor: builder.mutation<
      AuthorMutationResponse,
      { id: string; data: UpdateAuthorPayload }
    >({
      query: ({ id, data }) => ({
        url: `/authors/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Author", id },
        { type: "Author", id: "LIST" },
      ],
    }),

    // DELETE /api/authors/:id
    deleteAuthor: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({
        url: `/authors/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Author", id },
        { type: "Author", id: "LIST" },
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
