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
import { useRouter }    from 'next/navigation';
import { useState }     from 'react';
import { useDeleteBookMutation, type Book } from '@/services/bookApi';

interface CellActionProps {
  data: Book;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [open, setOpen]               = useState(false);
  const router                        = useRouter();
  const { can }                       = useRole();
  const [deleteBook, { isLoading }]   = useDeleteBookMutation();

  const canEdit   = can('books.update');
  const canDelete = can('books.delete');

  const onConfirm = async () => {
    try {
      await deleteBook(data.id).unwrap();
      setOpen(false);
    } catch (err) {
      console.error('Failed to delete book:', err);
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
              onClick={() => router.push(`/dashboard/books/${data.id}`)}
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