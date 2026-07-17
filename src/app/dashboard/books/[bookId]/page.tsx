import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import { Suspense } from 'react';
import BookViewPage from '@/features/books/components/book-view-page';

export const metadata = {
  title: 'Dashboard: Book'
};

type PageProps = { params: Promise<{ bookId: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <BookViewPage bookId={params.bookId} />
        </Suspense>
      </div>
    </PageContainer>
  );
}