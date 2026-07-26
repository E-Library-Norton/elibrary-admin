import { api } from "./api";

export interface AuditActivity {
  id: string;
  user: {
    name: string;
    email: string | null;
    initials: string;
    role: string;
  };
  action: string;
  target: string | null;
  type: string;
  metadata: Record<string, unknown> | null;
  timestamp: string;
}

interface ActivitiesResponse {
  success: boolean;
  data: {
    activities: AuditActivity[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

interface GetActivitiesParams {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
  type?: string;
  days?: string;
}

const activityApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getActivities: builder.query<ActivitiesResponse, GetActivitiesParams>({
      query: (params) => ({
        url: "/activities",
        params,
      }),
      providesTags: [{ type: "Activity", id: "LIST" }],
    }),
  }),
});

export const { useGetActivitiesQuery } = activityApi;

export default activityApi;
