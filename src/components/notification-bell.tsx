'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import {
  Bell, BookOpen, UserPlus, Trash2, Edit, Activity, X, Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSocket } from '@/hooks/use-socket';
import { formatDistanceToNow } from 'date-fns';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import {
  addNotification,
  markAllRead,
  clearAll,
  hydrate,
  selectNotifications,
  selectUnreadCount,
  type NotificationType,
} from '@/store/notificationSlice';
import { api } from '@/services/api';

// ── Socket event map ─────────────────────────────────────────────────────────

const EVENTS = {
  ACTIVITY_NEW:   'activity:new',
  BOOK_CREATED:   'book:created',
  BOOK_UPDATED:   'book:updated',
  BOOK_DELETED:   'book:deleted',
  REVIEW_CREATED: 'review:created',
  REVIEW_UPDATED: 'review:updated',
  REVIEW_DELETED: 'review:deleted',
} as const;

// ── Review notification payload (matches backend) ────────────────────────────

interface ReviewPayload {
  review?: {
    id?:        number;
    bookId?:    number;
    rating?:    number;
    comment?:   string;
    createdAt?: string;
  };
  bookId?:        number;
  bookTitle?:     string;
  bookCover?:     string | null;
  userName?:      string;
  userAvatar?:    string | null;
  averageRating?: number | null;
  totalReviews?:  number | null;
  reviewId?:      number;
}

// ── Icon mapper ──────────────────────────────────────────────────────────────

function getIcon(type: NotificationType) {
  const map: Record<NotificationType, React.ReactNode> = {
    book_created:   <BookOpen className="w-4 h-4 text-emerald-500" />,
    book_updated:   <Edit className="w-4 h-4 text-blue-500" />,
    book_deleted:   <Trash2 className="w-4 h-4 text-red-500" />,
    review_created: <Star className="w-4 h-4 text-amber-500 fill-amber-500" />,
    review_updated: <Star className="w-4 h-4 text-blue-500" />,
    review_deleted: <Trash2 className="w-4 h-4 text-orange-500" />,
    activity:       <Activity className="w-4 h-4 text-[#20659C]" />,
  };
  return map[type] ?? <Activity className="w-4 h-4 text-[#20659C]" />;
}

// ── Stars helper ─────────────────────────────────────────────────────────────

function renderStars(rating: number) {
  return '★'.repeat(Math.min(5, Math.max(0, rating))) + '☆'.repeat(5 - Math.min(5, Math.max(0, rating)));
}

// ═════════════════════════════════════════════════════════════════════════════

export function NotificationBell() {
  const dispatch     = useAppDispatch();
  const { on, connected } = useSocket();
  const notifications = useAppSelector(selectNotifications);
  const unreadCount   = useAppSelector(selectUnreadCount);
  const [open, setOpen] = React.useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Hydrate from localStorage on mount (SSR-safe)
  useEffect(() => { dispatch(hydrate()); }, [dispatch]);

  // ── Helper: push a notification to the store ──────────────────────────────

  const push = useCallback(
    (
      type: NotificationType,
      title: string,
      body: string,
      meta?: Record<string, unknown>,
    ) => {
      dispatch(addNotification({ type, title, body, time: new Date().toISOString(), meta }));
    },
    [dispatch],
  );

  // ── Auto-invalidate RTK cache when review events arrive ───────────────────

  const invalidateReviewCache = useCallback(() => {
    dispatch(api.util.invalidateTags([{ type: 'Review', id: 'LIST' }]));
  }, [dispatch]);

  // ── Socket listeners ──────────────────────────────────────────────────────

  useEffect(() => {
    const offs: (() => void)[] = [];

    // Activity
    offs.push(
      on(EVENTS.ACTIVITY_NEW, (data: unknown) => {
        const d = data as { activity?: { action?: string; targetType?: string; targetName?: string } };
        const a = d.activity;
        if (!a) return;
        push('activity', 'New Activity', `${a.action} ${a.targetType}: ${a.targetName ?? ''}`);
      }),
    );

    // Books
    offs.push(
      on(EVENTS.BOOK_CREATED, (data: unknown) => {
        const d = data as { book?: { title?: string } };
        push('book_created', 'Book Added', `"${d.book?.title ?? 'Untitled'}" was added to the library`);
      }),
    );

    offs.push(
      on(EVENTS.BOOK_UPDATED, (data: unknown) => {
        const d = data as { book?: { title?: string } };
        push('book_updated', 'Book Updated', `"${d.book?.title ?? 'Untitled'}" was updated`);
      }),
    );

    offs.push(
      on(EVENTS.BOOK_DELETED, (data: unknown) => {
        const d = data as { bookId?: number };
        push('book_deleted', 'Book Deleted', `Book #${d.bookId ?? '?'} was removed`);
      }),
    );

    // ── Review events (rich payload from backend) ───────────────────────────

    offs.push(
      on(EVENTS.REVIEW_CREATED, (data: unknown) => {
        const d = data as ReviewPayload;
        const rating = d.review?.rating ?? 0;
        const stars  = renderStars(rating);

        push(
          'review_created',
          '⭐ New Review',
          `${d.userName ?? 'A member'} rated "${d.bookTitle ?? 'a book'}" ${stars} (${rating}/5)`,
          {
            bookId:        String(d.bookId ?? d.review?.bookId ?? ''),
            bookTitle:     d.bookTitle,
            bookCover:     d.bookCover,
            reviewId:      String(d.review?.id ?? ''),
            rating,
            userName:      d.userName,
            userAvatar:    d.userAvatar,
            averageRating: d.averageRating,
            totalReviews:  d.totalReviews,
          },
        );

        // Auto-refresh review cache
        invalidateReviewCache();
      }),
    );

    offs.push(
      on(EVENTS.REVIEW_UPDATED, (data: unknown) => {
        const d = data as ReviewPayload;

        push(
          'review_updated',
          'Review Updated',
          `${d.userName ?? 'A member'} updated their review on "${d.bookTitle ?? 'a book'}"`,
          {
            bookId:        String(d.bookId ?? d.review?.bookId ?? ''),
            bookTitle:     d.bookTitle,
            reviewId:      String(d.review?.id ?? ''),
            rating:        d.review?.rating,
            userName:      d.userName,
            averageRating: d.averageRating,
            totalReviews:  d.totalReviews,
          },
        );

        invalidateReviewCache();
      }),
    );

    offs.push(
      on(EVENTS.REVIEW_DELETED, (data: unknown) => {
        const d = data as ReviewPayload;

        push(
          'review_deleted',
          'Review Deleted',
          `Review on "${d.bookTitle ?? `Book #${d.bookId ?? '?'}`}" was removed`,
          {
            reviewId:  String(d.reviewId ?? ''),
            bookId:    String(d.bookId ?? ''),
            bookTitle: d.bookTitle,
          },
        );

        invalidateReviewCache();
      }),
    );

    return () => offs.forEach((off) => off());
  }, [on, push, invalidateReviewCache]);

  // ── Close on outside click ────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleBellClick = () => {
    const next = !open;
    setOpen(next);
    if (next) dispatch(markAllRead());
  };

  const handleClear = () => dispatch(clearAll());

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={handleBellClick}
        className="relative p-2 rounded-lg hover:bg-accent transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {/* Connection status */}
        <span
          className={cn(
            'absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-background',
            connected ? 'bg-emerald-500' : 'bg-gray-400',
          )}
        />
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 animate-in zoom-in-75">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <h3 className="text-sm font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={handleClear}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear all
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-accent transition-colors">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto overscroll-contain">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bell className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">No notifications yet</p>
                <p className="text-xs mt-1 opacity-60">Real-time events will appear here</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30',
                    !n.read && 'bg-primary/5',
                  )}
                >
                  <div className="mt-0.5 shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                    {/* Extra meta for review notifications */}
                    {n.meta?.averageRating != null && (
                      <p className="text-[10px] text-amber-600 mt-0.5">
                        Avg: {n.meta.averageRating}/5 · {n.meta.totalReviews ?? 0} review{(n.meta.totalReviews ?? 0) !== 1 ? 's' : ''}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(new Date(n.time), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
