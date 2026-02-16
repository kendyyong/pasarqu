import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
import { useNavigate } from "react-router-dom";
import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";
import {
  Store,
  ArrowRight,
  Loader2,
  Star,
  ShieldCheck,
  MapPin,
  Smartphone,
  Mail,
  Lock,
  User,
  ChevronLeft,
  Map as MapIcon,
  BarChart3,
  Zap,
  Globe,
  Crosshair,
} from "lucide-react";

export const MerchantPromoPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // ✅ LOGIKA ANTI-GAGAL: Langsung ambil nama dari memori mana pun yang ada
  const savedMarketName =
    localStorage.getItem("selected_market_name") ||
    localStorage.getItem("market_name") ||
    "";
  const savedMarketId = localStorage.getItem("selected_market_id") || "";

  const [detectedMarketName, setDetectedMarketName] =
    useState<string>(savedMarketName);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    shopName: "",
    address: "",
    market_id: savedMarketId,
    latitude: -6.2,
    longitude: 106.8,
  });

  // Sinkronisasi data detail koordinat pasar dari database
  useEffect(() => {
    const syncMarketDetails = async () => {
      if (savedMarketId) {
        const { data, error } = await supabase
          .from("markets")
          .select("name, latitude, longitude")
          .eq("id", savedMarketId)
          .single();

        if (data && !error) {
          // Update nama jika di database berbeda, dan ambil titik koordinat pusat pasar
          setDetectedMarketName(data.name);
          setFormData((prev) => ({
            ...prev,
            latitude: Number(data.latitude) || -6.2,
            longitude: Number(data.longitude) || 106.8,
          }));
        }
      }
    };
    syncMarketDetails();
  }, [savedMarketId]);

  const handleAutoDetect = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: Number(position.coords.latitude),
            longitude: Number(position.coords.longitude),
          }));
          showToast("Lokasi toko berhasil dideteksi!", "success");
        },
        () =>
          showToast("Gagal akses GPS. Pastikan izin lokasi aktif.", "error"),
      );
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (!formData.market_id)
        throw new Error(
          "Data pasar hilang. Silakan kembali ke Beranda dan pilih pasar Muara Jawa lagi.",
        );

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
          address: formData.address,
          role: "MERCHANT",
          shop_name: formData.shopName,
          latitude: formData.latitude,
          longitude: formData.longitude,
          is_verified: false,
          managed_market_id: formData.market_id,
          created_at: new Date().toISOString(),
        });

        if (profileError) throw profileError;
        showToast(
          "Pendaftaran Berhasil! Admin akan segera memverifikasi lapak Anda.",
          "success",
        );
        setTimeout(() => navigate("/waiting-approval"), 1500);
      }
    } catch (err: any) {
      showToast(err.message, "error");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:bg-white flex flex-col font-sans text-left">
      <nav className="border-b sticky top-0 bg-white z-50 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div
            onClick={() => navigate("/")}
            className="cursor-pointer flex items-center gap-2"
          >
            <div className="text-xl md:text-2xl font-black text-teal-600 tracking-tighter flex items-center gap-1">
              <span className="bg-teal-600 text-white px-1.5 rounded">P</span>{" "}
              PASARQU
            </div>
            <div className="text-slate-800 font-bold text-lg hidden md:block border-l pl-2 ml-2 border-slate-200 uppercase tracking-tight">
              Seller Portal
            </div>
          </div>
          <button
            onClick={() => navigate("/portal")}
            className="text-slate-500 hover:text-teal-600 flex items-center gap-1 font-bold text-xs md:text-sm"
          >
            <ChevronLeft size={18} /> <span>Kembali</span>
          </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col lg:flex-row max-w-[1200px] mx-auto w-full p-4 md:p-12 gap-12 lg:gap-20 justify-center">
        {/* INFO KIRI */}
        <div className="hidden lg:block flex-1 space-y-10 text-left">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full border border-orange-100">
              <Star size={14} className="fill-orange-500" />
              <span className="text-xs font-black uppercase tracking-widest">
                Kesempatan Terbatas
              </span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 leading-[1.1] uppercase tracking-tighter">
              Buka Toko Digital, <br />
              <span className="text-teal-600">Jangkau Satu Wilayah.</span>
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed max-w-md font-medium">
              Daftarkan lapak Anda sekarang. Kelola stok, harga, dan pesanan
              pelanggan pasar secara otomatis dalam satu genggaman.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <BenefitItem
              icon={<BarChart3 className="text-teal-600" />}
              title="Analisis Akurat"
              desc="Pantau performa harian."
            />
            <BenefitItem
              icon={<Zap className="text-orange-500" />}
              title="Pencairan Cepat"
              desc="Tarik hasil jualan harian."
            />
            <BenefitItem
              icon={<Globe className="text-blue-500" />}
              title="Jangkauan Luas"
              desc="Tampil di seluruh aplikasi warga."
            />
            <BenefitItem
              icon={<ShieldCheck className="text-green-600" />}
              title="Verifikasi Aman"
              desc="Sistem resmi Admin Lokal."
            />
          </div>
        </div>

        {/* FORMULIR KANAN */}
        <div className="w-full lg:w-[480px] shrink-0">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 p-6 md:p-10 sticky top-24">
            <div className="text-center mb-8">
              <div className="inline-flex p-4 bg-teal-50 rounded-2xl mb-4 text-teal-600 border border-teal-100">
                <Store size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
                Daftar Seller
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">
                Lengkapi Data Lapak Anda
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              {/* ✅ AREA TERKUNCI - DIJAMIN MUNCUL MUARA JAWA */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">
                  Wilayah Operasional
                </label>
                <div className="w-full px-4 py-3 bg-teal-50 border border-teal-200 rounded-xl text-sm font-black text-teal-900 flex justify-between items-center shadow-inner">
                  <span className="flex items-center gap-2">
                    <MapIcon size={16} className="text-teal-600" />
                    {detectedMarketName || "MUARA JAWA"}
                  </span>
                  <div className="flex items-center gap-1 bg-teal-200 px-2 py-1 rounded text-[8px] font-black tracking-tighter">
                    <Lock size={8} /> AREA TERKUNCI
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <InputGroup
                  placeholder="Nama Pemilik"
                  icon={<User size={18} />}
                  value={formData.name}
                  onChange={(v) => setFormData({ ...formData, name: v })}
                />
                <InputGroup
                  placeholder="WhatsApp"
                  icon={<Smartphone size={18} />}
                  value={formData.phone}
                  onChange={(v) => setFormData({ ...formData, phone: v })}
                />
              </div>

              <InputGroup
                placeholder="Nama Toko / Lapak"
                icon={<Store size={18} />}
                value={formData.shopName}
                onChange={(v) => setFormData({ ...formData, shopName: v })}
              />

              {/* AREA MAPS */}
              <div className="space-y-2 pt-2 text-left">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Titik Koordinat Toko
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoDetect}
                    className="flex items-center gap-1 text-[9px] font-black bg-teal-50 text-teal-600 px-2 py-1 rounded-full border border-teal-100 hover:bg-teal-100 transition-all"
                  >
                    <Crosshair size={10} /> AKURASI GPS
                  </button>
                </div>

                <div className="w-full h-[280px] rounded-xl overflow-hidden border-2 border-slate-200 relative shadow-inner bg-slate-100">
                  {isLoaded ? (
                    <GoogleMap
                      mapContainerStyle={{ width: "100%", height: "100%" }}
                      center={{
                        lat: formData.latitude,
                        lng: formData.longitude,
                      }}
                      zoom={17}
                      options={{
                        disableDefaultUI: true,
                        gestureHandling: "greedy",
                        streetViewControl: false,
                      }}
                    >
                      <MarkerF
                        key={`pin-${formData.latitude}-${formData.longitude}`}
                        position={{
                          lat: formData.latitude,
                          lng: formData.longitude,
                        }}
                        draggable={true}
                        onDragEnd={(e) => {
                          if (e.latLng) {
                            setFormData((prev) => ({
                              ...prev,
                              latitude: e.latLng!.lat(),
                              longitude: e.latLng!.lng(),
                            }));
                          }
                        }}
                      />
                    </GoogleMap>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <Loader2 className="animate-spin text-teal-600" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Mengaktifkan Radar...
                      </span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-[9px] font-black text-slate-600 border shadow-sm pointer-events-none z-10 uppercase">
                    Geser Pin ke Lokasi Lapak
                  </div>
                </div>
              </div>

              <InputGroup
                placeholder="Alamat Detail (No. Lapak / Nama Jalan)"
                icon={<MapPin size={18} />}
                value={formData.address}
                onChange={(v) => setFormData({ ...formData, address: v })}
              />

              <div className="pt-2 flex flex-col gap-3 text-left">
                <InputGroup
                  type="email"
                  placeholder="Email Akun Seller"
                  icon={<Mail size={18} />}
                  value={formData.email}
                  onChange={(v) => setFormData({ ...formData, email: v })}
                />
                <InputGroup
                  type="password"
                  placeholder="Buat Password"
                  icon={<Lock size={18} />}
                  value={formData.password}
                  onChange={(v) => setFormData({ ...formData, password: v })}
                />
              </div>

              <button
                disabled={isLoading}
                className="w-full py-4 bg-orange-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    DAFTAR SEKARANG <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="py-8 md:py-10 bg-slate-50 border-t border-slate-100 text-center">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
          © 2026 PASARQU - Ekosistem Pasar Digital
        </p>
      </footer>
    </div>
  );
};

const BenefitItem = ({ icon, title, desc }: any) => (
  <div className="flex gap-5 text-left items-start">
    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-md border border-slate-50">
      {icon}
    </div>
    <div className="text-left">
      <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight leading-none mb-1.5">
        {title}
      </h3>
      <p className="text-xs text-slate-500 leading-relaxed font-medium">
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
  <div className="relative group flex-1 text-left">
    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors pointer-events-none">
      {icon}
    </div>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:border-teal-600 focus:bg-white outline-none text-sm font-bold transition-all placeholder:text-slate-300 shadow-inner text-left"
      required
    />
  </div>
);
