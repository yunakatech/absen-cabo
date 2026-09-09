'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Calendar, FileText, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { LeaveType } from '@/lib/types';

export default function DriverLeavePage() {
  const router = useRouter();
  const [leaveType, setLeaveType] = useState<LeaveType>('SAKIT');
  const [dateOption, setDateOption] = useState<'TODAY' | 'TOMORROW' | 'CUSTOM'>('TODAY');
  const [customDate, setCustomDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [todayStr, setTodayStr] = useState('');
  const [tomorrowStr, setTomorrowStr] = useState('');

  useEffect(() => {
    // Get server date or current date
    fetch('/api/time')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const tDate = d.time.dateStr;
          setTodayStr(tDate);
          const nextDay = new Date();
          nextDay.setDate(nextDay.getDate() + 1);
          setTomorrowStr(nextDay.toISOString().substring(0, 10));
          setCustomDate(tDate);
        }
      })
      .catch(() => {
        const now = new Date().toISOString().substring(0, 10);
        setTodayStr(now);
        setCustomDate(now);
      });
  }, []);

  const getSelectedDate = (): string => {
    if (dateOption === 'TODAY') return todayStr || new Date().toISOString().substring(0, 10);
    if (dateOption === 'TOMORROW') return tomorrowStr || new Date().toISOString().substring(0, 10);
    return customDate || todayStr;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const startDate = getSelectedDate();

    if (!startDate) {
      toast.error('Silakan pilih tanggal izin');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leave_type: leaveType,
          start_date: startDate,
          end_date: startDate,
          reason,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || 'Gagal mengajukan izin');
        setSubmitting(false);
        return;
      }

      toast.success('Pengajuan izin berhasil dikirim!');
      router.push('/riwayat');
      router.refresh();
    } catch {
      toast.error('Terjadi kesalahan jaringan.');
      setSubmitting(false);
    }
  };

  const leaveOptions: { type: LeaveType; label: string; icon: string; bg: string }[] = [
    { type: 'SAKIT', label: 'SAKIT', icon: '🤒', bg: 'hover:border-rose-500' },
    { type: 'URUSAN_KELUARGA', label: 'URUSAN KELUARGA', icon: '👨‍👩‍👧', bg: 'hover:border-amber-500' },
    { type: 'IZIN', label: 'IZIN', icon: '📝', bg: 'hover:border-blue-500' },
    { type: 'LAINNYA', label: 'LAINNYA', icon: '❓', bg: 'hover:border-purple-500' },
  ];

  return (
    <div className="flex-1 flex flex-col justify-between space-y-6">
      {/* Header Back Button */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition"
        >
          <ArrowLeft size={16} />
          <span>Kembali</span>
        </Link>
        <h2 className="text-lg font-bold text-white">Pengajuan Izin</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
        {/* Step 1: Leave Type Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Saya tidak masuk karena:
          </label>
          <div className="grid grid-cols-2 gap-3">
            {leaveOptions.map((opt) => {
              const isSelected = leaveType === opt.type;
              return (
                <button
                  type="button"
                  key={opt.type}
                  onClick={() => setLeaveType(opt.type)}
                  className={`p-4 rounded-2xl border text-left transition transform active:scale-95 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-lg shadow-amber-500/10'
                      : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-2xl mb-2">{opt.icon}</span>
                  <span className="text-xs font-extrabold tracking-wide">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Date Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Kapan Izin Berlaku?
          </label>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button
              type="button"
              onClick={() => setDateOption('TODAY')}
              className={`py-3 px-2 rounded-xl border text-center transition text-xs font-bold ${
                dateOption === 'TODAY'
                  ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                  : 'bg-slate-800/60 border-slate-700/80 text-slate-400'
              }`}
            >
              HARI INI
            </button>
            <button
              type="button"
              onClick={() => setDateOption('TOMORROW')}
              className={`py-3 px-2 rounded-xl border text-center transition text-xs font-bold ${
                dateOption === 'TOMORROW'
                  ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                  : 'bg-slate-800/60 border-slate-700/80 text-slate-400'
              }`}
            >
              BESOK
            </button>
            <button
              type="button"
              onClick={() => setDateOption('CUSTOM')}
              className={`py-3 px-2 rounded-xl border text-center transition text-xs font-bold ${
                dateOption === 'CUSTOM'
                  ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                  : 'bg-slate-800/60 border-slate-700/80 text-slate-400'
              }`}
            >
              PILIH TANGGAL
            </button>
          </div>

          {dateOption === 'CUSTOM' && (
            <div className="relative mt-2">
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
          )}
        </div>

        {/* Step 3: Reason Textarea */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Keterangan / Alasan (Opsional)
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Contoh: Anak sakit demam"
            className="w-full p-4 bg-slate-800/80 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 text-base transition transform active:scale-95 disabled:opacity-50"
        >
          {submitting ? (
            <span>Mengirim Pengajuan...</span>
          ) : (
            <>
              <Send size={18} />
              <span>KIRIM PENGAJUAN IZIN</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
