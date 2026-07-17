'use client';

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/authSlice';
import type { NavItem } from '@/types';


export function useFilteredNavItems(items: NavItem[]) {
  const user  = useSelector(selectUser);
  const roles = useMemo(() => user?.roles ?? [], [user]);

  const canSeeItem = useMemo(
    () =>
      (item: NavItem): boolean => {
        if (!item.access) return true;
        // role check: item requires a specific role
        if (item.access.role && !roles.includes(item.access.role)) return false;
        // permission check: item requires a specific permission string
        if (item.access.permission && !roles.includes(item.access.permission)) return false;
        return true;
      },
    [roles]
  );

  const filteredItems = useMemo(() => {
    return items
      .filter(canSeeItem)
      .map((item) => {
        if (!item.items || item.items.length === 0) return item;
        return { ...item, items: item.items.filter(canSeeItem) };
      });
  }, [items, canSeeItem]);

  return filteredItems;
}
