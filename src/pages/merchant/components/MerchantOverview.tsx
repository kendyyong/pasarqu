import React from "react";
import {
  TrendingUp,
  Package,
  ShoppingBag,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  Clock,
  LayoutDashboard,
  Star,
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
  // Format Tanggal Hari Ini
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-700 text-left font-sans pb-20">
      {/* 1. HEADER RINGKASAN */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard size={14} className="text-[#008080]" />
            <p className="text-[10px] font-bold text-[#008080] uppercase tracking-[0.2em]">
              Ringkasan Toko
            </p>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 leading-none uppercase tracking-tight">
            Halo, {merchantProfile?.shop_name || "Juragan"}!
          </h1>
          <p className="text-[12px] font-medium text-slate-400 mt-2 uppercase tracking-wide">
            {today}
          </p>
        </div>

        <div
          className={`px-4 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-sm ${
            merchantProfile?.is_shop_open
              ? "bg-teal-50 border-teal-100 text-[#008080]"
              : "bg-orange-50 border-orange-100 text-orange-600"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full animate-pulse ${merchantProfile?.is_shop_open ? "bg-[#008080]" : "bg-orange-500"}`}
          ></div>
          Status: {merchantProfile?.is_shop_open ? "Toko Dibuka" : "Toko Tutup"}
        </div>
      </div>

      {/* 2. STATS CARDS (INDUSTRIAL ELEGAN) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<ShoppingBag size={20} />}
          label="Pesanan Baru"
          value={stats.orders}
          color="text-[#008080]"
          bgColor="bg-teal-50"
        />
        <StatCard
          icon={<Package size={20} />}
          label="Total Produk"
          value={stats.products}
          color="text-slate-700"
          bgColor="bg-slate-100"
        />
        <StatCard
          icon={<Star size={20} />}
          label="Rating Lapak"
          value="4.9"
          color="text-orange-600"
          bgColor="bg-orange-50"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Performa"
          value="100%"
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
      </div>

      {/* 3. AREA KONTEN TENGAH */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Grafik Penjualan */}
        <div className="md:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <h3 className="text-[12px] font-bold uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp size={16} className="text-[#008080]" /> Analisa
            Penjualan
          </h3>
          <div className="h-52 bg-slate-50 border-2 border-dashed border-slate-100 rounded-xl flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
              <TrendingUp size={20} className="text-slate-200" />
            </div>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-relaxed max-w-[200px]">
              Data grafik akan terisi otomatis setelah transaksi perdana
            </p>
          </div>
        </div>

        {/* Pesanan Terbaru List */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <h3 className="text-[12px] font-bold uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-2">
            <Clock size={16} className="text-orange-500" /> Histori Cepat
          </h3>
          <div className="flex flex-col items-center justify-center py-10">
            <ShoppingBag size={40} className="text-slate-100 mb-4" />
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest text-center">
              Belum ada pesanan
              <br />
              masuk hari ini
            </p>
          </div>
        </div>
      </div>

      {/* 4. TIPS SECTION (ELEGAN) */}
      <div className="bg-[#008080] p-8 rounded-[2rem] text-white relative overflow-hidden shadow-xl shadow-teal-900/10">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Lightbulb size={120} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
              <Lightbulb size={22} className="text-white" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold uppercase tracking-tight leading-none">
                Tips Juragan Pasarqu
              </h3>
              <p className="text-[10px] font-medium text-teal-100 uppercase tracking-widest mt-1">
                Tingkatkan Omzet Penjualan Anda
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/15 transition-colors">
              <p className="text-[11px] font-bold uppercase text-teal-50 mb-2">
                Kualitas Foto
              </p>
              <p className="text-[12px] leading-relaxed text-teal-100">
                Gunakan foto produk yang terang dan bersih. Produk dengan foto
                asli tanpa filter berlebih lebih dipercaya oleh pembeli.
              </p>
            </div>
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/15 transition-colors">
              <p className="text-[11px] font-bold uppercase text-teal-50 mb-2">
                Respon Chat
              </p>
              <p className="text-[12px] leading-relaxed text-teal-100">
                Respon chat di bawah 10 menit meningkatkan potensi pesanan
                hingga 40%. Ramah adalah kunci utama toko sukses.
              </p>
            </div>
          </div>

          <button className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 hover:text-white transition-all group">
            Buka Panduan Penjual{" "}
            <ArrowRight
              size={14}
              className="group-hover:translate-x-1 transition-transform"
            />
          </button>
        </div>
      </div>
    </div>
  );
};

// SUB-KOMPONEN CARD STATS (REFINED)
const StatCard = ({ icon, label, value, color, bgColor }: any) => (
  <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
    <div
      className={`w-10 h-10 ${bgColor} ${color} rounded-xl flex items-center justify-center shrink-0`}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">
        {label}
      </p>
      <p
        className={`text-xl font-bold leading-tight ${color} tracking-tighter`}
      >
        {value}
      </p>
    </div>
  </div>
);
