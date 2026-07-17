'use client';

// src/components/layout/user-nav.tsx
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useLogoutMutation } from '@/services/authApi';
import { clearUser, selectUser } from '@/store/authSlice';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Settings, LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner';

export function UserNav() {
  const router   = useRouter();
  const dispatch = useDispatch();
  const user     = useSelector(selectUser);

  const [logout, { isLoading }] = useLogoutMutation();

  const handleLogout = async () => {
    await logout();
    dispatch(clearUser());
    toast.success('Logged out successfully');
    router.push('/login');
  };

  // Build display name and initials
  const displayName =
    user?.firstName || user?.lastName
      ? `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()
      : user?.username ?? 'User';

  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  const email = user?.email ?? '';
  const roles = user?.roles ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='relative h-9 w-9 rounded-full'>
          <Avatar className='h-9 w-9 border-2 border-primary/20'>
            <AvatarImage src={user?.avatar ? '/api/auth/avatar' : undefined} alt={displayName} />
            <AvatarFallback className='bg-primary/10 text-primary font-semibold text-sm'>
              {initials || <User className='h-4 w-4' />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className='w-60' align='end' sideOffset={8} forceMount>
        {/* User info header */}
        <DropdownMenuLabel className='font-normal p-3'>
          <div className='flex items-center gap-3'>
            <Avatar className='h-10 w-10 border'>
              <AvatarImage src={user?.avatar ? '/api/auth/avatar' : undefined} alt={displayName} />
              <AvatarFallback className='bg-primary/10 text-primary font-semibold'>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className='min-w-0 flex-1'>
              <p className='text-sm font-semibold truncate'>{displayName}</p>
              <p className='text-muted-foreground text-xs truncate'>{email}</p>
              {roles.length > 0 && (
                <div className='flex gap-1 mt-1 flex-wrap'>
                  {roles.map((role) => (
                    <span
                      key={role}
                      className='text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium capitalize'
                    >
                      {role}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            className='cursor-pointer gap-2'
            onClick={() => router.push('/dashboard')}
          >
            <LayoutDashboard className='h-4 w-4' />
            Dashboard
          </DropdownMenuItem>
          <DropdownMenuItem
            className='cursor-pointer gap-2'
            onClick={() => router.push('/dashboard/profile')}
          >
            <User className='h-4 w-4' />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem
            className='cursor-pointer gap-2'
            onClick={() => router.push('/dashboard/settings')}
          >
            <Settings className='h-4 w-4' />
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className='cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10'
          onClick={handleLogout}
          disabled={isLoading}
        >
          <LogOut className='h-4 w-4' />
          {isLoading ? 'Logging out…' : 'Logout'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
