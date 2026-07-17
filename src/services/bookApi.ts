// src/services/bookApi.ts
import { api } from './api';

// ── Types 

export interface BookAuthor {
  id:             string;
  name:           string;
  nameKh:         string | null;
  books_authors?: { isPrimaryAuthor: boolean };
}

export interface BookEditor {
  id:    string;
  name:  string;
  nameKh: string | null;
}

export interface BookPublisher {
  id:    string;
  name:  string;
  nameKh: string | null;
}

export interface Book {
  id:              string;
  title:           string;
  titleKh:         string | null;
  isbn:            string | null;
  publicationYear: number | null;
  description:     string | null;
  coverUrl:        string | null;
  pdfUrl:          string | null;
  pdfUrls:         string[] | null;
  videoUrl:        string | null;
  audioUrl:        string | null;
  pages:           number | null;
  language:        string | null;
  views:           number;
  downloads:       number;
  isActive:        boolean;
  isDeleted:       boolean;
  createdAt:       string;
  updatedAt:       string;
  Category?:       { id: string; name: string; nameKh: string | null };
  Publisher?:      { id: string; name: string; nameKh: string | null };
  Department?:     { id: string; name: string; nameKh: string | null };
  MaterialType?:   { id: string; name: string; nameKh: string | null };
  Authors?:        BookAuthor[];
  Editors?:        BookEditor[];
  Publishers?:     BookPublisher[];
}

// ── Response shapes ────────────────────────────────────────────────────────────

export interface GetBooksResponse {
  success: boolean;
  data: {
    books:      Book[];
    total:      number;
    page:       number;
    limit:      number;
    totalPages: number;
  };
}

export interface BookResponse {
  success:  boolean;
  data:     Book;
  message?: string;
}

// ── Payloads ───────────────────────────────────────────────────────────────────

export interface CreateBookPayload {
  title:            string;
  titleKh?:         string;
  isbn?:            string;
  publicationYear?: number;
  description?:     string;
  coverUrl?:        string;
  pdfUrl?:          string;
  pdfUrls?:         string[];
  pages?:           number;
  categoryId?:      string;
  publisherId?:     string;
  departmentId?:    string;
  typeId?:          string;
  isActive?:        boolean;
  authorIds?:       { id: string; isPrimaryAuthor?: boolean }[];
  authorNames?:     string[]; // find-or-create by name
  editorNames?:     string[]; // find-or-create by name
  publisherNames?:  string[]; // find-or-create by name
}

export interface UpdateBookPayload extends Partial<CreateBookPayload> {}

// ── Query params ───────────────────────────────────────────────────────────────

export interface GetBooksParams {
  page?:            number;
  limit?:           number;
  search?:          string;
  categoryId?:      string;
  publisherId?:     string;
  departmentId?:    string;
  typeId?:          string;
  publicationYear?: number;
  yearFrom?:        number;
  yearTo?:          number;
  language?:        string;
  authorId?:        string;
  isActive?:        boolean;
  sortBy?:          string;
  sortOrder?:       'ASC' | 'DESC';
}

// ─────────────────────────────────────────────────────────────────────────────

export const bookApi = api.injectEndpoints({overrideExisting: true,
  endpoints: (builder) => ({

    // GET /api/books
    getBooks: builder.query<GetBooksResponse, GetBooksParams>({
      query: (params = {}) => ({
        url: '/books',
        params: {
          page:   params.page  ?? 1,
          limit:  params.limit ?? 10,
          search: params.search ?? '',
          ...(params.categoryId      && { categoryId:      params.categoryId }),
          ...(params.publisherId     && { publisherId:     params.publisherId }),
          ...(params.departmentId    && { departmentId:    params.departmentId }),
          ...(params.typeId          && { typeId:          params.typeId }),
          ...(params.publicationYear && { publicationYear: params.publicationYear }),
          ...(params.yearFrom        && { yearFrom:        params.yearFrom }),
          ...(params.yearTo          && { yearTo:          params.yearTo }),
          ...(params.language        && { language:        params.language }),
          ...(params.authorId        && { authorId:        params.authorId }),
          ...(params.isActive !== undefined && { isActive: params.isActive }),
          ...(params.sortBy          && { sortBy:          params.sortBy }),
          ...(params.sortOrder       && { sortOrder:       params.sortOrder }),
        },
      }),
      providesTags: (result) =>
        result?.data.books
          ? [
              ...result.data.books.map(({ id }) => ({ type: 'Book' as const, id })),
              { type: 'Book', id: 'LIST' },
            ]
          : [{ type: 'Book', id: 'LIST' }],
    }),

    // GET /api/books/:id
    getBookById: builder.query<BookResponse, string>({
      query: (id) => `/books/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Book', id }],
    }),

    // POST /api/books  (JSON: text fields + pre-uploaded R2 URLs)
    createBook: builder.mutation<BookResponse, CreateBookPayload>({
      query: (payload) => ({
        url:    '/books',
        method: 'POST',
        body:   payload,
      }),
      invalidatesTags: [{ type: 'Book', id: 'LIST' }],
    }),

    // PUT /api/books/:id  (JSON: text fields + pre-uploaded R2 URLs)
    updateBook: builder.mutation<BookResponse, { id: string; data: UpdateBookPayload }>({
      query: ({ id, data }) => ({
        url:    `/books/${id}`,
        method: 'PUT',
        body:   data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Book', id },
        { type: 'Book', id: 'LIST' },
      ],
    }),

    // DELETE /api/books/:id
    deleteBook: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url:    `/books/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Book', id },
        { type: 'Book', id: 'LIST' },
      ],
    }),

  }),
});

export const {
  useGetBooksQuery,
  useGetBookByIdQuery,
  useCreateBookMutation,
  useUpdateBookMutation,
  useDeleteBookMutation,
} = bookApi;