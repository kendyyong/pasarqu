import React from "react";
import {
  TrendingUp,
  Package,
  ShoppingBag,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
} from "lucide-react";

interface Props {
  merchantProfile: any;
  stats: {
    orders: number;
    products: number;
  };
}

export const MerchantOverview: React.FC<Props> = ({
  merchantProfile,
  stats,
}) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-500 text-left">
      {/* 1. STATS CARDS (UTAMA) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <StatCard
          icon={<ShoppingBag size={18} />}
          label="Total Pesanan"
          value={stats.orders}
          color="text-slate-900"
          bgColor="bg-slate-50"
        />
        <StatCard
          icon={<Package size={18} />}
          label="Total Produk"
          value={stats.products}
          color="text-teal-600"
          bgColor="bg-teal-50"
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Performa"
          value="100%"
          color="text-orange-600"
          bgColor="bg-orange-50"
        />
        <StatCard
          icon={<CheckCircle2 size={18} />}
          label="Toko Aktif"
          value={merchantProfile?.is_shop_open ? "YA" : "TIDAK"}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
      </div>

      {/* 2. AREA GRAFIK / AKTIVITAS (SIMULASI) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white border border-slate-200 p-4 rounded-none">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
            <TrendingUp size={14} /> Grafik Penjualan
          </h3>
          <div className="h-48 bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
              Data penjualan akan muncul di sini
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-none">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
            Pesanan Terbaru
          </h3>
          <div className="space-y-3">
            <p className="text-[9px] font-bold text-slate-300 uppercase text-center py-10">
              Belum ada pesanan masuk
            </p>
          </div>
        </div>
      </div>

      {/* 3. TIPS JURAGAN (SEKARANG DI PALING BAWAH) */}
      <div className="bg-slate-900 text-white p-5 rounded-none border-b-4 border-teal-500">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-teal-500 flex items-center justify-center text-white">
            <Lightbulb size={18} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-tight">
              Tips Juragan Pasarqu
            </h3>
            <p className="text-[8px] font-bold text-teal-400 uppercase tracking-widest">
              Tingkatkan Omzet Toko Anda
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <div className="p-3 bg-slate-800 border-l-2 border-teal-500">
            <p className="text-[9px] font-black uppercase text-slate-300 mb-1">
              Foto Produk
            </p>
            <p className="text-[10px] leading-relaxed text-slate-400">
              Gunakan foto produk yang terang dan jelas agar pelanggan lebih
              tertarik berbelanja di lapak Anda.
            </p>
          </div>
          <div className="p-3 bg-slate-800 border-l-2 border-teal-500">
            <p className="text-[9px] font-black uppercase text-slate-300 mb-1">
              Respon Chat
            </p>
            <p className="text-[10px] leading-relaxed text-slate-400">
              Balas chat pelanggan secepat mungkin untuk menjaga kepercayaan dan
              rating toko tetap tinggi.
            </p>
          </div>
        </div>

        <button className="mt-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-teal-400 hover:text-white transition-colors">
          Lihat Panduan Lengkap <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
};

// SUB-KOMPONEN CARD STATS
const StatCard = ({ icon, label, value, color, bgColor }: any) => (
  <div className="bg-white border border-slate-200 p-3 md:p-4 rounded-none flex items-center gap-3 md:gap-4">
    <div
      className={`w-10 h-10 md:w-12 md:h-12 ${bgColor} ${color} flex items-center justify-center shrink-0`}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 md:mb-1">
        {label}
      </p>
      <p
        className={`text-sm md:text-xl font-black leading-none ${color} tracking-tighter`}
      >
        {value}
      </p>
    </div>
  </div>
);
