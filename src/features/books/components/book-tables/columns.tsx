'use client';

import { Badge }                 from '@/components/ui/badge';
import { ColumnDef }             from '@tanstack/react-table';
import { BookOpen, Text, FileText, Download } from 'lucide-react';
import { CellAction }            from './cell-action';
import type { Book }             from '@/services/bookApi';

export type CategoryOption = { value: string; label: string };

export function createColumns(categoryOptions: CategoryOption[]): ColumnDef<Book>[] {
  return [
  // ── Cover 
  {
    accessorKey: 'coverUrl',
    header:      'COVER',
    cell: ({ row }) => {
      const id  = row.original.id;
      const url = row.original.coverUrl;
      if (!url) {
        return (
          <div className='relative aspect-square w-10 rounded-lg bg-muted flex items-center justify-center'>
            <BookOpen className='h-4 w-4 text-muted-foreground' />
          </div>
        );
      }
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/books/${id}/cover?v=${encodeURIComponent(row.original.updatedAt || '')}`}
          alt={row.original.title}
          width={40}
          height={40}
          className='rounded-lg object-cover aspect-square w-10 h-10'
        />
      );
    },
  },

  // ── Title 
  {
    id:          'name',
    accessorKey: 'title',
    header:      'TITLE',
    cell: ({ row }) => (
      <div className='max-w-[240px]'>
        <p className='font-medium text-sm truncate'>{row.original.title}</p>
        {row.original.titleKh && (
          <p className='text-xs text-muted-foreground truncate'>{row.original.titleKh}</p>
        )}
      </div>
    ),
    meta: {
      label:       'Title',
      placeholder: 'Search books...',
      variant:     'text',
      icon:        Text,
    },
    enableColumnFilter: true,
  },

  // ── Category 
  {
    id:          'category',
    accessorKey: 'Category',
    header:      'CATEGORY',
    cell: ({ row }) => {
      const cat = row.original.Category;
      if (!cat) return <span className='text-muted-foreground text-xs'>—</span>;
      return (
        <Badge variant='outline' className='capitalize'>
          {cat.name}
        </Badge>
      );
    },
    enableColumnFilter: true,
    meta: {
      label:   'Category',
      variant: 'select',
      options: categoryOptions,
    },
  },

  // ── Authors ─
  {
    accessorKey: 'Authors',
    header:      'AUTHORS',
    cell: ({ row }) => {
      const authors = row.original.Authors ?? [];
      if (!authors.length) return <span className='text-muted-foreground text-xs'>—</span>;
      const primary   = authors.find((a) => a.books_authors?.isPrimaryAuthor);
      const displayed = primary ?? authors[0];
      return (
        <div className='text-sm'>
          <span className='font-medium'>{displayed.name}</span>
          {authors.length > 1 && (
            <span className='ml-1 text-xs text-muted-foreground'>+{authors.length - 1}</span>
          )}
        </div>
      );
    },
  },

  // ── ISBN ─
  {
    accessorKey: 'isbn',
    header:      'ISBN',
    cell: ({ getValue }) => (
      <span className='font-mono text-xs text-muted-foreground'>
        {(getValue() as string | null) ?? '—'}
      </span>
    ),
  },

  // ── Year 
  {
    accessorKey: 'publicationYear',
    header:      'YEAR',
    cell: ({ getValue }) => (
      <span className='text-sm'>{(getValue() as number | null) ?? '—'}</span>
    ),
  },

  // ── Downloads
  {
    accessorKey: 'downloads',
    header:      'DOWNLOADS',
    cell: ({ getValue }) => (
      <span className='tabular-nums text-sm'>
        {Number(getValue() ?? 0).toLocaleString()}
      </span>
    ),
  },

  // ── PDF ──
  {
    accessorKey: 'pdfUrl',
    header:      'PDF',
    cell: ({ row }) => {
      const id = row.original.id;
      if (!row.original.pdfUrl) return <span className='text-muted-foreground text-xs'>—</span>;
      return (
        <div className='flex items-center gap-1'>
          {/* View — proxied through Next.js, auth via cookie */}
          <a
            href={`/api/books/${id}/stream`}
            target='_blank'
            rel='noopener noreferrer'
            title='View PDF'
            className='inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted transition-colors'
          >
            <FileText className='h-3.5 w-3.5 text-red-500' />
            View
          </a>
          {/* Download — proxied through Next.js, auth via cookie */}
          <a
            href={`/api/books/${id}/download`}
            download
            title='Download PDF'
            className='inline-flex items-center rounded-md border p-1 hover:bg-muted transition-colors'
          >
            <Download className='h-3.5 w-3.5' />
          </a>
        </div>
      );
    },
  },

  // ── Status ──
  {
    accessorKey: 'isActive',
    header:      'STATUS',
    cell: ({ getValue }) => (
      <Badge variant={getValue() ? 'default' : 'secondary'} className='text-xs'>
        {getValue() ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },

  // ── Actions ─
  {
    id:   'actions',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
  ];
}
