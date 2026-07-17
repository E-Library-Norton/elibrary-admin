'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetBookByIdQuery } from '@/services/bookApi';

export default function BookReadPage() {
  const params = useParams();
  const id = Array.isArray(params.bookId)
    ? params.bookId[0]
    : (params.bookId ?? '');

  const { data: bookData, isLoading, isError } = useGetBookByIdQuery(id, {
    skip: !id,
  });
  const book = bookData?.data;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className='flex flex-col items-center justify-center h-screen bg-slate-900 gap-4'>
        <Loader2 className='w-10 h-10 text-blue-400 animate-spin' />
        <p className='text-slate-300 text-sm'>Preparing PDF…</p>
      </div>
    );
  }

  // ── Error / not found ──────────────────────────────────────────────────────
  if (isError || !book) {
    return (
      <div className='flex flex-col items-center justify-center h-screen bg-slate-900 gap-4 px-4'>
        <AlertCircle className='w-12 h-12 text-red-400' />
        <h2 className='text-white text-xl font-bold'>Book not found</h2>
        <Button asChild variant='outline'>
          <Link href='/dashboard/books'>
            <ArrowLeft className='w-4 h-4 mr-2' /> Back to Books
          </Link>
        </Button>
      </div>
    );
  }

  // ── No PDF attached ────────────────────────────────────────────────────────
  if (!book.pdfUrl) {
    return (
      <div className='flex flex-col items-center justify-center h-screen bg-slate-900 gap-4 px-4'>
        <AlertCircle className='w-12 h-12 text-yellow-400' />
        <h2 className='text-white text-xl font-bold'>No PDF Available</h2>
        <p className='text-slate-400'>This book does not have a PDF file.</p>
        <Button asChild variant='outline'>
          <Link href={`/dashboard/books/${id}`}>
            <ArrowLeft className='w-4 h-4 mr-2' /> Back to Edit
          </Link>
        </Button>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const streamUrl = `/api/books/${id}/stream`;

  return (
    <div className='h-screen w-screen overflow-hidden'>
      <div className='absolute top-3 left-3 z-50'>
        <Button
          asChild
          size='sm'
          variant='secondary'
          className='opacity-80 hover:opacity-100 shadow-lg'
        >
          <Link href={`/dashboard/books/${id}`}>
            <ArrowLeft className='w-3.5 h-3.5 mr-1' /> Back
          </Link>
        </Button>
      </div>
      <iframe
        src={streamUrl}
        title={book.title ?? 'Book PDF'}
        className='h-full w-full border-0'
      />
    </div>
  );
}
