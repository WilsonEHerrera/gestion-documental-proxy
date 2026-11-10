'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ClasificacionDocumento } from '@/types/session';
import { TipoDocumentalOption, normalizeText } from '@/lib/utils/series';

interface TipoDocumentalSelectProps {
  options: TipoDocumentalOption[];
  value?: ClasificacionDocumento;
  onChange: (option: TipoDocumentalOption) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
}

const POPOVER_MAX_HEIGHT = 288;

export default function TipoDocumentalSelect({
  options,
  value,
  onChange,
  open,
  onOpenChange,
  disabled,
}: TipoDocumentalSelectProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number } | null>(null);

  const filtered = useMemo(() => {
    const tokens = normalizeText(query).split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return options;
    return options.filter((o) => {
      const haystack = normalizeText(`${o.tipoDocumental} ${o.subserie} ${o.serie}`);
      return tokens.every((t) => haystack.includes(t));
    });
  }, [options, query]);

  // Calcula posición fija (evita recortes por contenedores con scroll) y reinicia el estado al abrir
  useEffect(() => {
    if (!open) return;
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < POPOVER_MAX_HEIGHT && rect.top > spaceBelow;
      // Ancho mínimo cómodo (el botón puede ser angosto) sin salirse de la pantalla
      const width = Math.min(Math.max(rect.width, 320), window.innerWidth - 16);
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
      setPos(
        openUp
          ? { left, width, bottom: window.innerHeight - rect.top + 4 }
          : { left, width, top: rect.bottom + 4 }
      );
    }
    setQuery('');
    setActiveIdx(0);
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  // Cerrar al hacer clic fuera, redimensionar o hacer scroll fuera del popover
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      onOpenChange(false);
    };
    const onScroll = (e: Event) => {
      if (popoverRef.current?.contains(e.target as Node)) return;
      onOpenChange(false);
    };
    const onResize = () => onOpenChange(false);
    document.addEventListener('mousedown', onMouseDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, onOpenChange]);

  // Mantener visible la opción activa
  useEffect(() => {
    if (!open) return;
    popoverRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx, open]);

  const select = (o: TipoDocumentalOption) => {
    onChange(o);
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const o = filtered[activeIdx];
      if (o) select(o);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onOpenChange(false);
      buttonRef.current?.focus();
    }
  };

  const classified = !!value;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => onOpenChange(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full text-left rounded-lg border px-2.5 py-1.5 flex items-center justify-between gap-2 transition-colors cursor-pointer disabled:cursor-not-allowed ${
          classified
            ? 'bg-white border-stone-300 hover:border-stone-400'
            : 'bg-amber-50/60 border-amber-300/80 hover:border-amber-400'
        }`}
      >
        <span className="min-w-0">
          {classified ? (
            <>
              <span className="block text-xs font-medium text-stone-800 truncate">{value.tipoDocumental}</span>
              <span className="block text-[10px] text-stone-500 truncate">
                {value.serie} › {value.subserie}
              </span>
            </>
          ) : (
            <span className="block text-xs text-amber-800/90">Seleccionar tipo documental…</span>
          )}
        </span>
        <svg className="w-3.5 h-3.5 shrink-0 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && pos && (
        <div
          ref={popoverRef}
          style={{ position: 'fixed', left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, zIndex: 50 }}
          className="bg-white border border-stone-300 rounded-xl shadow-lg overflow-hidden"
        >
          <div className="p-2 border-b border-stone-200">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIdx(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Buscar tipo documental…"
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 bg-[#FAF9F6] text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-400"
            />
          </div>

          <div role="listbox" style={{ maxHeight: POPOVER_MAX_HEIGHT - 52 }} className="overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-stone-500">Sin resultados para “{query}”.</p>
            ) : (
              filtered.map((o, idx) => {
                const prev = filtered[idx - 1];
                const showHeader = !prev || prev.serie !== o.serie || prev.subserie !== o.subserie;
                const isSelected =
                  value &&
                  value.serie === o.serie &&
                  value.subserie === o.subserie &&
                  value.tipoDocumental === o.tipoDocumental;
                return (
                  <React.Fragment key={o.key}>
                    {showHeader && (
                      <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                        {o.serie} › {o.subserie}
                      </div>
                    )}
                    <div
                      role="option"
                      aria-selected={!!isSelected}
                      data-idx={idx}
                      onMouseEnter={() => setActiveIdx(idx)}
                      onClick={() => select(o)}
                      className={`px-3 py-1.5 text-xs cursor-pointer flex items-center justify-between gap-2 ${
                        idx === activeIdx ? 'bg-stone-100 text-stone-900' : 'text-stone-700'
                      }`}
                    >
                      <span className="truncate">{o.tipoDocumental}</span>
                      {isSelected && (
                        <svg className="w-3.5 h-3.5 shrink-0 text-stone-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </React.Fragment>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
}
