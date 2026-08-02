"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReportChartItem } from "@/services/reportApi";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = [
  "#2563a6",
  "#df900a",
  "#16a34a",
  "#9333ea",
  "#dc2626",
  "#0891b2",
  "#4f46e5",
  "#ca8a04",
];

const tooltipStyle = {
  background: "hsl(var(--background))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  color: "hsl(var(--foreground))",
};

export function ReportChartSection({
  trend = [],
  distribution = [],
}: {
  trend?: ReportChartItem[];
  distribution?: ReportChartItem[];
}) {
  if (!trend.length && !distribution.length) return null;
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {trend.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Activity Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ left: -20, right: 10 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  minTickGap={28}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2563a6"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      {distribution.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribution</CardTitle>
          </CardHeader>
          <CardContent className="grid h-72 grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution.slice(0, 8)}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={42}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {distribution.slice(0, 8).map((item, index) => (
                    <Cell
                      key={`${item.label}-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={distribution.slice(0, 8)}
                layout="vertical"
                margin={{ left: 8, right: 12 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={84}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#2563a6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
