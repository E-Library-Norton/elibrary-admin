import { api } from "./api";

export type ReportType =
  | "overview"
  | "users"
  | "logins"
  | "books"
  | "book-views"
  | "downloads"
  | "reading-progress"
  | "reviews"
  | "feedback"
  | "authors"
  | "categories"
  | "departments"
  | "activities";

export type ReportPeriod =
  | "today"
  | "yesterday"
  | "last_7_days"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_year"
  | "last_year"
  | "custom";

export interface ReportQuery {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  period?: ReportPeriod;
  status?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  rating?: number;
  feedbackType?: string;
  action?: string;
  targetType?: string;
  language?: string;
  userId?: string;
  bookId?: string;
  categoryId?: string;
  departmentId?: string;
  materialTypeId?: string;
  roleId?: string;
}

export interface ReportPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface ReportChartItem {
  label: string;
  value?: number;
  downloads?: number;
  views?: number;
  [key: string]: unknown;
}

export interface ReportData {
  summary: Record<string, number | string>;
  charts: {
    trend?: ReportChartItem[];
    distribution?: ReportChartItem[];
    topItems?: ReportChartItem[];
  };
  records: Array<Record<string, unknown>>;
  pagination: ReportPagination;
  filters: Record<string, unknown>;
  meta: {
    timeZone: string;
    comparisons?: Record<string, number>;
    notice?: string;
    [key: string]: unknown;
  };
}

interface ReportResponse {
  success: boolean;
  message: string;
  data: ReportData;
}

interface ExportReportPayload {
  type: ReportType;
  format: "pdf" | "excel";
  filters: ReportQuery;
}

const reportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getReport: builder.query<
      ReportResponse,
      { type: ReportType; params: ReportQuery }
    >({
      query: ({ type, params }) => ({ url: `/admin/reports/${type}`, params }),
      providesTags: (_result, _error, { type }) => [
        { type: "Report", id: type },
      ],
    }),
    exportReport: builder.mutation<Blob, ExportReportPayload>({
      query: ({ type, format, filters }) => ({
        url: `/admin/reports/${type}/export/${format}`,
        method: "POST",
        body: { ...filters, filters },
        responseHandler: (response) => response.blob(),
        cache: "no-cache",
      }),
    }),
  }),
});

export const { useGetReportQuery, useExportReportMutation } = reportApi;
export default reportApi;
