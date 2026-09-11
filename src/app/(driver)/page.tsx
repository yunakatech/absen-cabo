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
  Wrench,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DutyStatus } from '@/lib/types';

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
  monday_enabled?: boolean;
  tuesday_enabled?: boolean;
  wednesday_enabled?: boolean;
  thursday_enabled?: boolean;
  friday_enabled?: boolean;
  saturday_enabled?: boolean;
  sunday_enabled?: boolean;
}

interface AttendanceRecord {
  id: string;
  attendance_time: string;
  attendance_date: string;
  duty_status?: DutyStatus;
}

interface LeaveRecord {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
}

const DUTY_STATUS_OPTIONS: { value: DutyStatus; label: string; desc: string; emoji: string; active: string; inactive: string }[] = [
  {
    value: 'READY',
    label: 'Ready',
    desc: 'Siap dipanggil',
    emoji: '🟢',
    active: 'border-emerald-500 bg-emerald-500/20 text-emerald-300',
    inactive: 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-emerald-700 hover:bg-emerald-900/20',
  },
  {
    value: 'BERTUGAS',
    label: 'Bertugas',
    desc: 'Sedang melayani',
    emoji: '🔵',
    active: 'border-blue-500 bg-blue-500/20 text-blue-300',
    inactive: 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-blue-700 hover:bg-blue-900/20',
  },
  {
    value: 'MAINTENANCE',
    label: 'Maintenance',
    desc: 'Armada di bengkel',
    emoji: '🟡',
    active: 'border-amber-500 bg-amber-500/20 text-amber-300',
    inactive: 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-amber-700 hover:bg-amber-900/20',
  },
];

export default function DriverHomePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [serverTime, setServerTime] = useState<ServerTime | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [approvedLeave, setApprovedLeave] = useState<LeaveRecord | null>(null);
  const [dutyStatus, setDutyStatus] = useState<DutyStatus>('BERTUGAS');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [resMe, resTime, resSettings, resAtt, resLeave] = await Promise.all([
        fetch('/api/auth/me').then((r) => r.json()),
        fetch('/api/time').then((r) => r.json()),
        fetch('/api/settings').then((r) => r.json()),
        fetch('/api/attendance').then((r) => r.json()),
        fetch('/api/leave').then((r) => r.json()),
      ]);

      if (resMe?.success) setUser(resMe.user);
      if (resTime?.success) setServerTime(resTime.time);
      if (resSettings?.success) setSettings(resSettings.settings);

      if (resAtt?.success && Array.isArray(resAtt.attendance) && resTime?.success) {
        const attToday = resAtt.attendance.find(
          (a: AttendanceRecord) => a.attendance_date === resTime.time.dateStr
        );
        setTodayAttendance(attToday || null);
      }

      if (resLeave?.success && Array.isArray(resLeave.requests) && resTime?.success) {
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

  const handleAbsen = async () => {
    setSubmitting(true);
    let coords = { latitude: '', longitude: '', accuracy: '' };

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
          duty_status: dutyStatus,
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

  const rawStart = settings?.attendance_start_time || '05:00';
  const rawEnd = settings?.attendance_end_time || '13:00';
  const startTime = rawStart.substring(0, 5);
  const endTime = rawEnd.substring(0, 5);
  const currentHHMM = serverTime?.hhmm || '00:00';

  let isTodayWorkDay = true;
  if (settings && serverTime) {
    const d = serverTime.dayOfWeek;
    if (d === 1 && settings.monday_enabled === false) isTodayWorkDay = false;
    if (d === 2 && settings.tuesday_enabled === false) isTodayWorkDay = false;
    if (d === 3 && settings.wednesday_enabled === false) isTodayWorkDay = false;
    if (d === 4 && settings.thursday_enabled === false) isTodayWorkDay = false;
    if (d === 5 && settings.friday_enabled === false) isTodayWorkDay = false;
    if (d === 6 && settings.saturday_enabled === false) isTodayWorkDay = false;
    if (d === 0 && settings.sunday_enabled !== true) isTodayWorkDay = false;
  }

  let stateNum = 2;
  if (todayAttendance) stateNum = 3;
  else if (approvedLeave) stateNum = 6;
  else if (settings && !settings.attendance_enabled) stateNum = 5;
  else if (!isTodayWorkDay) stateNum = 7;
  else if (currentHHMM < startTime) stateNum = 1;
  else if (currentHHMM > endTime) stateNum = 4;

  const hour = parseInt(currentHHMM.substring(0, 2), 10);
  let greeting = 'Selamat Pagi';
  if (hour >= 11 && hour < 15) greeting = 'Selamat Siang';
  else if (hour >= 15 && hour < 18) greeting = 'Selamat Sore';
  else if (hour >= 18 || hour < 5) greeting = 'Selamat Malam';

  const dutyLabel = DUTY_STATUS_OPTIONS.find((s) => s.value === (todayAttendance?.duty_status || 'BERTUGAS'));

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
            {/* Show duty status */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl border text-xs font-bold mt-2
              bg-slate-800/80 border-slate-700 text-slate-300">
              <span>{dutyLabel?.emoji}</span>
              <span>{dutyLabel?.label || todayAttendance?.duty_status}</span>
            </div>
            <p className="text-xs text-slate-400">
              Terima kasih! Absensi Anda telah berhasil dicatat.
            </p>
          </div>
        )}

        {/* STATE 5 — ABSENSI DINONAKTIFKAN ADMIN */}
        {stateNum === 5 && (
          <div className="space-y-4 py-4">
            <div className="w-20 h-20 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center justify-center mx-auto">
              <AlertTriangle size={44} />
            </div>
            <h3 className="text-lg font-bold text-slate-300">Absensi Dinonaktifkan</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Sistem absensi saat ini sedang dinonaktifkan oleh Admin.
            </p>
          </div>
        )}

        {/* STATE 7 — LIBUR OPERASIONAL */}
        {stateNum === 7 && (
          <div className="space-y-4 py-4">
            <div className="w-20 h-20 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center mx-auto">
              <Calendar size={44} />
            </div>
            <h3 className="text-lg font-bold text-blue-300">Hari Libur Operasional</h3>
            <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
              Hari ini tidak ada jadwal absensi kerja.
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
          <div className="space-y-5 py-2">
            <div>
              <p className="text-sm font-semibold text-slate-300 mb-1">Anda belum absen hari ini</p>
              <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                <Clock size={14} className="text-orange-400" />
                <span>Batas absen pukul <strong>{endTime}</strong></span>
              </p>
            </div>

            {/* Duty Status Selector */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Status Saat Ini</p>
              <div className="grid grid-cols-3 gap-2">
                {DUTY_STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDutyStatus(opt.value)}
                    className={`flex flex-col items-center gap-1 px-2 py-3 rounded-2xl border text-xs font-bold transition-all ${
                      dutyStatus === opt.value ? opt.active : opt.inactive
                    }`}
                  >
                    <span className="text-xl">{opt.emoji}</span>
                    <span>{opt.label}</span>
                    <span className="text-[10px] font-normal opacity-70">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ABSEN BUTTON */}
            <button
              onClick={handleAbsen}
              disabled={submitting}
              className="w-full py-6 bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-400 text-white font-black rounded-3xl shadow-2xl shadow-orange-500/40 flex flex-col items-center justify-center gap-2 transform active:scale-95 transition-all disabled:opacity-50"
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
                  <span className="text-2xl sm:text-3xl tracking-wider">ABSEN SEKARANG</span>
                  <span className="text-xs font-normal opacity-80">
                    Status: {DUTY_STATUS_OPTIONS.find((s) => s.value === dutyStatus)?.emoji}{' '}
                    {DUTY_STATUS_OPTIONS.find((s) => s.value === dutyStatus)?.label}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons Section */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Link
          href="/izin"
          className="py-4 px-4 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/40 rounded-2xl text-amber-300 font-bold flex items-center justify-center gap-2 text-sm shadow-md transition transform active:scale-95 text-center"
        >
          <FileEdit size={18} className="text-amber-400 shrink-0" />
          <span>AJUKAN IZIN</span>
        </Link>

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
