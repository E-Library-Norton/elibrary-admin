'use client';

// src/app/dashboard/departments/page.tsx
import { useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CrudTable, KhBadge } from '@/components/crud/crud-table';
import { CrudFormDialog } from '@/components/crud/crud-form-dialog';
import {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  type Department,
} from '@/services/departmentApi';
import PageContainer from '@/components/layout/page-container';

export default function DepartmentsPage() {
  const { data, isLoading } = useGetDepartmentsQuery();

  const [create, { isLoading: creating }] = useCreateDepartmentMutation();
  const [update, { isLoading: updating }] = useUpdateDepartmentMutation();
  const [remove] = useDeleteDepartmentMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState({ name: '', nameKh: '', code: '' ,description: '' });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', nameKh: '', code: '', description: '' });
    setDialogOpen(true);
  };

  const openEdit = (row: Department) => {
    setEditing(row);
    setForm({ name: row.name, nameKh: row.nameKh ?? '', code: row.code ?? '', description: row.description ?? '' });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    // Basic validation check before sending
    if (!form.name.trim()) {
      toast.error('English name is required');
      return;
    }

    const payload = {
      name: form.name.trim(),
      nameKh: form.nameKh.trim() || undefined,
      code: form.code.trim() || undefined,
      description: form.description.trim() || undefined,
    };

    try {
      if (editing) {
        await update({ id: editing.id, data: payload }).unwrap();
        toast.success('Department updated successfully');
      } else {
        await create(payload).unwrap();
        toast.success('Department created successfully');
      }
      setDialogOpen(false);
    } catch {
      toast.error('Something went wrong');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id).unwrap();
      toast.success('Department deleted successfully');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <PageContainer>
      <CrudTable
        title='Departments'
        description='Manage university departments'
        data={data?.data}
        isLoading={isLoading}
        columns={[
          {
            key: 'code',
            header: 'Code',
            render: (r) =>
              r.code ? (
                <span className='font-mono text-xs bg-muted px-1.5 py-0.5 rounded'>
                  {r.code}
                </span>
              ) : (
                <span className='text-muted-foreground text-xs italic'>—</span>
              ),
          },
          { key: 'name', header: 'Name (EN)' },
          {
            key: 'nameKh',
            header: 'Name (KH)',
            render: (r) => <KhBadge value={r.nameKh} />,
          },
          { key: 'description', header: 'Description' },
        ]}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <CrudFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? 'Edit Department' : 'New Department'}
        isSubmitting={creating || updating}
        onSubmit={handleSubmit}
      >
        <div className='space-y-3'>
          <div className='space-y-1.5'>
            <Label>Department Code</Label>
            <Input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder='e.g. CS, IT, ENG'
            />
          </div>
          <div className='space-y-1.5'>
            <Label>Name (English) *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder='e.g. Computer Science'
            />
          </div>
          <div className='space-y-1.5'>
            <Label>Name (Khmer)</Label>
            <Input
              value={form.nameKh}
              onChange={(e) => setForm((f) => ({ ...f, nameKh: e.target.value }))}
              placeholder='e.g. វិទ្យាកុំព្យូទ័រ'
            />
          </div>
          <div className='space-y-1.5'></div>
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder='Additional details about the department'
            />
        </div>
      </CrudFormDialog>
    </PageContainer>
  );
}