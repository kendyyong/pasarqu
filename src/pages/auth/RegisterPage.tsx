import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
import { GoogleLoginButton } from "../../components/GoogleLoginButton";
import {
  Eye,
  EyeOff,
  MapPin,
  Phone,
  Lock,
  Loader2,
  Navigation,
  ChevronLeft,
  User,
  ShoppingBag,
  Zap,
  ShieldCheck,
} from "lucide-react";

const mapContainerStyle = {
  width: "100%",
  height: "170px",
  borderRadius: "12px",
};

const defaultCenter = { lat: -6.2, lng: 106.816666 };

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get("redirect");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [coordinates, setCoordinates] = useState(defaultCenter);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    email: "",
    password: "",
  });

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (formData.password.length < 6)
        throw new Error("Password minimal 6 karakter");
      const finalEmail =
        formData.email.trim() !== ""
          ? formData.email
          : `${formData.phone.replace(/\D/g, "")}@pasarqu.user`;

      const { data, error } = await supabase.auth.signUp({
        email: finalEmail,
        password: formData.password,
        options: { data: { full_name: formData.fullName } },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          showToast("Akun sudah ada. Silakan login.", "info");
          navigate(`/login?redirect=${redirectTarget || ""}`);
          return;
        }
        throw error;
      }

      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          name: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          role: "CUSTOMER",
          is_verified: true,
        });
        if (profileError) throw profileError;
        showToast("Daftar Berhasil!", "success");
        if (redirectTarget === "checkout") {
          setTimeout(() => navigate("/?openCheckout=true"), 1000);
        } else {
          setTimeout(() => navigate("/"), 1500);
        }
      }
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white md:bg-slate-50 font-sans antialiased text-left">
      {/* HEADER - TULISAN PASARQU DIBUAT LURUS */}
      <header className="bg-white border-b-2 border-teal-600 sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1 text-slate-400">
              <ChevronLeft size={22} />
            </button>
            <div
              onClick={() => navigate("/")}
              className="text-xl font-black text-teal-600 tracking-tighter cursor-pointer"
            >
              PASARQU
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-0 md:p-6 lg:bg-teal-950">
        <div className="w-full max-w-[1100px] flex flex-col md:flex-row items-stretch justify-center bg-white md:rounded-[3rem] md:shadow-2xl overflow-hidden border-none md:border-4 md:border-white">
          {/* KOLOM KIRI: KEUNGGULAN (Hanya Desktop) - TANPA ITALIC */}
          <div className="hidden md:flex md:w-1/2 bg-teal-600 p-12 flex-col justify-center text-white space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10">
              <ShoppingBag size={300} />
            </div>

            <div className="relative z-10">
              <h2 className="text-5xl font-black leading-none uppercase tracking-tighter mb-4">
                Kenapa Harus <br /> Jadi Member?
              </h2>
              <div className="space-y-6 mt-10">
                <FeatureItem
                  icon={<Zap size={20} />}
                  title="Belanja Kilat"
                  desc="Data alamat tersimpan, checkout cuma butuh 2 klik."
                />
                <FeatureItem
                  icon={<ShieldCheck size={20} />}
                  title="Transaksi Aman"
                  desc="Sistem pembayaran terverifikasi dan saldo aman."
                />
                <FeatureItem
                  icon={<MapPin size={20} />}
                  title="Titik Presisi"
                  desc="Kurir pasti sampai depan rumah tanpa tanya-tanya."
                />
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: FORMULIR */}
          <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center">
            <div className="space-y-4">
              <div className="border-l-4 border-teal-600 pl-3">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                  Pendaftaran
                </h3>
                <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mt-1">
                  Lengkapi data pengiriman Anda
                </p>
              </div>

              {/* GOOGLE SECTION */}
              <div className="space-y-1">
                <GoogleLoginButton />
                <div className="relative py-2 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100"></div>
                  </div>
                  <span className="relative bg-white px-3 text-[8px] font-black text-slate-400 uppercase">
                    Atau Isi Manual
                  </span>
                </div>
              </div>

              <form onSubmit={handleRegister} className="space-y-3">
                {/* NAMA */}
                <div className="relative">
                  <User
                    className="absolute left-4 top-3.5 text-teal-600"
                    size={16}
                  />
                  <input
                    required
                    name="fullName"
                    placeholder="NAMA LENGKAP"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full bg-teal-50/50 border-2 border-teal-600 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-black text-slate-800 focus:bg-white outline-none transition-all uppercase"
                  />
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
                    className="w-full bg-teal-50/50 border-2 border-teal-600 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-black text-slate-800 focus:bg-white outline-none transition-all"
                  />
                </div>

                {/* MAPS AREA */}
                <div className="bg-teal-600 p-0.5 rounded-2xl shadow-sm">
                  <div className="bg-white p-3 rounded-[0.9rem] space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[9px] font-black text-teal-600 uppercase flex items-center gap-1">
                        <MapPin size={12} className="text-red-600" /> Tandai
                        Titik Rumah
                      </label>
                      <button
                        type="button"
                        onClick={getCurrentLocation}
                        className="text-[8px] font-black text-white bg-teal-600 px-3 py-1 rounded-full uppercase"
                      >
                        AUTO GPS
                      </button>
                    </div>
                    {isLoaded ? (
                      <div className="rounded-xl overflow-hidden border-2 border-teal-50 shadow-inner">
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
                    ) : (
                      <div className="h-[120px] bg-slate-50 rounded-xl flex items-center justify-center text-[9px] font-black text-teal-600 uppercase">
                        Loading Map...
                      </div>
                    )}
                  </div>
                </div>

                {/* ALAMAT TEXT */}
                <textarea
                  required
                  name="address"
                  placeholder="DETAIL ALAMAT (RT/RW, PATOKAN)..."
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full bg-teal-50/50 border-2 border-teal-600 rounded-2xl py-3 px-4 text-sm font-black text-slate-800 focus:bg-white outline-none h-20 resize-none transition-all uppercase leading-tight"
                />

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
                    placeholder="PASSWORD MIN. 6 DIGIT"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-teal-50/50 border-2 border-teal-600 rounded-2xl py-3.5 pl-12 pr-12 text-sm font-black text-slate-800 focus:bg-white outline-none transition-all"
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
                  className="w-full bg-slate-900 text-white font-black py-5 rounded-[2rem] shadow-xl hover:bg-teal-600 active:scale-95 transition-all uppercase text-xs tracking-[0.4em] flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : redirectTarget === "checkout" ? (
                    "SIMPAN & LANJUT BAYAR"
                  ) : (
                    "DAFTAR SEKARANG"
                  )}
                </button>
              </form>

              <div className="text-center pt-4 border-t border-slate-50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">
                  Sudah Member?{" "}
                  <Link
                    to={`/login?redirect=${redirectTarget || ""}`}
                    className="text-teal-600 underline ml-1"
                  >
                    Login Sekarang
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

// Komponen Kecil Keunggulan - TANPA ITALIC
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
    <div className="bg-white/20 p-3 rounded-xl border border-white/30 text-white shadow-lg">
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
