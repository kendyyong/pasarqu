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

  // --- LOGIKA RAHASIA SUPER ADMIN ---
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  const handleSecretClick = () => {
    const currentTime = Date.now();
    if (currentTime - lastClickTime > 1000) {
      setClickCount(1);
    } else {
      const newCount = clickCount + 1;
      setClickCount(newCount);
      if (newCount === 5) {
        navigate("/login/master");
        setClickCount(0);
      }
    }
    setLastClickTime(currentTime);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalEmail = formData.identifier.trim();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: finalEmail,
        password: formData.password,
      });

      if (error) throw error;

      if (data.user) {
        showToast("Login Berhasil!", "success");
        navigate("/");
      }
    } catch (error: any) {
      showToast("Email atau Password salah", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-screen flex flex-col font-sans relative overflow-hidden bg-slate-50 text-left">
      {/* DEKORASI BACKGROUND ELEGAN */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#008080]/15 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#FF6600]/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* HEADER: KEMBALI */}
      <header className="absolute top-0 left-0 p-4 z-50 w-full flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-full bg-white/60 shadow-sm border border-slate-200 transition-all backdrop-blur-md active:scale-90"
        >
          <ArrowLeft size={20} />
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-[420px] mx-auto mt-6 md:mt-0 pb-12">
        <div className="w-full animate-in slide-in-from-bottom-8 duration-700">
          {/* BAGIAN LOGO (RAHASIA) */}
          <div className="flex flex-col items-center mb-6">
            <div
              onClick={handleSecretClick}
              className="mb-3 select-none outline-none cursor-default"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <img
                src="/logo-text.png"
                alt="PasarQu Logo"
                className="h-16 md:h-20 w-auto object-contain"
                style={{
                  filter:
                    "drop-shadow(1.5px 1.5px 0px white) drop-shadow(-1.5px -1.5px 0px white) drop-shadow(1.5px -1.5px 0px white) drop-shadow(-1.5px 1.5px 0px white)",
                }}
              />
            </div>
            <h1 className="text-[22px] font-[1000] text-slate-800 uppercase tracking-tighter text-center leading-none mb-1">
              MASUK KE SISTEM
            </h1>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center px-6">
              Akses Pembeli dan Mitra PasarQu
            </p>
          </div>

          {/* FORM LOGIN */}
          <div className="w-full bg-white/80 backdrop-blur-xl border border-white/40 rounded-[2rem] p-6 md:p-8 shadow-2xl shadow-teal-900/5 mb-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* INPUT EMAIL */}
              <div className="relative group">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-800 transition-colors"
                  size={18}
                />
                <input
                  type="email"
                  placeholder="EMAIL ANDA"
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-slate-800 text-[12px] font-bold focus:border-slate-800 focus:ring-2 focus:ring-slate-800/20 outline-none transition-all uppercase tracking-widest shadow-inner"
                  onChange={(e) =>
                    setFormData({ ...formData, identifier: e.target.value })
                  }
                  required
                />
              </div>

              {/* INPUT PASSWORD */}
              <div className="relative group">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-800 transition-colors"
                  size={18}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="KATA SANDI"
                  className="w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl text-slate-800 text-[12px] font-bold focus:border-slate-800 focus:ring-2 focus:ring-slate-800/20 outline-none transition-all shadow-inner"
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
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

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  className="text-[10px] font-black text-[#FF6600] uppercase tracking-widest hover:underline"
                >
                  Lupa Kata Sandi?
                </button>
              </div>

              {/* 🚀 FIX: TOMBOL LOGIN SLATE/MIDNIGHT BLUE (ELEGAN & PRO) */}
              <button
                disabled={loading}
                className="w-full mt-2 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-[1000] uppercase tracking-[0.2em] text-[12px] shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex justify-center items-center gap-2 border border-slate-800"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "LOGIN SEKARANG"
                )}
              </button>
            </form>
          </div>

          {/* BAGIAN DAFTAR BARU */}
          <div className="w-full flex flex-col items-center">
            <div className="flex items-center gap-3 w-full mb-4 opacity-70">
              <div className="h-[1px] bg-slate-300 flex-1"></div>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                BELUM PUNYA AKUN?
              </span>
              <div className="h-[1px] bg-slate-300 flex-1"></div>
            </div>

            <div className="w-full flex flex-col gap-3">
              {/* TOMBOL DAFTAR PEMBELI */}
              <button
                onClick={() => navigate("/register")}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-orange-50 rounded-2xl hover:shadow-md transition-all active:scale-95 border border-teal-100 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#008080] shadow-sm group-hover:bg-[#008080] group-hover:text-white transition-colors">
                    <User size={18} />
                  </div>
                  <div className="text-left">
                    <span className="block text-[12px] font-black uppercase text-slate-700 tracking-widest">
                      Daftar Pembeli
                    </span>
                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      Mulai Belanja Kebutuhanmu
                    </span>
                  </div>
                </div>
                <ArrowLeft
                  size={16}
                  className="text-slate-400 group-hover:text-[#008080] rotate-180 transition-transform group-hover:translate-x-1"
                />
              </button>

              {/* TOMBOL DAFTAR MITRA */}
              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  onClick={() => navigate("/merchant-promo")}
                  className="flex flex-col items-center justify-center gap-1.5 p-4 bg-[#008080] rounded-2xl hover:bg-teal-700 transition-all shadow-md active:scale-95 border border-teal-600 group"
                >
                  <Store size={22} className="text-white" />
                  <span className="text-[10px] font-black uppercase text-white tracking-widest text-center leading-tight">
                    BUKA TOKO
                  </span>
                </button>

                <button
                  onClick={() => navigate("/promo/kurir")}
                  className="flex flex-col items-center justify-center gap-1.5 p-4 bg-[#FF6600] rounded-2xl hover:bg-orange-600 transition-all shadow-md active:scale-95 border border-orange-500 group"
                >
                  <Bike size={22} className="text-white" />
                  <span className="text-[10px] font-black uppercase text-white tracking-widest text-center leading-tight">
                    DAFTAR KURIR
                  </span>
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
