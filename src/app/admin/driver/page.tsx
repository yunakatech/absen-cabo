'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, UserX, Trash2, Search, Truck, Phone, Lock, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from '@/components/StatusBadge';
import ConfirmModal from '@/components/ConfirmModal';
import Pagination from '@/components/Pagination';

interface UserItem {
  id: string;
  employee_code: string;
  name: string;
  phone: string;
  role: string;
  supervisor_id?: string;
  status: string;
}

export default function AdminDriverPage() {
  const [drivers, setDrivers] = useState<UserItem[]>([]);
  const [supervisors, setSupervisors] = useState<UserItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<UserItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<UserItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    employee_code: '',
    name: '',
    phone: '',
    pin: '',
    supervisor_id: '',
    status: 'ACTIVE',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const [resDr, resSpv] = await Promise.all([
        fetch('/api/users?role=DRIVER').then((r) => r.json()),
        fetch('/api/users?role=SUPERVISOR').then((r) => r.json()),
      ]);

      if (resDr.success) setDrivers(resDr.users);
      if (resSpv.success) setSupervisors(resSpv.users);
    } catch (err) {
      console.error('Error fetching drivers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openAddModal = () => {
    setFormData({
      employee_code: `DR${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      phone: '',
      pin: '123456',
      supervisor_id: supervisors[0]?.id || '',
      status: 'ACTIVE',
    });
    setIsAddOpen(true);
  };

  const openEditModal = (driver: UserItem) => {
    setEditItem(driver);
    setFormData({
      employee_code: driver.employee_code || '',
      name: driver.name || '',
      phone: driver.phone || '',
      pin: '', // blank unless changing
      supervisor_id: driver.supervisor_id || '',
      status: driver.status || 'ACTIVE',
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role: 'DRIVER',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Gagal membuat driver');
        setSubmitting(false);
        return;
      }

      toast.success('Driver berhasil ditambahkan');
      setIsAddOpen(false);
      fetchUsers();
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
      const res = await fetch(`/api/users/${editItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Gagal mengedit driver');
        setSubmitting(false);
        return;
      }

      toast.success('Driver berhasil diperbarui');
      setEditItem(null);
      fetchUsers();
    } catch {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisable = async () => {
    if (!deleteItem) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/users/${deleteItem.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Gagal menonaktifkan driver');
        setSubmitting(false);
        return;
      }

      toast.success('Driver dinonaktifkan. Riwayat absensi tetap disimpan.');
      setDeleteItem(null);
      fetchUsers();
    } catch {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDrivers = drivers.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.employee_code.toLowerCase().includes(search.toLowerCase()) ||
      d.phone.includes(search)
  );

  const totalPages = Math.ceil(filteredDrivers.length / pageSize);
  const paginatedDrivers = filteredDrivers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getSupervisorName = (spvId?: string) => {
    if (!spvId) return '-';
    const s = supervisors.find((spv) => spv.id === spvId);
    return s ? s.name : '-';
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Manajemen Driver</h1>
          <p className="text-xs text-slate-400">Kelola akun dan penugasan supervisor driver</p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition"
        >
          <Plus size={18} />
          <span>TAMBAH DRIVER</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari berdasarkan Nama, Kode, atau No HP..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Drivers Data Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Kode</th>
                <th className="px-6 py-4">Nama Driver</th>
                <th className="px-6 py-4">Nomor HP</th>
                <th className="px-6 py-4">Atasan (Supervisor)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Memuat data driver...
                  </td>
                </tr>
              ) : filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Tidak ditemukan data driver.
                  </td>
                </tr>
              ) : (
                paginatedDrivers.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-mono font-bold text-orange-400">
                      {d.employee_code}
                    </td>
                    <td className="px-6 py-4 font-semibold text-white">{d.name}</td>
                    <td className="px-6 py-4">{d.phone}</td>
                    <td className="px-6 py-4 font-medium text-slate-300">
                      {getSupervisorName(d.supervisor_id)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge type="status" value={d.status} />
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(d)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                        title="Edit Driver"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteItem(d)}
                        className="p-2 bg-rose-950/60 hover:bg-rose-900 text-rose-400 hover:text-rose-200 rounded-lg transition"
                        title="Nonaktifkan Driver"
                      >
                        <UserX size={16} />
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
          totalItems={filteredDrivers.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Add / Edit Driver Modal */}
      {(isAddOpen || editItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <h2 className="text-xl font-bold text-white">
              {isAddOpen ? 'Tambah Driver Baru' : `Edit Driver: ${editItem?.name}`}
            </h2>

            <form onSubmit={isAddOpen ? handleCreate : handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Kode Driver
                </label>
                <input
                  type="text"
                  value={formData.employee_code}
                  onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Pak Budi"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nomor HP
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="08133333333"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {isAddOpen ? 'PIN Awal (4 - 6 Digit)' : 'Ganti PIN (Kosongkan jika tidak diubah)'}
                </label>
                <input
                  type="password"
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  placeholder="••••••"
                  maxLength={6}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm tracking-widest"
                  required={isAddOpen}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Atasan / Supervisor
                </label>
                <select
                  value={formData.supervisor_id}
                  onChange={(e) => setFormData({ ...formData, supervisor_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                >
                  <option value="">-- Pilih Supervisor --</option>
                  {supervisors.map((spv) => (
                    <option key={spv.id} value={spv.id}>
                      {spv.name} ({spv.employee_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Status Akun
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                >
                  <option value="ACTIVE">AKTIF</option>
                  <option value="INACTIVE">NONAKTIF</option>
                </select>
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
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-sm rounded-xl shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Memproses...' : 'SIMPAN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Disable Modal */}
      <ConfirmModal
        isOpen={!!deleteItem}
        title="Nonaktifkan Driver?"
        description={`Driver "${deleteItem?.name}" akan dinonaktifkan. Riwayat absensi dan izin sebelumnya tetap aman disimpan di Google Spreadsheet.`}
        confirmText="YA, NONAKTIFKAN"
        onConfirm={handleDisable}
        onCancel={() => setDeleteItem(null)}
        isLoading={submitting}
      />
    </div>
  );
}
