'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Package,
  ShoppingBag,
  Printer,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { useAuthStore } from '../../../store/useAuthStore';
import { api } from '../../../lib/api';
import { Order } from '../../../types';

export default function CustomerDashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    const loadOrders = async () => {
      try {
        const res = (await api.get('/orders')) as { data: Order[] };
        if (res?.data) setOrders(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, [isAuthenticated]);

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto my-12 text-center">
        <h3 className="font-bold text-slate-800">Tafadhali ingia kwenye akaunti</h3>
        <Link href="/auth/login" className="text-xs text-brand-600 underline mt-2 block">
          Ingia Hapa
        </Link>
      </div>
    );
  }

  const activeOrders = orders.filter(
    (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && o.status !== 'REJECTED'
  );
  const totalSpent = orders
    .filter((o) => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Customer Profile Banner */}
      <div className="bg-gradient-to-r from-brand-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center text-xl font-extrabold shadow-md shadow-brand-500/20">
            {user.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold">{user.fullName}</h1>
              <Badge variant="brand" size="sm" className="bg-brand-500/30 text-brand-200 border-brand-400/30">
                Customer
              </Badge>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              @{user.username} • {user.email} • {user.phoneNumber || 'Hakuna simu'}
            </p>
          </div>
        </div>

        <Link href="/print">
          <Button variant="primary" size="md" leftIcon={<Printer className="w-4 h-4" />}>
            Chapa Nyaraka Mpya
          </Button>
        </Link>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-400">Oda Zinazoendelea</span>
          <div className="text-2xl font-extrabold text-brand-600 mt-1">{activeOrders.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-400">Oda Zilizokamilika</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {orders.filter((o) => o.status === 'DELIVERED').length}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-400">Jumla Uliyotumia</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            TZS {totalSpent.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Active Orders Section */}
      {activeOrders.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-base text-slate-900">Oda Zinazoendelea (Active Orders)</h3>
          <div className="space-y-3">
            {activeOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-5 border border-brand-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">Oda #{order.orderNumber}</span>
                    <Badge variant="brand" size="sm">{order.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Stationery: {order.stationery?.name} • TZS {order.totalAmount.toLocaleString()}
                  </p>
                </div>
                <Link href={`/orders/${order.id}`}>
                  <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Fuatilia Ramani (Live GPS)
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-sm text-slate-900">Historia ya Oda (Recent Orders)</h3>
          <Link href="/orders" className="text-xs font-bold text-brand-600 hover:underline">
            Ona Zote
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : orders.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">Bado huna oda zozote.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">#{order.orderNumber}</span>
                  <div className="text-slate-400 text-[11px]">
                    {new Date(order.createdAt).toLocaleDateString()} • {order.stationery?.name}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={order.status === 'DELIVERED' ? 'success' : 'neutral'} size="sm">
                    {order.status}
                  </Badge>
                  <span className="font-extrabold text-slate-800">
                    TZS {order.totalAmount.toLocaleString()}
                  </span>
                  <Link href={`/orders/${order.id}`} className="text-brand-600 font-bold hover:underline">
                    Angalia
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
