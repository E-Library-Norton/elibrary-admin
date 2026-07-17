// src/services/feedbackApi.ts
import { api } from './api';

// ── Types ────────────────────────────────────────────────────────────────────

export interface FeedbackUser {
  id:        string;
  firstName: string | null;
  lastName:  string | null;
  username:  string;
  avatar:    string | null;
  email:     string | null;
}

export interface Feedback {
  id:          string;
  userId:      string | null;
  type:        'general' | 'bug' | 'feature' | 'content' | 'account';
  subject:     string;
  message:     string;
  name:        string | null;
  email:       string | null;
  rating:      number | null;
  status:      'new' | 'reviewed' | 'in_progress' | 'resolved' | 'closed';
  adminNotes:  string | null;
  resolvedBy:  string | null;
  resolvedAt:  string | null;
  created_at:  string;
  updated_at:  string;
  User?:       FeedbackUser | null;
  Resolver?:   FeedbackUser | null;
}

export interface GetFeedbackResponse {
  success: boolean;
  data: {
    feedbacks:   Feedback[];
    total:       number;
    totalPages:  number;
    currentPage: number;
  };
}

export interface GetFeedbackStatsResponse {
  success: boolean;
  data: {
    total:    number;
    byStatus: Record<string, number>;
    byType:   Record<string, number>;
    avgRating: number | null;
  };
}

export interface GetFeedbackParams {
  page?:   number;
  limit?:  number;
  status?: string;
  type?:   string;
  search?: string;
}

export interface UpdateFeedbackPayload {
  status?:     string;
  adminNotes?: string;
}

// ── Endpoints ────────────────────────────────────────────────────────────────

export const feedbackApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({

    // GET /api/feedback  (admin — paginated list)
    getFeedback: builder.query<GetFeedbackResponse, GetFeedbackParams>({
      query: (params = {}) => ({
        url: '/feedback',
        params: {
          page:  params.page  ?? 1,
          limit: params.limit ?? 20,
          ...(params.status && { status: params.status }),
          ...(params.type   && { type:   params.type }),
          ...(params.search && { search: params.search }),
        },
      }),
      providesTags: (result) =>
        result?.data.feedbacks
          ? [
              ...result.data.feedbacks.map(({ id }) => ({ type: 'Feedback' as const, id })),
              { type: 'Feedback', id: 'LIST' },
            ]
          : [{ type: 'Feedback', id: 'LIST' }],
    }),

    // GET /api/feedback/stats
    getFeedbackStats: builder.query<GetFeedbackStatsResponse, void>({
      query: () => '/feedback/stats',
      providesTags: [{ type: 'Feedback', id: 'STATS' }],
    }),

    // GET /api/feedback/:id
    getFeedbackById: builder.query<{ success: boolean; data: Feedback }, string>({
      query: (id) => `/feedback/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Feedback', id }],
    }),

    // PATCH /api/feedback/:id
    updateFeedback: builder.mutation<
      { success: boolean; data: Feedback; message: string },
      { id: string; data: UpdateFeedbackPayload }
    >({
      query: ({ id, data }) => ({
        url:    `/feedback/${id}`,
        method: 'PATCH',
        body:   data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Feedback', id },
        { type: 'Feedback', id: 'LIST' },
        { type: 'Feedback', id: 'STATS' },
      ],
    }),

    // DELETE /api/feedback/:id
    deleteFeedback: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url:    `/feedback/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'Feedback', id: 'LIST' },
        { type: 'Feedback', id: 'STATS' },
      ],
    }),

  }),
});

export const {
  useGetFeedbackQuery,
  useGetFeedbackStatsQuery,
  useGetFeedbackByIdQuery,
  useUpdateFeedbackMutation,
  useDeleteFeedbackMutation,
} = feedbackApi;
