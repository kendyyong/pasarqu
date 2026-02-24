import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Bike,
  ShieldCheck,
  ArrowLeft,
  Zap,
  ChevronRight,
  Loader2,
} from "lucide-react";

export const CourierLoginPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ identifier: "", password: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalEmail = formData.identifier.trim();
      const isPhone = /^\d+$/.test(finalEmail);
      if (isPhone) {
        if (finalEmail.startsWith("0")) finalEmail = finalEmail.substring(1);
        finalEmail = `${finalEmail}@pasarqu.com`;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: finalEmail,
        password: formData.password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, name, status")
          .eq("id", data.user.id)
          .single();

        // Validasi Role Khusus Kurir
        if (profile?.role !== "COURIER" && profile?.role !== "SUPER_ADMIN") {
          await supabase.auth.signOut();
          showToast("AKSES DITOLAK! AKUN ANDA BUKAN MITRA KURIR.", "error");
          setLoading(false);
          return;
        }

        // Cek Status Approval
        if (profile?.status !== "APPROVED" && profile?.role !== "SUPER_ADMIN") {
          showToast("AKUN ANDA MASIH DALAM PROSES VERIFIKASI.", "info");
          navigate("/waiting-approval");
          return;
        }

        showToast(
          `SELAMAT DATANG KEMBALI, ${profile.name.toUpperCase()}!`,
          "success",
        );
        navigate("/courier-dashboard");
      }
    } catch (error: any) {
      showToast("EMAIL ATAU PASSWORD SALAH", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    // ✅ TEMA: AMBER GALACTIC (ORANGE GELAP ELEGAN)
    <div className="h-[100dvh] w-screen flex flex-col font-sans relative overflow-hidden transition-colors duration-700 bg-gradient-to-br from-[#331400] via-[#1a0a00] to-black text-left">
      {/* --- DEKORASI BACKGROUND --- */}
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      ></div>
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#FF6600]/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#008080]/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>

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
          {/* BLOK 1: IDENTITAS KURIR */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#FF6600] to-[#b34700] rounded-2xl flex items-center justify-center shadow-[0_10px_30px_-5px_rgba(255,102,0,0.4)] border border-orange-400/30 mb-6">
              <Bike size={32} className="text-white" />
            </div>

            <h1 className="text-[32px] font-[1000] text-white uppercase tracking-tighter text-center leading-none mb-2">
              DRIVER <span className="text-[#FF6600]">PORTAL</span>
            </h1>
            <p className="text-[10px] font-black text-orange-100/50 uppercase tracking-[0.3em] text-center border-b border-orange-500/20 pb-2 px-4">
              AKSES LOGISTIK & PENGIRIMAN PASARQU
            </p>
          </div>

          {/* BLOK 2: FORM LOGIN (AMBER GLASS) */}
          <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
            <form onSubmit={handleLogin} className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">
                  KREDENSIAL DRIVER
                </label>
                <div className="relative group">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FF6600] transition-colors"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="EMAIL ATAU NOMOR HP"
                    className="w-full pl-12 pr-4 py-4 bg-black/30 border border-white/10 rounded-2xl text-white text-xs font-bold focus:border-[#FF6600]/50 focus:bg-black/50 outline-none transition-all uppercase tracking-widest"
                    onChange={(e) =>
                      setFormData({ ...formData, identifier: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">
                    KATA SANDI
                  </label>
                  <button
                    type="button"
                    className="text-[9px] font-black text-[#FF6600] uppercase tracking-widest hover:underline"
                  >
                    LUPA?
                  </button>
                </div>
                <div className="relative group">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FF6600] transition-colors"
                    size={18}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 bg-black/30 border border-white/10 rounded-2xl text-white text-xs font-bold focus:border-[#FF6600]/50 focus:bg-black/50 outline-none transition-all"
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

              <button
                disabled={loading}
                className="w-full py-4 bg-[#FF6600] hover:bg-orange-600 text-white rounded-2xl font-[1000] uppercase tracking-[0.2em] text-[11px] shadow-[0_10px_30px_-10px_rgba(255,102,0,0.5)] active:scale-95 transition-all flex justify-center items-center gap-2 border border-orange-400/30 mt-2"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    MASUK SEKARANG <LogIn size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3">
                BELUM PUNYA AKUN DRIVER?
              </p>
              <button
                onClick={() => navigate("/promo/kurir")}
                className="text-[11px] font-[1000] text-[#FF6600] uppercase tracking-widest hover:text-orange-400 transition-colors"
              >
                DAFTAR JADI MITRA KURIR
              </button>
            </div>
          </div>

          {/* BLOK 3: FOOTER KEAMANAN */}
          <div className="w-full text-center">
            <div className="flex justify-center items-center gap-3 opacity-30">
              <div className="h-[1px] w-8 bg-white"></div>
              <ShieldCheck size={16} className="text-white" />
              <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">
                ENCRYPTED ACCESS
              </span>
              <div className="h-[1px] w-8 bg-white"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourierLoginPage;
