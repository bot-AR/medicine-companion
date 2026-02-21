'use client';

import { useEffect, type ReactNode } from 'react';
import { useBridgeInit } from '@/hooks/useBridge';
import { useAppStore } from '@/store/appStore';
import BottomTabBar from '@/components/layout/BottomTabBar';
import ToastContainer from '@/components/shared/Toast';

export default function ClientProviders({ children }: { children: ReactNode }) {
  useBridgeInit();

  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    const saved = localStorage.getItem('mc-theme') as 'light' | 'dark' | null;
    if (saved) {
      useAppStore.getState().setTheme(saved);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('mc-theme', theme);
  }, [theme]);

  return (
    <>
      <ToastContainer />
      <main className="min-h-screen pb-20">{children}</main>
      <BottomTabBar />
    </>
  );
}
