'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldCheck, ShieldOff, QrCode, CheckCircle2, AlertCircle, Copy, Download, RefreshCw, Key } from 'lucide-react';
import { toast } from 'sonner';
import {
  useTwoFASetupMutation,
  useTwoFAVerifySetupMutation,
  useTwoFADisableMutation,
  useTwoFAStatusQuery,
  useRegenerateRecoveryMutation,
} from '@/services/authApi';

type Step = 'idle' | 'qr' | 'verify' | 'recovery' | 'disable' | 'regenerate';

export default function TwoFactorCard() {
  const { data: statusData, refetch } = useTwoFAStatusQuery();
  const [setup, { isLoading: isSettingUp }]              = useTwoFASetupMutation();
  const [verifySetup, { isLoading: isVerifying }]        = useTwoFAVerifySetupMutation();
  const [disable2FA, { isLoading: isDisabling }]         = useTwoFADisableMutation();
  const [regenerate, { isLoading: isRegenerating }]      = useRegenerateRecoveryMutation();

  const [step, setStep]               = useState<Step>('idle');
  const [qrCode, setQrCode]           = useState('');
  const [secret, setSecret]           = useState('');
  const [otpCode, setOtpCode]         = useState(['', '', '', '', '', '']);
  const [disablePassword, setDisablePassword]     = useState('');
  const [regeneratePassword, setRegeneratePassword] = useState('');
  const [recoveryCodes, setRecoveryCodes]         = useState<string[]>([]);
  const [error, setError]             = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isEnabled = statusData?.data?.twoFactorEnabled ?? false;
  const recoveryRemaining = statusData?.data?.recoveryCodesRemaining ?? 0;

  const handleSetup = async () => {
    setError('');
    try {
      const res = await setup().unwrap();
      setQrCode(res.data.qrCode);
      setSecret(res.data.secret);
      setStep('qr');
    } catch (err: any) {
      const msg = err?.data?.message || 'Failed to generate QR code';
      setError(msg);
      toast.error(msg);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1);
    setOtpCode(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otpCode];
    for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
    setOtpCode(newOtp);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    setError('');
    const code = otpCode.join('');
    if (code.length !== 6) { setError('Enter the full 6-digit code'); return; }
    try {
      const res = await verifySetup({ token: code }).unwrap();
      toast.success('Two-factor authentication enabled! 🎉');
      setOtpCode(['', '', '', '', '', '']);
      if (res.data.recoveryCodes?.length) {
        setRecoveryCodes(res.data.recoveryCodes);
        setStep('recovery');
      } else {
        setStep('idle');
      }
      refetch();
    } catch (err: any) {
      const msg = err?.data?.message || 'Invalid code. Try again.';
      setError(msg);
      toast.error(msg);
      setOtpCode(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    }
  };

  const handleDisable = async () => {
    setError('');
    if (!disablePassword) { setError('Enter your password to disable 2FA'); return; }
    try {
      await disable2FA({ password: disablePassword }).unwrap();
      toast.success('Two-factor authentication disabled.');
      setStep('idle');
      setDisablePassword('');
      refetch();
    } catch (err: any) {
      const msg = err?.data?.message || 'Failed to disable 2FA';
      setError(msg);
      toast.error(msg);
    }
  };

  const handleRegenerate = async () => {
    setError('');
    if (!regeneratePassword) { setError('Enter your password to regenerate codes'); return; }
    try {
      const res = await regenerate({ password: regeneratePassword }).unwrap();
      toast.success('Recovery codes regenerated!');
      setRecoveryCodes(res.data.recoveryCodes);
      setRegeneratePassword('');
      setStep('recovery');
      refetch();
    } catch (err: any) {
      const msg = err?.data?.message || 'Failed to regenerate recovery codes';
      setError(msg);
      toast.error(msg);
    }
  };

  const copyRecoveryCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    toast.success('Recovery codes copied to clipboard');
  };

  const downloadRecoveryCodes = () => {
    const content = `E-Library NU — Recovery Codes\n${'='.repeat(35)}\nSave these codes in a safe place.\nEach code can only be used once.\n\n${recoveryCodes.join('\n')}\n`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'elibrary-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Recovery codes downloaded');
  };

  const resetState = () => {
    setStep('idle');
    setQrCode('');
    setSecret('');
    setOtpCode(['', '', '', '', '', '']);
    setDisablePassword('');
    setRegeneratePassword('');
    setRecoveryCodes([]);
    setError('');
  };

  return (
    <Card className='col-span-full'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              <ShieldCheck className='w-5 h-5' />
              Two-Factor Authentication
            </CardTitle>
            <CardDescription className='mt-1'>
              Add an extra layer of security to your account using an authenticator app
            </CardDescription>
          </div>
          <Badge variant={isEnabled ? 'default' : 'secondary'} className={isEnabled ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20' : ''}>
            {isEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {error && (
          <div className='flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2.5'>
            <AlertCircle className='w-4 h-4 shrink-0' /> {error}
          </div>
        )}

        {/* ── Idle ── */}
        {step === 'idle' && (
          <div className='space-y-3'>
            <div className='flex gap-3 flex-wrap'>
              {!isEnabled ? (
                <Button onClick={handleSetup} disabled={isSettingUp}>
                  {isSettingUp ? <Loader2 className='w-4 h-4 animate-spin mr-2' /> : <QrCode className='w-4 h-4 mr-2' />}
                  Set Up 2FA
                </Button>
              ) : (
                <>
                  <Button variant='destructive' onClick={() => { resetState(); setStep('disable'); }}>
                    <ShieldOff className='w-4 h-4 mr-2' /> Disable 2FA
                  </Button>
                  <Button variant='outline' onClick={() => { resetState(); setStep('regenerate'); }}>
                    <Key className='w-4 h-4 mr-2' /> Regenerate Recovery Codes
                  </Button>
                </>
              )}
            </div>
            {isEnabled && (
              <p className='text-xs text-muted-foreground'>
                {recoveryRemaining} recovery {recoveryRemaining === 1 ? 'code' : 'codes'} remaining
              </p>
            )}
          </div>
        )}

        {/* ── QR code ── */}
        {step === 'qr' && (
          <div className='space-y-4'>
            <p className='text-sm text-muted-foreground'>Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
            <div className='flex justify-center'>
              <div className='bg-white p-3 rounded-xl shadow-sm border'>
                <img src={qrCode} alt='2FA QR Code' className='w-48 h-48' />
              </div>
            </div>
            <div className='space-y-1.5'>
              <Label className='text-xs text-muted-foreground'>Or enter this key manually:</Label>
              <div className='flex items-center gap-2'>
                <code className='text-xs bg-muted px-3 py-1.5 rounded-md font-mono select-all break-all flex-1'>{secret}</code>
                <Button size='sm' variant='outline' onClick={() => { navigator.clipboard.writeText(secret); toast.success('Secret copied'); }}>Copy</Button>
              </div>
            </div>
            <div className='flex gap-2'>
              <Button onClick={() => setStep('verify')}>Next: Enter Code</Button>
              <Button variant='ghost' onClick={resetState}>Cancel</Button>
            </div>
          </div>
        )}

        {/* ── Verify OTP ── */}
        {step === 'verify' && (
          <div className='space-y-4'>
            <p className='text-sm text-muted-foreground'>Enter the 6-digit code from your authenticator app to confirm setup:</p>
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
                  className='w-11 h-13 text-center text-xl font-bold border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50 bg-background'
                />
              ))}
            </div>
            <div className='flex gap-2'>
              <Button onClick={handleVerify} disabled={isVerifying || otpCode.join('').length !== 6}>
                {isVerifying ? <Loader2 className='w-4 h-4 animate-spin mr-2' /> : <CheckCircle2 className='w-4 h-4 mr-2' />}
                Verify & Enable
              </Button>
              <Button variant='ghost' onClick={resetState}>Cancel</Button>
            </div>
          </div>
        )}

        {/* ── Recovery codes display ── */}
        {step === 'recovery' && recoveryCodes.length > 0 && (
          <div className='space-y-4'>
            <div className='flex items-center gap-2 text-sm text-amber-700 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg px-3 py-2.5'>
              <AlertCircle className='w-4 h-4 shrink-0' />
              <span><strong>Save these recovery codes now.</strong> They won&apos;t be shown again. Each code can only be used once.</span>
            </div>
            <div className='grid grid-cols-2 gap-2 max-w-sm mx-auto'>
              {recoveryCodes.map((code, i) => (
                <code key={i} className='text-sm font-mono bg-muted px-3 py-2 rounded-md text-center select-all'>
                  {code}
                </code>
              ))}
            </div>
            <div className='flex gap-2 justify-center'>
              <Button size='sm' variant='outline' onClick={copyRecoveryCodes}>
                <Copy className='w-4 h-4 mr-2' /> Copy All
              </Button>
              <Button size='sm' variant='outline' onClick={downloadRecoveryCodes}>
                <Download className='w-4 h-4 mr-2' /> Download
              </Button>
            </div>
            <div className='flex justify-center'>
              <Button onClick={resetState}>
                <CheckCircle2 className='w-4 h-4 mr-2' /> I&apos;ve Saved My Codes
              </Button>
            </div>
          </div>
        )}

        {/* ── Regenerate recovery codes ── */}
        {step === 'regenerate' && (
          <div className='space-y-4'>
            <div className='flex items-center gap-2 text-sm text-amber-700 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg px-3 py-2.5'>
              <AlertCircle className='w-4 h-4 shrink-0' />
              This will invalidate all existing recovery codes.
            </div>
            <div className='max-w-sm space-y-1.5'>
              <Label>Confirm Password</Label>
              <Input
                type='password'
                value={regeneratePassword}
                onChange={(e) => setRegeneratePassword(e.target.value)}
                placeholder='Enter your password'
                disabled={isRegenerating}
              />
            </div>
            <div className='flex gap-2'>
              <Button onClick={handleRegenerate} disabled={isRegenerating || !regeneratePassword}>
                {isRegenerating ? <Loader2 className='w-4 h-4 animate-spin mr-2' /> : <RefreshCw className='w-4 h-4 mr-2' />}
                Regenerate Codes
              </Button>
              <Button variant='ghost' onClick={resetState}>Cancel</Button>
            </div>
          </div>
        )}

        {/* ── Disable ── */}
        {step === 'disable' && (
          <div className='space-y-4'>
            <p className='text-sm text-muted-foreground'>Enter your account password to confirm disabling 2FA:</p>
            <div className='max-w-sm space-y-1.5'>
              <Label>Password</Label>
              <Input
                type='password'
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder='Enter your password'
                disabled={isDisabling}
              />
            </div>
            <div className='flex gap-2'>
              <Button variant='destructive' onClick={handleDisable} disabled={isDisabling || !disablePassword}>
                {isDisabling ? <Loader2 className='w-4 h-4 animate-spin mr-2' /> : <ShieldOff className='w-4 h-4 mr-2' />}
                Confirm Disable
              </Button>
              <Button variant='ghost' onClick={resetState}>Cancel</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
