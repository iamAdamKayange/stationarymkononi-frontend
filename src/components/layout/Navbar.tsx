'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Printer,
  ShoppingBag,
  Package,
  Bell,
  User,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  Compass,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { api } from '../../lib/api';

export const Navbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout, initialize } = useAuthStore();
  const itemCount = useCartStore((state) => state.getItemCount());
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isAuthenticated) {
      api
        .get('/notifications/my')
        .then((res: unknown) => {
          const typed = res as { data?: { unreadCount: number } };
          if (typed?.data?.unreadCount !== undefined) {
            setUnreadNotifs(typed.data.unreadCount);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const getDashboardRoute = () => {
    if (!user) return '/dashboard/customer';
    switch (user.role) {
      case 'STATIONERY':
        return '/dashboard/stationery';
      case 'DELIVERY_RIDER':
        return '/dashboard/rider';
      case 'ADMIN':
        return '/dashboard/admin';
      default:
        return '/dashboard/customer';
    }
  };

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Print Document', href: '/print', icon: Printer },
    { label: 'Stationeries', href: '/stationeries', icon: Compass },
    { label: 'Marketplace', href: '/products', icon: ShoppingBag },
    { label: 'My Orders', href: '/orders', icon: Package },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-lg tracking-tight block leading-tight">
                Stationery<span className="text-brand-600">Mkononi</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase block">
                Print. Order. Deliver.
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions & Profile */}
          <div className="flex items-center gap-2">
            {/* Cart icon */}
            <Link
              href="/cart"
              className="relative p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
              title="Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Notifications */}
            {isAuthenticated && (
              <Link
                href="/notifications"
                className="relative p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifs > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                    {unreadNotifs}
                  </span>
                )}
              </Link>
            )}

            {/* Auth Buttons / Profile Menu */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <Link
                  href={getDashboardRoute()}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-brand-600" />
                  <span>
                    {user.role === 'ADMIN'
                      ? 'Admin Hub'
                      : user.role === 'STATIONERY'
                      ? 'Shop Portal'
                      : user.role === 'DELIVERY_RIDER'
                      ? 'Rider Portal'
                      : 'Dashboard'}
                  </span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    router.push('/auth/login');
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 rounded-xl transition-colors"
                >
                  Ingia
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-xs shadow-brand-500/20 transition-colors"
                >
                  Jisajili
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-100 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 rounded-xl"
              >
                {link.icon && <link.icon className="w-4 h-4 text-brand-600" />}
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <Link
                href={getDashboardRoute()}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold text-brand-700 bg-brand-50 rounded-xl"
              >
                <LayoutDashboard className="w-4 h-4 text-brand-600" />
                Portal ({user?.role})
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
