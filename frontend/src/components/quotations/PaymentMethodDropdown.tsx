import React, { useEffect, useId, useRef, useState } from 'react';
import { Banknote, Check, ChevronDown, Landmark } from 'lucide-react';

type PaymentMethod = 'COD' | 'BANK_TRANSFER';
const methods = [
  { value: 'COD' as const, label: 'Thanh toán khi nhận hàng', description: 'Thanh toán khi nhận sản phẩm (COD)', Icon: Banknote },
  { value: 'BANK_TRANSFER' as const, label: 'Chuyển khoản ngân hàng', description: 'Thanh toán bằng chuyển khoản', Icon: Landmark },
];

export function PaymentMethodDropdown({ value, onChange, disabled = false }: {
  value: PaymentMethod; onChange: (value: PaymentMethod) => void; disabled?: boolean;
}) {
  const id = useId();
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const selectedIndex = methods.findIndex(method => method.value === value);
  const selected = methods[selectedIndex];
  const SelectedIcon = selected.Icon;

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open]);

  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);

  function choose(index: number) {
    onChange(methods[index].value);
    setOpen(false);
    trigger.current?.focus();
  }

  function handleKey(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Escape' || event.key === 'Tab') { setOpen(false); return; }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      setOpen(true);
      if (event.key === 'Home') setActive(0);
      else if (event.key === 'End') setActive(methods.length - 1);
      else setActive(open ? (active + (event.key === 'ArrowDown' ? 1 : -1) + methods.length) % methods.length : selectedIndex);
    } else if (open && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      choose(active);
    }
  }

  return (
    <div ref={container} className="relative">
      <div id={`${id}-label`} className="mb-2 text-xs font-semibold text-slate-600">Phương thức thanh toán</div>
      <button ref={trigger} type="button" role="combobox" disabled={disabled}
        aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? `${id}-list` : undefined}
        aria-labelledby={`${id}-label ${id}-value`} aria-activedescendant={open ? `${id}-option-${active}` : undefined}
        onKeyDown={handleKey} onClick={() => { setActive(selectedIndex); setOpen(!open); }}
        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${open ? 'border-blue-400 bg-blue-50/60' : 'border-slate-200 bg-slate-50/60 hover:border-blue-300 hover:bg-blue-50/40'}`}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><SelectedIcon className="h-5 w-5" aria-hidden="true" /></span>
        <span className="min-w-0 flex-1"><span id={`${id}-value`} className="block text-sm font-semibold text-slate-800">{selected.label}</span>
          <span className="mt-0.5 block text-xs text-slate-500">{selected.description}</span></span>
        <ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && !disabled && <div id={`${id}-list`} role="listbox" aria-labelledby={`${id}-label`}
        className="mt-2 space-y-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-900/10">
        {methods.map((method, index) => {
          const Icon = method.Icon;
          const isSelected = method.value === value;
          return <div key={method.value} id={`${id}-option-${index}`} role="option" aria-selected={isSelected}
            onPointerMove={() => setActive(index)} onMouseDown={event => event.preventDefault()} onClick={() => choose(index)}
            className={`flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors ${active === index || isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
            <span className="min-w-0 flex-1"><span className={`block text-sm font-semibold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{method.label}</span>
              <span className="mt-0.5 block text-xs text-slate-500">{method.description}</span></span>
            {isSelected && <Check className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />}
          </div>;
        })}
      </div>}
    </div>
  );
}
