'use client';

import Image from 'next/image';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';
import { useAppSelector } from '@/hooks/hooks';
import { selectUser } from '@/store/authSlice';

/** Maps raw role strings to human-readable labels */
const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Administrator',
  librarian: 'Librarian',
  student: 'Student',
  user: 'User'
};

function getRoleLabel(roles: string[]): string {
  if (roles.includes('superadmin')) return ROLE_LABELS['superadmin'] ?? 'Super Admin';
  if (roles.includes('admin')) return ROLE_LABELS['admin'];
  if (roles.includes('librarian')) return ROLE_LABELS['librarian'];
  if (roles.includes('student')) return ROLE_LABELS['student'];
  return ROLE_LABELS['user'] ?? 'Member';
}

export function OrgSwitcher() {
  const { state } = useSidebar();
  const user = useAppSelector(selectUser);

  const roleLabel = user?.roles ? getRoleLabel(user.roles) : 'Member';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              {/* Norton E-Library Logo */}
              <div className='flex aspect-square size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white'>
                <Image
                  src='/logo.webp'
                  alt='Norton E-Library Logo'
                  width={32}
                  height={32}
                  className='size-full object-contain'
                />
              </div>

              {/* Name & Role */}
              <div
                className={`grid flex-1 text-left text-sm leading-tight transition-all duration-200 ease-in-out ${
                  state === 'collapsed'
                    ? 'invisible max-w-0 overflow-hidden opacity-0'
                    : 'visible max-w-full opacity-100'
                }`}
              >
                <span className='truncate font-semibold'>Norton E-Library</span>
                <span className='text-muted-foreground truncate text-xs capitalize'>
                  {roleLabel}
                </span>
              </div>

            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg'
            align='start'
            side='right'
            sideOffset={4}
          >
            <DropdownMenuLabel className='flex items-center gap-2 p-2'>
              <div className='flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white'>
                <Image
                  src='/logo.webp'
                  alt='Norton E-Library Logo'
                  width={32}
                  height={32}
                  className='size-full object-contain'
                />
              </div>
              <div className='flex flex-col'>
                <span className='text-sm font-semibold'>Norton E-Library</span>
                <span className='text-muted-foreground text-xs capitalize'>
                  {roleLabel}
                </span>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
