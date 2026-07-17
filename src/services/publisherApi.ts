// src/services/publisherApi.ts
import { api } from './api';

export interface Publisher {
  id:           string;
  name:         string;
  nameKh:       string | null;
  address:      string | null;
  contactEmail: string | null;
}

export interface GetPublishersResponse {
  success: boolean;
  data: {
    publishers: Publisher[];
    total:      number;
    page:       number;
    limit:      number;
    totalPages: number;
  };
}

export interface PublisherResponse {
  success:  boolean;
  data:     Publisher;
  message?: string;
}

export interface CreatePublisherPayload {
  name:          string;
  nameKh?:       string;
  address?:      string;
  contactEmail?: string;
}

export interface UpdatePublisherPayload {
  name?:         string;
  nameKh?:       string;
  address?:      string;
  contactEmail?: string;
}

export const publisherApi = api.injectEndpoints({ overrideExisting: true,
  endpoints: (builder) => ({

    // GET /api/publishers?page=1&limit=10&search=
    getPublishers: builder.query<GetPublishersResponse, { page?: number; limit?: number; search?: string }>({
      query: ({ page = 1, limit = 10, search = '' } = {}) => ({
        url:    '/publishers',
        params: { page, limit, search },
      }),
      providesTags: (result) =>
        result?.data.publishers
          ? [
              ...result.data.publishers.map(({ id }) => ({ type: 'Publisher' as const, id })),
              { type: 'Publisher', id: 'LIST' },
            ]
          : [{ type: 'Publisher', id: 'LIST' }],
    }),

    // GET /api/publishers/:id
    getPublisherById: builder.query<PublisherResponse, string>({
      query: (id) => `/publishers/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Publisher', id }],
    }),

    // POST /api/publishers
    createPublisher: builder.mutation<PublisherResponse, CreatePublisherPayload>({
      query: (data) => ({
        url:    '/publishers',
        method: 'POST',
        body:   data,
      }),
      invalidatesTags: [{ type: 'Publisher', id: 'LIST' }],
    }),

    // PUT /api/publishers/:id
    updatePublisher: builder.mutation<PublisherResponse, { id: string; data: UpdatePublisherPayload }>({
      query: ({ id, data }) => ({
        url:    `/publishers/${id}`,
        method: 'PUT',
        body:   data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Publisher', id },
        { type: 'Publisher', id: 'LIST' },
      ],
    }),

    // DELETE /api/publishers/:id
    deletePublisher: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url:    `/publishers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Publisher', id },
        { type: 'Publisher', id: 'LIST' },
      ],
    }),

  }),
});

export const {
  useGetPublishersQuery,
  useGetPublisherByIdQuery,
  useCreatePublisherMutation,
  useUpdatePublisherMutation,
  useDeletePublisherMutation,
} = publisherApi;