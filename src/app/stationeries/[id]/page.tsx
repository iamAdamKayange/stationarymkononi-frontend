'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Compass,
  Star,
  MapPin,
  Clock,
  Phone,
  Printer,
  ShoppingBag,
  Plus,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ProductCard } from '../../../components/products/ProductCard';
import { api } from '../../../lib/api';
import { useCartStore } from '../../../store/useCartStore';
import { Stationery, Product } from '../../../types';
import toast from 'react-hot-toast';

export default function StationeryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const addProductToCart = useCartStore((state) => state.addProduct);

  const [shop, setShop] = useState<Stationery | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'SERVICES' | 'PRODUCTS' | 'REVIEWS'>('SERVICES');

  useEffect(() => {
    if (!id) return;
    const fetchShop = async () => {
      setLoading(true);
      try {
        const res = (await api.get(`/stationeries/${id}`)) as { data: Stationery };
        if (res?.data) setShop(res.data);
      } catch (err) {
        toast.error('Duka halikupatikana');
        router.push('/stationeries');
      } finally {
        setLoading(false);
      }
    };

    fetchShop();
  }, [id, router]);

  if (loading) return <LoadingSpinner message="Inapakia taarifa za duka..." />;
  if (!shop) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <Link
        href="/stationeries"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-2"
      >
        <ArrowLeft className="w-4 h-4" /> Rudi kwenye orodha ya maduka
      </Link>

      {/* Shop Profile Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-brand-500/20 flex-shrink-0">
            <Compass className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{shop.name}</h1>
              <Badge variant={shop.isOpen ? 'success' : 'neutral'} size="sm">
                {shop.isOpen ? 'Wazi' : 'Imefungwa'}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
              <span className="flex items-center gap-1 text-amber-600 font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {shop.avgRating.toFixed(1)} ({shop.totalRatings} reviews)
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {shop.address}, {shop.city}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {shop.openingHours}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {shop.phoneNumber}
              </span>
            </div>
          </div>
        </div>

        <Link href="/print">
          <Button variant="primary" size="md" leftIcon={<Printer className="w-4 h-4" />}>
            Chapa Hapa (Print)
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('SERVICES')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'SERVICES'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Huduma za Printing
        </button>
        <button
          onClick={() => setActiveTab('PRODUCTS')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'PRODUCTS'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Bidhaa za Dukani ({shop.products?.length || 0})
        </button>
      </div>

      {/* TAB: Printing Services */}
      {activeTab === 'SERVICES' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Printer className="w-4 h-4 text-brand-600" />
            Orodha ya Huduma na Bei za Uchapaji
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {shop.services?.map((srv) => (
              <div key={srv.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-xs sm:text-sm">{srv.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {srv.paperSize} • {srv.colorOption === 'COLOR' ? 'Full Colour' : 'Black & White'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-brand-700">
                    TZS {srv.pricePerPage > 0 ? `${srv.pricePerPage}/pg` : `${srv.bindingPrice} /kitabu`}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold">Inapatikana ✓</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 text-center">
            <Link href="/print">
              <Button variant="primary" size="lg" leftIcon={<Printer className="w-5 h-5" />}>
                Anza Kuchapa Document Yako Sasa
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* TAB: Shop Products */}
      {activeTab === 'PRODUCTS' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {shop.products?.map((product) => (
            <ProductCard key={product.id} product={product} shopOverride={shop} />
          ))}
        </div>
      )}
    </div>
  );
}
