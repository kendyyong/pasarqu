import React from "react";
import {
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  Filter,
} from "lucide-react";

interface Props {
  merchants: any[];
  couriers: any[];
}

export const LocalFinanceTab: React.FC<Props> = ({ merchants, couriers }) => {
  // Data dummy untuk visualisasi (nanti bisa dihubungkan ke tabel orders)
  const stats = [
    {
      label: "Omzet Wilayah",
      value: "Rp 12.450.000",
      change: "+12%",
      up: true,
    },
    {
      label: "Bagi Hasil Admin",
      value: "Rp 1.245.000",
      change: "+5%",
      up: true,
    },
    { label: "Total Transaksi", value: "450", change: "-2%", up: false },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left">
      {/* 1. HEADER ANALITIK */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
            Laporan Ekonomi Wilayah
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Data diperbarui setiap 15 menit
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all">
            <Filter size={14} /> Filter Tanggal
          </button>
          <button className="px-4 py-2.5 bg-teal-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group"
          >
            <div
              className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-3xl opacity-10 ${s.up ? "bg-teal-500" : "bg-red-500"}`}
            ></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              {s.label}
            </p>
            <div className="flex items-end gap-3">
              <h4 className="text-2xl font-black text-slate-900 tracking-tighter">
                {s.value}
              </h4>
              <div
                className={`flex items-center gap-0.5 text-[10px] font-bold mb-1 ${s.up ? "text-teal-600" : "text-red-500"}`}
              >
                {s.up ? (
                  <ArrowUpRight size={12} />
                ) : (
                  <ArrowDownRight size={12} />
                )}
                {s.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. CHART & TOP PERFORMER AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TOP MERCHANTS */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={16} className="text-teal-600" /> Toko Terlaris
              (Minggu Ini)
            </h5>
          </div>
          <div className="space-y-6">
            {merchants.slice(0, 4).map((m, i) => (
              <div
                key={i}
                className="flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center font-black text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">
                      {m.shop_name || m.full_name}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      {m.address?.substring(0, 20)}...
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-slate-800 tracking-tighter">
                    Rp {(Math.random() * 2000000).toLocaleString()}
                  </p>
                  <p className="text-[9px] font-bold text-teal-600 uppercase">
                    Verified
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TOP COURIERS */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Wallet size={16} className="text-orange-600" /> Driver
              Berdedikasi
            </h5>
          </div>
          <div className="space-y-6">
            {couriers.slice(0, 4).map((c, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center overflow-hidden border border-orange-100 font-black text-orange-600 text-xs">
                    {c.full_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">
                      {c.full_name}
                    </p>
                    <div className="flex gap-1 mt-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <div
                          key={s}
                          className="w-1.5 h-1.5 rounded-full bg-orange-400"
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-slate-800 tracking-tighter">
                    {Math.floor(Math.random() * 50)} Trip
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Active Now
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. FOOTER NOTE */}
      <div className="p-6 bg-slate-900 rounded-[2rem] text-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
            <Calendar className="text-teal-400" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em]">
              Target Mingguan Wilayah
            </p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">
              Tersisa 3 hari lagi untuk mencapai target Rp 20.000.000
            </p>
          </div>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-2xl font-black text-teal-400 tracking-tighter">
            65%
          </p>
          <div className="w-32 h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-teal-400 w-[65%]"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
