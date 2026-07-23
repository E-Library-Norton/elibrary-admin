import { z } from 'zod';

export const PASSWORD_REQUIREMENTS = 'Use 8-20 characters with an uppercase letter, a lowercase letter, a number, and a special character.';

export const strongPasswordSchema = z
  .string()
  .min(8, 'Password must contain at least 8 characters.')
  .max(20, 'Password must not exceed 20 characters.')
  .regex(/[a-z]/, 'Password must contain a lowercase letter.')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter.')
  .regex(/\d/, 'Password must contain a number.')
  .regex(/[^A-Za-z0-9\s]/, 'Password must contain a special character.')
  .regex(/^\S+$/, 'Password must not contain spaces.');

export function getPasswordValidationError(password: string) {
  const result = strongPasswordSchema.safeParse(password);
  return result.success ? null : result.error.issues[0]?.message;
}
