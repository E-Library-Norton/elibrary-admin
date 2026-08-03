"use client";

import PageContainer from "@/components/layout/page-container";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ReportControls,
  type AppliedReportFilter,
} from "@/features/reports/components/report-controls";
import { ReportDataTable } from "@/features/reports/components/report-data-table";
import { ReportLoadingSkeleton } from "@/features/reports/components/report-loading-skeleton";
import { ReportSummaryCards } from "@/features/reports/components/report-summary-cards";
import {
  REPORT_BY_TYPE,
  REPORT_DEFINITIONS,
} from "@/features/reports/report-config";
import { useRole } from "@/hooks/use-role";
import {
  useExportReportMutation,
  useGetReportQuery,
  type ReportPeriod,
  type ReportQuery,
  type ReportType,
} from "@/services/reportApi";
import { AlertCircle, Info, ShieldAlert } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const REPORT_TYPES = new Set(REPORT_DEFINITIONS.map(({ type }) => type));

function ReportsPageContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { can, isAdmin } = useRole();
  const hasBaseAccess = isAdmin || can("reports.view");
  const reports = useMemo(
    () =>
      REPORT_DEFINITIONS.filter((report) => isAdmin || can(report.permission)),
    [can, isAdmin],
  );
  const requestedType = searchParams.get("type") as ReportType | null;
  const type = (
    requestedType &&
    REPORT_TYPES.has(requestedType) &&
    reports.some((report) => report.type === requestedType)
      ? requestedType
      : reports[0]?.type || "overview"
  ) as ReportType;
  const definition = REPORT_BY_TYPE[type];

  const period = (searchParams.get("period") || "this_month") as ReportPeriod;
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const status = searchParams.get("status") || "all";
  const sortBy =
    searchParams.get("sortBy") || definition.sortOptions[0]?.value || "";
  const sortOrder = searchParams.get("sortOrder") === "ASC" ? "ASC" : "DESC";
  const rating = searchParams.get("rating") || "all";
  const feedbackType = searchParams.get("feedbackType") || "all";
  const action = searchParams.get("action") || "all";
  const targetType = searchParams.get("targetType") || "all";
  const language = searchParams.get("language") || "all";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || "",
  );
  const [exportReport, { isLoading: isExporting }] = useExportReportMutation();

  const changeUrl = useCallback(
    (updates: Record<string, string | null>, replace = false) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === "all") params.delete(key);
        else params.set(key, value);
      });
      const url = `${pathname}?${params.toString()}`;
      if (replace) window.history.replaceState(null, "", url);
      else window.history.pushState(null, "", url);
    },
    [pathname, searchParams],
  );

  useEffect(() => {
    setSearchInput(searchParams.get("search") || "");
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const current = searchParams.get("search") || "";
      if (searchInput.trim() !== current)
        changeUrl({ search: searchInput.trim() || null, page: null }, true);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [changeUrl, searchInput, searchParams]);

  const query = useMemo<ReportQuery>(
    () => ({
      page,
      limit: 20,
      period,
      ...(period === "custom" && startDate && endDate
        ? { startDate, endDate }
        : {}),
      ...(searchParams.get("search")
        ? { search: searchParams.get("search") || undefined }
        : {}),
      ...(status !== "all" ? { status } : {}),
      ...(sortBy ? { sortBy } : {}),
      sortOrder,
      ...(rating !== "all" ? { rating: Number(rating) } : {}),
      ...(feedbackType !== "all" ? { feedbackType } : {}),
      ...(action !== "all" ? { action } : {}),
      ...(targetType !== "all" ? { targetType } : {}),
      ...(language !== "all" ? { language } : {}),
    }),
    [
      action,
      endDate,
      feedbackType,
      language,
      page,
      period,
      rating,
      searchParams,
      sortBy,
      sortOrder,
      startDate,
      status,
      targetType,
    ],
  );

  const customDateIncomplete = period === "custom" && (!startDate || !endDate);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetReportQuery(
      { type, params: query },
      {
        skip: !hasBaseAccess || !reports.length || customDateIncomplete,
        refetchOnMountOrArgChange: 30,
      },
    );
  const report = data?.data;

  const appliedFilters = useMemo<AppliedReportFilter[]>(() => {
    const values: AppliedReportFilter[] = [
      { key: "period", label: `Date: ${period.replaceAll("_", " ")}` },
    ];
    if (searchParams.get("search"))
      values.push({
        key: "search",
        label: `Search: ${searchParams.get("search")}`,
      });
    if (status !== "all")
      values.push({
        key: "status",
        label: `Status: ${status.replaceAll("_", " ")}`,
      });
    if (rating !== "all")
      values.push({ key: "rating", label: `Rating: ${rating} stars` });
    if (feedbackType !== "all")
      values.push({ key: "feedbackType", label: `Type: ${feedbackType}` });
    if (action !== "all")
      values.push({ key: "action", label: `Action: ${action}` });
    if (targetType !== "all")
      values.push({ key: "targetType", label: `Target: ${targetType}` });
    if (language !== "all")
      values.push({ key: "language", label: `Language: ${language}` });
    return values;
  }, [
    action,
    feedbackType,
    language,
    period,
    rating,
    searchParams,
    status,
    targetType,
  ]);

  const handleChange = (key: string, value: string, replace = false) => {
    if (key === "search") {
      setSearchInput(value);
      return;
    }
    const updates: Record<string, string | null> = { [key]: value, page: null };
    if (key === "period") {
      if (value === "custom") {
        const today = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Phnom_Penh",
        }).format(new Date());
        updates.startDate = String(
          report?.filters.startDate || `${today.slice(0, 7)}-01`,
        );
        updates.endDate = String(report?.filters.endDate || today);
      } else {
        updates.startDate = null;
        updates.endDate = null;
      }
    }
    changeUrl(updates, replace);
  };

  const handleReportChange = (nextType: ReportType) => {
    setSearchInput("");
    window.history.pushState(
      null,
      "",
      `${pathname}?type=${nextType}&period=${period}`,
    );
  };

  const handleReset = () => {
    setSearchInput("");
    window.history.pushState(
      null,
      "",
      `${pathname}?type=${type}&period=this_month`,
    );
  };

  const handleRemoveFilter = (key: string) => {
    if (key === "period")
      changeUrl({
        period: "this_month",
        startDate: null,
        endDate: null,
        page: null,
      });
    else changeUrl({ [key]: null, page: null });
  };

  const handleExport = async (format: "pdf" | "excel") => {
    try {
      const blob = await exportReport({
        type,
        format,
        filters: query,
      }).unwrap();
      const date = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Phnom_Penh",
      }).format(new Date());
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `norton-elibrary-${type}-report-${date}.${format === "excel" ? "xlsx" : "pdf"}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success(
        `${format === "pdf" ? "PDF" : "Excel"} report exported successfully`,
      );
    } catch {
      toast.error("Failed to export report. Please try again.");
    }
  };

  return (
    <PageContainer
      scrollable
      access={hasBaseAccess}
      pageTitle="Reports & Analytics"
      pageDescription="Analyze library activity, engagement, and operational performance."
      accessFallback={
        <div className="text-center">
          <ShieldAlert className="text-muted-foreground mx-auto mb-3 size-9" />
          <p className="font-medium">Reports access required</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Ask an administrator to assign the reports.view permission.
          </p>
        </div>
      }
    >
      <div className="space-y-5 pb-8">
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #report-print-area,
            #report-print-area * {
              visibility: visible;
            }
            #report-print-area {
              position: absolute;
              inset: 0;
              width: 100%;
              padding: 16px;
              background: white;
              color: black;
            }
          }
        `}</style>
        <ReportControls
          reports={reports}
          definition={definition}
          period={period}
          startDate={startDate}
          endDate={endDate}
          search={searchInput}
          status={status}
          sortBy={sortBy}
          sortOrder={sortOrder}
          rating={rating}
          feedbackType={feedbackType}
          action={action}
          targetType={targetType}
          language={language}
          appliedFilters={appliedFilters}
          isFetching={isFetching}
          isExporting={isExporting}
          canExportPdf={isAdmin || can("reports.export.pdf")}
          canExportExcel={isAdmin || can("reports.export.excel")}
          onReportChange={handleReportChange}
          onChange={handleChange}
          onRemoveFilter={handleRemoveFilter}
          onReset={handleReset}
          onRefresh={() => {
            void refetch();
          }}
          onExport={(format) => {
            void handleExport(format);
          }}
          onPrint={() => window.print()}
        />

        <section id="report-print-area" className="space-y-5">
          <div className="hidden print:block">
            <h1 className="text-2xl font-bold">
              Norton E-Library — {definition.label} Report
            </h1>
            <p>
              {report?.filters.startDate as string} to{" "}
              {report?.filters.endDate as string} · Asia/Phnom_Penh
            </p>
          </div>
          {isLoading && <ReportLoadingSkeleton />}
          {customDateIncomplete && (
            <Alert>
              <AlertCircle className="size-4" />
              <AlertTitle>Select a custom date range</AlertTitle>
              <AlertDescription>
                Choose both a start date and an end date to load the report.
              </AlertDescription>
            </Alert>
          )}
          {isError && (
            <Card>
              <CardContent className="flex min-h-56 flex-col items-center justify-center text-center">
                <AlertCircle className="text-destructive mb-3 size-9" />
                <p className="font-semibold">Unable to load this report</p>
                <p className="text-muted-foreground mt-1 max-w-lg text-sm">
                  {(error as { data?: { error?: { message?: string } } })?.data
                    ?.error?.message ||
                    "Check your report permission and try again."}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    void refetch();
                  }}
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}
          {!isLoading && report && (
            <>
              {report.meta.notice && (
                <Alert>
                  <Info className="size-4" />
                  <AlertTitle>Aggregate data</AlertTitle>
                  <AlertDescription>
                    {String(report.meta.notice)}
                  </AlertDescription>
                </Alert>
              )}
              <ReportSummaryCards
                summary={report.summary}
                comparisons={report.meta.comparisons}
                reportType={type}
                period={period}
              />
              <ReportDataTable
                records={report.records}
                columns={definition.columns}
                page={report.pagination.page}
                totalPages={report.pagination.totalPages}
                totalItems={report.pagination.totalItems}
                onPageChange={(nextPage) =>
                  changeUrl({ page: String(nextPage) })
                }
              />
            </>
          )}
        </section>
      </div>
    </PageContainer>
  );
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <PageContainer isloading pageTitle="Reports & Analytics">
          <div />
        </PageContainer>
      }
    >
      <ReportsPageContent />
    </Suspense>
  );
}
