'use client';

import * as React from 'react';
import { IconTrendingUp } from '@tabler/icons-react';
import { Label, Pie, PieChart } from 'recharts';

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
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { useGetOverviewQuery } from '@/services/statsApi';
import { Skeleton } from '@/components/ui/skeleton';

export function PieGraph() {
  const { data, isLoading } = useGetOverviewQuery();

  const chartData = React.useMemo(() => {
    const stats = data?.data?.category_views;
    if (!stats || stats.length === 0) return [];
    return stats.map((s) => ({
      category: s.name.toLowerCase().replace(/\s+/g, '-'),
      label: s.name,
      views: s.views,
      books: s.books,
      fill: 'var(--primary)',
    }));
  }, [data]);

  const chartConfig = React.useMemo(() => {
    const cfg: ChartConfig = {
      views: { label: 'Views' },
    };
    chartData.forEach((c) => {
      cfg[c.category] = {
        label: c.label,
        color: 'var(--primary)',
      };
    });
    return cfg;
  }, [chartData]);

  const totalViews = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.views, 0);
  }, [chartData]);

  const topCategory = chartData[0];

  if (isLoading) {
    return (
      <Card className='@container/card'>
        <CardHeader>
          <Skeleton className='h-5 w-48' />
          <Skeleton className='h-4 w-64 mt-1' />
        </CardHeader>
        <CardContent>
          <Skeleton className='mx-auto h-[250px] w-[250px] rounded-full' />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className='@container/card'>
        <CardHeader>
          <CardTitle>Total Views by Category</CardTitle>
          <CardDescription>No view data available</CardDescription>
        </CardHeader>
        <CardContent className='flex items-center justify-center h-[250px]'>
          <p className='text-muted-foreground text-sm'>No data to display</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>Total Views by Category</CardTitle>
        <CardDescription>
          <span className='hidden @[540px]/card:block'>
            Total book views across top categories
          </span>
          <span className='@[540px]/card:hidden'>Views by category</span>
        </CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='mx-auto aspect-square h-[250px]'
        >
          <PieChart>
            <defs>
              {chartData.map((item, index) => (
                <linearGradient
                  key={item.category}
                  id={`fill${item.category}`}
                  x1='0'
                  y1='0'
                  x2='0'
                  y2='1'
                >
                  <stop
                    offset='0%'
                    stopColor='var(--primary)'
                    stopOpacity={1 - index * 0.15}
                  />
                  <stop
                    offset='100%'
                    stopColor='var(--primary)'
                    stopOpacity={0.8 - index * 0.15}
                  />
                </linearGradient>
              ))}
            </defs>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData.map((item) => ({
                ...item,
                fill: `url(#fill${item.category})`,
              }))}
              dataKey='views'
              nameKey='category'
              innerRadius={60}
              strokeWidth={2}
              stroke='var(--background)'
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor='middle'
                        dominantBaseline='middle'
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className='fill-foreground text-3xl font-bold'
                        >
                          {totalViews.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className='fill-muted-foreground text-sm'
                        >
                          Total Views
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className='flex-col gap-2 text-sm'>
        {topCategory && (
          <div className='flex items-center gap-2 leading-none font-medium'>
            {topCategory.label} leads with{' '}
            {totalViews > 0 ? ((topCategory.views / totalViews) * 100).toFixed(1) : '0'}%
            {' '}({topCategory.books} books, {topCategory.views.toLocaleString()} views){' '}
            <IconTrendingUp className='h-4 w-4' />
          </div>
        )}
        <div className='text-muted-foreground leading-none'>
          Total views across all categories
        </div>
      </CardFooter>
    </Card>
  );
}
