'use client';

// src/app/dashboard/books/editors/page.tsx
import { useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CrudTable, KhBadge } from '@/components/crud/crud-table';
import { CrudFormDialog } from '@/components/crud/crud-form-dialog';
import {
  useGetEditorsQuery,
  useCreateEditorMutation,
  useUpdateEditorMutation,
  useDeleteEditorMutation,
  type Editor,
} from '@/services/editorApi';
import PageContainer from '@/components/layout/page-container';

export default function EditorsPage() {
  const { data, isLoading } = useGetEditorsQuery({ page: 1, limit: 100, search: '' });

  const [create, { isLoading: creating }] = useCreateEditorMutation();
  const [update, { isLoading: updating }] = useUpdateEditorMutation();
  const [remove]                           = useDeleteEditorMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing,    setEditing]    = useState<Editor | null>(null);
  const [form,       setForm]       = useState({
    name: '', nameKh: '', biography: '', website: '',
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', nameKh: '', biography: '', website: '' });
    setDialogOpen(true);
  };

  const openEdit = (row: Editor) => {
    setEditing(row);
    setForm({
      name:      row.name,
      nameKh:    row.nameKh    ?? '',
      biography: row.biography ?? '',
      website:   row.website   ?? '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      name:      form.name.trim(),
      nameKh:    form.nameKh.trim()    || undefined,
      biography: form.biography.trim() || undefined,
      website:   form.website.trim()   || undefined,
    };
    if (!payload.name) return toast.error('Name is required');
    try {
      if (editing) {
        await update({ id: editing.id, data: payload }).unwrap();
        toast.success('Editor updated successfully');
      } else {
        await create(payload).unwrap();
        toast.success('Editor created successfully');
      }
      setDialogOpen(false);
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message;
      toast.error(msg ?? 'Something went wrong');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id).unwrap();
      toast.success('Editor deleted successfully');
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message;
      toast.error(msg ?? 'Failed to delete');
    }
  };

  return (
    <PageContainer>
      <CrudTable
        title='Editors'
        description='Manage book editors and contributors'
        data={data?.data.editors}
        isLoading={isLoading}
        columns={[
          { key: 'name',      header: 'Name (EN)' },
          { key: 'nameKh',    header: 'Name (KH)',  render: (r) => <KhBadge value={r.nameKh} /> },
          { key: 'website',   header: 'Website',    render: (r) => r.website ? <a href={r.website} target='_blank' rel='noreferrer' className='text-primary hover:underline text-sm truncate max-w-[180px] block'>{r.website}</a> : <span className='text-muted-foreground text-xs italic'>—</span> },
          { key: 'biography', header: 'Biography',  render: (r) => r.biography ? <span className='text-sm text-muted-foreground line-clamp-1'>{r.biography}</span> : <span className='text-muted-foreground text-xs italic'>—</span> },
        ]}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <CrudFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? 'Edit Editor' : 'New Editor'}
        isSubmitting={creating || updating}
        onSubmit={handleSubmit}
      >
        <div className='space-y-3'>
          <div className='space-y-1.5'>
            <Label>Name (English) *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder='e.g. John Smith'
            />
          </div>
          <div className='space-y-1.5'>
            <Label>Name (Khmer)</Label>
            <Input
              value={form.nameKh}
              onChange={(e) => setForm((f) => ({ ...f, nameKh: e.target.value }))}
            />
          </div>
          <div className='space-y-1.5'>
            <Label>Website</Label>
            <Input
              type='url'
              value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              placeholder='https://samnangchan.shop'
            />
          </div>
          <div className='space-y-1.5'>
            <Label>Biography</Label>
            <Textarea
              value={form.biography}
              onChange={(e) => setForm((f) => ({ ...f, biography: e.target.value }))}
              placeholder='Short biography…'
              rows={3}
            />
          </div>
        </div>
      </CrudFormDialog>
    </PageContainer>
  );
}
