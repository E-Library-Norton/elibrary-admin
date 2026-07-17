'use client';

import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter
} from '@/components/ui/card';
import { IconTrendingUp, IconUsers, IconBook, IconCategory, IconActivity, IconDownload } from '@tabler/icons-react';
import React from 'react';
import { useGetOverviewQuery } from '@/services/statsApi';
import { useAuth } from '@/hooks/useAuth';

export default function OverViewLayout({
  sales,
  pie_stats,
  bar_stats,
  area_stats
}: {
  sales: React.ReactNode;
  pie_stats: React.ReactNode;
  bar_stats: React.ReactNode;
  area_stats: React.ReactNode;
}) {
  // Single request — RTK Query deduplicates with the chart components that also call useGetOverviewQuery()
  const { data: statsData, isLoading } = useGetOverviewQuery();
  const { user } = useAuth();

  const totalUsers           = statsData?.data?.total_members       || 0;
  const activeUsers          = statsData?.data?.total_active_members || 0;
  const totalBooks           = statsData?.data?.total_books         || 0;
  const totalCategories      = statsData?.data?.total_categories    || 0;
  const totalDownloads        = statsData?.data?.total_downloads     || 0;
  const activeUsersPercentage = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-2'>
        <div className='flex items-center justify-between space-y-2'>
          <h2 className='text-2xl font-bold tracking-tight'>
            Hi, Welcome back {user?.firstName ? user.firstName : ''} 👋
          </h2>
        </div>

        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-5'>
          
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Total Users</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {isLoading ? '...' : totalUsers.toLocaleString()}
              </CardTitle>
              <CardAction>
                <div className="p-2 bg-primary/10 rounded-full">
                  <IconUsers className="w-4 h-4 text-primary" />
                </div>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='text-muted-foreground'>
                Total registered user accounts
              </div>
            </CardFooter>
          </Card>

          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Active Users</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {isLoading ? '...' : activeUsers.toLocaleString()}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconTrendingUp />
                  {activeUsersPercentage}%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                Actively using the platform <IconActivity className='size-4' />
              </div>
              <div className='text-muted-foreground'>
                Accounts marked active
              </div>
            </CardFooter>
          </Card>

          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Total Books</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {isLoading ? '...' : totalBooks.toLocaleString()}
              </CardTitle>
              <CardAction>
                <div className="p-2 bg-primary/10 rounded-full">
                  <IconBook className="w-4 h-4 text-primary" />
                </div>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='text-muted-foreground'>
                Materials available in the library
              </div>
            </CardFooter>
          </Card>

          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Categories</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                 {isLoading ? '...' : totalCategories.toLocaleString()}
              </CardTitle>
              <CardAction>
                 <div className="p-2 bg-primary/10 rounded-full">
                  <IconCategory className="w-4 h-4 text-primary" />
                </div>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='text-muted-foreground'>
                Different material classifications
              </div>
            </CardFooter>
          </Card>

          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Total Downloads</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {isLoading ? '...' : totalDownloads.toLocaleString()}
              </CardTitle>
              <CardAction>
                <div className="p-2 bg-primary/10 rounded-full">
                  <IconDownload className="w-4 h-4 text-primary" />
                </div>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='text-muted-foreground'>
                Total file downloads by users
              </div>
            </CardFooter>
          </Card>

        </div>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
          <div className='col-span-4'>{bar_stats}</div>
          <div className='col-span-4 md:col-span-3'>
            {sales}
          </div>
          <div className='col-span-4'>{area_stats}</div>
          <div className='col-span-4 md:col-span-3'>{pie_stats}</div>
        </div>
      </div>
    </PageContainer>
  );
}
