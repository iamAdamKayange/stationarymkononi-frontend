'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Compass, Search, MapPin, Star, Clock, Phone, ArrowRight, Printer } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { api } from '../../lib/api';
import { Stationery } from '../../types';

export default function StationeriesListPage() {
  const [stationeries, setStationeries] = useState<Stationery[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShops = async () => {
      setLoading(true);
      try {
        const res = (await api.get('/stationeries', {
          params: { search: search || undefined },
        })) as { data: Stationery[] };
        if (res?.data) setStationeries(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, [search]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <Badge variant="info" className="bg-white/20 text-white border-white/20 mb-2">
          Stationery Hub
        </Badge>
        <h1 className="text-xl sm:text-3xl font-extrabold">Maduka ya Stationery Tanzania</h1>
        <p className="text-xs sm:text-sm text-blue-200 mt-1">
          Tafuta stationery iliyo karibu nawe, angalia huduma wanazotoa, na weka oda mtandaoni.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tafuta kwa jina la stationery, eneo au mtaa... (mfano: Mwenge, Posta, Kariakoo)"
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500 shadow-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
        />
      </div>

      {/* Grid of Shops */}
      {loading ? (
        <LoadingSpinner message="Inatafuta maduka ya stationery..." />
      ) : stationeries.length === 0 ? (
        <EmptyState
          title="Hakuna Stationery Iliyopatikana"
          description="Jaribu kubadilisha jina la eneo au neno unalotafuta."
          actionText="Onyesha Zote"
          onAction={() => setSearch('')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stationeries.map((shop) => (
            <Link
              key={shop.id}
              href={`/stationeries/${shop.id}`}
              className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs hover:shadow-md hover:border-brand-300 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold shadow-xs">
                      <Compass className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base group-hover:text-brand-600 transition-colors">
                        {shop.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold mt-0.5">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {shop.avgRating.toFixed(1)} ({shop.totalRatings} reviews)
                      </div>
                    </div>
                  </div>

                  <Badge variant={shop.isOpen ? 'success' : 'neutral'} size="sm">
                    {shop.isOpen ? 'Wazi' : 'Imefungwa'}
                  </Badge>
                </div>

                {shop.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">{shop.description}</p>
                )}

                <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span>{shop.address}, {shop.city}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span>{shop.openingHours || '08:00 AM - 08:00 PM'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1">
                  <Printer className="w-3.5 h-3.5" /> Printing & Stationery Services
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 group-hover:text-brand-600">
                  Fungua Duka <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
