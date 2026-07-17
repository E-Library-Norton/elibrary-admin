'use client';
// src/app/(auth)/login/page.tsx

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, ShieldAlert, GraduationCap, ShieldCheck, ArrowLeft, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 2 * 60 * 1000; // 2 minutes (mirrors backend window)

function getLockoutKey(identifier: string) {
  return `login_lockout_${identifier.toLowerCase().trim()}`;
}

function getStoredLockout(identifier: string): { until: number; attempts: number } | null {
  try {
    const raw = sessionStorage.getItem(getLockoutKey(identifier));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setStoredLockout(identifier: string, attempts: number, until: number) {
  try {
    sessionStorage.setItem(getLockoutKey(identifier), JSON.stringify({ until, attempts }));
  } catch { /* ignore */ }
}

function clearStoredLockout(identifier: string) {
  try { sessionStorage.removeItem(getLockoutKey(identifier)); } catch { /* ignore */ }
}

export default function LoginPage() {
  const { login, complete2FA, isLoggingIn } = useAuth();
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({ identifier: '', password: '' });

  // ── Client-side brute-force lockout ────────────────────────────────────────
  const [attemptCount, setAttemptCount] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Restore lockout from sessionStorage on mount / when identifier changes
  useEffect(() => {
    const stored = getStoredLockout(form.identifier);
    if (stored && stored.until > Date.now()) {
      setLockedUntil(stored.until);
      setAttemptCount(stored.attempts);
    } else {
      setLockedUntil(null);
    }
  }, [form.identifier]);

  // Countdown ticker
  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) { setLockedUntil(null); setAttemptCount(0); setError(''); }
      else setCountdown(remaining);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const recordFailure = useCallback((identifier: string) => {
    const stored = getStoredLockout(identifier);
    const newCount = (stored?.attempts ?? 0) + 1;
    const until = newCount >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : (stored?.until ?? 0);
    setAttemptCount(newCount);
    if (newCount >= MAX_ATTEMPTS) {
      setLockedUntil(until);
      setStoredLockout(identifier, newCount, until);
    } else {
      setStoredLockout(identifier, newCount, until);
    }
  }, []);

  const isLocked = !!lockedUntil && lockedUntil > Date.now();

  // 2FA state
  const [twoFAState, setTwoFAState] = useState<{
    active: boolean;
    tempToken: string;
    hasFaceEnrolled: boolean;
  }>({ active: false, tempToken: '', hasFaceEnrolled: false });
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [useRecovery, setUseRecovery] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isLocked) return;
    try {
      const result = await login(form);
      // Success — clear any stored lockout
      clearStoredLockout(form.identifier);
      setAttemptCount(0);
      // Check if 2FA is required
      if (result && 'requires2FA' in result && result.requires2FA) {
        setTwoFAState({
          active: true,
          tempToken: result.tempToken,
          hasFaceEnrolled: result.hasFaceEnrolled,
        });
      }
    } catch (err: any) {
      const status = err?.status ?? err?.originalStatus;
      if (status === 429) {
        // Backend rate-limited — lock the UI for the full window
        const until = Date.now() + LOCKOUT_MS;
        setLockedUntil(until);
        setAttemptCount(MAX_ATTEMPTS);
        setStoredLockout(form.identifier, MAX_ATTEMPTS, until);
        setError('');
        return;
      }
      recordFailure(form.identifier);
      const message =
        err?.data?.message ||
        err?.data?.error?.message ||
        err?.message ||
        'Invalid credentials. Please try again.';
      setError(message);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1);
    setOtpCode(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otpCode];
    for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
    setOtpCode(newOtp);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (useRecovery) {
      const code = recoveryInput.trim();
      if (!code) { setError('Please enter a recovery code'); return; }
      setIsVerifying(true);
      try {
        await complete2FA(twoFAState.tempToken, undefined, code);
      } catch (err: any) {
        const message = err?.data?.message || err?.message || 'Invalid recovery code.';
        setError(message);
        setRecoveryInput('');
      } finally {
        setIsVerifying(false);
      }
      return;
    }

    const code = otpCode.join('');
    if (code.length !== 6) { setError('Please enter the full 6-digit code'); return; }

    setIsVerifying(true);
    try {
      await complete2FA(twoFAState.tempToken, code);
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Invalid OTP code. Please try again.';
      setError(message);
      setOtpCode(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBack = () => {
    setTwoFAState({ active: false, tempToken: '', hasFaceEnrolled: false });
    setOtpCode(['', '', '', '', '', '']);
    setUseRecovery(false);
    setRecoveryInput('');
    setError('');
  };

  return (
    <div
      className='relative min-h-screen flex items-center justify-center overflow-hidden'
      style={{ backgroundImage: "url('/assets/nu-building.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Dark overlay */}
      <div className='absolute inset-0 bg-black/65 backdrop-blur-[2px]' />
      {/* Vignette gradient */}
      <div className='absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20' />

      <div className='relative z-10 w-full max-w-md px-4'>

        {/* ── Branding ── */}
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md mb-4 shadow-xl'>
            <img src="/logo.webp" alt="E-Library Norton" width={40} height={40} className="w-full h-full object-contain" />
          </div>
          <h1 className='text-3xl font-extrabold text-white tracking-tight'>E-Library NU</h1>
          <p className='text-white/50 mt-1.5 text-sm flex items-center justify-center gap-1.5'>
            <GraduationCap className='w-3.5 h-3.5' />
            Admin &amp; Librarian Portal
          </p>
        </div>

        {/* ── Glass card ── */}
        <div className='bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl shadow-black/50 px-8 py-8'>

          {/* ── 2FA Verification Screen ── */}
          {twoFAState.active ? (
            <>
              <button onClick={handleBack} className='flex items-center gap-1 text-white/50 hover:text-white/80 text-sm mb-4 transition-colors'>
                <ArrowLeft className='w-3.5 h-3.5' /> Back to login
              </button>
              <div className='flex items-center gap-2 mb-1'>
                <ShieldCheck className='w-5 h-5 text-emerald-400' />
                <h2 className='text-xl font-semibold text-white'>Two-Factor Authentication</h2>
              </div>
              <p className='text-white/45 text-sm mb-6'>
                {useRecovery
                  ? 'Enter one of your recovery codes'
                  : 'Enter the 6-digit code from your authenticator app'}
              </p>

              <form onSubmit={handleVerify2FA} className='space-y-5'>
                {useRecovery ? (
                  /* Recovery code input */
                  <div className='space-y-1.5'>
                    <Label className='text-white/75 text-sm font-medium'>Recovery Code</Label>
                    <Input
                      value={recoveryInput}
                      onChange={(e) => setRecoveryInput(e.target.value.toUpperCase())}
                      placeholder='XXXX-XXXX'
                      disabled={isVerifying}
                      autoFocus
                      className='bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-white/30 focus-visible:border-white/40 h-10 font-mono text-center tracking-widest text-lg'
                    />
                  </div>
                ) : (
                  /* OTP Input Boxes */
                  <div className='flex gap-2 justify-center' onPaste={handleOtpPaste}>
                    {otpCode.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type='text'
                        inputMode='numeric'
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        disabled={isVerifying}
                        className='w-11 h-13 text-center text-xl font-bold bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/50 transition-all disabled:opacity-50'
                      />
                    ))}
                  </div>)}

                {/* Toggle between OTP and recovery code */}
                <button
                  type='button'
                  onClick={() => { setUseRecovery(!useRecovery); setError(''); setOtpCode(['', '', '', '', '', '']); setRecoveryInput(''); }}
                  className='w-full text-center text-white/40 hover:text-white/70 text-xs transition-colors'
                >
                  {useRecovery ? '← Use authenticator code instead' : 'Lost your phone? Use a recovery code'}
                </button>
                {/* Error */}
                {error && (
                  <div className='flex items-start gap-2.5 bg-red-500/15 border border-red-400/30 text-red-300 text-sm rounded-xl px-3.5 py-3'>
                    <ShieldAlert className='w-4 h-4 mt-0.5 shrink-0' />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type='submit'
                  disabled={isVerifying || (useRecovery ? !recoveryInput.trim() : otpCode.join('').length !== 6)}
                  className='w-full bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700 font-semibold h-11 shadow-lg shadow-black/20'
                >
                  {isVerifying ? (
                    <span className='flex items-center gap-2'>
                      <Loader2 className='w-4 h-4 animate-spin' /> Verifying…
                    </span>
                  ) : 'Verify & Sign In'}
                </Button>
              </form>
            </>
          ) : (
            /* ── Normal Login Form ── */
            <>
              <h2 className='text-xl font-semibold text-white mb-0.5'>Welcome back</h2>
              <p className='text-white/45 text-sm mb-6'>Sign in to access the dashboard</p>

              <form onSubmit={handleSubmit} className='space-y-5'>

                {/* Identifier */}
                <div className='space-y-1.5'>
                  <Label className='text-white/75 text-sm font-medium'>Username / Email </Label>
                  <Input
                    value={form.identifier}
                    onChange={(e) => setForm((p) => ({ ...p, identifier: e.target.value }))}
                    placeholder='e.g. admin@norton.edu.kh'
                    required
                    disabled={isLoggingIn}
                    className='bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-white/30 focus-visible:border-white/40 h-10'
                  />
                </div>

                {/* Password */}
                <div className='space-y-1.5'>
                  <Label className='text-white/75 text-sm font-medium'>Password</Label>
                  <div className='relative'>
                    <Input
                      type={showPwd ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                      placeholder='Enter your password'
                      required
                      disabled={isLoggingIn}
                      className='bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-white/30 focus-visible:border-white/40 h-10 pr-10'
                    />
                    <button
                      type='button'
                      tabIndex={-1}
                      onClick={() => setShowPwd((v) => !v)}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors'
                    >
                      {showPwd ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                    </button>
                  </div>
                </div>

                {/* Forgot password */}
                <div className='flex justify-end -mt-2'>
                  <Link
                    href='/forgot-password'
                    className='text-xs text-white/40 hover:text-white/70 transition-colors'
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Lockout banner */}
                {isLocked && (
                  <div className='flex items-start gap-2.5 bg-orange-500/15 border border-orange-400/30 text-orange-300 text-sm rounded-xl px-3.5 py-3'>
                    <Clock className='w-4 h-4 mt-0.5 shrink-0' />
                    <span>
                      Too many failed attempts. Try again in{' '}
                      <span className='font-semibold'>
                        {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                      </span>.
                    </span>
                  </div>
                )}

                {/* Failed-attempt warning */}
                {!isLocked && attemptCount > 0 && attemptCount < MAX_ATTEMPTS && (
                  <p className='text-center text-yellow-400/70 text-xs'>
                    {MAX_ATTEMPTS - attemptCount} attempt{MAX_ATTEMPTS - attemptCount !== 1 ? 's' : ''} remaining before lockout
                  </p>
                )}

                {/* Error */}
                {error && (
                  <div className='flex items-start gap-2.5 bg-red-500/15 border border-red-400/30 text-red-300 text-sm rounded-xl px-3.5 py-3'>
                    <ShieldAlert className='w-4 h-4 mt-0.5 shrink-0' />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit */}
                <Button
                  type='submit'
                  disabled={isLoggingIn || isLocked}
                  className='w-full bg-white text-gray-900 hover:bg-white/90 active:bg-white/80 font-semibold h-11 shadow-lg shadow-black/20 mt-1 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isLoggingIn ? (
                    <span className='flex items-center gap-2'>
                      <Loader2 className='w-4 h-4 animate-spin' />
                      Signing in…
                    </span>
                  ) : isLocked ? (
                    <span className='flex items-center gap-2'>
                      <Clock className='w-4 h-4' />
                      Locked — {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                    </span>
                  ) : 'Sign In'}
                </Button>
              </form>
            </>
          )}
        </div>

        <p className='text-center text-white/25 text-xs mt-6'>
          © {new Date().getFullYear()} Norton University · E-Library System
        </p>
      </div>
    </div>
  );
}