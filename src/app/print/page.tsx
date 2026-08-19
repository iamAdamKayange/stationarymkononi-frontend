'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Printer,
  Compass,
  Star,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
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
  const { isAuthenticated } = useAuthStore();
  const addPrintJobToCart = useCartStore((state) => state.addPrintJob);

  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload & Config, 2: Choose Stationery, 3: Success / Cart
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedDoc, setUploadedDoc] = useState<DocumentUploadResponse | null>(null);

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

  // Stationeries
  const [stationeries, setStationeries] = useState<Stationery[]>([]);
  const [selectedStationery, setSelectedStationery] = useState<Stationery | null>(null);
  const [loadingShops, setLoadingShops] = useState(false);

  // Estimated Price breakdown
  const [pricing, setPricing] = useState({
    pricePerPage: 100,
    printingTotal: 100,
    bindingCost: 0,
    totalCost: 100,
  });

  // Calculate pricing whenever options change
  useEffect(() => {
    const pageCount = uploadedDoc ? uploadedDoc.pageCount : 1;
    let basePrice = colorOption === 'COLOR' ? 500 : 100;
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

  // Load Stationeries when moving to step 2
  const handleProceedToShopSelect = async () => {
    if (!uploadedDoc) {
      toast.error('Tafadhali pakia nyaraka kwanza');
      return;
    }
    setStep(2);
    setLoadingShops(true);
    try {
      const res = (await api.get('/stationeries')) as { data: Stationery[] };
      if (res?.data) {
        setStationeries(res.data);
        if (res.data.length > 0 && !selectedStationery) {
          setSelectedStationery(res.data[0]);
        }
      }
    } catch (err) {
      toast.error('Imeshindikana kupakia orodha ya stationery');
    } finally {
      setLoadingShops(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!isAuthenticated) {
      toast.error('Tafadhali ingia kwenye akaunti yako ili ku-upload nyaraka');
      router.push('/auth/login');
      return;
    }

    setFile(selectedFile);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = (await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })) as { data: DocumentUploadResponse };

      setUploadedDoc(response.data);
      toast.success(`Nyaraka '${response.data.fileName}' imepakiwa vizuri!`);
    } catch (err) {
      toast.error((err as Error).message || 'Kupakia nyaraka kumeshindikana');
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleAddToCart = () => {
    if (!uploadedDoc || !selectedStationery) {
      toast.error('Tafadhali chagua stationery ya kuchapa');
      return;
    }

    addPrintJobToCart(
      {
        documentId: uploadedDoc.id,
        fileName: uploadedDoc.fileName,
        fileUrl: uploadedDoc.fileUrl,
        pageCount: uploadedDoc.pageCount,
        paperSize,
        colorOption,
        sideOption,
        orientation,
        binding,
        paperType,
        copies,
        pagesToPrint,
        customNotes: customNotes.trim() || undefined,
        estimatedPrice: pricing.totalCost,
      },
      selectedStationery
    );

    toast.success('Oda ya uchapaji imeongezwa kwenye kikapu! 🛒');
    router.push('/cart');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-800 to-brand-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Badge variant="brand" className="bg-white/20 text-white border-white/20 mb-2">
            Document Printing Wizard
          </Badge>
          <h1 className="text-xl sm:text-3xl font-extrabold">Uchapaji wa Nyaraka (Printing)</h1>
          <p className="text-xs sm:text-sm text-brand-100 mt-1">
            Pakia document yako, chagua ukubwa, rangi na binding, kisha chagua stationery.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20">
          <Sparkles className="w-5 h-5 text-amber-300" />
          <span className="text-xs font-bold">Bei Nafuu & Haraka</span>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 text-xs font-semibold">
        <div
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
            step === 1 ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
          Pakia & Chagua Options
        </div>
        <ArrowRight className="w-4 h-4 text-slate-300" />
        <div
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
            step === 2 ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">2</span>
          Chagua Stationery
        </div>
      </div>

      {/* STEP 1: Upload and Configuration */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Upload & Options */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Dropzone */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-brand-600" />
                1. Pakia Nyaraka Yako (Document Upload)
              </h3>

              {!uploadedDoc ? (
                <label className="border-2 border-dashed border-slate-300 hover:border-brand-500 bg-slate-50/50 hover:bg-brand-50/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
                  <UploadCloud className="w-10 h-10 text-brand-600 mb-2 animate-bounce" />
                  <span className="text-sm font-bold text-slate-800">
                    {uploading ? 'Inapakia nyaraka...' : 'Bonyeza au buruta nyaraka hapa'}
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
                    PDF, DOC, DOCX, JPG, PNG (Upeo wa 50MB)
                  </span>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between p-4 bg-brand-50 rounded-2xl border border-brand-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{uploadedDoc.fileName}</h4>
                      <p className="text-[11px] text-brand-800">
                        Ukurasa {uploadedDoc.pageCount} • {(uploadedDoc.fileSize / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <label className="text-xs font-bold text-brand-700 hover:underline cursor-pointer">
                    Badilisha
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Printing Options */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Printer className="w-4 h-4 text-brand-600" />
                2. Machaguo ya Uchapaji (Printing Options)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Paper Size */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ukubwa wa Karatasi (Paper Size)</label>
                  <select
                    value={paperSize}
                    onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                  >
                    <option value="A4">A4 (Standard Document)</option>
                    <option value="A3">A3 (Kubwa / Poster / Blueprint)</option>
                    <option value="A5">A5 (Kijitabu / Booklet)</option>
                  </select>
                </div>

                {/* Color Option */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Rangi ya Uchapaji (Color)</label>
                  <select
                    value={colorOption}
                    onChange={(e) => setColorOption(e.target.value as ColorOption)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                  >
                    <option value="BLACK_AND_WHITE">Nyeusi na Nyeupe (Black & White) - TZS 100/pg</option>
                    <option value="COLOR">Rangi Kamili (Full Colour) - TZS 500/pg</option>
                  </select>
                </div>

                {/* Sides */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Upande wa Karatasi (Sides)</label>
                  <select
                    value={sideOption}
                    onChange={(e) => setSideOption(e.target.value as SideOption)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                  >
                    <option value="SINGLE_SIDED">Upande Mmoja tu (Single-Sided)</option>
                    <option value="DOUBLE_SIDED">Pande Zote Mbili (Double-Sided)</option>
                  </select>
                </div>

                {/* Orientation */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mkao (Orientation)</label>
                  <select
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value as OrientationOption)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                  >
                    <option value="PORTRAIT">Wima (Portrait)</option>
                    <option value="LANDSCAPE">Mlalo (Landscape)</option>
                  </select>
                </div>

                {/* Binding */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ufungaji / Jalada (Binding)</label>
                  <select
                    value={binding}
                    onChange={(e) => setBinding(e.target.value as BindingType)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Idadi ya Nakala (Copies)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={copies}
                    onChange={(e) => setCopies(parseInt(e.target.value || '1', 10))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                  />
                </div>
              </div>

              {/* Custom Instructions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Maelekezo ya Ziada (Hiari)</label>
                <textarea
                  rows={2}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="mfano: Chapa kuanzia ukurasa wa 5 hadi 20 pekee au tumia karatasi nzito kwenye cover."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          {/* Right: Live Price Summary Card */}
          <div>
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md sticky top-24 space-y-4">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">
                Mchanganuo wa Bei (Live Calculation)
              </h3>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Kurasa:</span>
                  <span className="font-semibold text-slate-900">{uploadedDoc ? uploadedDoc.pageCount : 1}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Nakala (Copies):</span>
                  <span className="font-semibold text-slate-900">{copies}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Gharama ya Karatasi:</span>
                  <span className="font-semibold text-slate-900">TZS {pricing.printingTotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Gharama ya Binding:</span>
                  <span className="font-semibold text-slate-900">TZS {pricing.bindingCost.toLocaleString()}</span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between font-bold text-sm text-brand-700">
                  <span>JUMLA YA PRINTING:</span>
                  <span className="text-base">TZS {pricing.totalCost.toLocaleString()}</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full mt-4"
                onClick={handleProceedToShopSelect}
                disabled={!uploadedDoc || uploading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Chagua Stationery
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Choose Stationery Shop */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Chagua Duka la Stationery</h2>
              <p className="text-xs text-slate-500">Chagua duka litakalochapa oda yako na kuikabidhi kwa rider</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setStep(1)}>
              Rudi Nyuma
            </Button>
          </div>

          {loadingShops ? (
            <LoadingSpinner message="Inapakia maduka ya stationery..." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stationeries.map((shop) => {
                const isSelected = selectedStationery?.id === shop.id;
                return (
                  <div
                    key={shop.id}
                    onClick={() => setSelectedStationery(shop)}
                    className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-brand-50/50 border-brand-500 ring-2 ring-brand-500 shadow-md'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={shop.isOpen ? 'success' : 'neutral'} size="sm">
                          {shop.isOpen ? 'Wazi Sasa' : 'Imefungwa'}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {shop.avgRating.toFixed(1)}
                        </div>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base">{shop.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{shop.address}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-semibold text-brand-700">Masaa: {shop.openingHours}</span>
                      {isSelected ? (
                        <span className="flex items-center gap-1 text-brand-600 font-bold">
                          <CheckCircle2 className="w-4 h-4" /> Imechaguliwa
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">Bofya kuchagua</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">Duka Lililochaguliwa:</div>
              <div className="font-bold text-slate-900 text-sm">
                {selectedStationery?.name || 'Bado hujachagua duka'}
              </div>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={handleAddToCart}
              disabled={!selectedStationery}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Weka Kwenye Kikapu (Cart)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
