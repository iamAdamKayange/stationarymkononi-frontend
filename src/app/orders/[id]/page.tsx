'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  Phone,
  Building,
  Bike,
  MapPin,
  Clock,
  ArrowLeft,
  Star,
  CheckCircle,
  FileText,
  CreditCard,
  Eye,
  Download,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { OrderStatusStepper } from '../../../components/orders/OrderStatusStepper';
import { LiveTrackingMap } from '../../../components/maps/LiveTrackingMap';
import { RatingModal } from '../../../components/orders/RatingModal';
import { PaymentDemoModal } from '../../../components/payment/PaymentDemoModal';
import { api } from '../../../lib/api';
import { getSocket } from '../../../lib/socket';
import { Order, TrackingPoint, DocumentFile } from '../../../types';
import toast from 'react-hot-toast';

interface TrackingSnapshot {
  id: string;
  currentLat?: number | null;
  currentLng?: number | null;
  trackingHistory?: TrackingPoint[];
  order?: {
    id: string;
    orderNumber: string;
    status: Order['status'];
    deliveryAddress: string;
    stationery?: {
      name: string;
      address: string;
      latitude: number;
      longitude: number;
      phoneNumber: string;
    };
  };
  rider?: {
    id: string;
    user?: {
      fullName: string;
      phoneNumber?: string;
      avatarUrl?: string;
    };
    vehicleType: string;
    vehiclePlate?: string;
  };
}

const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export default function OrderTrackingPage() {
  const params = useParams();
  const id = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<TrackingSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const openDocument = (doc: DocumentFile) => {
    window.open(doc.viewUrl || doc.fileUrl, '_blank', 'noopener,noreferrer');
  };

  const fetchOrder = async () => {
    try {
      const [orderRes, trackingRes] = await Promise.all([
        api.get(`/orders/${id}`) as Promise<{ data: Order }>,
        api.get(`/tracking/order/${id}`) as Promise<{ data: TrackingSnapshot }>,
      ]);

      if (orderRes?.data) setOrder(orderRes.data);
      if (trackingRes?.data) setTracking(trackingRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Imeshindikana kupakia taarifa za oda');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchOrder();

    // Socket.IO real-time order status listener
    const socket = getSocket();
    socket.emit('join:order', id);

    const handleStatusUpdate = (data: { status: Order['status'] }) => {
      if (data?.status) {
        setOrder((prev) => (prev ? { ...prev, status: data.status } : null));
        toast.success(`Hali ya oda imebadilika: ${data.status} 🚀`);
      }
    };

    socket.on('order:status_updated', handleStatusUpdate);

    return () => {
      socket.off('order:status_updated', handleStatusUpdate);
      socket.emit('leave:order', id);
    };
  }, [id]);

  if (loading) return <LoadingSpinner message="Inapakia taarifa za oda na ramani ya GPS..." />;
  if (!order) {
    return (
      <div className="max-w-md mx-auto my-12 text-center">
        <h3 className="font-bold text-slate-800">Oda haikupatikana</h3>
        <Link href="/orders" className="text-xs text-brand-600 underline mt-2 block">
          Rudi kwenye orodha ya oda
        </Link>
      </div>
    );
  }

  const stationeryLat =
    tracking?.order?.stationery?.latitude ?? order.stationery?.latitude;
  const stationeryLng =
    tracking?.order?.stationery?.longitude ?? order.stationery?.longitude;
  const dropoffLat = order.deliveryLatitude;
  const dropoffLng = order.deliveryLongitude;
  const rider = tracking?.rider || order.delivery?.rider;

  if (
    stationeryLat === undefined ||
    stationeryLng === undefined ||
    dropoffLat === undefined ||
    dropoffLng === undefined
  ) {
    return (
      <div className="max-w-md mx-auto my-12 text-center">
        <LoadingSpinner message="Inapakia ramani ya delivery kutoka backend..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Navigation Back */}
      <div className="flex items-center justify-between">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Rudi kwenye Oda Zangu
        </Link>

        {order.status === 'DELIVERED' && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setRatingModalOpen(true)}
            leftIcon={<Star className="w-4 h-4 fill-amber-300 text-amber-300" />}
          >
            Toa Alama (Review)
          </Button>
        )}
      </div>

      {/* Main Order Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Oda #{order.orderNumber}
              </h1>
              <Badge variant="brand" size="sm">
                {order.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Imewekwa: {new Date(order.createdAt).toLocaleString('sw-TZ')}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 block">Jumla ya Malipo:</span>
            <span className="text-lg sm:text-xl font-extrabold text-brand-700">
              TZS {order.totalAmount.toLocaleString()}
            </span>
            <div className="mt-1">
              <Badge
                variant={order.payment?.status === 'PAID' ? 'success' : 'warning'}
                size="sm"
              >
                {order.payment?.status === 'PAID' ? 'IMELIPWA ✓' : 'HAIJALIPWA (PENDING)'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Unpaid Order Demo Payment Prompt */}
        {order.payment?.status !== 'PAID' && (
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-amber-900">Malipo Bado Hayajakamilika</div>
                <div className="text-[11px] text-amber-700">
                  Thibitisha malipo kupitia M-Pesa / Tigo / Airtel ili stationery ianze kuchapa mara moja.
                </div>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setPaymentModalOpen(true)}
              leftIcon={<CreditCard className="w-4 h-4" />}
            >
              Lipa Sasa (Demo Pay)
            </Button>
          </div>
        )}

        {/* Real-time Order Status Stepper */}
        <OrderStatusStepper status={order.status} />

        {/* Live GPS Map Component */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-600" />
            Live Delivery GPS Tracking (Ramani ya Moja kwa Moja)
          </h3>
          <LiveTrackingMap
            orderId={order.id}
            deliveryId={order.delivery?.id}
            stationeryLocation={{ lat: stationeryLat, lng: stationeryLng }}
            stationeryName={tracking?.order?.stationery?.name || order.stationery?.name}
            customerLocation={{ lat: dropoffLat, lng: dropoffLng }}
            customerAddress={order.deliveryAddress}
            initialRiderLocation={
              tracking?.currentLat != null && tracking?.currentLng != null
                ? { lat: tracking.currentLat, lng: tracking.currentLng }
                : order.delivery?.currentLat && order.delivery?.currentLng
                ? { lat: order.delivery.currentLat, lng: order.delivery.currentLng }
                : undefined
            }
            trackingHistory={tracking?.trackingHistory || []}
          />
        </div>

        {/* Rider & Stationery Information Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Stationery Shop Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="text-[10px] font-bold uppercase text-amber-700">Stationery Shop</div>
            <h4 className="font-bold text-slate-900 text-sm">{order.stationery?.name}</h4>
            <p className="text-xs text-slate-500">{order.stationery?.address}</p>
            {order.stationery?.phoneNumber && (
              <a
                href={`tel:${order.stationery.phoneNumber}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:underline pt-1"
              >
                <Phone className="w-3.5 h-3.5" /> Piga Simu: {order.stationery.phoneNumber}
              </a>
            )}
          </div>

          {/* Rider Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="text-[10px] font-bold uppercase text-blue-700">Delivery Rider</div>
            {rider ? (
              <>
                <h4 className="font-bold text-slate-900 text-sm">{rider.user?.fullName}</h4>
                <p className="text-xs text-slate-500">
                  {rider.vehicleType} • Bamba: <strong>{rider.vehiclePlate || 'N/A'}</strong>
                </p>
                {rider.user?.phoneNumber && (
                  <a
                    href={`tel:${rider.user.phoneNumber}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:underline pt-1"
                  >
                    <Phone className="w-3.5 h-3.5" /> Piga Simu Rider: {rider.user.phoneNumber}
                  </a>
                )}
              </>
            ) : (
              <p className="text-xs text-slate-500 italic py-2">
                Mfumo unatafuta rider wa karibu kukabidhiwa mzigo wako...
              </p>
            )}
          </div>
        </div>

        {/* Itemized Receipt */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Vipengele vya Oda (Items Ordered)
          </h3>
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
            {order.orderItems?.map((item) => (
              <div key={item.id} className="p-3.5 bg-slate-50/50 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-800">{item.title}</div>
                  <div className="text-slate-400 text-[11px]">Idadi: {item.quantity}</div>
                </div>
                <span className="font-bold text-slate-900">TZS {item.totalPrice.toLocaleString()}</span>
              </div>
            ))}
          </div>

          {order.documents && order.documents.length > 0 && (
            <div className="space-y-3 pt-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Nyaraka Zilizopakiwa (Upload Files)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {order.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-slate-900 text-sm break-words">
                            {doc.fileName}
                          </h4>
                          <Badge variant="neutral" size="sm" className="whitespace-nowrap">
                            {doc.fileType.includes('pdf') ? 'PDF' : 'FILE'}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {formatFileSize(doc.fileSize)} • Kurasa {doc.pageCount}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Imepakiwa na {doc.uploadedBy?.fullName || 'mtumiaji'} •{' '}
                          {new Date(doc.createdAt).toLocaleString('sw-TZ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1 min-w-[120px]"
                        onClick={() => openDocument(doc)}
                        leftIcon={<Eye className="w-4 h-4" />}
                      >
                        Fungua
                      </Button>
                      <a
                        href={doc.downloadUrl || doc.fileUrl}
                        download
                        className="inline-flex flex-1 min-w-[120px] items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Download className="w-4 h-4 mr-1.5" />
                        Pakua
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Gharama ya Printing:</span>
              <span>TZS {order.printingCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Vifaa vya Dukani:</span>
              <span>TZS {order.productCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Gharama ya Usafiri (Delivery):</span>
              <span>TZS {order.deliveryFee.toLocaleString()}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-sm text-slate-900">
              <span>JUMLA KUU:</span>
              <span className="text-brand-700">TZS {order.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <RatingModal
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        orderId={order.id}
        stationeryName={order.stationery?.name}
        riderName={rider?.user?.fullName}
        onSuccess={fetchOrder}
      />

      {/* Demo Payment Modal */}
      {order.payment && (
        <PaymentDemoModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          orderId={order.id}
          orderNumber={order.orderNumber}
          amount={order.totalAmount}
          paymentMethod={order.payment.paymentMethod}
          transactionReference={order.payment.transactionReference}
          customerPhone={order.deliveryPhone || undefined}
          onSuccess={() => {
            setPaymentModalOpen(false);
            fetchOrder();
          }}
        />
      )}
    </div>
  );
}
