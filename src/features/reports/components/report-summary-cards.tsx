import { Card, CardContent } from "@/components/ui/card";
import type { ReportPeriod, ReportType } from "@/services/reportApi";
import { ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";

const SUMMARY_ROUTES: Record<string, string> = {
  totalUsers: "/dashboard/users",
  activeUsers: "/dashboard/users",
  inactiveUsers: "/dashboard/users",
  newUsers: "/dashboard/users",
  uniqueUsers: "/dashboard/users",
  totalBooks: "/dashboard/books",
  activeBooks: "/dashboard/books",
  uniqueBooks: "/dashboard/books",
  totalDownloads: "/dashboard/downloads",
  topBookDownloads: "/dashboard/downloads",
  topUserDownloads: "/dashboard/downloads",
  totalReviews: "/dashboard/reviews",
  averageBookRating: "/dashboard/reviews",
  averageRating: "/dashboard/reviews",
  totalFeedback: "/dashboard/feedback",
  totalAuthors: "/dashboard/books/authors",
  totalActivities: "/dashboard/audit-logs",
  uniqueActors: "/dashboard/audit-logs",
  actionTypes: "/dashboard/audit-logs",
  deleteActions: "/dashboard/audit-logs",
};

function reportRoute(type: ReportType, period: ReportPeriod) {
  return `/dashboard/reports?type=${type}&period=${period}`;
}

function summaryRoute(
  key: string,
  reportType: ReportType,
  period: ReportPeriod,
) {
  if (SUMMARY_ROUTES[key]) return SUMMARY_ROUTES[key];
  if (key === "totalGroups") {
    if (reportType === "categories") return "/dashboard/books/categories";
    if (reportType === "departments") return "/dashboard/books/departments";
  }
  if (
    key === "totalBookViews" ||
    key === "totalViews" ||
    key === "booksWithNoViews"
  ) {
    return reportRoute("book-views", period);
  }

  const reportRoutes: Partial<Record<ReportType, string>> = {
    users: "/dashboard/users",
    books: "/dashboard/books",
    downloads: "/dashboard/downloads",
    reviews: "/dashboard/reviews",
    feedback: "/dashboard/feedback",
    authors: "/dashboard/books/authors",
    categories: "/dashboard/books/categories",
    departments: "/dashboard/books/departments",
    activities: "/dashboard/audit-logs",
  };

  return reportRoutes[reportType] ?? reportRoute(reportType, period);
}

function humanize(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^\w|\s\w/g, (character) => character.toUpperCase());
}

function formatValue(value: number | string) {
  if (typeof value === "number")
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
      value,
    );
  return value;
}

export function ReportSummaryCards({
  summary,
  comparisons = {},
  reportType,
  period,
}: {
  summary: Record<string, number | string>;
  comparisons?: Record<string, number>;
  reportType: ReportType;
  period: ReportPeriod;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Object.entries(summary).map(([key, value]) => {
        const comparison = comparisons[key];
        const href = summaryRoute(key, reportType, period);

        return (
          <Link
            key={key}
            href={href}
            aria-label={`View ${humanize(key).toLowerCase()}`}
            className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Card className="h-full overflow-hidden transition-colors group-hover:border-primary/50 group-hover:bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-muted-foreground text-sm">
                      {humanize(key)}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
                      {formatValue(value)}
                    </p>
                  </div>
                  <div className="bg-primary/10 text-primary rounded-full p-2 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </div>
                </div>
                {typeof comparison === "number" && (
                  <div
                    className={`mt-2 flex items-center gap-1 text-xs ${comparison >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}
                  >
                    {comparison >= 0 ? (
                      <TrendingUp className="size-3.5" />
                    ) : (
                      <TrendingDown className="size-3.5" />
                    )}
                    <span>
                      {comparison >= 0 ? "+" : ""}
                      {comparison}% from previous period
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
