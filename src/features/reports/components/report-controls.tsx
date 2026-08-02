"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ReportDefinition } from "../report-config";
import { PERIOD_OPTIONS, statusOptions } from "../report-config";
import type { ReportPeriod, ReportType } from "@/services/reportApi";
import {
  ChevronDown,
  FileDown,
  FileSpreadsheet,
  Filter,
  Printer,
  RefreshCcw,
  RotateCcw,
  Search,
  X,
} from "lucide-react";

export interface AppliedReportFilter {
  key: string;
  label: string;
}

interface ReportControlsProps {
  reports: ReportDefinition[];
  definition: ReportDefinition;
  period: ReportPeriod;
  startDate: string;
  endDate: string;
  search: string;
  status: string;
  sortBy: string;
  sortOrder: "ASC" | "DESC";
  rating: string;
  feedbackType: string;
  action: string;
  targetType: string;
  language: string;
  appliedFilters: AppliedReportFilter[];
  isFetching: boolean;
  isExporting: boolean;
  canExportPdf: boolean;
  canExportExcel: boolean;
  onReportChange: (type: ReportType) => void;
  onChange: (key: string, value: string, replace?: boolean) => void;
  onRemoveFilter: (key: string) => void;
  onReset: () => void;
  onRefresh: () => void;
  onExport: (format: "pdf" | "excel") => void;
  onPrint: () => void;
}

export function ReportControls(props: ReportControlsProps) {
  const statuses = statusOptions(props.definition.type);
  return (
    <div className="space-y-3 print:hidden">
      <Card>
        <CardContent className="grid gap-3 p-4 lg:grid-cols-[minmax(220px,1fr)_minmax(200px,1fr)_auto]">
          <Select
            value={props.definition.type}
            onValueChange={(value) => props.onReportChange(value as ReportType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              {props.reports.map((report) => (
                <SelectItem key={report.type} value={report.type}>
                  {report.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={props.period}
            onValueChange={(value) => props.onChange("period", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={props.onRefresh}
              disabled={props.isFetching}
            >
              <RefreshCcw
                className={`size-4 ${props.isFetching ? "animate-spin" : ""}`}
              />{" "}
              Refresh
            </Button>
            <Button variant="outline" onClick={props.onReset}>
              <RotateCcw className="size-4" /> Reset
            </Button>
          </div>
          {props.period === "custom" && (
            <div className="grid gap-2 sm:grid-cols-2 lg:col-span-2">
              <Input
                type="date"
                aria-label="Start date"
                value={props.startDate}
                onChange={(event) =>
                  props.onChange("startDate", event.target.value, true)
                }
              />
              <Input
                type="date"
                aria-label="End date"
                value={props.endDate}
                onChange={(event) =>
                  props.onChange("endDate", event.target.value, true)
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Collapsible defaultOpen>
        <Card>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="flex w-full justify-between rounded-b-none px-4 py-5"
            >
              <span className="flex items-center gap-2">
                <Filter className="size-4" /> Report Filters
              </span>
              <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="grid gap-3 border-t pt-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="relative md:col-span-2">
                <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                <Input
                  value={props.search}
                  onChange={(event) =>
                    props.onChange("search", event.target.value, true)
                  }
                  placeholder="Search this report…"
                  className="pl-9"
                />
              </div>
              {statuses.length > 0 && (
                <Select
                  value={props.status}
                  onValueChange={(value) => props.onChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {props.definition.type === "reviews" && (
                <Select
                  value={props.rating}
                  onValueChange={(value) => props.onChange("rating", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All ratings</SelectItem>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <SelectItem key={rating} value={String(rating)}>
                        {rating} stars
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {props.definition.type === "feedback" && (
                <Select
                  value={props.feedbackType}
                  onValueChange={(value) =>
                    props.onChange("feedbackType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Feedback type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {["general", "bug", "feature", "content", "account"].map(
                      (type) => (
                        <SelectItem key={type} value={type}>
                          {type.replaceAll("_", " ")}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              )}
              {props.definition.type === "activities" && (
                <>
                  <Select
                    value={props.action}
                    onValueChange={(value) => props.onChange("action", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All actions</SelectItem>
                      {[
                        "created",
                        "updated",
                        "deleted",
                        "restored",
                        "login",
                        "REPORT_EXPORTED",
                      ].map((action) => (
                        <SelectItem key={action} value={action}>
                          {action.replaceAll("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={props.targetType}
                    onValueChange={(value) =>
                      props.onChange("targetType", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Target type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All targets</SelectItem>
                      {[
                        "book",
                        "user",
                        "review",
                        "feedback",
                        "role",
                        "permission",
                        "report",
                      ].map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
              {props.definition.type === "books" && (
                <Select
                  value={props.language}
                  onValueChange={(value) => props.onChange("language", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All languages</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="km">Khmer</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Select
                value={props.sortBy || props.definition.sortOptions[0]?.value}
                onValueChange={(value) => props.onChange("sortBy", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {props.definition.sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={props.sortOrder}
                onValueChange={(value) => props.onChange("sortOrder", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DESC">Descending</SelectItem>
                  <SelectItem value="ASC">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-h-7 flex-wrap gap-2">
          {props.appliedFilters.map((filter) => (
            <Badge
              key={filter.key}
              variant="secondary"
              className="gap-1.5 py-1"
            >
              {filter.label}
              <button
                type="button"
                aria-label={`Remove ${filter.label}`}
                onClick={() => props.onRemoveFilter(filter.key)}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => props.onExport("pdf")}
            disabled={!props.canExportPdf || props.isExporting}
          >
            <FileDown className="size-4" /> Export PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => props.onExport("excel")}
            disabled={!props.canExportExcel || props.isExporting}
          >
            <FileSpreadsheet className="size-4" /> Export Excel
          </Button>
          <Button variant="outline" onClick={props.onPrint}>
            <Printer className="size-4" /> Print
          </Button>
        </div>
      </div>
    </div>
  );
}
