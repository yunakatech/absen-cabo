'use client';

import React from 'react';
import { Calendar, RotateCcw } from 'lucide-react';

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
  }).format(new Date());
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
        {/* Custom Visual Box & Hidden Input Wrapper */}
        <div className="relative flex-1 sm:flex-initial">
          {/* Custom Styled Visual Box */}
          <div className="pointer-events-none relative z-10 flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-medium min-w-[180px] shadow-sm">
            <Calendar size={14} className="text-orange-400 flex-shrink-0" />
            <span
              className={`flex-1 text-left select-none ${
                !value ? 'text-slate-400 font-normal' : isToday ? 'text-orange-300 font-semibold' : 'text-white font-medium'
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
                placeholder
              )}
            </span>
          </div>

          {/* Real Native HTML Date Input */}
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
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
            style={{ colorScheme: 'dark' }}
          />
        </div>

        {/* Reset to Today Button */}
        {!isToday && (
          <button
            type="button"
            onClick={handleReset}
            title="Reset ke Hari Ini"
            className="flex items-center gap-1 px-2.5 py-2.5 bg-slate-800 hover:bg-orange-500/20 border border-slate-700 hover:border-orange-500/60 text-slate-400 hover:text-orange-400 rounded-xl text-xs font-semibold transition-all shrink-0 z-30"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Hari ini</span>
          </button>
        )}
      </div>
    </div>
  );
}
