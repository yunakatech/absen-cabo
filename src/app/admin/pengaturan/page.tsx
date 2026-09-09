'use client';

import React, { useEffect, useState } from 'react';
import { Save, RefreshCw, Database, Clock, MapPin, Calendar, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    attendance_enabled: 'true',
    attendance_start_time: '05:00:00',
    attendance_end_time: '13:00:00',
    require_gps: 'false',
    leave_enabled: 'true',
    work_days: '1,2,3,4,5,6', // Mon-Sat
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingUpDb, setSettingUpDb] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.settings) {
          setSettings({
            attendance_enabled: String(d.settings.attendance_enabled),
            attendance_start_time: d.settings.attendance_start_time || '05:00:00',
            attendance_end_time: d.settings.attendance_end_time || '13:00:00',
            require_gps: String(d.settings.require_gps),
            leave_enabled: String(d.settings.leave_enabled),
            work_days: d.settings.work_days || '1,2,3,4,5,6',
          });
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Gagal menyimpan pengaturan');
        setSaving(false);
        return;
      }

      toast.success('Pengaturan sistem berhasil disimpan!');
    } catch {
      toast.error('Terjadi kesalahan jaringan.');
    } finally {
      setSaving(false);
    }
  };

  const handleRunSetup = async () => {
    setSettingUpDb(true);
    try {
      const res = await fetch('/api/setup', { method: 'POST' });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || 'Setup Spreadsheet gagal');
      } else {
        toast.success(data.message || 'Database Google Sheets berhasil disiapkan!');
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan.');
    } finally {
      setSettingUpDb(false);
    }
  };

  const daysMap = [
    { num: '1', label: 'Senin' },
    { num: '2', label: 'Selasa' },
    { num: '3', label: 'Rabu' },
    { num: '4', label: 'Kamis' },
    { num: '5', label: 'Jumat' },
    { num: '6', label: 'Sabtu' },
    { num: '0', label: 'Minggu' },
  ];

  const selectedDays = settings.work_days.split(',');

  const toggleDay = (num: string) => {
    let updated: string[];
    if (selectedDays.includes(num)) {
      updated = selectedDays.filter((d) => d !== num);
    } else {
      updated = [...selectedDays, num];
    }
    setSettings({ ...settings, work_days: updated.join(',') });
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center text-slate-400">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Pengaturan Sistem</h1>
        <p className="text-xs text-slate-400">Konfigurasi jam absensi, GPS, dan database</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Attendance Settings Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Clock className="text-orange-400" size={20} />
            <span>Aturan Absensi Driver</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Master Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-800/60 rounded-2xl">
              <div>
                <p className="font-bold text-white text-sm">Status Absensi</p>
                <p className="text-xs text-slate-400">Aktifkan atau nonaktifkan sistem absensi</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettings({
                    ...settings,
                    attendance_enabled: settings.attendance_enabled === 'true' ? 'false' : 'true',
                  })
                }
                className={`text-2xl transition ${
                  settings.attendance_enabled === 'true' ? 'text-orange-400' : 'text-slate-500'
                }`}
              >
                {settings.attendance_enabled === 'true' ? (
                  <ToggleRight size={36} />
                ) : (
                  <ToggleLeft size={36} />
                )}
              </button>
            </div>

            {/* GPS Require Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-800/60 rounded-2xl">
              <div>
                <p className="font-bold text-white text-sm">Wajibkan Lokasi GPS</p>
                <p className="text-xs text-slate-400">Wajibkan HP mengirim koordinat GPS saat absen</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettings({
                    ...settings,
                    require_gps: settings.require_gps === 'true' ? 'false' : 'true',
                  })
                }
                className={`text-2xl transition ${
                  settings.require_gps === 'true' ? 'text-orange-400' : 'text-slate-500'
                }`}
              >
                {settings.require_gps === 'true' ? (
                  <ToggleRight size={36} />
                ) : (
                  <ToggleLeft size={36} />
                )}
              </button>
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Jam Mulai Absen (WITA)
              </label>
              <input
                type="time"
                step="1"
                value={settings.attendance_start_time}
                onChange={(e) => setSettings({ ...settings, attendance_start_time: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-white font-mono text-sm"
                required
              />
            </div>

            {/* End Time */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Batas Akhir Absen (WITA)
              </label>
              <input
                type="time"
                step="1"
                value={settings.attendance_end_time}
                onChange={(e) => setSettings({ ...settings, attendance_end_time: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-white font-mono text-sm"
                required
              />
            </div>
          </div>
        </div>

        {/* Work Days & Leave Settings Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Calendar className="text-blue-400" size={20} />
            <span>Hari Kerja &amp; Pengajuan Izin</span>
          </h2>

          {/* Leave Enable Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-800/60 rounded-2xl">
            <div>
              <p className="font-bold text-white text-sm">Fitur Pengajuan Izin</p>
              <p className="text-xs text-slate-400">Izinkan driver mengajukan izin tidak masuk</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setSettings({
                  ...settings,
                  leave_enabled: settings.leave_enabled === 'true' ? 'false' : 'true',
                })
              }
              className={`text-2xl transition ${
                settings.leave_enabled === 'true' ? 'text-blue-400' : 'text-slate-500'
              }`}
            >
              {settings.leave_enabled === 'true' ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
            </button>
          </div>

          {/* Days Checkboxes */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Hari Kerja Operasional:
            </label>
            <div className="flex flex-wrap gap-2">
              {daysMap.map((d) => {
                const active = selectedDays.includes(d.num);
                return (
                  <button
                    key={d.num}
                    type="button"
                    onClick={() => toggleDay(d.num)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                      active
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Submit Settings Button */}
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-500 hover:from-orange-400 hover:to-orange-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 text-base transition transform active:scale-95 disabled:opacity-50"
        >
          <Save size={20} />
          <span>{saving ? 'MENYIMPAN...' : 'SIMPAN PENGATURAN'}</span>
        </button>
      </form>

      {/* Infrastructure / Database Setup Utility Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Database className="text-purple-400" size={20} />
          <span>Google Sheets Database Setup</span>
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          Gunakan tombol di bawah untuk membuat secara otomatis seluruh tab sheet (<strong>Users</strong>,{' '}
          <strong>Attendance</strong>, <strong>Leave_Requests</strong>, <strong>Settings</strong>,{' '}
          <strong>Audit_Log</strong>) di Google Spreadsheet Anda beserta header kolom lengkap.
        </p>

        <button
          type="button"
          onClick={handleRunSetup}
          disabled={settingUpDb}
          className="px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw size={16} className={settingUpDb ? 'animate-spin' : ''} />
          <span>{settingUpDb ? 'MEMPROSES SETUP...' : 'SETUP / INISIALISASI TAB SPREADSHEET'}</span>
        </button>
      </div>
    </div>
  );
}
