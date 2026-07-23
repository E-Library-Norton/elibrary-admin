'use client';

import { buttonVariants } from '@/components/ui/button';
import { useRole } from '@/hooks/use-role';
import { cn } from '@/lib/utils';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Renders the "Add New Book" button only when the current user
 * has the `books.create` permission (regardless of role).
 */
export function BookHeaderActions() {
  const { can } = useRole();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!can('books.create')) return null;

  const queryString = searchParams.toString();
  const returnTo = `${pathname}${queryString ? `?${queryString}` : ''}`;
  const createUrl = `/dashboard/books/new?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <Link
      href={createUrl}
      className={cn(buttonVariants(), 'text-xs md:text-sm')}
    >
      <IconPlus className='mr-2 h-4 w-4' /> Add New Book
    </Link>
  );
}
