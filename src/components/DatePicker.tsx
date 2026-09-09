'use client';

import React, { useRef } from 'react';
import { Calendar, RotateCcw } from 'lucide-react';

interface DatePickerProps {
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  todayDefault?: boolean; // When reset is pressed, go to today instead of empty
  placeholder?: string;
  max?: string;
  min?: string;
  className?: string;
}

function getTodayStr(): string {
  return new Date().toISOString().substring(0, 10);
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
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
  placeholder = 'Pilih Tanggal',
  max,
  min,
  className = '',
}: DatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const today = getTodayStr();
  const isToday = value === today;

  const handleReset = () => {
    onChange(today);
  };

  const openPicker = () => {
    inputRef.current?.showPicker?.();
    inputRef.current?.focus();
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {label}
        </label>
      )}

      <div className="relative flex items-center group">
        {/* Clickable display box */}
        <button
          type="button"
          onClick={openPicker}
          className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-medium hover:border-orange-500/60 hover:bg-slate-700/80 transition-all min-w-[180px]"
        >
          <Calendar size={14} className="text-orange-400 flex-shrink-0" />
          <span className={`flex-1 text-left ${!value ? 'text-slate-500' : isToday ? 'text-orange-300 font-semibold' : 'text-white'}`}>
            {value ? (
              <>
                {formatDisplayDate(value)}
                {isToday && <span className="ml-1.5 px-1.5 py-0.5 bg-orange-500/20 text-orange-400 text-[9px] font-black rounded-md">HARI INI</span>}
              </>
            ) : (
              placeholder
            )}
          </span>
        </button>

        {/* Hidden real date input */}
        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          max={max}
          min={min}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          style={{ colorScheme: 'dark' }}
        />

        {/* Reset to Today button */}
        {!isToday && (
          <button
            type="button"
            onClick={handleReset}
            title="Reset ke Hari Ini"
            className="ml-2 flex items-center gap-1 px-2.5 py-2.5 bg-slate-800 hover:bg-orange-500/20 border border-slate-700 hover:border-orange-500/60 text-slate-400 hover:text-orange-400 rounded-xl text-xs font-semibold transition-all"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Hari ini</span>
          </button>
        )}
      </div>
    </div>
  );
}
