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

  const [open,    setOpen]    = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form,    setForm]    = useState({ name: '', nameKh: '', description: '' });
  
  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const openAdd = () => { setEditing(null); setForm({ name: '', nameKh: '', description: '' }); setOpen(true); };
  const openEdit = (row: Category) => { setEditing(row); setForm({ name: row.name, nameKh: row.nameKh ?? '', description: row.description ?? '' }); setOpen(true); };

  const handleSubmit = async () => {
    const payload = { name: form.name.trim(), nameKh: form.nameKh.trim() || undefined, description: form.description.trim() || undefined };
    if (!payload.name) return toast.error('Name is required');
    try {
      editing
        ? await update({ id: editing.id, data: payload }).unwrap()
        : await create(payload).unwrap();
      toast.success(editing ? 'Category updated successfully' : 'Category created successfully');
      setOpen(false);
    } catch { toast.error('Something went wrong'); }
  };

  const handleDelete = async (id: string) => {
    try { await remove(id).unwrap(); toast.success('Category deleted successfully'); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <PageContainer>
      <CrudTable
        title='Categories'
        description='Manage book categories used for classification'
        data={data?.data}
        isLoading={isLoading}
        columns={[
          { key: 'name',        header: 'Name (EN)' },
          { key: 'nameKh',      header: 'Name (KH)',    render: (r) => <KhBadge value={r.nameKh} /> },
          { key: 'description', header: 'Description',  render: (r) => r.description || <span className='text-muted-foreground text-xs italic'>—</span> },
        ]}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={handleDelete}
      />
      <CrudFormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? 'Edit Category' : 'New Category'}
        isSubmitting={creating || updating}
        onSubmit={handleSubmit}
      >
        <div className='space-y-1.5'>
          <Label>Name (English) *</Label>
          <Input value={form.name} onChange={f('name')} placeholder='e.g. Science' />
        </div>
        <div className='space-y-1.5'>
          <Label>Name (Khmer)</Label>
          <Input value={form.nameKh} onChange={f('nameKh')} placeholder='e.g. វិទ្យាស្ត្រ' />
        </div>
        <div className='space-y-1.5'>
          <Label>Description</Label>
          <Input value={form.description} onChange={f('description')} placeholder='e.g. Natural and applied sciences' />
        </div>
      </CrudFormDialog>
    </PageContainer>
  );
}
