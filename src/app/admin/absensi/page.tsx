'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, MapPin, Search, RefreshCw, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from '@/components/StatusBadge';
import ConfirmModal from '@/components/ConfirmModal';
import { formatIndonesianDate } from '@/lib/time';

interface AttendanceRecord {
  id: string;
  driver_id: string;
  driver_name: string;
  supervisor_id?: string;
  supervisor_name?: string;
  attendance_date: string;
  attendance_time: string;
  status: string;
  source: string;
  created_by?: string;
  latitude?: string;
  longitude?: string;
  created_at: string;
}

interface DriverOption {
  id: string;
  name: string;
  employee_code: string;
}

export default function AdminAttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterDate, setFilterDate] = useState('');
  const [filterDriver, setFilterDriver] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<AttendanceRecord | null>(null);
  const [deleteItem, setDeleteItem] = useState<AttendanceRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    driver_id: '',
    attendance_date: '',
    attendance_time: '08:00:00',
    status: 'HADIR',
    notes: 'Input Manual oleh Admin',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const url = filterDate ? `/api/attendance?date=${filterDate}` : '/api/attendance';
      const [resAtt, resDr] = await Promise.all([
        fetch(url).then((r) => r.json()),
        fetch('/api/users?role=DRIVER').then((r) => r.json()),
      ]);

      if (resAtt.success) setAttendance(resAtt.attendance);
      if (resDr.success) setDrivers(resDr.users);
    } catch (err) {
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  }, [filterDate]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const openAddModal = () => {
    const today = new Date().toISOString().substring(0, 10);
    setFormData({
      driver_id: drivers[0]?.id || '',
      attendance_date: today,
      attendance_time: '08:00:00',
      status: 'HADIR',
      notes: 'Input Manual oleh Admin',
    });
    setIsAddOpen(true);
  };

  const openEditModal = (item: AttendanceRecord) => {
    setEditItem(item);
    setFormData({
      driver_id: item.driver_id,
      attendance_date: item.attendance_date,
      attendance_time: item.attendance_time,
      status: item.status,
      notes: 'Diubah oleh Admin',
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/attendance/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Gagal menambah absensi');
        setSubmitting(false);
        return;
      }

      toast.success('Absensi manual berhasil disimpan');
      setIsAddOpen(false);
      fetchAttendance();
    } catch {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/attendance/${editItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendance_date: formData.attendance_date,
          attendance_time: formData.attendance_time,
          status: formData.status,
          notes: formData.notes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Gagal mengubah absensi');
        setSubmitting(false);
        return;
      }

      toast.success('Data absensi diperbarui');
      setEditItem(null);
      fetchAttendance();
    } catch {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/attendance/${deleteItem.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Gagal menghapus absensi');
        setSubmitting(false);
        return;
      }

      toast.success('Data absensi berhasil dihapus');
      setDeleteItem(null);
      fetchAttendance();
    } catch {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAttendance = attendance.filter((item) => {
    if (filterDriver !== 'ALL' && item.driver_id !== filterDriver) return false;
    if (
      search &&
      !item.driver_name.toLowerCase().includes(search.toLowerCase()) &&
      !item.attendance_date.includes(search)
    ) {
      return false;
    }
    return true;
  });

  const handleExportCSV = () => {
    if (filteredAttendance.length === 0) {
      toast.error('Tidak ada data absensi untuk diexport');
      return;
    }

    const headers = [
      'No',
      'Tanggal Absen',
      'Waktu (WITA)',
      'Nama Driver',
      'Supervisor',
      'Status',
      'Sumber',
      'Latitude',
      'Longitude',
      'Google Maps Link',
    ];

    const rows = filteredAttendance.map((item, index) => {
      const gmapsLink =
        item.latitude && item.longitude
          ? `https://www.google.com/maps?q=${item.latitude},${item.longitude}`
          : '-';
      return [
        index + 1,
        item.attendance_date,
        item.attendance_time,
        `"${item.driver_name.replace(/"/g, '""')}"`,
        `"${(item.supervisor_name || '-').replace(/"/g, '""')}"`,
        item.status,
        item.source,
        item.latitude || '-',
        item.longitude || '-',
        `"${gmapsLink}"`,
      ];
    });

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const dateSuffix = filterDate || 'Semua_Tanggal';
    link.href = url;
    link.setAttribute('download', `Absen_Cabo_Export_${dateSuffix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`${filteredAttendance.length} data absensi berhasil diexport ke CSV`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Data Absensi Driver</h1>
          <p className="text-xs text-slate-400">Rekapitulasi dan pengelolaan data absensi harian</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition"
          >
            <Download size={18} />
            <span>EXPORT CSV</span>
          </button>

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
          >
            <Plus size={18} />
            <span>+ ABSENSI MANUAL</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
        {/* Date Filter */}
        <div className="w-full sm:w-auto">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Filter Tanggal:
          </label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
          />
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="ml-2 text-xs text-emerald-400 font-semibold"
            >
              Reset
            </button>
          )}
        </div>

        {/* Driver Filter */}
        <div className="w-full sm:w-auto">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Filter Driver:
          </label>
          <select
            value={filterDriver}
            onChange={(e) => setFilterDriver(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
          >
            <option value="ALL">Semua Driver</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.employee_code})
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="w-full sm:flex-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Cari Nama:
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari driver..."
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
          />
        </div>

        <button
          onClick={fetchAttendance}
          className="self-end p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
          title="Refresh Data"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Attendance Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Tanggal &amp; Waktu (WITA)</th>
                <th className="px-6 py-4">Nama Driver</th>
                <th className="px-6 py-4">Supervisor</th>
                <th className="px-6 py-4">Sumber</th>
                <th className="px-6 py-4">Lokasi GPS</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Memuat data absensi...
                  </td>
                </tr>
              ) : filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Belum ada data absensi untuk filter ini.
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4">
                      <p className="font-bold text-white">{formatIndonesianDate(item.attendance_date)}</p>
                      <p className="text-xs text-emerald-400 font-mono font-semibold">
                        Pukul {item.attendance_time.substring(0, 5)} WITA
                      </p>
                    </td>
                    <td className="px-6 py-4 font-semibold text-white">{item.driver_name}</td>
                    <td className="px-6 py-4 text-slate-400">{item.supervisor_name || '-'}</td>
                    <td className="px-6 py-4">
                      <StatusBadge type="attendance_source" value={item.source} />
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {item.latitude && item.longitude ? (
                        <a
                          href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-400 hover:underline font-mono"
                        >
                          <MapPin size={14} />
                          <span>
                            {item.latitude.substring(0, 7)}, {item.longitude.substring(0, 7)}
                          </span>
                        </a>
                      ) : (
                        <span className="text-slate-500">Tanpa GPS</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                        title="Edit Absensi"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteItem(item)}
                        className="p-2 bg-rose-950/60 hover:bg-rose-900 text-rose-400 hover:text-rose-200 rounded-lg transition"
                        title="Hapus Absensi"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Attendance Modal */}
      {(isAddOpen || editItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <h2 className="text-xl font-bold text-white">
              {isAddOpen ? 'Input Absensi Manual' : `Edit Absensi: ${editItem?.driver_name}`}
            </h2>

            <form onSubmit={isAddOpen ? handleCreate : handleUpdate} className="space-y-4">
              {isAddOpen && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Pilih Driver
                  </label>
                  <select
                    value={formData.driver_id}
                    onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                    required
                  >
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.employee_code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Tanggal Absen
                </label>
                <input
                  type="date"
                  value={formData.attendance_date}
                  onChange={(e) => setFormData({ ...formData, attendance_date: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Waktu Absen (WITA)
                </label>
                <input
                  type="time"
                  step="1"
                  value={formData.attendance_time}
                  onChange={(e) => setFormData({ ...formData, attendance_time: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Catatan Admin
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    setEditItem(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Memproses...' : 'SIMPAN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteItem}
        title="Hapus Data Absensi?"
        description={`Absensi driver "${deleteItem?.driver_name}" pada tanggal ${deleteItem?.attendance_date} akan dihapus secara permanen. Tindakan ini akan dicatat di Audit Log.`}
        confirmText="YA, HAPUS"
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
        isLoading={submitting}
      />
    </div>
  );
}
