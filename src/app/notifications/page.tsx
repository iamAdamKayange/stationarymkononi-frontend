'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCircle,
  Package,
  Printer,
  Bike,
  CreditCard,
  CheckCheck,
  Clock,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { NotificationItem } from '../../types';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = (await api.get('/notifications/my')) as {
        data: { notifications: NotificationItem[]; unreadCount: number };
      };
      if (res?.data) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();

    const socket = getSocket();
    const handleNewNotif = (notif: NotificationItem) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      toast(notif.title, { icon: '🔔' });
    };

    socket.on('notification:new', handleNewNotif);
    return () => {
      socket.off('notification:new', handleNewNotif);
    };
  }, [isAuthenticated]);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('Taarifa zote zimetiwa alama ya kusomwa');
    } catch {
      toast.error('Kushindwa kubadili taarifa');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 text-center">
        <EmptyState
          title="Tafadhali Ingia Kwenye Akaunti"
          description="Ingia ili kuona taarifa za maendeleo ya oda zako."
          actionText="Ingia Sasa"
          onAction={() => (window.location.href = '/auth/login')}
        />
      </div>
    );
  }

  const getIconForNotification = (title: string) => {
    if (title.includes('Malipo') || title.includes('Payment')) return <CreditCard className="w-5 h-5 text-emerald-600" />;
    if (title.includes('Rider') || title.includes('Njiani')) return <Bike className="w-5 h-5 text-blue-600" />;
    if (title.includes('Uchapaji') || title.includes('Printing')) return <Printer className="w-5 h-5 text-purple-600" />;
    return <Package className="w-5 h-5 text-brand-600" />;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Taarifa Zangu (Notifications)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sasisho za moja kwa moja kuhusu uchapaji, maendeleo na delivery.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            leftIcon={<CheckCheck className="w-4 h-4" />}
          >
            Soma Zote ({unreadCount})
          </Button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner message="Inapakia taarifa zako..." />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-8 h-8 text-slate-400 dark:text-slate-500" />}
          title="Huna Taarifa Mpya"
          description="Taarifa kuhusu oda zako na mienendo ya rider zitaonekana hapa."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                notif.isRead
                  ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs'
                  : 'bg-brand-50/40 dark:bg-brand-950/40 border-brand-200 dark:border-brand-800 shadow-sm'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                {getIconForNotification(notif.title)}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{notif.title}</h4>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(notif.createdAt).toLocaleTimeString('sw-TZ', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{notif.body}</p>

                {notif.relatedOrderId && (
                  <div className="pt-2">
                    <Link
                      href={`/orders/${notif.relatedOrderId}`}
                      className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      Angalia Oda Hii →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
