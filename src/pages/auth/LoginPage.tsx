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
    // ✅ TEMA: DEEP TOSCA GALACTIC (CLEAN VERSION)
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
      <div className="absolute top-0 left-0 w-full p-5 z-20">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-md transition-all text-[10px] font-black uppercase tracking-[0.2em] active:scale-95 shadow-lg"
        >
          <ArrowLeft size={16} />
          <span>BELANJA SEKARANG</span>
        </button>
      </div>

      {/* --- KONTEN UTAMA --- */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-[420px] h-full flex flex-col justify-between pt-20 pb-10 animate-in slide-in-from-bottom-8 duration-700">
          {/* BLOK 1: IDENTITAS PELANGGAN */}
          <div className="flex flex-col items-center">
            <img
              src="/logo-text.png"
              alt="PasarQu Logo"
              className="h-12 md:h-14 w-auto object-contain mb-8"
              style={{
                filter:
                  "drop-shadow(1px 1px 0px white) drop-shadow(-1px -1px 0px white) drop-shadow(1px -1px 0px white) drop-shadow(-1px 1px 0px white)",
              }}
            />
            <h1 className="text-[28px] font-[1000] text-white uppercase tracking-tighter text-center leading-none mb-2">
              SELAMAT <span className="text-[#008080]">DATANG.</span>
            </h1>
            <p className="text-[10px] font-black text-teal-100/50 uppercase tracking-[0.3em] text-center border-b border-white/10 pb-2 px-6">
              MASUK KE EKOSISTEM DIGITAL PASARQU
            </p>
          </div>

          {/* BLOK 2: FORM LOGIN (GLASSMORPHISM) */}
          <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
            {/* ✅ PRIORITAS 1: LOGIN MANUAL */}
            <form onSubmit={handleLogin} className="space-y-5 relative z-10">
              <div className="space-y-2">
                <div className="relative group">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#008080] transition-colors"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="EMAIL ATAU NOMOR HP"
                    className="w-full pl-12 pr-4 py-4 bg-black/20 border border-white/10 rounded-2xl text-white text-xs font-bold focus:border-[#008080]/50 focus:bg-black/50 outline-none transition-all uppercase tracking-widest"
                    onChange={(e) =>
                      setFormData({ ...formData, identifier: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative group">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#008080] transition-colors"
                    size={18}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="KATA SANDI"
                    className="w-full pl-12 pr-12 py-4 bg-black/20 border border-white/10 rounded-2xl text-white text-xs font-bold focus:border-[#008080]/50 focus:bg-black/50 outline-none transition-all"
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
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                disabled={loading}
                className="w-full py-4 bg-[#008080] hover:bg-teal-600 text-white rounded-2xl font-[1000] uppercase tracking-[0.2em] text-[11px] shadow-lg active:scale-95 transition-all flex justify-center items-center gap-2 border border-teal-400/30"
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

            {/* ✅ PRIORITAS 2: LOGIN SOSIAL (DIGESER KE BAWAH) */}
            <div className="w-full relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <span className="relative bg-[#003333] px-4 text-[9px] font-black text-white/30 uppercase tracking-[0.4em]">
                ATAU
              </span>
            </div>

            <div className="mb-6">
              <GoogleLoginButton />
            </div>

            <div className="mt-8 text-center">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3">
                BELUM PUNYA AKUN PASARQU?
              </p>
              <button
                onClick={() => navigate("/register")}
                className="text-[11px] font-[1000] text-[#FF6600] uppercase tracking-widest hover:text-orange-400 transition-colors"
              >
                DAFTAR AKUN BARU
              </button>
            </div>
          </div>

          {/* BLOK 3: MITRA LINK */}
          <div
            onClick={() => navigate("/portal")}
            className="w-full mt-6 bg-white/5 p-5 rounded-[2rem] border border-white/10 cursor-pointer active:scale-95 transition-all flex items-center justify-between group shadow-xl"
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={16} className="text-[#FF6600]" fill="currentColor" />
                <h3 className="text-white text-[14px] font-[1000] uppercase tracking-tighter">
                  MITRA
                </h3>
              </div>
              <p className="text-[9px] text-white/40 uppercase font-black tracking-widest leading-none">
                INGIN BERJUALAN ATAU MENJADI KURIR?
              </p>
            </div>
            <div className="bg-[#FF6600] p-2.5 rounded-xl text-white shadow-lg group-hover:bg-orange-500 transition-colors">
              <ChevronRight size={18} strokeWidth={4} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
