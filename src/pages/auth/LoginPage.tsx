import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  User,
  Store,
  Bike,
} from "lucide-react";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ identifier: "", password: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🚀 1. VALIDASI AWAL KETAT
    const input = formData.identifier.trim();
    const pwd = formData.password;

    if (!input || !pwd) {
      return showToast("Mohon isi Email/No.HP dan Password!", "error");
    }

    setLoading(true);

    try {
      let finalEmailForAuth = input;

      // 🚀 2. LOGIKA SMART LOOKUP (DUAL LOGIN)
      const isEmail = input.includes("@");

      if (!isEmail) {
        // Bersihkan input (Hanya ambil angka)
        let cleanPhone = input.replace(/\D/g, "");
        let basePhone = cleanPhone;

        // Normalisasi nomor HP (hapus 0 atau 62 di depan)
        if (basePhone.startsWith("0")) basePhone = basePhone.substring(1);
        if (basePhone.startsWith("62")) basePhone = basePhone.substring(2);

        if (!basePhone) {
          showToast("Format Nomor HP tidak valid!", "error");
          setLoading(false);
          return;
        }

        // Cari email asli di tabel profiles berdasarkan nomor HP
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .or(
            `phone_number.eq.0${basePhone},phone_number.eq.62${basePhone},phone_number.eq.+62${basePhone},phone_number.eq.${cleanPhone}`,
          )
          .maybeSingle();

        if (profile && profile.email && profile.email.includes("@")) {
          // 🎉 Ketemu email aslinya di database
          finalEmailForAuth = profile.email;
        } else {
          // ⚠️ FALLBACK: Format lama jika belum update profil
          finalEmailForAuth = `62${basePhone}@pasarqu.com`;
        }
      }

      // 🚀 3. SAFETY CHECK FORMAT EMAIL
      if (!finalEmailForAuth.includes("@")) {
        showToast("Format kredensial tidak dikenali.", "error");
        setLoading(false);
        return;
      }

      // 🚀 4. EKSEKUSI LOGIN KE SUPABASE AUTH
      const { data, error } = await supabase.auth.signInWithPassword({
        email: finalEmailForAuth,
        password: pwd,
      });

      if (error) throw error;

      if (data.user) {
        // Ambil profil lengkap untuk routing & sapaan
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (profile) {
          showToast(
            `Selamat datang kembali, ${profile.full_name || profile.name || "Juragan"}!`,
            "success",
          );

          // Routing berdasarkan Role
          if (profile.role === "SUPER_ADMIN") {
            navigate("/super-admin");
          } else if (profile.role === "LOCAL_ADMIN") {
            navigate("/admin/local");
          } else {
            navigate("/");
          }
        } else {
          showToast("Login Berhasil!", "success");
          navigate("/");
        }
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      // Terjemahkan error 400 menjadi pesan ramah
      if (error.status === 400 || error.message.includes("Invalid login")) {
        showToast("Nomor HP/Email atau Password salah", "error");
      } else {
        showToast("Terjadi kesalahan: " + error.message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-screen flex flex-col font-sans relative overflow-hidden bg-slate-50 text-left">
      {/* DEKORASI BACKGROUND */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#008080]/15 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#FF6600]/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* HEADER: KEMBALI */}
      <header className="absolute top-0 left-0 p-4 z-50 w-full">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-full bg-white/60 shadow-sm border border-slate-200 transition-all active:scale-90"
        >
          <ArrowLeft size={20} />
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-[420px] mx-auto mt-6 md:mt-0 pb-12">
        <div className="w-full animate-in slide-in-from-bottom-8 duration-700">
          {/* LOGO SECTION */}
          <div className="flex flex-col items-center mb-6">
            <div className="mb-3">
              <img
                src="/logo-text.png"
                alt="PasarQu Logo"
                className="h-16 md:h-20 w-auto object-contain"
                style={{
                  filter:
                    "drop-shadow(1.5px 1.5px 0px white) drop-shadow(-1.5px -1.5px 0px white)",
                }}
              />
            </div>
            <h1 className="text-[22px] font-[1000] text-slate-800 uppercase tracking-tighter text-center leading-none mb-1">
              MASUK KE SISTEM
            </h1>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center px-6">
              Akses Member dan Mitra PasarQu
            </p>
          </div>

          {/* FORM CONTAINER */}
          <div className="w-full bg-white/80 backdrop-blur-xl border border-white/40 rounded-[2rem] p-6 md:p-8 shadow-2xl shadow-teal-900/5 mb-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* INPUT IDENTIFIER (EMAIL / NO HP) */}
              <div className="relative group">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#008080] transition-colors"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Nomor HP atau Email Anda"
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-slate-800 text-[12px] font-bold focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 outline-none transition-all shadow-inner"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      identifier: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              {/* INPUT PASSWORD */}
              <div className="relative group">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#008080] transition-colors"
                  size={18}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Kata Sandi Anda"
                  className="w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl text-slate-800 text-[12px] font-bold focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 outline-none transition-all shadow-inner"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* LUPA PASSWORD */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-[10px] font-black text-[#FF6600] uppercase tracking-widest hover:underline active:scale-95 transition-all"
                >
                  Lupa Kata Sandi?
                </button>
              </div>

              {/* TOMBOL SUBMIT */}
              <button
                disabled={loading}
                className="w-full mt-2 py-4 bg-[#008080] hover:bg-teal-700 text-white rounded-2xl font-[1000] uppercase tracking-[0.2em] text-[12px] shadow-xl shadow-teal-900/20 active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "LOGIN SEKARANG"
                )}
              </button>
            </form>
          </div>

          {/* REGISTER SECTION */}
          <div className="w-full flex flex-col items-center">
            <div className="flex items-center gap-3 w-full mb-4 opacity-70">
              <div className="h-[1px] bg-slate-300 flex-1"></div>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                BELUM PUNYA AKUN?
              </span>
              <div className="h-[1px] bg-slate-300 flex-1"></div>
            </div>

            <div className="w-full flex flex-col gap-3">
              <button
                onClick={() => navigate("/register")}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-orange-50 rounded-2xl border border-teal-100 group active:scale-95 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#008080] shadow-sm group-hover:bg-[#008080] group-hover:text-white transition-colors">
                    <User size={18} />
                  </div>
                  <div className="text-left">
                    <span className="block text-[12px] font-black uppercase text-slate-700 tracking-widest">
                      Daftar Member
                    </span>
                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      Mulai Belanja Kebutuhanmu
                    </span>
                  </div>
                </div>
                <ArrowLeft
                  size={16}
                  className="text-slate-400 rotate-180 transition-transform group-hover:translate-x-1"
                />
              </button>

              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  onClick={() => navigate("/merchant-promo")}
                  className="flex flex-col items-center justify-center gap-1.5 p-4 bg-[#008080] rounded-2xl text-white font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all"
                >
                  <Store size={22} />
                  BUKA TOKO
                </button>
                <button
                  onClick={() => navigate("/promo/kurir")}
                  className="flex flex-col items-center justify-center gap-1.5 p-4 bg-[#FF6600] rounded-2xl text-white font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all"
                >
                  <Bike size={22} />
                  DAFTAR KURIR
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
