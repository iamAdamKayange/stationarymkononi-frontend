'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, ArrowRight, Clock, Building, Bike, CheckCircle2 } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { Order } from '../../types';

export default function OrdersListPage() {
  const { isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = (await api.get('/orders')) as { data: Order[] };
        if (res?.data) setOrders(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 text-center">
        <EmptyState
          title="Tafadhali Ingia Kwenye Akaunti"
          description="Unahitaji kuwa umeingia ili kuona historia na kufuatilia oda zako."
          actionText="Ingia Sasa"
          onAction={() => (window.location.href = '/auth/login')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">Oda Zangu (My Orders)</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Fuatilia maendeleo ya uchapaji na safari ya rider kwenye ramani ya moja kwa moja.
          </p>
        </div>
        <Link href="/print">
          <Button variant="primary" size="sm" leftIcon={<Package className="w-4 h-4" />}>
            Oda Mpya
          </Button>
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner message="Inapakia orodha ya oda zako..." />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8 text-slate-400" />}
          title="Hujafanya Oda Yoyote Bado"
          description="Chapa nyaraka au nunua vifaa vya stationery uone safari ya mzigo wako hapa."
          actionText="Chapa Nyaraka Sasa"
          onAction={() => (window.location.href = '/print')}
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isCompleted = order.status === 'DELIVERED';
            const isOutForDelivery = order.status === 'OUT_FOR_DELIVERY' || order.status === 'PICKED_UP';

            return (
              <div
                key={order.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                      Oda #{order.orderNumber}
                    </span>
                    <Badge
                      variant={
                        isCompleted
                          ? 'success'
                          : isOutForDelivery
                          ? 'brand'
                          : order.status === 'PENDING'
                          ? 'warning'
                          : 'info'
                      }
                      size="sm"
                    >
                      {order.status}
                    </Badge>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{order.stationery?.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{new Date(order.createdAt).toLocaleString('sw-TZ')}</span>
                    </div>
                  </div>

                  {/* Items snapshot */}
                  <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {order.orderItems?.map((item) => item.title).join(', ')}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800 gap-2">
                  <div className="text-left sm:text-right">
                    <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 block">
                      TZS {order.totalAmount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {order.payment?.paymentMethod || 'M-Pesa'}
                    </span>
                  </div>

                  <Link href={`/orders/${order.id}`}>
                    <Button
                      variant={isOutForDelivery ? 'primary' : 'outline'}
                      size="sm"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      {isOutForDelivery ? 'Live GPS Map' : 'Fuatilia Oda'}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
