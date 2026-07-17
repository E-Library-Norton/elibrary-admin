'use client';

import PageContainer from '@/components/layout/page-container';
import { teamInfoContent } from '@/config/infoconfig';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil, Trash2, Plus, KeyRound, Search, Loader2, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import {
  useGetPermissionsQuery,
  useCreatePermissionMutation,
  useUpdatePermissionMutation,
  useDeletePermissionMutation,
  type Permission,
} from '@/services/permissionApi';
import { useRole } from '@/hooks/use-role';

// ── Constants ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 5;

// ── Helpers ───────────────────────────────────────────────────────────────────
const getGroup = (name: string) => name.split('.')[0] ?? 'other';

const GROUP_COLORS: Record<string, { badge: string; row: string }> = {
  users:       { badge: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',         row: 'hover:bg-blue-50/50 dark:hover:bg-blue-950/20' },
  roles:       { badge: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800', row: 'hover:bg-purple-50/50 dark:hover:bg-purple-950/20' },
  permissions: { badge: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',   row: 'hover:bg-amber-50/50 dark:hover:bg-amber-950/20' },
  books:       { badge: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',    row: 'hover:bg-green-50/50 dark:hover:bg-green-950/20' },
  other:       { badge: 'bg-muted text-muted-foreground border-border', row: '' },
};

const gc = (name: string) => GROUP_COLORS[getGroup(name)] ?? GROUP_COLORS.other;
const emptyPerm = (): Omit<Permission, 'id'> => ({ name: '', description: '' });

// ── Skeleton loader ──────────────────────────────────────────────────────────
function PermTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div className='space-y-2'>
            <Skeleton className='h-5 w-28' />
            <Skeleton className='h-3 w-48' />
          </div>
          <Skeleton className='h-9 w-36 rounded-md' />
        </div>
        <Skeleton className='mt-4 h-9 w-full rounded-md' />
        <div className='flex gap-1.5 flex-wrap mt-2'>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className='h-7 w-16 rounded-md' />
          ))}
        </div>
      </CardHeader>
      <CardContent className='p-0'>
        {/* Group header skeleton */}
        <div className='px-4 py-2 bg-muted/40 border-y flex items-center gap-2'>
          <Skeleton className='h-5 w-16 rounded-full' />
          <Skeleton className='h-3 w-20' />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className='h-6 w-28 rounded' /></TableCell>
                <TableCell><Skeleton className='h-3 w-52' /></TableCell>
                <TableCell>
                  <div className='flex justify-end gap-2'>
                    <Skeleton className='h-8 w-8 rounded-md' />
                    <Skeleton className='h-8 w-8 rounded-md' />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ── Shared form ───────────────────────────────────────────────────────────────
function PermForm({
  data,
  onChange,
}: {
  data: Omit<Permission, 'id'>;
  onChange: (field: string, value: string) => void;
}) {
  return (
    <div className='space-y-4 py-2'>
      <div className='space-y-1'>
        <Label htmlFor='perm-name'>Permission Name</Label>
        <Input
          id='perm-name'
          value={data.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder='e.g. books.create'
          className='font-mono'
        />
        <p className='text-xs text-muted-foreground'>Use dot notation: resource.action (e.g. books.delete)</p>
      </div>
      <div className='space-y-1'>
        <Label htmlFor='perm-desc'>Description</Label>
        <Textarea
          id='perm-desc'
          value={data.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder='What does this permission allow?'
          rows={2}
        />
      </div>
      {data.name && (
        <div className='space-y-1'>
          <Label className='text-xs text-muted-foreground'>Preview</Label>
          <span className={`inline-flex text-xs px-2 py-1 rounded border font-mono ${gc(data.name).badge}`}>
            {data.name}
          </span>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function PermissionsPage() {
  const [search, setSearch]           = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [page, setPage]               = useState(1);
  const [editPerm, setEditPerm]       = useState<Permission | null>(null);
  const [createOpen, setCreateOpen]   = useState(false);
  const [deletePerm, setDeletePerm]   = useState<Permission | null>(null);
  const [newPerm, setNewPerm]         = useState(emptyPerm());

  const { can } = useRole();

  // ── RTK Query ─────────────────────────────────────────────────────────────
  const { data, isLoading, isFetching, isError } = useGetPermissionsQuery();
  const [createPermission, { isLoading: isCreating }] = useCreatePermissionMutation();
  const [updatePermission, { isLoading: isUpdating }] = useUpdatePermissionMutation();
  const [deletePermission, { isLoading: isDeleting }] = useDeletePermissionMutation();

  const permissions = data?.data ?? [];

  // ── Group filter tab list ──────────────────────────────────────────────────
  const allGroups = useMemo(
    () => ['all', ...Array.from(new Set(permissions.map((p) => getGroup(p.name))))],
    [permissions]
  );

  // ── Filtered list (search + group) ────────────────────────────────────────
  const filtered = useMemo(
    () =>
      permissions.filter((p) => {
        const matchSearch =
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.description?.toLowerCase().includes(search.toLowerCase());
        const matchGroup = groupFilter === 'all' || getGroup(p.name) === groupFilter;
        return matchSearch && matchGroup;
      }),
    [permissions, search, groupFilter]
  );

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Grouped map from current page ─────────────────────────────────────────
  const groupedMap = useMemo(
    () =>
      pageData.reduce<Record<string, Permission[]>>((acc, p) => {
        const g = getGroup(p.name);
        (acc[g] ??= []).push(p);
        return acc;
      }, {}),
    [pageData]
  );

  const handleSearch = (value: string) => { setSearch(value); setPage(1); };
  const handleGroup  = (g: string)      => { setGroupFilter(g); setPage(1); };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleSaveEdit = async () => {
    if (!editPerm) return;
    try {
      await updatePermission({ id: editPerm.id, data: { name: editPerm.name, description: editPerm.description } }).unwrap();
      setEditPerm(null);
    } catch (e) { console.error(e); }
  };

  const handleCreate = async () => {
    try {
      await createPermission({ name: newPerm.name, description: newPerm.description }).unwrap();
      setCreateOpen(false);
      setNewPerm(emptyPerm());
    } catch (e) { console.error(e); }
  };

  const handleDelete = async () => {
    if (!deletePerm) return;
    try {
      await deletePermission(deletePerm.id).unwrap();
      setDeletePerm(null);
    } catch (e) { console.error(e); }
  };

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (isLoading) return (
    <PageContainer pageTitle='Permissions' pageDescription='Manage all system permissions and their descriptions.' infoContent={teamInfoContent}>
      <div className='space-y-6'><PermTableSkeleton /></div>
    </PageContainer>
  );

  if (isError) return (
    <PageContainer pageTitle='Permissions' pageDescription='Manage all system permissions and their descriptions.' infoContent={teamInfoContent}>
      <div className='flex flex-col items-center justify-center h-64 gap-3'>
        <p className='text-destructive'>Failed to load permissions.</p>
        <Button variant='outline' size='sm' onClick={() => window.location.reload()}>Retry</Button>
      </div>
    </PageContainer>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <PageContainer
      pageTitle='Permissions'
      pageDescription='Manage all system permissions and their descriptions.'
      infoContent={teamInfoContent}
    >
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            {/* Title row */}
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle className='flex items-center gap-2'>
                  <KeyRound className='w-5 h-5' /> Permissions
                </CardTitle>
                <CardDescription className='mt-1'>
                  {isFetching
                    ? <Skeleton className='h-3 w-48 inline-block align-middle' />
                    : `${filtered.length} of ${permissions.length} permissions · ${allGroups.length - 1} groups`}
                </CardDescription>
              </div>
              {can('permissions.create') && (
                <Button onClick={() => setCreateOpen(true)} className='gap-2'>
                  <Plus className='w-4 h-4' /> Add Permission
                </Button>
              )}
            </div>

            {/* Search */}
            <div className='relative mt-4'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
              <Input
                className='pl-9'
                placeholder='Search permissions…'
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            {/* Group filter tabs */}
            <div className='flex gap-1.5 flex-wrap mt-2'>
              {allGroups.map((g) => (
                <Button
                  key={g}
                  size='sm'
                  variant={groupFilter === g ? 'default' : 'outline'}
                  className={`h-7 px-2.5 text-xs capitalize ${
                    groupFilter !== g && g !== 'all'
                      ? `${GROUP_COLORS[g]?.badge ?? GROUP_COLORS.other.badge} border`
                      : ''
                  }`}
                  onClick={() => handleGroup(g)}
                >
                  {g}
                  <span className='ml-1 opacity-60'>
                    {g === 'all'
                      ? permissions.length
                      : permissions.filter((p) => getGroup(p.name) === g).length}
                  </span>
                </Button>
              ))}
            </div>
          </CardHeader>

          <CardContent className='p-0'>
            {/* While refetching: show skeleton rows */}
            {isFetching ? (
              <>
                <div className='px-4 py-2 bg-muted/40 border-y flex items-center gap-2'>
                  <Skeleton className='h-5 w-16 rounded-full' />
                  <Skeleton className='h-3 w-20' />
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: pageData.length || 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className='h-6 w-28 rounded' /></TableCell>
                        <TableCell><Skeleton className='h-3 w-52' /></TableCell>
                        <TableCell><div className='flex justify-end gap-2'><Skeleton className='h-8 w-8 rounded-md' /><Skeleton className='h-8 w-8 rounded-md' /></div></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            ) : (
              <>
                {/* Empty state */}
                {Object.keys(groupedMap).length === 0 && (
                  <div className='text-center text-muted-foreground py-10 text-sm'>
                    No permissions found
                  </div>
                )}

            {/* Grouped sections */}
            {Object.entries(groupedMap).map(([group, perms]) => (
              <div key={group}>
                <div className='px-4 py-2 bg-muted/40 border-y flex items-center gap-2'>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize border ${
                      GROUP_COLORS[group]?.badge ?? GROUP_COLORS.other.badge
                    }`}
                  >
                    {group}
                  </span>
                  <span className='text-xs text-muted-foreground'>{perms.length} permissions</span>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {perms.map((perm) => (
                      <TableRow key={perm.id} className={gc(perm.name).row}>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded border font-mono font-medium ${gc(perm.name).badge}`}>
                            {perm.name}
                          </span>
                        </TableCell>
                        <TableCell className='text-sm text-muted-foreground'>
                          {perm.description}
                        </TableCell>
                        <TableCell className='text-right'>
                          {(can('permissions.update') || can('permissions.delete')) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant='ghost' size='icon' className='h-8 w-8'>
                                  <MoreHorizontal className='w-4 h-4' />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align='end'>
                                {can('permissions.update') && (
                                  <DropdownMenuItem onClick={() => setEditPerm({ ...perm })}>
                                    <Pencil className='mr-2 h-3.5 w-3.5' /> Edit
                                  </DropdownMenuItem>
                                )}
                                {can('permissions.update') && can('permissions.delete') && <DropdownMenuSeparator />}
                                {can('permissions.delete') && (
                                  <DropdownMenuItem
                                    className='text-destructive focus:text-destructive'
                                    onClick={() => setDeletePerm(perm)}
                                  >
                                    <Trash2 className='mr-2 h-3.5 w-3.5' /> Delete
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
              </div>
            ))}

            {/* Pagination */}
            {totalPages >= 1 && (
              <div className='flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t text-xs'>
                <span className='text-muted-foreground'>
                  Page {page} of {totalPages} · {filtered.length} total
                </span>
                <div className='flex items-center gap-1'>
                  <Button
                    variant='outline' size='icon' className='h-7 w-7'
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className='w-3.5 h-3.5' />
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                    <Button
                      key={p}
                      variant={page === p ? 'default' : 'outline'}
                      size='icon' className='h-7 w-7 text-xs'
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  ))}
                  <Button
                    variant='outline' size='icon' className='h-7 w-7'
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className='w-3.5 h-3.5' />
                  </Button>
                </div>
              </div>
            )}
            </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Edit Dialog ───────────────────────────────────────────────────── */}
      <Dialog open={!!editPerm} onOpenChange={(open) => !open && setEditPerm(null)}>
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Pencil className='w-4 h-4' /> Edit Permission
            </DialogTitle>
            <DialogDescription>Update the permission name and description.</DialogDescription>
          </DialogHeader>
          {editPerm && (
            <PermForm
              data={editPerm}
              onChange={(field, value) =>
                setEditPerm((prev) => (prev ? { ...prev, [field]: value } : prev))
              }
            />
          )}
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditPerm(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isUpdating} className='gap-1.5'>
              {isUpdating && <Loader2 className='w-3.5 h-3.5 animate-spin' />} Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Dialog ─────────────────────────────────────────────────── */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => { setCreateOpen(open); if (!open) setNewPerm(emptyPerm()); }}
      >
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Plus className='w-4 h-4' /> Create Permission
            </DialogTitle>
            <DialogDescription>Add a new permission to the system.</DialogDescription>
          </DialogHeader>
          <PermForm
            data={newPerm}
            onChange={(field, value) => setNewPerm((prev) => ({ ...prev, [field]: value }))}
          />
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => { setCreateOpen(false); setNewPerm(emptyPerm()); }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isCreating || !newPerm.name} className='gap-1.5'>
              {isCreating && <Loader2 className='w-3.5 h-3.5 animate-spin' />} Create Permission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ────────────────────────────────────────────────── */}
      <AlertDialog open={!!deletePerm} onOpenChange={(open) => !open && setDeletePerm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Permission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className='font-mono font-semibold text-foreground'>{deletePerm?.name}</span>?
              Roles using this permission will lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5'
            >
              {isDeleting && <Loader2 className='w-3.5 h-3.5 animate-spin' />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}