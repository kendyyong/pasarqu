import React, { useState } from "react";
import {
  Store,
  Truck,
  ArrowLeft,
  ChevronRight,
  UserPlus,
  Shield,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const PortalLoginPage = () => {
  const navigate = useNavigate();

  // --- LOGIKA RAHASIA SUPER ADMIN (TETAP AMAN) ---
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

  return (
    // BACKGROUND: Deep Tosca Galactic
    <div className="h-[100dvh] w-screen bg-gradient-to-br from-[#004d4d] via-[#003333] to-[#002222] flex flex-col items-center px-5 font-sans relative overflow-hidden text-left transition-colors duration-700">
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
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white/80 hover:text-white hover:bg-white/20 backdrop-blur-md transition-all text-[10px] font-black uppercase tracking-[0.2em] group active:scale-95"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="hidden sm:inline">KEMBALI</span>
        </button>
      </div>

      {/* --- KONTEN UTAMA --- */}
      <div className="relative z-10 w-full max-w-[460px] h-full flex flex-col justify-between pt-24 pb-10 animate-in slide-in-from-bottom-8 duration-700">
        {/* BLOK 1: ATAS (LOGO & VISI) */}
        <div className="flex flex-col items-center flex-shrink-0 w-full">
          {/* LOGO PASARQU (RAKSASA) */}
          <div
            onClick={handleSecretClick}
            className="mb-6 select-none outline-none cursor-default"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <img
              src="/logo-text.png"
              alt="PasarQu Logo"
              className="h-16 md:h-24 w-auto object-contain"
              style={{
                filter:
                  "drop-shadow(1.5px 1.5px 0px white) drop-shadow(-1.5px -1.5px 0px white) drop-shadow(1.5px -1.5px 0px white) drop-shadow(-1.5px 1.5px 0px white)",
              }}
            />
          </div>

          <div className="w-full">
            <div className="flex justify-center w-full">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4 backdrop-blur-md">
                <Zap size={12} className="text-[#FF6600]" fill="currentColor" />
                <span className="text-[9px] md:text-[10px] font-black text-white/80 uppercase tracking-[0.3em]">
                  EKOSISTEM DIGITAL
                </span>
              </div>
            </div>

            {/* ✅ REVISI: Teks dilebarkan sesuai garis luar kolom (Full Width) & Rata Kanan Kiri */}
            <p className="w-full text-teal-100/80 text-[10px] md:text-[12px] font-black uppercase tracking-[0.1em] md:tracking-widest leading-relaxed border-l-2 border-[#FF6600] pl-3 text-justify">
              SOLUSI TERPADU UNTUK MEMAJUKAN PERTUMBUHAN EKONOMI LOKAL DAN UMKM.
            </p>
          </div>
        </div>

        {/* BLOK 2: TENGAH (KARTU AKSES) */}
        <div className="w-full flex-1 flex flex-col justify-center gap-4 md:gap-5">
          <PortalCard
            icon={<Store className="w-6 h-6" />}
            title="AKSES MITRA TOKO"
            desc="KELOLA OPERASIONAL, STOK, DAN PESANAN"
            theme="teal"
            onClick={() => navigate("/login/toko")}
          />

          <PortalCard
            icon={<Truck className="w-6 h-6" />}
            title="AKSES MITRA KURIR"
            desc="PANTAU PENGIRIMAN DAN RAIH PENDAPATAN"
            theme="orange"
            onClick={() => navigate("/login/kurir")}
          />

          <div className="mt-2 grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate("/merchant-promo")}
              className="flex items-center justify-center gap-2 p-4 bg-[#008080] rounded-[1.2rem] md:rounded-2xl hover:bg-teal-600 transition-all group shadow-[0_0_20px_-5px_rgba(0,128,128,0.5)] active:scale-95 border border-teal-500/50"
            >
              <UserPlus size={14} className="text-white" />
              <span className="text-[10px] md:text-[11px] font-black uppercase text-white tracking-widest">
                DAFTAR TOKO
              </span>
            </button>

            <button
              onClick={() => navigate("/promo/kurir")}
              className="flex items-center justify-center gap-2 p-4 bg-[#FF6600] rounded-[1.2rem] md:rounded-2xl hover:bg-orange-500 transition-all group shadow-[0_0_20px_-5px_rgba(255,102,0,0.5)] active:scale-95 border border-orange-500/50"
            >
              <UserPlus size={14} className="text-white" />
              <span className="text-[10px] md:text-[11px] font-black uppercase text-white tracking-widest">
                DAFTAR KURIR
              </span>
            </button>
          </div>
        </div>

        {/* BLOK 3: BAWAH (STATISTIK) */}
        <div className="flex flex-col flex-shrink-0 w-full mt-4">
          <div className="w-full flex justify-between px-4 py-4 md:py-5 bg-white/5 rounded-[1.5rem] md:rounded-[2rem] border border-white/10 backdrop-blur-md shadow-2xl mb-6">
            <div className="text-center flex-1">
              <div className="text-[16px] md:text-[20px] font-[1000] text-white tracking-tighter">
                500+
              </div>
              <div className="text-[8px] font-black text-[#FF6600] uppercase tracking-[0.2em] mt-0.5">
                MITRA TOKO
              </div>
            </div>
            <div className="w-[1px] bg-white/10"></div>
            <div className="text-center flex-1">
              <div className="text-[16px] md:text-[20px] font-[1000] text-white tracking-tighter">
                24/7
              </div>
              <div className="text-[8px] font-black text-[#008080] uppercase tracking-[0.2em] mt-0.5">
                SUPPORT
              </div>
            </div>
            <div className="w-[1px] bg-white/10"></div>
            <div className="text-center flex-1">
              <div className="text-[16px] md:text-[20px] font-[1000] text-white tracking-tighter">
                100%
              </div>
              <div className="text-[8px] font-black text-teal-100/60 uppercase tracking-[0.2em] mt-0.5">
                UMKM LOKAL
              </div>
            </div>
          </div>

          <div className="flex justify-center items-center gap-4 text-[9px] font-black text-teal-100/60 uppercase tracking-[0.2em]">
            <button
              onClick={() => navigate("/info/bantuan")}
              className="hover:text-white transition-colors"
            >
              BANTUAN
            </button>
            <span className="text-white/20">•</span>
            <button
              onClick={() => navigate("/login/admin-wilayah")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 hover:border-[#008080]/50 hover:bg-[#008080]/20 hover:text-white transition-all group backdrop-blur-sm"
            >
              <Shield
                size={10}
                className="text-teal-100/60 group-hover:text-[#008080] transition-colors"
              />
              ADMIN WILAYAH
            </button>
            <span className="text-white/20">•</span>
            <button
              onClick={() => navigate("/info/legal")}
              className="hover:text-white transition-colors"
            >
              LEGALITAS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- KOMPONEN KARTU PORTAL ---
const PortalCard = ({ icon, title, desc, onClick, theme }: any) => {
  const isTeal = theme === "teal";
  const colorAccent = isTeal ? "text-[#008080]" : "text-[#FF6600]";
  const bgIcon = isTeal ? "bg-[#008080]/10" : "bg-[#FF6600]/10";
  const bgHover = isTeal
    ? "group-hover:bg-[#008080]"
    : "group-hover:bg-[#FF6600]";
  const borderCardHover = isTeal
    ? "group-hover:border-[#008080]/50"
    : "group-hover:border-[#FF6600]/50";

  return (
    <button
      onClick={onClick}
      className={`w-full p-5 md:p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-[1.5rem] md:rounded-[2rem] flex items-center gap-4 transition-all duration-300 active:scale-[0.98] group relative overflow-hidden ${borderCardHover} hover:-translate-y-1 shadow-lg`}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${isTeal ? "bg-[#008080]" : "bg-[#FF6600]"} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      ></div>
      <div
        className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-300 border ${colorAccent} ${bgIcon} ${bgHover} group-hover:text-white group-hover:scale-110 shadow-sm group-hover:border-transparent`}
      >
        {icon}
      </div>
      <div className="text-left flex-1">
        <h3 className="font-[1000] uppercase text-white tracking-tighter text-[13px] md:text-[15px] mb-0.5 group-hover:translate-x-1 transition-transform duration-300">
          {title}
        </h3>
        <p className="text-[9px] md:text-[10px] text-teal-100/70 font-black uppercase tracking-widest leading-relaxed">
          {desc}
        </p>
      </div>
      <div
        className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center bg-white/5 border border-white/10 text-white/50 transition-all duration-300 group-hover:scale-110 ${isTeal ? "group-hover:bg-[#008080]/20 group-hover:text-[#008080] group-hover:border-[#008080]/50" : "group-hover:bg-[#FF6600]/20 group-hover:text-[#FF6600] group-hover:border-[#FF6600]/50"}`}
      >
        <ChevronRight size={18} strokeWidth={4} />
      </div>
    </button>
  );
};

export default PortalLoginPage;
