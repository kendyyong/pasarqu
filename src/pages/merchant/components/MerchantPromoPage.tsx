import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useToast } from "../../../contexts/ToastContext";
import { useMarket } from "../../../contexts/MarketContext";
import { useNavigate } from "react-router-dom";
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
  Autocomplete,
} from "@react-google-maps/api";
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
  BarChart3,
  Zap,
  Globe,
  Crosshair,
} from "lucide-react";

// 🚀 FIX: SERAGAMKAN LIBRARIES GOOGLE MAPS AGAR TIDAK CRASH (BLANK PUTIH)
const GOOGLE_MAPS_LIBRARIES: ("places" | "routes" | "geometry" | "drawing")[] =
  ["places", "routes", "geometry", "drawing"];

export const MerchantPromoPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { selectedMarket } = useMarket() as any;

  // 🚀 FIX: Gunakan variabel seragam GOOGLE_MAPS_LIBRARIES
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    shopName: "",
    address: "",
    market_id: "",
    latitude: -6.2,
    longitude: 106.8,
  });

  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);

  const handlePlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const newLat = place.geometry.location.lat();
        const newLng = place.geometry.location.lng();
        const newAddress = place.formatted_address || place.name || "";

        setFormData((prev) => ({
          ...prev,
          latitude: newLat,
          longitude: newLng,
          address: newAddress,
        }));
        showToast("Titik peta otomatis disesuaikan!", "success");
      }
    }
  };

  const getAddressFromLatLng = async (lat: number, lng: number) => {
    if (!window.google) return;
    const geocoder = new window.google.maps.Geocoder();

    try {
      const response = await geocoder.geocode({ location: { lat, lng } });
      if (response.results && response.results.length > 0) {
        const formattedAddress = response.results[0].formatted_address;
        setFormData((prev) => ({ ...prev, address: formattedAddress }));
      }
    } catch (error) {
      console.warn("Gagal mendeteksi teks alamat dari Google Maps:", error);
    }
  };

  useEffect(() => {
    const finalMarketId =
      selectedMarket?.id || localStorage.getItem("active_market_id") || "";

    if (finalMarketId) {
      setFormData((prev) => ({ ...prev, market_id: finalMarketId }));

      const syncMap = async () => {
        try {
          const { data } = await supabase
            .from("markets")
            .select("latitude, longitude")
            .eq("id", finalMarketId)
            .maybeSingle();

          if (data) {
            setFormData((prev) => ({
              ...prev,
              latitude: Number(data.latitude) || -6.2,
              longitude: Number(data.longitude) || 106.8,
            }));
          }
        } catch (err) {
          console.warn("Gagal sinkronisasi peta pasar.");
        }
      };
      syncMap();
    }
  }, [selectedMarket]);

  const handleAutoDetect = () => {
    if (navigator.geolocation) {
      showToast("Mendeteksi lokasi GPS Anda...", "success");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLat = Number(position.coords.latitude);
          const newLng = Number(position.coords.longitude);

          setFormData((prev) => ({
            ...prev,
            latitude: newLat,
            longitude: newLng,
          }));

          getAddressFromLatLng(newLat, newLng);
          showToast("Akurasi GPS Berhasil!", "success");
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
      const activeMarketId =
        formData.market_id ||
        selectedMarket?.id ||
        localStorage.getItem("active_market_id");

      if (!activeMarketId) {
        throw new Error(
          "Gagal mengidentifikasi pasar. Pastikan Anda masuk melalui Pilihan Pasar di Beranda.",
        );
      }

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
          managed_market_id: activeMarketId,
          created_at: new Date().toISOString(),
        });

        if (profileError) throw profileError;

        const { error: merchantError } = await supabase
          .from("merchants")
          .upsert({
            id: data.user.id,
            owner_name: formData.name,
            shop_name: formData.shopName,
            phone_number: formData.phone,
            address: formData.address,
            market_id: activeMarketId,
            is_verified: false,
            latitude: formData.latitude,
            longitude: formData.longitude,
            created_at: new Date().toISOString(),
          });

        if (merchantError) {
          console.error("Gagal simpan ke merchants:", merchantError);
        }

        showToast(
          "Toko terdaftar! Sambil menunggu verifikasi, Anda bisa berbelanja.",
          "success",
        );
        setTimeout(() => navigate("/"), 2000);
      }
    } catch (err: any) {
      showToast(err.message, "error");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#004d4d] via-[#003333] to-[#002222] flex flex-col font-sans text-left relative overflow-x-hidden">
      {/* DEKORASI LATAR BELAKANG */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      ></div>
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#008080]/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#FF6600]/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>

      <nav className="border-b border-white/10 sticky top-0 bg-[#002222]/80 backdrop-blur-lg z-50 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div
            onClick={() => navigate("/")}
            className="cursor-pointer flex items-center"
          >
            <img
              src="/logo-text.png"
              alt="PasarQu"
              className="h-8 md:h-10 w-auto object-contain"
              style={{
                filter:
                  "drop-shadow(1px 1px 0px white) drop-shadow(-1px -1px 0px white) drop-shadow(1px -1px 0px white) drop-shadow(-1px 1px 0px white)",
              }}
            />
          </div>
          <button
            onClick={() => navigate("/login")}
            className="text-white/70 hover:text-white flex items-center gap-1 font-black uppercase tracking-widest text-[10px] md:text-[12px] bg-white/5 px-3 py-1.5 rounded-full border border-white/10 transition-all active:scale-95"
          >
            <ChevronLeft size={16} />{" "}
            <span className="hidden md:block">KEMBALI KE LOGIN</span>
            <span className="md:hidden">KEMBALI</span>
          </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col lg:flex-row max-w-[1200px] mx-auto w-full p-0 md:p-12 gap-6 lg:gap-20 justify-center relative z-10 mt-6 md:mt-0">
        <div className="hidden lg:block flex-1 space-y-10 text-left pt-4">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-[#FF6600]/20 text-[#FF6600] px-4 py-1.5 rounded-full border border-[#FF6600]/30 shadow-inner">
              <Star size={14} fill="currentColor" />
              <span className="text-xs font-black uppercase tracking-widest">
                Kesempatan Terbatas
              </span>
            </div>
            <h1 className="text-5xl font-black text-white leading-[1.1] uppercase tracking-tighter">
              Buka Toko Digital, <br />
              <span className="text-[#FF6600]">Jangkau Satu Wilayah.</span>
            </h1>
            <p className="text-lg text-teal-100/70 leading-relaxed max-w-md font-bold tracking-wide">
              Daftarkan lapak Anda sekarang. Kelola stok, harga, dan pesanan
              pelanggan pasar secara otomatis dalam satu genggaman.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <BenefitItem
              icon={<BarChart3 className="text-[#008080]" />}
              title="Analisis Akurat"
              desc="Pantau performa harian."
            />
            <BenefitItem
              icon={<Zap className="text-[#FF6600]" />}
              title="Pencairan Cepat"
              desc="Tarik hasil jualan harian."
            />
            <BenefitItem
              icon={<Globe className="text-blue-500" />}
              title="Jangkauan Luas"
              desc="Tampil di seluruh aplikasi warga."
            />
            <BenefitItem
              icon={<ShieldCheck className="text-green-500" />}
              title="Verifikasi Aman"
              desc="Sistem resmi Admin Lokal."
            />
          </div>
        </div>

        <div className="w-full lg:w-[480px] shrink-0 mt-4 md:mt-0">
          <div className="bg-white/95 backdrop-blur-xl rounded-t-[2.5rem] md:rounded-[2rem] shadow-[0_-10px_40px_rgba(0,128,128,0.15)] md:shadow-2xl md:shadow-teal-900/40 border-t md:border border-white/50 p-6 md:p-10 sticky top-24 min-h-[80vh] md:min-h-0">
            <div className="text-center mb-8 pt-2 md:pt-0">
              <div className="inline-flex p-4 bg-teal-50 rounded-2xl mb-4 text-[#008080] border border-teal-100 shadow-sm">
                <Store size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">
                Daftar Seller
              </h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                Lengkapi Data Lapak Anda
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3 text-left">
                <InputGroup
                  placeholder="Nama Pemilik"
                  icon={<User size={16} />}
                  value={formData.name}
                  onChange={(v) => setFormData({ ...formData, name: v })}
                />
                <InputGroup
                  placeholder="No. WhatsApp"
                  icon={<Smartphone size={16} />}
                  value={formData.phone}
                  onChange={(v) => setFormData({ ...formData, phone: v })}
                  type="tel"
                />
              </div>

              <InputGroup
                placeholder="Nama Toko / Lapak"
                icon={<Store size={16} />}
                value={formData.shopName}
                onChange={(v) => setFormData({ ...formData, shopName: v })}
              />

              <div className="space-y-2 pt-2 text-left">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Peta Lapak Anda
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoDetect}
                    className="flex items-center gap-1 text-[9px] font-black bg-teal-50 text-[#008080] px-3 py-1.5 rounded-full border border-teal-200 hover:bg-teal-100 transition-all shadow-sm active:scale-95 uppercase tracking-widest"
                  >
                    <Crosshair size={10} /> Akurasi GPS
                  </button>
                </div>

                {isLoaded ? (
                  <Autocomplete
                    onLoad={(autoC) => setAutocomplete(autoC)}
                    onPlaceChanged={handlePlaceChanged}
                  >
                    <div className="relative group flex-1 text-left mb-3">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#008080] transition-colors pointer-events-none z-10">
                        <MapPin size={16} />
                      </div>
                      <input
                        type="text"
                        placeholder="Ketik Alamat atau Patokan..."
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        className="w-full pl-[3.25rem] pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 focus:bg-white outline-none text-[12px] font-bold transition-all placeholder:text-slate-400 shadow-inner text-left text-slate-800"
                        required
                      />
                    </div>
                  </Autocomplete>
                ) : (
                  <div className="w-full bg-slate-100 h-14 rounded-xl animate-pulse" />
                )}

                <div className="w-full h-[200px] md:h-[280px] rounded-xl overflow-hidden border border-slate-200 relative shadow-inner bg-slate-100 mt-2">
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
                            const newLat = e.latLng.lat();
                            const newLng = e.latLng.lng();

                            setFormData((prev) => ({
                              ...prev,
                              latitude: newLat,
                              longitude: newLng,
                            }));

                            getAddressFromLatLng(newLat, newLng);
                          }
                        }}
                      />
                    </GoogleMap>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <Loader2 className="animate-spin text-[#008080]" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Memuat Peta Pintar...
                      </span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] font-black text-slate-700 border shadow-sm pointer-events-none z-10 uppercase tracking-widest">
                    Geser Pin ke Lapak
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-3 text-left">
                <InputGroup
                  type="email"
                  placeholder="Email Akun Seller"
                  icon={<Mail size={16} />}
                  value={formData.email}
                  onChange={(v) => setFormData({ ...formData, email: v })}
                />
                <InputGroup
                  type="password"
                  placeholder="Buat Password"
                  icon={<Lock size={16} />}
                  value={formData.password}
                  onChange={(v) => setFormData({ ...formData, password: v })}
                />
              </div>

              <button
                disabled={isLoading}
                className="w-full py-3.5 bg-[#FF6600] text-white rounded-xl font-[1000] text-[12px] uppercase tracking-wide shadow-md shadow-orange-500/20 hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 border border-orange-400 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={16} />
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

      <footer className="py-6 border-t border-white/10 text-center relative z-10 mt-0 md:mt-10">
        <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em] leading-none">
          © 2026 PASARQU - Ekosistem Pasar Digital
        </p>
      </footer>
    </div>
  );
};

const BenefitItem = ({ icon, title, desc }: any) => (
  <div className="flex gap-4 text-left items-start group">
    <div className="w-12 h-12 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 border border-white/10 group-hover:bg-white/10 transition-colors">
      {icon}
    </div>
    <div className="text-left pt-0.5">
      <h3 className="font-[1000] text-white text-[14px] uppercase tracking-tighter leading-none mb-1.5">
        {title}
      </h3>
      <p className="text-[11px] text-teal-100/50 font-bold uppercase tracking-wider leading-relaxed">
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
    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#008080] transition-colors pointer-events-none">
      {icon}
    </div>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-[3.25rem] pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 focus:bg-white outline-none text-[12px] font-bold transition-all placeholder:text-slate-400 shadow-inner text-left text-slate-800"
      required
    />
  </div>
);

export default MerchantPromoPage;
