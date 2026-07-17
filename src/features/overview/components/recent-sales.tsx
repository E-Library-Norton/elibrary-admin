'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { useGetBooksQuery } from '@/services/bookApi';
import { Loader2 } from 'lucide-react';

export function RecentSales() {
  const { data: booksData, isLoading } = useGetBooksQuery({ limit: 5, sortBy: 'views', sortOrder: 'DESC' });
  const books = booksData?.data?.books || [];

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Popular Books</CardTitle>
        <CardDescription>The most viewed books in the library.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
           <div className="flex h-32 items-center justify-center">
             <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
           </div>
        ) : (
          <div className='space-y-8'>
            {books.map((book) => (
              <div key={book.id} className='flex items-center'>
                <Avatar className='h-9 w-9'>
                  <AvatarImage src={book.coverUrl ?? undefined} alt={book.title} className="object-cover" />
                  <AvatarFallback>{book.title.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className='ml-4 space-y-1 max-w-[150px] sm:max-w-[200px]'>
                  <p className='text-sm leading-none font-medium truncate'>{book.title}</p>
                  <p className='text-muted-foreground text-sm truncate'>
                    {book.Category?.name || 'Uncategorized'}
                  </p>
                </div>
                <div className='ml-auto font-medium'>{book.views.toLocaleString()} views</div>
              </div>
            ))}
            {books.length === 0 && (
               <div className="text-center text-sm text-muted-foreground py-4">
                 No books found.
               </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
