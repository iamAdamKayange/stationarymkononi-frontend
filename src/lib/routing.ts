import { Role } from '../types';

export const getDashboardRouteForRole = (role?: Role | null): string => {
  switch (role) {
    case 'STATIONERY':
      return '/dashboard/stationery';
    case 'DELIVERY_RIDER':
      return '/dashboard/rider';
    case 'ADMIN':
      return '/dashboard/admin';
    case 'CUSTOMER':
    default:
      return '/dashboard/customer';
  }
};

export const getRoleLabel = (role?: Role | null): string => {
  switch (role) {
    case 'STATIONERY':
      return 'Stationery';
    case 'DELIVERY_RIDER':
      return 'Delivery Rider';
    case 'ADMIN':
      return 'Admin';
    case 'CUSTOMER':
    default:
      return 'Customer';
  }
};

