import { NavItem } from "@/types";

export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard/overview",
    icon: "dashboard",
    isActive: false,
    shortcut: ["d", "d"],
    items: [],
  },
  {
    title: "Book Management",
    url: "/dashboard/books",
    icon: "workspace",
    isActive: false,
    shortcut: ["b", "m"],
    items: [
      {
        title: "All Books",
        url: "/dashboard/books",
        icon: "workspace",
        shortcut: ["a", "b"],
      },
      {
        title: "Categories",
        url: "/dashboard/books/categories",
        // icon: 'journals',
        shortcut: ["b", "c"],
      },
      {
        title: "Departments",
        url: "/dashboard/books/departments",
        // icon: 'thesis',
        shortcut: ["b", "d"],
      },
      {
        title: "Material Types",
        url: "/dashboard/books/material-types",
        // icon: 'publications',
        shortcut: ["b", "m"],
      },
      {
        title: "Publishers",
        url: "/dashboard/books/publishers",
        // icon: 'journals',
        shortcut: ["b", "p"],
      },
      {
        title: "Authors",
        url: "/dashboard/books/authors",
        shortcut: ["b", "a"],
      },
      {
        title: "Editors",
        url: "/dashboard/books/editors",
        shortcut: ["b", "e"],
      },
    ],
  },
  {
    title: "User Management",
    url: "/dashboard/users",
    icon: "teams",
    shortcut: ["u", "m"],
    isActive: false,
    access: { role: "admin" }, // ← admin only; hidden from librarians
    items: [
      {
        title: "All Users",
        url: "/dashboard/users",
        icon: "teams",
        shortcut: ["a", "u"],
      },
      {
        title: "Roles",
        url: "/dashboard/users/roles",
        // icon: 'admins',
        shortcut: ["u", "r"],
      },
      {
        title: "Permissions",
        url: "/dashboard/users/permissions",
        // icon: 'permissions',
        shortcut: ["u", "p"],
      },
    ],
  },
  {
    title: "Downloads",
    url: "/dashboard/downloads",
    icon: "downloads",
    isActive: false,
    shortcut: ["d", "l"],
    items: [],
  },
  {
    title: "Feedback",
    url: "/dashboard/feedback",
    icon: "feedback",
    isActive: false,
    shortcut: ["f", "b"],
    items: [],
  },
  {
    title: "Reviews",
    url: "/dashboard/reviews",
    icon: "reviews",
    isActive: false,
    shortcut: ["r", "v"],
    items: [],
  },
  {
    title: "Reports",
    url: "/dashboard/reports",
    icon: "reports",
    isActive: false,
    shortcut: ["r", "p"],
    access: { permission: "reports.view" },
    items: [],
  },
  {
    title: "Account",
    url: "#",
    icon: "account",
    isActive: true,
    items: [
      {
        title: "Profile",
        url: "/dashboard/profile",
        icon: "profile",
        shortcut: ["u", "p"],
      },
      {
        title: "Settings",
        url: "/dashboard/settings",
        icon: "settings",
        shortcut: ["s", "t"],
      },
      {
        title: "Audit Logs",
        url: "/dashboard/audit-logs",
        icon: "audit",
        shortcut: ["a", "l"],
        access: { role: "admin" },
      },
    ],
  },
];
