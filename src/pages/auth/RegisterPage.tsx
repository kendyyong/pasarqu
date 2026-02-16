import React, { useState, useEffect } from "react";
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
} from "lucide-react";

const mapContainerStyle = {
  width: "100%",
  height: "200px",
  borderRadius: "16px",
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
          showToast("Lokasi akurat terkunci!", "success");
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
          email: formData.email || null,
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          role: "CUSTOMER",
          is_verified: true,
        });

        if (profileError) throw profileError;
        showToast("Pendaftaran Berhasil!", "success");

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
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans antialiased text-left italic">
      {/* HEADER */}
      <header className="bg-white border-b-2 border-teal-600 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-slate-400 active:scale-90 transition-transform"
            >
              <ChevronLeft size={24} />
            </button>
            <div
              onClick={() => navigate("/")}
              className="text-2xl font-black text-teal-600 tracking-tighter italic cursor-pointer"
            >
              PASARQU
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 md:p-10 bg-slate-50 lg:bg-teal-950">
        <div className="w-full max-w-[1000px] flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="hidden lg:block text-white max-w-md space-y-6">
            <h2 className="text-6xl font-black leading-tight uppercase tracking-tighter">
              Gabung <br /> Sekarang.
            </h2>
            <p className="text-lg text-teal-100 opacity-80 font-bold uppercase tracking-wider">
              Nikmati akses belanja pasar tradisional dalam genggaman.
            </p>
          </div>

          {/* FORM CARD */}
          <div className="w-full max-w-[440px] bg-white rounded-[3rem] shadow-2xl border-4 border-white overflow-hidden animate-in zoom-in-95 duration-300 mb-20 md:mb-0">
            <div className="p-8 md:p-10 space-y-6">
              <div className="border-l-8 border-teal-600 pl-4 mb-4">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                  Pendaftaran
                </h3>
              </div>

              {/* ✅ 1. TOMBOL GOOGLE DI PALING ATAS */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center italic">
                  Cepat & Instan
                </p>
                <GoogleLoginButton />
              </div>

              {/* Garis Pemisah */}
              <div className="relative my-8 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-slate-100"></div>
                </div>
                <span className="relative bg-white px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                  Atau Isi Manual
                </span>
              </div>

              {/* Form Isian Manual */}
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-900 uppercase ml-4 tracking-[0.2em]">
                    Nama Lengkap
                  </label>
                  <div className="relative group">
                    <User
                      className="absolute left-5 top-4 text-teal-600"
                      size={18}
                    />
                    <input
                      required
                      name="fullName"
                      placeholder="NAMA LENGKAP"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full bg-teal-50/50 border-2 border-teal-600 rounded-2xl py-4 pl-14 pr-6 text-sm font-black text-slate-800 focus:bg-white focus:ring-4 focus:ring-teal-500/20 outline-none transition-all uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-900 uppercase ml-4 tracking-[0.2em]">
                    WhatsApp
                  </label>
                  <div className="relative group">
                    <Phone
                      className="absolute left-5 top-4 text-teal-600"
                      size={18}
                    />
                    <input
                      required
                      type="tel"
                      name="phone"
                      placeholder="NOMOR HP AKTIF"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-teal-50/50 border-2 border-teal-600 rounded-2xl py-4 pl-14 pr-6 text-sm font-black text-slate-800 focus:bg-white focus:ring-4 focus:ring-teal-500/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="bg-teal-600 p-1 rounded-3xl shadow-lg">
                  <div className="bg-white p-4 rounded-[1.6rem] space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black text-teal-600 uppercase tracking-widest flex items-center gap-2">
                        <MapPin size={14} className="text-red-600" /> Lokasi
                        Rumah
                      </label>
                      <button
                        type="button"
                        onClick={getCurrentLocation}
                        className="text-[9px] font-black text-white bg-teal-600 px-4 py-2 rounded-full flex items-center gap-1 uppercase hover:bg-slate-900 transition-all shadow-md"
                      >
                        <Navigation size={10} /> GPS AUTO
                      </button>
                    </div>

                    {isLoaded ? (
                      <div className="rounded-xl overflow-hidden border-2 border-teal-100 shadow-inner">
                        <GoogleMap
                          mapContainerStyle={mapContainerStyle}
                          center={coordinates}
                          zoom={15}
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
                      <div className="h-[200px] bg-slate-100 rounded-xl flex items-center justify-center text-xs font-black text-teal-600 uppercase">
                        Mencari Koordinat...
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-900 uppercase ml-4 tracking-[0.2em]">
                    Detail Alamat Rumah
                  </label>
                  <textarea
                    required
                    name="address"
                    placeholder="DETAIL ALAMAT (RT/RW, PATOKAN)"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full bg-teal-50/50 border-2 border-teal-600 rounded-2xl py-4 px-6 text-sm font-black text-slate-800 focus:bg-white focus:ring-4 focus:ring-teal-500/20 outline-none h-24 resize-none transition-all uppercase"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-900 uppercase ml-4 tracking-[0.2em]">
                    Password
                  </label>
                  <div className="relative group">
                    <Lock
                      className="absolute left-5 top-4 text-teal-600"
                      size={18}
                    />
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="MIN. 6 DIGIT"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full bg-teal-50/50 border-2 border-teal-600 rounded-2xl py-4 pl-14 pr-12 text-sm font-black text-slate-800 focus:bg-white focus:ring-4 focus:ring-teal-500/20 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-4 text-teal-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 text-white font-black py-5 rounded-[2rem] shadow-2xl hover:bg-teal-600 active:scale-95 transition-all uppercase text-sm tracking-[0.4em] flex items-center justify-center gap-3 mt-4"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : redirectTarget === "checkout" ? (
                    "SIMPAN & BAYAR"
                  ) : (
                    "DAFTAR SEKARANG"
                  )}
                </button>
              </form>

              <div className="text-center pt-6 border-t border-slate-50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Sudah Ada Akun?{" "}
                  <Link
                    to={`/login?redirect=${redirectTarget || ""}`}
                    className="text-teal-600 hover:text-slate-900 underline ml-1"
                  >
                    Login Di Sini
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
