'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { getDashboardRouteForRole } from '../../lib/routing';
import toast from 'react-hot-toast';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export const PwaInstallPrompt: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    setIsInstalled(isStandalone);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      toast.success('App imewekwa kwenye kifaa chako');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  const canInstall = useMemo(() => Boolean(deferredPrompt) && !isInstalled, [deferredPrompt, isInstalled]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        toast.success('Asante. App inaanza kusakinishwa.');
      }
      setDeferredPrompt(null);
      setDismissed(true);
    } catch {
      toast.error('Imeshindikana kufungua install prompt');
    }
  };

  if (!isAuthenticated || !user || isInstalled || dismissed || !canInstall) {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50">
      <div className="rounded-3xl border border-emerald-200 bg-white/95 backdrop-blur-xl shadow-2xl p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Install Stationery Mkononi</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Pakua app ili ifunguke kama PWA, ifanye kazi haraka, na ionekane kama native app.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                aria-label="Close install prompt"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleInstall}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
              >
                <Download className="w-4 h-4" />
                Download App
              </button>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                <WifiOff className="w-3.5 h-3.5" />
                Works offline after install
              </span>
              <a
                href={getDashboardRouteForRole(user.role)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Endelea kwenye dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

