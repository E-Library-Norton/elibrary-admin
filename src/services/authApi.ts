// src/services/authApi.ts
import { api } from './api';
import { setCredentials, clearUser, type AuthUser } from '@/store/authSlice';

export interface LoginPayload    { identifier: string; password: string; }
export interface LoginResponse   { success: boolean; message: string; data: { user: AuthUser; accessToken: string }; }
export interface ProfileResponse { success: boolean; data: AuthUser | { user: AuthUser }; }
export interface LogoutResponse  { success: boolean; }
export interface AvatarResponse  { success: boolean; data: { avatar: string; public_id: string }; }
export interface ChangePasswordPayload { currentPassword: string; newPassword: string; confirmPassword: string; }
export interface ChangePasswordResponse { success: boolean; message: string; }
export interface UpdateProfilePayload { firstName?: string; lastName?: string; email?: string; studentId?: string; }
export interface UpdateProfileResponse { success: boolean; message: string; data: AuthUser; }

// ── 2FA types
export interface TwoFASetupResponse   { success: boolean; message: string; data: { qrCode: string; secret: string; otpauthUrl: string } }
export interface TwoFAVerifyPayload   { token?: string; recoveryCode?: string; tempToken?: string }
export interface TwoFAVerifyResponse  { success: boolean; message: string; data: { twoFactorEnabled?: boolean; recoveryCodes?: string[]; user?: AuthUser; accessToken?: string; refreshToken?: string } }
export interface TwoFADisablePayload  { token?: string; password?: string }
export interface TwoFAStatusResponse  { success: boolean; data: { twoFactorEnabled: boolean; hasFaceEnrolled: boolean; recoveryCodesRemaining: number } }
export interface TwoFALoginResponse   { success: boolean; message: string; data: { requires2FA?: boolean; tempToken?: string; hasFaceEnrolled?: boolean; user?: AuthUser; accessToken?: string; refreshToken?: string } }

export const authApi = api.injectEndpoints({overrideExisting: true,
  endpoints: (builder) => ({

    // POST /api/auth/login
    login: builder.mutation<LoginResponse, LoginPayload>({
      query: (credentials) => ({ url: '/auth/login', method: 'POST', body: credentials }),
    }),

    // GET /api/auth/profile
    getProfile: builder.query<ProfileResponse, void>({
      query: () => ({ url: '/auth/profile', method: 'GET' }),
    }),

    // POST /api/auth/logout
    logout: builder.mutation<LogoutResponse, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        try { await queryFulfilled; } finally { dispatch(clearUser()); }
      },
    }),

    // POST /api/auth/avatar   — upload image file → Cloudflare → update Redux
    uploadAvatar: builder.mutation<AvatarResponse, FormData>({
      query: (formData) => ({
        url: '/auth/avatar',
        method: 'POST',
        body: formData,
        formData: true,        // tells RTK not to set Content-Type (browser does it)
      }),
      async onQueryStarted(_args, { dispatch, getState, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const newAvatar = data?.data?.avatar;
          if (newAvatar) {
            const { auth } = (getState() as unknown) as { auth: { user: AuthUser | null; accessToken: string | null } };
            if (auth.user) {
              dispatch(setCredentials({ user: { ...auth.user, avatar: newAvatar }, accessToken: auth.accessToken ?? '' }));
            }
          }
        } catch { /* upload failed */ }
      },
    }),

    // DELETE /api/auth/avatar — remove avatar (sets to '')
    removeAvatar: builder.mutation<ProfileResponse, void>({
      query: () => ({ url: '/auth/avatar', method: 'DELETE' }),
      async onQueryStarted(_args, { dispatch, getState, queryFulfilled }) {
        try {
          await queryFulfilled;
          const { auth } = (getState() as unknown) as { auth: { user: AuthUser | null; accessToken: string | null } };
          if (auth.user) {
            dispatch(setCredentials({ user: { ...auth.user, avatar: '' }, accessToken: auth.accessToken ?? '' }));
          }
        } catch { /* remove failed */ }
      },
    }),

    // PUT /api/auth/change-password
    changePassword: builder.mutation<ChangePasswordResponse, ChangePasswordPayload>({
      query: (body) => ({
        url: '/auth/change-password',
        method: 'PUT',
        body,
      }),
    }),

    // PATCH /api/auth/profile
    updateProfile: builder.mutation<UpdateProfileResponse, UpdateProfilePayload>({
      query: (body) => ({
        url: '/auth/profile',
        method: 'PATCH',
        body,
      }),
      async onQueryStarted(_args, { dispatch, getState, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const updated = data?.data;
          if (updated) {
            const { auth } = (getState() as unknown) as { auth: { user: AuthUser | null; accessToken: string | null } };
            if (auth.user) {
              dispatch(setCredentials({ user: { ...auth.user, ...updated }, accessToken: auth.accessToken ?? '' }));
            }
          }
        } catch { /* update profile failed */ }
      },
    }),

    // ── Two-Factor Authentication endpoints
    // POST /api/auth/2fa/setup
    twoFASetup: builder.mutation<TwoFASetupResponse, void>({
      query: () => ({ url: '/auth/2fa/setup', method: 'POST' }),
    }),

    // POST /api/auth/2fa/verify-setup
    twoFAVerifySetup: builder.mutation<TwoFAVerifyResponse, { token: string }>({
      query: (body) => ({ url: '/auth/2fa/verify-setup', method: 'POST', body }),
    }),

    // POST /api/auth/2fa/verify  (login flow — no auth)
    twoFAVerify: builder.mutation<TwoFALoginResponse, TwoFAVerifyPayload>({
      query: (body) => ({ url: '/auth/2fa/verify', method: 'POST', body }),
    }),

    // POST /api/auth/2fa/disable
    twoFADisable: builder.mutation<TwoFAVerifyResponse, TwoFADisablePayload>({
      query: (body) => ({ url: '/auth/2fa/disable', method: 'POST', body }),
    }),

    // GET /api/auth/2fa/status
    twoFAStatus: builder.query<TwoFAStatusResponse, void>({
      query: () => ({ url: '/auth/2fa/status', method: 'GET' }),
    }),

    // POST /api/auth/2fa/face/enroll
    enrollFace: builder.mutation<{ success: boolean; data: { hasFaceEnrolled: boolean } }, { descriptor: number[] }>({
      query: (body) => ({ url: '/auth/2fa/face/enroll', method: 'POST', body }),
    }),

    // POST /api/auth/2fa/regenerate-recovery
    regenerateRecovery: builder.mutation<{ success: boolean; message: string; data: { recoveryCodes: string[] } }, { password: string }>({
      query: (body) => ({ url: '/auth/2fa/regenerate-recovery', method: 'POST', body }),
    }),
    // POST /api/auth/send-verification-email
    sendVerificationEmail: builder.mutation<{ success: boolean; message: string }, void>({
      query: () => ({ url: '/auth/send-verification-email', method: 'POST' }),
    }),
  }),
});

export const {
  useLoginMutation,
  useGetProfileQuery,
  useLogoutMutation,
  useUploadAvatarMutation,
  useRemoveAvatarMutation,
  useChangePasswordMutation,
  useUpdateProfileMutation,
  useTwoFASetupMutation,
  useTwoFAVerifySetupMutation,
  useTwoFAVerifyMutation,
  useTwoFADisableMutation,
  useTwoFAStatusQuery,
  useEnrollFaceMutation,
  useRegenerateRecoveryMutation,
  useSendVerificationEmailMutation,
} = authApi;
