'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Printer,
  ShoppingBag,
  Navigation,
  Compass,
  Star,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Bike,
  Plus,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { api } from '../lib/api';
import { Stationery, Product, Order } from '../types';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import toast from 'react-hot-toast';

export default function HomePage() {
  const { user, isAuthenticated } = useAuthStore();
  const addProductToCart = useCartStore((state) => state.addProduct);
  const [stationeries, setStationeries] = useState<Stationery[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch initial data
    const loadHomeData = async () => {
      try {
        const [shopsRes, prodRes] = await Promise.all([
          api.get('/stationeries') as Promise<{ data: Stationery[] }>,
          api.get('/products') as Promise<{ data: Product[] }>,
        ]);

        if (shopsRes?.data) setStationeries(shopsRes.data.slice(0, 4));
        if (prodRes?.data) setFeaturedProducts(prodRes.data.slice(0, 6));

        // If authenticated, check for active in-transit order
        if (isAuthenticated) {
          try {
            const ordersRes = (await api.get('/orders')) as { data: Order[] };
            if (ordersRes?.data) {
              const active = ordersRes.data.find(
                (o) =>
                  o.status !== 'DELIVERED' &&
                  o.status !== 'CANCELLED' &&
                  o.status !== 'REJECTED'
              );
              if (active) setActiveOrder(active);
            }
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.error('Home load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, [isAuthenticated]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero / Quick Action Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <Badge variant="brand" className="bg-brand-500/20 text-brand-300 border-brand-500/30 mb-3">
            Stationery Mkononi 🇹🇿
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            What do you need today?
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mt-2 mb-6">
            Chapa nyaraka zako, agiza vifaa vya ofisi na shule, na upokee mzigo wako mlangoni kwa haraka.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/print">
              <div className="flex items-center gap-3 p-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/15 transition-all group cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold group-hover:scale-105 transition-transform">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm leading-tight">Print Document</div>
                  <div className="text-[11px] text-slate-300">A4, A3, Spiral n.k.</div>
                </div>
              </div>
            </Link>

            <Link href="/products">
              <div className="flex items-center gap-3 p-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/15 transition-all group cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white font-bold group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm leading-tight">Buy Stationery</div>
                  <div className="text-[11px] text-slate-300">Kalamu, vitabu, n.k.</div>
                </div>
              </div>
            </Link>

            <Link href="/orders">
              <div className="flex items-center gap-3 p-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/15 transition-all group cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold group-hover:scale-105 transition-transform">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm leading-tight">Track Order</div>
                  <div className="text-[11px] text-slate-300">Live GPS map</div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Subtle background glow */}
        <div className="absolute right-0 bottom-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Active Order Card if user has in-progress order */}
      {activeOrder && (
        <div className="bg-white rounded-2xl p-5 border border-brand-200 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0 animate-pulse">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">Oda #{activeOrder.orderNumber}</span>
                <Badge variant="brand" size="sm">
                  {activeOrder.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kutoka: <strong className="text-slate-700">{activeOrder.stationery?.name}</strong> • TZS{' '}
                {activeOrder.totalAmount.toLocaleString()}
              </p>
            </div>
          </div>
          <Link href={`/orders/${activeOrder.id}`} className="w-full sm:w-auto">
            <Button variant="primary" size="sm" className="w-full sm:w-auto" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Fuatilia kwenye Ramani (Track)
            </Button>
          </Link>
        </div>
      )}

      {/* Nearby Stationery Shops Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Stationeries Zinazopatikana</h2>
            <p className="text-xs text-slate-500">Chagua duka la karibu kwa uchapaji wa haraka</p>
          </div>
          <Link href="/stationeries" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
            Ona Zote <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner message="Inatafuta stationery zilizo karibu..." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stationeries.map((shop) => (
              <Link
                key={shop.id}
                href={`/stationeries/${shop.id}`}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-brand-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                      <Compass className="w-5 h-5" />
                    </div>
                    <Badge variant={shop.isOpen ? 'success' : 'neutral'} size="sm">
                      {shop.isOpen ? 'Wazi Sasa' : 'Imefungwa'}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-brand-600 transition-colors">
                    {shop.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 line-clamp-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    {shop.address}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 font-semibold text-amber-600">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {shop.avgRating.toFixed(1)} ({shop.totalRatings})
                  </div>
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {shop.openingHours || '08:00 - 20:00'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured Marketplace Products */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Vifaa vya Stationery (Marketplace)</h2>
            <p className="text-xs text-slate-500">Agiza kalamu, madaftari, na vifaa vya ofisi ufikishiwe popote</p>
          </div>
          <Link href="/products" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
            Vifaa Vyote <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-full h-24 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5">
                    <ShoppingBag className="w-8 h-8 text-brand-600/70" />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-brand-600">
                    {product.category?.name || 'Stationery'}
                  </span>
                  <h4 className="text-xs font-semibold text-slate-900 line-clamp-2 mt-0.5">
                    {product.name}
                  </h4>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    TZS {product.price.toLocaleString()}
                  </span>
                  <button
                    onClick={() => {
                      if (product.stationery) {
                        addProductToCart(product, 1, product.stationery);
                        toast.success(`Imeongezwa kwenye kikapu: ${product.name}`);
                      } else {
                        toast.error('Duka halipatikani kwa sasa');
                      }
                    }}
                    className="p-1.5 rounded-lg bg-brand-50 hover:bg-brand-600 text-brand-600 hover:text-white transition-colors"
                    title="Ongeza Kwenye Kikapu"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Trust & Features Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">Uchapaji wa Haraka</h4>
            <p className="text-xs text-slate-500 mt-0.5">Pakia faili na uchague machaguo ya printing kwa dakika chache.</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Bike className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">Live GPS Delivery</h4>
            <p className="text-xs text-slate-500 mt-0.5">Fuatilia rider wako kwenye ramani mpaka afike mlangoni kwako.</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">Malipo Salama</h4>
            <p className="text-xs text-slate-500 mt-0.5">Lipa kwa urahisi kupitia M-Pesa, Tigo Pesa, au Airtel Money.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
