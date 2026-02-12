import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Store,
  Bike,
  ShieldCheck,
  ArrowLeft,
  ChevronRight,
  LayoutDashboard,
  BarChart3,
  Users,
  Globe,
  CheckCircle,
} from "lucide-react";

export const PortalLoginPage = () => {
  const navigate = useNavigate();

  const menus = [
    {
      title: "Mitra Toko",
      desc: "Kelola produk & pesanan",
      icon: <Store className="text-teal-600" size={24} />,
      path: "/login?role=MERCHANT",
      color: "bg-teal-50",
    },
    {
      title: "Mitra Kurir",
      desc: "Ambil & antar pesanan",
      icon: <Bike className="text-orange-600" size={24} />,
      path: "/login?role=COURIER",
      color: "bg-orange-50",
    },
    {
      title: "Mitra Zona",
      desc: "Panel kendali wilayah",
      icon: <ShieldCheck className="text-blue-600" size={24} />,
      path: "/login?role=LOCAL_ADMIN",
      color: "bg-blue-50",
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* --- HEADER SIMPEL ALA SHOPEE --- */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              onClick={() => navigate("/")}
              className="cursor-pointer text-2xl font-black text-teal-600 tracking-tighter flex items-center gap-1"
            >
              <span className="bg-teal-600 text-white px-1.5 rounded">P</span>{" "}
              PASARQU
            </div>
            <div className="h-6 w-[1px] bg-slate-200 hidden md:block"></div>
            <div className="text-slate-700 font-bold text-lg hidden md:block">
              Pusat Edukasi Mitra
            </div>
          </div>
          <button
            onClick={() => navigate("/")}
            className="text-teal-600 text-sm font-bold flex items-center gap-1 hover:opacity-70"
          >
            <ArrowLeft size={16} /> Kembali ke Pasar
          </button>
        </div>
      </header>

      {/* --- BODY: SPLIT LAYOUT (Shopee Style) --- */}
      <main className="flex-1 flex flex-col lg:flex-row max-w-[1200px] mx-auto w-full p-6 md:p-12 gap-12">
        {/* SISI KIRI: EDUKASI & FITUR (Lebar) */}
        <div className="flex-1 space-y-10 hidden lg:block">
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-slate-800 leading-tight">
              Tingkatkan Bisnis Pasar Anda <br />
              <span className="text-teal-600">Menuju Digital Era.</span>
            </h1>
            <p className="text-slate-500 text-lg max-w-md leading-relaxed">
              Gabung menjadi mitra Pasarqu dan jangkau ribuan pelanggan di
              wilayah Anda dengan sistem yang mudah & transparan.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 shrink-0 shadow-sm border border-teal-100">
                <BarChart3 size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Analisis Penjualan</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Pantau performa toko Anda setiap hari secara akurat.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 shrink-0 shadow-sm border border-orange-100">
                <Users size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Dukungan Komunitas</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Terhubung dengan ribuan mitra kurir & toko lokal.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0 shadow-sm border border-blue-100">
                <Globe size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Jangkauan Luas</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Produk Anda terlihat oleh seluruh pelanggan wilayah.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 shrink-0 shadow-sm border border-green-100">
                <CheckCircle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Mudah & Aman</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Sistem pembayaran otomatis yang aman & terpercaya.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SISI KANAN: KARTU LOGIN (Pipih & Ramping) */}
        <div className="w-full lg:w-[400px] shrink-0">
          <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200 border border-slate-100 p-8 md:p-10">
            <div className="text-center mb-8">
              <div className="inline-flex p-4 bg-teal-600 rounded-2xl mb-4 text-white shadow-lg shadow-teal-600/30">
                <LayoutDashboard size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                Pilih Akses Masuk
              </h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold mt-2">
                Pusat Kendali Mitra
              </p>
            </div>

            {/* List Pilihan Role */}
            <div className="space-y-3">
              {menus.map((menu, index) => (
                <div
                  key={index}
                  onClick={() => navigate(menu.path)}
                  className="group flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-transparent hover:bg-white hover:border-teal-200 hover:shadow-xl transition-all cursor-pointer"
                >
                  <div
                    className={`${menu.color} p-2.5 rounded-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    {menu.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-700 text-sm">
                      {menu.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {menu.desc}
                    </p>
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-slate-300 group-hover:text-teal-600 transition-colors"
                  />
                </div>
              ))}
            </div>

            <div className="mt-10 pt-6 border-t border-slate-100">
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                <p className="text-[11px] font-bold text-orange-700">
                  Punya kendala saat masuk?
                </p>
                <p className="text-[10px] text-orange-600/80 mt-1 leading-relaxed">
                  Hubungi Pusat Bantuan Mitra kami di WhatsApp (08:00 - 17:00
                  WIB)
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* --- FOOTER SIMPEL --- */}
      <footer className="py-8 bg-slate-50 border-t border-slate-100">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            © 2026 PASARQU INDONESIA • DIGITALIZING TRADITIONAL MARKET
          </p>
          <div className="flex gap-6 text-[10px] font-black text-teal-600 uppercase tracking-widest">
            <a href="#" className="hover:underline">
              Syarat & Ketentuan
            </a>
            <a href="#" className="hover:underline">
              Kebijakan Privasi
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
