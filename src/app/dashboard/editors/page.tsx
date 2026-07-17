'use client';

// src/app/dashboard/editors/page.tsx
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

export default function EditorsPage() {
  const { data, isLoading } = useGetEditorsQuery({ page: 1, limit: 100, search: '' });
  const [create, { isLoading: creating }] = useCreateEditorMutation();
  const [update, { isLoading: updating }] = useUpdateEditorMutation();
  const [remove]                           = useDeleteEditorMutation();

  const [open,    setOpen]    = useState(false);
  const [editing, setEditing] = useState<Editor | null>(null);
  const [form,    setForm]    = useState({ name: '', nameKh: '', biography: '', website: '' });

  const f = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', nameKh: '', biography: '', website: '' });
    setOpen(true);
  };

  const openEdit = (row: Editor) => {
    setEditing(row);
    setForm({
      name:      row.name,
      nameKh:    row.nameKh    ?? '',
      biography: row.biography ?? '',
      website:   row.website   ?? '',
    });
    setOpen(true);
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
      editing
        ? await update({ id: editing.id, data: payload }).unwrap()
        : await create(payload).unwrap();
      toast.success(editing ? 'Editor updated successfully' : 'Editor created successfully');
      setOpen(false);
    } catch {
      toast.error('Something went wrong');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id).unwrap();
      toast.success('Editor deleted successfully');
    } catch {
      toast.error('Failed to delete editor');
    }
  };

  return (
    <>
      <CrudTable
        title='Editors'
        description='Manage book editors and proofreaders'
        data={data?.data.editors}
        isLoading={isLoading}
        columns={[
          { key: 'name',      header: 'Name (EN)' },
          {
            key: 'nameKh',
            header: 'Name (KH)',
            render: (r) => <KhBadge value={r.nameKh} />,
          },
          {
            key: 'website',
            header: 'Website',
            render: (r) =>
              r.website ? (
                <a
                  href={r.website}
                  target='_blank'
                  rel='noreferrer'
                  className='text-primary hover:underline text-sm truncate block max-w-[200px]'
                >
                  {r.website}
                </a>
              ) : (
                <span className='text-muted-foreground text-xs italic'>—</span>
              ),
          },
          {
            key: 'biography',
            header: 'Biography',
            render: (r) =>
              r.biography ? (
                <span className='text-sm text-muted-foreground line-clamp-1'>{r.biography}</span>
              ) : (
                <span className='text-muted-foreground text-xs italic'>—</span>
              ),
          },
        ]}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <CrudFormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? 'Edit Editor' : 'New Editor'}
        isSubmitting={creating || updating}
        onSubmit={handleSubmit}
      >
        <div className='space-y-1.5'>
          <Label>Name (English) *</Label>
          <Input
            value={form.name}
            onChange={f('name')}
            placeholder='e.g. Jane Doe'
          />
        </div>
        <div className='space-y-1.5'>
          <Label>Name (Khmer)</Label>
          <Input value={form.nameKh} onChange={f('nameKh')} />
        </div>
        <div className='space-y-1.5'>
          <Label>Website</Label>
          <Input
            type='url'
            value={form.website}
            onChange={f('website')}
            placeholder='https://example.com'
          />
        </div>
        <div className='space-y-1.5'>
          <Label>Biography</Label>
          <Textarea
            value={form.biography}
            onChange={f('biography')}
            placeholder='Short biography…'
            rows={3}
          />
        </div>
      </CrudFormDialog>
    </>
  );
}
