import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  Zap,
  Wallet,
  AlertTriangle,
  Truck,
  ShoppingBag,
} from "lucide-react";

import { MobileLayout } from "../../../components/layout/MobileLayout";

export const TermsCashback = () => {
  const navigate = useNavigate();

  return (
    <MobileLayout
      activeTab="account"
      onTabChange={(tab: string) => {
        if (tab === "home") navigate("/");
        if (tab === "orders") navigate("/order-history");
      }}
      onSearch={() => {}}
      onCartClick={() => {}}
      cartCount={0}
    >
      <div className="min-h-screen bg-[#F1F5F9] text-slate-800 tracking-tighter pb-24 text-left not-italic font-black text-[12px]">
        {/* --- TOP BAR --- */}
        <div className="sticky top-0 z-[100] bg-[#008080] shadow-md w-full">
          <div className="max-w-[1200px] mx-auto px-4 py-4 flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="p-1 -ml-1 text-white hover:bg-white/10 rounded-md transition-all active:scale-95 mr-3"
            >
              <ArrowLeft size={22} strokeWidth={2.5} />
            </button>
            <h1 className="text-[12px] font-[1000] uppercase tracking-[0.2em] text-white flex-1">
              Syarat & Ketentuan Cashback
            </h1>
          </div>
        </div>

        <div className="max-w-[800px] mx-auto px-4 pt-4 flex flex-col gap-3">
          {/* BANNER UTAMA */}
          <div className="bg-[#008080] p-6 rounded-md shadow-lg text-white relative overflow-hidden">
            <h2 className="text-[12px] font-[1000] uppercase leading-none mb-2 relative z-10">
              Untung Melimpah Ambil Sendiri
            </h2>
            <p className="text-[12px] font-black opacity-80 uppercase tracking-widest relative z-10">
              Khusus Untuk Transaksi Digital Di Lapak!
            </p>
          </div>

          {/* ISI S&K */}
          <div className="bg-white rounded-md border border-slate-200 p-5 shadow-sm space-y-6">
            <section className="flex gap-4">
              <div className="p-3 bg-orange-50 text-[#FF6600] rounded-md h-fit">
                <ShoppingBag size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-[12px] font-[1000] uppercase text-slate-800">
                  Khusus Ambil Sendiri (Pickup)
                </h3>
                <p className="text-[12px] font-bold text-slate-500 mt-1 uppercase leading-snug">
                  Cashback Misteri Hanya Berlaku Untuk Pesanan Yang Diambil
                  Sendiri Oleh Pembeli Ke Lapak Pedagang. Ini Adalah Apresiasi
                  Kami Untuk Kamu Yang Mau Repot Ke Pasar!
                </p>
              </div>
            </section>

            <section className="flex gap-4 border-l-4 border-red-500 pl-4 bg-red-50/50 py-2 rounded-r-md">
              <div className="p-3 bg-red-100 text-red-600 rounded-md h-fit">
                <Truck size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-[12px] font-[1000] uppercase text-red-600">
                  Layanan Kurir Tidak Berlaku
                </h3>
                <p className="text-[12px] font-bold text-slate-500 mt-1 uppercase leading-snug">
                  Aturan Cashback Ini Tidak Berlaku Untuk Pengiriman Melalui
                  Kurir. Layanan Kurir Adalah Layanan Premium Untuk Kenyamanan
                  Pengantaran Sampai Ke Rumah.
                </p>
              </div>
            </section>

            <section className="flex gap-4">
              <div className="p-3 bg-teal-50 text-[#008080] rounded-md h-fit">
                <ShieldCheck size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-[12px] font-[1000] uppercase text-slate-800">
                  Wajib Pembayaran Online
                </h3>
                <p className="text-[12px] font-bold text-slate-500 mt-1 uppercase leading-snug">
                  Bonus Hanya Bisa Didapatkan Melalui Pembayaran Online
                  (Midtrans). Transaksi Tunai Di Lapak Tidak Akan Mendapatkan
                  Saldo Cashback.
                </p>
              </div>
            </section>

            <section className="flex gap-4">
              <div className="p-3 bg-orange-50 text-[#FF6600] rounded-md h-fit">
                <Zap size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-[12px] font-[1000] uppercase text-slate-800">
                  Hadiah Kejutan (3% - 5%)
                </h3>
                <p className="text-[12px] font-bold text-slate-500 mt-1 uppercase leading-snug">
                  Persentase Cashback Diberikan Secara Acak Antara 3% Hingga 5%.
                  Semakin Sering Kamu Ambil Sendiri, Semakin Besar Peluang Dapat
                  Bonus Maksimal!
                </p>
              </div>
            </section>
          </div>

          <div className="mt-4 p-4 bg-teal-50 border border-teal-100 rounded-md">
            <h4 className="text-[12px] font-[1000] text-[#008080] uppercase flex items-center gap-2">
              <AlertTriangle size={14} /> Catatan Penting
            </h4>
            <p className="text-[12px] font-bold text-slate-500 mt-1 uppercase leading-tight">
              Saldo Cashback Hanya Dapat Digunakan Untuk Belanja Kembali Di
              Aplikasi Pasarqu Dan Tidak Dapat Diuangkan Ke Rekening Bank.
            </p>
          </div>

          <p className="text-[12px] text-center text-slate-300 font-black uppercase tracking-[0.3em] mt-6 pb-10">
            Ditetapkan Oleh Manajemen Pasarqu &copy; 2026
          </p>
        </div>
      </div>
    </MobileLayout>
  );
};
