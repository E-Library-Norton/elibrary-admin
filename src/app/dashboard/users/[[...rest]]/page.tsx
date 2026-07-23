'use client';

import PageContainer from '@/components/layout/page-container';
import { teamInfoContent } from '@/config/infoconfig';
import { useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Trash2, UserPlus, Search, X, Loader2, MoreHorizontal, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useUploadUserAvatarMutation,
  type User,
  type Role,
  type CreateUserPayload,
} from '@/services/userApi';
import { useGetRolesQuery } from '@/services/roleApi';
import { useRole } from '@/hooks/use-role';
import { toast } from 'sonner';
import { getPasswordValidationError, PASSWORD_REQUIREMENTS } from '@/lib/password-validation';

// ── Skeleton loader for the table
function UserTableSkeleton() {
  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex flex-col justify-between gap-3 sm:flex-row sm:items-center'>
          <div className='space-y-1.5'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-3 w-32' />
          </div>
          <Skeleton className='h-8 w-24 rounded-md' />
        </div>
        <Skeleton className='mt-2 h-9 w-full rounded-md' />
      </CardHeader>
      <CardContent className='p-0'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Student ID</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 7 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className='flex items-center gap-3'>
                    <Skeleton className='h-8 w-8 rounded-full' />
                    <div className='space-y-1.5'>
                      <Skeleton className='h-3 w-28' />
                      <Skeleton className='h-2.5 w-36' />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className='h-3 w-20' />
                </TableCell>
                <TableCell>
                  <div className='flex gap-1'>
                    <Skeleton className='h-5 w-14 rounded-full' />
                    <Skeleton className='h-5 w-16 rounded-full' />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className='h-5 w-14 rounded-full' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-7 w-7 rounded-md' />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ── Helpers
const roleBadge = (name: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (name === 'admin') return 'destructive';
  if (name === 'librarian') return 'default';
  return 'secondary';
};

const initials = (u: User) => `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase() || u.username?.[0]?.toUpperCase() || '?';

const emptyUser = () => ({
  username: '',
  email: '',
  password: '',
  studentId: '',
  firstName: '',
  lastName: '',
  isActive: true,
  Roles: [] as Role[],
});

const pageNumbers = (cur: number, total: number): (number | '…')[] => {
  const out: (number | '…')[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - cur) <= 1) out.push(i);
    else if (out[out.length - 1] !== '…') out.push('…');
  }
  return out;
};

// ── Role Selector
function RoleSelector({ allRoles, selectedRoles, onChange }: { allRoles: Role[]; selectedRoles: Role[]; onChange: (r: Role[]) => void }) {
  return (
    <div className='space-y-2'>
      <Label>Roles</Label>
      <div className='bg-muted/30 flex min-h-9 flex-wrap gap-1.5 rounded-md border p-2'>
        {selectedRoles.length === 0 && <span className='text-muted-foreground self-center text-xs'>No roles assigned</span>}
        {selectedRoles.map((r) => (
          <Badge key={r.id} variant={roleBadge(r.name)} className='gap-1 pr-1'>
            {r.name}
            <button
              type='button'
              className='ml-0.5 flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-full opacity-70 hover:opacity-100 focus:outline-none'
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange(selectedRoles.filter((s) => s.id !== r.id));
              }}
              aria-label={`Remove ${r.name}`}
            >
              <X className='h-2.5 w-2.5 pointer-events-none' />
            </button>
          </Badge>
        ))}
      </div>
      <Select
        onValueChange={(val) => {
          const role = allRoles.find((r) => r.id === val);
          if (role && !selectedRoles.find((r) => r.id === role.id)) onChange([...selectedRoles, role]);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder='Add a role…' />
        </SelectTrigger>
        <SelectContent>
          {allRoles
            .filter((r) => !selectedRoles.find((s) => s.id === r.id))
            .map((r) => (
              <SelectItem key={r.id} value={r.id}>
                <span className='font-medium'>{r.name}</span>
                <span className='text-muted-foreground ml-2 text-xs'>{r.description}</span>
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  studentId?: string;
}

// ── User Form ────
function UserForm({
  data,
  allRoles,
  showPassword = false,
  userId,
  onAvatarFileChange,
  errors,
  onChange,
}: {
  data: Omit<User, 'id'> & { password?: string };
  allRoles: Role[];
  showPassword?: boolean;
  userId?: string;
  onAvatarFileChange?: (file: File | null) => void;
  errors?: FormErrors;
  onChange: (field: string, value: unknown) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setAvatarPreview(objectUrl);
      onAvatarFileChange?.(file);
    } else {
      setAvatarPreview(null);
      onAvatarFileChange?.(null);
    }
  };

  const currentAvatar = avatarPreview ?? (userId && data.avatar ? `/api/users/${userId}/avatar` : null);
  const displayInitials = `${data.firstName?.[0] ?? ''}${data.lastName?.[0] ?? ''}`.toUpperCase() || '?';

  return (
    <div className='space-y-3 py-1'>
      {/* Avatar picker — only shown in edit mode (userId present) */}
      {onAvatarFileChange && (
        <div className='flex items-center gap-4 pb-1'>
          <div className='relative'>
            {currentAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentAvatar} alt={displayInitials} className='h-16 w-16 rounded-full object-cover ring-2 ring-border' />
            ) : (
              <div className='bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold ring-2 ring-border'>
                {displayInitials}
              </div>
            )}
            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              className='bg-background border-border absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border shadow-sm hover:bg-muted'
              title='Change avatar'
            >
              <Camera className='h-3 w-3' />
            </button>
          </div>
          <div className='min-w-0'>
            <p className='text-sm font-medium'>Profile Photo</p>
            <p className='text-muted-foreground text-xs'>Click the camera icon to upload a new photo (max 5 MB)</p>
          </div>
          <input ref={fileInputRef} type='file' accept='image/*' className='hidden' onChange={handleFileChange} />
        </div>
      )}
      <div className='grid grid-cols-2 gap-3'>
        <div className='space-y-1'>
          <Label className={errors?.firstName ? 'text-destructive' : ''}>First Name</Label>
          <Input value={data.firstName} onChange={(e) => onChange('firstName', e.target.value)} placeholder='First' aria-invalid={!!errors?.firstName} />
          {errors?.firstName && <p className='text-destructive text-[0.8rem] font-medium'>{errors.firstName}</p>}
        </div>
        <div className='space-y-1'>
          <Label className={errors?.lastName ? 'text-destructive' : ''}>Last Name</Label>
          <Input value={data.lastName} onChange={(e) => onChange('lastName', e.target.value)} placeholder='Last' aria-invalid={!!errors?.lastName} />
          {errors?.lastName && <p className='text-destructive text-[0.8rem] font-medium'>{errors.lastName}</p>}
        </div>
      </div>
      <div className='space-y-1'>
        <Label className={errors?.username ? 'text-destructive' : ''}>
          Username <span className='text-destructive'>*</span>
        </Label>
        <Input value={data.username} onChange={(e) => onChange('username', e.target.value)} placeholder='username' aria-invalid={!!errors?.username} />
        {errors?.username && <p className='text-destructive text-[0.8rem] font-medium'>{errors.username}</p>}
      </div>
      <div className='space-y-1'>
        <Label className={errors?.email ? 'text-destructive' : ''}>
          Email <span className='text-destructive'>*</span>
        </Label>
        <Input type='email' value={data.email} onChange={(e) => onChange('email', e.target.value)} placeholder='user@edu.com' aria-invalid={!!errors?.email} />
        {errors?.email && <p className='text-destructive text-[0.8rem] font-medium'>{errors.email}</p>}
      </div>
      {showPassword && (
        <div className='space-y-1'>
          <Label className={errors?.password ? 'text-destructive' : ''}>
            Password <span className='text-destructive'>*</span>
          </Label>
          <Input
            type='password'
            value={(data as { password?: string }).password ?? ''}
            onChange={(e) => onChange('password', e.target.value)}
            placeholder='8-20 characters'
            aria-invalid={!!errors?.password}
          />
          {!errors?.password && <p className='text-muted-foreground text-xs'>{PASSWORD_REQUIREMENTS}</p>}
          {errors?.password && <p className='text-destructive text-[0.8rem] font-medium'>{errors.password}</p>}
        </div>
      )}
      <div className='grid grid-cols-2 gap-3'>
        <div className='space-y-1'>
          <Label className={errors?.studentId ? 'text-destructive' : ''}>Student ID</Label>
          <Input value={data.studentId} onChange={(e) => onChange('studentId', e.target.value)} placeholder='A20231879' aria-invalid={!!errors?.studentId} />
          {errors?.studentId && <p className='text-destructive text-[0.8rem] font-medium'>{errors.studentId}</p>}
        </div>
        <div className='space-y-1'>
          <Label>Status</Label>
          <Select value={data.isActive ? 'active' : 'inactive'} onValueChange={(v) => onChange('isActive', v === 'active')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='active'>Active</SelectItem>
              <SelectItem value='inactive'>Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <RoleSelector allRoles={allRoles} selectedRoles={data.Roles} onChange={(r) => onChange('Roles', r)} />
    </div>
  );
}

//
export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState(emptyUser());
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const { data, isLoading, isFetching, isError, refetch } = useGetUsersQuery({
    page,
    limit: 10,
    search,
  });
  const { data: rolesData } = useGetRolesQuery();

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [deleteUserMutation, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [uploadUserAvatar] = useUploadUserAvatarMutation();

  // pending avatar file selected in the edit dialog
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);

  const users = data?.data.users ?? [];
  const total = data?.data.pagination?.total ?? 0;
  const totalPages = data?.data.pagination?.totalPages ?? 1;
  const allRoles = rolesData?.data ?? [];

  // ── Open edit dialog
  const openEdit = (u: User) => {
    setEditUser({ ...u, Roles: [...u.Roles] });
    setPendingAvatarFile(null);
    setErrors({});
  };

  // ── Save edit
  const handleSaveEdit = async () => {
    if (!editUser) return;

    // ── Input Validation ──
    const validationErrors: FormErrors = {};

    const username = editUser.username.trim();
    if (!username) {
      validationErrors.username = 'Username is required';
    } else if (username.includes(' ')) {
      validationErrors.username = 'Username cannot contain spaces';
    } else if (username.length < 3) {
      validationErrors.username = 'Username must be at least 3 characters';
    }

    const email = editUser.email.trim();
    if (!email) {
      validationErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        validationErrors.email = 'Please enter a valid email address';
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);

    try {
      // ── Upload avatar first if a new file was selected ────────────────────
      if (pendingAvatarFile) {
        await uploadUserAvatar({
          id: editUser.id,
          file: pendingAvatarFile,
        }).unwrap();
        setPendingAvatarFile(null);
      }

      // ── Single PATCH: profile fields + full role sync in one request ──────
      await updateUser({
        id: editUser.id,
        data: {
          username: editUser.username,
          email: editUser.email,
          studentId: editUser.studentId,
          firstName: editUser.firstName,
          lastName: editUser.lastName,
          isActive: editUser.isActive,
          roleIds: editUser.Roles.map((r) => r.id),
        },
      }).unwrap();

      await refetch();
      toast.success('User updated successfully');
      setEditUser(null);
    } catch (err: any) {
      console.error('Save edit failed:', err);
      const errMsg = err?.data?.error?.message || err?.data?.message || 'Failed to update user';
      toast.error(errMsg);

      // Map backend conflict error to form field errors
      if (errMsg.toLowerCase().includes('username')) {
        setErrors((prev) => ({ ...prev, username: errMsg }));
      } else if (errMsg.toLowerCase().includes('email')) {
        setErrors((prev) => ({ ...prev, email: errMsg }));
      } else if (errMsg.toLowerCase().includes('student id')) {
        setErrors((prev) => ({ ...prev, studentId: errMsg }));
      }
    } finally {
      setIsSaving(false);
      setPendingAvatarFile(null);
    }
  };

  const { can } = useRole();

  // ── Create
  const handleCreate = async () => {
    // ── Input Validation ──
    const validationErrors: FormErrors = {};

    const username = newUser.username.trim();
    if (!username) {
      validationErrors.username = 'Username is required';
    } else if (username.includes(' ')) {
      validationErrors.username = 'Username cannot contain spaces';
    } else if (username.length < 3) {
      validationErrors.username = 'Username must be at least 3 characters';
    }

    const email = newUser.email.trim();
    if (!email) {
      validationErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        validationErrors.email = 'Please enter a valid email address';
      }
    }

    const password = newUser.password;
    if (!password) {
      validationErrors.password = 'Password is required';
    } else {
      const passwordError = getPasswordValidationError(password);
      if (passwordError) {
        validationErrors.password = passwordError;
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Optional fields whitespace validation
    const firstName = newUser.firstName?.trim();
    const lastName = newUser.lastName?.trim();
    const studentId = newUser.studentId?.trim();

    try {
      const payload: CreateUserPayload = {
        username,
        email,
        password,
        studentId: studentId || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      };
      const res = await createUser(payload).unwrap();

      if (newUser.Roles.length > 0) {
        await updateUser({
          id: res.data.id,
          data: { roleIds: newUser.Roles.map((r) => r.id) },
        }).unwrap();
      }

      // Refetch after create + role assignment
      await refetch();

      toast.success('User created successfully');
      setCreateOpen(false);
      setNewUser(emptyUser());
    } catch (err: any) {
      console.error('Failed to create user:', err);
      const errMsg = err?.data?.error?.message || err?.data?.message || 'Failed to create user';
      toast.error(errMsg);

      // Map backend conflict error to form field errors
      if (errMsg.toLowerCase().includes('username')) {
        setErrors((prev) => ({ ...prev, username: errMsg }));
      } else if (errMsg.toLowerCase().includes('email')) {
        setErrors((prev) => ({ ...prev, email: errMsg }));
      } else if (errMsg.toLowerCase().includes('student id')) {
        setErrors((prev) => ({ ...prev, studentId: errMsg }));
      }
    }
  };

  // ── Delete ───
  const handleDelete = async () => {
    if (!deleteUser) return;
    try {
      await deleteUserMutation(deleteUser.id).unwrap();
      await refetch();
      toast.success('User deleted successfully');
      setDeleteUser(null);
    } catch (err: any) {
      console.error('Delete user failed:', err);
      const errMsg = err?.data?.error?.message || err?.data?.message || 'Failed to delete user';
      toast.error(errMsg);
    }
  };

  if (isLoading)
    return (
      <PageContainer pageTitle='Users Management' pageDescription='Manage users, roles and access.' infoContent={teamInfoContent}>
        <div className='space-y-4'>
          <UserTableSkeleton />
        </div>
      </PageContainer>
    );

  if (isError)
    return (
      <PageContainer pageTitle='Users Management' pageDescription='Manage users, roles and access.' infoContent={teamInfoContent}>
        <div className='flex h-64 flex-col items-center justify-center gap-3'>
          <p className='text-destructive'>Failed to load users.</p>
          <Button variant='outline' size='sm' onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </PageContainer>
    );

  return (
    <PageContainer pageTitle='Users Management' pageDescription='Manage users, roles and access.' infoContent={teamInfoContent}>
      <div className='space-y-4'>
        <Card>
          <CardHeader className='pb-3'>
            <div className='flex flex-col justify-between gap-3 sm:flex-row sm:items-center'>
              <div>
                <CardTitle className='text-base'>All Users</CardTitle>
                <CardDescription className='text-xs'>
                  {isFetching ? <Skeleton className='h-3 w-28 inline-block align-middle' /> : `${total} total users`}
                </CardDescription>
              </div>
              {can('users.create') && (
                <Button
                  size='sm'
                  onClick={() => {
                    setErrors({});
                    setCreateOpen(true);
                  }}
                  className='gap-1.5 sm:self-start'
                >
                  <UserPlus className='h-3.5 w-3.5' /> Add User
                </Button>
              )}
            </div>
            <div className='relative'>
              <Search className='text-muted-foreground absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2' />
              <Input
                className='h-9 pl-8'
                placeholder='Search name, email, username, student ID…'
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </CardHeader>

          <CardContent className='p-0'>
            {/* Desktop table */}
            <div className='hidden overflow-x-auto md:block'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <span className='sr-only'>Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className='text-muted-foreground py-12 text-center'>
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : isFetching ? (
                    Array.from({ length: users.length || 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className='flex items-center gap-3'>
                            <Skeleton className='h-8 w-8 rounded-full' />
                            <div className='space-y-1.5'>
                              <Skeleton className='h-3 w-28' />
                              <Skeleton className='h-2.5 w-36' />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Skeleton className='h-3 w-20' />
                        </TableCell>
                        <TableCell>
                          <div className='flex gap-1'>
                            <Skeleton className='h-5 w-14 rounded-full' />
                            <Skeleton className='h-5 w-16 rounded-full' />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Skeleton className='h-5 w-14 rounded-full' />
                        </TableCell>
                        <TableCell>
                          <Skeleton className='h-7 w-7 rounded-md' />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className='flex min-w-0 items-center gap-3'>
                            {u.avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={`/api/users/${u.id}/avatar`}
                                alt={initials(u)}
                                className='h-8 w-8 shrink-0 rounded-full object-cover'
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty('display', 'flex');
                                }}
                              />
                            ) : null}
                            <div
                              className={`bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold${u.avatar ? ' hidden' : ''}`}
                            >
                              {initials(u)}
                            </div>
                            <div className='min-w-0'>
                              <p className='truncate text-sm leading-tight font-medium'>
                                {u.firstName} {u.lastName}
                              </p>
                              <p className='text-muted-foreground truncate text-xs'>
                                @{u.username} · {u.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className='font-mono text-xs'>{u.studentId || '—'}</span>
                        </TableCell>

                        {/*  Roles cell */}
                        <TableCell>
                          <div className='flex flex-wrap items-center gap-1'>
                            {u.Roles.length === 0 ? (
                              <span className='text-muted-foreground text-xs'>—</span>
                            ) : (
                              u.Roles.map((r) => (
                                <Badge key={r.id} variant={roleBadge(r.name)} className='text-xs whitespace-nowrap'>
                                  {r.name}
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant={u.isActive ? 'default' : 'outline'} className='text-xs'>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>

                        <TableCell className='text-right'>
                          {(can('users.update') || can('users.delete')) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant='ghost' size='icon' className='h-8 w-8'>
                                  <MoreHorizontal className='h-4 w-4' />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align='end'>
                                {can('users.update') && (
                                  <DropdownMenuItem onClick={() => openEdit(u)}>
                                    <Pencil className='mr-2 h-3.5 w-3.5' /> Edit
                                  </DropdownMenuItem>
                                )}
                                {can('users.update') && can('users.delete') && <DropdownMenuSeparator />}
                                {can('users.delete') && (
                                  <DropdownMenuItem className='text-destructive focus:text-destructive' onClick={() => setDeleteUser(u)}>
                                    <Trash2 className='mr-2 h-3.5 w-3.5' /> Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className='divide-y md:hidden'>
              {users.length === 0 && <p className='text-muted-foreground py-10 text-center text-sm'>No users found</p>}
              {users.map((u) => (
                <div key={u.id} className='flex items-start justify-between gap-3 p-4'>
                  <div className='flex min-w-0 gap-3'>
                    {u.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/users/${u.id}/avatar`}
                        alt={initials(u)}
                        className='h-9 w-9 shrink-0 rounded-full object-cover'
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty('display', 'flex');
                        }}
                      />
                    ) : null}
                    <div
                      className={`bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold${u.avatar ? ' hidden' : ''}`}
                    >
                      {initials(u)}
                    </div>
                    <div className='min-w-0 space-y-0.5'>
                      <p className='text-sm font-medium'>
                        {u.firstName} {u.lastName}
                      </p>
                      <p className='text-muted-foreground truncate text-xs'>{u.email}</p>
                      <p className='text-muted-foreground font-mono text-xs'>{u.studentId || '—'}</p>
                      <div className='flex flex-wrap gap-1 pt-1'>
                        {u.Roles.map((r) => (
                          <Badge key={r.id} variant={roleBadge(r.name)} className='h-4 px-1 text-xs'>
                            {r.name}
                          </Badge>
                        ))}
                        <Badge variant={u.isActive ? 'default' : 'outline'} className='h-4 px-1 text-xs'>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {(can('users.update') || can('users.delete')) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon' className='h-8 w-8 shrink-0'>
                          <MoreHorizontal className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        {can('users.update') && (
                          <DropdownMenuItem onClick={() => openEdit(u)}>
                            <Pencil className='mr-2 h-3.5 w-3.5' /> Edit
                          </DropdownMenuItem>
                        )}
                        {can('users.update') && can('users.delete') && <DropdownMenuSeparator />}
                        {can('users.delete') && (
                          <DropdownMenuItem className='text-destructive' onClick={() => setDeleteUser(u)}>
                            <Trash2 className='mr-2 h-3.5 w-3.5' /> Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages >= 1 && (
              <div className='flex flex-col items-center justify-between gap-2 border-t px-4 py-3 text-xs sm:flex-row'>
                <span className='text-muted-foreground'>
                  Page {page} of {totalPages} · {total} users
                </span>
                <div className='flex items-center gap-1'>
                  <Button variant='outline' size='icon' className='h-7 w-7' disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className='h-3.5 w-3.5' />
                  </Button>
                  {pageNumbers(page, totalPages).map((p, i) =>
                    p === '…' ? (
                      <span key={`d${i}`} className='text-muted-foreground px-1'>
                        …
                      </span>
                    ) : (
                      <Button key={p} variant={page === p ? 'default' : 'outline'} size='icon' className='h-7 w-7 text-xs' onClick={() => setPage(p as number)}>
                        {p}
                      </Button>
                    ),
                  )}
                  <Button variant='outline' size='icon' className='h-7 w-7' disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight className='h-3.5 w-3.5' />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editUser}
        onOpenChange={(o) => {
          if (!o && !isSaving) {
            setEditUser(null);
            setPendingAvatarFile(null);
            setErrors({});
          }
        }}
      >
        <DialogContent className='max-h-[90vh] w-full max-w-lg overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Pencil className='h-4 w-4' /> Edit User
            </DialogTitle>
            <DialogDescription>Update user details and roles.</DialogDescription>
          </DialogHeader>
          {editUser && (
            <UserForm
              data={editUser}
              allRoles={allRoles}
              userId={editUser.id}
              onAvatarFileChange={setPendingAvatarFile}
              errors={errors}
              onChange={(f, v) => {
                setEditUser((p) => (p ? { ...p, [f]: v } : p));
                setErrors((p) => ({ ...p, [f]: undefined }));
              }}
            />
          )}
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setEditUser(null);
                setPendingAvatarFile(null);
                setErrors({});
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving} className='gap-1.5'>
              {isSaving && <Loader2 className='h-3.5 w-3.5 animate-spin' />} Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) {
            setNewUser(emptyUser());
            setErrors({});
          }
        }}
      >
        <DialogContent className='max-h-[90vh] w-full max-w-lg overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <UserPlus className='h-4 w-4' /> Create User
            </DialogTitle>
            <DialogDescription>Add a new user and assign roles.</DialogDescription>
          </DialogHeader>
          <UserForm
            data={newUser}
            allRoles={allRoles}
            showPassword
            errors={errors}
            onChange={(f, v) => {
              setNewUser((p) => ({ ...p, [f]: v }));
              setErrors((p) => ({ ...p, [f]: undefined }));
            }}
          />
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setCreateOpen(false);
                setNewUser(emptyUser());
                setErrors({});
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isCreating} className='gap-1.5'>
              {isCreating && <Loader2 className='h-3.5 w-3.5 animate-spin' />} Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteUser} onOpenChange={(o) => !o && setDeleteUser(null)}>
        <AlertDialogContent className='max-w-sm'>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Delete{' '}
              <span className='text-foreground font-semibold'>
                {deleteUser?.firstName} {deleteUser?.lastName}
              </span>
              ? This cannot be undones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className='bg-destructive text-destructive-foreground gap-1.5'>
              {isDeleting && <Loader2 className='h-3.5 w-3.5 animate-spin' />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
