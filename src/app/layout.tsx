import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '../components/layout/Navbar';
import { BottomNav } from '../components/layout/BottomNav';
import { Toaster } from 'react-hot-toast';

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
      <body className="min-h-screen flex flex-col bg-slate-50">
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <Navbar />
        <main className="flex-1 pb-20 md:pb-8 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
