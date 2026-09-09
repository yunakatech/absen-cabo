'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  PieChart,
  RefreshCw,
  AlertCircle,
  Truck,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Stats {
  totalDrivers: number;
  sudahAbsen: number;
  belumAbsen: number;
  izinDisetujui: number;
  izinMenunggu: number;
  attendancePercentage: number;
  leaveSummary: {
    pending: number;
    approved: number;
    rejected: number;
  };
}

interface BelumAbsenDriver {
  id: string;
  employee_code: string;
  name: string;
  phone: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [formattedDate, setFormattedDate] = useState('');
  const [belumAbsenList, setBelumAbsenList] = useState<BelumAbsenDriver[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard');
      const data = await res.json();

      if (data.success) {
        setStats(data.stats);
        setFormattedDate(data.formattedDate);
        setBelumAbsenList(data.belumAbsenList);
      }
    } catch (err) {
      console.error('Failed to fetch admin dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Memuat Dashboard Admin...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title & Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Dashboard Utama
          </h1>
          <p className="text-xs sm:text-sm text-orange-400 font-medium mt-1 uppercase tracking-wider">
            {formattedDate || 'Selasa, 8 September 2026'}
          </p>
        </div>

        <button
          onClick={loadDashboard}
          className="px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition flex items-center gap-2 text-xs font-semibold shadow-sm"
        >
          <RefreshCw size={14} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Driver */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Driver</span>
            <Truck size={18} className="text-slate-500" />
          </div>
          <p className="text-3xl font-black text-white">{stats?.totalDrivers ?? 0}</p>
        </div>

        {/* Sudah Absen */}
        <div className="bg-slate-900/90 border border-orange-900/40 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-orange-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Sudah Absen</span>
            <CheckCircle2 size={18} />
          </div>
          <p className="text-3xl font-black text-orange-400">{stats?.sudahAbsen ?? 0}</p>
        </div>

        {/* Belum Absen */}
        <div className="bg-slate-900/90 border border-rose-900/40 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Belum Absen</span>
            <XCircle size={18} />
          </div>
          <p className="text-3xl font-black text-rose-400">{stats?.belumAbsen ?? 0}</p>
        </div>

        {/* Izin Disetujui */}
        <div className="bg-slate-900/90 border border-amber-900/40 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Izin Disetujui</span>
            <FileText size={18} />
          </div>
          <p className="text-3xl font-black text-amber-400">{stats?.izinDisetujui ?? 0}</p>
        </div>

        {/* Izin Menunggu */}
        <div className="bg-slate-900/90 border border-blue-900/40 rounded-2xl p-5 shadow-lg col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-blue-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Izin Menunggu</span>
            <Clock size={18} />
          </div>
          <p className="text-3xl font-black text-blue-400">{stats?.izinMenunggu ?? 0}</p>
        </div>
      </div>

      {/* Percentage & Leave Overview Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Attendance Percentage Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <PieChart size={20} className="text-orange-400" />
              <h3 className="font-bold text-white text-base">Kehadiran Hari Ini</h3>
            </div>
            <p className="text-xs text-slate-400">Persentase Driver Aktif yang Sudah Absen</p>
          </div>

          <div className="py-6 text-center">
            <div className="text-5xl font-black text-orange-400 tracking-tight">
              {stats?.attendancePercentage ?? 0}%
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {stats?.sudahAbsen} dari {stats?.totalDrivers} Driver
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-500 to-orange-400 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(stats?.attendancePercentage || 0, 100)}%` }}
            />
          </div>
        </div>

        {/* Leave Requests Widget */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-base mb-1">Status Pengajuan Izin</h3>
            <p className="text-xs text-slate-400 mb-4">Ringkasan izin driver hari ini</p>

            <div className="space-y-3">
              <Link
                href="/admin/izin?status=PENDING"
                className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl hover:bg-slate-800 transition"
              >
                <span className="text-xs font-semibold text-amber-300">Menunggu (Pending)</span>
                <span className="text-sm font-bold text-white">{stats?.leaveSummary?.pending ?? 0}</span>
              </Link>

              <Link
                href="/admin/izin?status=APPROVED"
                className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl hover:bg-slate-800 transition"
              >
                <span className="text-xs font-semibold text-orange-300">Disetujui (Approved)</span>
                <span className="text-sm font-bold text-white">{stats?.leaveSummary?.approved ?? 0}</span>
              </Link>

              <Link
                href="/admin/izin?status=REJECTED"
                className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl hover:bg-slate-800 transition"
              >
                <span className="text-xs font-semibold text-rose-300">Ditolak (Rejected)</span>
                <span className="text-sm font-bold text-white">{stats?.leaveSummary?.rejected ?? 0}</span>
              </Link>
            </div>
          </div>

          <Link
            href="/admin/izin"
            className="mt-4 text-center block text-xs font-bold text-orange-400 hover:text-orange-300 transition"
          >
            Kelola Pengajuan Izin &rarr;
          </Link>
        </div>

        {/* Belum Absen Driver List Widget */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-white text-base">Driver Belum Absen</h3>
              <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 text-xs font-bold rounded-full">
                {belumAbsenList.length}
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">Daftar driver yang belum absen &amp; tidak izin</p>

            {belumAbsenList.length === 0 ? (
              <div className="text-center py-6 text-orange-400 font-semibold text-xs">
                ✓ Semua Driver Sudah Absen Hari Ini!
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {belumAbsenList.map((d, i) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between px-3 py-2 bg-slate-800/60 rounded-xl text-xs"
                  >
                    <span className="font-medium text-slate-200">
                      {i + 1}. {d.name} ({d.employee_code})
                    </span>
                    <span className="text-[10px] text-slate-400">{d.phone}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/admin/absensi"
            className="mt-4 text-center block text-xs font-bold text-orange-400 hover:text-orange-300 transition"
          >
            Lihat Tabel Absensi &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
