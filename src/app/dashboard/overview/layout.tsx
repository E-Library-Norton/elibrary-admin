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
import { Skeleton } from '@/components/ui/skeleton';
import {
  IconActivity,
  IconBook,
  IconCategory,
  IconDownload,
  IconTrendingUp,
  IconUsers
} from '@tabler/icons-react';
import Link from 'next/link';
import React from 'react';
import { useGetOverviewQuery } from '@/services/statsApi';
import { useAuth } from '@/hooks/useAuth';

type MetricCardProps = {
  title: string;
  value: number;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isLoading: boolean;
  badge?: string;
  detail?: React.ReactNode;
};

function MetricCard({
  title,
  value,
  description,
  href,
  icon: Icon,
  isLoading,
  badge,
  detail
}: MetricCardProps) {
  return (
    <Link
      href={href}
      aria-label={`View ${title.toLowerCase()}`}
      className='group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
    >
      <Card className='@container/card h-full transition-colors group-hover:border-primary/50 group-hover:bg-muted/30'>
        <CardHeader>
          <CardDescription>{title}</CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            {isLoading ? (
              <Skeleton className='h-9 w-20' />
            ) : (
              value.toLocaleString()
            )}
          </CardTitle>
          <CardAction>
            {badge ? (
              <Badge variant='outline'>
                <IconTrendingUp />
                {badge}
              </Badge>
            ) : (
              <div className='rounded-full bg-primary/10 p-2'>
                <Icon className='h-4 w-4 text-primary' />
              </div>
            )}
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          {detail}
          <div className='text-muted-foreground'>{description}</div>
        </CardFooter>
      </Card>
    </Link>
  );
}

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
  const { data: statsData, isLoading } = useGetOverviewQuery(undefined, {
    refetchOnMountOrArgChange: 60
  });
  const { user } = useAuth();

  const totalUsers = statsData?.data?.total_members ?? 0;
  const activeUsers = statsData?.data?.total_active_members ?? 0;
  const totalBooks = statsData?.data?.total_books ?? 0;
  const totalCategories = statsData?.data?.total_categories ?? 0;
  const totalDownloads = statsData?.data?.total_downloads ?? 0;
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
          <MetricCard
            title='Total Users'
            value={totalUsers}
            description='Total registered user accounts'
            href='/dashboard/users'
            icon={IconUsers}
            isLoading={isLoading}
          />
          <MetricCard
            title='Active Users'
            value={activeUsers}
            description='Accounts marked active'
            href='/dashboard/users'
            icon={IconUsers}
            isLoading={isLoading}
            badge={`${activeUsersPercentage}%`}
            detail={
              <div className='line-clamp-1 flex gap-2 font-medium'>
                Actively using the platform <IconActivity className='size-4' />
              </div>
            }
          />
          <MetricCard
            title='Total Books'
            value={totalBooks}
            description='Materials available in the library'
            href='/dashboard/books'
            icon={IconBook}
            isLoading={isLoading}
          />
          <MetricCard
            title='Categories'
            value={totalCategories}
            description='Different material classifications'
            href='/dashboard/books/categories'
            icon={IconCategory}
            isLoading={isLoading}
          />
          <MetricCard
            title='Total Downloads'
            value={totalDownloads}
            description='View complete download history'
            href='/dashboard/downloads'
            icon={IconDownload}
            isLoading={isLoading}
          />
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
