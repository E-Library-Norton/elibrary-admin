'use client';

// src/components/crud/crud-table.tsx
// A reusable, generic table component for all dashboard CRUD pages.

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PlusIcon,
  Pencil,
  Trash2,
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

const PAGE_SIZE = 8;

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface CrudTableProps<T extends { id: string }> {
  title: string;
  description?: string;
  data: T[] | undefined;
  columns: Column<T>[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (row: T) => void;
  onDelete: (id: string) => Promise<void>;
}

export function CrudTable<T extends { id: string }>({
  title,
  description,
  data,
  columns,
  isLoading,
  onAdd,
  onEdit,
  onDelete,
}: CrudTableProps<T>) {
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);

  const rows = data ?? [];

  // Client-side search across all string-like values
  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((row) =>
      Object.values(row as Record<string, unknown>).some((v) =>
        String(v ?? '').toLowerCase().includes(q)
      )
    );
  }, [rows, search]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows    = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Page-number window (up to 7 buttons)
  const pageWindow = (() => {
    const half  = 3;
    const start = Math.max(1, Math.min(page - half, totalPages - 6));
    const end   = Math.min(totalPages, start + 6);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  })();

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteId);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader className='pb-3'>
          <div className='flex flex-col justify-between gap-3 sm:flex-row sm:items-center'>
            <div className='space-y-1'>
              <CardTitle>{title}</CardTitle>
              {description && (
                <CardDescription>{description}</CardDescription>
              )}
            </div>
            <Button size='sm' onClick={onAdd} className='gap-1.5 shrink-0'>
              <PlusIcon className='h-4 w-4' />
              Add New
            </Button>
          </div>
          {/* Search bar */}
          <div className='relative mt-1'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none' />
            <Input
              className='pl-9'
              placeholder={`Search ${title.toLowerCase()}…`}
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </CardHeader>

        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-10 text-center text-muted-foreground'>#</TableHead>
                {columns.map((col) => (
                  <TableHead key={String(col.key)}>{col.header}</TableHead>
                ))}
                <TableHead><span className='sr-only'>Actions</span></TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: columns.length + 2 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className='h-4 w-full' /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : pageRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 2}
                    className='py-12 text-center text-muted-foreground'
                  >
                    No records found.
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((row, idx) => (
                  <TableRow key={row.id} className='hover:bg-muted/40'>
                    <TableCell className='text-center text-muted-foreground text-sm'>
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </TableCell>

                    {columns.map((col) => (
                      <TableCell key={String(col.key)}>
                        {col.render
                          ? col.render(row)
                          : (row[col.key as keyof T] as React.ReactNode) ?? (
                              <span className='text-muted-foreground text-xs italic'>—</span>
                            )}
                      </TableCell>
                    ))}

                    {/* ··· Actions dropdown */}
                    <TableCell className='text-right'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='icon' className='h-8 w-8'>
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem onClick={() => onEdit(row)}>
                            <Pencil className='mr-2 h-3.5 w-3.5' /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className='text-destructive focus:text-destructive'
                            onClick={() => setDeleteId(row.id)}
                          >
                            <Trash2 className='mr-2 h-3.5 w-3.5' /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination — always visible */}
          <div className='flex items-center justify-between px-4 py-3 border-t text-sm'>
            <p className='text-muted-foreground'>
              Page {page} of {totalPages} · {filtered.length} total
            </p>
            <div className='flex items-center gap-1'>
              <Button
                variant='outline' size='icon' className='h-8 w-8'
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className='h-3.5 w-3.5' />
              </Button>
              {pageWindow.map((p) => (
                <Button
                  key={p}
                  variant={page === p ? 'default' : 'outline'}
                  size='icon' className='h-8 w-8 text-xs'
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ))}
              <Button
                variant='outline' size='icon' className='h-8 w-8'
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className='h-3.5 w-3.5' />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirm dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The record will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5'
            >
              {isDeleting && <Loader2 className='h-3.5 w-3.5 animate-spin' />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Small helper used in tables to show optional KH names
export function KhBadge({ value }: { value: string | null | undefined }) {
  if (!value) return <span className='text-muted-foreground text-xs italic'>—</span>;
  return <Badge variant='secondary' className='font-normal text-xs'>{value}</Badge>;
}


