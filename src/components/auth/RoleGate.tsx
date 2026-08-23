'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useAuthStore } from '../../store/useAuthStore';
import { getDashboardRouteForRole } from '../../lib/routing';
import { Role } from '../../types';

interface RoleGateProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  redirectUnauthenticatedTo?: string;
}

export const RoleGate: React.FC<RoleGateProps> = ({
  children,
  allowedRoles,
  redirectUnauthenticatedTo = '/auth/login',
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.replace(`${redirectUnauthenticatedTo}?next=${encodeURIComponent(pathname || '/')}`);
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(getDashboardRouteForRole(user.role));
    }
  }, [allowedRoles, isAuthenticated, isLoading, pathname, redirectUnauthenticatedTo, router, user]);

  if (isLoading) {
    return <LoadingSpinner message="Inaandaa ufikiaji salama..." />;
  }

  if (!isAuthenticated || !user) {
    return <LoadingSpinner message="Inaelekeza kwenye ukurasa wa kuingia..." />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <LoadingSpinner message="Inaelekeza kwenye dashboard sahihi..." />;
  }

  return <>{children}</>;
};

