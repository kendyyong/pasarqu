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
  ChevronRight,
  Zap,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { GoogleLoginButton } from "../../components/ui/GoogleLoginButton";

export const LoginPage = () => {
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
        showToast("SELAMAT DATANG DI PASARQU!", "success");
        navigate("/");
      }
    } catch (error: any) {
      showToast("EMAIL ATAU PASSWORD SALAH", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    // ✅ TEMA: DEEP TOSCA GALACTIC
    <div className="h-[100dvh] w-screen flex flex-col font-sans relative overflow-hidden transition-colors duration-700 bg-gradient-to-br from-[#004d4d] via-[#003333] to-[#002222] text-left">
      {/* --- DEKORASI BACKGROUND --- */}
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      ></div>
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#008080]/30 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#FF6600]/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>

      {/* --- TOP NAVIGATION --- */}
      <div className="absolute top-0 left-0 w-full p-4 z-20"></div>

      {/* --- KONTEN UTAMA (Dibuat Lebih Rapat agar Masuk Satu Layar) --- */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 relative z-10">
        <div className="w-full max-w-[400px] flex flex-col justify-center gap-4 animate-in slide-in-from-bottom-8 duration-700">
          {/* BLOK 1: IDENTITAS (Logo Diperkecil Sedikit) */}
          <div className="flex flex-col items-center">
            <img
              src="/logo-text.png"
              alt="PasarQu Logo"
              className="h-10 md:h-12 w-auto object-contain mb-4"
              style={{
                filter:
                  "drop-shadow(1px 1px 0px white) drop-shadow(-1px -1px 0px white) drop-shadow(1px -1px 0px white) drop-shadow(-1px 1px 0px white)",
              }}
            />
            <h1 className="text-[26px] font-[1000] text-white uppercase tracking-tighter text-center leading-none mb-1">
              SELAMAT <span className="text-white">DATANG</span>
            </h1>
            <p className="text-[9px] font-black text-teal-100/50 uppercase tracking-[0.3em] text-center border-b border-white/10 pb-1.5 px-6">
              MASUK KE EKOSISTEM DIGITAL PASARQU
            </p>
          </div>

          {/* BLOK 2: FORM LOGIN (Padding Dikurangi) */}
          <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <form onSubmit={handleLogin} className="space-y-4 relative z-10">
              <div className="space-y-1.5">
                <div className="relative group">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#008080] transition-colors"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="EMAIL ATAU NOMOR HP"
                    className="w-full pl-11 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white text-xs font-bold focus:border-[#008080]/50 focus:bg-black/50 outline-none transition-all uppercase tracking-widest"
                    onChange={(e) =>
                      setFormData({ ...formData, identifier: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="relative group">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#008080] transition-colors"
                    size={16}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="KATA SANDI"
                    className="w-full pl-11 pr-11 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white text-xs font-bold focus:border-[#008080]/50 focus:bg-black/50 outline-none transition-all"
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                disabled={loading}
                className="w-full py-3.5 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-[1000] uppercase tracking-[0.2em] text-[10px] shadow-lg active:scale-95 transition-all flex justify-center items-center gap-2 border border-teal-400/30"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    MASUK SEKARANG <LogIn size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="w-full relative my-5 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <span className="relative bg-[#003333] px-3 text-[8px] font-black text-white/30 uppercase tracking-[0.4em]">
                ATAU
              </span>
            </div>

            <div className="mb-5">
              <GoogleLoginButton />
            </div>

            <div className="text-center">
              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">
                BELUM PUNYA AKUN?
              </p>
              <button
                onClick={() => navigate("/register")}
                className="text-[10px] font-[1000] text-[#FF6600] uppercase tracking-widest hover:text-orange-400 transition-colors"
              >
                DAFTAR AKUN BARU
              </button>
            </div>
          </div>

          {/* BLOK 3: MITRA LINK (Lebih Ringkas) */}
          <div
            onClick={() => navigate("/portal")}
            className="w-full bg-white/5 p-4 rounded-[1.5rem] border border-white/10 cursor-pointer active:scale-95 transition-all flex items-center justify-between group shadow-xl"
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-0.5">
                <Zap size={14} className="text-[#FF6600]" fill="currentColor" />
                <h3 className="text-white text-[13px] font-[1000] uppercase tracking-tighter">
                  MITRA
                </h3>
              </div>
              <p className="text-[8px] text-white/40 uppercase font-black tracking-widest leading-none">
                INGIN BERJUALAN ATAU MENJADI KURIR?
              </p>
            </div>
            <div className="bg-[#FF6600] p-2 rounded-lg text-white shadow-lg group-hover:bg-orange-500 transition-colors">
              <ChevronRight size={16} strokeWidth={4} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
