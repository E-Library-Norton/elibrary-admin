// src/services/reviewApi.ts
import { api } from './api';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ReviewUser {
  id:        string;
  firstName: string | null;
  lastName:  string | null;
  username:  string;
  avatar:    string | null;
}

export interface ReviewBook {
  id:       string;
  title:    string;
  titleKh:  string | null;
  coverUrl: string | null;
}

export interface Review {
  id:        string;
  bookId:    string;
  userId:    string;
  rating:    number;
  comment:   string | null;
  isDeleted: boolean;
  created_at: string;
  updated_at: string;
  User?:     ReviewUser;
  Book?:     ReviewBook;
}

export interface GetReviewsResponse {
  success: boolean;
  data: {
    reviews:     Review[];
    total:       number;
    totalPages:  number;
    currentPage: number;
  };
}

export interface GetBookReviewsResponse {
  success: boolean;
  data: {
    reviews:       Review[];
    averageRating: number | null;
    totalReviews:  number;
    totalPages:    number;
    currentPage:   number;
  };
}

export interface GetReviewsParams {
  page?:   number;
  limit?:  number;
  bookId?: string;
  userId?: string;
  rating?: number;
  search?: string;
}

export interface GetBookReviewsParams {
  bookId: string;
  page?:  number;
  limit?: number;
}

export interface ReviewStatsResponse {
  success: boolean;
  data: {
    total:         number;
    byRating:      Record<string, number>;
    averageRating: number | null;
  };
}

// ── Endpoints ────────────────────────────────────────────────────────────────

export const reviewApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({

    // GET /api/reviews/stats  (admin)
    getReviewStats: builder.query<ReviewStatsResponse, void>({
      query: () => '/reviews/stats',
      providesTags: [{ type: 'Review', id: 'STATS' }],
    }),

    // GET /api/reviews  (admin — all reviews)
    getReviews: builder.query<GetReviewsResponse, GetReviewsParams>({
      query: (params = {}) => ({
        url: '/reviews',
        params: {
          page:  params.page  ?? 1,
          limit: params.limit ?? 20,
          ...(params.bookId && { bookId: params.bookId }),
          ...(params.userId && { userId: params.userId }),
          ...(params.rating && { rating: params.rating }),
          ...(params.search && { search: params.search }),
        },
      }),
      providesTags: (result) =>
        result?.data.reviews
          ? [
              ...result.data.reviews.map(({ id }) => ({ type: 'Review' as const, id })),
              { type: 'Review', id: 'LIST' },
            ]
          : [{ type: 'Review', id: 'LIST' }],
    }),

    // GET /api/books/:bookId/reviews
    getBookReviews: builder.query<GetBookReviewsResponse, GetBookReviewsParams>({
      query: ({ bookId, ...params }) => ({
        url: `/books/${bookId}/reviews`,
        params: {
          page:  params.page  ?? 1,
          limit: params.limit ?? 20,
        },
      }),
      providesTags: (_result, _error, { bookId }) => [
        { type: 'Review', id: `book-${bookId}` },
        { type: 'Review', id: 'LIST' },
      ],
    }),

    // DELETE /api/reviews/:id
    deleteReview: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url:    `/reviews/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Review', id: 'LIST' }],
    }),

    // PUT /api/reviews/:id  (admin edits rating/comment)
    updateReview: builder.mutation<
      { success: boolean; data: Review; message: string },
      { id: string; rating?: number; comment?: string }
    >({
      query: ({ id, ...body }) => ({
        url:    `/reviews/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Review', id },
        { type: 'Review', id: 'LIST' },
        { type: 'Review', id: 'STATS' },
      ],
    }),

    // POST /api/books/:bookId/reviews  (admin creates a review)
    createReview: builder.mutation<
      { success: boolean; data: Review; message: string },
      { bookId: string; rating: number; comment?: string }
    >({
      query: ({ bookId, ...body }) => ({
        url:    `/books/${bookId}/reviews`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Review', id: 'LIST' }, { type: 'Review', id: 'STATS' }],
    }),

  }),
});

export const {
  useGetReviewsQuery,
  useGetReviewStatsQuery,
  useGetBookReviewsQuery,
  useDeleteReviewMutation,
  useUpdateReviewMutation,
  useCreateReviewMutation,
} = reviewApi;
