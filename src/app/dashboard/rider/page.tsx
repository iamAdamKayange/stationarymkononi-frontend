'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bike,
  Power,
  Navigation,
  MapPin,
  Phone,
  CheckCircle2,
  DollarSign,
  Package,
  ArrowRight,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { useAuthStore } from '../../../store/useAuthStore';
import { api } from '../../../lib/api';
import { getSocket } from '../../../lib/socket';
import { Delivery, RiderProfile } from '../../../types';
import toast from 'react-hot-toast';

export default function RiderDashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [isOnline, setIsOnline] = useState(false);
  const [rider, setRider] = useState<RiderProfile | null>(null);
  const [activeDelivery, setActiveDelivery] = useState<Delivery | null>(null);
  const [availableDeliveries, setAvailableDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  // Load Rider Profile and Active & Available Deliveries
  const loadRiderData = async () => {
    try {
      const [meRes, activeRes, availRes] = await Promise.all([
        api.get('/auth/me') as Promise<{ data: { riderProfile?: RiderProfile } }>,
        api.get('/deliveries/active') as Promise<{ data: Delivery }>,
        api.get('/deliveries/available') as Promise<{ data: Delivery[] }>,
      ]);

      if (meRes?.data?.riderProfile) {
        setRider(meRes.data.riderProfile);
        setIsOnline(meRes.data.riderProfile.isOnline);
      }
      if (activeRes?.data) setActiveDelivery(activeRes.data);
      if (availRes?.data) setAvailableDeliveries(availRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadRiderData();

    // Socket real-time listener for incoming broadcast delivery requests
    const socket = getSocket();
    const handleNewDeliveryRequest = (data: unknown) => {
      toast('Mzigo Mpya Unatafuta Rider! 🛵', { icon: '📦' });
      loadRiderData();
    };

    socket.on('rider:new_delivery_request', handleNewDeliveryRequest);

    return () => {
      socket.off('rider:new_delivery_request', handleNewDeliveryRequest);
    };
  }, [isAuthenticated]);

  // Periodic GPS location updater when active delivery is in progress
  useEffect(() => {
    if (!activeDelivery || !isOnline) return;

    const interval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude, speed, heading } = pos.coords;
            api
              .post('/tracking/location', {
                deliveryId: activeDelivery.id,
                latitude,
                longitude,
                speed: speed ? speed * 3.6 : undefined,
                heading: heading || undefined,
              })
              .catch(() => {});
          },
          () => {},
          { enableHighAccuracy: true }
        );
      }
    }, 6000); // every 6 seconds

    return () => clearInterval(interval);
  }, [activeDelivery, isOnline, rider?.id]);

  const handleToggleOnline = async () => {
    try {
      const nextState = !isOnline;
      await api.post('/deliveries/availability', { isOnline: nextState });
      setIsOnline(nextState);
      toast.success(`Hali yako sasa ni: ${nextState ? 'ONLINE (Unapokea Mzigo)' : 'OFFLINE'}`);
      loadRiderData();
    } catch (err) {
      toast.error('Kushindwa kubadili hali ya upatikanaji');
    }
  };

  const handleAcceptDelivery = async (deliveryId: string) => {
    try {
      const res = (await api.patch(`/deliveries/${deliveryId}/accept`)) as { data: Delivery };
      toast.success('Umekubali mzigo huu! Endelea stationery kuchukua.');
      setActiveDelivery(res.data);
      loadRiderData();
    } catch (err) {
      toast.error((err as Error).message || 'Kushindwa kukubali mzigo');
    }
  };

  const handleUpdateDeliveryStatus = async (
    status: 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED'
  ) => {
    if (!activeDelivery) return;
    try {
      const res = (await api.patch(`/deliveries/${activeDelivery.id}/status`, { status })) as {
        data: Delivery;
      };

      if (status === 'DELIVERED') {
        toast.success('Mzigo umefikishwa salama! Pesa ya usafiri imeongezwa. 🎉');
        setActiveDelivery(null);
      } else {
        toast.success(`Hali ya mzigo imebadilishwa kuwa: ${status}`);
        setActiveDelivery(res.data);
      }
      loadRiderData();
    } catch (err) {
      toast.error((err as Error).message || 'Kushindwa kusasisha safari');
    }
  };

  if (!isAuthenticated || user?.role !== 'DELIVERY_RIDER') {
    return (
      <div className="max-w-md mx-auto my-12 text-center">
        <h3 className="font-bold text-slate-800">Ukurasa huu ni wa Delivery Riders Pekee</h3>
        <Link href="/auth/login" className="text-xs text-brand-600 underline mt-2 block">
          Ingia kama Rider
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Rider Status & Online Toggle Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-blue-500/20">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <Bike className="w-8 h-8" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold">{user.fullName}</h1>
              <Badge variant={isOnline ? 'success' : 'neutral'} size="sm">
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </Badge>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              🛵 {rider?.vehicleType} • Bamba: <strong>{rider?.vehiclePlate || 'Haijasanidiwa'}</strong> • ⭐{' '}
              {rider?.avgRating.toFixed(1)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/rider/profile">
            <Button variant="outline" size="md" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
              Edit Profile
            </Button>
          </Link>
          <button
            type="button"
            onClick={handleToggleOnline}
            className={`px-5 py-3 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-md active:scale-95 ${
              isOnline
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
          }`}
        >
          <Power className="w-4 h-4" />
          {isOnline ? 'Washa OFFLINE' : 'Washa ONLINE (GO ONLINE)'}
        </button>
      </div>

      {/* Rider KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-400">Jumla ya Safari Zilizofika</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {rider?.totalDeliveries || 0} Mizigo
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-400">Kiwango cha Alama (Rating)</span>
          <div className="text-2xl font-extrabold text-amber-500 mt-1">
            ⭐ {rider?.avgRating.toFixed(1)} / 5.0
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-400">Makadirio ya Mapato</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            TZS {((rider?.totalDeliveries || 0) * 2000).toLocaleString()}
          </div>
        </div>
      </div>

      {/* ACTIVE DELIVERY CONSOLE */}
      {activeDelivery && (
        <div className="bg-white rounded-3xl p-6 border-2 border-brand-500 shadow-lg space-y-5 animate-pulse-border">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <h3 className="font-extrabold text-slate-900 text-base">Mzigo Unaopeleka Sasa (Active)</h3>
            </div>
            <Badge variant="brand">{activeDelivery.status}</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Step A: Pickup */}
            <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-amber-800">1. Chukua Kwenye Duka:</div>
              <div className="font-bold text-sm text-slate-900">{activeDelivery.pickupAddress}</div>
              <div className="text-xs text-slate-600">
                Oda: <strong>#{activeDelivery.order?.orderNumber}</strong>
              </div>
            </div>

            {/* Step B: Dropoff */}
            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-emerald-800">2. Fikisha Kwa Mteja:</div>
              <div className="font-bold text-sm text-slate-900">{activeDelivery.dropoffAddress}</div>
              <div className="text-xs text-slate-600">
                Simu ya Mteja: <strong>{activeDelivery.order?.deliveryPhone}</strong>
              </div>
            </div>
          </div>

          {/* Delivery Fee Notice */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl text-xs">
            <span className="text-slate-600">Ada Yako ya Usafiri (Earnings):</span>
            <span className="font-extrabold text-sm text-emerald-700">
              TZS {activeDelivery.deliveryFee.toLocaleString()}
            </span>
          </div>

          {/* Status Progression Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {activeDelivery.status === 'ACCEPTED' && (
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto flex-1"
                onClick={() => handleUpdateDeliveryStatus('PICKED_UP')}
                leftIcon={<Package className="w-5 h-5" />}
              >
                Nishachukua Mzigo Stationery (Mark Picked Up)
              </Button>
            )}

            {activeDelivery.status === 'PICKED_UP' && (
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => handleUpdateDeliveryStatus('IN_TRANSIT')}
                leftIcon={<Navigation className="w-5 h-5" />}
              >
                Niko Njiani Kuelekea Kwa Mteja (In Transit)
              </Button>
            )}

            {(activeDelivery.status === 'IN_TRANSIT' || activeDelivery.status === 'PICKED_UP') && (
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => handleUpdateDeliveryStatus('DELIVERED')}
                leftIcon={<CheckCircle2 className="w-5 h-5" />}
              >
                Nimefikisha Mzigo (Mark Delivered)
              </Button>
            )}
          </div>
        </div>
      )}

      {/* AVAILABLE DELIVERY JOBS QUEUE */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <Package className="w-4 h-4 text-brand-600" />
          Mizigo Inayotafuta Rider ({availableDeliveries.length})
        </h3>

        {!isOnline ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Power className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">Akaunti yako iko OFFLINE</p>
            <p className="text-xs text-slate-400 mt-1">Washa Online juu ili kupokea maombi ya delivery.</p>
          </div>
        ) : availableDeliveries.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
            <p className="text-xs text-slate-400">Hakuna maombi mapya ya delivery kwa sasa. Subiri hapa...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {availableDeliveries.map((del) => (
              <div
                key={del.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-brand-300 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
              >
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <span>Oda #{del.order?.orderNumber}</span>
                    <Badge variant="brand" size="sm">
                      {del.estimatedDistanceKm} km
                    </Badge>
                  </div>
                  <div className="text-slate-600">
                    Kutoka: <strong>{del.pickupAddress}</strong>
                  </div>
                  <div className="text-slate-600">
                    Kuelekea: <strong>{del.dropoffAddress}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Ada Yako:</span>
                    <span className="text-sm font-extrabold text-emerald-600">
                      TZS {del.deliveryFee.toLocaleString()}
                    </span>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAcceptDelivery(del.id)}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Kubali Safari
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
