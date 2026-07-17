'use client';

import PageContainer from '@/components/layout/page-container';
import { teamInfoContent } from '@/config/infoconfig';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Pencil, Trash2, Plus, Shield, X,
  Loader2, MoreHorizontal,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import {
  useGetRolesQuery, useCreateRoleMutation,
  useUpdateRoleMutation, useDeleteRoleMutation,
  useSyncRolePermissionsMutation,
  type Role, type Permission,
} from '@/services/roleApi';
import { useGetPermissionsQuery } from '@/services/permissionApi';
import { useRole } from '@/hooks/use-role';

// ── Constants 
const PAGE_SIZE = 10;

// ── Skeleton loader
function RoleTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div className='space-y-2'>
            <Skeleton className='h-5 w-20' />
            <Skeleton className='h-3 w-36' />
          </div>
          <Skeleton className='h-9 w-28 rounded-md' />
        </div>
        <Skeleton className='mt-2 h-9 w-full rounded-md' />
      </CardHeader>
      <CardContent className='p-0'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <Skeleton className='h-7 w-7 rounded-md' />
                    <Skeleton className='h-4 w-20' />
                  </div>
                </TableCell>
                <TableCell><Skeleton className='h-3 w-40' /></TableCell>
                <TableCell>
                  <div className='flex gap-1'>
                    <Skeleton className='h-5 w-16 rounded' />
                    <Skeleton className='h-5 w-20 rounded' />
                  </div>
                </TableCell>
                <TableCell><Skeleton className='h-7 w-7 rounded-md ml-auto' /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ── Helpers 
const permColor = (name: string): string => {
  if (name.startsWith('users'))       return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
  if (name.startsWith('roles'))       return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
  if (name.startsWith('permissions')) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
  if (name.startsWith('books'))       return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
  return 'bg-muted text-muted-foreground';
};

const emptyRole = (): Omit<Role, 'id'> => ({ name: '', description: '', Permissions: [] });

// ── Permission Selector 
function PermissionSelector({
  allPerms,
  selected,
  permSearch,
  onPermSearch,
  onChange,
}: {
  allPerms: Permission[];
  selected: Permission[];
  permSearch: string;
  onPermSearch: (v: string) => void;
  onChange: (perms: Permission[]) => void;
}) {
  const filtered = allPerms.filter(
    (p) =>
      p.name.toLowerCase().includes(permSearch.toLowerCase()) ||
      p.description?.toLowerCase().includes(permSearch.toLowerCase())
  );

  const toggle = (perm: Permission, checked: boolean) =>
    onChange(checked ? [...selected, perm] : selected.filter((s) => s.id !== perm.id));

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <Label>
          Permissions{' '}
          <span className='text-muted-foreground font-normal'>({selected.length} selected)</span>
        </Label>
        <Button
          type='button' variant='ghost' size='sm' className='text-xs h-7'
          onClick={() => onChange(selected.length === allPerms.length ? [] : [...allPerms])}
        >
          {selected.length === allPerms.length ? 'Deselect All' : 'Select All'}
        </Button>
      </div>

      {/* Selected badges */}
      {selected.length > 0 && (
        <div className='flex flex-wrap gap-1 p-2 border rounded-md bg-muted/30 max-h-24 overflow-y-auto'>
          {selected.map((p) => (
            <span
              key={p.id}
              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${permColor(p.name)}`}
            >
              {p.name}
              <X
                className='w-3 h-3 cursor-pointer'
                onClick={() => onChange(selected.filter((s) => s.id !== p.id))}
              />
            </span>
          ))}
        </div>
      )}

      {/* Search */}
      <Input
        placeholder='Search permissions…'
        value={permSearch}
        onChange={(e) => onPermSearch(e.target.value)}
        className='h-8 text-sm'
      />

      {/* List */}
      <div className='border rounded-md max-h-48 overflow-y-auto divide-y'>
        {filtered.length === 0 && (
          <p className='text-center text-xs text-muted-foreground py-4'>No permissions found</p>
        )}
        {filtered.map((perm) => {
          const checked = !!selected.find((s) => s.id === perm.id);
          return (
            <label
              key={perm.id}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors ${checked ? 'bg-muted/30' : ''}`}
            >
              <input
                type='checkbox'
                checked={checked}
                className='rounded'
                onChange={(e) => toggle(perm, e.target.checked)}
              />
              <div className='flex-1 min-w-0'>
                <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${permColor(perm.name)}`}>
                  {perm.name}
                </span>
                <p className='text-xs text-muted-foreground mt-0.5'>{perm.description}</p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ── Role Form ─────────────────────────────────────────────────────────────────
function RoleForm({
  data,
  allPerms,
  permSearch,
  onPermSearch,
  onChange,
}: {
  data: Omit<Role, 'id'>;
  allPerms: Permission[];
  permSearch: string;
  onPermSearch: (v: string) => void;
  onChange: (field: string, value: string | Permission[]) => void;
}) {
  return (
    <div className='space-y-4 py-2'>
      <div className='space-y-1'>
        <Label htmlFor='role-name'>Role Name</Label>
        <Input
          id='role-name'
          value={data.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder='e.g. librarian'
        />
      </div>
      <div className='space-y-1'>
        <Label htmlFor='role-desc'>Description</Label>
        <Textarea
          id='role-desc'
          value={data.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder='Describe this role…'
          rows={2}
        />
      </div>
      <PermissionSelector
        allPerms={allPerms}
        selected={data.Permissions}
        permSearch={permSearch}
        onPermSearch={onPermSearch}
        onChange={(perms) => onChange('Permissions', perms)}
      />
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
export default function RolesPage() {
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [editRole, setEditRole]     = useState<Role | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);
  const [newRole, setNewRole]       = useState(emptyRole());
  const [permSearch, setPermSearch] = useState('');

  const { can } = useRole();

  // ── RTK Query ─────────────────────────────────────────────────────────────
  const { data: rolesData, isLoading, isFetching, isError } = useGetRolesQuery();
  const { data: permsData } = useGetPermissionsQuery();

  const [createRole,    { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole,    { isLoading: isUpdating }] = useUpdateRoleMutation();
  const [deleteRoleMut, { isLoading: isDeleting }] = useDeleteRoleMutation();
  const [syncPermissions]                          = useSyncRolePermissionsMutation();

  const allRoles = rolesData?.data ?? [];
  const allPerms = permsData?.data ?? [];

  // ── Search + Pagination ───────────────────────────────────────────────────
  const filtered = useMemo(
    () =>
      allRoles.filter(
        (r) =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.description?.toLowerCase().includes(search.toLowerCase())
      ),
    [allRoles, search]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  const handleSaveEdit = async () => {
    if (!editRole) return;
    try {
      await updateRole({
        id: editRole.id,
        data: { name: editRole.name, description: editRole.description },
      }).unwrap();
      await syncPermissions({
        id: editRole.id,
        permissionIds: editRole.Permissions.map((p) => p.id),
      }).unwrap();
      setEditRole(null);
      setPermSearch('');
    } catch (err) { console.error('Update role failed:', err); }
  };

  const handleCreate = async () => {
    try {
      await createRole({
        name: newRole.name,
        description: newRole.description,
        permissionIds: newRole.Permissions.map((p) => p.id),
      }).unwrap();
      setCreateOpen(false);
      setNewRole(emptyRole());
      setPermSearch('');
    } catch (err) { console.error('Create role failed:', err); }
  };

  const handleDelete = async () => {
    if (!deleteRole) return;
    try {
      await deleteRoleMut(deleteRole.id).unwrap();
      setDeleteRole(null);
    } catch (err) { console.error('Delete role failed:', err); }
  };

  const openEdit = (role: Role) => {
    setPermSearch('');
    setEditRole({ ...role, Permissions: [...role.Permissions] });
  };

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (isLoading) return (
    <PageContainer pageTitle='Roles' pageDescription='Manage roles and their associated permissions.' infoContent={teamInfoContent}>
      <div className='space-y-4'><RoleTableSkeleton /></div>
    </PageContainer>
  );

  if (isError) return (
    <PageContainer pageTitle='Roles' pageDescription='Manage roles and their associated permissions.' infoContent={teamInfoContent}>
      <div className='flex flex-col items-center justify-center h-64 gap-3'>
        <p className='text-destructive'>Failed to load roles.</p>
        <Button variant='outline' size='sm' onClick={() => window.location.reload()}>Retry</Button>
      </div>
    </PageContainer>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <PageContainer
      pageTitle='Roles'
      pageDescription='Manage roles and their associated permissions.'
      infoContent={teamInfoContent}
    >
      <div className='space-y-4'>
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle className='flex items-center gap-2'>
                  <Shield className='w-5 h-5' /> Roles
                </CardTitle>
                <CardDescription className='mt-1'>
                  {isFetching
                    ? <Skeleton className='h-3 w-36 inline-block align-middle' />
                    : `${filtered.length} roles configured`}
                </CardDescription>
              </div>
              {can('roles.create') && (
                <Button onClick={() => setCreateOpen(true)} className='gap-2'>
                  <Plus className='w-4 h-4' /> Add Role
                </Button>
              )}
            </div>
            <div className='relative mt-2'>
              <Input
                placeholder='Search roles…'
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className='pl-4'
              />
            </div>
          </CardHeader>

          <CardContent className='p-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead><span className='sr-only'>Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className='text-center text-muted-foreground py-10'>
                      No roles found
                    </TableCell>
                  </TableRow>
                ) : isFetching ? (
                    Array.from({ length: pageData.length || 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><div className='flex items-center gap-2'><Skeleton className='h-7 w-7 rounded-md' /><Skeleton className='h-4 w-20' /></div></TableCell>
                        <TableCell><Skeleton className='h-3 w-40' /></TableCell>
                        <TableCell><div className='flex gap-1'><Skeleton className='h-5 w-16 rounded' /><Skeleton className='h-5 w-20 rounded' /></div></TableCell>
                        <TableCell><Skeleton className='h-7 w-7 rounded-md ml-auto' /></TableCell>
                      </TableRow>
                    ))
                ) : pageData.map((role) => (
                  <TableRow key={role.id}>
                    {/* Role name */}
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <div className='w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center'>
                          <Shield className='w-4 h-4 text-primary' />
                        </div>
                        <span className='font-medium text-sm'>{role.name}</span>
                      </div>
                    </TableCell>

                    {/* Description */}
                    <TableCell className='text-sm text-muted-foreground'>
                      {role.description}
                    </TableCell>

                    {/* Permissions badges */}
                    <TableCell>
                      <div className='flex flex-wrap gap-1 max-w-xs'>
                        {role.Permissions.length === 0 && (
                          <span className='text-xs text-muted-foreground'>No permissions</span>
                        )}
                        {role.Permissions.slice(0, 3).map((p) => (
                          <span key={p.id} className={`text-xs px-1.5 py-0.5 rounded font-mono ${permColor(p.name)}`}>
                            {p.name}
                          </span>
                        ))}
                        {role.Permissions.length > 3 && (
                          <span className='text-xs text-muted-foreground'>
                            +{role.Permissions.length - 3} more
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className='text-right'>
                      {(can('roles.update') || can('roles.delete')) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='icon' className='h-8 w-8'>
                              <MoreHorizontal className='w-4 h-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            {can('roles.update') && (
                              <DropdownMenuItem onClick={() => openEdit(role)}>
                                <Pencil className='w-4 h-4 mr-2' /> Edit
                              </DropdownMenuItem>
                            )}
                            {can('roles.update') && can('roles.delete') && <DropdownMenuSeparator />}
                            {can('roles.delete') && (
                              <DropdownMenuItem
                                className='text-destructive focus:text-destructive'
                                onClick={() => setDeleteRole(role)}
                              >
                                <Trash2 className='w-4 h-4 mr-2' /> Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages >= 1 && (
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
                    <ChevronLeft className='w-4 h-4' />
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
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
                    <ChevronRight className='w-4 h-4' />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Edit Dialog ───────────────────────────────────────────────────── */}
      <Dialog open={!!editRole} onOpenChange={(open) => { if (!open) { setEditRole(null); setPermSearch(''); } }}>
        <DialogContent className='sm:max-w-[520px] max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Pencil className='w-4 h-4' /> Edit Role
            </DialogTitle>
            <DialogDescription>Update role name, description and permissions.</DialogDescription>
          </DialogHeader>
          {editRole && (
            <RoleForm
              data={editRole}
              allPerms={allPerms}
              permSearch={permSearch}
              onPermSearch={setPermSearch}
              onChange={(f, v) => setEditRole((prev) => prev ? { ...prev, [f]: v } : prev)}
            />
          )}
          <DialogFooter>
            <Button variant='outline' onClick={() => { setEditRole(null); setPermSearch(''); }}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isUpdating} className='gap-2'>
              {isUpdating && <Loader2 className='w-4 h-4 animate-spin' />} Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Dialog ─────────────────────────────────────────────────── */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => { setCreateOpen(open); if (!open) { setNewRole(emptyRole()); setPermSearch(''); } }}
      >
        <DialogContent className='sm:max-w-[520px] max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Plus className='w-4 h-4' /> Create Role
            </DialogTitle>
            <DialogDescription>Define a new role and assign permissions.</DialogDescription>
          </DialogHeader>
          <RoleForm
            data={newRole}
            allPerms={allPerms}
            permSearch={permSearch}
            onPermSearch={setPermSearch}
            onChange={(f, v) => setNewRole((prev) => ({ ...prev, [f]: v }))}
          />
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => { setCreateOpen(false); setNewRole(emptyRole()); setPermSearch(''); }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isCreating || !newRole.name} className='gap-2'>
              {isCreating && <Loader2 className='w-4 h-4 animate-spin' />} Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ────────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteRole} onOpenChange={(open) => !open && setDeleteRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className='font-semibold text-foreground'>"{deleteRole?.name}"</span>?
              Users with this role will lose its permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2'
            >
              {isDeleting && <Loader2 className='w-4 h-4 animate-spin' />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}