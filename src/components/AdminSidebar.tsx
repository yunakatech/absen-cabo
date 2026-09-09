'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CalendarCheck2,
  FileText,
  Settings,
  ShieldAlert,
  LogOut,
  Truck,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface Props {
  userName?: string;
}

export default function AdminSidebar({ userName = 'Admin' }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/driver', label: 'Driver', icon: Truck },
    { href: '/admin/supervisor', label: 'Supervisor', icon: UserCheck },
    { href: '/admin/absensi', label: 'Absensi', icon: CalendarCheck2 },
    { href: '/admin/izin', label: 'Pengajuan Izin', icon: FileText },
    { href: '/admin/pengaturan', label: 'Pengaturan', icon: Settings },
    { href: '/admin/audit-log', label: 'Audit Log', icon: ShieldAlert },
  ];

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
      {/* Mobile Menu Toggle Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Absen Cabo Logo" className="w-8 h-8 rounded-lg object-contain bg-slate-800 p-0.5" />
          <span className="font-bold text-base tracking-wide">Absen Cabo</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-300 hover:text-white rounded-lg focus:outline-none"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/60 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <img src="/logo.svg" alt="Absen Cabo Logo" className="w-10 h-10 rounded-xl object-contain bg-slate-800/80 p-1 shadow-lg shadow-emerald-900/20 border border-slate-700/50" />
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-wide text-white">Absen Cabo</h1>
              <p className="text-xs text-slate-400">Admin Control Panel</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1.5 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                  }`}
                >
                  <Icon size={19} className={isActive ? 'text-emerald-400' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer / User profile */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between px-3 py-2 bg-slate-800/60 rounded-xl">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0">
                {userName.charAt(0)}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200 truncate">{userName}</p>
                <p className="text-[10px] text-emerald-400 font-medium">Administrator</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-400 rounded-lg transition hover:bg-slate-700/50"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
