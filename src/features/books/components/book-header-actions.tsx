'use client';

import { buttonVariants } from '@/components/ui/button';
import { useRole } from '@/hooks/use-role';
import { cn } from '@/lib/utils';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';

/**
 * Renders the "Add New Book" button only when the current user
 * has the `books.create` permission (regardless of role).
 */
export function BookHeaderActions() {
  const { can } = useRole();

  if (!can('books.create')) return null;

  return (
    <Link
      href='/dashboard/books/new'
      className={cn(buttonVariants(), 'text-xs md:text-sm')}
    >
      <IconPlus className='mr-2 h-4 w-4' /> Add New Book
    </Link>
  );
}
