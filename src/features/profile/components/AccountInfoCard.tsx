'use client';

// src/features/profile/components/AccountInfoCard.tsx
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { selectUser } from '@/store/authSlice';
import { setCredentials } from '@/store/authSlice';
import { useUpdateProfileMutation, useGetProfileQuery } from '@/services/authApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { UserCircle, Mail, GraduationCap, ShieldCheck, Pencil, Check, X, Loader2, Settings, BadgeCheck } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { selectAccessToken } from '@/store/authSlice';
import { getApiErrorMessage } from '@/lib/api-error';

type ProfileFieldErrors = {
  email?: string;
  studentId?: string;
};

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className='flex items-start gap-3 py-3'>
      <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted'>
        <Icon className='h-4 w-4 text-muted-foreground' />
      </div>
      <div className='min-w-0'>
        <p className='text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5'>{label}</p>
        <div className='text-sm font-medium text-foreground break-all'>{value}</div>
      </div>
    </div>
  );
}

export default function AccountInfoCard() {
  const user = useSelector(selectUser);
  const accessToken = useSelector(selectAccessToken);
  const dispatch = useDispatch();
  const searchParams = useSearchParams();

  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const { data: profileData, refetch: refetchProfile } = useGetProfileQuery();

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({});

  // Handle ?email_verified= redirect from backend
  useEffect(() => {
    const status = searchParams.get('email_verified');
    if (status === 'success') {
      toast.success('Email verified successfully! 🎉');
      // Refresh profile to get updated isEmailVerified
      refetchProfile().then((res) => {
        if (res.data?.data && accessToken) {
          const updated = 'user' in res.data.data ? res.data.data.user : res.data.data;
          dispatch(setCredentials({ user: updated as any, accessToken }));
        }
      });
      // Clean up the URL param
      window.history.replaceState({}, '', window.location.pathname);
    } else if (status === 'expired') {
      toast.error('Verification link expired. Please request a new one.');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (status === 'invalid') {
      toast.error('Invalid verification link.');
      window.history.replaceState({}, '', window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return null;

  const fullName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.username;

  const startEdit = () => {
    setFirstName(user.firstName ?? '');
    setLastName(user.lastName ?? '');
    setEmail(user.email ?? '');
    setStudentId(user.studentId ?? '');
    setFieldErrors({});
    setEditing(true);
  };

  const saveEdit = async () => {
    setFieldErrors({});

    try {
      const response = await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        studentId: studentId.trim(),
      }).unwrap();

      toast.success(response.message || 'Profile updated successfully!');
      setEditing(false);
    } catch (error: unknown) {
      const message = getApiErrorMessage(
        error,
        'Failed to update profile. Please try again.'
      );
      const normalizedMessage = message.toLowerCase();

      if (normalizedMessage.includes('email')) {
        setFieldErrors({ email: message });
      } else if (normalizedMessage.includes('student id')) {
        setFieldErrors({ studentId: message });
      }

      toast.error(message);
    }
  };


  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2 text-base'>
              <Settings className='h-4 w-4 text-primary' />
              Account Settings
            </CardTitle>
            <CardDescription className='mt-0.5'>Manage your account information</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {editing ? (
          <div className='space-y-4 py-1'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <Label htmlFor='firstName'>First Name</Label>
                <Input id='firstName' value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder='First name' />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='lastName'>Last Name</Label>
                <Input id='lastName' value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder='Last name' />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <Label htmlFor='email' className={fieldErrors.email ? 'text-destructive' : undefined}>Email</Label>
                <Input
                  id='email'
                  type='email'
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors((current) => ({ ...current, email: undefined }));
                  }}
                  placeholder='Email address'
                  aria-invalid={!!fieldErrors.email}
                />
                {fieldErrors.email && (
                  <p className='text-destructive text-xs font-medium'>{fieldErrors.email}</p>
                )}
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='studentId' className={fieldErrors.studentId ? 'text-destructive' : undefined}>Student ID</Label>
                <Input
                  id='studentId'
                  value={studentId}
                  onChange={(e) => {
                    setStudentId(e.target.value);
                    setFieldErrors((current) => ({ ...current, studentId: undefined }));
                  }}
                  placeholder='e.g. B20231579'
                  aria-invalid={!!fieldErrors.studentId}
                />
                {fieldErrors.studentId && (
                  <p className='text-destructive text-xs font-medium'>{fieldErrors.studentId}</p>
                )}
              </div>
            </div>
            <p className='text-xs text-muted-foreground'>Username cannot be changed from this page.</p>
          </div>
        ) : (
          <div className='divide-y divide-border'>
            <InfoRow icon={UserCircle} label='Full Name' value={fullName} />
            <InfoRow
              icon={Mail}
              label='Email'
              value={
                <div className='flex items-center justify-between gap-2 flex-wrap'>
                  <span className='break-all'>{user.email}</span>
                  {user.isEmailVerified && (
                    <span className='inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 shrink-0'>
                      <BadgeCheck className='h-3.5 w-3.5' /> Verified
                    </span>
                  )}
                </div>
              }
            />
            {user.studentId && <InfoRow icon={GraduationCap} label='Student ID' value={user.studentId} />}
            <InfoRow
              icon={ShieldCheck}
              label='Roles'
              value={
                user.roles?.length
                  ? <div className='flex flex-wrap gap-1.5 mt-0.5'>{user.roles.map((r) => <Badge key={r} variant='secondary' className='capitalize text-xs'>{r}</Badge>)}</div>
                  : <span className='text-muted-foreground italic text-sm'>No roles assigned</span>
              }
            />
          </div>
        )}
      </CardContent>
      <CardFooter className='border-t px-6 py-4 flex justify-between items-center bg-muted/10'>
        {!editing ? (
          <>
            <p className='text-xs text-muted-foreground'>Keep your info up to date.</p>
            <Button variant='outline' size='sm' className='gap-1.5' onClick={startEdit}>
              <Pencil className='h-3.5 w-3.5' /> Edit Profile
            </Button>
          </>
        ) : (
          <>
            <p className='text-xs text-muted-foreground'>Save your changes when ready.</p>
            <div className='flex gap-2'>
              <Button
                variant='ghost'
                size='sm'
                className='gap-1.5'
                onClick={() => {
                  setFieldErrors({});
                  setEditing(false);
                }}
                disabled={isLoading}
              >
                <X className='h-3.5 w-3.5' /> Cancel
              </Button>
              <Button size='sm' className='gap-1.5' onClick={saveEdit} disabled={isLoading}>
                {isLoading ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <Check className='h-3.5 w-3.5' />}
                Save Changes
              </Button>
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
