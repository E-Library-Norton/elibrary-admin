'use client';


import { useState } from 'react';
import { useChangePasswordMutation } from '@/services/authApi';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
import { toast }    from 'sonner';
import { KeyRound, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

function PasswordInput({
  id, label, value, onChange, placeholder, hint,
}: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; placeholder: string; hint?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className='space-y-1.5'>
      <Label htmlFor={id}>{label}</Label>
      <div className='relative'>
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className='pr-10'
          autoComplete='new-password'
        />
        <button
          type='button'
          tabIndex={-1}
          className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
          onClick={() => setShow((s) => !s)}
        >
          {show ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
        </button>
      </div>
      {hint && <p className='text-xs text-muted-foreground'>{hint}</p>}
    </div>
  );
}

export default function ChangePasswordCard() {
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All fields are required.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    try {
      await changePassword({ currentPassword, newPassword, confirmPassword }).unwrap();
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err?.data?.error?.message 
        || err?.data?.message 
        || 'Failed to change password. Please try again.';
      toast.error(msg);
    }
  };

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-base'>
          <ShieldCheck className='h-4 w-4 text-primary' />
          Security Settings
        </CardTitle>
        <CardDescription>Keep your account secure</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Section label */}
        <div className='flex items-center gap-2 mb-4'>
          <div className='flex h-8 w-8 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/30'>
            <KeyRound className='h-4 w-4 text-amber-600 dark:text-amber-400' />
          </div>
          <div>
            <p className='text-sm font-semibold'>Change Password</p>
            <p className='text-xs text-muted-foreground'>Ensure your account is using a strong, secure password.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4' noValidate>
          <PasswordInput
            id='currentPassword'
            label='Current Password'
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder='Enter current password'
          />
          <PasswordInput
            id='newPassword'
            label='New Password'
            value={newPassword}
            onChange={setNewPassword}
            placeholder='Enter new password'
            hint='Password must be at least 8 characters long.'
          />
          <PasswordInput
            id='confirmPassword'
            label='Confirm New Password'
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder='Confirm new password'
          />

          <Button type='submit' className='w-full sm:w-auto gap-2' disabled={isLoading}>
            {isLoading
              ? <><Loader2 className='h-4 w-4 animate-spin' /> Updating…</>
              : 'Update Password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
