'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, UserX, Search, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from '@/components/StatusBadge';
import ConfirmModal from '@/components/ConfirmModal';

interface UserItem {
  id: string;
  employee_code: string;
  name: string;
  phone: string;
  role: string;
  status: string;
}

export default function AdminSupervisorPage() {
  const [supervisors, setSupervisors] = useState<UserItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

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
    status: 'ACTIVE',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchSupervisors = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users?role=SUPERVISOR');
      const data = await res.json();
      if (data.success) setSupervisors(data.users);
    } catch (err) {
      console.error('Error fetching supervisors:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSupervisors();
  }, [fetchSupervisors]);

  const openAddModal = () => {
    setFormData({
      employee_code: `SV${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      phone: '',
      pin: '123456',
      status: 'ACTIVE',
    });
    setIsAddOpen(true);
  };

  const openEditModal = (spv: UserItem) => {
    setEditItem(spv);
    setFormData({
      employee_code: spv.employee_code || '',
      name: spv.name || '',
      phone: spv.phone || '',
      pin: '',
      status: spv.status || 'ACTIVE',
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
          role: 'SUPERVISOR',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Gagal membuat supervisor');
        setSubmitting(false);
        return;
      }

      toast.success('Supervisor berhasil ditambahkan');
      setIsAddOpen(false);
      fetchSupervisors();
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
        toast.error(data.message || 'Gagal mengedit supervisor');
        setSubmitting(false);
        return;
      }

      toast.success('Supervisor berhasil diperbarui');
      setEditItem(null);
      fetchSupervisors();
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
        toast.error(data.message || 'Gagal menonaktifkan supervisor');
        setSubmitting(false);
        return;
      }

      toast.success('Supervisor berhasil dinonaktifkan.');
      setDeleteItem(null);
      fetchSupervisors();
    } catch {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = supervisors.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.employee_code.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Manajemen Supervisor</h1>
          <p className="text-xs text-slate-400">Kelola akun atasan yang berwenang menyetujui izin</p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition"
        >
          <Plus size={18} />
          <span>+ TAMBAH SUPERVISOR</span>
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
          placeholder="Cari Nama, Kode, atau No HP..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Supervisors Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Kode</th>
                <th className="px-6 py-4">Nama Supervisor</th>
                <th className="px-6 py-4">Nomor HP</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Memuat data supervisor...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Tidak ditemukan data supervisor.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-mono font-bold text-blue-400">
                      {s.employee_code}
                    </td>
                    <td className="px-6 py-4 font-semibold text-white">{s.name}</td>
                    <td className="px-6 py-4">{s.phone}</td>
                    <td className="px-6 py-4">
                      <StatusBadge type="status" value={s.status} />
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(s)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                        title="Edit Supervisor"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteItem(s)}
                        className="p-2 bg-rose-950/60 hover:bg-rose-900 text-rose-400 hover:text-rose-200 rounded-lg transition"
                        title="Nonaktifkan Supervisor"
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
      </div>

      {/* Add / Edit Modal */}
      {(isAddOpen || editItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <h2 className="text-xl font-bold text-white">
              {isAddOpen ? 'Tambah Supervisor Baru' : `Edit Supervisor: ${editItem?.name}`}
            </h2>

            <form onSubmit={isAddOpen ? handleCreate : handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Kode Supervisor
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
                  placeholder="Pak Ahmad"
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
                  placeholder="08122222222"
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
                  className="px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-sm rounded-xl shadow-md disabled:opacity-50"
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
        title="Nonaktifkan Supervisor?"
        description={`Supervisor "${deleteItem?.name}" akan dinonaktifkan.`}
        confirmText="YA, NONAKTIFKAN"
        onConfirm={handleDisable}
        onCancel={() => setDeleteItem(null)}
        isLoading={submitting}
      />
    </div>
  );
}
