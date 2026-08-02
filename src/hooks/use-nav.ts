"use client";

import { useMemo } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/authSlice";
import type { NavItem } from "@/types";

export function useFilteredNavItems(items: NavItem[]) {
  const user = useSelector(selectUser);
  const roles = useMemo(() => user?.roles ?? [], [user]);
  const permissions = useMemo(() => user?.permissions ?? [], [user]);

  const canSeeItem = useMemo(
    () =>
      (item: NavItem): boolean => {
        if (!item.access) return true;
        // role check: item requires a specific role
        const normalizedRoles = roles.map((role) => role.toLowerCase());
        const isAdmin = normalizedRoles.includes("admin");
        if (
          item.access.role &&
          !normalizedRoles.includes(item.access.role.toLowerCase())
        )
          return false;
        // permission check: item requires a specific permission string
        if (
          item.access.permission &&
          !isAdmin &&
          !permissions
            .map((permission) => permission.toLowerCase())
            .includes(item.access.permission.toLowerCase())
        )
          return false;
        return true;
      },
    [permissions, roles],
  );

  const filteredItems = useMemo(() => {
    return items.filter(canSeeItem).map((item) => {
      if (!item.items || item.items.length === 0) return item;
      return { ...item, items: item.items.filter(canSeeItem) };
    });
  }, [items, canSeeItem]);

  return filteredItems;
}
