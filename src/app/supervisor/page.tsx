'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  X,
  FileCheck2,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from '@/components/StatusBadge';
import { formatIndonesianDate } from '@/lib/time';

interface DashboardStats {
  totalDrivers: number;
  sudahAbsen: number;
  belumAbsen: number;
  izinDisetujui: number;
  izinMenunggu: number;
  attendancePercentage: number;
}

interface LeaveRequestItem {
  id: string;
  driver_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  created_at: string;
}

export default function SupervisorDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [formattedDate, setFormattedDate] = useState('');
  const [pendingRequests, setPendingRequests] = useState<LeaveRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [resDash, resLeave] = await Promise.all([
        fetch('/api/dashboard').then((r) => r.json()),
        fetch('/api/leave?status=PENDING').then((r) => r.json()),
      ]);

      if (resDash.success) {
        setStats(resDash.stats);
        setFormattedDate(resDash.formattedDate);
      }

      if (resLeave.success) {
        setPendingRequests(resLeave.requests);
      }
    } catch (err) {
      console.error('Error loading supervisor dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleApproveReject = async (id: string, action: 'APPROVE' | 'REJECT') => {
    setActionId(id);
    try {
      const res = await fetch(`/api/leave/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || 'Gagal memproses pengajuan.');
        return;
      }

      toast.success(action === 'APPROVE' ? 'Izin disetujui!' : 'Izin ditolak.');
      loadDashboard();
    } catch {
      toast.error('Terjadi kesalahan jaringan.');
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Memuat Dashboard Supervisor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Hari Ini</h1>
          <p className="text-xs text-blue-400 font-medium mt-0.5">{formattedDate}</p>
        </div>
        <button
          onClick={loadDashboard}
          className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Driver */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Driver</p>
          <p className="text-3xl font-black text-white mt-2">{stats?.totalDrivers ?? 0}</p>
        </div>

        {/* Sudah Absen */}
        <div className="bg-slate-900/90 border border-orange-900/40 rounded-2xl p-5 shadow-lg">
          <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider">🟢 Sudah Absen</p>
          <p className="text-3xl font-black text-orange-400 mt-2">{stats?.sudahAbsen ?? 0}</p>
        </div>

        {/* Belum Absen */}
        <div className="bg-slate-900/90 border border-rose-900/40 rounded-2xl p-5 shadow-lg">
          <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider">🔴 Belum Absen</p>
          <p className="text-3xl font-black text-rose-400 mt-2">{stats?.belumAbsen ?? 0}</p>
        </div>

        {/* Izin */}
        <div className="bg-slate-900/90 border border-amber-900/40 rounded-2xl p-5 shadow-lg">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">🟡 Izin</p>
          <p className="text-3xl font-black text-amber-400 mt-2">{stats?.izinDisetujui ?? 0}</p>
        </div>
      </div>

      {/* Pending Leave Requests Widget */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
              !
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">PERLU PERSETUJUAN</h2>
              <p className="text-xs text-slate-400">
                {pendingRequests.length} Pengajuan Izin Menunggu Tanggapan
              </p>
            </div>
          </div>
          <Link
            href="/supervisor/izin"
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition"
          >
            LIHAT SEMUA PENGAJUAN &rarr;
          </Link>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <CheckCircle2 size={36} className="mx-auto text-emerald-500/60 mb-2" />
            <p className="text-sm font-medium">Tidak ada pengajuan izin yang menggantung.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base">{req.driver_name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {req.leave_type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Tanggal: <strong>{formatIndonesianDate(req.start_date)}</strong>
                  </p>
                  {req.reason && (
                    <p className="text-xs text-slate-400 italic">Alasan: &ldquo;{req.reason}&rdquo;</p>
                  )}
                </div>

                {/* Approve & Reject Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleApproveReject(req.id, 'APPROVE')}
                    disabled={actionId === req.id}
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Check size={16} />
                    <span>SETUJUI</span>
                  </button>

                  <button
                    onClick={() => handleApproveReject(req.id, 'REJECT')}
                    disabled={actionId === req.id}
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <X size={16} />
                    <span>TOLAK</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
