import { Suspense } from 'react';
import ProfileViewPage from '@/features/profile/components/profile-view-page';
import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';

export const metadata = {
  title: 'Dashboard : Profile'
};

export default async function Page() {
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <ProfileViewPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
