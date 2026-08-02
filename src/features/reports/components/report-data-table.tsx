"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ReportColumn } from "../report-config";
import { BookOpen, ChevronLeft, ChevronRight, FileSearch } from "lucide-react";
import { useState } from "react";

function ReportCover({ record }: { record: Record<string, unknown> }) {
  const [failed, setFailed] = useState(false);
  const bookId = record.bookId ?? record.id;
  const hasCover = Boolean(record.coverUrl);
  const title = String(record.title ?? record.book ?? "Book");

  if (!bookId || !hasCover || failed) {
    return (
      <div className="bg-muted flex h-12 w-9 items-center justify-center rounded ring-1 ring-border">
        <BookOpen className="text-muted-foreground size-4" aria-hidden="true" />
      </div>
    );
  }

  return (
    // The backend stores private R2 keys, so covers must use the same-origin proxy.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/books/${encodeURIComponent(String(bookId))}/cover`}
      alt={`Cover of ${title}`}
      className="h-12 w-9 rounded object-cover ring-1 ring-border"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function formatDate(value: unknown) {
  if (!value) return "—";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Phnom_Penh",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function valueFor(record: Record<string, unknown>, column: ReportColumn) {
  const value = record[column.key];
  if (column.type === "cover") {
    const bookId = record.bookId ?? record.id;
    return (
      <ReportCover key={`${String(bookId)}:${String(value)}`} record={record} />
    );
  }
  if (column.type === "date") return formatDate(value);
  if (column.type === "number" && value !== null && value !== undefined)
    return new Intl.NumberFormat("en-US").format(Number(value));
  if (column.type === "percent" && value !== null && value !== undefined)
    return `${Number(value).toFixed(1)}%`;
  if (column.type === "rating" && value !== null && value !== undefined)
    return (
      <span className="whitespace-nowrap text-amber-600">
        ★ {Number(value).toFixed(1)}
      </span>
    );
  if (column.type === "metadata")
    return value ? (
      <code className="block max-w-64 truncate text-xs">
        {JSON.stringify(value)}
      </code>
    ) : (
      "—"
    );
  if (column.key === "status" || column.key === "readingStatus")
    return (
      <Badge variant="outline">
        {String(value ?? "—").replaceAll("_", " ")}
      </Badge>
    );
  return value === null || value === undefined || value === ""
    ? "—"
    : String(value);
}

export function ReportDataTable({
  records,
  columns,
  page,
  totalPages,
  totalItems,
  onPageChange,
}: {
  records: Array<Record<string, unknown>>;
  columns: ReportColumn[];
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className="whitespace-nowrap">
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record, rowIndex) => (
              <TableRow key={String(record.id ?? rowIndex)}>
                {columns.map((column) => (
                  <TableCell key={column.key} className="max-w-72 align-top">
                    {valueFor(record, column)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {!records.length && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-44 text-center"
                >
                  <FileSearch className="text-muted-foreground mx-auto mb-2 size-8" />
                  <p className="font-medium">No report records found</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Try a different date range or clear the filters.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
        <p className="text-muted-foreground text-xs">
          Page {page} of {totalPages} · {totalItems.toLocaleString()} total
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {(() => {
            const half = 3;
            const start = Math.max(1, Math.min(page - half, totalPages - 5));
            const end = Math.min(totalPages, start + 5);

            return Array.from(
              { length: end - start + 1 },
              (_, index) => start + index,
            ).map((pageNumber) => (
              <Button
                key={pageNumber}
                variant={page === pageNumber ? "default" : "outline"}
                size="icon"
                className="h-8 w-8 text-xs"
                onClick={() => onPageChange(pageNumber)}
              >
                {pageNumber}
              </Button>
            ));
          })()}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
