import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
import { useNavigate, Link } from "react-router-dom";
import {
  Bike,
  ArrowRight,
  Loader2,
  Zap,
  MapPin,
  Smartphone,
  Mail,
  Lock,
  User,
  ChevronLeft,
  Map,
  Camera,
  CreditCard,
  UploadCloud,
  ShieldCheck,
  Clock,
  Wallet,
} from "lucide-react";

export const CourierPromoPage: React.FC = () => {
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
    vehicle: "Motor",
    plat: "",
    market_id: "",
    address: "",
  });

  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    ktp: null,
    sim: null,
    selfie: null,
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

  const uploadImage = async (userId: string, file: File, prefix: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${prefix}_${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage
      .from("courier-docs")
      .upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage
      .from("courier-docs")
      .getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!formData.market_id)
      return showToast("Area operasional wajib dipilih!", "error");
    if (!files.ktp || !files.sim || !files.selfie)
      return showToast("Mohon lengkapi Foto KTP, SIM, dan Selfie.", "error");

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });
      if (error) throw error;
      await new Promise((r) => setTimeout(r, 1500));

      if (data.user) {
        const userId = data.user.id;
        const ktpUrl = await uploadImage(userId, files.ktp!, "ktp");
        const simUrl = await uploadImage(userId, files.sim!, "sim");
        const selfieUrl = await uploadImage(userId, files.selfie!, "selfie");

        const { error: profileError } = await supabase.from("profiles").upsert({
          id: userId,
          email: formData.email,
          name: formData.name,
          phone_number: formData.phone,
          address: formData.address,
          role: "COURIER",
          vehicle_type: formData.vehicle,
          plat_number: formData.plat,
          ktp_url: ktpUrl,
          sim_url: simUrl,
          selfie_url: selfieUrl,
          is_verified: false,
          managed_market_id: formData.market_id,
          created_at: new Date().toISOString(),
        });

        if (profileError) throw profileError;

        showToast(
          "Pendaftaran Berhasil! Menunggu verifikasi berkas.",
          "success",
        );
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
            <div className="text-2xl font-black text-teal-600 tracking-tighter flex items-center gap-1">
              <span className="bg-teal-600 text-white px-1.5 rounded">P</span>{" "}
              PASARQU
            </div>
            <div className="h-6 w-[1px] bg-slate-200 hidden md:block mx-2"></div>
            <div className="text-slate-800 font-bold text-lg hidden md:block">
              Driver Center
            </div>
          </div>
          <button
            onClick={() => navigate("/portal")}
            className="text-slate-500 hover:text-teal-600 flex items-center gap-1 font-bold text-sm"
          >
            <ChevronLeft size={18} /> Kembali
          </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col lg:flex-row max-w-[1200px] mx-auto w-full p-6 md:p-12 gap-12 lg:gap-20">
        <div className="flex-1 space-y-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-600 px-4 py-1.5 rounded-full">
              <Zap size={14} className="fill-teal-500" />
              <span className="text-xs font-black uppercase tracking-widest">
                Peluang Cuan Instan
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-[1.1]">
              Antar Pesanan, <br />
              <span className="text-orange-500">Jemput Penghasilan.</span>
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed max-w-md">
              Jadilah bagian dari pahlawan pengiriman pasar. Fleksibel, tanpa
              target, dan cair setiap hari.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BenefitItem
              icon={<Wallet className="text-orange-500" />}
              title="Cair Tiap Hari"
              desc="Ongkos kirim tunai langsung masuk kantong Anda."
            />
            <BenefitItem
              icon={<MapPin className="text-teal-600" />}
              title="Rute Dekat"
              desc="Hanya antar di area sekitar pasar & tempat tinggal."
            />
            <BenefitItem
              icon={<Clock className="text-blue-500" />}
              title="Jam Fleksibel"
              desc="Atur sendiri waktu bekerja Anda tanpa tekanan."
            />
            <BenefitItem
              icon={<ShieldCheck className="text-green-600" />}
              title="Proteksi Aman"
              desc="Sistem pengiriman yang jelas & terverifikasi admin."
            />
          </div>
        </div>

        <div className="w-full lg:w-[480px] shrink-0">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 md:p-10 sticky top-24">
            <div className="text-center mb-8">
              <div className="inline-flex p-4 bg-orange-50 rounded-2xl mb-4 text-orange-600 border border-orange-100">
                <Bike size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                Daftar Driver
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">
                Lengkapi Berkas Kendaraan
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">
                  Area Operasional (Pasar)
                </label>
                {detectedMarketName ? (
                  <div className="w-full px-4 py-3 bg-teal-50 border border-teal-200 rounded-xl text-sm font-bold text-teal-800 flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <Map size={16} /> {detectedMarketName}
                    </span>
                    <span className="text-[8px] bg-teal-200 px-2 py-1 rounded">
                      AREA TERKUNCI
                    </span>
                  </div>
                ) : (
                  <select
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:border-teal-600 outline-none text-sm font-bold appearance-none transition-all shadow-inner"
                    value={formData.market_id}
                    onChange={(e) =>
                      setFormData({ ...formData, market_id: e.target.value })
                    }
                  >
                    <option value="">-- Pilih Wilayah Operasi --</option>
                    {markets.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <InputGroup
                  placeholder="Nama (Sesuai KTP)"
                  icon={<User size={16} />}
                  value={formData.name}
                  onChange={(v: string) =>
                    setFormData({ ...formData, name: v })
                  }
                />
                <InputGroup
                  placeholder="WhatsApp"
                  icon={<Smartphone size={16} />}
                  value={formData.phone}
                  onChange={(v: string) =>
                    setFormData({ ...formData, phone: v })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative group">
                  <select
                    className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:border-teal-600 outline-none text-xs font-bold appearance-none transition-all h-full shadow-inner"
                    value={formData.vehicle}
                    onChange={(e) =>
                      setFormData({ ...formData, vehicle: e.target.value })
                    }
                  >
                    <option value="Motor">Motor</option>
                    <option value="Bentor">Bentor</option>
                    <option value="Mobil">Mobil</option>
                  </select>
                </div>
                <InputGroup
                  placeholder="No. Plat Polisi"
                  icon={<CreditCard size={16} />}
                  value={formData.plat}
                  onChange={(v: string) =>
                    setFormData({ ...formData, plat: v })
                  }
                />
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <InputGroup
                  type="email"
                  placeholder="Email Akun"
                  icon={<Mail size={16} />}
                  value={formData.email}
                  onChange={(v: string) =>
                    setFormData({ ...formData, email: v })
                  }
                />
                <InputGroup
                  type="password"
                  placeholder="Buat Password"
                  icon={<Lock size={16} />}
                  value={formData.password}
                  onChange={(v: string) =>
                    setFormData({ ...formData, password: v })
                  }
                />
              </div>

              <div className="pt-2 space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Upload Berkas Wajib
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <FileBox
                    label="KTP"
                    icon={<CreditCard size={18} />}
                    file={files.ktp}
                    onSelect={(f: File) => setFiles({ ...files, ktp: f })}
                  />
                  <FileBox
                    label="SIM C"
                    icon={<UploadCloud size={18} />}
                    file={files.sim}
                    onSelect={(f: File) => setFiles({ ...files, sim: f })}
                  />
                  <FileBox
                    label="Selfie"
                    icon={<Camera size={18} />}
                    file={files.selfie}
                    onSelect={(f: File) => setFiles({ ...files, selfie: f })}
                  />
                </div>
              </div>

              <button
                disabled={isLoading}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-teal-600 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 group"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    DAFTAR SEKARANG{" "}
                    <ArrowRight
                      size={16}
                      className="text-orange-500 group-hover:text-white transition-colors"
                    />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="py-10 bg-slate-50 border-t border-slate-100 text-center">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
          © 2026 PASARQU DRIVER ECOSYSTEM
        </p>
      </footer>
    </div>
  );
};

const BenefitItem = ({ icon, title, desc }: any) => (
  <div className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <div>
      <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">
        {title}
      </h3>
      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
        {desc}
      </p>
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
    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors pointer-events-none">
      {icon}
    </div>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:border-teal-600 focus:bg-white outline-none text-[11px] font-bold transition-all placeholder:text-slate-300 shadow-inner"
      required
    />
  </div>
);

const FileBox = ({
  label,
  icon,
  onSelect,
  file,
}: {
  label: string;
  icon: any;
  onSelect: (f: File) => void;
  file: File | null;
}) => (
  <label
    className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 border-dashed cursor-pointer transition-all h-20 ${file ? "bg-teal-50 border-teal-400 text-teal-700 font-black" : "bg-white border-slate-200 text-slate-400 hover:border-orange-400 hover:bg-orange-50"}`}
  >
    <div
      className={`mb-1 transition-transform ${file ? "scale-110" : "scale-100"}`}
    >
      {icon}
    </div>
    <span className="text-[8px] font-black uppercase truncate w-full text-center tracking-tighter">
      {file ? "OK" : label}
    </span>
    <input
      type="file"
      className="hidden"
      accept="image/*"
      onChange={(e) => onSelect(e.target.files?.[0] as File)}
    />
  </label>
);
