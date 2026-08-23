'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Printer, Lock, User, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../store/useAuthStore';
import { getDashboardRouteForRole } from '../../../lib/routing';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { isAuthenticated, user, initialize } = useAuthStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [nextPath, setNextPath] = useState('');

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setNextPath(params.get('next') || '');
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(getDashboardRouteForRole(user.role));
    }
  }, [isAuthenticated, router, user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.error('Tafadhali jaza barua pepe/jina la mtumiaji na nenosiri');
      return;
    }

    setIsLoading(true);
    try {
      const response = (await api.post('/auth/login', {
        identifier,
        password,
      })) as {
        data: {
          user: {
            id: string;
            email: string;
            username: string;
            fullName: string;
            role: 'CUSTOMER' | 'STATIONERY' | 'DELIVERY_RIDER' | 'ADMIN';
            status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'SUSPENDED' | 'REJECTED';
          };
          accessToken: string;
          refreshToken: string;
        };
      };

      const { user, accessToken, refreshToken } = response.data;
      setAuth(user, accessToken, refreshToken);
      toast.success(`Karibu tena, ${user.fullName}! 👋 App inaweza ku-install kama PWA.`);

      const safeNext =
        nextPath && nextPath.startsWith('/') && !nextPath.startsWith('/auth')
          ? nextPath
          : getDashboardRouteForRole(user.role);
      router.replace(safeNext);
    } catch (err) {
      toast.error((err as Error).message || 'Kuingia kumeshindikana. Angalia taarifa zako.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-6 sm:my-12 animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-brand-500/20">
            <Printer className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Karibu Stationery Mkononi</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ingia kwenye akaunti yako kuendelea
          </p>
        </div>

        <div className="mb-6 p-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 text-emerald-900 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-1">
            <div className="font-bold">Secure backend login</div>
            <p className="text-emerald-800/90">
              Your account is verified by the API. No demo credentials or sample logins are shown here.
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Barua Pepe au Jina la Mtumiaji (Email / Username)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="mfano: juma@gmail.com au jumahamisi"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nenosiri (Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Ingia Sasa
          </Button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-slate-100">
          <p className="text-xs text-slate-600 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            Huna akaunti bado?{' '}
            <Link href="/auth/register" className="font-bold text-brand-600 hover:text-brand-700">
              Jisajili hapa
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
