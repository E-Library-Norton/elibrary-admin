import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";

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
}: {
  summary: Record<string, number | string>;
  comparisons?: Record<string, number>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Object.entries(summary)
        .slice(0, 8)
        .map(([key, value]) => {
          const comparison = comparisons[key];
          return (
            <Card key={key} className="overflow-hidden">
              <CardContent className="p-4">
                <p className="text-muted-foreground text-sm">{humanize(key)}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {formatValue(value)}
                </p>
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
          );
        })}
    </div>
  );
}
