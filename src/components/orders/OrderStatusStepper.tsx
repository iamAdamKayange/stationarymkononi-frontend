import React from 'react';
import { Check, Clock, Printer, PackageCheck, Bike, Home, AlertCircle } from 'lucide-react';
import { OrderStatus } from '../../types';

interface OrderStatusStepperProps {
  status: OrderStatus;
}

export const OrderStatusStepper: React.FC<OrderStatusStepperProps> = ({ status }) => {
  const steps = [
    { key: 'PENDING', label: 'Oda Imetumwa', icon: Clock },
    { key: 'ACCEPTED_BY_STATIONERY', label: 'Imepokelewa', icon: Check },
    { key: 'PRINTING', label: 'Inachapwa', icon: Printer },
    { key: 'READY_FOR_PICKUP', label: 'Iko Tayari', icon: PackageCheck },
    { key: 'OUT_FOR_DELIVERY', label: 'Njiani Kuletwa', icon: Bike },
    { key: 'DELIVERED', label: 'Imefikishwa', icon: Home },
  ];

  const getStepIndex = (st: OrderStatus): number => {
    switch (st) {
      case 'PENDING':
        return 0;
      case 'ACCEPTED_BY_STATIONERY':
        return 1;
      case 'PRINTING':
        return 2;
      case 'READY_FOR_PICKUP':
      case 'RIDER_ASSIGNED':
      case 'RIDER_ACCEPTED':
        return 3;
      case 'PICKED_UP':
      case 'OUT_FOR_DELIVERY':
        return 4;
      case 'DELIVERED':
        return 5;
      case 'REJECTED':
      case 'CANCELLED':
      case 'FAILED_DELIVERY':
        return -1;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(status);
  const isFailed = currentIndex === -1;

  if (isFailed) {
    return (
      <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700">
        <AlertCircle className="w-6 h-6 flex-shrink-0" />
        <div>
          <div className="font-semibold text-sm">Oda Hii Imefutwa au Imekataliwa</div>
          <div className="text-xs text-rose-600">Hali: {status}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-4">
      {/* Mobile Vertical View & Desktop Horizontal Stepper */}
      <div className="hidden sm:flex items-center justify-between relative">
        {/* Background Connecting Line */}
        <div className="absolute top-5 left-6 right-6 h-1 bg-slate-200 -z-0" />
        <div
          className="absolute top-5 left-6 h-1 bg-brand-600 transition-all duration-500 -z-0"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex flex-col items-center z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                  isDone
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                    : isCurrent
                    ? 'bg-brand-600 text-white ring-4 ring-brand-100 shadow-md animate-pulse'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                {isDone ? <Check className="w-5 h-5 stroke-[3]" /> : <Icon className="w-4 h-4" />}
              </div>
              <span
                className={`text-xs mt-2 font-medium text-center ${
                  isCurrent ? 'text-brand-700 font-bold' : isDone ? 'text-slate-700' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile Flow List */}
      <div className="sm:hidden space-y-3">
        {steps.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  isDone
                    ? 'bg-brand-600 text-white'
                    : isCurrent
                    ? 'bg-brand-600 text-white ring-4 ring-brand-100 animate-pulse'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <div className="flex-1 flex items-center justify-between">
                <span
                  className={`text-sm ${
                    isCurrent
                      ? 'text-brand-700 font-bold'
                      : isDone
                      ? 'text-slate-800 font-medium'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
                {isCurrent && (
                  <span className="text-[10px] uppercase font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
                    Inaendelea
                  </span>
                )}
                {isDone && <span className="text-xs text-brand-600 font-medium">Tayari ✓</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
