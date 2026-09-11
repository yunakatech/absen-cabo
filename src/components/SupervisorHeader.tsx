'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FileCheck2, LogOut, KeyRound, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import ChangePinModal from './ChangePinModal';

interface Props {
  userName?: string;
}

export default function SupervisorHeader({ userName = 'Supervisor' }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Berhasil logout');
      router.push('/login');
      router.refresh();
    } catch {
      toast.error('Gagal logout');
    }
  };

  return (
    <>
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Absen Cabo Logo" className="w-9 h-9 rounded-xl object-contain bg-slate-800 p-1 shadow-md border border-slate-700/50" />
            <div>
              <span className="font-bold text-base tracking-wide text-white block leading-tight">
                Absen Cabo
              </span>
              <span className="text-xs text-blue-400 font-medium">Supervisor Panel</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/supervisor"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition ${
                pathname === '/supervisor'
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/supervisor/absensi"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition ${
                pathname === '/supervisor/absensi'
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Users size={16} />
              <span>Data Absensi</span>
            </Link>

            <Link
              href="/supervisor/izin"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition ${
                pathname === '/supervisor/izin'
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <FileCheck2 size={16} />
              <span>Approval Izin</span>
            </Link>
          </nav>

          {/* User Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden md:inline-block text-xs font-semibold text-slate-300">
              {userName}
            </span>
            <button
              onClick={() => setIsChangePinOpen(true)}
              title="Ubah PIN Keamanan"
              className="p-2 text-slate-300 hover:text-orange-400 rounded-lg transition hover:bg-slate-800"
            >
              <KeyRound size={18} />
            </button>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-400 rounded-lg transition hover:bg-slate-800"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <ChangePinModal
        isOpen={isChangePinOpen}
        onClose={() => setIsChangePinOpen(false)}
      />
    </>
  );
}
