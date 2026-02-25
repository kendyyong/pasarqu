import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
import {
  Store,
  Bike,
  Shield,
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  ChevronLeft,
  Zap,
  ArrowLeft,
  LockKeyhole,
  Terminal,
  ScanFace,
  Fingerprint,
} from "lucide-react";

/**
 * --- TEMPLATE LOGIN PRO (LOGIKA STREAMLINED) ---
 * Digunakan untuk Admin Wilayah, Toko, dan Kurir
 */
const BaseLoginPage = ({
  role,
  title,
  subtitle,
  icon,
  promoLink,
  dashboardUrl,
  accentColor = "teal",
}: any) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const isTeal = accentColor === "teal";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, status, is_verified")
          .eq("id", data.user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        const isSuperAdmin = profile?.role === "SUPER_ADMIN";
        const isCorrectRole = profile?.role === role;

        if (!isCorrectRole && !isSuperAdmin) {
          await supabase.auth.signOut();
          const identity =
            profile?.role === "CUSTOMER" ? "PELANGGAN" : profile?.role;
          setIsLoading(false);
          showToast(
            `AKSES DITOLAK! Akun Anda terdaftar sebagai ${identity}.`,
            "error",
          );
          return;
        }

        if (!isSuperAdmin) {
          if (profile?.status === "APPROVED") {
            showToast(`Selamat Datang, ${title}!`, "success");
            window.location.replace(dashboardUrl);
            return;
          }

          if (profile?.status === "PENDING" || !profile?.status) {
            showToast("Pendaftaran Anda masih dalam peninjauan admin.", "info");
            window.location.replace("/waiting-approval");
            return;
          }

          if (
            profile?.status === "SUSPENDED" ||
            profile?.status === "REJECTED"
          ) {
            await supabase.auth.signOut();
            showToast(
              "Akun Anda telah DIBEKUKAN atau DITOLAK. Hubungi Admin.",
              "error",
            );
            setIsLoading(false);
            return;
          }
        }

        showToast(`Akses Super Admin Diberikan.`, "success");
        window.location.replace(dashboardUrl);
      }
    } catch (err: any) {
      await supabase.auth.signOut();
      showToast(err.message || "Gagal Login", "error");
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen font-sans flex flex-col ${isTeal ? "bg-teal-600" : "bg-[#FF6600]"}`}
    >
      <nav className="w-full bg-white shadow-sm py-4 px-6 md:px-12 flex justify-between items-center z-20">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-teal-600 font-black text-xl tracking-tighter"
          >
            PASARQU
          </Link>
          <div className="h-6 w-[1px] bg-slate-200 hidden md:block"></div>
          <h2 className="text-slate-700 font-bold text-sm hidden md:block uppercase tracking-tight">
            {title}
          </h2>
        </div>
        <Link
          to="/login"
          className="text-[10px] font-black text-slate-400 hover:text-teal-600 flex items-center gap-1 uppercase tracking-widest transition-colors"
        >
          <ChevronLeft size={14} /> KEMBALI
        </Link>
      </nav>

      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24 p-6 relative overflow-hidden">
        <div className="hidden lg:flex flex-col text-white max-w-sm text-left">
          <div className="mb-8 p-5 bg-white/10 backdrop-blur-md rounded-3xl w-fit border border-white/20 shadow-2xl">
            {icon}
          </div>
          <h1 className="text-5xl font-black uppercase leading-[0.85] mb-6 tracking-tighter italic">
            KENDALI <br /> <span className="not-italic opacity-50">PENUH</span>{" "}
            <br /> BISNIS ANDA.
          </h1>
          <p className="text-white/70 font-bold text-xs leading-relaxed uppercase tracking-widest">
            Gunakan Dashboard {title} untuk memantau performa, stok, dan
            pendapatan Anda secara real-time.
          </p>
        </div>

        <div className="w-full max-w-[420px]">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.2)] border border-white">
            <div className="mb-8 text-left">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">
                Masuk
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                {subtitle}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5 text-left">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                  Email Resmi
                </label>
                <div className="relative group">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors"
                    size={18}
                  />
                  <input
                    type="email"
                    placeholder="nama@mitra.com"
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-sm focus:ring-2 focus:ring-teal-500/10 outline-none transition-all"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[9px] font-black text-blue-600 uppercase tracking-tighter hover:underline"
                  >
                    Lupa?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors"
                    size={18}
                  />
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-sm focus:ring-2 focus:ring-teal-500/10 outline-none transition-all"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <button
                disabled={isLoading}
                className={`w-full py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-xl active:scale-95 transition-all flex justify-center items-center gap-3 mt-6 
                  ${isTeal ? "bg-slate-900 text-white hover:bg-teal-600" : "bg-slate-900 text-white hover:bg-[#FF6600]"}`}
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    LOGIN DASHBOARD <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {promoLink && (
              <div className="mt-8 pt-6 border-t border-slate-50 text-center">
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-2">
                  Belum Terdaftar?
                </p>
                <Link
                  to={promoLink}
                  className={`text-[11px] font-black uppercase tracking-widest border-b-2 border-transparent transition-all ${isTeal ? "text-teal-600 hover:border-teal-600" : "text-orange-500 hover:border-orange-500"}`}
                >
                  Daftar Mitra Sekarang
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full bg-slate-900 py-6 text-center">
        <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.5em]">
          © 2026 PASARQU INDONESIA • TEKNOLOGI EKONOMI LOKAL
        </p>
      </div>
    </div>
  );
};

// --- LOGIN ADMIN WILAYAH ---
export const AdminLogin = () => (
  <BaseLoginPage
    role="LOCAL_ADMIN"
    title="ADMIN WILAYAH"
    subtitle="Portal Manajemen Zona"
    icon={<Shield size={40} className="text-white" />}
    dashboardUrl="/admin-wilayah"
    accentColor="teal"
  />
);

// 🚀 FIX: LOGIN SUPER ADMIN (EDISI KHUSUS CEO KENDY ASSA - REVISI VISUAL)
export const SuperAdminLogin = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleSuperLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (error) throw error;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profile?.role === "SUPER_ADMIN") {
        showToast(
          "Otorisasi Diterima. Selamat Datang, CEO Kendy Assa.",
          "success",
        );
        window.location.replace("/admin");
      } else {
        await supabase.auth.signOut();
        throw new Error("Akses Ditolak! Kredensial Bukan Tingkat Master.");
      }
    } catch (err: any) {
      showToast(err.message, "error");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-screen flex flex-col font-sans relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#003333] to-[#331a00] text-left selection:bg-[#FF6600] selection:text-white">
      {/* AMBIENT LIGHTING */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#008080]/30 rounded-full blur-[150px] pointer-events-none mix-blend-overlay"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#FF6600]/20 rounded-full blur-[150px] pointer-events-none mix-blend-overlay"></div>

      {/* HEADER: KEMBALI */}
      <header className="absolute top-0 left-0 p-8 z-50 w-full">
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-3 text-white/70 hover:text-white transition-all active:scale-95 group py-3 px-5 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 w-max"
        >
          <ArrowLeft
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="text-[11px] font-black uppercase tracking-[0.2em]">
            Kembali
          </span>
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-[480px] mx-auto">
        <div className="w-full animate-in fade-in zoom-in-95 duration-700">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[3rem] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>

            <div className="flex flex-col items-center mb-10 relative z-10">
              <div className="relative mb-8">
                {/* Efek cahaya di belakang logo */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#008080] to-[#FF6600] blur-3xl opacity-40 rounded-full animate-pulse"></div>

                {/* 🚀 LOGO CEO TANPA KOTAK, DENGAN GLOW PUTIH KUAT (Outline Effect) */}
                <img
                  src="/logo-text.png"
                  alt="PasarQu CEO"
                  className="relative w-auto h-16 object-contain drop-shadow-[0_0_3px_#ffffff] drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]"
                />
              </div>

              {/* TYPOGRAPHY DENGAN GARIS TEPI PUTIH (STROKE) */}
              <h1 className="text-[30px] font-[1000] uppercase tracking-[0.05em] text-center leading-none drop-shadow-2xl">
                <span className="text-[#008080] drop-shadow-[0_0_2px_#fff] [-webkit-text-stroke:1px_white]">
                  PASARQU
                </span>
                <br />
                <span className="text-[#FF6600] drop-shadow-[0_0_2px_#fff] [-webkit-text-stroke:1px_white]">
                  MASTER
                </span>
              </h1>

              <div className="flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
                <Shield size={12} className="text-[#FF6600]" />
                <p className="text-[9px] font-black text-white/70 uppercase tracking-[0.3em]">
                  Executive Control Panel
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSuperLogin}
              className="space-y-5 relative z-10"
            >
              <div className="space-y-2">
                <label className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em] ml-2">
                  Kredensial Master
                </label>
                <div className="relative group">
                  <Mail
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-[#008080] transition-colors"
                    size={20}
                  />
                  <input
                    type="email"
                    placeholder="Master Email ID"
                    className="w-full pl-14 pr-6 py-5 bg-black/20 border border-white/10 rounded-2xl text-white font-bold text-sm focus:border-[#008080] focus:bg-black/30 focus:ring-1 focus:ring-[#008080]/50 outline-none transition-all placeholder:text-white/20 shadow-inner"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em] ml-2">
                  Kode Otorisasi
                </label>
                <div className="relative group">
                  <LockKeyhole
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-[#FF6600] transition-colors"
                    size={20}
                  />
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    className="w-full pl-14 pr-6 py-5 bg-black/20 border border-white/10 rounded-2xl text-white font-bold text-sm focus:border-[#FF6600] focus:bg-black/30 focus:ring-1 focus:ring-[#FF6600]/50 outline-none transition-all placeholder:text-white/20 shadow-inner tracking-[0.2em]"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {/* 🚀 TOMBOL ORANGE SOLID KHUSUS CEO DENGAN TEKS BARU */}
              <button
                disabled={isLoading}
                className="w-full mt-8 py-5 bg-[#FF6600] hover:bg-[#e65c00] text-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(255,102,0,0.6)] active:scale-95 transition-all flex justify-center items-center gap-2 relative group overflow-hidden border border-white/30"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] skew-x-12"></div>
                {isLoading ? (
                  <Loader2 className="animate-spin relative z-10" size={24} />
                ) : (
                  <>
                    <Zap size={20} className="relative z-10 fill-white" />
                    {/* 🚀 STRUKTUR TEKS BARU MULTI-LINE */}
                    <div className="relative z-10 flex flex-col items-center leading-tight py-1">
                      <span className="text-[10px] font-bold opacity-90 mb-0.5 tracking-widest">
                        Silahkan Masuk
                      </span>
                      <span className="text-[16px] font-[1000] tracking-widest uppercase drop-shadow-sm">
                        KENDY ASSA
                      </span>
                      <span className="text-[9px] font-black opacity-80 tracking-[0.2em] mt-0.5">
                        FOUNDER & CEO PASARQU
                      </span>
                    </div>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-10 text-center opacity-50">
            <p className="text-[8px] font-black text-white uppercase tracking-[0.4em] drop-shadow">
              HIGHEST AUTHORITY LEVEL ACCESS • PASARQU 2026
            </p>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

// --- LOGIN MITRA TOKO ---
export const MerchantLogin = () => (
  <BaseLoginPage
    role="MERCHANT"
    title="Dashboard Toko"
    subtitle="Kelola Niaga & Produk"
    icon={<Store size={40} className="text-white" />}
    promoLink="/promo/toko"
    dashboardUrl="/merchant-dashboard"
    accentColor="teal"
  />
);

// --- LOGIN MITRA KURIR ---
export const CourierLogin = () => (
  <BaseLoginPage
    role="COURIER"
    title="Dashboard Kurir"
    subtitle="Akses Logistik & Cuan"
    icon={<Bike size={40} className="text-white" />}
    promoLink="/promo/kurir"
    dashboardUrl="/courier-dashboard"
    accentColor="orange"
  />
);
