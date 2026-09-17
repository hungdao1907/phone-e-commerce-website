import React from 'react';
import { ShoppingBag, Truck, CreditCard, CheckCircle2 } from 'lucide-react';

export type CheckoutStepId = 'cart' | 'delivery' | 'payment' | 'complete';

interface CheckoutProgressProps {
  currentStep: CheckoutStepId;
}

const STEPS: { id: CheckoutStepId; label: string; icon: React.ElementType }[] = [
  { id: 'cart', label: 'Giỏ hàng', icon: ShoppingBag },
  { id: 'delivery', label: 'Giao hàng', icon: Truck },
  { id: 'payment', label: 'Thanh toán', icon: CreditCard },
  { id: 'complete', label: 'Hoàn tất', icon: CheckCircle2 }
];

export function CheckoutProgress({ currentStep }: CheckoutProgressProps) {
  const currentIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="w-full py-6">
      {/* Mobile Progress Bar */}
      <div className="md:hidden">
        <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
          Bước {currentIndex + 1} / {STEPS.length}
        </p>
        <h2 className="text-lg font-bold text-neutral-900 mb-4">{STEPS[currentIndex].label}</h2>
        <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)] transition-all duration-700 ease-out rounded-full"
            style={{ width: `${((currentIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop Stepper */}
      <div className="hidden md:flex items-center w-full max-w-3xl mx-auto z-0 px-8 pb-8">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          
          return (
            <React.Fragment key={step.id}>
              {/* Connecting Line */}
              {idx > 0 && (
                <div className="flex-1 h-[3px] bg-neutral-200 flex items-center overflow-hidden">
                  <div 
                    className={`h-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)] transition-all duration-700 ease-out`}
                    style={{ width: idx <= currentIndex ? '100%' : '0%' }}
                  />
                </div>
              )}
              
              {/* Step Circle & Label */}
              <div className="relative flex flex-col items-center justify-center shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 z-10 relative ${
                  isCompleted 
                    ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)] text-white' 
                    : isCurrent 
                      ? 'bg-white border-2 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.4)] text-emerald-500' 
                      : 'bg-white border-2 border-neutral-200 text-neutral-300'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-bold">{idx + 1}</span>
                  )}
                </div>
                
                {/* Absolute Label */}
                <span className={`absolute top-10 whitespace-nowrap text-xs font-bold text-center transition-colors duration-300 ${
                  isCompleted || isCurrent ? 'text-black' : 'text-neutral-400'
                }`}>
                  {step.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
