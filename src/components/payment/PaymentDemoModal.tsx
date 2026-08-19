'use client';

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  ShieldCheck,
  Zap,
  ArrowRight,
  RefreshCw,
  X,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface PaymentDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  amount: number;
  paymentMethod: 'M_PESA' | 'TIGO_PESA' | 'AIRTEL_MONEY' | 'HALOPESA' | 'CARD' | 'CASH_ON_DELIVERY';
  transactionReference: string;
  customerPhone?: string;
  onSuccess: (orderId: string) => void;
}

export const PaymentDemoModal: React.FC<PaymentDemoModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  amount,
  paymentMethod,
  transactionReference,
  customerPhone = '0755 123 456',
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [step, setStep] = useState<'USSD_PROMPT' | 'PROCESSING' | 'SUCCESS' | 'FAILED'>('USSD_PROMPT');
  const [errorMessage, setErrorMessage] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(30);

  useEffect(() => {
    if (isOpen) {
      setStep('USSD_PROMPT');
      setPin('');
      setErrorMessage('');
      setTimerSeconds(30);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || step !== 'USSD_PROMPT') return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, step]);

  if (!isOpen) return null;

  const getProviderDetails = () => {
    switch (paymentMethod) {
      case 'M_PESA':
        return {
          name: 'Vodacom M-Pesa',
          ussdCode: '*150*00#',
          colorBg: 'bg-red-600',
          colorText: 'text-red-600',
          borderColor: 'border-red-500',
          ringColor: 'ring-red-500',
        };
      case 'TIGO_PESA':
        return {
          name: 'Tigo Pesa / Mixx',
          ussdCode: '*150*01#',
          colorBg: 'bg-blue-600',
          colorText: 'text-blue-600',
          borderColor: 'border-blue-500',
          ringColor: 'ring-blue-500',
        };
      case 'AIRTEL_MONEY':
        return {
          name: 'Airtel Money',
          ussdCode: '*150*60#',
          colorBg: 'bg-rose-600',
          colorText: 'text-rose-600',
          borderColor: 'border-rose-500',
          ringColor: 'ring-rose-500',
        };
      default:
        return {
          name: 'Online Gateway / Card',
          ussdCode: 'Online',
          colorBg: 'bg-emerald-600',
          colorText: 'text-emerald-600',
          borderColor: 'border-emerald-500',
          ringColor: 'ring-emerald-500',
        };
    }
  };

  const provider = getProviderDetails();

  const handleKeyClick = (num: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + num);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const executePaymentVerification = async (simulatedProviderRef?: string) => {
    setStep('PROCESSING');
    try {
      // Simulate network latency of USSD gateway (1.2 seconds)
      await new Promise((resolve) => setTimeout(resolve, 1200));

      await api.post('/payments/verify', {
        transactionReference,
        providerReference: simulatedProviderRef || `TZ-${paymentMethod}-${Date.now().toString().slice(-8)}`,
      });

      setStep('SUCCESS');
      toast.success(`Malipo ya TZS ${amount.toLocaleString()} yamethibitishwa! 🎉`);

      setTimeout(() => {
        onSuccess(orderId);
      }, 1500);
    } catch (err) {
      setErrorMessage((err as Error).message || 'Malipo yameshindikana. Jaribu tena.');
      setStep('FAILED');
    }
  };

  const handleQuickDemoPay = () => {
    executePaymentVerification(`QUICK-DEMO-${Date.now()}`);
  };

  const handleSubmitPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      toast.error('Weka nambari 4 za siri (PIN)');
      return;
    }
    executePaymentVerification(`PIN-AUTH-${pin}-${Date.now()}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-scaleUp">
        {/* Header Bar */}
        <div className={`px-6 py-4 text-white flex items-center justify-between ${provider.colorBg}`}>
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-5 h-5" />
            <div>
              <div className="font-extrabold text-sm tracking-wide">{provider.name} SIMULATOR</div>
              <div className="text-[10px] opacity-90">Demo Payment Gateway Mode</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* STEP 1: USSD / Mobile PIN Prompt */}
          {step === 'USSD_PROMPT' && (
            <div className="space-y-4">
              {/* Order Info Badge */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Oda:</span>
                  <span className="font-extrabold text-slate-900 text-sm">#{orderNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Kiasi cha Kulipa:</span>
                  <span className="font-extrabold text-brand-700 text-base">
                    TZS {amount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Simulated Phone USSD Screen */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-inner border border-slate-800 space-y-3 font-mono text-center">
                <div className="text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                  {provider.ussdCode} • USSD Push Simu: {customerPhone}
                </div>

                <div className="text-xs text-amber-300 font-semibold py-1">
                  Lipa kwa Stationery Mkononi
                  <br />
                  Kiasi: TZS {amount.toLocaleString()}
                  <br />
                  Kumbukumbu: {transactionReference}
                </div>

                <div className="py-2">
                  <div className="text-[11px] text-slate-300 mb-1.5">Weka Namba ya Siri (PIN):</div>
                  <div className="flex items-center justify-center gap-2">
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className={`w-9 h-10 rounded-lg flex items-center justify-center text-lg font-bold border ${
                          pin.length > idx
                            ? 'border-brand-500 bg-brand-950/80 text-brand-400'
                            : 'border-slate-700 bg-slate-800 text-slate-500'
                        }`}
                      >
                        {pin.length > idx ? '•' : ''}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-1.5 pt-2 max-w-[220px] mx-auto font-sans">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        if (key === 'C') setPin('');
                        else if (key === '⌫') handleBackspace();
                        else handleKeyClick(key);
                      }}
                      className="py-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-sm font-bold text-white transition-colors"
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={pin.length !== 4}
                  onClick={handleSubmitPin}
                  leftIcon={<CheckCircle2 className="w-5 h-5" />}
                >
                  Thibitisha Malipo kwa PIN ({pin.length}/4)
                </Button>

                <button
                  type="button"
                  onClick={handleQuickDemoPay}
                  className="w-full py-2.5 px-4 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Zap className="w-4 h-4 text-brand-600" />
                  Lipa Papo Hapo (Quick Demo 1-Click Pay)
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PROCESSING */}
          {step === 'PROCESSING' && (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full border-4 border-brand-500 border-t-transparent animate-spin mx-auto" />
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">Inathibitisha Malipo...</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Inawasiliana na mtandao wa {provider.name} kukamilisha muamala.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 'SUCCESS' && (
            <div className="py-8 text-center space-y-4 animate-scaleUp">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-lg">Malipo Yamethibitishwa! 🎉</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Oda yako #{orderNumber} imelipiwa kikamilifu. Inafungua ramani ya Live GPS Tracking...
                </p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-semibold">
                Kiasi: TZS {amount.toLocaleString()} • Njia: {provider.name}
              </div>
            </div>
          )}

          {/* STEP 4: FAILED */}
          {step === 'FAILED' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-md">
                <AlertCircle className="w-10 h-10" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-lg">Malipo Yameshindikana</h4>
                <p className="text-xs text-rose-600 mt-1">{errorMessage}</p>
              </div>

              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => setStep('USSD_PROMPT')}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Jaribu Tena (Retry)
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
