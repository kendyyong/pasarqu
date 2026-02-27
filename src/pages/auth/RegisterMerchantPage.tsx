import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
import {
  Eye,
  EyeOff,
  MapPin,
  Phone,
  Lock,
  Loader2,
  ChevronLeft,
  User,
  Store, // Icon Toko
  LayoutGrid, // Icon Kategori/Pasar
  ShoppingBag,
  Zap,
  ShieldCheck,
} from "lucide-react";

const mapContainerStyle = {
  width: "100%",
  height: "170px",
  borderRadius: "0px", // Sharp
};

const defaultCenter = { lat: -6.2, lng: 106.816666 };

// 🚀 FIX: SERAGAMKAN LIBRARIES GOOGLE MAPS SEPERTI FILE LAINNYA
const GOOGLE_MAPS_LIBRARIES: ("places" | "routes" | "geometry" | "drawing")[] =
  ["places", "routes", "geometry", "drawing"];

export const RegisterMerchantPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [coordinates, setCoordinates] = useState(defaultCenter);
  const [markets, setMarkets] = useState<any[]>([]); // Data Pasar

  const [formData, setFormData] = useState({
    fullName: "",
    shopName: "", // Tambahan: Nama Toko
    marketId: "", // Tambahan: Pilih Pasar
    phone: "",
    address: "",
    email: "",
    password: "",
  });

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES, // 👈 FIX: Gunakan variabel seragam di sini
  });

  // 1. Load Data Pasar saat halaman dibuka
  useEffect(() => {
    const fetchMarkets = async () => {
      const { data } = await supabase
        .from("markets")
        .select("id, name")
        .eq("is_active", true);
      if (data) setMarkets(data);
    };
    fetchMarkets();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCoordinates(newPos);
          showToast("Lokasi ditemukan!", "success");
        },
        () => showToast("Gagal akses GPS.", "error"),
      );
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- INI LOGIKA UTAMA PERBAIKANNYA ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.marketId)
      return showToast("Pilih wilayah pasar dulu!", "error");
    if (formData.password.length < 6)
      return showToast("Password minimal 6 karakter", "error");

    setLoading(true);
    try {
      const finalEmail =
        formData.email.trim() !== ""
          ? formData.email
          : `${formData.phone.replace(/\D/g, "")}@pasarqu.merchant`;

      // 1. Buat Akun Auth
      const { data, error } = await supabase.auth.signUp({
        email: finalEmail,
        password: formData.password,
        options: { data: { full_name: formData.fullName } },
      });

      if (error) throw error;

      if (data.user) {
        // 2. Buat Profil (Role: MERCHANT)
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          name: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          role: "MERCHANT", // ✅ ROLE HARUS MERCHANT
          managed_market_id: formData.marketId, // ✅ TERIKAT KE PASAR TERTENTU
          is_verified: false, // Menunggu Approval Admin
        });

        if (profileError) throw profileError;

        // 3. ✅ INSERT KE TABEL MERCHANTS
        const { error: merchantError } = await supabase
          .from("merchants")
          .insert({
            id: data.user.id, // ID Merchant = ID User (Biar gampang)
            user_id: data.user.id,
            shop_name: formData.shopName,
            market_id: formData.marketId,
            status: "PENDING", // Agar Admin bisa verifikasi nanti
            image_url: null,
          });

        if (merchantError) throw merchantError;

        showToast("Pendaftaran Berhasil! Menunggu Verifikasi.", "success");
        setTimeout(() => navigate("/waiting-approval"), 1500); // Arahkan ke halaman tunggu
      }
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white md:bg-slate-50 font-sans antialiased text-left">
      {/* HEADER */}
      <header className="bg-white border-b-2 border-teal-600 sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1 text-slate-400">
              <ChevronLeft size={22} />
            </button>
            <div className="text-xl font-black text-teal-600 tracking-tighter">
              PASARQU{" "}
              <span className="text-orange-500 text-xs tracking-widest ml-1">
                MERCHANT
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-0 md:p-6 lg:bg-teal-950">
        <div className="w-full max-w-[1100px] flex flex-col md:flex-row items-stretch justify-center bg-white md:rounded-none md:shadow-2xl overflow-hidden border-none md:border-4 md:border-white">
          {/* KOLOM KIRI */}
          <div className="hidden md:flex md:w-1/2 bg-teal-600 p-12 flex-col justify-center text-white space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10">
              <Store size={300} />
            </div>
            <div className="relative z-10">
              <h2 className="text-5xl font-black leading-none uppercase tracking-tighter mb-4">
                Buka Lapak <br /> Digital Anda
              </h2>
              <div className="space-y-6 mt-10">
                <FeatureItem
                  icon={<Zap size={20} />}
                  title="Jangkauan Luas"
                  desc="Produk Anda dilihat ribuan pelanggan di area pasar."
                />
                <FeatureItem
                  icon={<ShieldCheck size={20} />}
                  title="Manajemen Stok"
                  desc="Atur stok dan harga semudah update status WA."
                />
                <FeatureItem
                  icon={<MapPin size={20} />}
                  title="Kurir Siap Antar"
                  desc="Tidak perlu pusing cari kurir, kami yang sediakan."
                />
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: FORMULIR */}
          <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center">
            <div className="space-y-4">
              <div className="border-l-4 border-orange-500 pl-3">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                  Registrasi Mitra
                </h3>
                <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mt-1">
                  Mulai berjualan dalam 2 menit
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-3">
                {/* NAMA PEMILIK */}
                <div className="relative">
                  <User
                    className="absolute left-4 top-3.5 text-teal-600"
                    size={16}
                  />
                  <input
                    required
                    name="fullName"
                    placeholder="NAMA PEMILIK"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-none py-3.5 pl-12 pr-4 text-sm font-black text-slate-800 focus:border-teal-600 outline-none transition-all uppercase"
                  />
                </div>

                {/* NAMA TOKO */}
                <div className="relative">
                  <Store
                    className="absolute left-4 top-3.5 text-teal-600"
                    size={16}
                  />
                  <input
                    required
                    name="shopName"
                    placeholder="NAMA TOKO / LAPAK"
                    value={formData.shopName}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-none py-3.5 pl-12 pr-4 text-sm font-black text-slate-800 focus:border-teal-600 outline-none transition-all uppercase"
                  />
                </div>

                {/* PILIH PASAR */}
                <div className="relative">
                  <LayoutGrid
                    className="absolute left-4 top-3.5 text-teal-600"
                    size={16}
                  />
                  <select
                    required
                    name="marketId"
                    value={formData.marketId}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-none py-3.5 pl-12 pr-4 text-sm font-black text-slate-800 focus:border-teal-600 outline-none transition-all uppercase appearance-none"
                  >
                    <option value="">-- PILIH WILAYAH PASAR --</option>
                    {markets.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* WHATSAPP */}
                <div className="relative">
                  <Phone
                    className="absolute left-4 top-3.5 text-teal-600"
                    size={16}
                  />
                  <input
                    required
                    type="tel"
                    name="phone"
                    placeholder="NOMOR WHATSAPP"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-none py-3.5 pl-12 pr-4 text-sm font-black text-slate-800 focus:border-teal-600 outline-none transition-all"
                  />
                </div>

                {/* MAPS & ALAMAT */}
                <div className="bg-slate-50 p-2 border-2 border-slate-200">
                  <div className="flex justify-between items-center mb-2 px-1">
                    <label className="text-[9px] font-black text-teal-600 uppercase flex items-center gap-1">
                      <MapPin size={12} /> LOKASI LAPAK
                    </label>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      className="text-[8px] font-black text-white bg-teal-600 px-3 py-1 rounded-none uppercase"
                    >
                      AUTO GPS
                    </button>
                  </div>
                  {isLoaded && (
                    <div className="border border-slate-300">
                      <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={coordinates}
                        zoom={16}
                        options={{
                          disableDefaultUI: true,
                          gestureHandling: "greedy",
                        }}
                      >
                        <MarkerF
                          position={coordinates}
                          draggable={true}
                          onDragEnd={(e) =>
                            e.latLng &&
                            setCoordinates({
                              lat: e.latLng.lat(),
                              lng: e.latLng.lng(),
                            })
                          }
                        />
                      </GoogleMap>
                    </div>
                  )}
                  <textarea
                    required
                    name="address"
                    placeholder="ALAMAT LENGKAP (JALAN, BLOK, NOMOR KIOS)..."
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full mt-2 bg-white border border-slate-300 p-2 text-xs font-bold text-slate-800 focus:border-teal-600 outline-none h-16 resize-none uppercase"
                  />
                </div>

                {/* PASSWORD */}
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-3.5 text-teal-600"
                    size={16}
                  />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="PASSWORD (MIN. 6 DIGIT)"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-none py-3.5 pl-12 pr-12 text-sm font-black text-slate-800 focus:border-teal-600 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-teal-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 text-white font-black py-5 rounded-none shadow-xl hover:bg-teal-600 active:scale-95 transition-all uppercase text-xs tracking-[0.4em] flex items-center justify-center gap-2 mt-4"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "DAFTAR SEBAGAI MITRA"
                  )}
                </button>
              </form>

              <div className="text-center pt-4 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Mau Belanja?{" "}
                  <Link to="/register" className="text-teal-600 underline ml-1">
                    Daftar Akun Pembeli
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const FeatureItem = ({
  icon,
  title,
  desc,
}: {
  icon: any;
  title: string;
  desc: string;
}) => (
  <div className="flex gap-4 items-start animate-in slide-in-from-left-10 duration-700">
    <div className="bg-white/20 p-3 rounded-none border border-white/30 text-white shadow-lg">
      {icon}
    </div>
    <div>
      <h4 className="font-black uppercase tracking-widest text-sm leading-none mb-1">
        {title}
      </h4>
      <p className="text-teal-50 text-[11px] font-bold opacity-80 leading-relaxed">
        {desc}
      </p>
    </div>
  </div>
);
