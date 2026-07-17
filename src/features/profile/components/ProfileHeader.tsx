'use client';

// src/features/profile/components/ProfileHeader.tsx
import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/authSlice';
import { useUploadAvatarMutation } from '@/services/authApi';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Camera, Loader2, GraduationCap } from 'lucide-react';

function getInitials(firstName?: string | null, lastName?: string | null, username?: string) {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName)             return firstName.slice(0, 2).toUpperCase();
  return (username ?? 'U').slice(0, 2).toUpperCase();
}

export default function ProfileHeader() {
  const user = useSelector(selectUser);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [uploadAvatar, { isLoading: uploading }] = useUploadAvatarMutation();

  if (!user) return null;

  const fullName  = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username;
  const initials  = getInitials(user.firstName, user.lastName, user.username);
  const avatarSrc = preview || (user.avatar ? `/api/auth/avatar?v=${avatarVersion}` : undefined);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Only image files are allowed'); return; }
    if (file.size > 5 * 1024 * 1024)    { toast.error('Image must be under 5 MB'); return; }
    setPreview(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append('avatar', file);
    const result = await uploadAvatar(formData);
    if ('error' in result) { toast.error('Upload failed. Please try again.'); setPreview(null); }
    else                   { toast.success('Profile picture updated successfully'); setPreview(null); setAvatarVersion((v) => v + 1); }
  };

  return (
    <div className='relative rounded-xl border bg-card px-6 py-8 shadow-sm overflow-hidden'>
      <div className='absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none' />
      <div className='relative flex flex-col sm:flex-row items-center sm:items-start gap-5'>

        {/* Clickable avatar */}
        <div
          className='relative group cursor-pointer shrink-0'
          onClick={() => fileInputRef.current?.click()}
          title='Click to change profile picture'
        >
          <Avatar className='h-24 w-24 ring-4 ring-primary/20 ring-offset-2 shadow-md'>
            <AvatarImage src={avatarSrc} alt={fullName} className='object-cover' />
            <AvatarFallback className='text-2xl font-bold bg-gradient-to-br from-primary to-primary/60 text-primary-foreground'>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className='absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
            {uploading ? <Loader2 className='h-6 w-6 text-white animate-spin' /> : <Camera className='h-6 w-6 text-white' />}
          </div>
          <div className='absolute -bottom-1 -right-1 rounded-full bg-primary p-1.5 shadow ring-2 ring-background'>
            <Camera className='h-3 w-3 text-primary-foreground' />
          </div>
        </div>

        <input ref={fileInputRef} type='file' accept='image/jpeg,image/png,image/webp' className='hidden'
          onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />

        {/* Name / ID / Roles */}
        <div className='flex-1 text-center sm:text-left'>
          <h1 className='text-2xl font-bold text-foreground tracking-tight'>{fullName}</h1>
          {user.studentId && (
            <p className='mt-1 flex items-center justify-center sm:justify-start gap-1.5 text-sm text-muted-foreground'>
              <GraduationCap className='h-4 w-4' />
              Student ID: <span className='font-medium text-foreground'>{user.studentId}</span>
            </p>
          )}
          <div className='mt-2.5 flex flex-wrap gap-1.5 justify-center sm:justify-start'>
            {((user as any).roles || (user as any).Roles)?.map((r: any) => {
              const roleName = typeof r === 'string' ? r : r.name;
              return (
                <Badge key={roleName} variant='secondary' className='capitalize text-xs px-2.5 py-0.5'>{roleName}</Badge>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
