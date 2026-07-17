'use client';

import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaGraph } from './area-graph';
import { BarGraph } from './bar-graph';
import { PieGraph } from './pie-graph';
import { RecentSales } from './recent-sales';
import { useGetOverviewQuery } from '@/services/statsApi';
import { Skeleton } from '@/components/ui/skeleton';
import { IconUsers, IconBook, IconCategory, IconDownload } from '@tabler/icons-react';

export default function OverViewPage() {
  const { data, isLoading } = useGetOverviewQuery();
  const stats = data?.data;

  const renderCard = (title: string, value: string | number | undefined, description: string, icon: React.ReactNode) => (
    <Card className='@container/card'>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription className="text-sm font-medium">{title}</CardDescription>
        {icon}
      </CardHeader>
      <CardHeader className="pt-0">
        <CardTitle className='text-2xl font-bold tabular-nums'>
          {isLoading ? <Skeleton className="h-8 w-20" /> : value?.toLocaleString() ?? '0'}
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          {description}
        </p>
      </CardHeader>
    </Card>
  );

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-2'>
        <div className='flex items-center justify-between space-y-2'>
          <h2 className='text-2xl font-bold tracking-tight'>
            Hi, Welcome back 👋
          </h2>
          <div className='hidden items-center space-x-2 md:flex'>
            <Button>Export Data</Button>
          </div>
        </div>
        <Tabs defaultValue='overview' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='analytics' disabled>
              Analytics
            </TabsTrigger>
          </TabsList>
          <TabsContent value='overview' className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 px-4 lg:px-6 md:grid-cols-2 lg:grid-cols-4'>
              {renderCard(
                "Total Users", 
                stats?.total_members, 
                "Total registered user accounts",
                <IconUsers className="h-4 w-4 text-muted-foreground" />
              )}
              {renderCard(
                "Active Users", 
                stats?.total_active_members, 
                "Actively using the platform",
                <IconUsers className="h-4 w-4 text-primary" />
              )}
              {renderCard(
                "Total Books", 
                stats?.total_books, 
                "Materials available in library",
                <IconBook className="h-4 w-4 text-muted-foreground" />
              )}
              {renderCard(
                "Categories", 
                stats?.total_categories, 
                "Different material types",
                <IconCategory className="h-4 w-4 text-muted-foreground" />
              )}
              {renderCard(
                "Total Downloads", 
                stats?.total_downloads, 
                "Total files downloaded",
                <IconDownload className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
              <div className='col-span-4'>
                <BarGraph />
              </div>
              <Card className='col-span-4 md:col-span-3'>
                <RecentSales />
              </Card>
              <div className='col-span-4'>
                <AreaGraph />
              </div>
              <div className='col-span-4 md:col-span-3'>
                <PieGraph />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
