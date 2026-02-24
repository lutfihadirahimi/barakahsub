'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
      else alert("Akaun berjaya dicipta! Sila login.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
      else router.push('/'); // Redirect ke dashboard
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-10 border border-slate-100">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-6">
            <span className="text-white text-3xl font-black">B</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter">BarakahSub</h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">Sistem Audit Kewangan Digital</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input 
                required type="email" placeholder="nama@emel.com"
                className="w-full pl-12 p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Kataluan</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input 
                required type="password" placeholder="••••••••"
                className="w-full pl-12 p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-lg shadow-xl hover:bg-emerald-600 transition-all flex justify-center items-center active:scale-95">
            {loading ? <Loader2 className="animate-spin" /> : isSignUp ? 'Daftar Akaun' : 'Masuk Dashboard'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm font-bold text-emerald-600 hover:underline">
            {isSignUp ? 'Dah ada akaun? Login sini' : 'Belum ada akaun? Daftar sekarang'}
          </button>
        </div>
      </div>
    </div>
  );
}