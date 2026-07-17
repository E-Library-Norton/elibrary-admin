'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
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
import { Loader2 } from 'lucide-react';

export const description = 'Interactive bar chart showing books by category';

const chartConfig = {
  books: {
    label: 'Total Books',
    color: 'var(--primary)'
  }
} satisfies ChartConfig;

export function BarGraph() {
  const { data, isLoading } = useGetOverviewQuery();
  
  const categoryCounts = React.useMemo(() => {
    const stats = data?.data?.category_stats || [];
    return stats.map(s => ({
      category: s.name,
      books: s.value
    }));
  }, [data]);

  if (isLoading) {
    return (
       <Card className='@container/card !pt-3 min-h-[400px] flex items-center justify-center'>
         <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
       </Card>
     );
  }

  const totalBooksDisplayed = categoryCounts.reduce((acc, curr) => acc + curr.books, 0);

  return (
    <Card className='@container/card !pt-3 h-full'>
      <CardHeader className='flex flex-col items-stretch space-y-0 border-b !p-0 sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-6 !py-4'>
          <CardTitle>Books by Category</CardTitle>
          <CardDescription>
            Showing book distribution across all categories
          </CardDescription>
        </div>
        <div className='flex'>
            <div className='relative flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left transition-colors duration-200 sm:border-t-0 sm:border-l sm:px-8 sm:py-6'>
              <span className='text-muted-foreground text-xs'>
                Total Books
              </span>
              <span className='text-lg leading-none font-bold sm:text-3xl'>
                {totalBooksDisplayed.toLocaleString()}
              </span>
            </div>
        </div>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        {categoryCounts.length > 0 ? (
          <div className="w-full overflow-x-auto overflow-y-hidden pb-2" style={{ scrollbarWidth: 'thin' }}>
            <div style={{ width: categoryCounts.length > 6 ? `${categoryCounts.length * 80}px` : '100%' }}>
              <ChartContainer
                config={chartConfig}
                className='aspect-auto h-[250px] w-full'
              >
                <BarChart
                  data={categoryCounts}
                  margin={{ left: 0, right: 12, top: 8, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id='fillBar2' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='0%' stopColor='var(--primary)' stopOpacity={0.8} />
                      <stop offset='100%' stopColor='var(--primary)' stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} horizontal={true} />
                  <XAxis
                    dataKey='category'
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    interval={0}
                    padding={{ left: 15, right: 15 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    allowDecimals={false}
                    tickCount={6}
                  />
                  <ChartTooltip
                    cursor={{ fill: 'var(--primary)', opacity: 0.1 }}
                    content={<ChartTooltipContent className='w-[150px]' />}
                  />
                  <Bar
                    dataKey="books"
                    fill='url(#fillBar2)'
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        ) : (
          <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">
             No books to display
          </div>
        )}
      </CardContent>
    </Card>
  );
}
