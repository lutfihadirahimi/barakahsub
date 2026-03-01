import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import {
  ArrowRight,
  Bell,
  BookOpen,
  ChevronRight,
  Droplets,
  GraduationCap,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Plus,
  Search,
  Sparkles,
  User,
  X,
  Zap,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "./lib/supabase";

type ComplianceStatus = "Green" | "Yellow" | "Red";
type WaqfTarget = "Air" | "Quran" | "Pendidikan";
type AuthMode = "login" | "signup";
type PageView = "Public" | "Dashboard";
type DashboardTab = "Dashboard" | "Audit" | "Micro-Waqf";

type Subscription = {
  id: string;
  name: string;
  category: string;
  cost: number;
  billing: "Bulanan" | "Tahunan";
  usage: "Aktif" | "Zombie";
  status: ComplianceStatus;
  waqfRoundUp: boolean;
  lastUsed: string;
  renewInDays: number;
};

type Project = {
  id: WaqfTarget;
  name: string;
  target: number;
  description: string;
  icon: typeof Droplets;
};

type Receipt = {
  id: string;
  date: string;
  waqf: WaqfTarget;
  amount: number;
  tip: number;
  method: string;
};

type AuthFormState = {
  email: string;
  password: string;
  target: WaqfTarget;
};

type AddFormState = {
  name: string;
  cost: string;
  status: ComplianceStatus;
  renewal: string;
};

const complianceTone: Record<ComplianceStatus, string> = {
  Green: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  Yellow: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  Red: "bg-rose-500/15 text-rose-600 border-rose-500/30",
};

const complianceLabel: Record<ComplianceStatus, string> = {
  Green: "Patuh",
  Yellow: "Semakan",
  Red: "Boikot",
};

const waqfProjects: Project[] = [
  {
    id: "Air",
    name: "Wakaf Penapis Air Masjid",
    target: 1000,
    description: "Sistem air bersih untuk masjid & pusat komuniti.",
    icon: Droplets,
  },
  {
    id: "Quran",
    name: "Dana Cetakan Al-Quran",
    target: 500,
    description: "Cetakan mushaf untuk kelas tahfiz & madrasah.",
    icon: BookOpen,
  },
  {
    id: "Pendidikan",
    name: "Biasiswa Digital Asnaf",
    target: 2500,
    description: "Akses peranti & kelas digital untuk pelajar asnaf.",
    icon: GraduationCap,
  },
];

const auditDatabase: Record<string, { status: ComplianceStatus; suggestion: string }> = {
  netflix: { status: "Yellow", suggestion: "Gantikan dengan YouTube Premium (Ilmu)" },
  disney: { status: "Red", suggestion: "Gantikan dengan Nurflix atau Durioo+" },
  chatgpt: { status: "Green", suggestion: "Teruskan jika penggunaan produktif" },
  spotify: { status: "Yellow", suggestion: "Gantikan dengan YouTube Music" },
  canva: { status: "Green", suggestion: "Teruskan jika perlu" },
  adobe: { status: "Red", suggestion: "Gantikan dengan Canva atau Affinity" },
  icloud: { status: "Yellow", suggestion: "Audit storan dan downgrade" },
};

const seedSubscriptions: Subscription[] = [
  {
    id: "seed-1",
    name: "Netflix",
    category: "Streaming",
    cost: 55,
    billing: "Bulanan",
    usage: "Zombie",
    status: "Red",
    waqfRoundUp: true,
    lastUsed: "2 minggu lepas",
    renewInDays: 4,
  },
  {
    id: "seed-2",
    name: "iCloud+",
    category: "Cloud",
    cost: 12.9,
    billing: "Bulanan",
    usage: "Aktif",
    status: "Yellow",
    waqfRoundUp: true,
    lastUsed: "Hari ini",
    renewInDays: 15,
  },
  {
    id: "seed-3",
    name: "ChatGPT",
    category: "Produktiviti",
    cost: 99,
    billing: "Bulanan",
    usage: "Aktif",
    status: "Green",
    waqfRoundUp: true,
    lastUsed: "Hari ini",
    renewInDays: 27,
  },
];

const barakahSteps = [
  {
    id: 1,
    from: "Disney+",
    status: "Boikot",
    to: "Nurflix",
    tag: "Patuh",
  },
  {
    id: 2,
    from: "Spotify",
    status: "Semakan",
    to: "YouTube Music",
    tag: "Neutral",
  },
];

const monthlyStats = [
  { label: "Health Score", value: 78, suffix: "%" },
  { label: "Total Burn Rate", value: 166.9, suffix: "RM" },
  { label: "Waqf Potential", value: 23.5, suffix: "RM" },
];

const complianceFilters: Array<"Semua" | ComplianceStatus> = ["Semua", "Green", "Yellow", "Red"];

const paymentMethods = ["DuitNow", "FPX", "Debit Kad", "Apple Pay"];

export function App() {
  const authRef = useRef<HTMLDivElement | null>(null);
  const [page, setPage] = useState<PageView>("Public");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [tab, setTab] = useState<DashboardTab>("Dashboard");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("amina@barakahsub.my");
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(seedSubscriptions);
  const [selectedWaqf, setSelectedWaqf] = useState<WaqfTarget>("Air");
  const [auditFilter, setAuditFilter] = useState<"Semua" | ComplianceStatus>("Semua");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const [authForm, setAuthForm] = useState<AuthFormState>({
    email: "",
    password: "",
    target: "Air",
  });
  const [addForm, setAddForm] = useState<AddFormState>({
    name: "",
    cost: "",
    status: "Green",
    renewal: "",
  });
  const [profileSettings, setProfileSettings] = useState({
    waqf: "Air" as WaqfTarget,
    monthlyEmail: true,
    mfa: false,
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: "10",
    tip: "2",
    method: "DuitNow",
  });

  const totalMonthly = useMemo(() => subscriptions.reduce((sum, item) => sum + item.cost, 0), [subscriptions]);
  const waqfPotential = useMemo(() => totalMonthly * 0.05, [totalMonthly]);

  const currentProject = waqfProjects.find((project) => project.id === selectedWaqf) ?? waqfProjects[0];
  const progressPercent = Math.min((waqfPotential / currentProject.target) * 100, 100);
  const filteredSubscriptions = subscriptions.filter((item) =>
    auditFilter === "Semua" ? true : item.status === auditFilter
  );

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setNotice("Supabase belum dikonfigurasikan. Mode demo digunakan.");
      return;
    }

    let isMounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      if (data.session?.user) {
        setUserEmail(data.session.user.email ?? "user@barakahsub.my");
        setPage("Dashboard");
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setUserEmail(session.user.email ?? "user@barakahsub.my");
        setPage("Dashboard");
      } else {
        setPage("Public");
      }
    });

    return () => {
      isMounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(null), 3200);
    return () => clearTimeout(timeout);
  }, [notice]);

  const pushNotice = (message: string) => {
    setNotice(message);
  };

  const handleAuthSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    if (!isSupabaseConfigured) {
      setUserEmail(authForm.email || "demo@barakahsub.my");
      setProfileSettings((prev) => ({ ...prev, waqf: authForm.target }));
      setSelectedWaqf(authForm.target);
      setPage("Dashboard");
      setLoading(false);
      return;
    }

    const { data, error } =
      authMode === "signup"
        ? await supabase.auth.signUp({
            email: authForm.email,
            password: authForm.password,
            options: { data: { waqf_target: authForm.target } },
          })
        : await supabase.auth.signInWithPassword({
            email: authForm.email,
            password: authForm.password,
          });

    if (error) {
      pushNotice(error.message);
    } else if (data.user) {
      setUserEmail(data.user.email ?? authForm.email);
      setProfileSettings((prev) => ({ ...prev, waqf: authForm.target }));
      setSelectedWaqf(authForm.target);
      setPage("Dashboard");
    }

    setLoading(false);
  };

  const handleNameChange = (name: string) => {
    const lowerName = name.toLowerCase();
    const hits = Object.keys(auditDatabase).filter((key) => key.includes(lowerName));
    setSuggestions(name.length > 0 ? hits : []);

    const detected = Object.keys(auditDatabase).find((key) => lowerName.includes(key));
    const status = detected ? auditDatabase[detected].status : "Yellow";
    setAddForm((prev) => ({ ...prev, name, status }));
  };

  const handleAddSubscription = (event: FormEvent) => {
    event.preventDefault();
    const cost = Number.parseFloat(addForm.cost || "0");
    if (!addForm.name || Number.isNaN(cost)) return;

    const newSub: Subscription = {
      id: `sub-${Date.now()}`,
      name: addForm.name,
      category: "Umum",
      cost,
      billing: "Bulanan",
      usage: "Aktif",
      status: addForm.status,
      waqfRoundUp: true,
      lastUsed: "Hari ini",
      renewInDays: Math.max(1, Math.floor(Math.random() * 25) + 3),
    };

    setSubscriptions((prev) => [newSub, ...prev]);
    pushNotice("Langganan berjaya ditambah ke audit.");
    setAddForm({ name: "", cost: "", status: "Green", renewal: "" });
    setIsAddModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setSubscriptions((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSwitchToHalal = (id: string) => {
    setSubscriptions((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "Green",
              usage: "Aktif",
              waqfRoundUp: true,
            }
          : item
      )
    );
    pushNotice("Alternatif patuh telah diaktifkan.");
  };

  const handleCancel = (id: string) => {
    setSubscriptions((prev) => prev.filter((item) => item.id !== id));
    pushNotice("Langganan dibatalkan dari inventori.");
  };

  const handleProfileSave = () => {
    setSelectedWaqf(profileSettings.waqf);
    setIsProfileOpen(false);
    pushNotice("Tetapan akaun dikemas kini.");
  };

  const handlePayment = () => {
    const amount = Number.parseFloat(paymentForm.amount);
    const tip = Number.parseFloat(paymentForm.tip || "0");
    if (Number.isNaN(amount) || amount <= 0) return;

    const receiptData: Receipt = {
      id: `BK-${Date.now()}`,
      date: new Date().toLocaleString("ms-MY"),
      waqf: selectedWaqf,
      amount,
      tip,
      method: paymentForm.method,
    };

    setReceipt(receiptData);
    pushNotice("Terima kasih! Wakaf anda telah disalurkan.");
  };

  const downloadReceipt = () => {
    if (!receipt) return;
    const pdf = new jsPDF();
    pdf.setFont("helvetica", "bold");
    pdf.text("Resit Wakaf BarakahSub", 20, 20);
    pdf.setFont("helvetica", "normal");
    pdf.text(`No. Resit: ${receipt.id}`, 20, 40);
    pdf.text(`Tarikh: ${receipt.date}`, 20, 50);
    pdf.text(`Projek Wakaf: ${receipt.waqf}`, 20, 60);
    pdf.text(`Jumlah Wakaf: RM ${receipt.amount.toFixed(2)}`, 20, 70);
    pdf.text(`Tip Sokongan: RM ${receipt.tip.toFixed(2)}`, 20, 80);
    pdf.text(`Kaedah Pembayaran: ${receipt.method}`, 20, 90);
    pdf.text("BarakahSub menghargai sumbangan anda.", 20, 110);
    pdf.save(`Resit-${receipt.id}.pdf`);
  };

  const publicPage = (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="px-6 py-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-200">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <span className="font-black text-xl italic tracking-tighter">BarakahSub</span>
        </div>
        <button
          onClick={() => authRef.current?.scrollIntoView({ behavior: "smooth" })}
          className="bg-emerald-400 text-slate-950 px-6 py-2 rounded-full font-black text-[10px] uppercase shadow-lg shadow-emerald-400/20"
        >
          Audit Langganan Saya
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16 space-y-20">
        <section className="text-center space-y-8">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black italic tracking-tight"
          >
            Tukar Pembaziran Digital
            <span className="block text-emerald-400 uppercase">Kepada Saham Akhirat</span>
          </motion.h1>
          <p className="text-slate-300 max-w-2xl mx-auto">
            BarakahSub ialah Command Center langganan digital anda. Audit pembaziran, pantau pematuhan Syariah,
            dan salurkan lebihan ke Micro-Waqf secara automatik.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => authRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="bg-emerald-400 text-slate-950 px-6 py-3 rounded-full font-black uppercase tracking-widest text-[11px]"
            >
              Audit Langganan Saya Sekarang (Percuma)
            </button>
            <button className="border border-white/20 px-6 py-3 rounded-full uppercase tracking-widest text-[11px] font-black text-white/70">
              Lihat Demo Dashboard
            </button>
          </div>
        </section>

        <section className="grid lg:grid-cols-[1.2fr_0.8fr] gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-black italic">The Barakah Engine</h2>
            <p className="text-slate-300">
              Enjin audit kami mengenal pasti servis bermasalah dan mencadangkan alternatif patuh secara automatik.
              Transformasi pembaziran kepada keberkatan berlaku dalam beberapa saat.
            </p>
            <div className="space-y-3">
              {barakahSteps.map((step) => (
                <div
                  key={step.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold">{step.from}</p>
                    <span className="text-[10px] uppercase text-rose-300">{step.status}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/40" />
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-200">{step.to}</p>
                    <span className="text-[10px] uppercase text-emerald-300">{step.tag}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6">
            <h3 className="text-lg font-bold">Kebocoran Digital Malaysia</h3>
            <p className="text-slate-300 text-sm mt-2">
              62% pengguna melanggan servis yang jarang digunakan. Anggaran pembaziran mencecah RM1.8 bilion setahun.
            </p>
            <div className="mt-6 grid gap-4">
              {monthlyStats.map((stat) => (
                <div key={stat.label} className="bg-white/10 rounded-2xl p-4">
                  <p className="text-[10px] uppercase text-white/60 font-bold">{stat.label}</p>
                  <p className="text-2xl font-black">
                    {stat.suffix === "RM" ? "RM" : ""} {stat.value}
                    {stat.suffix === "%" ? "%" : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section ref={authRef} className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-black italic">Security Gate</h2>
            <p className="text-slate-300">
              Log masuk untuk mengakses audit peribadi. Pengguna baharu akan terus menetapkan sasaran wakaf utama.
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] uppercase font-bold text-white/60">
              <span className="bg-white/10 px-3 py-1 rounded-full">Supabase Auth</span>
              <span className="bg-white/10 px-3 py-1 rounded-full">Encrypted Session</span>
              <span className="bg-white/10 px-3 py-1 rounded-full">Audit Logs</span>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
            <h3 className="text-xl font-black uppercase tracking-widest">
              {authMode === "login" ? "Login" : "Sign Up"}
            </h3>
            <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
              <label className="flex items-center gap-3 bg-slate-900/70 border border-white/10 rounded-2xl px-4 py-3">
                <Mail className="w-4 h-4 text-white/40" />
                <input
                  type="email"
                  required
                  placeholder="Email"
                  className="bg-transparent flex-1 text-sm outline-none"
                  value={authForm.email}
                  onChange={(event) => setAuthForm((prev) => ({ ...prev, email: event.target.value }))}
                />
              </label>
              <label className="flex items-center gap-3 bg-slate-900/70 border border-white/10 rounded-2xl px-4 py-3">
                <Lock className="w-4 h-4 text-white/40" />
                <input
                  type="password"
                  required
                  placeholder="Password"
                  className="bg-transparent flex-1 text-sm outline-none"
                  value={authForm.password}
                  onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))}
                />
              </label>
              {authMode === "signup" && (
                <div className="bg-slate-900/70 border border-white/10 rounded-2xl px-4 py-3">
                  <label className="text-[10px] uppercase text-white/50 font-bold">Sasaran wakaf utama</label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {waqfProjects.map((project) => (
                      <button
                        type="button"
                        key={project.id}
                        onClick={() => setAuthForm((prev) => ({ ...prev, target: project.id }))}
                        className={`px-3 py-2 rounded-xl text-[10px] uppercase font-bold transition-colors ${
                          authForm.target === project.id ? "bg-emerald-400 text-slate-950" : "bg-white/5 text-white/70"
                        }`}
                      >
                        {project.id}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-400 text-slate-950 font-black uppercase tracking-widest py-3 rounded-2xl flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : authMode === "login" ? "Masuk" : "Daftar"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
            <button
              onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
              className="mt-5 text-[10px] uppercase font-bold text-white/50 hover:text-emerald-300"
            >
              {authMode === "login" ? "Belum ada akaun? Daftar" : "Sudah ada akaun? Masuk"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );

  const dashboardPage = (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex">
      <aside className="w-72 bg-white border-r border-slate-200 p-8 flex flex-col gap-8">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <span className="font-black text-lg">BarakahSub</span>
        </div>
        <nav className="space-y-3">
          {["Dashboard", "Audit", "Micro-Waqf"].map((item) => (
            <button
              key={item}
              onClick={() => setTab(item as DashboardTab)}
              className={`w-full text-left px-4 py-3 rounded-2xl text-[10px] uppercase font-black tracking-widest transition-colors ${
                tab === item ? "bg-emerald-600 text-white" : "text-slate-400 hover:bg-slate-50"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>
        <div className="space-y-4 mt-auto">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] uppercase text-slate-400 font-black tracking-widest">User Session</p>
            <p className="text-sm font-semibold truncate">{userEmail}</p>
          </div>
          <button
            onClick={() => {
              if (isSupabaseConfigured) {
                supabase.auth.signOut();
              }
              setPage("Public");
            }}
            className="w-full flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-slate-400 hover:text-rose-500"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-[10px] uppercase text-slate-400 font-black tracking-[0.2em]">Operational Dashboard</p>
            <h1 className="text-3xl font-black italic tracking-tight">Command Center</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setIsProfileOpen(true)}
              className="px-4 py-3 rounded-2xl border border-slate-200 text-slate-400 hover:text-slate-700"
            >
              <User className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsPaymentOpen(true)}
              className="px-6 py-3 rounded-2xl bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest"
            >
              Tunaikan Wakaf
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-6 py-3 rounded-2xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest"
            >
              <Plus className="w-4 h-4 inline mr-2" /> Audit Baru
            </button>
          </div>
        </header>

        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-emerald-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest"
          >
            {notice}
          </motion.div>
        )}

        {tab === "Dashboard" && (
          <>
            <section className="grid md:grid-cols-3 gap-6 mt-10">
              <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-200">
                <p className="text-[10px] uppercase text-slate-400 font-black tracking-widest">Health Score</p>
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-3xl font-black">{Math.round(100 - auditRisk(subscriptions))}%</span>
                  <span className="text-[10px] uppercase text-emerald-600 font-black">Patuh</span>
                </div>
                <p className="mt-4 text-sm text-slate-500">Tahap pematuhan berdasarkan inventori semasa.</p>
              </div>
              <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-200">
                <p className="text-[10px] uppercase text-slate-400 font-black tracking-widest">Total Burn Rate</p>
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-3xl font-black">RM {totalMonthly.toFixed(2)}</span>
                  <span className="text-[10px] uppercase text-amber-600 font-black">/ bulan</span>
                </div>
                <p className="mt-4 text-sm text-slate-500">Jumlah langganan aktif & zombie setiap bulan.</p>
              </div>
              <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-200">
                <p className="text-[10px] uppercase text-slate-400 font-black tracking-widest">Waqf Potential</p>
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-3xl font-black">RM {waqfPotential.toFixed(2)}</span>
                  <span className="text-[10px] uppercase text-blue-600 font-black">/ bulan</span>
                </div>
                <p className="mt-4 text-sm text-slate-500">Cadangan 5% daripada pembaziran anda.</p>
              </div>
            </section>

            <section className="mt-10 grid lg:grid-cols-[1.1fr_0.9fr] gap-8">
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase text-slate-400 font-black tracking-widest">Actionable Inventory</p>
                    <h2 className="text-xl font-black mt-1">Langganan Semasa</h2>
                  </div>
                  <div className="flex gap-2">
                    {complianceFilters.map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setAuditFilter(filter)}
                        className={`px-3 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest transition-colors ${
                          auditFilter === filter
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {filteredSubscriptions.map((item) => (
                    <div
                      key={item.id}
                      className="border border-slate-100 rounded-2xl p-4 flex flex-col xl:flex-row xl:items-center gap-4"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${
                            item.status === "Red" ? "bg-rose-500" : item.status === "Yellow" ? "bg-amber-500" : "bg-emerald-600"
                          }`}
                        >
                          {item.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-lg uppercase tracking-tight">{item.name}</p>
                          <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase text-slate-400 font-bold">
                            <span>{item.category}</span>
                            <span>•</span>
                            <span>{item.billing}</span>
                            <span>•</span>
                            <span>Used: {item.lastUsed}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase ${complianceTone[item.status]}`}>
                          {complianceLabel[item.status]}
                        </span>
                        <span className="text-sm font-bold">RM {item.cost.toFixed(2)}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {item.status !== "Green" && (
                          <button
                            onClick={() => handleSwitchToHalal(item.id)}
                            className="px-3 py-2 rounded-xl bg-emerald-500 text-white text-[10px] uppercase font-black"
                          >
                            Switch Halal
                          </button>
                        )}
                        <button
                          onClick={() => handleCancel(item.id)}
                          className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-[10px] uppercase font-black"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="px-3 py-2 rounded-xl bg-rose-50 text-rose-500 text-[10px] uppercase font-black"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase text-slate-400 font-black tracking-widest">Live Monitoring</p>
                      <h3 className="text-lg font-black">Renewing Soon</h3>
                    </div>
                    <Bell className="w-5 h-5 text-rose-500" />
                  </div>
                  <div className="mt-4 space-y-3">
                    {subscriptions
                      .filter((item) => item.renewInDays <= 7)
                      .map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <span>{item.name}</span>
                          <span className="text-rose-500 text-xs font-bold">{item.renewInDays} hari</span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="bg-slate-900 text-white rounded-[2.5rem] p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase text-white/50 font-black tracking-widest">Micro-Waqf</p>
                      <h3 className="text-lg font-black">{currentProject.name}</h3>
                    </div>
                    <currentProject.icon className="w-6 h-6 text-emerald-300" />
                  </div>
                  <p className="mt-4 text-sm text-white/70">{currentProject.description}</p>
                  <div className="mt-6">
                    <div className="flex items-center justify-between text-[10px] uppercase font-black text-white/60">
                      <span>Progress</span>
                      <span>{progressPercent.toFixed(0)}%</span>
                    </div>
                    <div className="mt-2 h-2 bg-white/10 rounded-full">
                      <div className="h-2 bg-emerald-400 rounded-full" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPaymentOpen(true)}
                    className="mt-6 w-full bg-emerald-400 text-slate-900 font-black uppercase tracking-widest py-3 rounded-2xl"
                  >
                    Tunaikan Wakaf
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        {tab === "Audit" && (
          <section className="mt-10 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase text-slate-400 font-black tracking-widest">Compliance Audit</p>
                  <h2 className="text-2xl font-black mt-1">Pusat Audit Syariah</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {complianceFilters.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setAuditFilter(filter)}
                      className={`px-3 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest transition-colors ${
                        auditFilter === filter
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-6 grid md:grid-cols-3 gap-4">
                {complianceFilters
                  .filter((filter) => filter !== "Semua")
                  .map((filter) => (
                    <div key={filter} className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                      <p className="text-[10px] uppercase text-slate-400 font-black tracking-widest">{filter}</p>
                      <p className="text-2xl font-black mt-2">
                        {subscriptions.filter((item) => item.status === filter).length}
                      </p>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black">Senarai Audit</h3>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] uppercase font-black"
                >
                  Tambah Audit
                </button>
              </div>
              <div className="mt-6 space-y-4">
                {filteredSubscriptions.map((item) => (
                  <div key={item.id} className="border border-slate-100 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1">
                      <p className="text-lg font-black uppercase">{item.name}</p>
                      <p className="text-xs text-slate-400">Cadangan: {auditDatabase[item.name.toLowerCase()]?.suggestion || "Tiada"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase ${complianceTone[item.status]}`}>
                        {complianceLabel[item.status]}
                      </span>
                      <button
                        onClick={() => handleSwitchToHalal(item.id)}
                        className="px-3 py-2 rounded-xl bg-emerald-500 text-white text-[10px] uppercase font-black"
                      >
                        Alternatif
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {tab === "Micro-Waqf" && (
          <section className="mt-10 space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              {waqfProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedWaqf(project.id)}
                  className={`text-left rounded-[2.5rem] p-6 border shadow-sm transition-all ${
                    selectedWaqf === project.id ? "bg-emerald-600 text-white border-emerald-500" : "bg-white border-slate-200"
                  }`}
                >
                  <project.icon className="w-6 h-6 mb-4" />
                  <h3 className="text-lg font-black">{project.name}</h3>
                  <p className={`text-sm mt-2 ${selectedWaqf === project.id ? "text-white/80" : "text-slate-500"}`}>
                    {project.description}
                  </p>
                </button>
              ))}
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 grid lg:grid-cols-[1.1fr_0.9fr] gap-8">
              <div>
                <p className="text-[10px] uppercase text-slate-400 font-black tracking-widest">Waqf Dashboard</p>
                <h2 className="text-2xl font-black mt-2">{currentProject.name}</h2>
                <p className="text-sm text-slate-500 mt-3">{currentProject.description}</p>
                <div className="mt-6">
                  <div className="flex items-center justify-between text-[10px] uppercase font-black text-slate-400">
                    <span>Progress</span>
                    <span>{progressPercent.toFixed(0)}%</span>
                  </div>
                  <div className="mt-2 h-2 bg-slate-100 rounded-full">
                    <div className="h-2 bg-emerald-500 rounded-full" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] uppercase text-slate-400 font-black tracking-widest">Auto-Waqf</p>
                  <p className="text-sm text-slate-500 mt-2">Cadangan 5% dari burn rate anda.</p>
                  <p className="text-3xl font-black mt-4">RM {waqfPotential.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => setIsPaymentOpen(true)}
                  className="mt-6 bg-emerald-600 text-white py-3 rounded-2xl font-black uppercase tracking-widest"
                >
                  Tunaikan Wakaf
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      <AnimatePresence>
        {isAddModalOpen && (
          <Modal onClose={() => setIsAddModalOpen(false)} title="Audit Baru">
            <form onSubmit={handleAddSubscription} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-slate-400 font-bold">Nama Servis</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input
                    required
                    value={addForm.name}
                    onChange={(event) => handleNameChange(event.target.value)}
                    placeholder="Netflix"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold"
                  />
                </div>
                {suggestions.length > 0 && (
                  <div className="bg-white border border-slate-100 rounded-2xl p-2 shadow-xl">
                    {suggestions.map((item) => (
                      <button
                        type="button"
                        key={item}
                        onClick={() => {
                          const record = auditDatabase[item];
                          setAddForm((prev) => ({ ...prev, name: item, status: record.status }));
                          setSuggestions([]);
                        }}
                        className="w-full text-left px-4 py-2 text-sm font-semibold hover:bg-emerald-50 rounded-xl"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="text-[10px] uppercase text-slate-400 font-bold">
                  Harga (RM)
                  <input
                    required
                    type="number"
                    step="0.1"
                    value={addForm.cost}
                    onChange={(event) => setAddForm((prev) => ({ ...prev, cost: event.target.value }))}
                    className="mt-2 w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-semibold"
                  />
                </label>
                <label className="text-[10px] uppercase text-slate-400 font-bold">
                  Renewal
                  <input
                    type="date"
                    value={addForm.renewal}
                    onChange={(event) => setAddForm((prev) => ({ ...prev, renewal: event.target.value }))}
                    className="mt-2 w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-semibold"
                  />
                </label>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase text-emerald-600 font-black">Audit Engine</p>
                  <p className="text-xs text-emerald-500">Status automatik berdasarkan database etika.</p>
                </div>
                <span className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase ${complianceTone[addForm.status]}`}>
                  {complianceLabel[addForm.status]}
                </span>
              </div>
              <button
                type="submit"
                className="w-full bg-slate-900 text-white py-3 rounded-2xl font-black uppercase tracking-widest"
              >
                Sahkan Audit
              </button>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isProfileOpen && (
          <Modal onClose={() => setIsProfileOpen(false)} title="Profil & Tetapan">
            <div className="space-y-6">
              <div>
                <p className="text-[10px] uppercase text-slate-400 font-bold">Waqf Preferences</p>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {waqfProjects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => setProfileSettings((prev) => ({ ...prev, waqf: project.id }))}
                      className={`px-3 py-2 rounded-xl text-[10px] uppercase font-bold transition-colors ${
                        profileSettings.waqf === project.id ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {project.id}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-400 font-bold">Report Settings</p>
                <button
                  onClick={() => setProfileSettings((prev) => ({ ...prev, monthlyEmail: !prev.monthlyEmail }))}
                  className={`mt-2 w-full px-4 py-3 rounded-2xl border text-sm font-semibold flex items-center justify-between ${
                    profileSettings.monthlyEmail ? "border-emerald-500 text-emerald-700" : "border-slate-200 text-slate-500"
                  }`}
                >
                  Monthly Barakah Audit (PDF)
                  <span>{profileSettings.monthlyEmail ? "On" : "Off"}</span>
                </button>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-400 font-bold">Security</p>
                <button
                  onClick={() => setProfileSettings((prev) => ({ ...prev, mfa: !prev.mfa }))}
                  className={`mt-2 w-full px-4 py-3 rounded-2xl border text-sm font-semibold flex items-center justify-between ${
                    profileSettings.mfa ? "border-emerald-500 text-emerald-700" : "border-slate-200 text-slate-500"
                  }`}
                >
                  Multi-Factor Authentication
                  <span>{profileSettings.mfa ? "Enabled" : "Disabled"}</span>
                </button>
              </div>
              <button
                onClick={handleProfileSave}
                className="w-full bg-slate-900 text-white py-3 rounded-2xl font-black uppercase tracking-widest"
              >
                Simpan Tetapan
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPaymentOpen && (
          <Modal
            onClose={() => {
              setIsPaymentOpen(false);
              setReceipt(null);
            }}
            title="Sadaqah Checkout"
          >
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                <p className="text-[10px] uppercase text-emerald-600 font-black">Projek Wakaf</p>
                <p className="text-sm font-semibold mt-2">{currentProject.name}</p>
                <p className="text-xs text-emerald-600 mt-1">{currentProject.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="text-[10px] uppercase text-slate-400 font-bold">
                  Jumlah Wakaf (RM)
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(event) => setPaymentForm((prev) => ({ ...prev, amount: event.target.value }))}
                    className="mt-2 w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-semibold"
                  />
                </label>
                <label className="text-[10px] uppercase text-slate-400 font-bold">
                  Tips untuk Developer (RM)
                  <input
                    type="number"
                    value={paymentForm.tip}
                    onChange={(event) => setPaymentForm((prev) => ({ ...prev, tip: event.target.value }))}
                    className="mt-2 w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-semibold"
                  />
                </label>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-400 font-bold">Kaedah Pembayaran</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {paymentMethods.map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentForm((prev) => ({ ...prev, method }))}
                      className={`px-3 py-2 rounded-xl text-[10px] uppercase font-bold transition-colors ${
                        paymentForm.method === method ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handlePayment}
                className="w-full bg-emerald-500 text-white py-3 rounded-2xl font-black uppercase tracking-widest"
              >
                Tunaikan Wakaf RM {Number(paymentForm.amount || 0).toFixed(2)}
              </button>

              {receipt && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <p className="text-sm font-bold">Terima kasih! Resit siap dijana.</p>
                  <p className="text-xs text-slate-500">No. Resit: {receipt.id}</p>
                  <button
                    onClick={downloadReceipt}
                    className="w-full bg-slate-900 text-white py-2 rounded-2xl text-[10px] uppercase font-black tracking-widest"
                  >
                    Muat Turun Resit PDF
                  </button>
                </div>
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );

  return <div className="font-sans">{page === "Public" ? publicPage : dashboardPage}</div>;
}

function auditRisk(subscriptions: Subscription[]) {
  const total = subscriptions.length || 1;
  const negative = subscriptions.filter((item) => item.status !== "Green").length;
  return (negative / total) * 100;
}

type ModalProps = {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
};

function Modal({ title, children, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-lg rounded-[2rem] p-8 relative shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-black mb-6">{title}</h3>
        {children}
      </motion.div>
    </div>
  );
}
