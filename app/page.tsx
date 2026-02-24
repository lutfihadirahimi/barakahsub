'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  HeartHandshake, 
  AlertCircle, 
  Loader2, 
  Plus, 
  X, 
  Trash2, 
  ShieldCheck,
  CheckCircle2,
  Share2,
  LogOut,
  User
} from 'lucide-react';

export default function Home() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    service_name: '',
    price: '',
    category: 'Entertainment',
    shariah_status: 'Perlu Semakan'
  });

  // Database Audit Automatik
  const auditDatabase: {[key: string]: string} = {
    'netflix': 'Perlu Semakan',
    'disney': 'Boikot',
    'chatgpt': 'Patuh',
    'spotify': 'Perlu Semakan',
    'canva': 'Patuh',
    'youtube': 'Patuh',
    'icloud': 'Patuh'
  };

  // 1. IDENTITY CHECK (Masa mula buka app)
  useEffect(() => {
    async function getSession() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login'); // Redirect kalau tak login
      } else {
        setUser(user);
        fetchSubscriptions(user.id);
      }
    }
    getSession();
  }, [router]);

  const handleNameChange = (name: string) => {
    const lowerName = name.toLowerCase();
    let detectedStatus = 'Perlu Semakan';
    Object.keys(auditDatabase).forEach(key => {
      if (lowerName.includes(key)) detectedStatus = auditDatabase[key];
    });
    setFormData({ ...formData, service_name: name, shariah_status: detectedStatus });
  };

  // 2. READ: Tarik data ikut User ID
  async function fetchSubscriptions(userId: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId) // FILTER DATA MILIK USER SAHAJA
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    else setSubscriptions(data || []);
    setLoading(false);
  }

  // 3. CREATE: Masukkan data dengan User ID
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    const { error } = await supabase.from('subscriptions').insert([
      { 
        service_name: formData.service_name, 
        price: parseFloat(formData.price),
        category: formData.category,
        shariah_status: formData.shariah_status,
        user_id: user.id // REKOD OWNER DATA
      }
    ]);

    if (error) alert(error.message);
    else {
      setIsModalOpen(false);
      setFormData({ service_name: '', price: '', category: 'Entertainment', shariah_status: 'Perlu Semakan' });
      fetchSubscriptions(user.id);
    }
    setLoading(false);
  }

  // 4. DELETE
  async function deleteSubscription(id: string) {
    if (!confirm("Padam langganan ini?")) return;
    const { error } = await supabase.from('subscriptions').delete().eq('id', id);
    if (!error && user) fetchSubscriptions(user.id);
  }

  // 5. LOGOUT (De-authenticate)
  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const totalBil = subscriptions.reduce((acc, sub) => acc + Number(sub.price), 0);
  const totalWakaf = totalBil * 0.05;

  if (!user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" /></div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-20">
      <nav className="max-w-6xl mx-auto px-6 py-8 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-xl font-black">B</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">BarakahSub</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
            <User className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 truncate max-w-[150px]">{user.email}</span>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 text-sm"
          >
            <Plus className="w-5 h-5" /> Audit Baru
          </button>
          <button onClick={handleLogout} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* KIRI: Stats & Impact */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-[32px] shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Potensi Barakah</p>
              <h3 className="text-4xl font-black mb-2 tracking-tighter">RM {totalWakaf.toFixed(2)}</h3>
              <p className="text-slate-400 text-xs leading-relaxed italic">
                Nilai wakaf mikro peribadi anda daripada langganan digital.
              </p>
              <button className="mt-6 w-full py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all">
                <Share2 className="w-4 h-4" /> Kongsi ke Daun
              </button>
            </div>
            <HeartHandshake className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 rotate-12" />
          </div>

          <div className="bg-white p-6 rounded-[24px] border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" /> Compliance Summary
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Patuh Syariah</span>
                <span className="font-black text-emerald-600">{subscriptions.filter(s => s.shariah_status === 'Patuh').length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Perlu Semakan</span>
                <span className="font-black text-amber-500">{subscriptions.filter(s => s.shariah_status === 'Perlu Semakan').length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Boikot</span>
                <span className="font-black text-red-500">{subscriptions.filter(s => s.shariah_status === 'Boikot').length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* KANAN: Dashboard */}
        <div className="lg:col-span-8 bg-white rounded-[40px] border border-slate-200 shadow-xl p-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Komitmen</p>
              <h3 className="text-4xl font-black text-slate-800 tracking-tighter italic">RM {totalBil.toFixed(2)}</h3>
            </div>
          </div>

          <div className="space-y-4">
            {loading && subscriptions.length === 0 ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /></div>
            ) : subscriptions.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/30">
                <p className="text-slate-400 italic text-sm">Inventory anda kosong. Mulakan audit pertama anda.</p>
              </div>
            ) : (
              subscriptions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-5 bg-slate-50/50 border border-slate-100 rounded-3xl hover:bg-white hover:shadow-xl hover:border-emerald-200 transition-all group">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center font-black text-xl text-emerald-600 shadow-sm border border-slate-100">
                      {sub.service_name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-lg tracking-tight">{sub.service_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {sub.shariah_status === 'Patuh' ? (
                          <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Patuh
                          </span>
                        ) : sub.shariah_status === 'Boikot' ? (
                          <span className="text-[9px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5" /> Boikot
                          </span>
                        ) : (
                          <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5" /> Perlu Audit
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <p className="font-black text-slate-700 text-xl tracking-tighter">RM {Number(sub.price).toFixed(2)}</p>
                    <button onClick={() => deleteSubscription(sub.id)} className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl relative animate-in zoom-in duration-300">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-600"><X /></button>
            <h3 className="text-3xl font-black text-slate-900 mb-8 tracking-tighter italic">Audit Baru</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Servis</label>
                <input 
                  required type="text" placeholder="Contoh: Netflix, Disney, ChatGPT"
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[22px] focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                  value={formData.service_name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Harga (RM)</label>
                <input 
                  required type="number" step="0.01" placeholder="0.00"
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[22px] focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                />
              </div>
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Status:</span>
                <span className={`text-[10px] font-black px-2 py-1 rounded uppercase ${
                  formData.shariah_status === 'Patuh' ? 'bg-emerald-500 text-white' : 
                  formData.shariah_status === 'Boikot' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                }`}>
                  {formData.shariah_status}
                </span>
              </div>
              <button type="submit" disabled={loading} className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-lg shadow-xl hover:bg-emerald-600 transition-all active:scale-95">
                {loading ? <Loader2 className="animate-spin" /> : 'Sahkan Audit'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}