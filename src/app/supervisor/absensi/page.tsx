'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Edit2, MapPin, RefreshCw, Download, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from '@/components/StatusBadge';
import DatePicker from '@/components/DatePicker';
import Pagination from '@/components/Pagination';
import { formatIndonesianDate, getTodayWITA } from '@/lib/time';

interface AttendanceRecord {
  id: string;
  driver_id: string;
  driver_name: string;
  attendance_date: string;
  attendance_time: string;
  duty_status?: string;
  status: string;
  source: string;
  latitude?: string;
  longitude?: string;
  created_at: string;
}

export default function SupervisorAttendancePage() {
  const todayStr = getTodayWITA();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(todayStr);
  const [search, setSearch] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Edit Modal State
  const [editItem, setEditItem] = useState<AttendanceRecord | null>(null);
  const [selectedDutyStatus, setSelectedDutyStatus] = useState<string>('BERTUGAS');
  const [notes, setNotes] = useState<string>('Diubah oleh Supervisor');
  const [submitting, setSubmitting] = useState(false);

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const url = filterDate ? `/api/attendance?date=${filterDate}` : '/api/attendance';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setAttendance(data.records || []);
      }
    } catch {
      toast.error('Gagal memuat data absensi');
    } finally {
      setLoading(false);
    }
  }, [filterDate]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/attendance/${editItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duty_status: selectedDutyStatus,
          notes: notes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Gagal mengubah status tugas');
        return;
      }
      toast.success('Status tugas driver berhasil diperbarui');
      setEditItem(null);
      fetchAttendance();
    } catch {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRecords = attendance.filter((a) =>
    a.driver_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredRecords.length / pageSize);
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Data Absensi Driver Saya</h1>
          <p className="text-xs text-blue-400">Monitoring dan pengelolaan status tugas driver binaan</p>
        </div>
        <button
          onClick={fetchAttendance}
          className="self-start sm:self-auto px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw size={14} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between shadow-lg">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-56">
            <DatePicker
              label="Tanggal Absen"
              value={filterDate}
              onChange={(val) => setFilterDate(val)}
              todayDefault
              className="w-full"
            />
          </div>

          <div className="w-full sm:w-64">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Cari Driver
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ketik nama driver..."
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
            />
          </div>
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Total Rekaman: <strong className="text-white">{filteredRecords.length}</strong>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Status Absen</th>
                <th className="px-6 py-4">Nama Driver</th>
                <th className="px-6 py-4">Tanggal &amp; Jam (WITA)</th>
                <th className="px-6 py-4">Status Tugas</th>
                <th className="px-6 py-4">Sumber</th>
                <th className="px-6 py-4">Lokasi GPS</th>
                <th className="px-6 py-4 text-right">Ubah Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Memuat data absensi...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada data absensi untuk filter ini.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/15 text-orange-400 text-xs font-bold">
                        <CheckCircle2 size={13} /> Hadir
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-white">{a.driver_name}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-white">{formatIndonesianDate(a.attendance_date)}</p>
                      <p className="text-xs text-orange-400 font-mono font-semibold">
                        Pukul {a.attendance_time.substring(0, 5)} WITA
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge type="duty_status" value={a.duty_status || 'BERTUGAS'} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge type="attendance_source" value={a.source} />
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {a.latitude && a.longitude ? (
                        <a
                          href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-orange-400 hover:underline font-mono"
                        >
                          <MapPin size={14} />
                          <span>
                            {a.latitude.substring(0, 7)}, {a.longitude.substring(0, 7)}
                          </span>
                        </a>
                      ) : (
                        <span className="text-slate-500">Tanpa GPS</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setEditItem(a);
                          setSelectedDutyStatus(a.duty_status || 'BERTUGAS');
                          setNotes('Diubah oleh Supervisor');
                        }}
                        className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-300 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5"
                      >
                        <Edit2 size={14} />
                        <span>Edit Duty Status</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredRecords.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Edit Duty Status Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Ubah Status Tugas Driver</h2>
              <p className="text-xs text-slate-400 mt-1">
                Driver: <strong className="text-white">{editItem.driver_name}</strong> ({editItem.attendance_date})
              </p>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Pilih Status Tugas
                </label>
                <div className="space-y-2.5">
                  <label
                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition ${
                      selectedDutyStatus === 'READY'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="duty_status"
                        value="READY"
                        checked={selectedDutyStatus === 'READY'}
                        onChange={(e) => setSelectedDutyStatus(e.target.value)}
                        className="accent-emerald-500"
                      />
                      <div>
                        <p className="font-bold text-sm">READY (Siap Dipanggil)</p>
                        <p className="text-xs text-slate-400">Driver tidak sedang layanan, siap bertugas</p>
                      </div>
                    </div>
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  </label>

                  <label
                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition ${
                      selectedDutyStatus === 'BERTUGAS'
                        ? 'bg-blue-500/10 border-blue-500 text-blue-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="duty_status"
                        value="BERTUGAS"
                        checked={selectedDutyStatus === 'BERTUGAS'}
                        onChange={(e) => setSelectedDutyStatus(e.target.value)}
                        className="accent-blue-500"
                      />
                      <div>
                        <p className="font-bold text-sm">BERTUGAS (Sedang Layanan)</p>
                        <p className="text-xs text-slate-400">Driver sedang melayani perjalanan</p>
                      </div>
                    </div>
                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                  </label>

                  <label
                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition ${
                      selectedDutyStatus === 'MAINTENANCE'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="duty_status"
                        value="MAINTENANCE"
                        checked={selectedDutyStatus === 'MAINTENANCE'}
                        onChange={(e) => setSelectedDutyStatus(e.target.value)}
                        className="accent-amber-500"
                      />
                      <div>
                        <p className="font-bold text-sm">MAINTENANCE (Di Bengkel)</p>
                        <p className="text-xs text-slate-400">Armada driver sedang perbaikan/bengkel</p>
                      </div>
                    </div>
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Catatan Supervisor
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  placeholder="Alasan perubahan status..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'SIMPAN PERUBAHAN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
