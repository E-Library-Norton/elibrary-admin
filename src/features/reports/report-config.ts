import type { ReportType } from "@/services/reportApi";

export interface ReportColumn {
  key: string;
  label: string;
  type?: "date" | "number" | "percent" | "cover" | "rating" | "metadata";
}

export interface ReportDefinition {
  type: ReportType;
  label: string;
  description: string;
  permission: string;
  columns: ReportColumn[];
  sortOptions: Array<{ value: string; label: string }>;
}

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    type: "overview",
    label: "Overview",
    description: "Library-wide performance and engagement.",
    permission: "reports.view",
    columns: [
      { key: "title", label: "Top Book" },
      { key: "views", label: "Views", type: "number" },
      { key: "downloads", label: "Downloads", type: "number" },
      { key: "averageRating", label: "Rating", type: "rating" },
    ],
    sortOptions: [{ value: "views", label: "Most viewed" }],
  },
  {
    type: "users",
    label: "Users",
    description: "Registration, status, roles, and reading activity.",
    permission: "reports.users.view",
    columns: [
      { key: "studentId", label: "Student ID" },
      { key: "fullName", label: "Full Name" },
      { key: "username", label: "Username" },
      { key: "email", label: "Email" },
      { key: "role", label: "Role" },
      { key: "status", label: "Status" },
      { key: "registeredAt", label: "Registered", type: "date" },
      { key: "lastLogin", label: "Last Login", type: "date" },
      { key: "downloads", label: "Downloads", type: "number" },
      { key: "averageProgress", label: "Progress", type: "percent" },
    ],
    sortOptions: [
      { value: "registeredAt", label: "Newest users" },
      { value: "downloads", label: "Most downloads" },
      { value: "averageProgress", label: "Reading progress" },
    ],
  },
  {
    type: "logins",
    label: "User Logins",
    description: "Successful and failed login activity.",
    permission: "reports.logins.view",
    columns: [
      { key: "user", label: "User" },
      { key: "loginMethod", label: "Method" },
      { key: "status", label: "Status" },
      { key: "ipAddress", label: "IP Address" },
      { key: "deviceType", label: "Device" },
      { key: "browser", label: "Browser" },
      { key: "loggedInAt", label: "Login Time", type: "date" },
      { key: "failureReason", label: "Failure Reason" },
    ],
    sortOptions: [
      { value: "loggedInAt", label: "Newest attempts" },
      { value: "user", label: "User name" },
    ],
  },
  {
    type: "books",
    label: "Books",
    description: "Catalog inventory and engagement metrics.",
    permission: "reports.books.view",
    columns: [
      { key: "coverUrl", label: "Cover", type: "cover" },
      { key: "title", label: "Title" },
      { key: "isbn", label: "ISBN" },
      { key: "authors", label: "Authors" },
      { key: "category", label: "Category" },
      { key: "department", label: "Department" },
      { key: "status", label: "Status" },
      { key: "views", label: "Views", type: "number" },
      { key: "downloads", label: "Downloads", type: "number" },
      { key: "averageRating", label: "Rating", type: "rating" },
    ],
    sortOptions: [
      { value: "createdAt", label: "Newest books" },
      { value: "views", label: "Most viewed" },
      { value: "downloads", label: "Most downloaded" },
      { value: "averageRating", label: "Highest rated" },
    ],
  },
  {
    type: "book-views",
    label: "Book Views",
    description: "Lifetime aggregate book views.",
    permission: "reports.books.view",
    columns: [
      { key: "title", label: "Book" },
      { key: "category", label: "Category" },
      { key: "department", label: "Department" },
      { key: "totalViews", label: "Total Views", type: "number" },
      { key: "uniqueViewers", label: "Unique Viewers", type: "number" },
    ],
    sortOptions: [
      { value: "totalViews", label: "Most viewed" },
      { value: "title", label: "Title" },
    ],
  },
  {
    type: "downloads",
    label: "Downloads",
    description: "Book download history and usage.",
    permission: "reports.downloads.view",
    columns: [
      { key: "coverUrl", label: "Cover", type: "cover" },
      { key: "book", label: "Book" },
      { key: "user", label: "User" },
      { key: "studentId", label: "Student ID" },
      { key: "category", label: "Category" },
      { key: "department", label: "Department" },
      { key: "downloadedAt", label: "Downloaded At", type: "date" },
      { key: "ipAddress", label: "IP Address" },
    ],
    sortOptions: [
      { value: "downloadedAt", label: "Newest downloads" },
      { value: "downloadsPerBook", label: "Most downloaded books" },
    ],
  },
  {
    type: "reading-progress",
    label: "Reading Progress",
    description: "Reader completion and inactivity.",
    permission: "reports.reading.view",
    columns: [
      { key: "user", label: "User" },
      { key: "studentId", label: "Student ID" },
      { key: "book", label: "Book" },
      { key: "currentPage", label: "Page", type: "number" },
      { key: "totalPages", label: "Total Pages", type: "number" },
      { key: "progressPercentage", label: "Progress", type: "percent" },
      { key: "readingStatus", label: "Status" },
      { key: "lastReadAt", label: "Last Read", type: "date" },
      { key: "completedAt", label: "Completed", type: "date" },
    ],
    sortOptions: [
      { value: "lastReadAt", label: "Recently read" },
      { value: "progressPercentage", label: "Highest progress" },
    ],
  },
  {
    type: "reviews",
    label: "Reviews & Ratings",
    description: "Ratings, comments, and moderation status.",
    permission: "reports.reviews.view",
    columns: [
      { key: "book", label: "Book" },
      { key: "user", label: "User" },
      { key: "rating", label: "Rating", type: "rating" },
      { key: "comment", label: "Comment" },
      { key: "status", label: "Status" },
      { key: "createdAt", label: "Created", type: "date" },
    ],
    sortOptions: [
      { value: "createdAt", label: "Newest reviews" },
      { value: "rating", label: "Rating" },
    ],
  },
  {
    type: "feedback",
    label: "Feedback",
    description: "Feedback workload and resolution status.",
    permission: "reports.feedback.view",
    columns: [
      { key: "user", label: "User" },
      { key: "type", label: "Type" },
      { key: "subject", label: "Subject" },
      { key: "rating", label: "Rating", type: "rating" },
      { key: "status", label: "Status" },
      { key: "resolvedBy", label: "Resolved By" },
      { key: "createdAt", label: "Created", type: "date" },
    ],
    sortOptions: [
      { value: "createdAt", label: "Newest feedback" },
      { value: "status", label: "Status" },
    ],
  },
  {
    type: "authors",
    label: "Authors",
    description: "Author catalog reach and popularity.",
    permission: "reports.books.view",
    columns: [
      { key: "name", label: "Author" },
      { key: "nameKh", label: "Khmer Name" },
      { key: "totalBooks", label: "Books", type: "number" },
      { key: "totalViews", label: "Views", type: "number" },
      { key: "totalDownloads", label: "Downloads", type: "number" },
      { key: "averageRating", label: "Rating", type: "rating" },
      { key: "mostPopularBook", label: "Popular Book" },
    ],
    sortOptions: [
      { value: "totalBooks", label: "Most books" },
      { value: "totalViews", label: "Most viewed" },
      { value: "totalDownloads", label: "Most downloaded" },
    ],
  },
  ...(["categories", "departments"] as ReportType[]).map((type) => ({
    type,
    label: type === "categories" ? "Categories" : "Departments",
    description: `Performance grouped by ${type}.`,
    permission: "reports.books.view",
    columns: [
      {
        key: type === "categories" ? "category" : "department",
        label: type === "categories" ? "Category" : "Department",
      },
      { key: "totalBooks", label: "Books", type: "number" as const },
      { key: "activeBooks", label: "Active", type: "number" as const },
      { key: "totalViews", label: "Views", type: "number" as const },
      { key: "totalDownloads", label: "Downloads", type: "number" as const },
      { key: "averageRating", label: "Rating", type: "rating" as const },
      { key: "totalReaders", label: "Readers", type: "number" as const },
    ],
    sortOptions: [
      { value: "totalBooks", label: "Most books" },
      { value: "totalViews", label: "Most viewed" },
      { value: "totalDownloads", label: "Most downloaded" },
    ],
  })),
  {
    type: "activities",
    label: "Admin Activity",
    description: "Administrative and librarian audit activity.",
    permission: "reports.activities.view",
    columns: [
      { key: "actor", label: "Actor" },
      { key: "role", label: "Role" },
      { key: "action", label: "Action" },
      { key: "targetType", label: "Target Type" },
      { key: "targetName", label: "Target" },
      { key: "metadata", label: "Metadata", type: "metadata" },
      { key: "createdAt", label: "Date", type: "date" },
    ],
    sortOptions: [
      { value: "createdAt", label: "Newest activity" },
      { value: "actor", label: "Actor" },
      { value: "action", label: "Action" },
    ],
  },
];

export const REPORT_BY_TYPE = Object.fromEntries(
  REPORT_DEFINITIONS.map((definition) => [definition.type, definition]),
) as Record<ReportType, ReportDefinition>;

export const PERIOD_OPTIONS = [
  ["today", "Today"],
  ["yesterday", "Yesterday"],
  ["last_7_days", "Last 7 Days"],
  ["this_week", "This Week"],
  ["last_week", "Last Week"],
  ["this_month", "This Month"],
  ["last_month", "Last Month"],
  ["this_year", "This Year"],
  ["last_year", "Last Year"],
  ["custom", "Custom Date Range"],
] as const;

export function statusOptions(type: ReportType) {
  if (type === "users" || type === "books")
    return [
      ["all", "All statuses"],
      ["active", "Active"],
      ["inactive", "Inactive"],
    ] as const;
  if (type === "logins")
    return [
      ["all", "All attempts"],
      ["success", "Successful"],
      ["failed", "Failed"],
    ] as const;
  if (type === "reading-progress")
    return [
      ["all", "All progress"],
      ["In Progress", "In Progress"],
      ["Completed", "Completed"],
      ["Inactive Reading", "Inactive Reading"],
    ] as const;
  if (type === "reviews")
    return [
      ["all", "All reviews"],
      ["active", "Active"],
      ["deleted", "Deleted"],
    ] as const;
  if (type === "feedback")
    return [
      ["all", "All statuses"],
      ["new", "New"],
      ["reviewed", "Reviewed"],
      ["in_progress", "In Progress"],
      ["resolved", "Resolved"],
      ["closed", "Closed"],
    ] as const;
  return [] as const;
}
