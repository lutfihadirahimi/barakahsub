'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, HeartHandshake, AlertCircle, Loader2, Plus, X, Trash2, 
  ShieldCheck, CheckCircle2, LogOut, User, LayoutDashboard, Search, Zap, 
  Lightbulb, Target, Droplets, BookOpen, GraduationCap, Calendar, Bell
} from 'lucide-react';

export default function Home() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedWaqf, setSelectedWaqf] = useState('Air');
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    service_name: '', price: '', category: 'Entertainment', shariah_status: 'Perlu Semakan', alternative: '', renewal_date: ''
  });

  const waqfProjects: {[key: string]: {name: string, target: number, icon: any}} = {
    'Air': { name: 'Wakaf Penapis Air Masjid', target: 1000, icon: Droplets },
    'Quran': { name: 'Dana Cetakan Al-Quran', target: 500, icon: BookOpen },
    'Pendidikan': { name: 'Biasiswa Digital Asnaf', target: 2500, icon: GraduationCap }
  };

  const auditDatabase: {[key: string]: {status: string, suggestion: string}} = {
    'Netflix': { status: 'Perlu Semakan', suggestion: 'Gantikan dengan YouTube Premium' },
    'Disney+': { status: 'Boikot', suggestion: 'Gantikan dengan Nurflix atau Durioo+' },
    'ChatGPT Plus': { status: 'Patuh', suggestion: '' },
    'Spotify': { status: 'Perlu Semakan', suggestion: 'Gantikan dengan YouTube Music' },
    'Canva': { status: 'Patuh', suggestion: '' }
  };

  useEffect(() => {
    async function getSession() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push('/login');
      else { setUser(user); fetchSubscriptions(user.id); }
    }
    getSession();
  }, [router]);

  async function fetchSubscriptions(userId: string) {
    setLoading(true);
    const { data, error } = await supabase.from('subscriptions').select('*').eq('user_id', userId).order('renewal_date', { ascending: true });
    if (!error) setSubscriptions(data || []);
    setLoading(false);
  }

  const handleNameChange = (name: string) => {
    const lowerName = name.toLowerCase();
    if (name.length > 0) {
      setSuggestions(Object.keys(auditDatabase).filter(key => key.toLowerCase().includes(lowerName)));
    } else { setSuggestions([]); }
    let status = 'Perlu Semakan';
    let alt = '';
    Object.keys(auditDatabase).forEach(key => {
      if (lowerName.includes(key.toLowerCase())) {
        status = auditDatabase[key].status;
        alt = auditDatabase[key].suggestion;
      }
    });
    setFormData({ ...formData, service_name: name, shariah_status: status, alternative: alt });
  };

  const selectSuggestion = (name: string) => {
    setFormData({ ...formData, service_name: name, shariah_status: auditDatabase[name].status, alternative: auditDatabase[name].suggestion });
    setSuggestions([]);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from('subscriptions').insert([{ 
      service_name: formData.service_name, price: parseFloat(formData.price),
      shariah_status: formData.shariah_status, user_id: user.id, renewal_date: formData.renewal_date 
    }]);
    if (!error) {
      setIsModalOpen(false);
      setFormData({ service_name: '', price: '', category: 'Entertainment', shariah_status: 'Perlu Semakan', alternative: '', renewal_date: '' });
      fetchSubscriptions(user.id);
    }
    setLoading(false);
  }

  async function deleteSubscription(id: string) {
    if (confirm("Padam rekod ini?")) {
      await supabase.from('subscriptions').delete().eq('id', id);
      fetchSubscriptions(user.id);
    }
  }

  const totalBil = subscriptions.reduce((acc, sub) => acc + Number(sub.price), 0);
  const totalWakaf = totalBil * 0.05;
  const currentProject = waqfProjects[selectedWaqf];
  const progressPercent = Math.min((totalWakaf / currentProject.target) * 100, 100);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      
      {/* 1. TOPBAR - STABLE */}
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-50 px-6 lg:px-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center text-white shadow-sm font-black italic">B</div>
          <span className="font-bold text-lg tracking-tight">BarakahSub</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1 tracking-wider italic">Verified Session</p>
            <p className="text-xs font-bold text-slate-700">{user.email}</p>
          </div>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. MAIN LAYOUT */}
      <main className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SIDEBAR: STATS */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
             <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Total Commitment</p>
             <h2 className="text-4xl font-black tracking-tighter">RM {totalBil.toFixed(2)}</h2>
             <div className="mt-4">
                <span className="bg-emerald-500 text-slate-950 px-2 py-0.5 rounded text-[9px] font-black uppercase">Booster Active</span>
             </div>
          </div>

          <div className="bg-white p-7 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
             <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-blue-600">
                   <HeartHandshake className="w-5 h-5" />
                   <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-widest">Tabung Barakah</h4>
                </div>
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">RM {totalWakaf.toFixed(2)}</span>
             </div>
             
             {/* PROJECT SELECTOR GRID */}
             <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                {Object.keys(waqfProjects).map(id => (
                  <button key={id} onClick={() => setSelectedWaqf(id)} className={`py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${selectedWaqf === id ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'}`}>
                    {id}
                  </button>
                ))}
             </div>

             <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold">
                   <span className="text-slate-600 italic">"{currentProject.name}"</span>
                   <span className="text-blue-600">{progressPercent.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                   <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} className="bg-blue-600 h-full rounded-full" />
                </div>
             </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Compliance Status</h4>
             <div className="space-y-2">
                {[
                  { label: 'Patuh', count: subscriptions.filter(s => s.shariah_status === 'Patuh').length, color: 'text-emerald-600' },
                  { label: 'Audit', count: subscriptions.filter(s => s.shariah_status === 'Perlu Semakan').length, color: 'text-amber-500' },
                  { label: 'Boikot', count: subscriptions.filter(s => s.shariah_status === 'Boikot').length, color: 'text-red-500' }
                ].map((stat, i) => (
                  <div key={i} className="flex justify-between items-center px-4 py-2 bg-slate-50/50 rounded-xl"><span className="text-[9px] font-bold text-slate-500 uppercase">{stat.label}</span><span className="text-sm font-black italic">{stat.count}</span></div>
                ))}
             </div>
          </div>
        </aside>

        {/* INVENTORY: RIGHT COLUMN */}
        <section className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl p-8 lg:p-10">
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-100">
               <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 uppercase italic leading-none">
                 <LayoutDashboard className="w-5 h-5 text-emerald-600" /> Inventory Audit
               </h3>
               {/* FIXED BUTTON: BACKGROUND SOLID */}
               <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black flex items-center gap-2 hover:bg-emerald-600 transition-all text-[10px] uppercase tracking-widest shadow-lg">
                 <Plus className="w-4 h-4" /> Audit Baru
               </button>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {subscriptions.map((sub) => {
                  const daysLeft = getDaysRemaining(sub.renewal_date);
                  const isSoon = daysLeft !== null && daysLeft <= 3 && daysLeft >= 0;
                  const hasSuggestion = auditDatabase[sub.service_name]?.suggestion;

                  return (
                    <motion.div layout key={sub.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className={`p-6 border rounded-[1.8rem] transition-all group ${isSoon ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100 hover:border-emerald-200 shadow-sm'}`}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-5 flex-1 min-w-0">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-md text-white shrink-0 ${sub.shariah_status === 'Boikot' ? 'bg-red-500' : 'bg-slate-900 group-hover:bg-emerald-600'}`}>{sub.service_name[0].toUpperCase()}</div>
                          <div className="min-w-0 flex-1">
                             <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <p className="font-bold text-slate-800 text-lg leading-none tracking-tight truncate">{sub.service_name}</p>
                                {isSoon && <span className="bg-red-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase animate-pulse">Soon</span>}
                             </div>
                             <div className="flex items-center gap-3 mt-1.5 text-[8px] font-black uppercase tracking-wider">
                                <span className={sub.shariah_status === 'Patuh' ? 'text-emerald-500' : sub.shariah_status === 'Boikot' ? 'text-red-600' : 'text-amber-600'}>{sub.shariah_status}</span>
                                {sub.renewal_date && <span className="text-slate-400 border-l border-slate-200 pl-3 leading-none italic">{new Date(sub.renewal_date).toLocaleDateString('ms-MY')}</span>}
                             </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-8 shrink-0">
                           <p className="font-black text-slate-900 text-2xl tracking-tighter italic">RM {Number(sub.price).toFixed(2)}</p>
                           <button onClick={() => deleteSubscription(sub.id)} className="p-2 text-slate-200 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      </div>
                      {sub.shariah_status !== 'Patuh' && hasSuggestion && (
                         <div className="mt-5 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-start gap-3">
                            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed">Suggestion: <span className="text-amber-700">{hasSuggestion}</span></p>
                         </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            <div className="mt-12 text-center opacity-30 italic"><p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">Admin Ops @2026</p></div>
          </div>
        </section>
      </main>

      {/* MODAL AUDIT */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-sm bg-white rounded-[2.5rem] p-10 shadow-2xl relative border border-white">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900"><X className="w-6 h-6"/></button>
              <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic mb-8">Audit Baru</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1 relative">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                    <input required type="text" placeholder="Service Name" className="w-full pl-11 p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm text-slate-800" value={formData.service_name} onChange={(e) => handleNameChange(e.target.value)} />
                  </div>
                  {suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden max-h-32 overflow-y-auto">
                      {suggestions.map((name, i) => (
                        <button key={i} type="button" onClick={() => selectSuggestion(name)} className="w-full text-left px-5 py-3 hover:bg-emerald-50 text-slate-700 font-bold text-xs uppercase border-b border-slate-50 last:border-0">{name}</button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <input required type="number" step="0.01" placeholder="RM 0.00" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm text-slate-800" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
                    <input required type="date" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-[10px] text-slate-800" value={formData.renewal_date} onChange={(e) => setFormData({...formData, renewal_date: e.target.value})} />
                </div>
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center justify-between shadow-inner">
                  <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">Audit Result</span>
                  <span className={`text-[9px] font-black px-3 py-1 rounded uppercase ${formData.shariah_status === 'Patuh' ? 'bg-emerald-600 text-white' : formData.shariah_status === 'Boikot' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>{formData.shariah_status}</span>
                </div>
                <button type="submit" disabled={loading} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all active:scale-95 shadow-slate-200">Sahkan & Simpan</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getDaysRemaining(dateString: string) {
  if (!dateString) return null;
  const today = new Date();
  const renewal = new Date(dateString);
  const diffTime = renewal.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}