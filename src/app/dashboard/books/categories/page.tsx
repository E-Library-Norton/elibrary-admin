'use client';

// src/app/dashboard/categories/page.tsx
import { useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CrudTable, KhBadge } from '@/components/crud/crud-table';
import { CrudFormDialog } from '@/components/crud/crud-form-dialog';
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  type Category,
} from '@/services/categoryApi';
import PageContainer from '@/components/layout/page-container';

export default function CategoriesPage() {
  const { data, isLoading } = useGetCategoriesQuery();

  const [create, { isLoading: creating }] = useCreateCategoryMutation();
  const [update, { isLoading: updating }] = useUpdateCategoryMutation();
  const [remove]                           = useDeleteCategoryMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing,    setEditing]    = useState<Category | null>(null);
  const [form,       setForm]       = useState({ name: '', nameKh: '' ,description: '' });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', nameKh: '', description: ''  });
    setDialogOpen(true);
  };

  const openEdit = (row: Category) => {
    setEditing(row);
    setForm({ name: row.name, nameKh: row.nameKh ?? '', description: row.description ?? '' });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const payload = { name: form.name.trim(), nameKh: form.nameKh.trim() || undefined, description: form.description.trim() || undefined };
    try {
      if (editing) {
        await update({ id: editing.id, data: payload }).unwrap();
        toast.success('Category updated successfully');
      } else {
        await create(payload).unwrap();
        toast.success('Category created successfully');
      }
      setDialogOpen(false);
    } catch {
      toast.error('Something went wrong');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id).unwrap();
      toast.success('Category deleted successfully');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <PageContainer>
      <CrudTable
        title='Categories'
        description='Manage book categories'
        data={data?.data}
        isLoading={isLoading}
        columns={[
          { key: 'name',   header: 'Name (EN)' },
          { key: 'nameKh', header: 'Name (KH)', render: (r) => <KhBadge value={r.nameKh} /> },
          { key: 'description', header: 'Description' },
        ]}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <CrudFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? 'Edit Category' : 'New Category'}
        isSubmitting={creating || updating}
        onSubmit={handleSubmit}
      >
        <div className='space-y-3'>
          <div className='space-y-1.5'>
            <Label>Name (English) *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder='e.g. Science'
            />
          </div>
          <div className='space-y-1.5'>
            <Label>Name (Khmer)</Label>
            <Input
              value={form.nameKh}
              onChange={(e) => setForm((f) => ({ ...f, nameKh: e.target.value }))}
              placeholder='e.g. វិទ្យាស្ត្រ'
            />
          </div>
          <div className='space-y-1.5'>
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder='Additional details about the category'
            />
          </div>
        </div>
      </CrudFormDialog>
    </PageContainer>
  );
}
