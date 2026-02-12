import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  LogIn,
  Store,
  Bike,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { GoogleLoginButton } from "../../components/GoogleLoginButton";

export const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ identifier: "", password: "" });

  const params = new URLSearchParams(location.search);
  const roleParam = params.get("role");

  const [uiConfig, setUiConfig] = useState({
    title: "Masuk",
    subtitle: "Silakan masuk ke akun Anda",
    icon: <LogIn size={20} className="text-teal-600" />,
    color: "bg-teal-600",
    regPath: "/register",
    regLabel: "Daftar Akun Baru",
  });

  useEffect(() => {
    if (roleParam === "MERCHANT") {
      setUiConfig({
        title: "Seller Centre",
        subtitle: "Kelola operasional toko Anda",
        icon: <Store size={20} className="text-orange-500" />,
        color: "bg-slate-800",
        regPath: "/promo/toko",
        regLabel: "Ingin Membuka Toko?",
      });
    } else if (roleParam === "COURIER") {
      setUiConfig({
        title: "Driver Portal",
        subtitle: "Pantau pengiriman & penghasilan",
        icon: <Bike size={20} className="text-blue-500" />,
        color: "bg-slate-800",
        regPath: "/promo/kurir",
        regLabel: "Daftar Jadi Kurir",
      });
    } else if (roleParam === "LOCAL_ADMIN") {
      setUiConfig({
        title: "Admin Panel",
        subtitle: "Manajemen wilayah & pasar",
        icon: <ShieldCheck size={20} className="text-teal-600" />,
        color: "bg-teal-900",
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
        // AMBIL DATA ROLE DAN STATUS VERIFIKASI
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, name, is_verified")
          .eq("id", data.user.id)
          .single();

        if (profile) {
          // LOGIKA CEK VERIFIKASI UNTUK MITRA
          if (!profile.is_verified && profile.role !== "CUSTOMER") {
            showToast("Akun Anda sedang dalam verifikasi Admin.", "info");
            navigate("/waiting-approval");
            return;
          }

          showToast(`Selamat bekerja, ${profile.name}!`, "success");
          setTimeout(() => {
            if (profile.role === "MERCHANT") navigate("/merchant-dashboard");
            else if (profile.role === "COURIER") navigate("/courier-dashboard");
            else if (profile.role === "LOCAL_ADMIN") navigate("/admin-wilayah");
            else navigate("/");
          }, 800);
        }
      }
    } catch (error: any) {
      showToast("Email/HP atau Password salah", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col font-sans">
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 text-left">
            <div
              onClick={() => navigate("/")}
              className="cursor-pointer flex items-center gap-2"
            >
              <div className="text-2xl font-black text-teal-600 tracking-tighter flex items-center gap-1">
                <span className="bg-teal-600 text-white px-1.5 rounded">P</span>{" "}
                PASARQU
              </div>
            </div>
            <div className="text-xl text-slate-800 hidden md:block mt-1 font-bold">
              {uiConfig.title}
            </div>
          </div>
          <Link to="/help" className="text-teal-600 text-sm font-bold">
            Butuh Bantuan?
          </Link>
        </div>
      </div>

      <div
        className={`flex-1 flex items-center justify-center p-4 transition-colors duration-500 ${uiConfig.color}`}
      >
        <div className="w-full max-w-[1000px] flex items-center justify-center md:justify-end min-h-[500px]">
          <div className="hidden lg:flex flex-col text-white mr-20 max-w-md animate-in slide-in-from-left duration-500 text-left">
            <h1 className="text-5xl font-black mb-4 leading-tight uppercase tracking-tighter">
              Mulai Langkah <br /> Digital Anda.
            </h1>
            <p className="text-lg font-medium opacity-80 leading-relaxed uppercase text-[12px] tracking-widest">
              {uiConfig.subtitle}. Bersama Pasarqu, kelola operasional lebih
              cerdas dan efisien.
            </p>
          </div>

          <div className="bg-white w-full max-w-[400px] rounded-[2rem] shadow-2xl overflow-hidden p-10 text-left">
            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tight">
              {uiConfig.icon} {uiConfig.title}
            </h2>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Email atau Nomor HP"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-600 outline-none text-sm font-bold transition-all"
                  onChange={(e) =>
                    setFormData({ ...formData, identifier: e.target.value })
                  }
                  required
                />
                <Mail
                  className="absolute left-3 top-3.5 text-slate-400"
                  size={18}
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-600 outline-none text-sm font-bold transition-all"
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
                <Lock
                  className="absolute left-3 top-3.5 text-slate-400"
                  size={18}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button
                disabled={loading}
                className="w-full bg-slate-900 text-white font-black py-4 rounded-xl shadow-lg hover:bg-teal-600 transition-all uppercase text-[10px] tracking-[0.2em] mt-2 active:scale-95"
              >
                {loading ? "Memproses..." : "MASUK"}
              </button>
            </form>

            {roleParam === null ? (
              <>
                <div className="relative my-6 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100"></div>
                  </div>
                  <span className="relative bg-white px-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    Atau
                  </span>
                </div>
                <GoogleLoginButton />
                <div className="mt-8 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Baru di Pasarqu?{" "}
                  <Link
                    to="/register"
                    className="text-teal-600 font-black hover:underline ml-1"
                  >
                    Daftar
                  </Link>
                </div>
              </>
            ) : (
              <div className="mt-10 pt-6 border-t border-slate-50 space-y-4">
                <button
                  onClick={() => navigate(uiConfig.regPath)}
                  className="w-full py-3 bg-teal-50 border border-teal-100 rounded-xl text-[10px] font-black text-teal-600 uppercase tracking-widest hover:bg-teal-600 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  {uiConfig.regLabel} <ArrowRight size={14} />
                </button>
                <button
                  onClick={() => navigate("/portal")}
                  className="w-full text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] hover:text-teal-600 transition-colors"
                >
                  Bukan {uiConfig.title}? Ganti Jenis Akun
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
