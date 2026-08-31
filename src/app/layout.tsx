import React from 'react';
import type { Metadata, Viewport } from 'next';
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
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Stationery Mkononi',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { url: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#16a34a',
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
                const storedTheme = localStorage.getItem('stationery-theme');
                const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                
                if (storedTheme === 'dark' || (!storedTheme && systemDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
                
                var lang = localStorage.getItem('stationery-lang') || 'sw';
                document.documentElement.setAttribute('lang', lang);
                
                console.log('Theme initialized:', storedTheme || (systemDark ? 'dark (system)' : 'light (system)'));
              } catch (error) {
                console.error('Theme initialization error:', error);
              }
            `,
          }}
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Stationery Mkononi" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Stationery Mkononi" />
        <meta name="theme-color" content="#16a34a" />
        <meta name="msapplication-TileColor" content="#16a34a" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <link rel="icon" type="image/svg+xml" href="/icons/icon-192.svg" />
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
