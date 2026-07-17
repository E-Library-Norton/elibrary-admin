// src/store/notificationSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// ── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'activity'
  | 'book_created'
  | 'book_updated'
  | 'book_deleted'
  | 'review_created'
  | 'review_updated'
  | 'review_deleted';

export interface NotificationItem {
  id:        string;
  type:      NotificationType;
  title:     string;
  body:      string;
  time:      string; // ISO string for serialization
  read:      boolean;
  meta?: {
    bookId?:        string;
    bookTitle?:     string;
    bookCover?:     string | null;
    reviewId?:      string;
    rating?:        number;
    userName?:      string;
    userAvatar?:    string | null;
    averageRating?: number | null;
    totalReviews?:  number | null;
  };
}

interface NotificationState {
  items:    NotificationItem[];
  maxItems: number;
}

// ── Persistence helpers ──────────────────────────────────────────────────────

const STORAGE_KEY = 'elibrary_admin_notifications';
const MAX_ITEMS   = 100;

function loadFromStorage(): NotificationItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(items: NotificationItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch { /* storage full — ignore */ }
}

// ── Slice ────────────────────────────────────────────────────────────────────

const initialState: NotificationState = {
  items:    loadFromStorage(),
  maxItems: MAX_ITEMS,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification(state, action: PayloadAction<Omit<NotificationItem, 'id' | 'read'>>) {
      const item: NotificationItem = {
        ...action.payload,
        id:   `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        read: false,
      };
      state.items = [item, ...state.items.slice(0, state.maxItems - 1)];
      saveToStorage(state.items);
    },

    markAllRead(state) {
      state.items = state.items.map((n) => ({ ...n, read: true }));
      saveToStorage(state.items);
    },

    markOneRead(state, action: PayloadAction<string>) {
      const idx = state.items.findIndex((n) => n.id === action.payload);
      if (idx !== -1) {
        state.items[idx].read = true;
        saveToStorage(state.items);
      }
    },

    clearAll(state) {
      state.items = [];
      saveToStorage(state.items);
    },

    removeOne(state, action: PayloadAction<string>) {
      state.items = state.items.filter((n) => n.id !== action.payload);
      saveToStorage(state.items);
    },

    /** Hydrate from localStorage on mount (SSR safety) */
    hydrate(state) {
      state.items = loadFromStorage();
    },
  },
});

export const {
  addNotification,
  markAllRead,
  markOneRead,
  clearAll,
  removeOne,
  hydrate,
} = notificationSlice.actions;

// ── Selectors ────────────────────────────────────────────────────────────────

export const selectNotifications = (state: { notifications: NotificationState }) =>
  state.notifications.items;

export const selectUnreadCount = (state: { notifications: NotificationState }) =>
  state.notifications.items.filter((n) => !n.read).length;

export default notificationSlice.reducer;
