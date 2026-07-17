import PageContainer from '@/components/layout/page-container';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import BookListingPage from '@/features/books/components/book-listing';
import { BookHeaderActions } from '@/features/books/components/book-header-actions';
import { searchParamsCache } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { bookInfoContent } from '@/config/infoconfig';

export const metadata = {
  title: 'Dashboard: Books'
};

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: pageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='Books'
      pageDescription='Manage books (Server side table functionalities.)'
      infoContent={bookInfoContent}
      pageHeaderAction={<BookHeaderActions />}
    >
      <Suspense
        fallback={
          <DataTableSkeleton columnCount={5} rowCount={8} filterCount={2} />
        }
      >
        <BookListingPage />
      </Suspense>
    </PageContainer>
  );
}