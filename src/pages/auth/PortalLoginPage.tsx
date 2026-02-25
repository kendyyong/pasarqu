import React, { useState } from "react";
import {
  Store,
  Truck,
  ArrowLeft,
  ChevronRight,
  UserPlus,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const PortalLoginPage = () => {
  const navigate = useNavigate();

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
      <div className="absolute top-0 left-0 w-full p-4 z-20">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20 rounded-full text-white/80 hover:text-white hover:bg-white/20 backdrop-blur-md transition-all text-[10px] font-black uppercase tracking-[0.2em] group active:scale-95"
        >
          <ArrowLeft
            size={14}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span>KEMBALI</span>
        </button>
      </div>

      {/* --- KONTEN UTAMA --- */}
      <div className="relative z-10 w-full max-w-[460px] h-full flex flex-col justify-start pt-16 pb-6 animate-in slide-in-from-bottom-8 duration-700 overflow-y-auto no-scrollbar">
        {/* BLOK 1: ATAS (LOGO & VISI) */}
        <div className="flex flex-col items-center flex-shrink-0 w-full mb-6 mt-4">
          <div
            onClick={handleSecretClick}
            className="mb-4 select-none outline-none cursor-default"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <img
              src="/logo-text.png"
              alt="PasarQu Logo"
              className="h-14 md:h-20 w-auto object-contain"
              style={{
                filter:
                  "drop-shadow(1.5px 1.5px 0px white) drop-shadow(-1.5px -1.5px 0px white) drop-shadow(1.5px -1.5px 0px white) drop-shadow(-1.5px 1.5px 0px white)",
              }}
            />
          </div>

          <div className="w-full">
            <div className="flex justify-center w-full">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-3 backdrop-blur-md">
                <Zap size={10} className="text-[#FF6600]" fill="currentColor" />
                <span className="text-[8px] md:text-[9px] font-black text-white/80 uppercase tracking-[0.3em]">
                  EKOSISTEM DIGITAL
                </span>
              </div>
            </div>
            <p className="w-full text-teal-100/80 text-[10px] md:text-[11px] font-black uppercase tracking-[0.1em] md:tracking-widest leading-relaxed border-l-2 border-[#FF6600] pl-3 text-justify">
              SATU PORTAL TERPADU UNTUK MENGELOLA OPERASIONAL TOKO DAN AKTIVITAS
              PENGIRIMAN PASARQU.
            </p>
          </div>
        </div>

        {/* BLOK 2: TENGAH (KARTU AKSES SATU PINTU) */}
        <div className="w-full flex flex-col gap-3 md:gap-4 mb-4">
          {/* 🚀 KARTU LOGIN UTAMA (Teks diubah untuk menyembunyikan akses admin) */}
          <button
            onClick={() => navigate("/login")}
            className="w-full p-5 md:p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col items-center gap-4 transition-all duration-300 active:scale-[0.98] group relative overflow-hidden hover:-translate-y-1 shadow-xl hover:shadow-teal-900/50 hover:border-[#008080]/50"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#008080] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#008080]/20 text-[#008080] border border-[#008080]/30 group-hover:bg-[#008080] group-hover:text-white transition-all duration-300 shadow-sm">
                <Store size={22} />
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#FF6600]/20 text-[#FF6600] border border-[#FF6600]/30 group-hover:bg-[#FF6600] group-hover:text-white transition-all duration-300 shadow-sm">
                <Truck size={22} />
              </div>
            </div>

            <div className="text-center w-full">
              <h3 className="font-[1000] uppercase text-white tracking-tighter text-[16px] md:text-[18px] mb-1">
                MASUK SEBAGAI MITRA
              </h3>
              <p className="text-[9px] md:text-[10px] text-teal-100/60 font-black uppercase tracking-widest leading-relaxed">
                Login khusus untuk Toko dan Kurir PasarQu
              </p>
            </div>

            <div className="w-full mt-2 py-3 bg-[#008080] rounded-xl flex items-center justify-center gap-2 group-hover:bg-teal-500 transition-colors">
              <span className="text-[10px] font-black uppercase text-white tracking-[0.2em]">
                LOGIN SEKARANG
              </span>
              <ChevronRight size={14} className="text-white" strokeWidth={3} />
            </div>
          </button>

          {/* TOMBOL DAFTAR */}
          <div className="grid grid-cols-2 gap-3 mt-1">
            <button
              onClick={() => navigate("/promo/toko")}
              className="flex items-center justify-center gap-2 p-3.5 bg-white/5 backdrop-blur-md rounded-xl hover:bg-[#008080]/20 transition-all shadow-lg active:scale-95 border border-white/10 group"
            >
              <UserPlus
                size={14}
                className="text-white/70 group-hover:text-white transition-colors"
              />
              <span className="text-[9px] md:text-[10px] font-black uppercase text-white/70 group-hover:text-white tracking-widest transition-colors">
                DAFTAR TOKO
              </span>
            </button>

            <button
              onClick={() => navigate("/promo/kurir")}
              className="flex items-center justify-center gap-2 p-3.5 bg-white/5 backdrop-blur-md rounded-xl hover:bg-[#FF6600]/20 transition-all shadow-lg active:scale-95 border border-white/10 group"
            >
              <UserPlus
                size={14}
                className="text-white/70 group-hover:text-white transition-colors"
              />
              <span className="text-[9px] md:text-[10px] font-black uppercase text-white/70 group-hover:text-white tracking-widest transition-colors">
                DAFTAR KURIR
              </span>
            </button>
          </div>
        </div>

        {/* BLOK 3: BAWAH (STATISTIK & FOOTER) */}
        <div className="flex flex-col w-full mt-2">
          <div className="w-full flex justify-between px-4 py-3.5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl mb-5">
            <div className="text-center flex-1">
              <div className="text-[14px] md:text-[18px] font-[1000] text-white tracking-tighter">
                500+
              </div>
              <div className="text-[7px] font-black text-[#FF6600] uppercase tracking-[0.2em]">
                MITRA TOKO
              </div>
            </div>
            <div className="w-[1px] bg-white/10"></div>
            <div className="text-center flex-1">
              <div className="text-[14px] md:text-[18px] font-[1000] text-white tracking-tighter">
                24/7
              </div>
              <div className="text-[7px] font-black text-[#008080] uppercase tracking-[0.2em]">
                SUPPORT
              </div>
            </div>
            <div className="w-[1px] bg-white/10"></div>
            <div className="text-center flex-1">
              <div className="text-[14px] md:text-[18px] font-[1000] text-white tracking-tighter">
                100%
              </div>
              <div className="text-[7px] font-black text-teal-100/60 uppercase tracking-[0.2em]">
                UMKM LOKAL
              </div>
            </div>
          </div>

          <div className="flex justify-center items-center gap-4 text-[8px] font-black text-teal-100/40 uppercase tracking-[0.2em] mb-4">
            <button
              onClick={() => navigate("/info/bantuan")}
              className="hover:text-white transition-colors"
            >
              BANTUAN PUSAT
            </button>
            <span className="text-white/10">•</span>
            <button
              onClick={() => navigate("/info/legal")}
              className="hover:text-white transition-colors"
            >
              LEGALITAS PASARQU
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalLoginPage;
