'use client';

import React from 'react';
import { ActiveThemeProvider } from '../active-theme';
import { StoreProvider } from '@/app/storeProvider';
import AuthInitializer from './auth-initializer';

export default function Providers({
  activeThemeValue,
  children,
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  return (
    <StoreProvider>
      <ActiveThemeProvider initialTheme={activeThemeValue}>
        <AuthInitializer />
        {children}
      </ActiveThemeProvider>
    </StoreProvider>
  );
}
