'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building,
  Printer,
  ShoppingBag,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  Download,
  Plus,
  Play,
  PackageCheck,
  Star,
  DollarSign,
  TrendingUp,
  Settings,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { Modal } from '../../../components/ui/Modal';
import { DocumentList } from '../../../components/ui/DocumentList';
import { useAuthStore } from '../../../store/useAuthStore';
import { api } from '../../../lib/api';
import { getSocket } from '../../../lib/socket';
import { Order, Stationery, Product } from '../../../types';
import toast from 'react-hot-toast';

export default function StationeryDashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [shop, setShop] = useState<Stationery | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'PRINTING' | 'READY' | 'ALL' | 'CATALOG' | 'DOCUMENTS'>('PENDING');

  // Add Product Modal State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductCatId, setNewProductCatId] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductImages, setNewProductImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  const loadData = async () => {
    try {
      const [userRes, ordersRes, catsRes] = await Promise.all([
        api.get('/auth/me') as Promise<{ data: { stationery?: Stationery } }>,
        api.get('/orders') as Promise<{ data: Order[] }>,
        api.get('/products/categories') as Promise<{ data: Array<{ id: string; name: string }> }>,
      ]);

      if (userRes?.data?.stationery) setShop(userRes.data.stationery);
      if (ordersRes?.data) setOrders(ordersRes.data);
      if (catsRes?.data) {
        setCategories(catsRes.data);
        if (catsRes.data.length > 0) setNewProductCatId(catsRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadData();

    // Socket listener for new incoming orders
    const socket = getSocket();
    if (user?.id) {
      socket.emit('join:stationery', user.id);
    }

    const handleNewOrder = (_orderData: unknown) => {
      toast.success('Oda Mpya Imewasili! 📄 Bofya kuipitia');
      loadData();
    };

    socket.on('stationery:new_order', handleNewOrder);

    return () => {
      socket.off('stationery:new_order', handleNewOrder);
    };
  }, [isAuthenticated, user?.id]);

  const handleUpdateOrderStatus = async (
    orderId: string,
    status: 'ACCEPTED_BY_STATIONERY' | 'REJECTED' | 'PRINTING' | 'READY_FOR_PICKUP'
  ) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      toast.success(`Hali ya oda imebadilishwa kuwa: ${status}`);
      loadData();
    } catch (err) {
      toast.error((err as Error).message || 'Kushindwa kubadili hali ya oda');
    }
  };

  const handleAddImage = (urlToAdd?: string) => {
    const url = urlToAdd || imageUrlInput.trim();
    if (!url) return;
    if (newProductImages.includes(url)) {
      toast.error('Picha hii tayari imewekwa');
      return;
    }
    setNewProductImages((prev) => [...prev, url]);
    setImageUrlInput('');
    toast.success(`Picha imeongezwa! (${newProductImages.length + 1}/3)`);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = (await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })) as { data: { fileUrl: string } };

      if (res?.data?.fileUrl) {
        handleAddImage(res.data.fileUrl);
      }
    } catch (err) {
      toast.error('Kushindwa kupakia picha');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setNewProductImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newProductImages.length < 3) {
      toast.error(
        `Bidhaa inahitaji angalau picha 3. Umeweka picha ${newProductImages.length} tu.`
      );
      return;
    }

    try {
      await api.post('/products', {
        name: newProductName,
        description: newProductDesc.trim() || undefined,
        price: parseFloat(newProductPrice),
        categoryId: newProductCatId,
        images: newProductImages,
        imageUrl: newProductImages[0],
        stockQuantity: 100,
        isAvailable: true,
      });

      toast.success('Bidhaa imeongezwa dukani kwako na picha 3+! 🎉');
      setProductModalOpen(false);
      setNewProductName('');
      setNewProductPrice('');
      setNewProductDesc('');
      setNewProductImages([]);
      loadData();
    } catch (err) {
      toast.error((err as Error).message || 'Kushindwa kuongeza bidhaa');
    }
  };

  if (!isAuthenticated || user?.role !== 'STATIONERY') {
    return (
      <div className="max-w-md mx-auto my-12 text-center">
        <h3 className="font-bold text-slate-800">Ukurasa huu ni wa Stationery Shop Pekee</h3>
        <Link href="/auth/login" className="text-xs text-brand-600 underline mt-2 block">
          Ingia kama Stationery
        </Link>
      </div>
    );
  }

  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const printingOrders = orders.filter((o) => o.status === 'ACCEPTED_BY_STATIONERY' || o.status === 'PRINTING');
  const readyOrders = orders.filter((o) => o.status === 'READY_FOR_PICKUP' || o.status === 'RIDER_ASSIGNED' || o.status === 'RIDER_ACCEPTED');
  const totalRevenue = orders.reduce((sum, o) => sum + o.printingCost + o.productCost, 0);

  const getFilteredOrders = () => {
    switch (activeTab) {
      case 'PENDING':
        return pendingOrders;
      case 'PRINTING':
        return printingOrders;
      case 'READY':
        return readyOrders;
      case 'ALL':
      default:
        return orders;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* Shop Profile Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-brand-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-amber-500/20">
            {shop?.logoUrl ? (
              <img src={shop.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <Building className="w-8 h-8" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold">{shop?.name || user.fullName}</h1>
              <Badge variant="success" size="sm">
                Shop Portal
              </Badge>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              📍 {shop?.address || 'Dar es Salaam'} • 📞 {shop?.phoneNumber} • ⭐ {shop?.avgRating.toFixed(1)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/stationery/profile">
            <Button variant="outline" size="md" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
              Edit Profile
            </Button>
          </Link>
          <Button
            variant="primary"
            size="md"
            onClick={() => setProductModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Ongeza Bidhaa Dukani
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-amber-600">Oda Mpya (Pending)</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{pendingOrders.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-blue-600">Zinazochapwa (Printing)</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{printingOrders.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-emerald-600">Tayari kwa Rider</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{readyOrders.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-brand-600">Mapato ya Dukani</span>
          <div className="text-xl font-extrabold text-brand-700 mt-1">
            TZS {totalRevenue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Recent Documents */}
      <section className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Documents za Wateja</h2>
            <p className="text-xs text-slate-500">
              Hapa unaweza kuona uploads mpya, kufungua file, au kupakua kwa ajili ya print.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            leftIcon={<Download className="w-4 h-4" />}
            className="self-start sm:self-auto"
          >
            Refresh Files
          </Button>
        </div>

        <DocumentList 
          stationeryId={shop?.id}
          onDocumentSelect={(document) => {
            // Handle document selection if needed
            console.log('Selected document:', document);
          }}
          showFilters={true}
        />
      </section>

      {/* Queue Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'PENDING'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Oda Mpya ({pendingOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('PRINTING')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'PRINTING'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Inachapwa ({printingOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('READY')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'READY'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Tayari Kukabidhiwa ({readyOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('ALL')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'ALL'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Oda Zote ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('DOCUMENTS')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'DOCUMENTS'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Nyaraka (Documents)
        </button>
      </div>

      {/* Orders List */}
      {loading ? (
        <LoadingSpinner />
      ) : getFilteredOrders().length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
          <p className="text-xs text-slate-400">Hakuna oda katika sehemu hii kwa sasa.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {getFilteredOrders().map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-base">
                      Oda #{order.orderNumber}
                    </span>
                    <Badge variant="brand" size="sm">
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mteja: <strong className="text-slate-700">{order.customer?.fullName}</strong> (
                    {order.customer?.phoneNumber || order.deliveryPhone})
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs font-bold text-brand-700 block">
                    Thamani ya Oda: TZS {order.totalAmount.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Gharama ya Printing: TZS {order.printingCost.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Order Items & Options */}
              <div className="space-y-2 text-xs">
                <div className="font-bold text-slate-700">Nyaraka na Vifaa Vilivyoagizwa:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {order.orderItems?.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{item.title}</div>
                        <div className="text-slate-500 text-[11px]">Idadi: {item.quantity}</div>
                      </div>
                      <span className="font-bold text-slate-700">
                        TZS {item.totalPrice.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons depending on status */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  Kufikisha: <strong>{order.deliveryAddress}</strong>
                </div>

                <div className="flex items-center gap-2">
                  {/* PENDING: Accept or Reject */}
                  {order.status === 'PENDING' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateOrderStatus(order.id, 'REJECTED')}
                        leftIcon={<XCircle className="w-4 h-4 text-rose-500" />}
                      >
                        Kataa (Reject)
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          handleUpdateOrderStatus(order.id, 'ACCEPTED_BY_STATIONERY')
                        }
                        leftIcon={<CheckCircle className="w-4 h-4" />}
                      >
                        Kubali Oda (Accept)
                      </Button>
                    </>
                  )}

                  {/* ACCEPTED: Start Printing */}
                  {order.status === 'ACCEPTED_BY_STATIONERY' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleUpdateOrderStatus(order.id, 'PRINTING')}
                      leftIcon={<Play className="w-4 h-4" />}
                    >
                      Anza Kuchapa (Start Printing)
                    </Button>
                  )}

                  {/* PRINTING: Mark Ready */}
                  {order.status === 'PRINTING' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleUpdateOrderStatus(order.id, 'READY_FOR_PICKUP')}
                      leftIcon={<PackageCheck className="w-4 h-4" />}
                    >
                      Imekamilika / Iko Tayari kwa Rider
                    </Button>
                  )}

                  {/* Link to view Tracking */}
                  <Link href={`/orders/${order.id}`}>
                    <Button variant="outline" size="sm">
                      Fungua Maelezo
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'DOCUMENTS' && (
        <DocumentList 
          stationeryId={shop?.id}
          onDocumentSelect={(document) => {
            console.log('Selected document in stationery dashboard:', document);
          }}
          showFilters={true}
        />
      )}

      {/* Add Product Modal */}
      <Modal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title="Ongeza Bidhaa ya Dukani"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Jina la Bidhaa</label>
            <input
              type="text"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              placeholder="mfano: Kalamu ya BIC Blue, Counter Book 3 Quire"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Kategoria ya Bidhaa</label>
            <select
              value={newProductCatId}
              onChange={(e) => setNewProductCatId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Maelezo ya Ziada (Hiari)</label>
            <input
              type="text"
              value={newProductDesc}
              onChange={(e) => setNewProductDesc(e.target.value)}
              placeholder="mfano: Pakiti ya kalamu 50, au daftari lenye kurasa 288"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Bei ya Bidhaa (TZS)</label>
            <input
              type="number"
              value={newProductPrice}
              onChange={(e) => setNewProductPrice(e.target.value)}
              placeholder="500"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 bg-white"
              required
            />
          </div>

          {/* Mandatory Minimum 3 Product Images Section */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-brand-600" />
                Picha za Bidhaa (Angalau Picha 3 Zinahitajika) *
              </label>
              <Badge variant={newProductImages.length >= 3 ? 'success' : 'warning'} size="sm">
                {newProductImages.length} / 3 Picha
              </Badge>
            </div>

            {/* Thumbnail Preview Grid */}
            {newProductImages.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {newProductImages.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="relative w-full h-20 rounded-xl overflow-hidden border-2 border-brand-500/60 shadow-xs group bg-white"
                  >
                    <img src={imgUrl} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-md opacity-90 hover:opacity-100 transition-opacity shadow-xs"
                      title="Futa Picha"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Image Inputs */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="Bandika Linki ya Picha (Image URL) au tumia kitufe cha kupakia..."
                  className="flex-1 p-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddImage()}
                  disabled={!imageUrlInput.trim()}
                >
                  Ongeza URL
                </Button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs transition-colors">
                  <Plus className="w-3.5 h-3.5 text-brand-600" />
                  {uploadingImage ? 'Inapakia...' : 'Pakia Picha Kutoka Kwenye Kifaa'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>

                {newProductImages.length < 3 && (
                  <span className="text-[11px] font-medium text-amber-600">
                    Bado picha {3 - newProductImages.length}
                  </span>
                )}
              </div>

              {/* Preset Sample Images for quick testing */}
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">
                  Mifano ya Picha za Haraka (Bofya kuongeza):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { name: 'Kalamu (Pen)', url: 'https://images.unsplash.com/photo-1585336261026-7f093202976d?w=500&auto=format&fit=crop&q=60' },
                    { name: 'Daftari (Notebook)', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60' },
                    { name: 'Faili (Box File)', url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=60' },
                    { name: 'Kikokotoo (Calculator)', url: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=500&auto=format&fit=crop&q=60' },
                    { name: 'Rula & Vifaa', url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=60' },
                  ].map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleAddImage(preset.url)}
                      className="px-2 py-1 bg-white hover:bg-brand-50 border border-slate-200 hover:border-brand-300 rounded-lg text-[10px] font-medium text-slate-700 transition-colors"
                    >
                      + {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="md" onClick={() => setProductModalOpen(false)}>
              Ghairi
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={newProductImages.length < 3}
            >
              Hifadhi Bidhaa ({newProductImages.length}/3 Picha)
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
