import React, { useState } from "react"; // Tambahkan useState untuk hitungan klik
import {
  Store,
  Truck,
  ArrowLeft,
  ChevronRight,
  UserPlus,
  Shield,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

export const PortalLoginPage = () => {
  const navigate = useNavigate();

  // --- LOGIKA RAHASIA SUPER ADMIN (GOD MODE) ---
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  const handleSecretClick = () => {
    const currentTime = Date.now();
    // Jika jarak antar klik lebih dari 1 detik, reset hitungan ke 1
    if (currentTime - lastClickTime > 1000) {
      setClickCount(1);
    } else {
      const newCount = clickCount + 1;
      setClickCount(newCount);

      // Jika sudah mencapai 5 klik cepat
      if (newCount === 5) {
        navigate("/login/master");
        setClickCount(0); // Reset hitungan setelah diarahkan
      }
    }
    setLastClickTime(currentTime);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* BACKGROUND DECORATION */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-slate-900/[0.03] rounded-full blur-[120px] pointer-events-none"></div>

      {/* TOP NAVIGATION */}
      <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-center z-20 max-w-7xl mx-auto">
        <Link
          to="/"
          className="flex items-center gap-2 text-slate-400 hover:text-teal-600 transition-all text-[10px] font-black uppercase tracking-[0.2em] group"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Kembali ke Beranda
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-[440px] flex flex-col items-center">
        {/* HERO SECTION */}
        <div className="text-center mb-10">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">
            Ekosistem Digital
          </p>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-slate-900 leading-none">
            <span className="text-orange-500">MITRA</span>{" "}
            <span className="text-teal-500">PASARQU</span>
          </h1>
          <p className="mt-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed max-w-[320px] mx-auto">
            Solusi Terpadu Untuk Pertumbuhan Ekonomi Lokal Kalimantan.
          </p>
        </div>

        {/* MAIN CARDS */}
        <div className="w-full space-y-4">
          <PortalCard
            icon={<Store size={26} />}
            title="Akses Mitra Toko"
            desc="Kelola operasional, stok, dan pesanan"
            theme="teal"
            onClick={() => navigate("/login/toko")}
          />

          <PortalCard
            icon={<Truck size={26} />}
            title="Akses Mitra Kurir"
            desc="Pantau pengiriman dan raih pendapatan"
            theme="orange"
            onClick={() => navigate("/login/kurir")}
          />

          {/* DUAL ACTION: DAFTAR */}
          <div className="mt-8 grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate("/promo/toko")}
              className="flex items-center justify-center gap-2 p-4 bg-white border border-slate-100 rounded-2xl hover:bg-teal-50 hover:border-teal-100 transition-all group"
            >
              <UserPlus size={14} className="text-teal-600" />
              <span className="text-[9px] font-black uppercase text-slate-600 tracking-tighter">
                Daftar Toko
              </span>
            </button>
            <button
              onClick={() => navigate("/promo/kurir")}
              className="flex items-center justify-center gap-2 p-4 bg-white border border-slate-100 rounded-2xl hover:bg-orange-50 hover:border-orange-100 transition-all group"
            >
              <UserPlus size={14} className="text-orange-600" />
              <span className="text-[9px] font-black uppercase text-slate-600 tracking-tighter">
                Daftar Kurir
              </span>
            </button>
          </div>
        </div>

        {/* STATS SECTION */}
        <div className="mt-12 w-full flex justify-between px-4 py-6 bg-slate-50/50 rounded-[2rem] border border-white/50 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-[12px] font-black text-slate-800">500+</div>
            <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest">
              Mitra Toko
            </div>
          </div>
          <div className="w-[1px] bg-slate-200"></div>
          <div className="text-center">
            <div className="text-[12px] font-black text-slate-800">24/7</div>
            <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest">
              Support
            </div>
          </div>
          <div className="w-[1px] bg-slate-200"></div>
          <div className="text-center">
            <div className="text-[12px] font-black text-slate-800">100%</div>
            <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest">
              Lokal Kaltim
            </div>
          </div>
        </div>

        {/* FOOTER INFO & SECRET ACCESS */}
        <div className="mt-10 text-center w-full">
          <div className="flex justify-center items-center gap-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">
            <button
              onClick={() => navigate("/info/bantuan")}
              className="hover:text-teal-600 transition-colors"
            >
              Bantuan
            </button>
            <span className="text-slate-200">•</span>

            <button
              onClick={() => navigate("/login/admin-wilayah")}
              className="flex items-center gap-1.5 hover:text-slate-900 transition-all opacity-40 hover:opacity-100 group"
            >
              <Shield
                size={12}
                className="group-hover:text-teal-600 transition-colors"
              />
              Admin Wilayah
            </button>

            <span className="text-slate-200">•</span>
            <button
              onClick={() => navigate("/info/legal")}
              className="hover:text-teal-600 transition-colors"
            >
              Legalitas
            </button>
          </div>

          {/* TOMBOL RAHASIA SUPER ADMIN (Klik cepat 5x pada v2.0) */}
          <button
            onClick={handleSecretClick}
            className="mt-8 text-[8px] font-bold text-slate-300 uppercase tracking-[0.5em] cursor-default select-none active:scale-95 transition-all"
          >
            PASARQU PORTAL{" "}
            <span className={clickCount > 0 ? "text-teal-500/50" : ""}>
              v2.0
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

const PortalCard = ({ icon, title, desc, onClick, theme }: any) => {
  const isTeal = theme === "teal";
  return (
    <button
      onClick={onClick}
      className={`
        w-full p-6 bg-white border border-slate-100 rounded-[2rem] 
        flex items-center gap-5 transition-all duration-300 
        hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:-translate-y-1 
        active:scale-[0.98] group relative overflow-hidden
      `}
    >
      <div
        className={`absolute -right-4 -top-4 w-20 h-20 blur-3xl rounded-full opacity-0 group-hover:opacity-20 transition-opacity ${isTeal ? "bg-teal-500" : "bg-orange-500"}`}
      ></div>
      <div
        className={`
        w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500
        ${isTeal ? "bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white" : "bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white"}
      `}
      >
        {icon}
      </div>
      <div className="text-left flex-1">
        <h3 className="font-black uppercase text-slate-800 tracking-tight text-sm mb-1 group-hover:text-teal-950 transition-colors">
          {title}
        </h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide leading-tight group-hover:text-slate-500">
          {desc}
        </p>
      </div>
      <div
        className={`
        w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
        bg-slate-50 text-slate-300 group-hover:scale-110 
        ${isTeal ? "group-hover:bg-teal-50 group-hover:text-teal-600" : "group-hover:bg-orange-50 group-hover:text-orange-600"}
      `}
      >
        <ChevronRight size={18} strokeWidth={3} />
      </div>
    </button>
  );
};

export default PortalLoginPage;
