'use client';

import { useMemo, useState } from 'react';
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { useGetOverviewQuery } from '@/services/statsApi';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];


const chartConfig = {
  views: {
    label: 'Views',
    color: 'var(--chart-1)'
  },
  downloads: {
    label: 'Downloads',
    color: 'var(--chart-2)'
  },
  joins: {
    // "joins" = users who registered in that day / month / year
    label: 'New Users',
    color: 'var(--chart-3)'
  }
} satisfies ChartConfig;

type TimeRange = 'daily' | 'monthly' | 'yearly';

export function AreaGraph() {
  const { data, isLoading } = useGetOverviewQuery();
  const [timeRange, setTimeRange] = useState<TimeRange>('monthly');

  const chartData = useMemo(() => {
    const stats = data?.data;
    if (!stats) return [];

    if (timeRange === 'daily') {
      return (stats as any).daily_trends?.map((d: any) => ({
        label: d.date.split('-').slice(1).join('/'), // MM/DD
        views: d.views,
        downloads: d.downloads,
        joins: d.joins,
        fullLabel: d.date
      })) || [];
    }

    if (timeRange === 'yearly') {
      return (stats as any).yearly_trends?.map((y: any) => ({
        label: y.year.toString(),
        views: 0,
        downloads: y.downloads,
        joins: y.joins,
        fullLabel: y.year
      })) || [];
    }

    // Default: Monthly
    return stats.monthly_reading_stats?.map((s) => {
      const parts = s.month.split('-');
      const m = parts.length > 1 ? parts[1] : parts[0];
      const label = MONTH_NAMES[parseInt(m, 10) - 1] || s.month;
      return {
        label: label,
        views: s.views,
        downloads: s.downloads,
        joins: s.joins,
        fullLabel: s.month
      };
    }) || [];
  }, [data, timeRange]);

  const trend = useMemo(() => {
    if (chartData.length < 2) return { pct: '0', up: true };
    const metric = timeRange === 'yearly' ? 'joins' : 'views';
    const prev = (chartData[chartData.length - 2] as any)[metric] || 1;
    const curr = (chartData[chartData.length - 1] as any)[metric] || 0;
    const pct = ((curr - prev) / prev) * 100;
    return { pct: Math.abs(pct).toFixed(1), up: pct >= 0 };
  }, [chartData, timeRange]);

  const dateRange = useMemo(() => {
    if (chartData.length === 0) return '';
    return `${chartData[0].fullLabel} – ${chartData[chartData.length - 1].fullLabel}`;
  }, [chartData]);

  if (isLoading) {
    return (
      <Card className='@container/card'>
        <CardHeader>
          <Skeleton className='h-5 w-48' />
          <Skeleton className='h-4 w-64 mt-1' />
        </CardHeader>
        <CardContent>
          <Skeleton className='h-[250px] w-full' />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='@container/card'>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="grid gap-1">
          <CardTitle>Platform Activity</CardTitle>
          <CardDescription>
            {timeRange === 'daily' ? 'Daily' : timeRange === 'yearly' ? 'Yearly' : 'Monthly'} views, downloads & user growth
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[250px] w-full'
        >
          <AreaChart
            data={chartData}
            margin={{ left: 12, right: 12 }}
          >
            <defs>
              <linearGradient id='fillViews' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='var(--color-views)' stopOpacity={0.8} />
                <stop offset='95%' stopColor='var(--color-views)' stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id='fillDownloads' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='var(--color-downloads)' stopOpacity={0.8} />
                <stop offset='95%' stopColor='var(--color-downloads)' stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id='fillJoins' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='var(--color-joins)' stopOpacity={0.8} />
                <stop offset='95%' stopColor='var(--color-joins)' stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='label'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={40}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator='dot' />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              dataKey='joins'
              type='monotone'
              fill='url(#fillJoins)'
              stroke='var(--color-joins)'
              strokeWidth={2}
            />
            <Area
              dataKey='downloads'
              type='monotone'
              fill='url(#fillDownloads)'
              stroke='var(--color-downloads)'
              strokeWidth={2}
            />
            <Area
              dataKey='views'
              type='monotone'
              fill='url(#fillViews)'
              stroke='var(--color-views)'
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className='flex w-full items-start gap-2 text-sm'>
          <div className='grid gap-2'>
            <div className='flex items-center gap-2 leading-none font-medium'>
              {trend.up ? 'Trending up' : 'Trending down'} by {trend.pct}%{' '}
              {trend.up ? <IconTrendingUp className='h-4 w-4' /> : <IconTrendingDown className='h-4 w-4' />}
            </div>
            <div className='text-muted-foreground flex items-center gap-2 leading-none'>
              {dateRange}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
