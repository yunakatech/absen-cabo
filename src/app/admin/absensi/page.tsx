'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Edit2, Trash2, MapPin, Search, RefreshCw, Download, CheckCircle2, XCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from '@/components/StatusBadge';
import ConfirmModal from '@/components/ConfirmModal';
import DatePicker from '@/components/DatePicker';
import { formatIndonesianDate, getTodayWITA } from '@/lib/time';

/* ─── Types ──────────────────────────────────────────── */
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

interface LeaveRequest {
  id: string;
  driver_id: string;
  driver_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface DriverOption {
  id: string;
  name: string;
  employee_code: string;
  supervisor_id?: string;
  phone?: string;
}

// A "synthetic" row that represents one driver's status for a given date
type StatusFilter = 'ALL' | 'HADIR' | 'BELUM_ABSEN' | 'IZIN';

interface DriverStatusRow {
  driverStatus: StatusFilter; // HADIR | BELUM_ABSEN | IZIN
  driver: DriverOption;
  attendance: AttendanceRecord | null;
  leave: LeaveRequest | null;
}

/* ─── Component ────────────────────────────────────────── */
export default function AdminAttendancePage() {
  const searchParams = useSearchParams();

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [supervisors, setSupervisors] = useState<DriverOption[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Today in YYYY-MM-DD (Asia/Makassar WITA) for default date filter
  const todayStr = getTodayWITA();

  // Filters
  const [filterDate, setFilterDate] = useState(todayStr);
  const [filterDriver, setFilterDriver] = useState('ALL');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('ALL');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<AttendanceRecord | null>(null);
  const [deleteItem, setDeleteItem] = useState<AttendanceRecord | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    driver_id: '',
    attendance_date: todayStr,
    attendance_time: '08:00:00',
    status: 'HADIR',
    notes: 'Input Manual oleh Admin',
  });
  const [submitting, setSubmitting] = useState(false);

  // Read ?status= param from URL (e.g. from dashboard shortcut links)
  useEffect(() => {
    const param = searchParams.get('status');
    if (param === 'HADIR' || param === 'BELUM_ABSEN' || param === 'IZIN') {
      setFilterStatus(param as StatusFilter);
    }
  }, [searchParams]);

  /* ─── Data Fetching ─────────────────────────────────── */
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const attUrl = filterDate ? `/api/attendance?date=${filterDate}` : '/api/attendance';
      const [resAtt, resDr, resSup, resLeave] = await Promise.all([
        fetch(attUrl).then((r) => r.json()),
        fetch('/api/users?role=DRIVER').then((r) => r.json()),
        fetch('/api/users?role=SUPERVISOR').then((r) => r.json()),
        fetch('/api/leave').then((r) => r.json()),
      ]);

      if (resAtt.success) setAttendance(resAtt.attendance);
      if (resDr.success) setDrivers(resDr.users);
      if (resSup.success) setSupervisors(resSup.users);
      if (resLeave.success) setLeaveRequests(resLeave.requests);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [filterDate]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Supervisor Lookup Map
  const supervisorMap = new Map(supervisors.map((s) => [s.id, s.name]));

  /* ─── Synthetic driver status rows ─────────────────── */
  const driverStatusRows: DriverStatusRow[] = drivers.map((driver) => {
    const att = attendance.find((a) => a.driver_id === driver.id) || null;

    const leave = leaveRequests.find(
      (l) =>
        l.driver_id === driver.id &&
        l.status === 'APPROVED' &&
        l.start_date <= (filterDate || todayStr) &&
        l.end_date >= (filterDate || todayStr)
    ) || null;

    let driverStatus: StatusFilter = 'BELUM_ABSEN';
    if (att) driverStatus = 'HADIR';
    else if (leave) driverStatus = 'IZIN';

    return { driverStatus, driver, attendance: att, leave };
  });

  /* ─── Filtering ─────────────────────────────────────── */
  const filteredRows = driverStatusRows.filter((row) => {
    if (filterStatus !== 'ALL' && row.driverStatus !== filterStatus) return false;
    if (filterDriver !== 'ALL' && row.driver.id !== filterDriver) return false;
    if (
      search &&
      !row.driver.name.toLowerCase().includes(search.toLowerCase()) &&
      !row.driver.employee_code.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Count by status for badges
  const counts = {
    hadir: driverStatusRows.filter((r) => r.driverStatus === 'HADIR').length,
    belumAbsen: driverStatusRows.filter((r) => r.driverStatus === 'BELUM_ABSEN').length,
    izin: driverStatusRows.filter((r) => r.driverStatus === 'IZIN').length,
  };

  /* ─── Modal Helpers ─────────────────────────────────── */
  const openAddModal = () => {
    setFormData({
      driver_id: drivers[0]?.id || '',
      attendance_date: filterDate || todayStr,
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

  /* ─── CRUD Handlers ─────────────────────────────────── */
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
        return;
      }
      toast.success('Absensi manual berhasil disimpan');
      setIsAddOpen(false);
      fetchAll();
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
        return;
      }
      toast.success('Data absensi diperbarui');
      setEditItem(null);
      fetchAll();
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
      const res = await fetch(`/api/attendance/${deleteItem.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Gagal menghapus absensi');
        return;
      }
      toast.success('Data absensi berhasil dihapus');
      setDeleteItem(null);
      fetchAll();
    } catch {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── CSV Export ─────────────────────────────────────── */
  const handleExportCSV = () => {
    const exportRows = filteredRows.filter((r) => r.attendance);
    if (exportRows.length === 0) {
      toast.error('Tidak ada data HADIR untuk diexport');
      return;
    }
    const headers = ['No','Tanggal','Waktu (WITA)','Nama Driver','Supervisor','Status','Sumber','Latitude','Longitude','Google Maps'];
    const rows = exportRows.map((r, i) => {
      const a = r.attendance!;
      const gmaps = a.latitude && a.longitude ? `https://www.google.com/maps?q=${a.latitude},${a.longitude}` : '-';
      const supName =
        a.supervisor_name && a.supervisor_name !== '-'
          ? a.supervisor_name
          : r.driver.supervisor_id
          ? supervisorMap.get(r.driver.supervisor_id) || '-'
          : '-';
      return [i+1, a.attendance_date, a.attendance_time, `"${a.driver_name}"`, `"${supName}"`, a.status, a.source, a.latitude||'-', a.longitude||'-', `"${gmaps}"`];
    });
    const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Absen_Cabo_${filterDate || 'Semua'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`${exportRows.length} baris berhasil diexport`);
  };

  /* ─── Render ─────────────────────────────────────────── */
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
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-orange-400 font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition"
          >
            <Download size={18} />
            <span>EXPORT CSV</span>
          </button>
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition"
          >
            <Plus size={18} />
            <span>ABSENSI MANUAL</span>
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-3">
        {([
          { key: 'ALL', label: 'Semua Driver', count: driverStatusRows.length, color: 'border-slate-600 text-slate-300', activeColor: 'bg-slate-700 border-slate-500 text-white', icon: null },
          { key: 'HADIR', label: 'Sudah Absen', count: counts.hadir, color: 'border-orange-900/50 text-orange-400', activeColor: 'bg-orange-500/20 border-orange-500 text-orange-300', icon: <CheckCircle2 size={14} /> },
          { key: 'BELUM_ABSEN', label: 'Belum Absen', count: counts.belumAbsen, color: 'border-rose-900/50 text-rose-400', activeColor: 'bg-rose-500/20 border-rose-500 text-rose-300', icon: <XCircle size={14} /> },
          { key: 'IZIN', label: 'Izin Disetujui', count: counts.izin, color: 'border-amber-900/50 text-amber-400', activeColor: 'bg-amber-500/20 border-amber-500 text-amber-300', icon: <FileText size={14} /> },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key as StatusFilter)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-bold transition ${
              filterStatus === tab.key ? tab.activeColor : `${tab.color} hover:bg-slate-800`
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className="px-1.5 py-0.5 rounded-full bg-slate-950/60 text-[10px] font-black">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
        {/* Date Filter */}
        <DatePicker
          label="Filter Tanggal:"
          value={filterDate}
          onChange={setFilterDate}
          todayDefault
        />

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
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari driver..."
              className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
            />
          </div>
        </div>

        <button
          onClick={fetchAll}
          className="self-end p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
          title="Refresh Data"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Driver Status Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Nama Driver</th>
                <th className="px-6 py-4">Tanggal &amp; Waktu (WITA)</th>
                <th className="px-6 py-4">Supervisor</th>
                <th className="px-6 py-4">Sumber / Keterangan</th>
                <th className="px-6 py-4">Lokasi GPS</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Memuat data absensi...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada data untuk filter ini.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const a = row.attendance;
                  const l = row.leave;
                  return (
                    <tr key={row.driver.id} className="hover:bg-slate-800/40 transition">
                      {/* Status Badge */}
                      <td className="px-6 py-4">
                        {row.driverStatus === 'HADIR' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/15 text-orange-400 text-xs font-bold">
                            <CheckCircle2 size={13} /> Hadir
                          </span>
                        )}
                        {row.driverStatus === 'BELUM_ABSEN' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/15 text-rose-400 text-xs font-bold">
                            <XCircle size={13} /> Belum Absen
                          </span>
                        )}
                        {row.driverStatus === 'IZIN' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-400 text-xs font-bold">
                            <FileText size={13} /> {l?.leave_type || 'Izin'}
                          </span>
                        )}
                      </td>
                      {/* Driver Name */}
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white">{row.driver.name}</p>
                        <p className="text-xs text-slate-400">{row.driver.employee_code}</p>
                      </td>
                      {/* Attendance Date & Time */}
                      <td className="px-6 py-4">
                        {a ? (
                          <>
                            <p className="font-bold text-white">{formatIndonesianDate(a.attendance_date)}</p>
                            <p className="text-xs text-orange-400 font-mono font-semibold">
                              Pukul {a.attendance_time.substring(0, 5)} WITA
                            </p>
                          </>
                        ) : (
                          <span className="text-slate-500 text-xs">—</span>
                        )}
                      </td>
                      {/* Supervisor */}
                      <td className="px-6 py-4 text-slate-300 font-medium">
                        {a?.supervisor_name && a.supervisor_name !== '-'
                          ? a.supervisor_name
                          : row.driver.supervisor_id
                          ? supervisorMap.get(row.driver.supervisor_id) || '—'
                          : '—'}
                      </td>
                      {/* Source / Info */}
                      <td className="px-6 py-4">
                        {a ? (
                          <StatusBadge type="attendance_source" value={a.source} />
                        ) : l ? (
                          <span className="text-xs text-slate-400 italic">{l.leave_type}</span>
                        ) : (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </td>
                      {/* GPS */}
                      <td className="px-6 py-4 text-xs">
                        {a?.latitude && a?.longitude ? (
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
                      {/* Actions */}
                      <td className="px-6 py-4 text-right space-x-2">
                        {a ? (
                          <>
                            <button
                              onClick={() => openEditModal(a)}
                              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                              title="Edit Absensi"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteItem(a)}
                              className="p-2 bg-rose-950/60 hover:bg-rose-900 text-rose-400 hover:text-rose-200 rounded-lg transition"
                              title="Hapus Absensi"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setFormData({
                                driver_id: row.driver.id,
                                attendance_date: filterDate || todayStr,
                                attendance_time: '08:00:00',
                                status: 'HADIR',
                                notes: 'Input Manual oleh Admin',
                              });
                              setIsAddOpen(true);
                            }}
                            className="p-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg transition text-xs font-bold"
                            title="Input Absensi Manual"
                          >
                            <Plus size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {/* Table Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>
            Menampilkan <strong className="text-white">{filteredRows.length}</strong> dari{' '}
            <strong className="text-white">{driverStatusRows.length}</strong> driver
          </span>
          <span>
            Tanggal:{' '}
            <strong className="text-orange-400">{filterDate ? formatIndonesianDate(filterDate) : 'Semua'}</strong>
          </span>
        </div>
      </div>

      {/* Add / Edit Modal */}
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

              <DatePicker
                label="Tanggal Absen"
                value={formData.attendance_date}
                onChange={(val) => setFormData({ ...formData, attendance_date: val })}
                todayDefault
                className="w-full"
              />

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
                  onClick={() => { setIsAddOpen(false); setEditItem(null); }}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-sm rounded-xl shadow-md disabled:opacity-50"
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
