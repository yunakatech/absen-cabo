'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Check, X, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from '@/components/StatusBadge';
import { formatIndonesianDate } from '@/lib/time';

interface LeaveRequestItem {
  id: string;
  driver_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  approved_by?: string;
  rejected_by?: string;
  rejection_reason?: string;
  created_at: string;
}

export default function SupervisorLeavePage() {
  const [requests, setRequests] = useState<LeaveRequestItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'ALL' ? '/api/leave' : `/api/leave?status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setRequests(data.requests);
      }
    } catch (err) {
      console.error('Error fetching leave requests:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
    setActionId(id);
    try {
      const res = await fetch(`/api/leave/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || 'Gagal memproses pengajuan');
        return;
      }

      toast.success(action === 'APPROVE' ? 'Izin berhasil disetujui' : 'Izin ditolak');
      fetchRequests();
    } catch {
      toast.error('Terjadi kesalahan jaringan.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Daftar Pengajuan Izin</h1>
          <p className="text-xs text-slate-400">Kelola persetujuan izin driver bawahan Anda</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-2xl">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st === 'ALL' ? 'SEMUA' : st}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center text-slate-400">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 text-center text-slate-400">
          Belum ada data pengajuan izin untuk filter ini.
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-white text-base">{req.driver_name}</span>
                  <StatusBadge type="leave" value={req.status} />
                </div>
                <p className="text-xs text-slate-300">
                  Jenis: <strong className="text-amber-300">{req.leave_type.replace('_', ' ')}</strong> • Tanggal: <strong>{formatIndonesianDate(req.start_date)}</strong>
                </p>
                {req.reason && <p className="text-xs text-slate-400 italic">Alasan: &ldquo;{req.reason}&rdquo;</p>}
                {req.approved_by && (
                  <p className="text-[11px] text-emerald-400 font-medium">
                    Disetujui oleh: {req.approved_by}
                  </p>
                )}
                {req.rejected_by && (
                  <p className="text-[11px] text-rose-400 font-medium">
                    Ditolak oleh: {req.rejected_by}
                  </p>
                )}
              </div>

              {/* Action buttons if pending */}
              {req.status === 'PENDING' && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleAction(req.id, 'APPROVE')}
                    disabled={actionId === req.id}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 disabled:opacity-50"
                  >
                    <Check size={16} />
                    <span>SETUJUI</span>
                  </button>
                  <button
                    onClick={() => handleAction(req.id, 'REJECT')}
                    disabled={actionId === req.id}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 disabled:opacity-50"
                  >
                    <X size={16} />
                    <span>TOLAK</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
