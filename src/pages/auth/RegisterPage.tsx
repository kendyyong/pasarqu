import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
import {
  Eye,
  EyeOff,
  MapPin,
  Phone,
  Mail,
  Lock,
  Loader2,
  Navigation,
  ChevronLeft,
} from "lucide-react";

// Style Map
const mapContainerStyle = {
  width: "100%",
  height: "200px",
  borderRadius: "8px",
};
const defaultCenter = { lat: -6.2, lng: 106.816666 };

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // 1. TANGKAP PARAMETER REDIRECT (KUNCI UTAMA)
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get("redirect"); // Isinya akan "checkout" jika dari keranjang

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
          setCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          showToast("Lokasi terkunci akurat!", "success");
        },
        () => showToast("Aktifkan GPS untuk akurasi pengiriman", "error"),
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
        throw new Error("Password min. 6 karakter");

      const finalEmail =
        formData.email.trim() !== ""
          ? formData.email
          : `${formData.phone.replace(/\D/g, "")}@pasarqu.user`;

      // 1. Daftar Auth
      const { data, error } = await supabase.auth.signUp({
        email: finalEmail,
        password: formData.password,
        options: { data: { full_name: formData.fullName } },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          showToast("Akun sudah ada. Silakan Login.", "info");
          // Redirect login juga harus membawa parameter checkout
          navigate(`/login?redirect=${redirectTarget || ""}`);
          return;
        }
        throw error;
      }

      // 2. Simpan Data Profil
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

        showToast("Registrasi Berhasil!", "success");

        // 3. LOGIKA REDIRECT (PERBAIKAN DI SINI)
        if (redirectTarget === "checkout") {
          // Beri jeda sedikit agar toast terbaca, lalu lempar ke Checkout
          showToast("Mengalihkan ke pembayaran...", "info");
          setTimeout(() => {
            navigate("/checkout"); // KE HALAMAN PEMBAYARAN
          }, 1000);
        } else {
          // Jika daftar biasa, baru ke Beranda
          setTimeout(() => {
            navigate("/"); // KE HALAMAN BERANDA
          }, 1500);
        }
      }
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      {/* HEADER */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="md:hidden text-slate-500"
            >
              <ChevronLeft />
            </button>
            <div
              onClick={() => navigate("/")}
              className="text-2xl font-black text-teal-600 tracking-tighter italic cursor-pointer"
            >
              PASARQU
            </div>
            <h1 className="hidden md:block text-xl text-slate-800 font-medium ml-4">
              {redirectTarget === "checkout"
                ? "Lengkapi Data Pengiriman"
                : "Daftar Akun"}
            </h1>
          </div>
          <Link
            to="/help"
            className="text-teal-600 text-sm font-bold hover:underline"
          >
            Bantuan
          </Link>
        </div>
      </header>

      {/* BODY */}
      <div
        className="flex-1 flex items-center justify-center md:py-10"
        style={{
          background:
            window.innerWidth >= 768
              ? "linear-gradient(135deg, #0d9488 0%, #115e59 100%)"
              : "#FFFFFF",
        }}
      >
        <div className="w-full max-w-[1040px] flex items-start justify-center lg:justify-between px-4">
          {/* Slogan Desktop */}
          <div className="hidden lg:flex flex-col justify-center min-h-[480px] text-white max-w-[500px] animate-in slide-in-from-left-10 duration-700">
            <h2 className="text-5xl font-black leading-tight mb-6">
              Belanja Cepat <br /> Tanpa Ribet
            </h2>
            <p className="text-lg opacity-90 font-medium leading-relaxed">
              Satu akun untuk semua kebutuhan pasar Anda. Daftar sekarang dan
              nikmati pengiriman instan.
            </p>
          </div>

          {/* Form Card */}
          <div className="w-full max-w-[420px] bg-white rounded-none md:rounded-lg shadow-none md:shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-0 md:p-8 space-y-6">
              <div className="hidden md:flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-800">Data Diri</h3>
                {redirectTarget === "checkout" && (
                  <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-1 rounded font-bold uppercase">
                    Mode Belanja
                  </span>
                )}
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                {/* Nama */}
                <div className="space-y-1">
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Nama Lengkap"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-sm focus:border-teal-600 outline-none text-sm transition-all"
                    required
                  />
                </div>

                {/* Ponsel */}
                <div className="space-y-1">
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Nomor Telepon/WA"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-sm focus:border-teal-600 outline-none text-sm transition-all"
                    required
                  />
                </div>

                {/* Peta Google Maps */}
                <div className="space-y-2 border border-slate-200 p-3 rounded-sm bg-slate-50">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                      <MapPin size={12} /> Titik Lokasi Pengiriman
                    </label>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      className="text-[10px] font-bold text-teal-600 border border-teal-600 px-2 py-1 rounded hover:bg-teal-50 flex items-center gap-1"
                    >
                      <Navigation size={10} /> GPS Otomatis
                    </button>
                  </div>
                  {isLoaded ? (
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={coordinates}
                      zoom={15}
                      onClick={(e) =>
                        e.latLng &&
                        setCoordinates({
                          lat: e.latLng.lat(),
                          lng: e.latLng.lng(),
                        })
                      }
                      options={{
                        disableDefaultUI: true,
                        gestureHandling: "cooperative",
                      }}
                    >
                      <Marker
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
                  ) : (
                    <div className="h-[200px] bg-slate-200 flex items-center justify-center text-xs text-slate-500">
                      Memuat Peta...
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 italic text-center">
                    * Pastikan pin merah sesuai lokasi rumah
                  </p>
                </div>

                {/* Alamat Text */}
                <div className="space-y-1">
                  <textarea
                    name="address"
                    placeholder="Detail Alamat (Jalan, No. Rumah, Patokan)"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-sm focus:border-teal-600 outline-none text-sm transition-all resize-none h-20"
                    required
                  />
                </div>

                {/* Email (Opsional) */}
                <div className="space-y-1">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email (Opsional)"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-sm focus:border-teal-600 outline-none text-sm transition-all"
                  />
                </div>

                {/* Password */}
                <div className="relative group space-y-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-sm focus:border-teal-600 outline-none text-sm transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Tombol Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-teal-600 text-white font-bold py-3.5 rounded-sm shadow hover:bg-teal-700 active:scale-95 transition-all uppercase text-sm mt-4 tracking-wide"
                >
                  {loading ? (
                    <Loader2 className="animate-spin mx-auto" />
                  ) : redirectTarget === "checkout" ? (
                    "SIMPAN & BAYAR"
                  ) : (
                    "DAFTAR SEKARANG"
                  )}
                </button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-slate-400">Sudah punya akun? </span>
                <Link
                  to={`/login?redirect=${redirectTarget || ""}`}
                  className="text-teal-600 font-bold hover:underline"
                >
                  Log in
                </Link>
              </div>

              <div className="md:hidden mt-8 text-center text-[10px] text-slate-400 px-4">
                Dengan mendaftar, Anda menyetujui Ketentuan Layanan Pasarqu.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
