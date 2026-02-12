import React from "react";
import {
  ShoppingBag,
  Box,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

interface Props {
  merchantProfile: any;
}

export const MerchantOverview: React.FC<Props> = ({ merchantProfile }) => {
  // Data dummy untuk statistik (Nanti bisa dihubungkan ke database)
  const stats = [
    {
      label: "Pesanan Baru",
      value: "0",
      desc: "Perlu diproses",
      icon: <ShoppingBag size={24} />,
      color: "bg-orange-50 text-orange-600",
    },
    {
      label: "Produk Aktif",
      value: "0",
      desc: "Tampil di pasar",
      icon: <Box size={24} />,
      color: "bg-teal-50 text-teal-600",
    },
    {
      label: "Total Saldo",
      value: "Rp 0",
      desc: "Siap dicairkan",
      icon: <Wallet size={24} />,
      color: "bg-blue-50 text-blue-600",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      {/* GREETING SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
            Ringkasan Penjualan
          </h2>
          <p className="text-sm text-slate-400 font-medium">
            Pantau statistik toko {merchantProfile?.shop_name} hari ini.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
            Sistem Online
          </span>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((item, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            <div className="flex items-start justify-between relative z-10">
              <div
                className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center shadow-sm`}
              >
                {item.icon}
              </div>
              <ArrowUpRight
                size={20}
                className="text-slate-200 group-hover:text-teal-500 transition-colors"
              />
            </div>
            <div className="mt-5 relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                {item.label}
              </p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tighter">
                {item.value}
              </h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase mt-2 tracking-tighter">
                {item.desc}
              </p>
            </div>
            {/* Dekorasi Background */}
            <div className="absolute bottom-[-20px] right-[-20px] opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
              {React.cloneElement(item.icon, { size: 100 })}
            </div>
          </div>
        ))}
      </div>

      {/* BANNER EDUKASI / TIPS */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-200">
        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 text-teal-400 rounded-full mb-4">
            <TrendingUp size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Tips Juragan
            </span>
          </div>
          <h3 className="text-xl font-bold mb-4 italic leading-tight">
            "Produk dengan foto yang terang dan judul yang jelas terbukti 2x
            lebih cepat laku di Pasarqu!"
          </h3>
          <div className="flex flex-wrap gap-3">
            <div className="px-4 py-1.5 bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-white/5">
              Foto Cerah
            </div>
            <div className="px-4 py-1.5 bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-white/5">
              Fast Respon
            </div>
            <div className="px-4 py-1.5 bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-white/5">
              Update Stok
            </div>
          </div>
        </div>
        <TrendingUp className="absolute right-[-30px] bottom-[-30px] text-white/5 w-64 h-64 rotate-[-10deg]" />
      </div>

      {/* RECENT ACTIVITY / TASKS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden text-left">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
              Daftar Tugas
            </h4>
            <AlertCircle size={16} className="text-slate-300" />
          </div>
          <div className="divide-y divide-slate-50">
            <TaskLink title="Lengkapi Foto Produk" label="Meningkatkan Minat" />
            <TaskLink title="Update Lokasi Toko" label="Perhitungan Ongkir" />
            <TaskLink title="Lihat Laporan Penjualan" label="Pantau Cuan" />
          </div>
        </div>

        <div className="bg-teal-50/30 rounded-[2rem] border border-teal-100/50 p-8 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-md mb-4 text-teal-600">
            <TrendingUp size={32} />
          </div>
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-2">
            Ingin Omzet Naik?
          </h4>
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-[200px] mb-6">
            Mulai tambahkan produk-produk unggulan pasar Anda ke etalase digital
            sekarang.
          </p>
          <button className="px-6 py-3 bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all">
            Edukasi Seller
          </button>
        </div>
      </div>
    </div>
  );
};

// SUB-COMPONENTS
const TaskLink = ({ title, label }: { title: string; label: string }) => (
  <div className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group">
    <div className="flex flex-col">
      <span className="text-xs font-bold text-slate-700 group-hover:text-teal-600 transition-colors">
        {title}
      </span>
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
        {label}
      </span>
    </div>
    <ChevronRight
      size={14}
      className="text-slate-300 group-hover:translate-x-1 transition-transform"
    />
  </div>
);
