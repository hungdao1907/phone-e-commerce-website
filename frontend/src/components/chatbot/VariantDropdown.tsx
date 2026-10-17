import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Layers } from 'lucide-react';

type VariantOption = { value: string; label: string; stock: number; disabled: boolean };

/** The menu lives outside the carousel so card overflow never clips the options. */
export function VariantDropdown({ value, options, onChange }: {
  value: string;
  options: VariantOption[];
  onChange: (value: string) => void;
}) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [position, setPosition] = useState({ left: 0, top: 0, width: 0, maxHeight: 240 });
  const selected = options.find(option => option.value === value);
  const enabled = options.map((option, index) => option.disabled ? -1 : index).filter(index => index >= 0);

  const openMenu = () => {
    const trigger = triggerRef.current;
    if (!trigger || !enabled.length) return;
    const rect = trigger.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - 16;
    const above = rect.top - 16;
    const upwards = below < 180 && above > below;
    const maxHeight = Math.min(280, Math.max(80, upwards ? above : below));
    const width = Math.min(Math.max(rect.width, 250), window.innerWidth - 24);
    setPosition({ left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
      top: upwards ? rect.top - 8 : rect.bottom + 8, width, maxHeight });
    setActive(enabled.includes(options.findIndex(option => option.value === value))
      ? options.findIndex(option => option.value === value) : enabled[0]);
    setOpen(true);
    trigger.dataset.menuUpwards = String(upwards);
  };

  const choose = (index: number) => {
    const option = options[index];
    if (!option || option.disabled) return;
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!triggerRef.current?.contains(event.target as Node) && !menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnScroll = (event: Event) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener('pointerdown', outside);
    window.addEventListener('scroll', closeOnScroll, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('pointerdown', outside);
      window.removeEventListener('scroll', closeOnScroll, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  useEffect(() => {
    if (open) document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active, id]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape' || event.key === 'Tab') { setOpen(false); return; }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      if (!open) { openMenu(); return; }
      if (event.key === 'Home') setActive(enabled[0]);
      else if (event.key === 'End') setActive(enabled[enabled.length - 1]);
      else {
        const current = enabled.indexOf(active);
        const next = (current + (event.key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length;
        setActive(enabled[next]);
      }
    } else if (open && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault(); choose(active);
    }
  };

  const parts = (label: string) => label.split(' · ').map(part => part.replace(/^[^:]+:\s*/, ''));
  const selectedParts = selected ? parts(selected.label) : [];

  return (
    <div className="mt-2">
      <div id={`${id}-label`} className="mb-1 flex items-center justify-between text-[10px] font-semibold text-neutral-600">
        <span>Phiên bản</span><span className="font-normal text-neutral-400">{options.length} tùy chọn</span>
      </div>
      <button ref={triggerRef} type="button" role="combobox" aria-haspopup="listbox" aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined} aria-labelledby={`${id}-label ${id}-value`}
        aria-activedescendant={open && active >= 0 ? `${id}-option-${active}` : undefined}
        onMouseDown={event => event.stopPropagation()} onKeyDown={onKeyDown}
        onClick={() => open ? setOpen(false) : openMenu()}
        title={selected?.label}
        className={`flex min-h-10 w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2 ${open ? 'border-blue-400 bg-blue-50/60' : 'border-neutral-200 bg-neutral-50/70 hover:border-blue-300 hover:bg-blue-50/40'}`}>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-blue-600"><Layers className="h-3.5 w-3.5" aria-hidden="true" /></span>
        <span className="min-w-0 flex-1">
          <span id={`${id}-value`} className="sr-only">{selected?.label || 'Chọn phiên bản'}</span>
          <span aria-hidden="true" className="block truncate text-[11px] font-semibold leading-snug text-neutral-900">{selectedParts.join(' · ') || 'Chọn phiên bản'}</span>
        </span>
        <ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${open ? 'rotate-180 text-blue-600' : ''}`} />
      </button>
      {open && createPortal(
        <div ref={menuRef} id={`${id}-list`} role="listbox" aria-labelledby={`${id}-label`} data-lenis-prevent="true"
          onMouseDown={event => { event.preventDefault(); event.stopPropagation(); }}
          className="fixed z-[1000] overflow-y-auto overscroll-contain rounded-2xl border border-neutral-200/80 bg-white p-1.5 shadow-[0_12px_40px_rgba(15,23,42,0.16)]"
          style={{ ...position, transform: triggerRef.current?.dataset.menuUpwards === 'true' ? 'translateY(-100%)' : undefined }}>
          {options.map((option, index) => {
            const detail = parts(option.label);
            const chosen = option.value === value;
            return <div key={option.value} id={`${id}-option-${index}`} role="option" aria-selected={chosen} aria-disabled={option.disabled}
              onPointerMove={() => { if (!option.disabled) setActive(index); }} onClick={() => choose(index)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2.5 transition-colors ${option.disabled ? 'cursor-not-allowed opacity-45' : 'cursor-pointer'} ${chosen ? 'bg-blue-50 text-blue-700' : active === index ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-800'}`}>
              <span className="min-w-0 flex-1"><span className="block break-words text-xs font-semibold">{detail[0]}</span>
                {detail.length > 1 && <span className="mt-0.5 block break-words text-[11px] text-neutral-500">{detail.slice(1).join(' · ')}</span>}
                <span className={`mt-1 block text-[10px] font-medium ${option.disabled ? 'text-neutral-400' : 'text-emerald-600'}`}>{option.disabled ? 'Hết hàng' : `Còn ${option.stock} sản phẩm`}</span>
              </span>
              {chosen && <Check className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />}
            </div>;
          })}
        </div>, document.body,
      )}
    </div>
  );
}
