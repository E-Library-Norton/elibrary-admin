// src/services/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError
} from '@reduxjs/toolkit/query';
import { setAccessToken, clearUser } from '@/store/authSlice';

// Backend query for protected API calls with Bearer token
const backendQuery = fetchBaseQuery({
  baseUrl:
    process.env.NEXT_PUBLIC_BACKEND_URL ,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as { auth: { accessToken: string | null } }).auth
      .accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }
});

// Next.js query for auth routes (login, logout, refresh)
const nextjsQuery = fetchBaseQuery({
  baseUrl: '/api',
  credentials: 'include'
});

// Mutex one refresh at a time
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(
  apiArg: Parameters<BaseQueryFn>[1],
  extraOptions: Parameters<BaseQueryFn>[2]
): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
  try {
    const result = await nextjsQuery(
      { url: '/auth/refresh', method: 'POST' },
      apiArg,
      extraOptions
    );

    const newToken =
      (result.data as any)?.data?.accessToken ??
      (result.data as any)?.accessToken ??
      null;

    return newToken as string | null;
  } catch {
    return null;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
})();

  return refreshPromise;
}

// ── Smart wrapper — routes to correct query based on URL
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Detect if this is an auth route (login, logout, refresh)
  const url = typeof args === 'string' ? args : (args?.url ?? '');
  const isAuthRoute = url.includes('/auth/');

  //  Auth routes → Next.js (manages cookies)
  if (isAuthRoute) {
    const result = await nextjsQuery(args, api, extraOptions);

    // After login, extract accessToken from response and store in Redux
    // so protected backend calls can use it as Bearer token
    const accessToken =
      (result.data as any)?.data?.accessToken ??
      (result.data as any)?.accessToken ??
      null;

    if (accessToken) {
      api.dispatch(setAccessToken(accessToken));
    }

    return result;
  }

  // ── Protected routes → Express directly with Bearer token
  let result = await backendQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const newToken = await refreshAccessToken(api, extraOptions);

    if (newToken) {
      api.dispatch(setAccessToken(newToken));
      result = await backendQuery(args, api, extraOptions); // retry with new token
    } else {
      api.dispatch(clearUser());
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  keepUnusedDataFor: 300,      // 5 min default cache
  refetchOnFocus: false,        // don't spam API on tab switch
  refetchOnReconnect: true,     // do refetch after network recovery
  tagTypes: ['User', 'Role', 'Permission', 'Category', 'Department', 'MaterialType', 'Publisher', 'Author', 'Editor',
    'Book', 'Download', 'Review', 'Feedback'],
  endpoints: () => ({})
});
