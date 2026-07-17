'use client';

// src/features/settings/components/settings-page.tsx
import { Settings } from 'lucide-react';
import TwoFactorCard from '@/features/profile/components/TwoFactorCard';

export default function SettingsPage() {
  return (
    <div className='max-w-4xl mx-auto space-y-6 w-full'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-bold tracking-tight flex items-center gap-2'>
          <Settings className='w-6 h-6' />
          Settings
        </h2>
        <p className='text-muted-foreground mt-1'>
          Manage your account security and preferences
        </p>
      </div>

      {/* Security section */}
      <section className='space-y-4'>
        <h3 className='text-lg font-semibold'>Security</h3>
        <TwoFactorCard />
      </section>
    </div>
  );
}
