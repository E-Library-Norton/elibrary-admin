'use client';

import { AlertModal }   from '@/components/modal/alert-modal';
import { Button }       from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRole }      from '@/hooks/use-role';
import { IconDotsVertical, IconEdit, IconTrash } from '@tabler/icons-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState }     from 'react';
import { useDeleteBookMutation, type Book } from '@/services/bookApi';
import { toast } from 'sonner';

interface CellActionProps {
  data: Book;
}

type DeleteBookError = {
  data?: {
    message?: string;
    error?: {
      message?: string;
    };
  };
};

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [open, setOpen]               = useState(false);
  const router                        = useRouter();
  const pathname                      = usePathname();
  const searchParams                  = useSearchParams();
  const { can }                       = useRole();
  const [deleteBook, { isLoading }]   = useDeleteBookMutation();

  const canEdit   = can('books.update');
  const canDelete = can('books.delete');
  const queryString = searchParams.toString();
  const returnTo = `${pathname}${queryString ? `?${queryString}` : ''}`;
  const editUrl = `/dashboard/books/${data.id}?returnTo=${encodeURIComponent(returnTo)}`;

  const onConfirm = async () => {
    try {
      const response = await deleteBook(data.id).unwrap();
      setOpen(false);
      toast.success(response?.message || 'Book deleted successfully');
      router.refresh();
    } catch (error: unknown) {
      const err = error as DeleteBookError;
      const message =
        err.data?.error?.message ||
        err.data?.message ||
        'Failed to delete book. Please try again.';
      toast.error(message);
    }
  };

  return (
    <>
      {canDelete && (
        <AlertModal
          isOpen={open}
          onClose={() => setOpen(false)}
          onConfirm={onConfirm}
          loading={isLoading}
        />
      )}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Open menu</span>
            <IconDotsVertical className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>

          {/* Edit — requires books.update permission */}
          {canEdit && (
            <DropdownMenuItem
              onClick={() => router.push(editUrl)}
            >
              <IconEdit className='mr-2 h-4 w-4' /> Edit
            </DropdownMenuItem>
          )}

          {/* Delete — requires books.delete permission */}
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setOpen(true)}
                className='text-destructive focus:text-destructive'
              >
                <IconTrash className='mr-2 h-4 w-4' /> Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
