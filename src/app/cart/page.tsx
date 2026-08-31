'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Printer,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  MapPin,
  Building,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { useCartStore } from '../../store/useCartStore';

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    stationery,
    removeItem,
    updateQuantity,
    getSubtotal,
    getPrintingCost,
    getProductCost,
    clearCart,
  } = useCartStore();

  const subtotal = getSubtotal();
  const estimatedDelivery = 2000;
  const total = subtotal + (items.length > 0 ? estimatedDelivery : 0);

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 animate-fadeIn">
        <EmptyState
          icon={<ShoppingBag className="w-8 h-8 text-slate-400 dark:text-slate-500" />}
          title="Kikapu Chako Kiko Wazi"
          description="Bado hujaweka oda ya printing au bidhaa yoyote ya stationery."
          actionText="Anza Kuchapa Nyaraka (Print)"
          onAction={() => router.push('/print')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">Kikapu Chako (Cart)</h1>
          {stationery && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-brand-600" />
              Oda kutoka: <strong className="text-slate-700 dark:text-slate-300">{stationery.name}</strong> ({stationery.address})
            </p>
          )}
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" /> Futa Vyote
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 flex-1">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${
                    item.type === 'PRINTING'
                      ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {item.type === 'PRINTING' ? (
                    <Printer className="w-6 h-6" />
                  ) : (
                    <ShoppingBag className="w-6 h-6" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={item.type === 'PRINTING' ? 'brand' : 'warning'} size="sm">
                      {item.type === 'PRINTING' ? 'Printing Job' : 'Marketplace'}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-snug">{item.title}</h4>
                  {item.printConfig && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 space-x-2">
                      <span>Kurasa: {item.printConfig.pageCount}</span>
                      <span>• Binding: {item.printConfig.binding}</span>
                      <span>• Karatasi: {item.printConfig.paperSize}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quantity Controls & Price */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800">
                <div className="text-right">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 block">
                    TZS {item.totalPrice.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    TZS {item.unitPrice.toLocaleString()} / nakala
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 w-5 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Card */}
        <div>
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4 sticky top-24">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
              Muhtasari wa Oda (Summary)
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center justify-between">
                <span>Gharama ya Uchapaji (Printing):</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  TZS {getPrintingCost().toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Vifaa vya Dukani (Products):</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  TZS {getProductCost().toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Makadirio ya Usafiri (Delivery):</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  TZS {estimatedDelivery.toLocaleString()}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between font-extrabold text-sm text-brand-700 dark:text-brand-400">
                <span>JUMLA KUU (TOTAL):</span>
                <span className="text-base">TZS {total.toLocaleString()}</span>
              </div>
            </div>

            <Link href="/checkout">
              <Button
                variant="primary"
                size="lg"
                className="w-full mt-4"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Endelea na Malipo (Checkout)
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
