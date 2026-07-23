'use client';
// src/app/(auth)/forgot-password/page.tsx

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2, ShieldAlert, CheckCircle2, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getPasswordValidationError, PASSWORD_REQUIREMENTS } from '@/lib/password-validation';

type Step = 'email' | 'otp' | 'password' | 'done';

type ApiErrorResponse = {
  message?: string;
  error?: {
    message?: string;
    details?: Array<{
      message?: string;
    }>;
  };
};

function getApiErrorMessage(data: ApiErrorResponse, fallback: string) {
  return data.error?.details?.find((detail) => detail.message)?.message ?? data.error?.message ?? data.message ?? fallback;
}

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'exists' | 'missing'>('idle');
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer logic: Ticks every 1 second
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  useEffect(() => {
    if (step === 'otp') otpRefs.current[0]?.focus();
  }, [step]);

  useEffect(() => {
    if (step !== 'email') return;
    const value = email.trim();
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(value)) {
      setEmailStatus('idle');
      return;
    }

    const controller = new AbortController();
    setEmailStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/auth/check-reset-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: value }),
          signal: controller.signal,
        });
        const data = await res.json();
        setEmailStatus(res.ok && data.data?.exists ? 'exists' : 'missing');
      } catch (err) {
        if (!(err instanceof Error && err.name === 'AbortError')) setEmailStatus('missing');
      }
    }, 500);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [email, step]);

  // Helper to format seconds into 1h 59m 59s
  const formatCooldown = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0 || h > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);

    return parts.join(' ');
  };

  // Password strength logic
  const strength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8 && password.length <= 20 && !/\s/.test(password)) s++;
    if (/[a-z]/.test(password)) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    if (/[^A-Za-z0-9\s]/.test(password)) s++;
    return s;
  })();
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength];
  const strengthColor = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-green-500'][strength];

  // OTP helpers
  const handleOtpChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
  };
  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  // Step 1: Send OTP
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as ApiErrorResponse & {
        data?: { sessionToken?: string };
      };
      if (!res.ok) {
        setError(getApiErrorMessage(data, 'Failed to send code.'));
        return;
      }
      const token = data.data?.sessionToken ?? '';
      if (!token) {
        setError('This email is not registered.');
        return;
      }
      setSessionToken(token);
      setStep('otp');
      // Set to 60 for a 1-minute cooldown
      setResendCooldown(60);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend logic
  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setError('');
    setOtp(['', '', '', '', '', '']);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as ApiErrorResponse & {
        data?: { sessionToken?: string };
      };
      const token = data.data?.sessionToken ?? '';
      if (!res.ok || !token) {
        setError(getApiErrorMessage(data, 'This email is not registered.'));
        return;
      }
      setSessionToken(token);
      setResendCooldown(60);
      otpRefs.current[0]?.focus();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      setError('Enter the full 6-digit code.');
      return;
    }
    if (!sessionToken) {
      setError('No code was sent to this email. Please go back and use a registered email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken, otp: code }),
      });
      const data = (await res.json()) as ApiErrorResponse & {
        data?: { resetToken?: string };
      };
      if (!res.ok) {
        setError(getApiErrorMessage(data, 'Invalid or expired code.'));
        return;
      }
      setResetToken(data.data?.resetToken ?? '');
      setStep('password');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const passwordError = getPasswordValidationError(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetToken,
          password,
          confirmPassword: confirm,
        }),
      });
      const data = (await res.json()) as ApiErrorResponse;
      if (!res.ok) {
        setError(getApiErrorMessage(data, 'Failed to reset password.'));
        return;
      }
      setStep('done');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { key: 'email', label: 'Email' },
    { key: 'otp', label: 'Verify' },
    { key: 'password', label: 'Password' },
  ];
  const stepIndex = ({ email: 0, otp: 1, password: 2, done: 3 } as Record<Step, number>)[step];

  return (
    <div
      className='relative min-h-screen flex items-center justify-center overflow-hidden'
      style={{
        backgroundImage: "url('/assets/nu-building.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className='absolute inset-0 bg-black/65 backdrop-blur-[2px]' />
      <div className='absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20' />

      <div className='relative z-10 w-full max-w-md px-4 py-12'>
        {/* Branding */}
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md mb-4 shadow-xl'>
            <img src='logo.webp' alt='E-Library Norton' width={40} height={40} className='w-full h-full object-contain' />
          </div>
          <h1 className='text-3xl font-extrabold text-white tracking-tight'>E-Library NU</h1>
          <p className='text-white/50 mt-1.5 text-sm flex items-center justify-center gap-1.5'>
            <GraduationCap className='w-3.5 h-3.5' />
            Admin &amp; Librarian Portal
          </p>
        </div>

        {/* Progress steps */}
        {step !== 'done' && (
          <div className='flex items-center justify-center gap-2 mb-6'>
            {steps.map((s, i) => (
              <React.Fragment key={s.key}>
                <div className='flex items-center gap-1.5'>
                  <div
                    className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                      i < stepIndex ? 'bg-green-400 text-white' : i === stepIndex ? 'bg-white text-gray-900' : 'bg-white/20 text-white/50'
                    }`}
                  >
                    {i < stepIndex ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${i === stepIndex ? 'text-white' : 'text-white/40'}`}>{s.label}</span>
                </div>
                {i < steps.length - 1 && <div className={`h-0.5 w-10 sm:w-16 rounded-full transition-all ${i < stepIndex ? 'bg-green-400' : 'bg-white/20'}`} />}
              </React.Fragment>
            ))}
          </div>
        )}

        <div className='bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl shadow-black/50 px-8 py-8'>
          {error && (
            <div className='flex items-start gap-2.5 bg-red-500/15 border border-red-400/30 text-red-300 text-sm rounded-xl px-3.5 py-3 mb-5'>
              <ShieldAlert className='w-4 h-4 mt-0.5 shrink-0' />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Email */}
          {step === 'email' && (
            <>
              <div className='mb-6'>
                <h2 className='text-xl font-semibold text-white'>Forgot Password</h2>
                <p className='text-white/45 text-sm mt-1'>Enter your admin email and we&apos;ll send a verification code.</p>
              </div>
              <form onSubmit={handleSendCode} className='space-y-5'>
                <div className='space-y-1.5'>
                  <Label className='text-white/75 text-sm font-medium'>Email Address</Label>
                  <div className='relative'>
                    <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40' />
                    <Input
                      required
                      autoFocus
                      type='email'
                      placeholder='admin@norton.edu.kh'
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className='pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-white/30 focus-visible:border-white/40 h-10'
                    />
                  </div>
                  {emailStatus === 'checking' && <p className='text-xs text-white/45'>Checking email...</p>}
                  {emailStatus === 'exists' && <p className='text-xs text-green-400'>Email found. You can send the code.</p>}
                  {emailStatus === 'missing' && <p className='text-xs text-red-400'>This email is not registered.</p>}
                </div>
                <Button
                  type='submit'
                  disabled={loading || emailStatus !== 'exists'}
                  className='w-full bg-white text-gray-900 hover:bg-white/90 font-semibold h-11'
                >
                  {loading ? <Loader2 className='w-4 h-4 animate-spin' /> : 'Send Verification Code'}
                </Button>
              </form>
              <div className='mt-6 text-center'>
                <Link href='/login' className='text-sm text-white/40 hover:text-white/70 flex items-center justify-center gap-1.5'>
                  <ArrowLeft className='w-4 h-4' /> Back to Sign In
                </Link>
              </div>
            </>
          )}

          {/* STEP 2: OTP with Updated Countdown */}
          {step === 'otp' && (
            <>
              <div className='mb-6'>
                <h2 className='text-xl font-semibold text-white'>Verify Identity</h2>
                <p className='text-white/45 text-sm mt-1'>
                  Code sent to <span className='font-semibold text-white/80'>{email}</span>
                </p>
              </div>
              <form onSubmit={handleVerifyOtp} className='space-y-6'>
                <div className='flex gap-2 justify-center' onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        otpRefs.current[i] = el;
                      }}
                      type='text'
                      inputMode='numeric'
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      disabled={loading}
                      className='w-11 h-13 text-center text-xl font-bold bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-white/40 transition-all'
                    />
                  ))}
                </div>
                <Button
                  type='submit'
                  disabled={loading || otp.join('').length < 6}
                  className='w-full bg-white text-gray-900 hover:bg-white/90 font-semibold h-11'
                >
                  {loading ? <Loader2 className='w-4 h-4 animate-spin' /> : 'Verify Code →'}
                </Button>
              </form>
              <div className='mt-5 text-center space-y-2'>
                <p className='text-sm text-white/40'>
                  Didn&apos;t receive it?{' '}
                  {resendCooldown > 0 ? (
                    <span className='text-white/30 font-medium'>Resend in {formatCooldown(resendCooldown)}</span>
                  ) : (
                    <button onClick={handleResend} disabled={loading} className='text-white/70 font-semibold hover:text-white transition-colors'>
                      Resend code
                    </button>
                  )}
                </p>
                <button
                  onClick={() => {
                    setStep('email');
                    setError('');
                  }}
                  className='text-xs text-white/30 hover:text-white/60 flex items-center justify-center gap-1.5 mx-auto'
                >
                  <ArrowLeft className='w-3.5 h-3.5' /> Change email
                </button>
              </div>
            </>
          )}

          {/* STEP 3: Password Reset */}
          {step === 'password' && (
            <>
              <div className='mb-6'>
                <h2 className='text-xl font-semibold text-white'>New Password</h2>
                <p className='text-white/45 text-sm mt-1'>Please create a secure password.</p>
              </div>
              <form onSubmit={handleResetPassword} className='space-y-5'>
                <div className='space-y-1.5'>
                  <Label className='text-white/75 text-sm font-medium'>New Password</Label>
                  <div className='relative'>
                    <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40' />
                    <Input
                      required
                      type={showPw ? 'text' : 'password'}
                      placeholder='New Password'
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className='pl-10 pr-10 bg-white/10 border-white/20 text-white h-10'
                    />
                    <button type='button' onClick={() => setShowPw(!showPw)} className='absolute right-3 top-1/2 -translate-y-1/2 text-white/40'>
                      {showPw ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                    </button>
                  </div>
                  {password && (
                    <div className='mt-2 space-y-1'>
                      <div className='flex gap-1'>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength ? strengthColor : 'bg-white/20'}`} />
                        ))}
                      </div>
                      <p className='text-xs text-white/40'>
                        Strength: <span className='text-white/70'>{strengthLabel}</span>
                      </p>
                    </div>
                  )}
                  <p className='text-xs text-white/45'>{PASSWORD_REQUIREMENTS}</p>
                </div>

                <div className='space-y-1.5'>
                  <Label className='text-white/75 text-sm font-medium'>Confirm Password</Label>
                  <div className='relative'>
                    <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40' />
                    <Input
                      placeholder='Confirm New Password'
                      required
                      type={showCpw ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      disabled={loading}
                      className={`pl-10 pr-10 bg-white/10 text-white h-10 border-white/20 ${confirm && (password === confirm ? 'border-green-400/60' : 'border-red-400/60')}`}
                    />
                    <button type='button' onClick={() => setShowCpw(!showCpw)} className='absolute right-3 top-1/2 -translate-y-1/2 text-white/40'>
                      {showCpw ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                    </button>
                  </div>
                </div>

                <Button type='submit' disabled={loading} className='w-full bg-white text-gray-900 font-semibold h-11'>
                  {loading ? <Loader2 className='w-4 h-4 animate-spin' /> : 'Reset Password'}
                </Button>
              </form>
            </>
          )}

          {/* DONE */}
          {step === 'done' && (
            <div className='text-center py-4'>
              <div className='w-20 h-20 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-6'>
                <CheckCircle2 className='w-10 h-10 text-green-400' />
              </div>
              <h2 className='text-2xl font-extrabold text-white mb-2'>Reset Successful!</h2>
              <p className='text-white/45 text-sm mb-8'>You can now sign in with your new credentials.</p>
              <Button className='w-full bg-white text-gray-900 font-semibold h-11' onClick={() => router.push('/login')}>
                Sign In Now
              </Button>
            </div>
          )}
        </div>

        <p className='text-center text-white/25 text-xs mt-6'>© {new Date().getFullYear()} Norton University · E-Library System</p>
      </div>
    </div>
  );
}
