'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Filter, Plus, Check, Star } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { api } from '../../lib/api';
import { ProductCard } from '../../components/products/ProductCard';
import { Product, ProductCategory } from '../../types';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [catsRes, prodsRes] = await Promise.all([
          api.get('/products/categories') as Promise<{ data: ProductCategory[] }>,
          api.get('/products', {
            params: {
              categoryId: selectedCategory || undefined,
              search: searchQuery || undefined,
            },
          }) as Promise<{ data: Product[] }>,
        ]);

        if (catsRes?.data) setCategories(catsRes.data);
        if (prodsRes?.data) setProducts(prodsRes.data);
      } catch (err) {
        console.error(err);
        toast.error('Imeshindikana kupakia vifaa vya stationery');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory, searchQuery]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-700 to-amber-500 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Badge variant="warning" className="bg-white/20 text-white border-white/20 mb-2">
            Stationery Marketplace
          </Badge>
          <h1 className="text-xl sm:text-3xl font-extrabold">Soko la Vifaa vya Stationery</h1>
          <p className="text-xs sm:text-sm text-amber-100 mt-1">
            Kalamu, madaftari, mafaili, vikokotoo (calculators) na karatasi za ofisi.
          </p>
        </div>
      </div>

      {/* Search & Category Filter Chips */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tafuta vifaa... (mfano: Penseli, Counter Book, Box File, Rula)"
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === null
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            Vifaa Vyote
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <LoadingSpinner message="Inatafuta vifaa vya stationery..." />
      ) : products.length === 0 ? (
        <EmptyState
          title="Hakuna Vifaa Vilivyopatikana"
          description="Jaribu kubadilisha jina la utafutaji au chagua aina nyingine ya bidhaa."
          actionText="Onyesha Vifaa Vyote"
          onAction={() => {
            setSelectedCategory(null);
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
