'use client';

import React, { useState } from 'react';
import { ShoppingBag, Plus, Eye, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Product, Stationery } from '../../types';
import { useCartStore } from '../../store/useCartStore';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
  shopOverride?: Stationery;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, shopOverride }) => {
  const { addProduct } = useCartStore();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const imagesList =
    product.images && product.images.length > 0
      ? product.images
      : product.imageUrl
      ? [product.imageUrl]
      : ['https://images.unsplash.com/photo-1585336261026-7f093202976d?w=500&auto=format&fit=crop&q=60'];

  const currentImage = imagesList[activeImageIndex] || imagesList[0];
  const targetShop = shopOverride || product.stationery;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (targetShop) {
      addProduct(product, 1, targetShop);
      toast.success(`Imeongezwa kwenye kikapu: ${product.name}`);
    } else {
      toast.error('Duka la bidhaa halipatikani');
    }
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev + 1) % imagesList.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev - 1 + imagesList.length) % imagesList.length);
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-700 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
        <div>
          {/* Multi-Image Container with Swiper Controls */}
          <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-700 mb-3 group/img">
            <img
              src={currentImage}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {/* Photo count indicator badge */}
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
              <span>
                {activeImageIndex + 1}/{imagesList.length} Picha
              </span>
            </div>

            {/* Quick view button */}
            <button
              onClick={() => setPreviewModalOpen(true)}
              className="absolute top-2 right-2 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 p-1.5 rounded-full shadow-md opacity-0 group-hover/img:opacity-100 transition-opacity"
              title="Tazama Picha Kubwa"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            {/* Left/Right navigation arrows if 2+ images */}
            {imagesList.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center shadow-md opacity-0 group-hover/img:opacity-100 transition-opacity text-xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center shadow-md opacity-0 group-hover/img:opacity-100 transition-opacity text-xs"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Image pagination dots */}
            {imagesList.length > 1 && (
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/30 backdrop-blur-xs px-1.5 py-0.5 rounded-full">
                {imagesList.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex(i);
                    }}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      activeImageIndex === i ? 'bg-white w-3' : 'bg-white/60'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Meta */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-brand-600 dark:text-brand-400">
              {product.category?.name || 'Stationery'}
            </span>
            {targetShop && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[100px]">
                {targetShop.name}
              </span>
            )}
          </div>

          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 line-clamp-2">{product.name}</h3>

          {product.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{product.description}</p>
          )}
        </div>

        {/* Price & Add to Cart */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Bei:</span>
            <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              TZS {product.price.toLocaleString()}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            className="px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-transform active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> Ongeza
          </button>
        </div>
      </div>

      {/* Full Photo Gallery Modal */}
      {previewModalOpen && (
        <Modal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          title={product.name}
        >
          <div className="space-y-4">
            <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden bg-slate-900 dark:bg-slate-950 flex items-center justify-center">
              <img src={currentImage} alt={product.name} className="max-w-full max-h-full object-contain" />
            </div>

            {/* Thumbnail selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {imagesList.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                    activeImageIndex === idx
                      ? 'border-brand-500 ring-2 ring-brand-500'
                      : 'border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Bei:</span>
                <span className="text-base font-extrabold text-brand-700 dark:text-brand-400">
                  TZS {product.price.toLocaleString()}
                </span>
              </div>
              <button
                onClick={(e) => {
                  handleAddToCart(e);
                  setPreviewModalOpen(false);
                }}
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Weka Kwenye Kikapu
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
