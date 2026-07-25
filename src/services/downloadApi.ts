import { api } from './api';

export interface DownloadRecord {
  id: string;
  userId: string;
  bookId: string;
  downloadedAt: string;
  User: {
    id: string;
    username: string;
    email: string;
    studentId: string | null;
    firstName: string | null;
    lastName: string | null;
    isDeleted: boolean;
  } | null;
  Book: {
    id: string;
    title: string;
    isbn: string | null;
    coverUrl: string | null;
    downloads: number;
    isDeleted: boolean;
  } | null;
}

interface DownloadsResponse {
  success: boolean;
  data: {
    downloads: DownloadRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface GetDownloadsParams {
  page?: number;
  limit?: number;
  search?: string;
  from?: string;
  to?: string;
  sort?: 'newest' | 'most_downloaded';
}

const downloadApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDownloads: builder.query<DownloadsResponse, GetDownloadsParams | void>({
      query: (params) => ({
        url: '/downloads',
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
          ...(params?.search && { search: params.search }),
          ...(params?.from && { from: params.from }),
          ...(params?.to && { to: params.to }),
          ...(params?.sort && { sort: params.sort })
        }
      }),
      providesTags: [{ type: 'Download', id: 'LIST' }]
    })
  })
});

export const { useGetDownloadsQuery } = downloadApi;

export default downloadApi;
