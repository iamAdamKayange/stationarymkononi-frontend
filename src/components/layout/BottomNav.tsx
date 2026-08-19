'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Printer, ShoppingBag, Package, User } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();

  const getProfileRoute = () => {
    if (!isAuthenticated || !user) return '/auth/login';
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

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Print', href: '/print', icon: Printer, isCenter: true },
    { label: 'Market', href: '/products', icon: ShoppingBag },
    { label: 'Orders', href: '/orders', icon: Package },
    { label: 'Profile', href: getProfileRoute(), icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-2 py-1 shadow-lg">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center -mt-5 group"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/30 group-hover:scale-105 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-semibold text-brand-700 mt-1">Print</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
                isActive ? 'text-brand-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
