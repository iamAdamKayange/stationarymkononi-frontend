'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Users,
  Building,
  Bike,
  Package,
  DollarSign,
  CheckCircle,
  XCircle,
  Ban,
  Activity,
  Search,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { useAuthStore } from '../../../store/useAuthStore';
import { api } from '../../../lib/api';
import { User, Order } from '../../../types';
import toast from 'react-hot-toast';

interface AdminMetrics {
  totalCustomers: number;
  totalStationeries: number;
  totalRiders: number;
  totalOrders: number;
  activeDeliveries: number;
  pendingVerifications: number;
  totalRevenue: number;
  printingRevenue: number;
  productRevenue: number;
  deliveryRevenue: number;
}

interface AuditLogItem {
  id: string;
  action: string;
  details?: string;
  createdAt: string;
  user?: { fullName: string; email: string; role: string };
  order?: { orderNumber: string };
}

export default function AdminDashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'METRICS' | 'USERS' | 'LOGS'>('METRICS');
  const [roleFilter, setRoleFilter] = useState<string>('');

  const loadAdminData = async () => {
    try {
      const [metricsRes, usersRes, logsRes] = await Promise.all([
        api.get('/admin/metrics') as Promise<{ data: { metrics: AdminMetrics } }>,
        api.get('/admin/users', { params: { role: roleFilter || undefined } }) as Promise<{
          data: User[];
        }>,
        api.get('/admin/audit-logs') as Promise<{ data: AuditLogItem[] }>,
      ]);

      if (metricsRes?.data?.metrics) setMetrics(metricsRes.data.metrics);
      if (usersRes?.data) setUsers(usersRes.data);
      if (logsRes?.data) setAuditLogs(logsRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Imeshindikana kupakia taarifa za admin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadAdminData();
  }, [isAuthenticated, roleFilter]);

  const handleUpdateUserStatus = async (
    userId: string,
    status: 'VERIFIED' | 'SUSPENDED' | 'REJECTED'
  ) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { status });
      toast.success(`Hali ya mtumiaji imebadilishwa: ${status}`);
      loadAdminData();
    } catch (err) {
      toast.error((err as Error).message || 'Kushindwa kubadili hali');
    }
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto my-12 text-center">
        <h3 className="font-bold text-slate-800">Ukurasa huu unahitaji haki za Msimamizi (Admin)</h3>
        <Link href="/auth/login" className="text-xs text-brand-600 underline mt-2 block">
          Ingia kama Admin
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-brand-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-brand-500/20">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold">Mfumo Mkuu (Admin Hub)</h1>
              <Badge variant="brand" size="sm" className="bg-brand-500/30 text-brand-300">
                Super Admin
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Udhibiti wa watumiaji, maduka ya stationery, riders, na mapato ya Stationery Mkononi.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab('METRICS')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all ${
            tab === 'METRICS'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Takwimu Kuu (Analytics)
        </button>
        <button
          onClick={() => setTab('USERS')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all ${
            tab === 'USERS'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Uhakiki wa Watumiaji & Maduka ({users.length})
        </button>
        <button
          onClick={() => setTab('LOGS')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all ${
            tab === 'LOGS'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: METRICS */}
      {tab === 'METRICS' && metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase text-slate-400">Jumla ya Wateja</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {metrics.totalCustomers}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase text-slate-400">Stationeries Zote</span>
              <div className="text-2xl font-extrabold text-amber-600 mt-1">
                {metrics.totalStationeries}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase text-slate-400">Riders Wote</span>
              <div className="text-2xl font-extrabold text-blue-600 mt-1">
                {metrics.totalRiders}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase text-slate-400">Jumla ya Oda</span>
              <div className="text-2xl font-extrabold text-brand-600 mt-1">
                {metrics.totalOrders}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase text-slate-400">Jumla ya Mauzo (Gross)</span>
              <div className="text-2xl font-extrabold text-brand-700 mt-1">
                TZS {metrics.totalRevenue.toLocaleString()}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase text-slate-400">Mauzo ya Printing</span>
              <div className="text-2xl font-extrabold text-slate-800 mt-1">
                TZS {metrics.printingRevenue.toLocaleString()}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase text-slate-400">Ada ya Usafiri (Delivery)</span>
              <div className="text-2xl font-extrabold text-slate-800 mt-1">
                TZS {metrics.deliveryRevenue.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS & VERIFICATION QUEUE */}
      {tab === 'USERS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="font-bold text-sm text-slate-900">Usimamizi na Uhakiki wa Watumiaji</h3>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            >
              <option value="">Roles Zote</option>
              <option value="CUSTOMER">Wateja (Customer)</option>
              <option value="STATIONERY">Maduka (Stationery)</option>
              <option value="DELIVERY_RIDER">Riders</option>
              <option value="ADMIN">Admins</option>
            </select>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase font-bold border-b border-slate-100">
                  <th className="pb-3">Jina & Taarifa</th>
                  <th className="pb-3">Aina (Role)</th>
                  <th className="pb-3">Hali (Status)</th>
                  <th className="pb-3 text-right">Vitendo (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3">
                      <div className="font-bold text-slate-900">{u.fullName}</div>
                      <div className="text-slate-400 text-[11px]">
                        {u.email} • {u.phoneNumber}
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge variant="brand" size="sm">{u.role}</Badge>
                    </td>
                    <td className="py-3">
                      <Badge
                        variant={
                          u.status === 'VERIFIED'
                            ? 'success'
                            : u.status === 'PENDING_VERIFICATION'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {u.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {u.status !== 'VERIFIED' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleUpdateUserStatus(u.id, 'VERIFIED')}
                          >
                            Thibitisha (Verify)
                          </Button>
                        )}
                        {u.status !== 'SUSPENDED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateUserStatus(u.id, 'SUSPENDED')}
                          >
                            Sitisha (Suspend)
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {tab === 'LOGS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-600" />
            Platform Audit Trail Logs
          </h3>

          <div className="divide-y divide-slate-100">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    {log.order && (
                      <Badge variant="info" size="sm">
                        Oda #{log.order.orderNumber}
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-500 mt-0.5">{log.details}</p>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  <div>{new Date(log.createdAt).toLocaleString('sw-TZ')}</div>
                  {log.user && <div>Na: {log.user.fullName}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
