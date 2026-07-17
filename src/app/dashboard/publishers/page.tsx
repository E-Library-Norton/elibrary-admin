'use client';

// src/app/dashboard/publishers/page.tsx
import { useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CrudTable, KhBadge } from '@/components/crud/crud-table';
import { CrudFormDialog } from '@/components/crud/crud-form-dialog';
import {
  useGetPublishersQuery,
  useCreatePublisherMutation,
  useUpdatePublisherMutation,
  useDeletePublisherMutation,
  type Publisher,
} from '@/services/publisherApi';

export default function PublishersPage() {
  const { data, isLoading } = useGetPublishersQuery({ page: 1, limit: 100, search: '' });

  const [create, { isLoading: creating }] = useCreatePublisherMutation();
  const [update, { isLoading: updating }] = useUpdatePublisherMutation();
  const [remove]                           = useDeletePublisherMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing,    setEditing]    = useState<Publisher | null>(null);
  const [form,       setForm]       = useState({
    name: '', nameKh: '', address: '', contactEmail: '',
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', nameKh: '', address: '', contactEmail: '' });
    setDialogOpen(true);
  };

  const openEdit = (row: Publisher) => {
    setEditing(row);
    setForm({
      name:         row.name,
      nameKh:       row.nameKh       ?? '',
      address:      row.address      ?? '',
      contactEmail: row.contactEmail ?? '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      name:         form.name.trim(),
      nameKh:       form.nameKh.trim()       || undefined,
      address:      form.address.trim()      || undefined,
      contactEmail: form.contactEmail.trim() || undefined,
    };
    if (!payload.name) return toast.error('Name is required');
    try {
      if (editing) {
        await update({ id: editing.id, data: payload }).unwrap();
        toast.success('Publisher updated successfully');
      } else {
        await create(payload).unwrap();
        toast.success('Publisher created successfully');
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
      toast.success('Publisher deleted successfully');
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message;
      toast.error(msg ?? 'Failed to delete');
    }
  };

  return (
    <>
      <CrudTable
        title='Publishers'
        description='Manage book publishers and their contact details'
        data={data?.data.publishers}
        isLoading={isLoading}
        columns={[
          { key: 'name',         header: 'Name (EN)' },
          { key: 'nameKh',       header: 'Name (KH)',  render: (r) => <KhBadge value={r.nameKh} /> },
          { key: 'contactEmail', header: 'Email',      render: (r) => r.contactEmail ? <a href={`mailto:${r.contactEmail}`} className='text-primary hover:underline text-sm'>{r.contactEmail}</a> : <span className='text-muted-foreground text-xs italic'>—</span> },
          { key: 'address',      header: 'Address',    render: (r) => r.address ? <span className='text-sm text-muted-foreground line-clamp-1'>{r.address}</span> : <span className='text-muted-foreground text-xs italic'>—</span> },
        ]}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <CrudFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? 'Edit Publisher' : 'New Publisher'}
        isSubmitting={creating || updating}
        onSubmit={handleSubmit}
      >
        <div className='space-y-3'>
          <div className='space-y-1.5'>
            <Label>Name (English) *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder='e.g. Oxford University Press'
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
            <Label>Contact Email</Label>
            <Input
              type='email'
              value={form.contactEmail}
              onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
              placeholder='publisher@example.com'
            />
          </div>
          <div className='space-y-1.5'>
            <Label>Address</Label>
            <Input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder='Phnom Penh, Cambodia'
            />
          </div>
        </div>
      </CrudFormDialog>
    </>
  );
}
