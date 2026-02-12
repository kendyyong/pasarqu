import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
import { useNavigate, Link } from "react-router-dom";
import {
  Shield,
  ArrowRight,
  Loader2,
  Map,
  User,
  Smartphone,
  Mail,
  Lock,
  ChevronLeft,
  LayoutDashboard,
  Database,
  Activity,
  Globe,
} from "lucide-react";

export const AdminPromoPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [markets, setMarkets] = useState<any[]>([]);
  const [detectedMarketName, setDetectedMarketName] = useState<string>("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    market_id: "",
  });

  useEffect(() => {
    const initPage = async () => {
      const savedMarketId = localStorage.getItem("selected_market_id");
      if (savedMarketId) {
        const { data } = await supabase
          .from("markets")
          .select("name")
          .eq("id", savedMarketId)
          .single();
        if (data) {
          setDetectedMarketName(data.name);
          setFormData((prev) => ({ ...prev, market_id: savedMarketId }));
        }
      } else {
        const { data } = await supabase.from("markets").select("id, name");
        if (data) setMarkets(data);
      }
    };
    initPage();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (!formData.market_id)
        throw new Error("Pilih Pasar yang akan Anda kelola!");

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;
      await new Promise((r) => setTimeout(r, 1500));

      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: data.user.id,
          email: formData.email,
          name: formData.name,
          phone_number: formData.phone,
          role: "LOCAL_ADMIN",
          managed_market_id: formData.market_id,
          is_verified: false,
          created_at: new Date().toISOString(),
        });

        if (profileError) throw profileError;

        showToast("Akses diajukan! Menunggu verifikasi Pusat.", "success");
        // REDIRECT KE WAITING APPROVAL
        setTimeout(() => {
          navigate("/waiting-approval");
        }, 1500);
      }
    } catch (err: any) {
      showToast(err.message, "error");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-left">
      <nav className="border-b sticky top-0 bg-white z-50 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <div
            onClick={() => navigate("/")}
            className="cursor-pointer flex items-center gap-2"
          >
            <div className="text-2xl font-black text-teal-900 tracking-tighter flex items-center gap-1">
              <span className="bg-teal-900 text-white px-1.5 rounded">P</span>{" "}
              PASARQU
            </div>
            <div className="h-6 w-[1px] bg-slate-200 hidden md:block mx-2"></div>
            <div className="text-slate-800 font-bold text-lg hidden md:block">
              Portal Wilayah
            </div>
          </div>
          <button
            onClick={() => navigate("/portal")}
            className="text-slate-500 hover:text-teal-900 flex items-center gap-1 font-bold text-sm"
          >
            <ChevronLeft size={18} /> Kembali
          </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col lg:flex-row max-w-[1200px] mx-auto w-full p-6 md:p-12 gap-12 lg:gap-20">
        <div className="flex-1 space-y-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full">
              <Shield size={14} className="fill-blue-100" />
              <span className="text-xs font-black uppercase tracking-widest">
                Otoritas Wilayah
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-[1.1]">
              Kelola Pasar Anda <br />
              <span className="text-teal-700">Dalam Satu Panel.</span>
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed max-w-md">
              Ambil kendali operasional pasar tradisional di wilayah Anda.
              Pantau transaksi, verifikasi mitra, dan optimalkan ekonomi lokal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <BenefitItem
              icon={<Activity className="text-teal-700" />}
              title="Pantau Real-time"
              desc="Lihat statistik transaksi pasar wilayah secara langsung."
            />
            <BenefitItem
              icon={<Database className="text-blue-600" />}
              title="Manajemen Mitra"
              desc="Verifikasi pendaftaran toko dan kurir di zona Anda."
            />
            <BenefitItem
              icon={<Globe className="text-indigo-600" />}
              title="Digitalisasi Pasar"
              desc="Bawa pasar tradisional ke level teknologi modern."
            />
            <BenefitItem
              icon={<Shield className="text-teal-900" />}
              title="Keamanan Data"
              desc="Sistem terenkripsi untuk perlindungan data wilayah."
            />
          </div>
        </div>

        <div className="w-full lg:w-[420px] shrink-0">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 md:p-10 sticky top-24">
            <div className="text-center mb-8">
              <div className="inline-flex p-4 bg-teal-900 rounded-2xl mb-4 text-white shadow-xl">
                <LayoutDashboard size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                Daftar Admin
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">
                Permohonan Akses Kelola Wilayah
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">
                  Zona Pengelolaan
                </label>
                {detectedMarketName ? (
                  <div className="w-full px-4 py-3 bg-teal-50 border border-teal-200 rounded-xl text-sm font-bold text-teal-900 flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <Map size={16} /> {detectedMarketName}
                    </span>
                    <span className="text-[8px] bg-teal-200 px-2 py-1 rounded text-teal-900 font-black tracking-widest">
                      TERKUNCI
                    </span>
                  </div>
                ) : (
                  <div className="relative group">
                    <Map
                      className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-teal-900 transition-colors"
                      size={18}
                    />
                    <select
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:border-teal-900 outline-none text-sm font-bold appearance-none transition-all shadow-inner"
                      value={formData.market_id}
                      onChange={(e) =>
                        setFormData({ ...formData, market_id: e.target.value })
                      }
                    >
                      <option value="">-- Pilih Wilayah Pasar --</option>
                      {markets.map((m: any) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <InputGroup
                  placeholder="Nama Lengkap"
                  icon={<User size={18} />}
                  value={formData.name}
                  onChange={(v: string) =>
                    setFormData({ ...formData, name: v })
                  }
                />
                <InputGroup
                  placeholder="No. WhatsApp"
                  icon={<Smartphone size={18} />}
                  value={formData.phone}
                  onChange={(v: string) =>
                    setFormData({ ...formData, phone: v })
                  }
                />
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <InputGroup
                  type="email"
                  placeholder="Email Admin"
                  icon={<Mail size={18} />}
                  value={formData.email}
                  onChange={(v: string) =>
                    setFormData({ ...formData, email: v })
                  }
                />
                <InputGroup
                  type="password"
                  placeholder="Password Baru"
                  icon={<Lock size={18} />}
                  value={formData.password}
                  onChange={(v: string) =>
                    setFormData({ ...formData, password: v })
                  }
                />
              </div>

              <button
                disabled={isLoading}
                className="w-full py-4 bg-teal-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    AJUKAN AKSES ADMIN <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="py-10 bg-slate-50 border-t border-slate-100 text-center">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
          © 2026 PASARQU LOCAL AUTHORITY
        </p>
      </footer>
    </div>
  );
};

const BenefitItem = ({ icon, title, desc }: any) => (
  <div className="flex gap-5">
    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-md border border-slate-50">
      {icon}
    </div>
    <div>
      <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const InputGroup = ({
  icon,
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  icon: any;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="relative group flex-1">
    <div className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-teal-900 transition-colors pointer-events-none">
      {icon}
    </div>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:border-teal-900 focus:bg-white outline-none text-[11px] font-bold transition-all placeholder:text-slate-300 shadow-inner"
      required
    />
  </div>
);
