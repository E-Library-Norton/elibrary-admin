import { notFound } from 'next/navigation';
import BookForm from './book-form';
import type { Book } from '@/services/bookApi';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

async function getBook(id: string): Promise<Book | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/books/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data ?? null) as Book | null;
  } catch {
    return null;
  }
}

type TBookViewPageProps = {
  bookId: string;
};

export default async function BookViewPage({ bookId }: TBookViewPageProps) {
  let book: Book | null = null;
  let pageTitle: string = 'Create New Book';

  if (bookId !== 'new') {
    book = await getBook(bookId);
    if (!book) notFound();
    pageTitle = 'Edit Book';
  }

  return <BookForm initialData={book} pageTitle={pageTitle} />;
}