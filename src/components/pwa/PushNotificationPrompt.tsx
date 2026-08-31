'use client';

import React, { useEffect, useState } from 'react';
import { BellRing, BellOff, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';

type PushSubscriptionShape = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};

export const PushNotificationPrompt: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSaving, setIsSaving] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY || '';

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  const registerSubscription = async () => {
    if (!publicKey || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const existingSubscription = await registration.pushManager.getSubscription();
    const subscription =
      existingSubscription ||
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }));

    const payload = subscription.toJSON() as PushSubscriptionShape | null;
    if (!payload) return false;

    await api.post('/notifications/register-token', {
      subscription: payload,
      deviceType: 'web-push',
    });

    return true;
  };

  useEffect(() => {
    if (!isAuthenticated || isDismissed) return;
    if (permission !== 'granted') return;

    registerSubscription().catch(() => {});
  }, [isAuthenticated, isDismissed, permission]);

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) {
      toast.error('Browser yako haiungi mkono notifications');
      return;
    }

    setIsSaving(true);
    try {
      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);

      if (nextPermission !== 'granted') {
        toast.error('Tafadhali ruhusu notifications ili zipokee hata app imefungwa');
        return;
      }

      await registerSubscription();
      toast.success('Notifications zimewashwa. Utaendelea kupokea hata app ikiwa imefungwa.');
      setIsDismissed(true);
    } catch {
      toast.error('Imeshindikana kuwasha notifications');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated || isDismissed || permission === 'granted') {
    return null;
  }

  if (permission === 'denied') {
    return (
      <div className="fixed bottom-36 md:bottom-20 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50">
        <div className="rounded-3xl border border-rose-200 dark:border-rose-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-rose-500/20">
              <BellOff className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Notifications zimezuiwa</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Ili upokee alerts hata app ikiwa imefungwa, ruhusu notifications kwenye browser settings.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDismissed(true)}
                  className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Close notification prompt"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-36 md:bottom-20 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50">
      <div className="rounded-3xl border border-blue-200 dark:border-blue-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
            <BellRing className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Enable notifications</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Ruhusu notifications ili order, rider, na payment updates zipokee hata app ikiwa imefungwa.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close notification prompt"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleEnableNotifications}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                {isSaving ? 'Inawekwa...' : 'Enable notifications'}
              </button>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Works even when app is closed
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

