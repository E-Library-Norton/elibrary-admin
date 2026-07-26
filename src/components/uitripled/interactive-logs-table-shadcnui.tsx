"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  History,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";

export interface InteractiveLog {
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

interface InteractiveLogsTableProps {
  logs: InteractiveLog[];
  total: number;
  page: number;
  totalPages: number;
  search: string;
  action: string;
  resourceType: string;
  days: string;
  actions: readonly string[];
  resourceTypes: readonly string[];
  isLoading?: boolean;
  isFetching?: boolean;
  isError?: boolean;
  onSearchChange: (value: string) => void;
  onActionChange: (value: string) => void;
  onResourceTypeChange: (value: string) => void;
  onDaysChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onReset: () => void;
  onRefresh: () => void;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getActionStyles(action: string) {
  if (action.includes("deleted") || action.includes("failed")) {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300";
  }

  if (action.includes("created") || action === "uploaded") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (action.includes("updated") || action.includes("pending")) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
  }

  if (action.startsWith("login")) {
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300";
  }

  return "border-border bg-muted/50 text-foreground";
}

function getPageNumbers(currentPage: number, totalPages: number) {
  const visiblePages = 5;
  const start = Math.max(
    1,
    Math.min(
      currentPage - Math.floor(visiblePages / 2),
      totalPages - visiblePages + 1,
    ),
  );
  const end = Math.min(totalPages, start + visiblePages - 1);

  return Array.from(
    { length: Math.max(end - start + 1, 0) },
    (_, index) => start + index,
  );
}

function LogRow({
  log,
  expanded,
  onToggle,
}: {
  log: InteractiveLog;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div layout="position">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="hover:bg-muted/50 focus-visible:ring-ring grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none md:grid-cols-[auto_minmax(11rem,1fr)_minmax(8rem,0.8fr)_minmax(12rem,1.3fr)_auto]"
      >
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-muted-foreground"
        >
          <ChevronDown className="size-4" />
        </motion.span>

        <span className="flex min-w-0 items-center gap-3">
          <Avatar className="size-9 shrink-0">
            <AvatarFallback className="text-xs">
              {log.user.initials}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">
              {log.user.name}
            </span>
            <span className="text-muted-foreground block truncate text-xs">
              {log.user.email || formatLabel(log.user.role)}
            </span>
          </span>
        </span>

        <span className="hidden min-w-0 md:block">
          <Badge variant="outline" className={getActionStyles(log.action)}>
            {formatLabel(log.action)}
          </Badge>
        </span>

        <span className="hidden min-w-0 md:block">
          <span className="block truncate text-sm font-medium">
            {log.target || `${formatLabel(log.type)} activity`}
          </span>
          <span className="text-muted-foreground mt-1 block text-xs">
            {formatLabel(log.type)}
          </span>
        </span>

        <time className="text-muted-foreground whitespace-nowrap text-right text-xs">
          {dateFormatter.format(new Date(log.timestamp))}
        </time>

        <span className="col-start-2 col-end-4 flex min-w-0 items-center gap-2 md:hidden">
          <Badge variant="outline" className={getActionStyles(log.action)}>
            {formatLabel(log.action)}
          </Badge>
          <span className="text-muted-foreground truncate text-xs">
            {log.target || formatLabel(log.type)}
          </span>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-muted/35 overflow-hidden border-t"
          >
            <div className="grid gap-4 p-4 pl-11 text-sm md:grid-cols-2">
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
                  Actor
                </p>
                <p className="font-medium">{log.user.name}</p>
                <p className="text-muted-foreground text-xs">
                  {log.user.email || "No email"} · {formatLabel(log.user.role)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
                  Date & time
                </p>
                <p>{dateFormatter.format(new Date(log.timestamp))}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
                  Event
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className={getActionStyles(log.action)}
                  >
                    {formatLabel(log.action)}
                  </Badge>
                  <Badge variant="secondary">{formatLabel(log.type)}</Badge>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
                  Target
                </p>
                <p className="break-words">{log.target || "—"}</p>
              </div>
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <div className="md:col-span-2">
                  <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                    Metadata
                  </p>
                  <pre className="bg-background max-h-56 overflow-auto rounded-lg border p-3 text-xs whitespace-pre-wrap">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FilterPanel({
  action,
  resourceType,
  days,
  actions,
  resourceTypes,
  hasFilters,
  onActionChange,
  onResourceTypeChange,
  onDaysChange,
  onReset,
}: Pick<
  InteractiveLogsTableProps,
  | "action"
  | "resourceType"
  | "days"
  | "actions"
  | "resourceTypes"
  | "onActionChange"
  | "onResourceTypeChange"
  | "onDaysChange"
  | "onReset"
> & {
  hasFilters: boolean;
}) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="text-muted-foreground size-4" />
          <h3 className="text-sm font-semibold">Filters</h3>
        </div>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 text-xs"
          >
            Clear
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Action
        </label>
        <Select value={action} onValueChange={onActionChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {actions.map((value) => (
              <SelectItem key={value} value={value}>
                {value === "all" ? "All actions" : formatLabel(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Resource
        </label>
        <Select value={resourceType} onValueChange={onResourceTypeChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {resourceTypes.map((value) => (
              <SelectItem key={value} value={value}>
                {value === "all" ? "All resources" : formatLabel(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Period
        </label>
        <Select value={days} onValueChange={onDaysChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Today</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-muted/50 mt-auto rounded-lg border p-3">
        <div className="flex items-start gap-2">
          <Check className="text-primary mt-0.5 size-4 shrink-0" />
          <p className="text-muted-foreground text-xs leading-relaxed">
            Filters are applied on the server, so counts and pagination stay
            accurate.
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="divide-y">
      {Array.from({ length: 7 }, (_, index) => (
        <div
          key={index}
          className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4 md:grid-cols-[auto_minmax(11rem,1fr)_minmax(8rem,0.8fr)_minmax(12rem,1.3fr)_auto]"
        >
          <Skeleton className="size-4" />
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-44" />
            </div>
          </div>
          <Skeleton className="hidden h-6 w-24 md:block" />
          <Skeleton className="hidden h-9 w-48 md:block" />
          <Skeleton className="h-4 w-28" />
        </div>
      ))}
    </div>
  );
}

export function InteractiveLogsTable({
  logs,
  total,
  page,
  totalPages,
  search,
  action,
  resourceType,
  days,
  actions,
  resourceTypes,
  isLoading = false,
  isFetching = false,
  isError = false,
  onSearchChange,
  onActionChange,
  onResourceTypeChange,
  onDaysChange,
  onPageChange,
  onReset,
  onRefresh,
}: InteractiveLogsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const activeFilterCount =
    Number(action !== "all") +
    Number(resourceType !== "all") +
    Number(days !== "30");
  const hasFilters = Boolean(search || activeFilterCount);
  const pages = getPageNumbers(page, totalPages);

  const updateAction = (value: string) => {
    onActionChange(value);
    setExpandedId(null);
  };

  const updateResourceType = (value: string) => {
    onResourceTypeChange(value);
    setExpandedId(null);
  };

  const updateDays = (value: string) => {
    onDaysChange(value);
    setExpandedId(null);
  };

  return (
    <section className="bg-card overflow-hidden rounded-xl border shadow-xs">
      <div className="space-y-4 border-b p-4 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Activity History</h2>
            <p className="text-muted-foreground mt-1 text-sm tabular-nums">
              {isLoading
                ? "Loading activity records…"
                : `${total.toLocaleString()} ${total === 1 ? "activity" : "activities"}`}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isFetching}
            aria-label="Refresh audit logs"
            title="Refresh audit logs"
          >
            <RefreshCw className={isFetching ? "animate-spin" : ""} />
          </Button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search user, email, action or target…"
              className="pl-9"
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onSearchChange("")}
                className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters((current) => !current)}
            className="relative"
            aria-expanded={showFilters}
          >
            <Filter />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <Badge className="bg-destructive text-destructive-foreground absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full p-0 text-[10px]">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <div className="flex min-h-[32rem] flex-col lg:flex-row">
        <AnimatePresence initial={false}>
          {showFilters && (
            <motion.aside
              key="filters"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="bg-card shrink-0 border-b lg:w-72 lg:border-r lg:border-b-0"
            >
              <FilterPanel
                action={action}
                resourceType={resourceType}
                days={days}
                actions={actions}
                resourceTypes={resourceTypes}
                hasFilters={hasFilters}
                onActionChange={updateAction}
                onResourceTypeChange={updateResourceType}
                onDaysChange={updateDays}
                onReset={onReset}
              />
            </motion.aside>
          )}
        </AnimatePresence>

        <div className="min-w-0 flex-1">
          {isLoading ? (
            <LoadingRows />
          ) : isError ? (
            <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
              <History className="text-muted-foreground mb-3 size-7" />
              <p className="font-medium">Could not load audit logs</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Refresh the page and try again.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="mt-4"
              >
                <RefreshCw />
                Try again
              </Button>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
              <History className="text-muted-foreground mb-3 size-7" />
              <p className="font-medium">No activity found</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Try changing or clearing the current filters.
              </p>
              {hasFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReset}
                  className="mt-4"
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              <AnimatePresence mode="popLayout">
                {logs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{
                      duration: 0.18,
                      delay: Math.min(index * 0.02, 0.12),
                    }}
                  >
                    <LogRow
                      log={log}
                      expanded={expandedId === log.id}
                      onToggle={() =>
                        setExpandedId((current) =>
                          current === log.id ? null : log.id,
                        )
                      }
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
        <p className="text-muted-foreground text-xs">
          Page {page} of {totalPages} · {total.toLocaleString()} total
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1 || isFetching}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>
          {pages.map((pageNumber) => (
            <Button
              key={pageNumber}
              variant={page === pageNumber ? "default" : "outline"}
              size="icon"
              className="size-8 text-xs"
              onClick={() => onPageChange(pageNumber)}
              disabled={isFetching}
              aria-label={`Go to page ${pageNumber}`}
              aria-current={page === pageNumber ? "page" : undefined}
            >
              {pageNumber}
            </Button>
          ))}
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || isFetching}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
