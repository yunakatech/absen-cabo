'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, History, FileText, Home } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  userName?: string;
}

export default function DriverHeader({ userName = 'Pak Driver' }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Berhasil keluar');
      router.push('/login');
      router.refresh();
    } catch {
      toast.error('Gagal keluar');
    }
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Absen Cabo Logo" className="w-8 h-8 rounded-lg object-contain bg-slate-800 p-0.5 shadow-md border border-slate-700/50" />
          <div>
            <span className="font-bold text-sm text-white block leading-tight">Absen Cabo</span>
            <span className="text-[10px] text-orange-400 font-medium">{userName}</span>
          </div>
        </Link>

        {/* Quick Nav Links */}
        <div className="flex items-center gap-1">
          {pathname !== '/' && (
            <Link
              href="/"
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Beranda Absen"
            >
              <Home size={18} />
            </Link>
          )}
          {pathname !== '/riwayat' && (
            <Link
              href="/riwayat"
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Riwayat Absen"
            >
              <History size={18} />
            </Link>
          )}

          <button
            onClick={handleLogout}
            title="Keluar"
            className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition ml-1"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
