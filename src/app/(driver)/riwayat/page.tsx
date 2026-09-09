'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { formatIndonesianDate } from '@/lib/time';

interface HistoryItem {
  id: string;
  type: 'ATTENDANCE' | 'LEAVE';
  date: string;
  time?: string;
  title: string;
  status: string;
  notes?: string;
  created_at: string;
}

export default function DriverHistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const [resAtt, resLeave] = await Promise.all([
          fetch('/api/attendance').then((r) => r.json()),
          fetch('/api/leave').then((r) => r.json()),
        ]);

        const combined: HistoryItem[] = [];

        if (resAtt.success) {
          resAtt.attendance.forEach((a: any) => {
            combined.push({
              id: a.id,
              type: 'ATTENDANCE',
              date: a.attendance_date,
              time: a.attendance_time,
              title: 'Absen Hadir',
              status: 'HADIR',
              notes: a.source === 'ADMIN' ? 'Absen Manual Admin' : 'Hadir Tepat Waktu',
              created_at: a.created_at,
            });
          });
        }

        if (resLeave.success) {
          resLeave.requests.forEach((l: any) => {
            combined.push({
              id: l.id,
              type: 'LEAVE',
              date: l.start_date,
              title: `Izin: ${l.leave_type.replace('_', ' ')}`,
              status: l.status,
              notes: l.reason || 'Tidak ada keterangan',
              created_at: l.created_at,
            });
          });
        }

        // Sort newest first
        combined.sort((a, b) => b.created_at.localeCompare(a.created_at));
        setItems(combined);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  return (
    <div className="flex-1 flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition"
        >
          <ArrowLeft size={16} />
          <span>Kembali</span>
        </Link>
        <h2 className="text-lg font-bold text-white">Riwayat Pribadi</h2>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20 text-slate-400">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 space-y-2">
          <Calendar size={40} className="mx-auto text-slate-600 mb-2" />
          <p className="font-semibold">Belum ada riwayat absensi atau izin.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-md"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${
                    item.type === 'ATTENDANCE'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {item.type === 'ATTENDANCE' ? '🟢' : '🟡'}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">{item.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatIndonesianDate(item.date)}
                    {item.time && ` • Pukul ${item.time.substring(0, 5)}`}
                  </p>
                  {item.notes && <p className="text-[11px] text-slate-500 mt-1 italic">{item.notes}</p>}
                </div>
              </div>

              <div className="text-right">
                {item.type === 'ATTENDANCE' ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    HADIR
                  </span>
                ) : (
                  <StatusBadge type="leave" value={item.status} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
