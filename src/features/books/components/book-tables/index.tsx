'use client';

import { DataTable }        from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable }     from '@/hooks/use-data-table';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useMemo }          from 'react';
import { createColumns, type CategoryOption } from './columns';
import type { Book }        from '@/services/bookApi';

interface BookTableProps {
  data:            Book[];
  totalItems:      number;
  categoryOptions: CategoryOption[];
}

export function BookTable({ data, totalItems, categoryOptions }: BookTableProps) {
  const [pageSize] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const pageCount  = Math.ceil(totalItems / pageSize);

  const columns = useMemo(() => createColumns(categoryOptions), [categoryOptions]);

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    shallow:    false,
    debounceMs: 500,
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}