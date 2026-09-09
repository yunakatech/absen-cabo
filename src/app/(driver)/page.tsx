'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  FileEdit,
  History,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface UserProfile {
  id: string;
  name: string;
  role: string;
}

interface ServerTime {
  dateStr: string;
  timeStr: string;
  hhmm: string;
  dayOfWeek: number;
  formattedFull: string;
}

interface Settings {
  attendance_start_time: string;
  attendance_end_time: string;
  require_gps: boolean;
  attendance_enabled: boolean;
}

interface AttendanceRecord {
  id: string;
  attendance_time: string;
  attendance_date: string;
}

interface LeaveRecord {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
}

export default function DriverHomePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [serverTime, setServerTime] = useState<ServerTime | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [approvedLeave, setApprovedLeave] = useState<LeaveRecord | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch me, time, settings, attendance, leave in parallel
      const [resMe, resTime, resSettings, resAtt, resLeave] = await Promise.all([
        fetch('/api/auth/me').then((r) => r.json()),
        fetch('/api/time').then((r) => r.json()),
        fetch('/api/settings').then((r) => r.json()),
        fetch('/api/attendance').then((r) => r.json()),
        fetch('/api/leave').then((r) => r.json()),
      ]);

      if (resMe.success) setUser(resMe.user);
      if (resTime.success) setServerTime(resTime.time);
      if (resSettings.success) setSettings(resSettings.settings);

      // Check today's attendance
      if (resAtt.success && resTime.success) {
        const attToday = resAtt.attendance.find(
          (a: AttendanceRecord) => a.attendance_date === resTime.time.dateStr
        );
        setTodayAttendance(attToday || null);
      }

      // Check today's approved leave
      if (resLeave.success && resTime.success) {
        const leaveToday = resLeave.requests.find(
          (l: LeaveRecord) =>
            l.status === 'APPROVED' &&
            l.start_date <= resTime.time.dateStr &&
            l.end_date >= resTime.time.dateStr
        );
        setApprovedLeave(leaveToday || null);
      }
    } catch (err) {
      console.error('Error fetching driver home data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle ABSEN submission
  const handleAbsen = async () => {
    setSubmitting(true);
    let coords = { latitude: '', longitude: '', accuracy: '' };

    // Get browser location if available
    if ('geolocation' in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 7000,
            enableHighAccuracy: true,
          });
        });
        coords = {
          latitude: String(pos.coords.latitude),
          longitude: String(pos.coords.longitude),
          accuracy: String(pos.coords.accuracy),
        };
      } catch {
        console.warn('Geolocation error or permission denied');
      }
    }

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: coords.latitude,
          longitude: coords.longitude,
          gps_accuracy: coords.accuracy,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || 'Absensi gagal.');
        fetchData();
        setSubmitting(false);
        return;
      }

      toast.success('✓ ABSEN BERHASIL!');
      setTodayAttendance(data.attendance);
      fetchData();
    } catch {
      toast.error('Terjadi kesalahan jaringan.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Memuat data absensi...</p>
      </div>
    );
  }

  const startTime = settings?.attendance_start_time || '05:00';
  const endTime = settings?.attendance_end_time || '13:00';
  const currentHHMM = serverTime?.hhmm || '00:00';

  // Determine state 1 to 6
  let stateNum = 2; // Default OPEN

  if (approvedLeave) {
    stateNum = 6; // STATE 6 — Izin Disetujui
  } else if (todayAttendance) {
    stateNum = 3; // STATE 3 — Sudah Absen
  } else if (currentHHMM < startTime) {
    stateNum = 1; // STATE 1 — Belum Waktu Absen
  } else if (currentHHMM > endTime) {
    stateNum = 4; // STATE 4 — Waktu Sudah Berakhir
  }

  // Greeting based on time
  const hour = parseInt(currentHHMM.substring(0, 2), 10);
  let greeting = 'Selamat Pagi';
  if (hour >= 11 && hour < 15) greeting = 'Selamat Siang';
  else if (hour >= 15 && hour < 18) greeting = 'Selamat Sore';
  else if (hour >= 18 || hour < 5) greeting = 'Selamat Malam';

  return (
    <div className="flex-1 flex flex-col justify-between space-y-6">
      {/* Header Info */}
      <div className="text-center pt-2">
        <p className="text-xs uppercase font-bold tracking-widest text-orange-400 mb-1">
          {greeting}
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {user?.name || 'Pak Driver'}
        </h2>
        <div className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-xs font-semibold text-slate-300">
          <Calendar size={14} className="text-orange-400" />
          <span>{serverTime?.formattedFull || 'Selasa, 8 September 2026'}</span>
        </div>
      </div>

      {/* Main State Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-xl backdrop-blur-md relative overflow-hidden my-auto">
        {/* STATE 6 — IZIN DISETUJUI */}
        {stateNum === 6 && (
          <div className="space-y-4 py-4">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10 animate-pulse">
              <CheckCircle2 size={48} />
            </div>
            <h3 className="text-xl font-bold text-emerald-400">✓ IZIN DISETUJUI</h3>
            <p className="text-sm text-slate-300 max-w-xs mx-auto leading-relaxed">
              Pengajuan izin Anda hari ini telah disetujui. Anda tidak perlu melakukan absensi hari ini.
            </p>
          </div>
        )}

        {/* STATE 3 — SUDAH ABSEN */}
        {stateNum === 3 && (
          <div className="space-y-4 py-4">
            <div className="w-20 h-20 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40 flex items-center justify-center mx-auto shadow-lg shadow-orange-500/10">
              <CheckCircle2 size={48} />
            </div>
            <h3 className="text-xl font-bold text-orange-400">✓ SUDAH ABSEN HARI INI</h3>
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-orange-950/60 border border-orange-800/60 rounded-2xl text-2xl font-extrabold text-orange-300 tracking-wider">
              <Clock size={22} className="text-orange-400" />
              <span>{todayAttendance?.attendance_time.substring(0, 5) || serverTime?.hhmm}</span>
            </div>
            <p className="text-xs text-slate-400">
              Terima kasih! Absensi Anda telah berhasil dicatat.
            </p>
          </div>
        )}

        {/* STATE 1 — BELUM WAKTU ABSEN */}
        {stateNum === 1 && (
          <div className="space-y-4 py-4">
            <div className="w-20 h-20 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto">
              <Clock size={44} />
            </div>
            <h3 className="text-lg font-bold text-amber-300">Absensi Belum Dibuka</h3>
            <p className="text-sm text-slate-300 max-w-xs mx-auto leading-relaxed">
              Absensi dapat dilakukan mulai pukul <strong className="text-amber-300">{startTime}</strong>.
            </p>
          </div>
        )}

        {/* STATE 4 — WAKTU SUDAH BERAKHIR */}
        {stateNum === 4 && (
          <div className="space-y-4 py-4">
            <div className="w-20 h-20 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto">
              <AlertTriangle size={44} />
            </div>
            <h3 className="text-lg font-bold text-rose-400">⚠ WAKTU ABSEN SUDAH BERAKHIR</h3>
            <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
              Batas waktu absensi hari ini pukul <strong className="text-rose-300">{endTime}</strong>.
              <br />
              Jika Anda tidak masuk kerja hari ini, silakan ajukan izin.
            </p>
          </div>
        )}

        {/* STATE 2 — ABSENSI AKTIF (BISA ABSEN) */}
        {stateNum === 2 && (
          <div className="space-y-6 py-2">
            <div>
              <p className="text-sm font-semibold text-slate-300 mb-1">Anda belum absen hari ini</p>
              <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                <Clock size={14} className="text-orange-400" />
                <span>Batas absen pukul <strong>{endTime}</strong></span>
              </p>
            </div>

            {/* BIG GREEN ABSEN BUTTON */}
            <button
              onClick={handleAbsen}
              disabled={submitting}
              className="w-full py-7 bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-400 text-white font-black rounded-3xl shadow-2xl shadow-orange-500/40 flex flex-col items-center justify-center gap-2 transform active:scale-95 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center gap-2 text-xl">
                  <svg className="animate-spin h-7 w-7 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  MEMPROSES...
                </span>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl shadow-inner">
                    🟢
                  </div>
                  <span className="text-2xl sm:text-3xl tracking-wider">ABSEN SEKARANG</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons Section (Always Accessible) */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        {/* AJUKAN IZIN Button */}
        <Link
          href="/izin"
          className="py-4 px-4 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/40 rounded-2xl text-amber-300 font-bold flex items-center justify-center gap-2 text-sm shadow-md transition transform active:scale-95 text-center"
        >
          <FileEdit size={18} className="text-amber-400 shrink-0" />
          <span>AJUKAN IZIN</span>
        </Link>

        {/* RIWAYAT Button */}
        <Link
          href="/riwayat"
          className="py-4 px-4 bg-gradient-to-r from-blue-500/20 to-indigo-600/20 hover:from-blue-500/30 hover:to-indigo-600/30 border border-blue-500/40 rounded-2xl text-blue-300 font-bold flex items-center justify-center gap-2 text-sm shadow-md transition transform active:scale-95 text-center"
        >
          <History size={18} className="text-blue-400 shrink-0" />
          <span>RIWAYAT</span>
        </Link>
      </div>

      {/* Footer Refresh */}
      <div className="text-center pt-2">
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition"
        >
          <RefreshCw size={12} />
          <span>Segarkan Halaman</span>
        </button>
      </div>
    </div>
  );
}
