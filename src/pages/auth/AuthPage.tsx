import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
import {
  Eye,
  EyeOff,
  Phone,
  Lock,
  LogIn,
  Store,
  Bike,
  ShieldCheck,
  ArrowRight,
  Zap,
  ChevronRight,
  Mail,
} from "lucide-react";
import { GoogleLoginButton } from "../../components/ui/GoogleLoginButton";

export const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ identifier: "", password: "" });

  const params = new URLSearchParams(location.search);
  const roleParam = params.get("role");
  const redirectTarget = params.get("redirect");

  const [uiConfig, setUiConfig] = useState({
    title: "Masuk",
    subtitle: "Silakan masuk ke akun Anda",
    icon: <LogIn size={20} className="text-[#008080]" />,
    bgClass: "from-[#004d4d] via-[#003333] to-[#002222]",
    regPath: "/register",
    regLabel: "Daftar Akun Baru",
  });

  useEffect(() => {
    if (roleParam === "MERCHANT") {
      setUiConfig({
        title: "Seller Centre",
        subtitle: "Kelola operasional toko Anda",
        icon: <Store size={20} className="text-[#FF6600]" />,
        bgClass: "from-[#0B1120] via-[#0F172A] to-black",
        regPath: "/promo/toko",
        regLabel: "Ingin Membuka Toko?",
      });
    } else if (roleParam === "COURIER") {
      setUiConfig({
        title: "Driver Portal",
        subtitle: "Pantau pengiriman & penghasilan",
        icon: <Bike size={20} className="text-blue-500" />,
        bgClass: "from-[#0B1120] via-[#0F172A] to-black",
        regPath: "/promo/kurir",
        regLabel: "Daftar Jadi Kurir",
      });
    } else if (roleParam === "LOCAL_ADMIN") {
      setUiConfig({
        title: "Admin Panel",
        subtitle: "Manajemen wilayah & pasar",
        icon: <ShieldCheck size={20} className="text-teal-600" />,
        bgClass: "from-[#002222] via-[#001111] to-black",
        regPath: "/promo/admin",
        regLabel: "Info Kemitraan Wilayah",
      });
    }
  }, [roleParam]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalEmail = formData.identifier.trim();

      // 🚀 LOGIKA STANDAR BARU: Cek apakah input berupa angka (Nomor HP)
      const isPhone = /^[0-9+]+$/.test(finalEmail.replace(/\D/g, ""));

      if (isPhone) {
        let cleanPhone = finalEmail.replace(/\D/g, "");
        // Bersihkan angka 0 atau 62 di depan agar seragam menjadi 628xxx
        if (cleanPhone.startsWith("0")) cleanPhone = cleanPhone.substring(1);
        if (cleanPhone.startsWith("62")) cleanPhone = cleanPhone.substring(2);

        finalEmail = `62${cleanPhone}@pasarqu.com`;
      } else if (!finalEmail.includes("@")) {
        showToast("Format Nomor HP atau Email tidak valid!", "error");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: finalEmail,
        password: formData.password,
      });

      if (error) throw error;

      if (data.user) {
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

          // Arahkan Super Admin ke dashboard jika role-nya SUPER_ADMIN
          if (profile.role === "SUPER_ADMIN") {
            setTimeout(() => navigate("/super-admin"), 800);
          } else {
            setTimeout(() => navigate(redirectTarget || "/"), 800);
          }
        }
      }
    } catch (error: any) {
      if (error.message.includes("Invalid login")) {
        showToast("Nomor HP/Email atau Password salah!", "error");
      } else {
        showToast("Terjadi kesalahan: " + error.message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`h-[100dvh] w-screen flex flex-col font-sans relative overflow-hidden transition-colors duration-700 bg-gradient-to-br ${uiConfig.bgClass}`}
    >
      {/* --- DEKORASI BACKGROUND (Resep Galactic) --- */}
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      ></div>
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#008080]/30 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#FF6600]/20 rounded-full blur-[150px] pointer-events-none mix-blend-screen"></div>

      {/* --- HEADER --- */}
      <div className="bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-center lg:justify-start">
          {/* TOMBOL LOGO NORMAL (TIDAK ADA RAHASIA) */}
          <div onClick={() => navigate("/")} className="cursor-pointer group">
            <img
              src="/logo-text.png"
              alt="PasarQu Logo"
              className="h-12 md:h-10 w-auto object-contain transition-transform group-hover:scale-105"
              style={{
                filter:
                  "drop-shadow(1.5px 1.5px 0 white) drop-shadow(-1.5px -1.5px 0 white) drop-shadow(1.5px -1.5px 0 white) drop-shadow(-1.5px 1.5px 0 white)",
              }}
            />
          </div>
        </div>
      </div>

      {/* --- KONTEN UTAMA --- */}
      <div className="flex-1 flex flex-col items-center justify-between p-6 md:p-8 relative z-10 overflow-y-auto">
        <div className="w-full max-w-[1100px] flex flex-col lg:flex-row items-center justify-center lg:justify-between h-full gap-8">
          {/* LEFT HERO SECTION (DESKTOP) */}
          <div className="hidden lg:flex flex-col text-white max-w-md animate-in slide-in-from-left duration-700 text-left">
            <h1 className="text-6xl font-[1000] mb-6 leading-[0.9] uppercase tracking-tighter">
              MULAI LANGKAH <br />{" "}
              <span className="text-[#FF6600]">DIGITAL ANDA.</span>
            </h1>
            <p className="text-[12px] font-black opacity-80 leading-relaxed uppercase tracking-[0.3em] border-l-4 border-[#008080] pl-4">
              {uiConfig.subtitle}. Bersama Pasarqu, kelola operasional lebih
              cerdas dan efisien.
            </p>
          </div>

          {/* LOGIN CARD (Glassmorphism) */}
          <div className="bg-white/10 backdrop-blur-xl w-full max-w-[420px] rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-white/20 overflow-hidden p-8 md:p-10 text-left flex flex-col h-fit animate-in slide-in-from-bottom-8 duration-700">
            <div className="w-full flex items-center gap-3 mb-8">
              <div className="p-3 bg-white/10 border border-white/10 rounded-2xl shadow-sm">
                {uiConfig.icon}
              </div>
              <h2 className="text-2xl font-[1000] text-white uppercase tracking-tighter leading-none">
                {uiConfig.title}
              </h2>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative group">
                <Phone
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-[#008080] transition-colors duration-300"
                  size={18}
                />
                {/* 🚀 INPUT NORMAL: Dihapus class 'uppercase' */}
                <input
                  type="text"
                  placeholder="Nomor HP atau Email"
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:bg-white/10 focus:border-[#008080]/50 focus:ring-4 focus:ring-teal-500/5 outline-none text-[13px] font-black tracking-widest text-white placeholder:text-white/30 transition-all duration-300"
                  onChange={(e) =>
                    setFormData({ ...formData, identifier: e.target.value })
                  }
                  required
                />
              </div>

              <div className="relative group">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-[#008080] transition-colors duration-300"
                  size={18}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:bg-white/10 focus:border-[#008080]/50 focus:ring-4 focus:ring-teal-500/5 outline-none text-[13px] font-black tracking-widest text-white placeholder:text-white/30 transition-all duration-300"
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button
                disabled={loading}
                className="w-full bg-[#008080] text-white font-[1000] py-3.5 rounded-xl shadow-xl hover:bg-teal-600 hover:-translate-y-0.5 transition-all duration-300 uppercase text-[12px] tracking-[0.2em] mt-2 active:scale-95 border border-teal-400/30 disabled:opacity-50"
              >
                {loading ? "MEMPROSES..." : "MASUK SEKARANG"}
              </button>
            </form>

            {roleParam === null && (
              <>
                <div className="w-full relative my-8 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <span className="relative bg-[#003333] px-4 text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
                    Atau
                  </span>
                </div>

                <GoogleLoginButton />

                {/* 🚀 PERUBAHAN TEKS: "Daftar Member" */}
                <div className="mt-8 text-center text-[11px] font-black text-white/50 tracking-widest flex items-center justify-center gap-1.5">
                  BELUM PUNYA AKUN?{" "}
                  <Link
                    to={`/register?redirect=${redirectTarget || ""}`}
                    className="text-[#FF6600] uppercase hover:text-orange-400 hover:scale-105 transition-all underline decoration-[#FF6600]/30 underline-offset-4"
                  >
                    DAFTAR MEMBER
                  </Link>
                </div>

                {/* TOMBOL MITRA */}
                <div
                  onClick={() => navigate("/portal")}
                  className="w-full mt-10 bg-white/5 p-5 rounded-[1.5rem] relative overflow-hidden group cursor-pointer border border-white/10 shadow-2xl active:scale-95 transition-all duration-300"
                >
                  <div className="absolute -top-6 -right-6 p-2 opacity-5 group-hover:opacity-10 transition-all duration-700 text-white">
                    <Zap size={100} fill="currentColor" />
                  </div>
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap
                          size={14}
                          className="text-[#FF6600]"
                          fill="currentColor"
                        />
                        <h3 className="text-white text-[13px] font-[1000] uppercase tracking-tighter">
                          Portal Mitra
                        </h3>
                      </div>
                      <p className="text-[9px] text-white/40 uppercase font-black tracking-widest leading-none">
                        Toko dan Kurir Pasarqu
                      </p>
                    </div>
                    <div className="bg-[#FF6600] p-2.5 rounded-lg text-white shadow-lg group-hover:bg-orange-500 transition-all duration-300">
                      <ChevronRight size={16} strokeWidth={4} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* FOOTER MERCHANT/COURIER */}
            {roleParam !== null && (
              <div className="mt-8 pt-6 border-t border-white/10 w-full space-y-3">
                <button
                  onClick={() =>
                    navigate(
                      `${uiConfig.regPath}?redirect=${redirectTarget || ""}`,
                    )
                  }
                  className="w-full py-3.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-[#008080] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {uiConfig.regLabel} <ArrowRight size={14} />
                </button>
                <button
                  onClick={() => navigate("/portal")}
                  className="w-full text-[9px] font-black text-white/30 uppercase tracking-[0.3em] hover:text-[#FF6600] transition-colors pt-2"
                >
                  BUKAN {uiConfig.title.toUpperCase()}? GANTI JENIS AKUN
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
