import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Store,
  ShieldCheck,
  ArrowLeft,
  Zap,
  ChevronRight,
  Loader2,
} from "lucide-react";

export const MerchantLoginPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. SIGN IN KE SUPABASE AUTH
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      if (data.user) {
        // 2. AMBIL DATA PROFIL UNTUK VALIDASI ROLE & STATUS
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, name, status")
          .eq("id", data.user.id)
          .single();

        if (profileError) throw profileError;

        // PROTEKSI ROLE: Hanya MERCHANT atau SUPER_ADMIN yang bisa masuk
        if (profile?.role !== "MERCHANT" && profile?.role !== "SUPER_ADMIN") {
          await supabase.auth.signOut();
          showToast(
            "AKSES DITOLAK! AKUN ANDA TIDAK TERDAFTAR SEBAGAI MITRA TOKO.",
            "error",
          );
          setLoading(false);
          return;
        }

        // CEK STATUS APPROVAL (Kecuali Super Admin)
        if (profile?.status !== "APPROVED" && profile?.role !== "SUPER_ADMIN") {
          showToast("AKUN TOKO ANDA SEDANG DALAM PENINJAUAN ADMIN.", "info");
          navigate("/waiting-approval");
          return;
        }

        showToast(
          `SELAMAT DATANG KEMBALI, ${profile.name.toUpperCase()}!`,
          "success",
        );
        navigate("/merchant-dashboard");
      }
    } catch (error: any) {
      showToast("EMAIL ATAU PASSWORD SALAH. SILAKAN PERIKSA KEMBALI.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    // ✅ TEMA: EMERALD GALACTIC (FULL SCREEN)
    <div className="h-[100dvh] w-screen flex flex-col font-sans relative overflow-hidden transition-colors duration-700 bg-gradient-to-br from-[#003333] via-[#002222] to-[#001111] text-left">
      {/* --- DEKORASI BACKGROUND --- */}
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      ></div>
      {/* Cahaya Pendaran Tosca */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#008080]/30 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      {/* Cahaya Pendaran Orange (Aksen) */}
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#FF6600]/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>

      {/* --- HEADER NAVIGATION --- */}
      <div className="absolute top-0 left-0 w-full p-5 z-20">
        <button
          onClick={() => navigate("/portal")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-md transition-all text-[10px] font-black uppercase tracking-[0.2em] active:scale-95"
        >
          <ArrowLeft size={16} />
          <span>PORTAL MITRA</span>
        </button>
      </div>

      {/* --- KONTEN UTAMA --- */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-[420px] h-full flex flex-col justify-between pt-20 pb-10 animate-in slide-in-from-bottom-8 duration-700">
          {/* BLOK 1: IDENTITAS TOKO */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#008080] to-[#004d4d] rounded-2xl flex items-center justify-center shadow-[0_10px_30px_-5px_rgba(0,128,128,0.5)] border border-teal-400/30 mb-6">
              <Store size={32} className="text-white" />
            </div>

            <h1 className="text-[32px] font-[1000] text-white uppercase tracking-tighter text-center leading-none mb-2">
              SELLER <span className="text-[#008080]">CENTRE</span>
            </h1>
            <p className="text-[10px] font-black text-teal-100/50 uppercase tracking-[0.3em] text-center border-b border-teal-500/20 pb-2 px-4">
              KELOLA PRODUK & OPERASIONAL PASARQU
            </p>
          </div>

          {/* BLOK 2: FORM LOGIN (EMERALD GLASS) */}
          <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
            {/* Animasi Shimmer kilatan cahaya miring */}
            <div className="absolute top-0 left-[-100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-45deg] animate-[shimmer_3s_infinite]"></div>

            <form onSubmit={handleLogin} className="space-y-6 relative z-10">
              {/* INPUT EMAIL */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">
                  EMAIL RESMI TOKO
                </label>
                <div className="relative group">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#008080] transition-colors"
                    size={18}
                  />
                  <input
                    type="email"
                    placeholder="CONTOH: TOKO@EMAIL.COM"
                    className="w-full pl-12 pr-4 py-4 bg-black/30 border border-white/10 rounded-2xl text-white text-xs font-bold focus:border-[#008080]/50 focus:bg-black/50 outline-none transition-all uppercase tracking-widest"
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {/* INPUT PASSWORD */}
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">
                    KATA SANDI
                  </label>
                  <button
                    type="button"
                    className="text-[9px] font-black text-[#FF6600] uppercase tracking-widest hover:text-orange-400 transition-colors"
                  >
                    LUPA SANDI?
                  </button>
                </div>
                <div className="relative group">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#008080] transition-colors"
                    size={18}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 bg-black/30 border border-white/10 rounded-2xl text-white text-xs font-bold focus:border-[#008080]/50 focus:bg-black/50 outline-none transition-all"
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* TOMBOL LOGIN */}
              <button
                disabled={loading}
                className="w-full py-4 bg-[#008080] hover:bg-teal-600 text-white rounded-2xl font-[1000] uppercase tracking-[0.2em] text-[11px] shadow-[0_10px_30px_-10px_rgba(0,128,128,0.5)] active:scale-95 transition-all flex justify-center items-center gap-2 border border-teal-400/30 mt-2"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    MASUK KE DASHBOARD <LogIn size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3">
                BELUM BERGABUNG DENGAN PASARQU?
              </p>
              <button
                onClick={() => navigate("/merchant-promo")}
                className="text-[11px] font-[1000] text-[#008080] uppercase tracking-widest hover:text-teal-400 transition-colors flex items-center justify-center gap-1 mx-auto"
              >
                DAFTAR TOKO SEKARANG <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* BLOK 3: FOOTER KEAMANAN */}
          <div className="w-full text-center">
            <div className="flex justify-center items-center gap-3 opacity-30">
              <div className="h-[1px] w-8 bg-white"></div>
              <ShieldCheck size={16} className="text-white" />
              <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">
                SECURE SELLER ACCESS
              </span>
              <div className="h-[1px] w-8 bg-white"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantLoginPage;
