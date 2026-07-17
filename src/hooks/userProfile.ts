'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface UserData {
  id: number;
  username: string;
  email: string;
  studentId?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  roles: string[];
  createdAt: string;
}

interface UserProfile {
  user: UserData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function UserProfile(): UserProfile {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/profile', {
        credentials: 'include',
      });

      if (!res.ok) {
        setUser(null);
        return;
      }

      // ResponseFormatter wraps the payload in { success, data } or { success, data: { ... } }
      // Adjust the path below if your ResponseFormatter shape differs.
      const json = await res.json();
      const raw = json.data ?? json;

      // Derive fullName so components can use it without string-concatenating everywhere
      const userData: UserData = {
        ...raw,
        fullName: `${raw.firstName} ${raw.lastName}`.trim(),
      };

      setUser(userData);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Best-effort — still clear local state even if request fails
    } finally {
      document.cookie = 'token=; Max-Age=0; path=/';
      document.cookie = 'auth-token=; Max-Age=0; path=/';
      document.cookie = 'session=; Max-Age=0; path=/';

      setUser(null);
      router.push('/login');
      router.refresh();
    }
  }, [router]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    refetch: fetchUser,
  };
}