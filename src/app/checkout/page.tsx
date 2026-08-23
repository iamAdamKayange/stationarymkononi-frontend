'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Phone,
  CreditCard,
  Building,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Smartphone,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { LocationPickerMap } from '../../components/maps/LocationPickerMap';
import { PaymentDemoModal } from '../../components/payment/PaymentDemoModal';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../lib/api';
import { Address, PaymentMethod } from '../../types';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { items, stationery, getSubtotal, getPrintingCost, getProductCost, clearCart } =
    useCartStore();

  // Delivery Form State
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLat, setDeliveryLat] = useState<number | null>(null);
  const [deliveryLng, setDeliveryLng] = useState<number | null>(null);
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);

  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('M_PESA');
  const [paymentPhone, setPaymentPhone] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [createdOrderData, setCreatedOrderData] = useState<{
    orderId: string;
    orderNumber: string;
    totalAmount: number;
    transactionReference: string;
    instructions?: string;
  } | null>(null);

  const subtotal = getSubtotal();
  const deliveryFee = 2000;
  const totalAmount = subtotal + deliveryFee;

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadProfile = async () => {
      try {
        const res = (await api.get('/auth/me')) as {
          data: {
            phoneNumber?: string;
            addresses?: Address[];
          };
        };

        const addresses = res?.data?.addresses || [];
        setSavedAddresses(addresses);

        const defaultAddress = addresses.find((address) => address.isDefault) || addresses[0];
        if (defaultAddress) {
          setDeliveryAddress(defaultAddress.addressLine);
          setDeliveryLat(defaultAddress.latitude);
          setDeliveryLng(defaultAddress.longitude);
          setDeliveryInstructions(defaultAddress.instructions || '');
        }

        const phone = res?.data?.phoneNumber || user?.phoneNumber || '';
        setDeliveryPhone((prev) => prev || phone);
        setPaymentPhone((prev) => prev || phone);
      } catch {
        if (user?.phoneNumber) {
          setDeliveryPhone((prev) => prev || user.phoneNumber || '');
          setPaymentPhone((prev) => prev || user.phoneNumber || '');
        }
      }
    };

    loadProfile();
  }, [isAuthenticated, user?.phoneNumber]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Tafadhali ingia kwenye akaunti yako ili kuendelea na malipo');
      router.push('/auth/login');
      return;
    }

    if (!stationery) {
      toast.error('Duka la stationery halikuchaguliwa');
      return;
    }

    if (deliveryLat === null || deliveryLng === null) {
      toast.error('Tafadhali weka eneo la delivery kwanza');
      return;
    }

    if (items.length === 0) {
      toast.error('Kikapu chako kiko wazi');
      return;
    }

    setIsSubmitting(true);

    try {
      const printItems = items
        .filter((i) => i.type === 'PRINTING' && i.printConfig)
        .map((i) => ({
          documentId: i.printConfig!.documentId,
          paperSize: i.printConfig!.paperSize,
          colorOption: i.printConfig!.colorOption,
          sideOption: i.printConfig!.sideOption,
          orientation: i.printConfig!.orientation,
          binding: i.printConfig!.binding,
          paperType: i.printConfig!.paperType,
          copies: i.printConfig!.copies,
          pagesToPrint: i.printConfig!.pagesToPrint,
          customNotes: i.printConfig!.customNotes,
        }));

      const productItems = items
        .filter((i) => i.type === 'PRODUCT' && i.product)
        .map((i) => ({
          productId: i.product!.id,
          quantity: i.quantity,
        }));

      const payload = {
        stationeryId: stationery.id,
        deliveryAddress,
        deliveryLatitude: deliveryLat,
        deliveryLongitude: deliveryLng,
        deliveryPhone,
        deliveryInstructions,
        paymentMethod,
        customerPhoneForPayment: paymentPhone,
        printItems,
        productItems,
      };

      const response = (await api.post('/orders', payload)) as {
        data: {
          order: { id: string; orderNumber: string };
          payment: { transactionReference: string };
          paymentInstructions: string;
        };
      };

      setCreatedOrderData({
        orderId: response.data.order.id,
        orderNumber: response.data.order.orderNumber,
        totalAmount,
        transactionReference: response.data.payment.transactionReference,
        instructions: response.data.paymentInstructions,
      });

      clearCart();
      setPaymentModalOpen(true);
    } catch (err) {
      toast.error((err as Error).message || 'Imeshindikana kutuma oda. Jaribu tena.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyAndRedirect = async () => {
    if (!createdOrderData) return;
    try {
      await api.post('/payments/verify', {
        transactionReference: createdOrderData.transactionReference,
        providerReference: `MOCK-${Date.now()}`,
      });
      toast.success('Malipo yamethibitishwa! Inafungua tracking...');
      router.push(`/orders/${createdOrderData.orderId}`);
    } catch {
      router.push(`/orders/${createdOrderData.orderId}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          Kamilisha Oda na Malipo (Checkout)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Weka eneo la kufikishiwa mzigo na chagua njia ya malipo ya Tanzania.
        </p>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Delivery Address + Payment Provider */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Delivery Location */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-600" />
              1. Eneo la Kufikishiwa (Delivery Location)
            </h3>

            {/* Interactive Map Picker */}
            <LocationPickerMap
              initialLat={deliveryLat ?? undefined}
              initialLng={deliveryLng ?? undefined}
              onLocationSelect={(lat, lng) => {
                setDeliveryLat(lat);
                setDeliveryLng(lng);
              }}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Anuani Kamili ya Kufikisha
              </label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder={
                  savedAddresses.length > 0
                    ? 'Chagua au hariri anuani iliyohifadhiwa'
                    : 'Weka anuani ya delivery'
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 bg-white"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Namba ya Simu ya Kupokelea Mzigo
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    value={deliveryPhone}
                    onChange={(e) => setDeliveryPhone(e.target.value)}
                    placeholder="Namba ya simu ya kupokea mzigo"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Maelekezo kwa Rider (Instructions)
                </label>
                <input
                  type="text"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder="Maelekezo yoyote ya ziada kwa rider"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Payment Provider */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-600" />
              2. Njia ya Malipo (Tanzania Payment Gateways)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('M_PESA')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  paymentMethod === 'M_PESA'
                    ? 'border-red-500 bg-red-50/40 ring-2 ring-red-500'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-red-600 text-sm">M-Pesa</div>
                <span className="text-[10px] text-slate-500 mt-2">Vodacom USSD Push</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('TIGO_PESA')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  paymentMethod === 'TIGO_PESA'
                    ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-blue-600 text-sm">Tigo Pesa</div>
                <span className="text-[10px] text-slate-500 mt-2">Tigo / Mixx</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('AIRTEL_MONEY')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  paymentMethod === 'AIRTEL_MONEY'
                    ? 'border-rose-500 bg-rose-50/40 ring-2 ring-rose-500'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-rose-600 text-sm">Airtel Money</div>
                <span className="text-[10px] text-slate-500 mt-2">Airtel Tanzania</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  paymentMethod === 'CARD'
                    ? 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-500'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-brand-700 text-sm">Kadi (Visa/Mastercard)</div>
                <span className="text-[10px] text-slate-500 mt-2">Online Banking</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Namba ya Simu ya Kufanyia Malipo ({paymentMethod})
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  value={paymentPhone}
                  onChange={(e) => setPaymentPhone(e.target.value)}
                  placeholder="Namba ya simu ya malipo"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 bg-white"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Summary Card */}
        <div>
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-4 sticky top-24">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">
              Mchanganuo Kamili (Total Amount)
            </h3>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span>Gharama ya Printing:</span>
                <span className="font-semibold text-slate-900">
                  TZS {getPrintingCost().toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Vifaa vya Dukani:</span>
                <span className="font-semibold text-slate-900">
                  TZS {getProductCost().toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Gharama ya Delivery:</span>
                <span className="font-semibold text-slate-900">
                  TZS {deliveryFee.toLocaleString()}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between font-extrabold text-sm text-brand-700">
                <span>JUMLA YA KULIPA:</span>
                <span className="text-base">TZS {totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-4"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Lipa Sasa (TZS {totalAmount.toLocaleString()})
            </Button>
          </div>
        </div>
      </form>

      {/* Payment Processing & Interactive Demo Modal */}
      {createdOrderData && (
        <PaymentDemoModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            router.push(`/orders/${createdOrderData.orderId}`);
          }}
          orderId={createdOrderData.orderId}
          orderNumber={createdOrderData.orderNumber}
          amount={createdOrderData.totalAmount}
          paymentMethod={paymentMethod}
          transactionReference={createdOrderData.transactionReference}
          customerPhone={paymentPhone}
          onSuccess={(orderId) => {
            setPaymentModalOpen(false);
            router.push(`/orders/${orderId}`);
          }}
        />
      )}
    </div>
  );
}
