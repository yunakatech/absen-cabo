'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ShieldAlert, RefreshCw, Search } from 'lucide-react';
import { formatIndonesianDate } from '@/lib/time';

interface AuditLogItem {
  id: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  user_role: string;
  action: string;
  target: string;
  details: string;
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/audit-log');
      const data = await res.json();
      if (data.success) setLogs(data.logs);
    } catch (err) {
      console.error('Error fetching audit log:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter(
    (l) =>
      l.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.target?.toLowerCase().includes(search.toLowerCase()) ||
      l.details?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="text-rose-400" size={24} />
            <span>Audit Log &amp; Riwayat Perubahan</span>
          </h1>
          <p className="text-xs text-slate-400">Pencatatan transparan seluruh aktivitas &amp; manipulasi data dalam sistem</p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw size={14} />
          <span>Refresh Log</span>
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
          placeholder="Cari User, Action, atau Detail..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
        />
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Pelaku (Actor)</th>
                <th className="px-6 py-4">Tindakan (Action)</th>
                <th className="px-6 py-4">Target</th>
                <th className="px-6 py-4">Rincian / Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Memuat audit log...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-sans">
                    Belum ada entri audit log.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                      {log.timestamp ? log.timestamp.substring(0, 19).replace('T', ' ') : '-'}
                    </td>
                    <td className="px-6 py-4 font-sans font-semibold text-white">
                      {log.user_name}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({log.user_role})
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 border border-slate-700 text-emerald-400">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-sans text-slate-300">{log.target}</td>
                    <td className="px-6 py-4 font-sans text-slate-400 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
