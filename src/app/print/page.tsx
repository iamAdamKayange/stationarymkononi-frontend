'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Printer,
  ArrowRight,
  Sparkles,
  MapPin,
  Store,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { DocumentUpload } from '../../components/ui/DocumentUpload';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import {
  Stationery,
  DocumentUploadResponse,
  PaperSize,
  ColorOption,
  SideOption,
  OrientationOption,
  BindingType,
} from '../../types';
import toast from 'react-hot-toast';

export default function PrintPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const [step, setStep] = useState<1 | 2>(1); // 1: Upload & Config, 2: Review & Submit Direct Order
  const [uploadedDoc, setUploadedDoc] = useState<DocumentUploadResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Printing Options State
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [colorOption, setColorOption] = useState<ColorOption>('BLACK_AND_WHITE');
  const [sideOption, setSideOption] = useState<SideOption>('SINGLE_SIDED');
  const [orientation, setOrientation] = useState<OrientationOption>('PORTRAIT');
  const [binding, setBinding] = useState<BindingType>('NONE');
  const [paperType, setPaperType] = useState('Standard 80gsm');
  const [copies, setCopies] = useState(1);
  const [pagesToPrint, setPagesToPrint] = useState('All');
  const [customNotes, setCustomNotes] = useState('');

  // Delivery Information (required for direct order)
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLat, setDeliveryLat] = useState<number | null>(null);
  const [deliveryLng, setDeliveryLng] = useState<number | null>(null);
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  // APEX Stationery (primary stationery for production)
  const [apexStationery, setApexStationery] = useState<Stationery | null>(null);
  const [loadingApex, setLoadingApex] = useState(false);

  // Estimated Price breakdown
  const [pricing, setPricing] = useState({
    pricePerPage: 300,
    printingTotal: 300,
    bindingCost: 0,
    totalCost: 300,
  });

  // Calculate pricing whenever options change
  useEffect(() => {
    const pageCount = uploadedDoc ? uploadedDoc.pageCount : 1;
    let basePrice = colorOption === 'COLOR' ? 500 : 300;
    if (paperSize === 'A3') basePrice *= 2;
    if (paperSize === 'A5') basePrice *= 0.8;

    const pageMultiplier = sideOption === 'DOUBLE_SIDED' ? 0.95 : 1.0;
    const effectivePricePerPage = Math.round(basePrice * pageMultiplier);
    const printingTotal = effectivePricePerPage * pageCount * Math.max(1, copies);

    let bindingCost = 0;
    if (binding === 'SPIRAL') bindingCost = 1500;
    else if (binding === 'COMB') bindingCost = 1200;
    else if (binding === 'HARD_COVER') bindingCost = 5000;
    else if (binding === 'STAPLE') bindingCost = 200;
    else if (binding === 'OTHER') bindingCost = 1000;

    const totalBinding = bindingCost * Math.max(1, copies);
    const totalCost = printingTotal + totalBinding;

    setPricing({
      pricePerPage: effectivePricePerPage,
      printingTotal,
      bindingCost: totalBinding,
      totalCost,
    });
  }, [uploadedDoc, paperSize, colorOption, sideOption, binding, copies]);

  // Load APEX stationery on component mount
  useEffect(() => {
    const loadApexStationery = async () => {
      setLoadingApex(true);
      try {
        const res = (await api.get('/stationeries')) as { data: Stationery[] };
        if (res?.data && res.data.length > 0) {
          // In single-stationery mode, API returns only APEX
          setApexStationery(res.data[0]);
        }
      } catch (err) {
        console.error('Failed to load APEX stationery:', err);
      } finally {
        setLoadingApex(false);
      }
    };

    // Pre-fill delivery info from user profile
    const loadUserInfo = async () => {
      try {
        const res = (await api.get('/profile')) as any;
        if (res?.data) {
          const userData = res.data;
          if (userData.phoneNumber) setDeliveryPhone(userData.phoneNumber);
          if (userData.addresses && userData.addresses.length > 0) {
            const defaultAddress = userData.addresses.find((addr: any) => addr.isDefault) || userData.addresses[0];
            if (defaultAddress) {
              setDeliveryAddress(defaultAddress.addressLine);
              setDeliveryLat(defaultAddress.latitude);
              setDeliveryLng(defaultAddress.longitude);
              setDeliveryInstructions(defaultAddress.instructions || '');
            }
          }
        }
      } catch (err) {
        console.error('Failed to load user info:', err);
      }
    };

    loadApexStationery();
    loadUserInfo();
  }, []);

  const handleProceedToReview = async () => {
    if (!uploadedDoc) {
      toast.error('Tafadhali pakia nyaraka kwanza');
      return;
    }
    if (!apexStationery) {
      toast.error('APEX Stationery haipatikani. Tafadhali jaribu tena.');
      return;
    }
    setStep(2);
  };

  const handleDocumentUploadSuccess = (document: DocumentUploadResponse) => {
    setUploadedDoc(document);
  };

  const handleDeleteDocument = async () => {
    if (!uploadedDoc) return;

    try {
      await api.delete(`/documents/${uploadedDoc.id}`);
      setUploadedDoc(null);
      toast.success('Nyaraka imefutwa');
    } catch (err: any) {
      console.error('Delete error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Imeshindikana kufuta nyaraka';
      toast.error(errorMessage);
    }
  };

  const handleSubmitDirectOrder = async () => {
    if (!uploadedDoc || !apexStationery) {
      toast.error('Tafadhali hakikisha nyaraka imepakiwa na APEX Stationery inapatikana');
      return;
    }

    if (!deliveryAddress || !deliveryLat || !deliveryLng || !deliveryPhone) {
      toast.error('Tafadhali jaza anuani ya utoaji na namba ya simu');
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        stationeryId: apexStationery.id,
        deliveryAddress,
        deliveryLatitude: deliveryLat,
        deliveryLongitude: deliveryLng,
        deliveryPhone,
        deliveryInstructions: deliveryInstructions.trim() || undefined,
        paymentMethod: 'CASH_ON_DELIVERY',
        customerPhoneForPayment: deliveryPhone,
        printItems: [
          {
            documentId: uploadedDoc.id,
            paperSize,
            colorOption,
            sideOption,
            orientation,
            binding,
            paperType,
            copies,
            pagesToPrint,
            customNotes: customNotes.trim() || undefined,
          },
        ],
        productItems: [],
      };

      const res = (await api.post('/orders', orderData)) as any;
      
      toast.success('Oda ya uchapaji imewasilishwa! Malipo yanahitajika.');
      router.push(`/orders/${res.data.order.id}`);
    } catch (err: any) {
      console.error('Order submission error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Imeshindikana kuwasilisha oda';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-800 to-brand-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-block bg-white/20 text-white border-white/20 px-3 py-1 rounded-full text-xs font-bold mb-2">
            Document Printing Wizard
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold">Uchapaji wa Nyaraka (Printing)</h1>
          <p className="text-xs sm:text-sm text-brand-100 mt-1">
            Pakia document yako, chagua ukubwa, rangi na binding. Malipo yanahitajishwa kabla ya uchapaji. Oda yako itachapwa na APEX Digital & Printing Express.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20">
          <Sparkles className="w-5 h-5 text-amber-300" />
          <span className="text-xs font-bold">APEX Stationery Only</span>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 text-xs font-semibold">
        <div
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
            step === 1 ? 'bg-brand-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
          Pakia & Chagua Options
        </div>
        <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
        <div
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
            step === 2 ? 'bg-brand-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">2</span>
          Hakiki & Wasilisha Oda
        </div>
      </div>

      {/* STEP 1: Upload and Configuration */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Upload & Options */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Upload Component */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-brand-600" />
                1. Pakia Nyaraka Yako (Document Upload)
              </h3>

              <DocumentUpload onUploadSuccess={handleDocumentUploadSuccess} />

              {uploadedDoc && (
                <div className="mt-4 p-4 bg-brand-50 dark:bg-brand-950/30 rounded-xl border border-brand-200 dark:border-brand-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{uploadedDoc.fileName}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{uploadedDoc.pageCount} kurasa • {(uploadedDoc.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteDocument}
                      className="text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                    >
                      Futa
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Printing Options */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Printer className="w-4 h-4 text-brand-600" />
                2. Machaguo ya Uchapaji (Printing Options)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Paper Size */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Ukubwa wa Karatasi (Paper Size)</label>
                  <select
                    value={paperSize}
                    onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100"
                  >
                    <option value="A4">A4 (Standard Document)</option>
                    <option value="A3">A3 (Kubwa / Poster / Blueprint)</option>
                    <option value="A5">A5 (Kijitabu / Booklet)</option>
                  </select>
                </div>

                {/* Color Option */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Rangi ya Uchapaji (Color)</label>
                  <select
                    value={colorOption}
                    onChange={(e) => setColorOption(e.target.value as ColorOption)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100"
                  >
                    <option value="BLACK_AND_WHITE">Nyeusi na Nyeupe (Black & White) - TZS 300/pg</option>
                    <option value="COLOR">Rangi Kamili (Full Colour) - TZS 500/pg</option>
                  </select>
                </div>

                {/* Sides */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Upande wa Karatasi (Sides)</label>
                  <select
                    value={sideOption}
                    onChange={(e) => setSideOption(e.target.value as SideOption)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100"
                  >
                    <option value="SINGLE_SIDED">Upande Mmoja tu (Single-Sided)</option>
                    <option value="DOUBLE_SIDED">Pande Zote Mbili (Double-Sided)</option>
                  </select>
                </div>

                {/* Orientation */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Mkao (Orientation)</label>
                  <select
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value as OrientationOption)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100"
                  >
                    <option value="PORTRAIT">Wima (Portrait)</option>
                    <option value="LANDSCAPE">Mlalo (Landscape)</option>
                  </select>
                </div>

                {/* Binding */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Ufungaji / Jalada (Binding)</label>
                  <select
                    value={binding}
                    onChange={(e) => setBinding(e.target.value as BindingType)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100"
                  >
                    <option value="NONE">Bila Binding (Hakuna) - TZS 0</option>
                    <option value="SPIRAL">Spiral Binding (Plastic Coil) - TZS 1,500</option>
                    <option value="COMB">Comb Binding - TZS 1,200</option>
                    <option value="HARD_COVER">Hard Cover (Kitabu/Project) - TZS 5,000</option>
                    <option value="STAPLE">Kupiga Pini (Stapling) - TZS 200</option>
                  </select>
                </div>

                {/* Number of Copies */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Idadi ya Nakala (Copies)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={copies}
                    onChange={(e) => setCopies(parseInt(e.target.value || '1', 10))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Custom Instructions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Maelekezo ya Ziada (Hiari)</label>
                <textarea
                  rows={2}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="mfano: Chapa kuanzia ukurasa wa 5 hadi 20 pekee au tumia karatasi nzito kwenye cover."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Right: Live Price Summary Card */}
          <div>
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-md sticky top-24 space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
                Mchanganuo wa Bei (Live Calculation)
              </h3>

              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Kurasa:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{uploadedDoc ? uploadedDoc.pageCount : 1}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Nakala (Copies):</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{copies}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Gharama ya Karatasi:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">TZS {pricing.printingTotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Gharama ya Binding:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">TZS {pricing.bindingCost.toLocaleString()}</span>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between font-bold text-sm text-brand-700 dark:text-brand-400">
                  <span>JUMLA YA PRINTING:</span>
                  <span className="text-base">TZS {pricing.totalCost.toLocaleString()}</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full mt-4"
                onClick={handleProceedToReview}
                disabled={!uploadedDoc || !apexStationery}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Endelea Kwa Hakiki
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Review & Submit Direct Order */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Hakiki Oda Yako</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Thibitisha maelezo kabla kuwasilisha oda kwa APEX</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setStep(1)}>
              Rudi
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Order Summary */}
            <div className="space-y-6">
              {/* Document Summary */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-600" />
                  Maelezo ya Nyaraka
                </h3>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-950/40 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">{uploadedDoc?.fileName}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {uploadedDoc?.pageCount} kurasa • {paperSize} • {colorOption === 'COLOR' ? 'Rangi' : 'Nyeusi & Nyeupe'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Printing Options Summary */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Printer className="w-4 h-4 text-brand-600" />
                  Machaguo ya Uchapaji
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Ukubwa:</span>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{paperSize}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Rangi:</span>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{colorOption === 'COLOR' ? 'Rangi Kamili' : 'Nyeusi & Nyeupe'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Upande:</span>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{sideOption === 'DOUBLE_SIDED' ? 'Pande Zote' : 'Upande Mmoja'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Mkao:</span>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{orientation === 'PORTRAIT' ? 'Wima' : 'Mlalo'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Binding:</span>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{binding}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Nakala:</span>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{copies}</p>
                  </div>
                </div>
                {customNotes && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 text-xs">Maelekezo ya Ziada:</span>
                    <p className="text-xs text-slate-900 dark:text-slate-100 mt-1">{customNotes}</p>
                  </div>
                )}
              </div>

              {/* Stationery Info */}
              <div className="bg-gradient-to-r from-brand-50 to-amber-50 dark:from-brand-950/20 dark:to-amber-950/20 rounded-3xl p-6 border border-brand-200/50 dark:border-brand-800/50 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Store className="w-4 h-4 text-brand-600" />
                  Duka la Uchapaji
                </h3>
                <div>
                  <h4 className="font-bold text-brand-700 dark:text-brand-400">{apexStationery?.name}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{apexStationery?.address}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{apexStationery?.phoneNumber}</p>
                </div>
              </div>
            </div>

            {/* Right: Delivery Form & Price */}
            <div className="space-y-6">
              {/* Delivery Information Form */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-600" />
                  Maelezo ya utoaji (Delivery)
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Anuani ya utoaji</label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Mfano: Sam Nujoma Rd, Mwenge Bus Stand"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={deliveryLat || ''}
                        onChange={(e) => setDeliveryLat(parseFloat(e.target.value) || null)}
                        placeholder="-6.8"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={deliveryLng || ''}
                        onChange={(e) => setDeliveryLng(parseFloat(e.target.value) || null)}
                        placeholder="39.2"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Namba ya Simu ya Mteja</label>
                    <input
                      type="tel"
                      value={deliveryPhone}
                      onChange={(e) => setDeliveryPhone(e.target.value)}
                      placeholder="+255 712 345 678"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Maelekezo ya Ziada (Hiari)</label>
                    <textarea
                      rows={2}
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                      placeholder="Mfano: Kwenye lango la mbele, piga simu kabla ya kufika"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Price Summary */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
                  Mchanganuo wa Bei
                </h3>
                <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Kurasa:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{uploadedDoc ? uploadedDoc.pageCount : 1}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Nakala (Copies):</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{copies}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Gharama ya Uchapaji:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">TZS {pricing.printingTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Gharama ya Binding:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">TZS {pricing.bindingCost.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Gharama ya Delivery (Makadirio):</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">TZS ~2,000 - 5,000</span>
                  </div>
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between font-bold text-sm text-brand-700 dark:text-brand-400">
                    <span>JUMLYA YA MAKADIRIO:</span>
                    <span className="text-base">TZS {pricing.totalCost.toLocaleString()} + Delivery</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full mt-4"
                  onClick={handleSubmitDirectOrder}
                  isLoading={submitting}
                  disabled={!deliveryAddress || !deliveryLat || !deliveryLng || !deliveryPhone}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Wasilisha Oda kwa APEX
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
