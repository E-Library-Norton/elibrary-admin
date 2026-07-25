// src/services/statsApi.ts
import { api } from './api';

// ── Types 

export interface UploadStat {
  year:     number;
  books:    number;
  theses:   number;
  journals: number;
}

export interface CategoryStat {
  name:  string;
  value: number;
}

export interface CategoryView {
  name:  string;
  views: number;
  books: number;
}

export interface MonthlyReadingStat {
  month:     string;
  views:     number;
  downloads: number;
  new_books: number;
  joins:     number;
}

export interface RoleActivityStat {
  user_role:    string;
  create_count: number;
  update_count: number;
  delete_count: number;
}

export interface RecentActivity {
  id:          string;
  action:      string;
  target_name: string;
  created_at:  string;
  type:        string;
  user:        { eng_name: string; kh_name: string };
  user_role:   string;
}

export interface DailyTrend {
  date:      string;
  joins:     number;
  downloads: number;
  views:     number;
}

export interface YearlyTrend {
  year:      number;
  new_books: number;
  joins:     number;
  downloads: number;
}

export interface OverviewData {
  total_books:          number;
  total_theses:         number;
  total_members:        number;
  total_active_members: number;
  total_journals:       number;
  total_authors:        number;
  total_categories:     number;
  total_downloads:      number;
  total_articles:       number;
  upload_stats:         UploadStat[];
  category_stats:       CategoryStat[];
  category_views:       CategoryView[];
  monthly_reading_stats: MonthlyReadingStat[];
  daily_trends:         DailyTrend[];
  yearly_trends:        YearlyTrend[];
  role_activity_stats:  RoleActivityStat[];
  recent_activities:    RecentActivity[];
  total_activities:     number;
}

export interface OverviewResponse {
  success: boolean;
  data:    OverviewData;
}

export interface PopularBook {
  id:            string;
  title:         string;
  views:         number;
  downloadCount: number;
  averageRating: string;
  reviewCount:   string;
  Category?:     { id: string; name: string };
  Authors?:      { id: string; name: string }[];
}

export interface PopularBooksResponse {
  success: boolean;
  data:    { popularBooks: PopularBook[] };
}

// ── API 

const statsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/stats/overview?days=7
    getOverview: builder.query<OverviewResponse, { days?: number | string } | void>({
      query: (params) => {
        const days = params?.days ?? 7;
        return `/stats/overview?days=${days}`;
      },
      providesTags: [
        { type: 'Book', id: 'LIST' },
        { type: 'User', id: 'LIST' },
        { type: 'Category', id: 'LIST' },
      ],
    }),

    // GET /api/stats/popular?limit=10
    getPopularBooks: builder.query<PopularBooksResponse, { limit?: number } | void>({
      query: (params) => {
        const limit = params?.limit ?? 10;
        return `/stats/popular?limit=${limit}`;
      },
      providesTags: ['Book'],
    }),
  }),
});

export const {
  useGetOverviewQuery,
  useGetPopularBooksQuery,
} = statsApi;

export default statsApi;
