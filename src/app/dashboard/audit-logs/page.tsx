"use client";

import PageContainer from "@/components/layout/page-container";
import { InteractiveLogsTable } from "@/components/uitripled/interactive-logs-table-shadcnui";
import { AuditDashboard } from "@/components/uitripled/web-performance-page-shadcnui";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/use-role";
import { useGetActivitiesQuery } from "@/services/activityApi";
import { IconHistory } from "@tabler/icons-react";
import { useEffect, useState } from "react";

const PAGE_SIZE = 10;

const ACTIONS = [
  "all",
  "created",
  "updated",
  "deleted",
  "restored",
  "uploaded",
  "view",
  "login",
  "login_2fa_pending",
  "feedback_submitted",
  "feedback_updated",
  "feedback_deleted",
] as const;

const RESOURCE_TYPES = [
  "all",
  "book",
  "user",
  "category",
  "department",
  "material_type",
  "author",
  "editor",
  "publisher",
  "review",
  "feedback",
  "role",
  "permission",
] as const;

export default function AuditLogsPage() {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const [resourceType, setResourceType] = useState("all");
  const [days, setDays] = useState("30");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isFetching, isError, refetch } =
    useGetActivitiesQuery(
      {
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        action,
        type: resourceType,
        days,
      },
      { skip: !isAdmin, refetchOnMountOrArgChange: 30 },
    );

  const activities = data?.data.activities ?? [];
  const pagination = data?.data.pagination;
  const total = pagination?.total ?? 0;
  const totalPages = Math.max(pagination?.totalPages ?? 1, 1);

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setAction("all");
    setResourceType("all");
    setDays("30");
    setPage(1);
  };

  if (!user) {
    return (
      <PageContainer
        isloading
        pageTitle="Audit Logs"
        pageDescription="Review administrative and user activity."
      >
        <div />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      scrollable
      access={isAdmin}
      pageTitle="Audit Logs"
      pageDescription="Review administrative and user activity across the library."
      accessFallback={
        <div className="text-center">
          <IconHistory className="text-muted-foreground mx-auto mb-3 size-8" />
          <p className="font-medium">Administrator access required</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Only administrators can view audit logs.
          </p>
        </div>
      }
    >
      <AuditDashboard
        logs={activities}
        total={total}
        page={page}
        totalPages={totalPages}
        days={days}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        onRefresh={() => {
          void refetch();
        }}
      >
        <InteractiveLogsTable
          logs={activities}
          total={total}
          page={page}
          totalPages={totalPages}
          search={searchInput}
          action={action}
          resourceType={resourceType}
          days={days}
          actions={ACTIONS}
          resourceTypes={RESOURCE_TYPES}
          isLoading={isLoading}
          isFetching={isFetching}
          isError={isError}
          onSearchChange={setSearchInput}
          onActionChange={(value) => {
            setAction(value);
            setPage(1);
          }}
          onResourceTypeChange={(value) => {
            setResourceType(value);
            setPage(1);
          }}
          onDaysChange={(value) => {
            setDays(value);
            setPage(1);
          }}
          onPageChange={setPage}
          onReset={resetFilters}
          onRefresh={() => {
            void refetch();
          }}
        />
      </AuditDashboard>
    </PageContainer>
  );
}
