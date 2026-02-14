import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
import { Link } from "react-router-dom";
import {
  Store,
  Bike,
  Shield,
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  ChevronLeft,
  Globe,
  Zap,
} from "lucide-react";

/**
 * --- TEMPLATE LOGIN PRO (LOGIKA STREAMLINED) ---
 * Perbaikan: Fokus validasi hanya pada tabel 'profiles'.
 * Jika Profil Approved, user diizinkan masuk Dashboard.
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
      // 1. Cek Email & Password (Auth Supabase)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      if (data.user) {
        // 2. Tarik Data Profil (Satu Sumber Kebenaran)
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, status, is_verified")
          .eq("id", data.user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        const isSuperAdmin = profile?.role === "SUPER_ADMIN";
        const isCorrectRole = profile?.role === role;

        // A. CEK ROLE (Pastikan tidak salah kamar)
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

        // B. CEK STATUS (Logika Disederhanakan)
        if (!isSuperAdmin) {
          // SKENARIO 1: SUKSES
          if (profile?.status === "APPROVED") {
            showToast(`Selamat Datang, ${title}!`, "success");
            // Gunakan replace agar tidak bisa 'Back' ke login
            window.location.replace(dashboardUrl);
            return;
          }

          // SKENARIO 2: MASIH PENDING
          if (profile?.status === "PENDING" || !profile?.status) {
            showToast("Pendaftaran Anda masih dalam peninjauan admin.", "info");
            window.location.replace("/waiting-approval");
            return;
          }

          // SKENARIO 3: DIBEKUKAN/DITOLAK
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

        // C. JIKA SUPER ADMIN (Bypass Langsung)
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
      {/* HEADER */}
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
          to="/portal"
          className="text-[10px] font-black text-slate-400 hover:text-teal-600 flex items-center gap-1 uppercase tracking-widest transition-colors"
        >
          <ChevronLeft size={14} /> Portal Mitra
        </Link>
      </nav>

      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24 p-6 relative overflow-hidden">
        {/* BRANDING SIDE */}
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

        {/* LOGIN CARD */}
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
                  <button
                    type="button"
                    className="text-[9px] font-black text-blue-600 uppercase tracking-tighter hover:underline"
                  >
                    Lupa?
                  </button>
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

// --- LOGIN SUPER ADMIN ---
export const SuperAdminLogin = () => {
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
        showToast("Akses Diterima.", "success");
        window.location.replace("/super-admin");
      } else {
        await supabase.auth.signOut();
        throw new Error("Akses Ditolak! Bukan Super Admin.");
      }
    } catch (err: any) {
      showToast(err.message, "error");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black font-sans flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-purple-900/30 rounded-full blur-[150px] pointer-events-none" />
      <div className="w-full max-w-md relative z-10">
        <div className="bg-black/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-purple-900/50 p-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-900/30 rounded-full border border-purple-500/30 text-purple-400 mb-6 shadow-[0_0_30px_rgba(168,85,247,0.3)] animate-pulse">
              <Globe size={40} />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter mb-2 italic">
              GOD MODE
            </h1>
            <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.3em]">
              Super Admin Only
            </p>
          </div>
          <form onSubmit={handleSuperLogin} className="space-y-6">
            <input
              type="email"
              placeholder="SECURE ID"
              className="w-full px-6 py-4 bg-purple-900/10 border border-purple-900/50 rounded-xl text-white font-bold text-center outline-none focus:border-purple-500"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
            <input
              type="password"
              placeholder="PASSKEY"
              className="w-full px-6 py-4 bg-purple-900/10 border border-purple-900/50 rounded-xl text-white font-bold text-center outline-none focus:border-purple-500 tracking-[0.5em]"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
            <button
              disabled={isLoading}
              className="w-full py-5 bg-purple-700 text-white rounded-xl font-black uppercase text-xs tracking-[0.3em] hover:bg-purple-600 transition-all"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <Zap size={16} className="inline mr-2" /> INITIATE
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

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
