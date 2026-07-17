import * as z from 'zod';

// Schema for updating profile (firstName, lastName, studentId)
export const updateProfileSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName:  z.string().min(1, { message: 'Last name is required' }),
  studentId: z.string().optional(),
});

// Schema for changing password
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required' }),
  newPassword:     z.string().min(8, { message: 'Password must be at least 8 characters' }),
  confirmPassword: z.string().min(1, { message: 'Please confirm your new password' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type UpdateProfileValues  = z.infer<typeof updateProfileSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
