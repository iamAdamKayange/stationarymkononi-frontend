import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '../components/layout/Navbar';
import { BottomNav } from '../components/layout/BottomNav';
import { Toaster } from 'react-hot-toast';
import { SettingsInitializer } from '../components/layout/SettingsInitializer';
import { PwaInstallPrompt } from '../components/pwa/PwaInstallPrompt';
import { NotificationEffects } from '../components/pwa/NotificationEffects';
import { PushNotificationPrompt } from '../components/pwa/PushNotificationPrompt';

export const metadata: Metadata = {
  title: 'Stationery Mkononi | Print. Order. Deliver.',
  description:
    'Mfumo wa kisasa unaowaunganisha wateja, stationery shops, delivery riders na huduma za printing na stationery Tanzania.',
  manifest: '/manifest.json',
  themeColor: '#16a34a',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sw">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('stationery-theme') === 'dark' || (!('stationery-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
                var lang = localStorage.getItem('stationery-lang') || 'sw';
                document.documentElement.setAttribute('lang', lang);
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col overflow-x-hidden bg-slate-50 dark:bg-slate-950 dark:text-slate-50 transition-colors duration-200">
        <SettingsInitializer />
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <Navbar />
        <main className="flex-1 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <PwaInstallPrompt />
        <NotificationEffects />
        <PushNotificationPrompt />
        <BottomNav />
      </body>
    </html>
  );
}
