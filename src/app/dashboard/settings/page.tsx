import PageContainer from '@/components/layout/page-container';
import { Suspense } from 'react';
import SettingsPage from '@/features/settings/components/settings-page';
import FormCardSkeleton from '@/components/form-card-skeleton';

export const metadata = {
  title: 'Dashboard : Settings',
};

export default async function Page() {
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <SettingsPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
