'use client';

import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useGetDownloadsQuery } from '@/services/downloadApi';
import {
  IconBook,
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconRefresh,
  IconSearch,
  IconSortDescending,
  IconX
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';

const PAGE_SIZE = 10;

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

function getPageNumbers(currentPage: number, totalPages: number) {
  const half = 3;
  const start = Math.max(
    1,
    Math.min(currentPage - half, totalPages - 5)
  );
  const end = Math.min(totalPages, start + 5);

  return Array.from(
    { length: end - start + 1 },
    (_, index) => start + index
  );
}

function DownloadsTableSkeleton() {
  return Array.from({ length: 6 }, (_, index) => (
    <TableRow key={index}>
      {Array.from({ length: 5 }, (__, cellIndex) => (
        <TableCell key={cellIndex}>
          <Skeleton className='h-5 w-full max-w-36' />
        </TableCell>
      ))}
    </TableRow>
  ));
}

export default function DownloadsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState<'newest' | 'most_downloaded'>('newest');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isFetching, isError, refetch } =
    useGetDownloadsQuery(
      {
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        from: from || undefined,
        to: to || undefined,
        sort
      },
      { refetchOnMountOrArgChange: 30 }
    );

  const downloads = data?.data.downloads ?? [];
  const total = data?.data.total ?? 0;
  const totalPages = Math.max(data?.data.totalPages ?? 1, 1);
  const hasFilters = Boolean(searchInput || from || to || sort !== 'newest');

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setFrom('');
    setTo('');
    setSort('newest');
    setPage(1);
  };

  return (
    <PageContainer
      pageTitle='Downloads'
      pageDescription='View the books downloaded by library users.'
    >
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Download History</CardTitle>
            <p className='text-muted-foreground mt-1 text-sm tabular-nums'>
              {isLoading
                ? 'Loading download records…'
                : `${total.toLocaleString()} ${total === 1 ? 'download' : 'downloads'}`}
            </p>
          </div>
          <CardAction>
            <Button
              variant='outline'
              size='icon'
              aria-label='Refresh downloads'
              title='Refresh downloads'
              disabled={isFetching}
              onClick={() => refetch()}
            >
              <IconRefresh className={isFetching ? 'animate-spin' : ''} />
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className='space-y-4 px-0'>
          <div className='flex flex-wrap items-end gap-3 px-6'>
            <div className='relative min-w-64 flex-1'>
              <IconSearch className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder='Search book, ISBN, student name, email or ID…'
                className='pl-9'
              />
            </div>
            <label className='space-y-1'>
              <span className='text-muted-foreground text-xs'>From</span>
              <Input
                type='date'
                value={from}
                max={to || undefined}
                className='w-40'
                onChange={(event) => {
                  setFrom(event.target.value);
                  setPage(1);
                }}
              />
            </label>
            <label className='space-y-1'>
              <span className='text-muted-foreground text-xs'>To</span>
              <Input
                type='date'
                value={to}
                min={from || undefined}
                className='w-40'
                onChange={(event) => {
                  setTo(event.target.value);
                  setPage(1);
                }}
              />
            </label>
            <Select
              value={sort}
              onValueChange={(value) => {
                setSort(value as 'newest' | 'most_downloaded');
                setPage(1);
              }}
            >
              <SelectTrigger className='w-52'>
                <IconSortDescending className='text-muted-foreground size-4' />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='newest'>Newest downloads</SelectItem>
                <SelectItem value='most_downloaded'>
                  Most downloaded books
                </SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant='outline' onClick={resetFilters}>
                <IconX />
                Reset
              </Button>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='pl-6'>Book</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>ISBN</TableHead>
                <TableHead>Downloaded At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <DownloadsTableSkeleton />
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={5} className='h-28 text-center'>
                    <p className='font-medium'>Could not load downloads</p>
                    <p className='text-muted-foreground mt-1 text-sm'>
                      Please refresh and try again.
                    </p>
                  </TableCell>
                </TableRow>
              ) : downloads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className='h-28 text-center'>
                    <IconDownload className='text-muted-foreground mx-auto mb-2 size-6' />
                    <p className='font-medium'>No downloads yet</p>
                    <p className='text-muted-foreground mt-1 text-sm'>
                      Completed book downloads will appear here.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                downloads.map((download) => (
                  <TableRow key={download.id}>
                    <TableCell className='max-w-80 pl-6'>
                      <div className='flex min-w-0 items-center gap-3'>
                        {download.Book?.coverUrl &&
                        !download.Book.isDeleted ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/api/books/${download.Book.id}/cover`}
                            alt=''
                            className='h-12 w-9 shrink-0 rounded object-cover'
                          />
                        ) : (
                          <div className='bg-muted text-muted-foreground flex h-12 w-9 shrink-0 items-center justify-center rounded'>
                            <IconBook className='size-4' />
                          </div>
                        )}
                        <div className='min-w-0'>
                          <p className='truncate font-medium'>
                            {download.Book?.title ?? 'Deleted book'}
                          </p>
                          {download.Book?.isDeleted && (
                            <p className='text-muted-foreground text-xs'>
                              Deleted book
                            </p>
                          )}
                          {download.Book && !download.Book.isDeleted && (
                            <p className='text-muted-foreground text-xs tabular-nums'>
                              {download.Book.downloads.toLocaleString()}{' '}
                              {download.Book.downloads === 1
                                ? 'download'
                                : 'downloads'}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className='font-medium'>
                          {download.User
                            ? [download.User.firstName, download.User.lastName]
                                .filter(Boolean)
                                .join(' ') || download.User.username
                            : 'Deleted user'}
                        </p>
                        {download.User?.email && (
                          <p className='text-muted-foreground text-xs'>
                            {download.User.email}
                          </p>
                        )}
                        {download.User?.isDeleted && (
                          <p className='text-muted-foreground text-xs'>
                            Deleted user
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className='font-mono text-xs'>
                      {download.User?.studentId ?? '—'}
                    </TableCell>
                    <TableCell className='font-mono text-xs'>
                      {download.Book?.isbn ?? '—'}
                    </TableCell>
                    <TableCell className='whitespace-nowrap'>
                      {dateFormatter.format(new Date(download.downloadedAt))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter className='flex items-center justify-between border-t px-4 py-3 text-sm'>
          <p className='text-muted-foreground text-xs'>
            Page {page} of {totalPages} · {total.toLocaleString()} total
          </p>
          <div className='flex items-center gap-1'>
            <Button
              variant='outline'
              size='icon'
              className='h-8 w-8'
              aria-label='Previous page'
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <IconChevronLeft className='h-4 w-4' />
            </Button>
            {getPageNumbers(page, totalPages).map((pageNumber) => (
              <Button
                key={pageNumber}
                variant={page === pageNumber ? 'default' : 'outline'}
                size='icon'
                className='h-8 w-8 text-xs'
                aria-label={`Go to page ${pageNumber}`}
                aria-current={page === pageNumber ? 'page' : undefined}
                disabled={isFetching}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </Button>
            ))}
            <Button
              variant='outline'
              size='icon'
              className='h-8 w-8'
              aria-label='Next page'
              disabled={page >= totalPages || isFetching}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
            >
              <IconChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </PageContainer>
  );
}
