'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Lock, Eye, EyeOff, LogIn, Truck, ShieldCheck, UserCheck, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedPhone = localStorage.getItem('remembered_phone');
    if (savedPhone) {
      setPhone(savedPhone);
    }
  }, []);

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
        body: JSON.stringify({ phone, pin, remember: rememberMe }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || 'Login gagal. Periksa Nomor HP & PIN.');
        setLoading(false);
        return;
      }

      if (rememberMe) {
        localStorage.setItem('remembered_phone', phone.trim());
      } else {
        localStorage.removeItem('remembered_phone');
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
      <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <img
            src="/logo.svg"
            alt="Absen Cabo Logo"
            className="w-20 h-20 mx-auto mb-3 object-contain bg-slate-800/80 p-2 rounded-3xl shadow-xl shadow-orange-500/10 border border-slate-700/60"
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
              Nomor HP (WhatsApp)
            </label>
            <div className="relative flex items-center">
              {/* Static Country Code Label */}
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 gap-1.5">
                <Phone size={18} className="text-orange-400 shrink-0" />
                <span className="font-extrabold text-slate-200 text-sm border-r border-slate-700 pr-2.5">
                  +62
                </span>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '');
                  if (val.startsWith('0')) {
                    val = val.substring(1);
                  } else if (val.startsWith('62')) {
                    val = val.substring(2);
                  }
                  setPhone(val);
                }}
                placeholder="8133333333"
                className="w-full pl-[92px] pr-4 py-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base font-semibold tracking-wide transition"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 pl-1">
              Masukkan nomor tanpa angka 0 di awal (contoh: 8133333333)
            </p>
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
                className="w-full pl-11 pr-12 py-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg tracking-widest transition"
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

          {/* Remember Me Radio Button UI */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Ingat Saya di Perangkat Ini
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <label
                onClick={() => setRememberMe(true)}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl border text-xs font-bold cursor-pointer transition-all ${
                  rememberMe
                    ? 'border-orange-500 bg-orange-500/15 text-orange-300 shadow-md shadow-orange-500/10'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="rememberMe"
                    checked={rememberMe}
                    onChange={() => setRememberMe(true)}
                    className="accent-orange-500 w-4 h-4 cursor-pointer"
                  />
                  <span>YA (AKTIF)</span>
                </div>
                {rememberMe && <CheckCircle2 size={16} className="text-orange-400 shrink-0" />}
              </label>

              <label
                onClick={() => setRememberMe(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl border text-xs font-bold cursor-pointer transition-all ${
                  !rememberMe
                    ? 'border-slate-600 bg-slate-800 text-slate-200 shadow-md'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="rememberMe"
                    checked={!rememberMe}
                    onChange={() => setRememberMe(false)}
                    className="accent-slate-400 w-4 h-4 cursor-pointer"
                  />
                  <span>TIDAK</span>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-4 bg-gradient-to-r from-orange-500 to-orange-500 hover:from-orange-400 hover:to-orange-400 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 text-base transition transform active:scale-[0.98] disabled:opacity-50"
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
              onClick={() => quickLogin('8133333333', '123456')}
              className="py-2.5 px-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-center transition group"
            >
              <Truck size={18} className="mx-auto text-orange-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="block text-[11px] font-bold text-slate-200">Driver</span>
              <span className="block text-[9px] text-slate-400">8133333333</span>
            </button>

            <button
              type="button"
              onClick={() => quickLogin('8122222222', '123456')}
              className="py-2.5 px-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-center transition group"
            >
              <UserCheck size={18} className="mx-auto text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="block text-[11px] font-bold text-slate-200">Supervisor</span>
              <span className="block text-[9px] text-slate-400">8122222222</span>
            </button>

            <button
              type="button"
              onClick={() => quickLogin('8111111111', '123456')}
              className="py-2.5 px-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-center transition group"
            >
              <ShieldCheck size={18} className="mx-auto text-purple-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="block text-[11px] font-bold text-slate-200">Admin</span>
              <span className="block text-[9px] text-slate-400">8111111111</span>
            </button>
          </div>
          <p className="text-[10px] text-slate-500 text-center mt-2">PIN Default: 123456</p>
        </div>
      </div>
    </main>
  );
}
