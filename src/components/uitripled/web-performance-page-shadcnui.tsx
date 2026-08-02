"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, type Variants } from "framer-motion";
import {
  Activity,
  AlertCircle,
  Boxes,
  CheckCircle2,
  Clock3,
  Database,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";

interface AuditOverviewLog {
  id: string;
  user: {
    name: string;
    email: string | null;
  };
  action: string;
  target: string | null;
  type: string;
  timestamp: string;
}

interface AuditDashboardProps {
  logs: AuditOverviewLog[];
  total: number;
  page: number;
  totalPages: number;
  days: string;
  isLoading?: boolean;
  isFetching?: boolean;
  isError?: boolean;
  onRefresh: () => void;
  children: ReactNode;
}

interface MetricCardProps {
  label: string;
  value: string;
  description: string;
  icon: ReactNode;
}

interface CountItem {
  name: string;
  count: number;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35 },
  },
};

const numberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getCountItems(values: string[]): CountItem[] {
  const counts = values.reduce<Map<string, number>>((result, value) => {
    result.set(value, (result.get(value) ?? 0) + 1);
    return result;
  }, new Map());

  return Array.from(counts, ([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? timestamp : dateFormatter.format(date);
}

function MetricCard({ label, value, description, icon }: MetricCardProps) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -3 }}
      className="group relative overflow-hidden rounded-2xl border border-border/50 bg-background/70 p-5 shadow-sm backdrop-blur transition-colors hover:border-border"
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/[0.06] via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="mb-5 flex items-start justify-between">
        <div className="rounded-xl border border-border/40 bg-background/70 p-2.5 text-foreground/70">
          {icon}
        </div>
        <CheckCircle2 className="size-4 text-emerald-500" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
    </motion.div>
  );
}

function BreakdownCard({
  title,
  description,
  items,
  total,
  icon,
}: {
  title: string;
  description: string;
  items: CountItem[];
  total: number;
  icon: ReactNode;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="overflow-hidden rounded-2xl border border-border/50 bg-background/70 p-5 shadow-sm backdrop-blur"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-primary">{icon}</span>
            <h3 className="font-semibold text-foreground">{title}</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <Badge variant="secondary" className="shrink-0 rounded-full">
          {total} visible
        </Badge>
      </div>

      {items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item) => {
            const percentage = total > 0 ? (item.count / total) * 100 : 0;

            return (
              <div key={item.name} className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium text-foreground/80">
                    {formatLabel(item.name)}
                  </span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {item.count}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full rounded-full bg-primary/70"
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-36 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 text-center text-sm text-muted-foreground">
          No activity matches the current filters.
        </div>
      )}
    </motion.div>
  );
}

export function AuditDashboard({
  logs,
  total,
  page,
  totalPages,
  days,
  isLoading = false,
  isFetching = false,
  isError = false,
  onRefresh,
  children,
}: AuditDashboardProps) {
  const actorCount = new Set(logs.map((log) => log.user.email ?? log.user.name))
    .size;
  const resourceCount = new Set(logs.map((log) => log.type)).size;
  const actionItems = getCountItems(logs.map((log) => log.action));
  const resourceItems = getCountItems(logs.map((log) => log.type));
  const latestLog = logs.reduce<AuditOverviewLog | null>((latest, log) => {
    if (!latest) return log;
    return new Date(log.timestamp) > new Date(latest.timestamp) ? log : latest;
  }, null);
  const periodLabel =
    days === "all" ? "All recorded time" : `Last ${days} days`;
  const loadingInitialData = isLoading && logs.length === 0;

  const status = isError
    ? {
        label: "Data unavailable",
        className:
          "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300",
        icon: <AlertCircle className="size-3.5" />,
      }
    : isFetching
      ? {
          label: "Refreshing",
          className:
            "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
          icon: <RefreshCw className="size-3.5 animate-spin" />,
        }
      : {
          label: "Live activity",
          className:
            "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
          icon: <span className="size-2 rounded-full bg-emerald-500" />,
        };

  return (
    <section className="relative isolate overflow-hidden rounded-3xl border border-border/40 bg-muted/15 p-4 sm:p-6">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/3 top-0 h-80 w-80 -translate-y-1/2 rounded-full bg-primary/[0.07] blur-[110px]" />
        <div className="absolute bottom-0 right-0 h-72 w-72 translate-x-1/3 rounded-full bg-foreground/[0.04] blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end"
      >
        <div className="space-y-3">
          <Badge
            variant="outline"
            className={`inline-flex rounded-full px-3 py-1 ${status.className}`}
          >
            {status.icon}
            {status.label}
          </Badge>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              System activity overview
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Monitor account, content, and administrative events from one
              auditable timeline. Summary breakdowns reflect the visible page.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="rounded-full bg-background/70 backdrop-blur"
          disabled={isFetching}
          onClick={onRefresh}
        >
          <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh activity
        </Button>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-5"
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Matching events"
            value={loadingInitialData ? "—" : numberFormatter.format(total)}
            description={`${periodLabel} with the active search and filters.`}
            icon={<Database className="size-5" />}
          />
          <MetricCard
            label="Visible records"
            value={
              loadingInitialData ? "—" : numberFormatter.format(logs.length)
            }
            description={`Page ${page} of ${Math.max(totalPages, 1)} in the current result set.`}
            icon={<Activity className="size-5" />}
          />
          <MetricCard
            label="Active actors"
            value={
              loadingInitialData ? "—" : numberFormatter.format(actorCount)
            }
            description="Unique users represented on the visible page."
            icon={<UserRound className="size-5" />}
          />
          <MetricCard
            label="Resource types"
            value={
              loadingInitialData ? "—" : numberFormatter.format(resourceCount)
            }
            description="Distinct resource types represented on the visible page."
            icon={<Boxes className="size-5" />}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl border border-border/50 bg-background/70 p-5 shadow-sm backdrop-blur"
          >
            <div className="mb-5 flex items-center gap-2">
              <Clock3 className="size-5 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">
                  Latest visible event
                </h3>
                <p className="text-xs text-muted-foreground">
                  Most recent record on this page
                </p>
              </div>
            </div>

            {latestLog ? (
              <div className="space-y-5">
                <div className="flex size-16 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
                  <ShieldCheck className="size-7" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    {formatLabel(latestLog.action)}
                  </p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {latestLog.target ?? formatLabel(latestLog.type)}
                  </p>
                </div>
                <div className="border-t border-border/50 pt-4 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground/75">
                    {latestLog.user.name}
                  </p>
                  <time dateTime={latestLog.timestamp}>
                    {formatTimestamp(latestLog.timestamp)}
                  </time>
                </div>
              </div>
            ) : (
              <div className="flex min-h-52 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 text-center text-sm text-muted-foreground">
                No recent event is available for the current filters.
              </div>
            )}
          </motion.div>

          <BreakdownCard
            title="Action mix"
            description="Top actions on the visible page"
            items={actionItems}
            total={logs.length}
            icon={<Activity className="size-5" />}
          />
          <BreakdownCard
            title="Resource mix"
            description="Top resource types on the visible page"
            items={resourceItems}
            total={logs.length}
            icon={<Boxes className="size-5" />}
          />
        </div>

        <motion.div variants={itemVariants}>{children}</motion.div>
      </motion.div>
    </section>
  );
}
