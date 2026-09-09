'use client';

import React from 'react';
import { RotateCcw } from 'lucide-react';

interface DatePickerProps {
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  todayDefault?: boolean;
  placeholder?: string;
  max?: string;
  min?: string;
  className?: string;
}

function getTodayWITA(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Makassar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()); // returns YYYY-MM-DD
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return dateStr;
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function DatePicker({
  label,
  value,
  onChange,
  todayDefault = true,
  placeholder = 'Pilih Tanggal',
  max,
  min,
  className = '',
}: DatePickerProps) {
  const today = getTodayWITA();
  const isToday = value === today;

  const handleReset = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(today);
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
          {label}
        </label>
      )}

      <div className="flex items-center gap-2">
        {/* Native date input styled to look custom */}
        <div className="relative">
          {/* Visual overlay (pointer-events-none so the input below is clickable) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center gap-2.5 px-3.5 rounded-xl z-10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-orange-400 flex-shrink-0"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span
              className={`text-xs font-medium ${
                !value ? 'text-slate-400' : isToday ? 'text-orange-300 font-semibold' : 'text-white'
              }`}
            >
              {value ? (
                <>
                  {formatDisplayDate(value)}
                  {isToday && (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-orange-500/20 text-orange-400 text-[9px] font-black rounded-md">
                      HARI INI
                    </span>
                  )}
                </>
              ) : (
                <span className="text-slate-500">{placeholder}</span>
              )}
            </span>
          </div>

          {/* Real native date input — sits on top of visual overlay, transparent text/bg */}
          <input
            type="date"
            value={value || ''}
            onChange={(e) => {
              const val = e.target.value;
              if (!val && todayDefault) {
                onChange(today);
              } else {
                onChange(val);
              }
            }}
            max={max}
            min={min}
            className="relative z-20 w-full min-w-[195px] py-2.5 pl-10 pr-3 bg-slate-800 border border-slate-700 rounded-xl text-transparent cursor-pointer hover:border-orange-500/60 hover:bg-slate-700/80 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 [color-scheme:dark]"
            style={{
              colorScheme: 'dark',
            }}
          />
        </div>

        {/* Reset to Today button */}
        {!isToday && (
          <button
            type="button"
            onClick={handleReset}
            title="Reset ke Hari Ini"
            className="flex items-center gap-1 px-2.5 py-2.5 bg-slate-800 hover:bg-orange-500/20 border border-slate-700 hover:border-orange-500/60 text-slate-400 hover:text-orange-400 rounded-xl text-xs font-semibold transition-all shrink-0"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Hari ini</span>
          </button>
        )}
      </div>
    </div>
  );
}
