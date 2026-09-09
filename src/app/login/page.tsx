'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Lock, Eye, EyeOff, LogIn, Truck, ShieldCheck, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone.trim()) {
      toast.error('Silakan masukkan nomor HP');
      return;
    }
    if (!pin.trim()) {
      toast.error('Silakan masukkan PIN');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || 'Login gagal. Periksa Nomor HP & PIN.');
        setLoading(false);
        return;
      }

      toast.success(`Selamat datang, ${data.user.name}!`);

      if (data.user.role === 'ADMIN') {
        router.push('/admin');
      } else if (data.user.role === 'SUPERVISOR') {
        router.push('/supervisor');
      } else {
        router.push('/');
      }
      router.refresh();
    } catch {
      toast.error('Terjadi kesalahan jaringan. Coba lagi.');
      setLoading(false);
    }
  };

  // Quick Login Presets for easy testing
  const quickLogin = (presetPhone: string, presetPin: string) => {
    setPhone(presetPhone);
    setPin(presetPin);
  };

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <img
            src="/logo.svg"
            alt="Absen Cabo Logo"
            className="w-20 h-20 mx-auto mb-3 object-contain bg-slate-800/80 p-2 rounded-3xl shadow-xl shadow-emerald-500/10 border border-slate-700/60"
          />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Absen Cabo
          </h1>
          <p className="text-sm text-slate-400 mt-1">Aplikasi Absensi Driver Transport</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Phone Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Nomor HP
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Phone size={20} />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 08133333333"
                className="w-full pl-11 pr-4 py-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base tracking-wide transition"
                required
              />
            </div>
          </div>

          {/* PIN Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              PIN (4 - 6 Digit)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock size={20} />
              </div>
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••••"
                maxLength={6}
                className="w-full pl-11 pr-12 py-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg tracking-widest transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-200 transition"
              >
                {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 text-base transition transform active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Memproses...
              </span>
            ) : (
              <>
                <LogIn size={20} />
                <span>MASUK</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Login Preset Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <p className="text-xs font-semibold text-slate-400 text-center mb-3">
            Akun Demo Cepat (Klik untuk memilih):
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => quickLogin('08133333333', '123456')}
              className="py-2.5 px-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-center transition group"
            >
              <Truck size={18} className="mx-auto text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="block text-[11px] font-bold text-slate-200">Driver</span>
              <span className="block text-[9px] text-slate-400">Pak Budi</span>
            </button>

            <button
              type="button"
              onClick={() => quickLogin('08122222222', '123456')}
              className="py-2.5 px-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-center transition group"
            >
              <UserCheck size={18} className="mx-auto text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="block text-[11px] font-bold text-slate-200">Supervisor</span>
              <span className="block text-[9px] text-slate-400">Pak Ahmad</span>
            </button>

            <button
              type="button"
              onClick={() => quickLogin('08111111111', '123456')}
              className="py-2.5 px-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-center transition group"
            >
              <ShieldCheck size={18} className="mx-auto text-purple-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="block text-[11px] font-bold text-slate-200">Admin</span>
              <span className="block text-[9px] text-slate-400">Utama</span>
            </button>
          </div>
          <p className="text-[10px] text-slate-500 text-center mt-2">PIN Default: 123456</p>
        </div>
      </div>
    </main>
  );
}
