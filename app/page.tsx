'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, HeartHandshake, AlertCircle, Loader2, Plus, X, Trash2, 
  ShieldCheck, CheckCircle2, Share2, LogOut, User, LayoutDashboard, Search, Zap, Lightbulb
} from 'lucide-react';

export default function Home() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    service_name: '',
    price: '',
    category: 'Entertainment',
    shariah_status: 'Perlu Semakan',
    alternative: ''
  });

  const auditDatabase: {[key: string]: {status: string, suggestion: string}} = {
    'Netflix': { status: 'Perlu Semakan', suggestion: 'Gantikan dengan YouTube Premium (Ilmu)' },
    'Disney+': { status: 'Boikot', suggestion: 'Gantikan dengan Nurflix atau Durioo+' },
    'ChatGPT Plus': { status: 'Patuh', suggestion: '' },
    'Spotify': { status: 'Perlu Semakan', suggestion: 'Gantikan dengan YouTube Music' },
    'Canva': { status: 'Patuh', suggestion: '' },
    'YouTube Premium': { status: 'Patuh', suggestion: '' },
    'iCloud': { status: 'Patuh', suggestion: '' },
    'Adobe Creative Cloud': { status: 'Boikot', suggestion: 'Gantikan dengan Canva atau Affinity' },
    'PlayStation Plus': { status: 'Perlu Semakan', suggestion: 'Pilih langganan peranti lokal' },
    'Xbox Game Pass': { status: 'Perlu Semakan', suggestion: 'Hadkan penggunaan' }
  };

  useEffect(() => {
    async function getSession() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push('/login');
      else { setUser(user); fetchSubscriptions(user.id); }
    }
    getSession();
  }, [router]);

  const handleNameChange = (name: string) => {
    const lowerName = name.toLowerCase();
    if (name.length > 0) {
      const filtered = Object.keys(auditDatabase).filter(key => key.toLowerCase().includes(lowerName));
      setSuggestions(filtered);
    } else { setSuggestions([]); }

    let detectedStatus = 'Perlu Semakan';
    let detectedAlt = '';
    Object.keys(auditDatabase).forEach(key => {
      if (lowerName.includes(key.toLowerCase())) {
        detectedStatus = auditDatabase[key].status;
        detectedAlt = auditDatabase[key].suggestion;
      }
    });
    setFormData({ ...formData, service_name: name, shariah_status: detectedStatus, alternative: detectedAlt });
  };

  const selectSuggestion = (name: string) => {
    setFormData({ ...formData, service_name: name, shariah_status: auditDatabase[name].status, alternative: auditDatabase[name].suggestion });
    setSuggestions([]);
  };

  async function fetchSubscriptions(userId: string) {
    setLoading(true);
    const { data, error } = await supabase.from('subscriptions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (!error) setSubscriptions(data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from('subscriptions').insert([{ 
      service_name: formData.service_name, price: parseFloat(formData.price),
      category: formData.category, shariah_status: formData.shariah_status, user_id: user.id
    }]);
    if (!error) {
      setIsModalOpen(false);
      setFormData({ service_name: '', price: '', category: 'Entertainment', shariah_status: 'Perlu Semakan', alternative: '' });
      fetchSubscriptions(user.id);
    }
    setLoading(false);
  }

  async function deleteSubscription(id: string) {
    if (confirm("Padam langganan ini?")) {
      await supabase.from('subscriptions').delete().eq('id', id);
      fetchSubscriptions(user.id);
    }
  }

  const totalBil = subscriptions.reduce((acc, sub) => acc + Number(sub.price), 0);
  const totalWakaf = totalBil * 0.05;

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]"><Loader2 className="animate-spin text-emerald-600 w-10 h-10" /></div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* 1. TOP NAV - REFINED */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-200 text-white font-black text-sm">B</div>
            <span className="text-md font-bold text-slate-900 tracking-tight">BarakahSub</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-600 transition-all text-[11px] uppercase tracking-wider active:scale-95 shadow-sm"><Plus className="w-3.5 h-3.5" /> Audit</button>
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SIDEBAR */}
        <div className="lg:col-span-4 space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-emerald-400 text-[9px] font-black uppercase tracking-[0.2em] mb-3 opacity-80">Potensi Barakah</p>
              <h3 className="text-4xl font-black mb-2 tracking-tighter italic">RM {totalWakaf.toFixed(2)}</h3>
              <p className="text-slate-400 text-[10px] leading-relaxed mb-8 opacity-70">Wakaf mikro dijana daripada langganan digital anda.</p>
              <button onClick={() => window.open(`https://daun.me/share?text=${encodeURIComponent(`Audit BarakahSub: RM ${totalBil.toFixed(2)} total, RM ${totalWakaf.toFixed(2)} wakaf! #GodamSahur`)}`, '_blank')} className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 hover:bg-emerald-400 transition-all active:scale-95"><Share2 className="w-4 h-4" /> Kongsi Impak</button>
            </div>
            <HeartHandshake className="absolute -bottom-6 -right-6 w-32 h-32 text-white/[0.03] rotate-12" />
          </motion.div>

          <div className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6"><ShieldCheck className="w-4 h-4 text-emerald-500" /><h4 className="font-bold text-slate-800 text-[10px] uppercase tracking-widest">Compliance Audit</h4></div>
            <div className="grid grid-cols-1 gap-2">
              {[{ label: 'Patuh', count: subscriptions.filter(s => s.shariah_status === 'Patuh').length, color: 'text-emerald-600' },
                { label: 'Audit', count: subscriptions.filter(s => s.shariah_status === 'Perlu Semakan').length, color: 'text-amber-500' },
                { label: 'Boikot', count: subscriptions.filter(s => s.shariah_status === 'Boikot').length, color: 'text-red-500' }
              ].map((stat, i) => (
                <div key={i} className="flex justify-between items-center px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-100"><span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{stat.label}</span><span className={`text-md font-black ${stat.color}`}>{stat.count}</span></div>
              ))}
            </div>
          </div>
        </div>

        {/* INVENTORY LIST - CLEANER CARDS */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 p-8 lg:p-10">
            <div className="flex justify-between items-start mb-10">
              <div className="space-y-1"><p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Inventory Komitmen</p><h3 className="text-4xl font-black text-slate-900 tracking-tighter italic">RM {totalBil.toFixed(2)}</h3></div>
              <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-600"><LayoutDashboard className="w-5 h-5" /></div>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {subscriptions.length === 0 ? (
                  <div className="py-20 text-center bg-slate-50/30 border-2 border-dashed border-slate-100 rounded-[2rem]"><p className="text-slate-400 text-xs italic">Tiada rekod audit aktif.</p></div>
                ) : (
                  subscriptions.map((sub) => {
                    const hasSuggestion = auditDatabase[sub.service_name]?.suggestion;
                    return (
                      <motion.div layout initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} key={sub.id} className="p-5 bg-white border border-slate-100 rounded-[1.5rem] hover:border-emerald-200 hover:shadow-xl transition-all group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 bg-slate-900 rounded-xl flex items-center justify-center font-black text-sm text-white group-hover:bg-emerald-600 transition-colors shadow-md">{sub.service_name[0].toUpperCase()}</div>
                            <div>
                              <p className="font-bold text-slate-800 text-md leading-tight">{sub.service_name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-1 ${
                                  sub.shariah_status === 'Patuh' ? 'bg-emerald-100 text-emerald-700' : 
                                  sub.shariah_status === 'Boikot' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {sub.shariah_status === 'Patuh' ? <CheckCircle2 className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
                                  {sub.shariah_status}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-5">
                            <p className="font-black text-slate-700 text-lg tracking-tight">RM {Number(sub.price).toFixed(2)}</p>
                            <button onClick={() => deleteSubscription(sub.id)} className="p-1.5 text-slate-200 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        {/* SUBTLE SUGGESTION */}
                        {(sub.shariah_status !== 'Patuh') && hasSuggestion && (
                           <div className="mt-3 pt-3 border-t border-slate-50 flex items-start gap-2">
                              <Lightbulb className="w-3 h-3 text-amber-400 mt-0.5" />
                              <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight">
                                 💡 <span className="text-amber-700">Suggestion:</span> {hasSuggestion}
                              </p>
                           </div>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>
          <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] mt-12 italic opacity-60">Engineered by Wintel Admin Ops @2026</p>
        </div>
      </main>

      {/* 4. MODAL - FIXED SIZE & UI */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative">
              
              <div className="flex justify-between items-center mb-8">
                <div className="space-y-0.5">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight italic">Audit Baru</h3>
                  <p className="text-slate-400 text-[10px] font-medium uppercase tracking-widest">Digital Compliance Flow</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-900 p-2 bg-slate-50 rounded-full transition-colors"><X className="w-5 h-5"/></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2 relative">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Service Name</label>
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-emerald-500 transition-colors pointer-events-none" />
                    <input required type="text" placeholder="Cth: Netflix, Adobe..." className="w-full pl-11 p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-md text-slate-800" value={formData.service_name} onChange={(e) => handleNameChange(e.target.value)} />
                  </div>
                  <AnimatePresence>
                    {suggestions.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="absolute z-50 w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden max-h-32 overflow-y-auto">
                        {suggestions.map((name, i) => (
                          <button key={i} type="button" onClick={() => selectSuggestion(name)} className="w-full text-left px-5 py-3 hover:bg-emerald-50 text-slate-700 font-bold text-xs uppercase tracking-tight border-b border-slate-50 last:border-0">{name}</button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Monthly Cost (RM)</label>
                  <input required type="number" step="0.01" placeholder="0.00" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-md text-slate-800" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
                </div>

                {formData.alternative && (
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold text-amber-900 leading-relaxed italic">"{formData.alternative}"</p>
                  </div>
                )}

                <div className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                  <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">Status:</span>
                  <span className={`text-[9px] font-black px-4 py-1.5 rounded-lg shadow-sm uppercase tracking-widest ${formData.shariah_status === 'Patuh' ? 'bg-emerald-600 text-white' : formData.shariah_status === 'Boikot' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'}`}>{formData.shariah_status}</span>
                </div>

                <button type="submit" disabled={loading} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all active:scale-95 shadow-slate-200">
                  {loading ? <Loader2 className="animate-spin mx-auto w-5 h-5" /> : 'Sahkan Audit & Simpan'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}