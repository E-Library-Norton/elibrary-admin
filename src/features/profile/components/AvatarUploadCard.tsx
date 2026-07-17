'use client';

// src/features/profile/components/AvatarUploadCard.tsx
// Full avatar management: upload (drag/drop / click) + remove with confirmation.

import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/authSlice';
import { useUploadAvatarMutation, useRemoveAvatarMutation } from '@/services/authApi';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Camera, Trash2, Upload, Loader2 } from 'lucide-react';

function getInitials(firstName?: string | null, lastName?: string | null, username?: string) {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName)             return firstName.slice(0, 2).toUpperCase();
  return (username ?? 'U').slice(0, 2).toUpperCase();
}

export default function AvatarUploadCard() {
  const user = useSelector(selectUser);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview]   = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [uploadAvatar, { isLoading: uploading }] = useUploadAvatarMutation();
  const [removeAvatar, { isLoading: removing }]  = useRemoveAvatarMutation();
  const [avatarVersion, setAvatarVersion] = useState(0);

  if (!user) return null;

  const fullName  = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username;
  const initials  = getInitials(user.firstName, user.lastName, user.username);
  const hasAvatar = !!(preview || user.avatar);
  const avatarSrc = preview || (user.avatar ? `/api/auth/avatar?v=${avatarVersion}` : undefined);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed (jpg, png, webp)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }
    setPreview(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append('avatar', file);
    const result = await uploadAvatar(formData);
    if ('error' in result) {
      toast.error('Upload failed. Please try again.');
      setPreview(null);
    } else {
      toast.success('Profile picture updated successfully');
      setPreview(null);
      setAvatarVersion((v) => v + 1);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
    e.target.value = '';
  };

  const onDrop      = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); };
  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);

  const handleRemove = async () => {
    const result = await removeAvatar();
    if ('error' in result) {
      toast.error('Failed to remove avatar. Try again.');
    } else {
      setPreview(null);
      toast.success('Profile picture removed.');
    }
  };

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-base'>
          <Camera className='h-4 w-4 text-primary' />
          Profile Picture
        </CardTitle>
        <CardDescription>Click the avatar or drag an image to change it. JPG, PNG, WEBP · Max 5 MB</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex flex-col sm:flex-row items-center gap-6'>

          {/* Avatar drop zone */}
          <div
            className={`relative group cursor-pointer rounded-full transition-all duration-200
              ${isDragging ? 'ring-4 ring-primary ring-offset-2 scale-105' : ''}`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => fileInputRef.current?.click()}
            title='Click to change profile picture'
          >
            <Avatar className='h-28 w-28 ring-4 ring-primary/20 ring-offset-2 shadow'>
              <AvatarImage src={avatarSrc} alt={fullName} className='object-cover' />
              <AvatarFallback className='text-3xl font-bold bg-gradient-to-br from-primary to-primary/60 text-primary-foreground'>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className='absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
              {(uploading || removing)
                ? <Loader2 className='h-7 w-7 text-white animate-spin' />
                : <Camera className='h-7 w-7 text-white' />}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type='file'
            accept='image/jpeg,image/png,image/webp'
            className='hidden'
            onChange={onFileChange}
          />

          {/* Action buttons */}
          <div className='flex flex-col gap-2 min-w-[160px]'>
            <Button
              variant='outline'
              className='gap-2 w-full'
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || removing}
            >
              {uploading
                ? <><Loader2 className='h-4 w-4 animate-spin' /> Uploading…</>
                : <><Upload className='h-4 w-4' /> Upload photo</>}
            </Button>

            {hasAvatar && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant='ghost'
                    className='gap-2 w-full text-destructive hover:text-destructive hover:bg-destructive/10'
                    disabled={removing}
                  >
                    {removing
                      ? <><Loader2 className='h-4 w-4 animate-spin' /> Removing…</>
                      : <><Trash2 className='h-4 w-4' /> Remove photo</>}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove profile picture?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Your profile picture will be removed. You can upload a new one any time.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                      onClick={handleRemove}
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
