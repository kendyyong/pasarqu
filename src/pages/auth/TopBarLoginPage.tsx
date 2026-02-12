import React from "react";
import { Store, Truck, ArrowLeft, ChevronRight } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { AppLogo } from "../../components/AppLogo";

export const PortalLoginPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* HEADER MOBILE - BERSIH (Hanya Tombol Kembali) */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-20 lg:px-12">
        <Link
          to="/"
          className="flex items-center gap-2 text-slate-400 hover:text-teal-600 transition-colors text-[10px] font-black uppercase tracking-widest"
        >
          <ArrowLeft size={16} /> Kembali ke Beranda
        </Link>

        {/* CATATAN: Icon Orang di sini sudah DIHAPUS 
                   Fungsinya sudah dipindahkan ke Floating Navbar Bawah di Home.tsx
                */}
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        <div className="mb-10 scale-125">
          <AppLogo size="md" regionName="PASARQU" className="text-teal-600" />
        </div>

        <div className="w-full space-y-4">
          <h1 className="text-center text-2xl font-black uppercase tracking-tighter text-slate-800 mb-8">
            Portal <span className="text-teal-600">Mitra</span>
          </h1>

          {/* Pintu Masuk Toko */}
          <PortalCard
            icon={<Store className="text-teal-600" size={28} />}
            title="Login Toko"
            desc="Kelola stok & pesanan masuk"
            color="hover:border-teal-500 group-hover:shadow-teal-100"
            onClick={() => navigate("/login/toko")}
          />

          {/* Pintu Masuk Kurir */}
          <PortalCard
            icon={<Truck className="text-orange-600" size={28} />}
            title="Login Kurir"
            desc="Ambil orderan & cek pendapatan"
            color="hover:border-orange-500 group-hover:shadow-orange-100"
            onClick={() => navigate("/login/kurir")}
          />

          <div className="pt-10 text-center border-t border-slate-200 mt-8 w-full">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-3">
              Belum terdaftar sebagai mitra?
            </p>
            <div className="flex justify-center gap-4 text-[11px] font-bold">
              <button
                onClick={() => navigate("/promo/toko")}
                className="text-teal-600 hover:underline uppercase tracking-tight"
              >
                Daftar Toko
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={() => navigate("/promo/kurir")}
                className="text-orange-600 hover:underline uppercase tracking-tight"
              >
                Daftar Kurir
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PortalCard = ({ icon, title, desc, onClick, color }: any) => (
  <button
    onClick={onClick}
    className={`w-full p-5 bg-white border-2 border-slate-100 rounded-[1.5rem] shadow-sm flex items-center gap-5 transition-all active:scale-95 group ${color} hover:shadow-lg`}
  >
    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-white border border-slate-100 transition-colors shadow-inner">
      {icon}
    </div>
    <div className="text-left flex-1 text-left">
      <h3 className="font-black uppercase text-slate-800 tracking-tight leading-none mb-1.5 text-sm">
        {title}
      </h3>
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide leading-tight">
        {desc}
      </p>
    </div>
    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-all text-slate-300">
      <ChevronRight size={16} />
    </div>
  </button>
);
