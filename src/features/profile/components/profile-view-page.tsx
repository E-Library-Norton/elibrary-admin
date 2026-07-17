'use client';

// src/features/profile/components/profile-view-page.tsx
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/authSlice';
import PageContainer from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import ProfileHeader      from './ProfileHeader';
import AccountInfoCard    from './AccountInfoCard';
import ChangePasswordCard from './ChangePasswordCard';

function ProfileSkeleton() {
  return (
    <div className='max-w-4xl mx-auto space-y-5 w-full'>
      <Card>
        <CardContent className='pt-6'>
          <div className='flex items-center gap-5 pb-2'>
            <Skeleton className='h-24 w-24 rounded-full shrink-0' />
            <div className='space-y-2'>
              <Skeleton className='h-6 w-48' />
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-5 w-20' />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
        <Card><CardContent className='pt-6 space-y-3'>{[1,2,3].map(i=><Skeleton key={i} className='h-12 w-full'/>)}</CardContent></Card>
        <Card><CardContent className='pt-6 space-y-3'>{[1,2,3].map(i=><Skeleton key={i} className='h-12 w-full'/>)}</CardContent></Card>
      </div>
    </div>
  );
}

export default function ProfileViewPage() {
  const user = useSelector(selectUser);

  if (!user) return <ProfileSkeleton />;

  return (
    <div className='max-w-4xl mx-auto space-y-5 w-full'>
      <ProfileHeader />
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
        <AccountInfoCard />
        <ChangePasswordCard />
      </div>
    </div>
  );
}
