'use client';

import { useAppSelector } from '@/hooks/hooks';
import { selectUser } from '@/store/authSlice';

/**
 * Permission-based access hook.
 *
 * Reads the logged-in user's resolved `permissions` array (returned by the
 * backend as the union of all role permissions + any direct assignments).
 *
 * Usage:
 *   const { can, isAdmin } = useRole();
 *   if (can('books.create')) { ... }
 */
export function useRole() {
  const user = useAppSelector(selectUser);

  const permissions = user?.permissions?.map((p) => p.toLowerCase()) ?? [];
  const roles       = user?.roles?.map((r) => r.toLowerCase()) ?? [];

  return {
    /** True if the user has the given permission name (e.g. 'books.delete') */
    can: (permission: string) => permissions.includes(permission.toLowerCase()),

    /** True if the user holds ALL of the given permissions */
    canAll: (...perms: string[]) =>
      perms.every((p) => permissions.includes(p.toLowerCase())),

    /** True if the user holds AT LEAST ONE of the given permissions */
    canAny: (...perms: string[]) =>
      perms.some((p) => permissions.includes(p.toLowerCase())),

    // Convenience role checks (use sparingly — prefer can() for UI guards)
    isAdmin:     roles.includes('admin'),
    isLibrarian: roles.includes('librarian'),
  };
}

